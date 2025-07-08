//! Gmail Sync Commands
//!
//! This module provides Tauri command handlers for Gmail synchronization,
//! including full sync, incremental sync, and push notifications.

use tauri::State;
use std::sync::Arc;

use crate::services::gmail::sync_service::{
    GmailSyncService, SyncConfig, SyncState, SyncResult,
    BatchMessageResponse, HistoryResponse, PushNotificationSetupResponse, 
    PushNotificationData, AccountSyncState, GmailSyncConfig
};
use crate::services::gmail::auth_service::GmailTokens;

// =============================================================================
// Command Handlers
// =============================================================================

/// Initialize sync state for a Gmail account
#[tauri::command]
pub async fn initialize_gmail_sync(
    account_id: String,
    config: SyncConfig,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<SyncState, String> {
    sync_service
        .initialize_sync_state(&account_id, &config)
        .await
        .map_err(|e| e.to_string())
}

/// Perform full sync of Gmail messages
#[tauri::command]
pub async fn perform_gmail_full_sync(
    account_id: String,
    max_messages: Option<u32>,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<SyncResult, String> {
    sync_service
        .perform_full_sync(&account_id, max_messages)
        .await
        .map_err(|e| e.to_string())
}

/// Perform incremental sync using Gmail history API
#[tauri::command]
pub async fn perform_gmail_incremental_sync(
    account_id: String,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<SyncResult, String> {
    sync_service
        .perform_incremental_sync(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get sync state for an account
#[tauri::command]
pub async fn get_gmail_sync_state(
    account_id: String,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<Option<SyncState>, String> {
    sync_service
        .get_sync_state(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Pause sync for an account
#[tauri::command]
pub async fn pause_gmail_sync(
    account_id: String,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .pause_sync(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Resume sync for an account
#[tauri::command]
pub async fn resume_gmail_sync(
    account_id: String,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<SyncResult, String> {
    sync_service
        .resume_sync(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get messages in batch from Gmail API
#[tauri::command]
pub async fn get_gmail_messages_batch(
    account_id: String,
    max_results: Option<u32>,
    page_token: Option<String>,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<BatchMessageResponse, String> {
    sync_service
        .get_messages_batch(&account_id, max_results, page_token, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Get history changes from Gmail API
#[tauri::command]
pub async fn get_gmail_history(
    account_id: String,
    start_history_id: String,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<HistoryResponse, String> {
    sync_service
        .get_history(&account_id, &start_history_id, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Setup push notifications for real-time sync
#[tauri::command]
pub async fn setup_gmail_push_notifications(
    account_id: String,
    topic_name: String,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<PushNotificationSetupResponse, String> {
    sync_service
        .setup_push_notifications(&account_id, &topic_name, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Stop push notifications
#[tauri::command]
pub async fn stop_gmail_push_notifications(
    account_id: String,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .stop_push_notifications(&account_id, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Handle incoming push notification
#[tauri::command]
pub async fn handle_gmail_push_notification(
    notification_data: PushNotificationData,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .handle_push_notification(&notification_data)
        .await
        .map_err(|e| e.to_string())
}

/// Get account sync state
#[tauri::command]
pub async fn get_gmail_account_sync_state(
    account_id: String,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<Option<AccountSyncState>, String> {
    sync_service
        .get_account_sync_state(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Update account sync state
#[tauri::command]
pub async fn update_gmail_account_sync_state(
    account_id: String,
    sync_state: AccountSyncState,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .update_account_sync_state(&account_id, sync_state)
        .await
        .map_err(|e| e.to_string())
}

// =============================================================================
// Message Management Commands
// =============================================================================

/// Mark messages as read
#[tauri::command]
pub async fn mark_gmail_messages_as_read(
    account_id: String,
    message_ids: Vec<String>,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .mark_as_read(&account_id, &message_ids, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Mark messages as unread
#[tauri::command]
pub async fn mark_gmail_messages_as_unread(
    account_id: String,
    message_ids: Vec<String>,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .mark_as_unread(&account_id, &message_ids, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Star messages
#[tauri::command]
pub async fn star_gmail_messages(
    account_id: String,
    message_ids: Vec<String>,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .star_messages(&account_id, &message_ids, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Unstar messages
#[tauri::command]
pub async fn unstar_gmail_messages(
    account_id: String,
    message_ids: Vec<String>,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .unstar_messages(&account_id, &message_ids, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Delete messages
#[tauri::command]
pub async fn delete_gmail_messages(
    account_id: String,
    message_ids: Vec<String>,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .delete_messages(&account_id, &message_ids, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Archive messages
#[tauri::command]
pub async fn archive_gmail_messages(
    account_id: String,
    message_ids: Vec<String>,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .archive_messages(&account_id, &message_ids, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
}

/// Modify message labels
#[tauri::command]
pub async fn modify_gmail_message_labels(
    account_id: String,
    message_ids: Vec<String>,
    add_labels: Vec<String>,
    remove_labels: Vec<String>,
    config: GmailSyncConfig,
    tokens: GmailTokens,
    sync_service: State<'_, Arc<GmailSyncService>>,
) -> Result<(), String> {
    sync_service
        .modify_labels(&account_id, &message_ids, &add_labels, &remove_labels, &config, &tokens)
        .await
        .map_err(|e| e.to_string())
} 