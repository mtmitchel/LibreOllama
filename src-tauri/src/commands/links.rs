//! Tauri commands for bidirectional linking system
//!
//! This module provides the API interface between the frontend and the
//! bidirectional linking database operations.

use serde::{Deserialize, Serialize};
use tauri::{command, State};

use crate::database::operations::link_operations::{
    self, BacklinkReference, ContentIndex, LinkRelationship, LinkStatistics, LinkSuggestion,
};

/// Frontend-compatible related content item
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
pub async fn create_link(
    relationship: LinkRelationship,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::create_link_relationship(&conn, &relationship)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Get outgoing links for a content item
#[command]
pub async fn get_outgoing_links_for_content(
    source_id: String,
    source_type: String,
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<LinkRelationship>, String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::get_outgoing_links(&conn, &source_id, &source_type, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Get backlinks for a content item
#[command]
pub async fn get_backlinks_for_content(
    target_id: String,
    target_type: String,
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<BacklinkReference>, String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::get_backlinks(&conn, &target_id, &target_type, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Update a link relationship
#[command]
pub async fn update_link(
    relationship: LinkRelationship,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::update_link_relationship(&conn, &relationship)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Delete a link relationship
#[command]
pub async fn delete_link(
    id: String,
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::delete_link_relationship(&conn, &id, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Index content for linking
#[command]
pub async fn index_content(
    content: ContentIndex,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::upsert_content_index(&conn, &content)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Get content index for a content item
#[command]
pub async fn get_content_index_for_item(
    content_id: String,
    content_type: String,
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Option<ContentIndex>, String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::get_content_index(&conn, &content_id, &content_type, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Search content using full-text search
#[command]
pub async fn search_content_for_links(
    query: String,
    user_id: String,
    limit: Option<i32>,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<ContentIndex>, String> {
    let limit = limit.unwrap_or(20);
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::search_content(&conn, &query, &user_id, limit)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Get link suggestions for auto-completion
#[command]
pub async fn get_link_suggestions_for_text(
    partial_text: String,
    user_id: String,
    limit: Option<i32>,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<LinkSuggestion>, String> {
    let limit = limit.unwrap_or(10);
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::get_link_suggestions(&conn, &partial_text, &user_id, limit)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Get related content for a content item
#[command]
pub async fn get_related_content_for_item(
    content_id: String,
    content_type: String,
    user_id: String,
    limit: Option<i32>,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<RelatedContent>, String> {
    let limit = limit.unwrap_or(10);
    let db_manager_clone = db_manager.inner().clone();
    let db_related = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::get_related_content(&conn, &content_id, &content_type, &user_id, limit)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

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
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<CrossReferenceData, String> {
    let outgoing_links =
        get_outgoing_links_for_content(content_id.clone(), content_type.clone(), user_id.clone(), db_manager.clone()).await?;
    let backlinks =
        get_backlinks_for_content(content_id.clone(), content_type.clone(), user_id.clone(), db_manager.clone()).await?;
    let related_content =
        get_related_content_for_item(content_id.clone(), content_type.clone(), user_id, Some(10), db_manager).await?;

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
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::log_link_analytics(
            &conn,
            &link_id,
            &action_type,
            &user_id,
            session_id.as_deref(),
            metadata.as_deref(),
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Clean up old link suggestions
#[command]
pub async fn cleanup_link_suggestions(
    hours: Option<i32>,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let hours = hours.unwrap_or(24);
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::cleanup_old_suggestions(&conn, hours)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}

/// Batch create multiple links
#[command]
pub async fn create_multiple_links(
    relationships: Vec<LinkRelationship>,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    for relationship in relationships {
        create_link(relationship, db_manager.clone()).await?;
    }
    Ok(())
}

/// Batch update content index for multiple items
#[command]
pub async fn batch_index_content(
    content_items: Vec<ContentIndex>,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    for content in content_items {
        index_content(content, db_manager.clone()).await?;
    }
    Ok(())
}

/// Get link statistics for a user
#[command]
pub async fn get_link_statistics(
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<LinkStatistics, String> {
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        link_operations::get_link_statistics(&conn, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())
}