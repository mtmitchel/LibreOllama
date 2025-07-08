//! Database operations for bidirectional linking system (v4)
//!
//! This module provides CRUD operations for managing bidirectional links,
//! content indexing, and link analytics.

use anyhow::{Context, Result};
use rusqlite::{params, Connection, OptionalExtension, Row};
use serde_json;

/// Link relationship model for database operations
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
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
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
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
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
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
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
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

/// Link statistics structure
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct LinkStatistics {
    pub total_links: i32,
    pub total_content: i32,
    pub most_linked_content: Vec<(String, String, i32)>, // (title, type, link_count)
    pub orphaned_content: i32,
}

/// Create a new link relationship
pub fn create_link_relationship(conn: &Connection, relationship: &LinkRelationship) -> Result<()> {
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
    )
    .context("Failed to create link relationship")?;
    Ok(())
}

/// Get all link relationships for a source
pub fn get_outgoing_links(
    conn: &Connection,
    source_id: &str,
    source_type: &str,
    user_id: &str,
) -> Result<Vec<LinkRelationship>> {
    let mut stmt = conn.prepare(
        "SELECT id, source_id, source_type, target_id, target_type,
                link_text, context_snippet, created_at, updated_at, user_id
         FROM link_relationships 
         WHERE source_id = ?1 AND source_type = ?2 AND user_id = ?3
         ORDER BY updated_at DESC",
    )?;
    let relationships = stmt
        .query_map(params![source_id, source_type, user_id], map_link_relationship_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(relationships)
}

/// Get all backlinks for a target
pub fn get_backlinks(
    conn: &Connection,
    target_id: &str,
    target_type: &str,
    user_id: &str,
) -> Result<Vec<BacklinkReference>> {
    let mut stmt = conn.prepare(
        "SELECT lr.id, lr.source_id, lr.source_type, ci.title as source_title,
                lr.link_text, lr.context_snippet, lr.created_at, lr.updated_at
         FROM link_relationships lr
         LEFT JOIN content_index ci ON lr.source_id = ci.content_id 
             AND lr.source_type = ci.content_type AND ci.user_id = lr.user_id
         WHERE lr.target_id = ?1 AND lr.target_type = ?2 AND lr.user_id = ?3
         ORDER BY lr.updated_at DESC",
    )?;
    let backlinks = stmt
        .query_map(params![target_id, target_type, user_id], |row| {
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
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(backlinks)
}

/// Update a link relationship
pub fn update_link_relationship(conn: &Connection, relationship: &LinkRelationship) -> Result<()> {
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
    )
    .context("Failed to update link relationship")?;
    Ok(())
}

/// Delete a link relationship
pub fn delete_link_relationship(conn: &Connection, id: &str, user_id: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM link_relationships WHERE id = ?1 AND user_id = ?2",
        params![id, user_id],
    )
    .context("Failed to delete link relationship")?;
    Ok(())
}

/// Create or update content index
pub fn upsert_content_index(conn: &Connection, content: &ContentIndex) -> Result<()> {
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
    )
    .context("Failed to upsert content index")?;
    Ok(())
}

/// Get content index by content ID
pub fn get_content_index(
    conn: &Connection,
    content_id: &str,
    content_type: &str,
    user_id: &str,
) -> Result<Option<ContentIndex>> {
    let mut stmt = conn.prepare(
        "SELECT id, content_id, content_type, title, content_text,
                tags, links, last_indexed, user_id
         FROM content_index 
         WHERE content_id = ?1 AND content_type = ?2 AND user_id = ?3",
    )?;
    Ok(stmt.query_row(params![content_id, content_type, user_id], map_content_index_row)
        .optional()?)
}

/// Search content using full-text search
pub fn search_content(conn: &Connection, query: &str, user_id: &str, limit: i32) -> Result<Vec<ContentIndex>> {
    let mut stmt = conn.prepare(
        "SELECT ci.id, ci.content_id, ci.content_type, ci.title, ci.content_text,
                ci.tags, ci.links, ci.last_indexed, ci.user_id
         FROM content_index ci
         JOIN content_fts fts ON ci.rowid = fts.rowid
         WHERE fts MATCH ?1 AND ci.user_id = ?2
         ORDER BY rank
         LIMIT ?3",
    )?;
    let results = stmt
        .query_map(params![query, user_id, limit], map_content_index_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(results)
}

/// Get link suggestions for auto-completion
pub fn get_link_suggestions(
    conn: &Connection,
    partial_text: &str,
    user_id: &str,
    limit: i32,
) -> Result<Vec<LinkSuggestion>> {
    let cached_suggestions = get_cached_suggestions(conn, partial_text, user_id, limit)?;
    if !cached_suggestions.is_empty() {
        return Ok(cached_suggestions);
    }
    let content_matches = search_content_for_suggestions(conn, partial_text, user_id, limit)?;
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
    for suggestion in &suggestions {
        cache_link_suggestion(conn, suggestion)?;
    }
    Ok(suggestions)
}

/// Get cached suggestions (synchronous database operation)
fn get_cached_suggestions(
    conn: &Connection,
    partial_text: &str,
    user_id: &str,
    limit: i32,
) -> Result<Vec<LinkSuggestion>> {
    let sql = "SELECT id, partial_text, target_id, target_type, target_title,
                relevance_score, created_at, user_id
         FROM link_suggestions
         WHERE partial_text LIKE ?1 AND user_id = ?2
         ORDER BY relevance_score DESC
         LIMIT ?3";
    
    let mut results = Vec::new();
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt.query_map(params![format!("{}%", partial_text), user_id, limit], map_link_suggestion_row)?;
    
    for row_result in rows {
        results.push(row_result?);
    }
    
    Ok(results)
}

/// Search content index for suggestions (synchronous database operation)
fn search_content_for_suggestions(
    conn: &Connection,
    partial_text: &str,
    user_id: &str,
    limit: i32,
) -> Result<Vec<(String, String, String)>> {
    let sql = "SELECT content_id, content_type, title
         FROM content_index
         WHERE title LIKE ?1 AND user_id = ?2
         ORDER BY title
         LIMIT ?3";
    
    let mut results = Vec::new();
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt.query_map(params![format!("%{}%", partial_text), user_id, limit], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    })?;
    
    for row_result in rows {
        results.push(row_result?);
    }
    
    Ok(results)
}

/// Cache a link suggestion
pub fn cache_link_suggestion(conn: &Connection, suggestion: &LinkSuggestion) -> Result<()> {
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
    )
    .context("Failed to cache link suggestion")?;
    Ok(())
}

/// Calculate relevance score for a suggestion
fn calculate_relevance_score(partial_text: &str, title: &str) -> f64 {
    let partial_lower = partial_text.to_lowercase();
    let title_lower = title.to_lowercase();
    if title_lower == partial_lower { return 100.0; }
    if title_lower.starts_with(&partial_lower) {
        return 90.0 - (title.len() as f64 - partial_text.len() as f64) * 0.1;
    }
    if title_lower.contains(&partial_lower) {
        return 50.0 - (title.len() as f64 - partial_text.len() as f64) * 0.05;
    }
    10.0
}

/// Log link analytics
pub fn log_link_analytics(
    conn: &Connection,
    link_id: &str,
    action_type: &str,
    user_id: &str,
    session_id: Option<&str>,
    metadata: Option<&str>,
) -> Result<()> {
    let analytics_id = format!("analytics_{}_{}", link_id, chrono::Utc::now().timestamp_millis());
    conn.execute(
        "INSERT INTO link_analytics (
            id, link_id, action_type, user_id, session_id, metadata
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![analytics_id, link_id, action_type, user_id, session_id, metadata],
    )
    .context("Failed to log link analytics")?;
    Ok(())
}

/// Get related content based on shared links
pub fn get_related_content(
    conn: &Connection,
    content_id: &str,
    content_type: &str,
    user_id: &str,
    limit: i32,
) -> Result<Vec<(String, String, String, f64, i32)>> {
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
        LIMIT ?4",
    )?;
    let rows = stmt.query_map(params![content_id, content_type, user_id, limit], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, f64>(3)?,
            row.get::<_, i32>(4)?,
        ))
    })?;
    
    let mut results = Vec::new();
    for row_result in rows {
        results.push(row_result?);
    }
    
    Ok(results)
}

/// Clean up old link suggestions
pub fn cleanup_old_suggestions(conn: &Connection, hours: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM link_suggestions 
         WHERE created_at < datetime('now', '-' || ?1 || ' hours')",
        params![hours],
    )
    .context("Failed to cleanup old suggestions")?;
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

pub fn get_link_statistics(conn: &Connection, user_id: &str) -> Result<LinkStatistics> {
    let total_links: i32 = conn
        .prepare("SELECT COUNT(*) FROM link_relationships WHERE user_id = ?1")?
        .query_row([user_id], |row| row.get(0))?;

    let total_content: i32 = conn
        .prepare("SELECT COUNT(*) FROM content_index WHERE user_id = ?1")?
        .query_row([user_id], |row| row.get(0))?;

    let most_linked_content: Vec<(String, String, i32)> = conn
        .prepare(
            "SELECT ci.title, ci.content_type, COUNT(lr.id) as link_count
             FROM content_index ci
             LEFT JOIN link_relationships lr ON ci.content_id = lr.target_id 
                 AND ci.content_type = lr.target_type
             WHERE ci.user_id = ?1
             GROUP BY ci.content_id, ci.content_type
             ORDER BY link_count DESC
             LIMIT 10"
        )?
        .query_map([user_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i32>(2)?
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let orphaned_content: i32 = conn
        .prepare(
            "SELECT COUNT(*) FROM content_index ci
             WHERE ci.user_id = ?1
             AND NOT EXISTS (
                 SELECT 1 FROM link_relationships lr 
                 WHERE lr.source_id = ci.content_id AND lr.source_type = ci.content_type
             )
             AND NOT EXISTS (
                 SELECT 1 FROM link_relationships lr 
                 WHERE lr.target_id = ci.content_id AND lr.target_type = ci.content_type
             )"
        )?
        .query_row([user_id], |row| row.get(0))?;

    Ok(LinkStatistics {
        total_links,
        total_content,
        most_linked_content,
        orphaned_content,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_relevance_score_calculation() {
        assert_eq!(calculate_relevance_score("test", "test"), 100.0);
        assert!(calculate_relevance_score("test", "testing") > 80.0);
        assert!(calculate_relevance_score("test", "this is a test") > 40.0);
    }
}