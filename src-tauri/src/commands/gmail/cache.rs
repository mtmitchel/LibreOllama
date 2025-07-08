//! Gmail Cache Commands
//!
//! This module provides Tauri command handlers for Gmail message caching,
//! offline access, and cache management using the GmailCacheService.

use tauri::State;
use std::sync::Arc;

use crate::services::gmail::cache_service::{
    GmailCacheService, CacheConfig, CacheStats, CachedMessage, CachePriority,
    CacheQuery, CacheQueryResult
};
use crate::services::gmail::{ProcessedGmailMessage};

// =============================================================================
// Command Handlers
// =============================================================================

/// Initialize cache configuration for an account
#[tauri::command]
pub async fn initialize_gmail_cache_config(
    account_id: String,
    config: CacheConfig,
    cache_service: State<'_, Arc<GmailCacheService>>,
) -> Result<(), String> {
    cache_service
        .initialize_cache_config(&account_id, &config)
        .await
        .map_err(|e| e.to_string())
}

/// Get cached messages based on query
#[tauri::command]
pub async fn get_gmail_cached_messages(
    query: CacheQuery,
    cache_service: State<'_, Arc<GmailCacheService>>,
) -> Result<CacheQueryResult, String> {
    cache_service
        .get_cached_messages(&query)
        .await
        .map_err(|e| e.to_string())
}

/// Cache a message with priority and offline availability
#[tauri::command]
pub async fn cache_gmail_message(
    message: ProcessedGmailMessage,
    account_id: String,
    priority: CachePriority,
    offline_available: bool,
    cache_service: State<'_, Arc<GmailCacheService>>,
) -> Result<(), String> {
    cache_service
        .cache_message(&message, &account_id, priority, offline_available)
        .await
        .map_err(|e| e.to_string())
}

/// Get cache statistics for an account
#[tauri::command]
pub async fn get_gmail_cache_stats(
    account_id: String,
    cache_service: State<'_, Arc<GmailCacheService>>,
) -> Result<CacheStats, String> {
    cache_service
        .get_cache_stats(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Cleanup cache based on configuration
#[tauri::command]
pub async fn cleanup_gmail_cache(
    account_id: String,
    force: bool,
    cache_service: State<'_, Arc<GmailCacheService>>,
) -> Result<u64, String> {
    cache_service
        .cleanup_cache(&account_id, force)
        .await
        .map_err(|e| e.to_string())
}

/// Enable offline access for specific messages
#[tauri::command]
pub async fn enable_gmail_offline_access(
    message_ids: Vec<String>,
    account_id: String,
    cache_service: State<'_, Arc<GmailCacheService>>,
) -> Result<u32, String> {
    cache_service
        .enable_offline_access(&message_ids, &account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get offline-available messages
#[tauri::command]
pub async fn get_gmail_offline_messages(
    account_id: String,
    cache_service: State<'_, Arc<GmailCacheService>>,
) -> Result<Vec<CachedMessage>, String> {
    cache_service
        .get_offline_messages(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Preload messages for offline access
#[tauri::command]
pub async fn preload_gmail_for_offline(
    account_id: String,
    days_back: u32,
    include_attachments: bool,
    cache_service: State<'_, Arc<GmailCacheService>>,
) -> Result<u32, String> {
    cache_service
        .preload_for_offline(&account_id, days_back, include_attachments)
        .await
        .map_err(|e| e.to_string())
} 