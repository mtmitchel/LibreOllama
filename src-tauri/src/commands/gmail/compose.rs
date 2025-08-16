#![cfg(feature = "gmail-compose")]
//! Gmail Compose Commands
//!
//! This module provides Tauri command handlers for Gmail email composition,
//! sending, and draft management using the GmailComposeService.

use tauri::State;
use std::sync::Arc;

use crate::services::gmail::compose_service::{
    GmailComposeService, ComposeRequest, 
    SendResponse, DraftSaveRequest, DraftResponse, MessageTemplate, 
    ReplyRequest
};

// =============================================================================
// Command Handlers
// =============================================================================

/// Send an email message
#[tauri::command]
pub async fn send_gmail_message(
    compose_request: ComposeRequest,
    compose_service: State<'_, Arc<GmailComposeService>>,
) -> Result<SendResponse, String> {
    compose_service
        .send_message(&compose_request)
        .await
        .map_err(|e| e.to_string())
}

/// Save message as draft
#[tauri::command]
pub async fn save_gmail_draft(
    draft_request: DraftSaveRequest,
    compose_service: State<'_, Arc<GmailComposeService>>,
) -> Result<DraftResponse, String> {
    compose_service
        .save_draft(&draft_request)
        .await
        .map_err(|e| e.to_string())
}

/// Get all drafts for an account
#[tauri::command]
pub async fn get_gmail_drafts(
    account_id: String,
    max_results: Option<u32>,
    page_token: Option<String>,
    compose_service: State<'_, Arc<GmailComposeService>>,
) -> Result<Vec<DraftResponse>, String> {
    compose_service
        .get_drafts(&account_id, max_results, page_token.as_deref())
        .await
        .map_err(|e| e.to_string())
}

/// Delete a draft
#[tauri::command]
pub async fn delete_gmail_draft(
    account_id: String,
    draft_id: String,
    compose_service: State<'_, Arc<GmailComposeService>>,
) -> Result<(), String> {
    compose_service
        .delete_draft(&account_id, &draft_id)
        .await
        .map_err(|e| e.to_string())
}

/// Create a reply to an existing message
#[tauri::command]
pub async fn create_gmail_reply(
    reply_request: ReplyRequest,
    compose_service: State<'_, Arc<GmailComposeService>>,
) -> Result<ComposeRequest, String> {
    compose_service
        .create_reply(&reply_request)
        .await
        .map_err(|e| e.to_string())
}

/// Get message templates
#[tauri::command]
pub async fn get_gmail_templates(
    account_id: String,
    compose_service: State<'_, Arc<GmailComposeService>>,
) -> Result<Vec<MessageTemplate>, String> {
    compose_service
        .get_templates(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Create a new message template
#[tauri::command]
pub async fn create_gmail_template(
    account_id: String,
    template: MessageTemplate,
    compose_service: State<'_, Arc<GmailComposeService>>,
) -> Result<String, String> {
    compose_service
        .create_template(&account_id, &template)
        .await
        .map_err(|e| e.to_string())
} 