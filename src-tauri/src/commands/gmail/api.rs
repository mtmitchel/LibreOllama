//! Gmail API Commands
//!
//! This module provides Tauri command handlers for Gmail API operations
//! using the GmailApiService.

use tauri::State;
use std::sync::Arc;

use crate::services::gmail::api_service::{
    GmailApiService, GmailLabel, MessageSearchQuery, MessageSearchResult,
    ProcessedGmailMessage, GmailMessage
};

// =============================================================================
// Command Handlers
// =============================================================================

/// Get all labels for a Gmail account
#[tauri::command]
pub async fn get_gmail_labels(
    account_id: String,
    api_service: State<'_, Arc<GmailApiService>>,
) -> Result<Vec<GmailLabel>, String> {
    api_service
        .get_labels(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Search Gmail messages with parsing
#[tauri::command]
pub async fn search_gmail_messages(
    account_id: String,
    query: Option<String>,
    label_ids: Option<Vec<String>>,
    max_results: Option<u32>,
    page_token: Option<String>,
    api_service: State<'_, Arc<GmailApiService>>,
) -> Result<MessageSearchResult, String> {
    let search_query = MessageSearchQuery {
        query,
        label_ids,
        max_results,
        page_token,
        include_spam_trash: Some(false),
    };

    api_service
        .search_messages(&account_id, &search_query)
        .await
        .map_err(|e| e.to_string())
}

/// Get a specific Gmail message by ID
#[tauri::command]
pub async fn get_gmail_message(
    account_id: String,
    message_id: String,
    api_service: State<'_, Arc<GmailApiService>>,
) -> Result<GmailMessage, String> {
    api_service
        .get_message(&account_id, &message_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get a parsed Gmail message by ID
#[tauri::command]
pub async fn get_parsed_gmail_message(
    account_id: String,
    message_id: String,
    api_service: State<'_, Arc<GmailApiService>>,
) -> Result<ProcessedGmailMessage, String> {
    api_service
        .get_parsed_message(&account_id, &message_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get an entire Gmail thread with parsed messages
#[tauri::command]
pub async fn get_gmail_thread(
    account_id: String,
    thread_id: String,
    api_service: State<'_, Arc<GmailApiService>>,
) -> Result<Vec<ProcessedGmailMessage>, String> {
    api_service
        .get_thread(&account_id, &thread_id)
        .await
        .map_err(|e| e.to_string())
}

/// Modify labels for a batch of messages
#[tauri::command]
pub async fn modify_gmail_messages(
    account_id: String,
    message_ids: Vec<String>,
    add_label_ids: Vec<String>,
    remove_label_ids: Vec<String>,
    api_service: State<'_, Arc<GmailApiService>>,
) -> Result<(), String> {
    api_service
        .modify_messages(&account_id, message_ids, add_label_ids, remove_label_ids)
        .await
        .map_err(|e| e.to_string())
}

/// Move a batch of messages to the trash
#[tauri::command]
pub async fn trash_gmail_messages(
    account_id: String,
    message_ids: Vec<String>,
    api_service: State<'_, Arc<GmailApiService>>,
) -> Result<(), String> {
    api_service
        .trash_messages(&account_id, message_ids)
        .await
        .map_err(|e| e.to_string())
}

/// Download Gmail attachment data
#[tauri::command]
pub async fn get_gmail_attachment(
    account_id: String,
    message_id: String,
    attachment_id: String,
    api_service: State<'_, Arc<GmailApiService>>,
) -> Result<Vec<u8>, String> {
    api_service
        .get_attachment(&account_id, &message_id, &attachment_id)
        .await
        .map_err(|e| e.to_string())
} 