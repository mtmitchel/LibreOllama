//! Database operations for bidirectional linking system (v4)
//!
//! This module provides CRUD operations for managing bidirectional links,
//! content indexing, and link analytics.

use anyhow::{Context, Result};
use rusqlite::{params, Row};
use serde_json;

use crate::database::connection::get_connection;

/// Link relationship model for database operations
#[derive(Debug, Clone)]
pub struct LinkRelationship {
    pub id: String,
    pub source_id: String,
    pub source_type: String,
    pub target_id: String,
    pub target_type: String,
    pub link_text: String,
    pub context_snippet: String,
    pub created_at: String,
    pub updated_at: String,
    pub user_id: String,
}

/// Content index model for fast link resolution
#[derive(Debug, Clone)]
pub struct ContentIndex {
    pub id: String,
    pub content_id: String,
    pub content_type: String,
    pub title: String,
    pub content_text: String,
    pub tags: Vec<String>,
    pub links: Vec<String>,
    pub last_indexed: String,
    pub user_id: String,
}

/// Link suggestion model for auto-completion
#[derive(Debug, Clone)]
pub struct LinkSuggestion {
    pub id: String,
    pub partial_text: String,
    pub target_id: String,
    pub target_type: String,
    pub target_title: String,
    pub relevance_score: f64,
    pub created_at: String,
    pub user_id: String,
}

/// Backlink reference for display
#[derive(Debug, Clone)]
pub struct BacklinkReference {
    pub id: String,
    pub source_id: String,
    pub source_type: String,
    pub source_title: String,
    pub link_text: String,
    pub context_snippet: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Create a new link relationship
pub async fn create_link_relationship(relationship: &LinkRelationship) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT INTO link_relationships (
            id, source_id, source_type, target_id, target_type,
            link_text, context_snippet, created_at, updated_at, user_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            relationship.id,
            relationship.source_id,
            relationship.source_type,
            relationship.target_id,
            relationship.target_type,
            relationship.link_text,
            relationship.context_snippet,
            relationship.created_at,
            relationship.updated_at,
            relationship.user_id
        ],
    ).context("Failed to create link relationship")?;

    Ok(())
}

/// Get all link relationships for a source
pub async fn get_outgoing_links(source_id: &str, source_type: &str, user_id: &str) -> Result<Vec<LinkRelationship>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, source_id, source_type, target_id, target_type,
                link_text, context_snippet, created_at, updated_at, user_id
         FROM link_relationships 
         WHERE source_id = ?1 AND source_type = ?2 AND user_id = ?3
         ORDER BY updated_at DESC"
    )?;

    let relationships = stmt.query_map(
        params![source_id, source_type, user_id],
        map_link_relationship_row
    )?
    .collect::<Result<Vec<_>, _>>()?;

    Ok(relationships)
}

/// Get all backlinks for a target
pub async fn get_backlinks(target_id: &str, target_type: &str, user_id: &str) -> Result<Vec<BacklinkReference>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT lr.id, lr.source_id, lr.source_type, ci.title as source_title,
                lr.link_text, lr.context_snippet, lr.created_at, lr.updated_at
         FROM link_relationships lr
         LEFT JOIN content_index ci ON lr.source_id = ci.content_id 
             AND lr.source_type = ci.content_type AND ci.user_id = lr.user_id
         WHERE lr.target_id = ?1 AND lr.target_type = ?2 AND lr.user_id = ?3
         ORDER BY lr.updated_at DESC"
    )?;

    let backlinks = stmt.query_map(
        params![target_id, target_type, user_id],
        |row| {
            Ok(BacklinkReference {
                id: row.get(0)?,
                source_id: row.get(1)?,
                source_type: row.get(2)?,
                source_title: row.get::<_, Option<String>>(3)?.unwrap_or_else(|| "Unknown".to_string()),
                link_text: row.get(4)?,
                context_snippet: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        }
    )?
    .collect::<Result<Vec<_>, _>>()?;

    Ok(backlinks)
}

/// Update a link relationship
pub async fn update_link_relationship(relationship: &LinkRelationship) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "UPDATE link_relationships SET
            link_text = ?1, context_snippet = ?2, updated_at = ?3
         WHERE id = ?4 AND user_id = ?5",
        params![
            relationship.link_text,
            relationship.context_snippet,
            relationship.updated_at,
            relationship.id,
            relationship.user_id
        ],
    ).context("Failed to update link relationship")?;

    Ok(())
}

/// Delete a link relationship
pub async fn delete_link_relationship(id: &str, user_id: &str) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM link_relationships WHERE id = ?1 AND user_id = ?2",
        params![id, user_id],
    ).context("Failed to delete link relationship")?;

    Ok(())
}

/// Create or update content index
pub async fn upsert_content_index(content: &ContentIndex) -> Result<()> {
    let conn = get_connection()?;
    
    let tags_json = serde_json::to_string(&content.tags)?;
    let links_json = serde_json::to_string(&content.links)?;
    
    conn.execute(
        "INSERT OR REPLACE INTO content_index (
            id, content_id, content_type, title, content_text,
            tags, links, last_indexed, user_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            content.id,
            content.content_id,
            content.content_type,
            content.title,
            content.content_text,
            tags_json,
            links_json,
            content.last_indexed,
            content.user_id
        ],
    ).context("Failed to upsert content index")?;

    Ok(())
}

/// Get content index by content ID
pub async fn get_content_index(content_id: &str, content_type: &str, user_id: &str) -> Result<Option<ContentIndex>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, content_id, content_type, title, content_text,
                tags, links, last_indexed, user_id
         FROM content_index 
         WHERE content_id = ?1 AND content_type = ?2 AND user_id = ?3"
    )?;

    let result = stmt.query_row(
        params![content_id, content_type, user_id],
        map_content_index_row
    );

    match result {
        Ok(content) => Ok(Some(content)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

/// Search content using full-text search
pub async fn search_content(query: &str, user_id: &str, limit: i32) -> Result<Vec<ContentIndex>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT ci.id, ci.content_id, ci.content_type, ci.title, ci.content_text,
                ci.tags, ci.links, ci.last_indexed, ci.user_id
         FROM content_index ci
         JOIN content_fts fts ON ci.rowid = fts.rowid
         WHERE fts MATCH ?1 AND ci.user_id = ?2
         ORDER BY rank
         LIMIT ?3"
    )?;

    let results = stmt.query_map(
        params![query, user_id, limit],
        map_content_index_row
    )?
    .collect::<Result<Vec<_>, _>>()?;

    Ok(results)
}

/// Get link suggestions for auto-completion
pub async fn get_link_suggestions(partial_text: &str, user_id: &str, limit: i32) -> Result<Vec<LinkSuggestion>> {
    // First try cached suggestions
    let cached_suggestions = get_cached_suggestions(partial_text, user_id, limit)?;
    if !cached_suggestions.is_empty() {
        return Ok(cached_suggestions);
    }

    // If no cached suggestions, search content index and create new suggestions
    let content_matches = search_content_for_suggestions(partial_text, user_id, limit)?;
    
    // Convert to suggestions (all database operations completed before async calls)
    let mut suggestions = Vec::new();
    for (content_id, content_type, title) in content_matches {
        let suggestion = LinkSuggestion {
            id: format!("suggestion_{}_{}", content_id, chrono::Utc::now().timestamp_millis()),
            partial_text: partial_text.to_string(),
            target_id: content_id,
            target_type: content_type,
            target_title: title.clone(),
            relevance_score: calculate_relevance_score(partial_text, &title),
            created_at: chrono::Utc::now().to_rfc3339(),
            user_id: user_id.to_string(),
        };
        suggestions.push(suggestion);
    }

    // Cache all suggestions after database operations are complete
    for suggestion in &suggestions {
        cache_link_suggestion_sync(suggestion)?;
    }

    Ok(suggestions)
}

/// Get cached suggestions (synchronous database operation)
fn get_cached_suggestions(partial_text: &str, user_id: &str, limit: i32) -> Result<Vec<LinkSuggestion>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, partial_text, target_id, target_type, target_title,
                relevance_score, created_at, user_id
         FROM link_suggestions
         WHERE partial_text LIKE ?1 AND user_id = ?2
         ORDER BY relevance_score DESC
         LIMIT ?3"
    )?;

    let cached_suggestions = stmt.query_map(
        params![format!("{}%", partial_text), user_id, limit],
        map_link_suggestion_row
    )?
    .collect::<Result<Vec<_>, _>>()?;

    Ok(cached_suggestions)
}

/// Search content index for suggestions (synchronous database operation)
fn search_content_for_suggestions(partial_text: &str, user_id: &str, limit: i32) -> Result<Vec<(String, String, String)>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT content_id, content_type, title
         FROM content_index
         WHERE title LIKE ?1 AND user_id = ?2
         ORDER BY title
         LIMIT ?3"
    )?;

    let content_matches = stmt.query_map(
        params![format!("%{}%", partial_text), user_id, limit],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        }
    )?
    .collect::<Result<Vec<_>, _>>()?;

    Ok(content_matches)
}

/// Cache a link suggestion (async version for external use)
pub async fn cache_link_suggestion(suggestion: &LinkSuggestion) -> Result<()> {
    cache_link_suggestion_sync(suggestion)
}

/// Cache a link suggestion (synchronous version for thread safety)
fn cache_link_suggestion_sync(suggestion: &LinkSuggestion) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "INSERT OR REPLACE INTO link_suggestions (
            id, partial_text, target_id, target_type, target_title,
            relevance_score, created_at, user_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            suggestion.id,
            suggestion.partial_text,
            suggestion.target_id,
            suggestion.target_type,
            suggestion.target_title,
            suggestion.relevance_score,
            suggestion.created_at,
            suggestion.user_id
        ],
    ).context("Failed to cache link suggestion")?;

    Ok(())
}

/// Calculate relevance score for a suggestion
fn calculate_relevance_score(partial_text: &str, title: &str) -> f64 {
    let partial_lower = partial_text.to_lowercase();
    let title_lower = title.to_lowercase();
    
    // Exact match gets highest score
    if title_lower == partial_lower {
        return 100.0;
    }
    
    // Starts with gets high score
    if title_lower.starts_with(&partial_lower) {
        return 90.0 - (title.len() as f64 - partial_text.len() as f64) * 0.1;
    }
    
    // Contains gets medium score
    if title_lower.contains(&partial_lower) {
        return 50.0 - (title.len() as f64 - partial_text.len() as f64) * 0.05;
    }
    
    // Default low score
    10.0
}

/// Log link analytics
pub async fn log_link_analytics(
    link_id: &str,
    action_type: &str,
    user_id: &str,
    session_id: Option<&str>,
    metadata: Option<&str>
) -> Result<()> {
    let conn = get_connection()?;
    
    let analytics_id = format!("analytics_{}_{}", link_id, chrono::Utc::now().timestamp_millis());
    
    conn.execute(
        "INSERT INTO link_analytics (
            id, link_id, action_type, user_id, session_id, metadata
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            analytics_id,
            link_id,
            action_type,
            user_id,
            session_id,
            metadata
        ],
    ).context("Failed to log link analytics")?;

    Ok(())
}

/// Get related content based on shared links
pub async fn get_related_content(
    content_id: &str,
    content_type: &str,
    user_id: &str,
    limit: i32
) -> Result<Vec<(String, String, String, f64, i32)>> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "WITH target_links AS (
            SELECT json_each.value as link_target
            FROM content_index, json_each(content_index.links)
            WHERE content_id = ?1 AND content_type = ?2 AND user_id = ?3
        ),
        related_content AS (
            SELECT ci.content_id, ci.content_type, ci.title,
                   COUNT(DISTINCT tl.link_target) as shared_links,
                   (COUNT(DISTINCT tl.link_target) * 10.0) as relevance_score
            FROM content_index ci, json_each(ci.links) je
            JOIN target_links tl ON je.value = tl.link_target
            WHERE ci.user_id = ?3 AND NOT (ci.content_id = ?1 AND ci.content_type = ?2)
            GROUP BY ci.content_id, ci.content_type, ci.title
            HAVING shared_links > 0
        )
        SELECT content_id, content_type, title, relevance_score, shared_links
        FROM related_content
        ORDER BY relevance_score DESC, shared_links DESC
        LIMIT ?4"
    )?;

    let results = stmt.query_map(
        params![content_id, content_type, user_id, limit],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, i32>(4)?,
            ))
        }
    )?
    .collect::<Result<Vec<_>, _>>()?;

    Ok(results)
}

/// Clean up old link suggestions
pub async fn cleanup_old_suggestions(hours: i32) -> Result<()> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM link_suggestions 
         WHERE created_at < datetime('now', '-' || ?1 || ' hours')",
        params![hours],
    ).context("Failed to cleanup old suggestions")?;

    Ok(())
}

/// Helper function to map link relationship row
fn map_link_relationship_row(row: &Row) -> rusqlite::Result<LinkRelationship> {
    Ok(LinkRelationship {
        id: row.get(0)?,
        source_id: row.get(1)?,
        source_type: row.get(2)?,
        target_id: row.get(3)?,
        target_type: row.get(4)?,
        link_text: row.get(5)?,
        context_snippet: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
        user_id: row.get(9)?,
    })
}

/// Helper function to map content index row
fn map_content_index_row(row: &Row) -> rusqlite::Result<ContentIndex> {
    let tags_json: String = row.get(5)?;
    let links_json: String = row.get(6)?;
    
    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
    let links: Vec<String> = serde_json::from_str(&links_json).unwrap_or_default();
    
    Ok(ContentIndex {
        id: row.get(0)?,
        content_id: row.get(1)?,
        content_type: row.get(2)?,
        title: row.get(3)?,
        content_text: row.get(4)?,
        tags,
        links,
        last_indexed: row.get(7)?,
        user_id: row.get(8)?,
    })
}

/// Helper function to map link suggestion row
fn map_link_suggestion_row(row: &Row) -> rusqlite::Result<LinkSuggestion> {
    Ok(LinkSuggestion {
        id: row.get(0)?,
        partial_text: row.get(1)?,
        target_id: row.get(2)?,
        target_type: row.get(3)?,
        target_title: row.get(4)?,
        relevance_score: row.get(5)?,
        created_at: row.get(6)?,
        user_id: row.get(7)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_link_relationship_crud() {
        // This would require setting up a test database
        // Implementation depends on your test setup
    }

    #[test]
    fn test_relevance_score_calculation() {
        assert_eq!(calculate_relevance_score("test", "test"), 100.0);
        assert!(calculate_relevance_score("test", "testing") > 80.0);
        assert!(calculate_relevance_score("test", "this is a test") > 40.0);
    }
}