//! Tauri commands for bidirectional linking system
//!
//! This module provides the API interface between the frontend and the
//! bidirectional linking database operations.

use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::command;

use crate::database::{
    create_link_relationship, get_outgoing_links, get_backlinks, update_link_relationship,
    delete_link_relationship, upsert_content_index, get_content_index, search_content,
    get_link_suggestions, log_link_analytics, get_related_content, cleanup_old_suggestions,
    LinkRelationship as DbLinkRelationship, ContentIndex as DbContentIndex,
};

/// Frontend-compatible link relationship structure
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// Frontend-compatible content index structure
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// Frontend-compatible link suggestion structure
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// Frontend-compatible backlink reference structure
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// Related content item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelatedContent {
    pub content_id: String,
    pub content_type: String,
    pub title: String,
    pub relevance_score: f64,
    pub shared_links: i32,
}

/// Cross-reference data for a content item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossReferenceData {
    pub target_id: String,
    pub target_type: String,
    pub outgoing_links: Vec<LinkRelationship>,
    pub backlinks: Vec<BacklinkReference>,
    pub related_content: Vec<RelatedContent>,
}

/// Create a new link relationship
#[command]
pub async fn create_link(relationship: LinkRelationship) -> Result<(), String> {
    let db_relationship = DbLinkRelationship {
        id: relationship.id,
        source_id: relationship.source_id,
        source_type: relationship.source_type,
        target_id: relationship.target_id,
        target_type: relationship.target_type,
        link_text: relationship.link_text,
        context_snippet: relationship.context_snippet,
        created_at: relationship.created_at,
        updated_at: relationship.updated_at,
        user_id: relationship.user_id,
    };

    create_link_relationship(&db_relationship)
        .await
        .map_err(|e| e.to_string())
}

/// Get outgoing links for a content item
#[command]
pub async fn get_outgoing_links_for_content(
    source_id: String,
    source_type: String,
    user_id: String,
) -> Result<Vec<LinkRelationship>, String> {
    let db_links = get_outgoing_links(&source_id, &source_type, &user_id)
        .await
        .map_err(|e| e.to_string())?;

    let links = db_links
        .into_iter()
        .map(|db_link| LinkRelationship {
            id: db_link.id,
            source_id: db_link.source_id,
            source_type: db_link.source_type,
            target_id: db_link.target_id,
            target_type: db_link.target_type,
            link_text: db_link.link_text,
            context_snippet: db_link.context_snippet,
            created_at: db_link.created_at,
            updated_at: db_link.updated_at,
            user_id: db_link.user_id,
        })
        .collect();

    Ok(links)
}

/// Get backlinks for a content item
#[command]
pub async fn get_backlinks_for_content(
    target_id: String,
    target_type: String,
    user_id: String,
) -> Result<Vec<BacklinkReference>, String> {
    let db_backlinks = get_backlinks(&target_id, &target_type, &user_id)
        .await
        .map_err(|e| e.to_string())?;

    let backlinks = db_backlinks
        .into_iter()
        .map(|db_backlink| BacklinkReference {
            id: db_backlink.id,
            source_id: db_backlink.source_id,
            source_type: db_backlink.source_type,
            source_title: db_backlink.source_title,
            link_text: db_backlink.link_text,
            context_snippet: db_backlink.context_snippet,
            created_at: db_backlink.created_at,
            updated_at: db_backlink.updated_at,
        })
        .collect();

    Ok(backlinks)
}

/// Update a link relationship
#[command]
pub async fn update_link(relationship: LinkRelationship) -> Result<(), String> {
    let db_relationship = DbLinkRelationship {
        id: relationship.id,
        source_id: relationship.source_id,
        source_type: relationship.source_type,
        target_id: relationship.target_id,
        target_type: relationship.target_type,
        link_text: relationship.link_text,
        context_snippet: relationship.context_snippet,
        created_at: relationship.created_at,
        updated_at: relationship.updated_at,
        user_id: relationship.user_id,
    };

    update_link_relationship(&db_relationship)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a link relationship
#[command]
pub async fn delete_link(id: String, user_id: String) -> Result<(), String> {
    delete_link_relationship(&id, &user_id)
        .await
        .map_err(|e| e.to_string())
}

/// Index content for linking
#[command]
pub async fn index_content(content: ContentIndex) -> Result<(), String> {
    let db_content = DbContentIndex {
        id: content.id,
        content_id: content.content_id,
        content_type: content.content_type,
        title: content.title,
        content_text: content.content_text,
        tags: content.tags,
        links: content.links,
        last_indexed: content.last_indexed,
        user_id: content.user_id,
    };

    upsert_content_index(&db_content)
        .await
        .map_err(|e| e.to_string())
}

/// Get content index for a content item
#[command]
pub async fn get_content_index_for_item(
    content_id: String,
    content_type: String,
    user_id: String,
) -> Result<Option<ContentIndex>, String> {
    let db_content = get_content_index(&content_id, &content_type, &user_id)
        .await
        .map_err(|e| e.to_string())?;

    let content = db_content.map(|db_content| ContentIndex {
        id: db_content.id,
        content_id: db_content.content_id,
        content_type: db_content.content_type,
        title: db_content.title,
        content_text: db_content.content_text,
        tags: db_content.tags,
        links: db_content.links,
        last_indexed: db_content.last_indexed,
        user_id: db_content.user_id,
    });

    Ok(content)
}

/// Search content using full-text search
#[command]
pub async fn search_content_for_links(
    query: String,
    user_id: String,
    limit: Option<i32>,
) -> Result<Vec<ContentIndex>, String> {
    let limit = limit.unwrap_or(20);
    let db_results = search_content(&query, &user_id, limit)
        .await
        .map_err(|e| e.to_string())?;

    let results = db_results
        .into_iter()
        .map(|db_content| ContentIndex {
            id: db_content.id,
            content_id: db_content.content_id,
            content_type: db_content.content_type,
            title: db_content.title,
            content_text: db_content.content_text,
            tags: db_content.tags,
            links: db_content.links,
            last_indexed: db_content.last_indexed,
            user_id: db_content.user_id,
        })
        .collect();

    Ok(results)
}

/// Get link suggestions for auto-completion
#[command]
pub async fn get_link_suggestions_for_text(
    partial_text: String,
    user_id: String,
    limit: Option<i32>,
) -> Result<Vec<LinkSuggestion>, String> {
    let limit = limit.unwrap_or(10);
    let db_suggestions = get_link_suggestions(&partial_text, &user_id, limit)
        .await
        .map_err(|e| e.to_string())?;

    let suggestions = db_suggestions
        .into_iter()
        .map(|db_suggestion| LinkSuggestion {
            id: db_suggestion.id,
            partial_text: db_suggestion.partial_text,
            target_id: db_suggestion.target_id,
            target_type: db_suggestion.target_type,
            target_title: db_suggestion.target_title,
            relevance_score: db_suggestion.relevance_score,
            created_at: db_suggestion.created_at,
            user_id: db_suggestion.user_id,
        })
        .collect();

    Ok(suggestions)
}

/// Get related content for a content item
#[command]
pub async fn get_related_content_for_item(
    content_id: String,
    content_type: String,
    user_id: String,
    limit: Option<i32>,
) -> Result<Vec<RelatedContent>, String> {
    let limit = limit.unwrap_or(10);
    let db_related = get_related_content(&content_id, &content_type, &user_id, limit)
        .await
        .map_err(|e| e.to_string())?;

    let related = db_related
        .into_iter()
        .map(|(content_id, content_type, title, relevance_score, shared_links)| RelatedContent {
            content_id,
            content_type,
            title,
            relevance_score,
            shared_links,
        })
        .collect();

    Ok(related)
}

/// Get complete cross-reference data for a content item
#[command]
pub async fn get_cross_reference_data(
    content_id: String,
    content_type: String,
    user_id: String,
) -> Result<CrossReferenceData, String> {
    // Get outgoing links
    let outgoing_links = get_outgoing_links_for_content(
        content_id.clone(),
        content_type.clone(),
        user_id.clone(),
    )
    .await?;

    // Get backlinks
    let backlinks = get_backlinks_for_content(
        content_id.clone(),
        content_type.clone(),
        user_id.clone(),
    )
    .await?;

    // Get related content
    let related_content = get_related_content_for_item(
        content_id.clone(),
        content_type.clone(),
        user_id,
        Some(10),
    )
    .await?;

    Ok(CrossReferenceData {
        target_id: content_id,
        target_type: content_type,
        outgoing_links,
        backlinks,
        related_content,
    })
}

/// Log link analytics
#[command]
pub async fn log_link_action(
    link_id: String,
    action_type: String,
    user_id: String,
    session_id: Option<String>,
    metadata: Option<String>,
) -> Result<(), String> {
    log_link_analytics(
        &link_id,
        &action_type,
        &user_id,
        session_id.as_deref(),
        metadata.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

/// Clean up old link suggestions
#[command]
pub async fn cleanup_link_suggestions(hours: Option<i32>) -> Result<(), String> {
    let hours = hours.unwrap_or(24);
    cleanup_old_suggestions(hours)
        .await
        .map_err(|e| e.to_string())
}

/// Batch create multiple links
#[command]
pub async fn create_multiple_links(relationships: Vec<LinkRelationship>) -> Result<(), String> {
    for relationship in relationships {
        create_link(relationship).await?;
    }
    Ok(())
}

/// Batch update content index for multiple items
#[command]
pub async fn batch_index_content(content_items: Vec<ContentIndex>) -> Result<(), String> {
    for content in content_items {
        index_content(content).await?;
    }
    Ok(())
}

/// Get link statistics for a user
#[command]
pub async fn get_link_statistics(_user_id: String) -> Result<LinkStatistics, String> {
    // This would use the schema_v4::get_link_statistics function
    // For now, return a placeholder
    Ok(LinkStatistics {
        total_links: 0,
        total_content: 0,
        most_linked_content: vec![],
        orphaned_content: 0,
    })
}

/// Link statistics structure for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkStatistics {
    pub total_links: i32,
    pub total_content: i32,
    pub most_linked_content: Vec<(String, String, i32)>, // (title, type, link_count)
    pub orphaned_content: i32,
}