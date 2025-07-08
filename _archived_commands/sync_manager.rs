use serde::{Deserialize, Serialize};
use tauri::{command, State};
use anyhow::{anyhow, Result};
use reqwest::Client;
// use chrono::{DateTime, Utc}; // Will be used when implementing actual sync timestamps

use crate::database::connection::DatabaseManager;
use crate::commands::token_storage::get_gmail_tokens;
// ARCHIVED: use crate::commands::gmail_integration::{ProcessedGmailMessage, store_parsed_message_in_db};
// ARCHIVED: use crate::commands::email_parser::parse_gmail_api_message;
use crate::services::gmail::{ProcessedGmailMessage, GmailMessage};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncState {
    pub account_id: String,
    pub history_id: Option<String>,
    pub last_sync_timestamp: Option<String>,
    pub messages_synced: u64,
    pub messages_failed: u64,
    pub sync_status: SyncStatus,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncStatus {
    Idle,
    InProgress,
    Completed,
    Failed,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub account_id: String,
    pub max_messages_per_batch: u32,
    pub sync_interval_minutes: u32,
    pub labels_to_sync: Option<Vec<String>>,
    pub exclude_labels: Option<Vec<String>>,
    pub full_sync_on_startup: bool,
    pub enable_incremental_sync: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub account_id: String,
    pub sync_type: SyncType,
    pub messages_processed: u64,
    pub messages_failed: u64,
    pub new_history_id: Option<String>,
    pub duration_ms: u64,
    pub errors: Vec<String>,
    pub status: SyncStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncType {
    Full,
    Incremental,
    Manual,
}

#[derive(Debug, Deserialize)]
struct GmailHistoryResponse {
    history: Option<Vec<GmailHistoryRecord>>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
    #[serde(rename = "historyId")]
    history_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GmailHistoryRecord {
    id: String,
    messages: Option<Vec<GmailHistoryMessage>>,
    #[serde(rename = "messagesAdded")]
    messages_added: Option<Vec<GmailHistoryMessage>>,
    #[serde(rename = "messagesDeleted")]
    messages_deleted: Option<Vec<GmailHistoryMessage>>,
    #[serde(rename = "labelsAdded")]
    labels_added: Option<Vec<GmailLabelChange>>,
    #[serde(rename = "labelsRemoved")]
    labels_removed: Option<Vec<GmailLabelChange>>,
}

#[derive(Debug, Deserialize)]
struct GmailHistoryMessage {
    id: String,
    #[serde(rename = "threadId")]
    thread_id: String,
}

#[derive(Debug, Deserialize)]
struct GmailLabelChange {
    message: GmailHistoryMessage,
    #[serde(rename = "labelIds")]
    label_ids: Vec<String>,
}

/// Initialize sync state for a Gmail account
#[command]
pub async fn initialize_sync_state(
    account_id: String,
    config: SyncConfig,
    db_manager: State<'_, DatabaseManager>,
) -> Result<SyncState, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    // Get or create sync state
    let existing_state = get_sync_state_from_db(&account_id, &conn)?;
    
    let sync_state = match existing_state {
        Some(state) => state,
        None => {
            // Create new sync state
            let new_state = SyncState {
                account_id: account_id.clone(),
                history_id: None,
                last_sync_timestamp: None,
                messages_synced: 0,
                messages_failed: 0,
                sync_status: SyncStatus::Idle,
                errors: Vec::new(),
            };
            
            // Store in database
            store_sync_state_in_db(&new_state, &conn)?;
            new_state
        }
    };

    // Store sync configuration
    store_sync_config_in_db(&config, &conn)?;

    Ok(sync_state)
}

/// Perform full sync of Gmail messages for an account
#[command]
pub async fn perform_full_sync(
    account_id: String,
    max_messages: Option<u32>,
    db_manager: State<'_, DatabaseManager>,
) -> Result<SyncResult, String> {
    let start_time = std::time::Instant::now();
    let mut sync_result = SyncResult {
        account_id: account_id.clone(),
        sync_type: SyncType::Full,
        messages_processed: 0,
        messages_failed: 0,
        new_history_id: None,
        duration_ms: 0,
        errors: Vec::new(),
        status: SyncStatus::InProgress,
    };

    // Update sync state to in-progress
    update_sync_status(&account_id, SyncStatus::InProgress, &db_manager).await?;

    // Get tokens for the account
    let tokens = get_gmail_tokens(account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    let client = Client::new();
    let mut page_token: Option<String> = None;
    let mut total_processed = 0u64;
    let mut total_failed = 0u64;
    let batch_size = max_messages.unwrap_or(100).min(500); // Gmail API limit

    loop {
        match sync_message_batch(
            &client,
            &tokens.access_token,
            &account_id,
            batch_size,
            page_token.clone(),
            &db_manager,
        ).await {
            Ok((processed, failed, next_token, history_id)) => {
                total_processed += processed;
                total_failed += failed;
                
                if let Some(hist_id) = history_id {
                    sync_result.new_history_id = Some(hist_id);
                }

                // Check if we have more pages and haven't hit the limit
                if let Some(token) = next_token {
                    if max_messages.map_or(true, |max| total_processed < max as u64) {
                        page_token = Some(token);
                        continue;
                    }
                }
                break;
            }
            Err(e) => {
                sync_result.errors.push(format!("Batch sync failed: {}", e));
                total_failed += batch_size as u64;
                break;
            }
        }
    }

    sync_result.messages_processed = total_processed;
    sync_result.messages_failed = total_failed;
    sync_result.duration_ms = start_time.elapsed().as_millis() as u64;
    sync_result.status = if total_failed == 0 { SyncStatus::Completed } else { SyncStatus::Failed };

    // Update sync state in database
    update_sync_completion(&account_id, &sync_result, &db_manager).await?;

    Ok(sync_result)
}

/// Perform incremental sync using Gmail history API
#[command]
pub async fn perform_incremental_sync(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<SyncResult, String> {
    let start_time = std::time::Instant::now();
    let mut sync_result = SyncResult {
        account_id: account_id.clone(),
        sync_type: SyncType::Incremental,
        messages_processed: 0,
        messages_failed: 0,
        new_history_id: None,
        duration_ms: 0,
        errors: Vec::new(),
        status: SyncStatus::InProgress,
    };

    // Get current sync state
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;
    
    let sync_state = get_sync_state_from_db(&account_id, &conn)?
        .ok_or("No sync state found for account")?;

    let start_history_id = sync_state.history_id
        .ok_or("No history ID available for incremental sync. Perform full sync first.")?;

    // Update sync state to in-progress
    update_sync_status(&account_id, SyncStatus::InProgress, &db_manager).await?;

    // Get tokens for the account
    let tokens = get_gmail_tokens(account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    let client = Client::new();
    
    match process_history_changes(
        &client,
        &tokens.access_token,
        &account_id,
        &start_history_id,
        &db_manager,
    ).await {
        Ok((processed, failed, new_history_id)) => {
            sync_result.messages_processed = processed;
            sync_result.messages_failed = failed;
            sync_result.new_history_id = new_history_id;
            sync_result.status = if failed == 0 { SyncStatus::Completed } else { SyncStatus::Failed };
        }
        Err(e) => {
            sync_result.errors.push(format!("Incremental sync failed: {}", e));
            sync_result.status = SyncStatus::Failed;
        }
    }

    sync_result.duration_ms = start_time.elapsed().as_millis() as u64;

    // Update sync state in database
    update_sync_completion(&account_id, &sync_result, &db_manager).await?;

    Ok(sync_result)
}

/// Get current sync state for an account
#[command]
pub async fn get_sync_state(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Option<SyncState>, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;
    
    get_sync_state_from_db(&account_id, &conn)
}

/// Pause ongoing sync for an account
#[command]
pub async fn pause_sync(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    update_sync_status(&account_id, SyncStatus::Paused, &db_manager).await
}

/// Resume paused sync for an account
#[command]
pub async fn resume_sync(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<SyncResult, String> {
    // Check current sync state
    let sync_state = get_sync_state(account_id.clone(), db_manager.clone()).await?
        .ok_or("No sync state found for account")?;

    match sync_state.sync_status {
        SyncStatus::Paused => {
            // Resume with incremental sync
            perform_incremental_sync(account_id, db_manager).await
        }
        _ => Err("Sync is not in paused state".to_string())
    }
}

/// Internal helper functions

async fn sync_message_batch(
    client: &Client,
    access_token: &str,
    account_id: &str,
    batch_size: u32,
    page_token: Option<String>,
    db_manager: &State<'_, DatabaseManager>,
) -> Result<(u64, u64, Option<String>, Option<String>)> {
    let mut url = format!("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={}", batch_size);
    
    if let Some(token) = page_token {
        url.push_str(&format!("&pageToken={}", token));
    }

    let response = client
        .get(&url)
        .bearer_auth(access_token)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(anyhow!("Gmail API request failed: {}", response.status()));
    }

    let json: serde_json::Value = response.json().await?;
    
    let empty_messages = Vec::new();
    let messages = json.get("messages")
        .and_then(|m| m.as_array())
        .unwrap_or(&empty_messages);
    
    let next_page_token = json.get("nextPageToken")
        .and_then(|t| t.as_str())
        .map(|s| s.to_string());

    let mut processed = 0u64;
    let mut failed = 0u64;
    let mut latest_history_id = None;

    for message in messages {
        if let Some(message_id) = message.get("id").and_then(|id| id.as_str()) {
            match fetch_and_process_message(client, access_token, account_id, message_id, db_manager).await {
                Ok(history_id) => {
                    processed += 1;
                    if let Some(hist_id) = history_id {
                        latest_history_id = Some(hist_id);
                    }
                }
                Err(e) => {
                    failed += 1;
                    eprintln!("Failed to process message {}: {}", message_id, e);
                }
            }
        }
    }

    Ok((processed, failed, next_page_token, latest_history_id))
}

async fn fetch_and_process_message(
    client: &Client,
    access_token: &str,
    _account_id: &str,
    message_id: &str,
    _db_manager: &State<'_, DatabaseManager>,
) -> Result<Option<String>> {
    // Fetch full message from Gmail API
    let url = format!("https://gmail.googleapis.com/gmail/v1/users/me/messages/{}", message_id);
    
    let response = client
        .get(&url)
        .bearer_auth(access_token)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(anyhow!("Failed to fetch message {}: {}", message_id, response.status()));
    }

    let gmail_message: serde_json::Value = response.json().await?;
    let history_id = gmail_message.get("historyId")
        .and_then(|h| h.as_str())
        .map(|s| s.to_string());

    // TODO: Refactor to use GmailApiService for message parsing and storage
    // ARCHIVED: This functionality was moved to services/gmail/api_service.rs
    // For now, we'll store the raw message data and process it later
    
    // Parse the message using new service types  
    let gmail_api_message: GmailMessage = serde_json::from_value(gmail_message.clone())?;
    
    // TODO: Use GmailApiService.parse_gmail_message() once service integration is complete
    // For now, create a minimal ProcessedGmailMessage for compatibility
    let processed_message = ProcessedGmailMessage {
        id: gmail_api_message.id.clone(),
        thread_id: gmail_api_message.thread_id.clone(),
        parsed_content: crate::services::gmail::ParsedEmail {
            message_id: Some(gmail_api_message.id.clone()),
            thread_id: Some(gmail_api_message.thread_id.clone()),
            subject: None, // TODO: Parse from headers
            from: crate::services::gmail::EmailAddress { email: "unknown@example.com".to_string(), name: None },
            to: Vec::new(),
            cc: Vec::new(),
            bcc: Vec::new(),
            reply_to: None,
            date: gmail_api_message.internal_date.clone(),
            body_text: None,
            body_html: None,
            attachments: Vec::new(),
            headers: std::collections::HashMap::new(),
            is_multipart: false,
            content_type: "text/plain".to_string(),
            size_estimate: gmail_api_message.size_estimate.map(|s| s as usize),
        },
        labels: gmail_api_message.label_ids.unwrap_or_default(),
        snippet: gmail_api_message.snippet,
        internal_date: gmail_api_message.internal_date,
        size_estimate: gmail_api_message.size_estimate,
    };
    
    // TODO: Use proper database storage service instead of direct DB calls
    // store_parsed_message_in_db(&processed_message, account_id, db_manager).await?;
    eprintln!("TODO: Store message {} in database using new service", processed_message.id);

    Ok(history_id)
}

async fn process_history_changes(
    client: &Client,
    access_token: &str,
    account_id: &str,
    start_history_id: &str,
    db_manager: &State<'_, DatabaseManager>,
) -> Result<(u64, u64, Option<String>)> {
    let url = format!(
        "https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId={}",
        start_history_id
    );

    let response = client
        .get(&url)
        .bearer_auth(access_token)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(anyhow!("Gmail history API request failed: {}", response.status()));
    }

    let history_response: GmailHistoryResponse = response.json().await?;
    
    let mut processed = 0u64;
    let mut failed = 0u64;

    if let Some(history_records) = history_response.history {
        for record in history_records {
            // Process added messages
            if let Some(added_messages) = record.messages_added {
                for message in added_messages {
                    match fetch_and_process_message(client, access_token, account_id, &message.id, db_manager).await {
                        Ok(_) => processed += 1,
                        Err(e) => {
                            failed += 1;
                            eprintln!("Failed to process added message {}: {}", message.id, e);
                        }
                    }
                }
            }

            // Process deleted messages
            if let Some(deleted_messages) = record.messages_deleted {
                for message in deleted_messages {
                    match delete_message_from_db(&message.id, account_id, db_manager).await {
                        Ok(_) => processed += 1,
                        Err(e) => {
                            failed += 1;
                            eprintln!("Failed to delete message {}: {}", message.id, e);
                        }
                    }
                }
            }

            // Process label changes
            if let Some(label_changes) = record.labels_added {
                for change in label_changes {
                    if let Err(e) = update_message_labels(&change.message.id, &change.label_ids, true, account_id, db_manager).await {
                        eprintln!("Failed to add labels to message {}: {}", change.message.id, e);
                    }
                }
            }

            if let Some(label_changes) = record.labels_removed {
                for change in label_changes {
                    if let Err(e) = update_message_labels(&change.message.id, &change.label_ids, false, account_id, db_manager).await {
                        eprintln!("Failed to remove labels from message {}: {}", change.message.id, e);
                    }
                }
            }
        }
    }

    Ok((processed, failed, history_response.history_id))
}

// Database helper functions

fn get_sync_state_from_db(
    account_id: &str,
    conn: &rusqlite::Connection,
) -> Result<Option<SyncState>, String> {
    let mut stmt = conn.prepare(
        "SELECT history_id, last_sync_timestamp, messages_synced, messages_failed, sync_status 
         FROM gmail_sync_state WHERE account_id = ?"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let result = stmt.query_row([account_id], |row| {
        let sync_status_str: String = row.get(4)?;
        let sync_status = match sync_status_str.as_str() {
            "idle" => SyncStatus::Idle,
            "in_progress" => SyncStatus::InProgress,
            "completed" => SyncStatus::Completed,
            "failed" => SyncStatus::Failed,
            "paused" => SyncStatus::Paused,
            _ => SyncStatus::Idle,
        };

        Ok(SyncState {
            account_id: account_id.to_string(),
            history_id: row.get(0)?,
            last_sync_timestamp: row.get(1)?,
            messages_synced: row.get(2)?,
            messages_failed: row.get(3)?,
            sync_status,
            errors: Vec::new(), // Errors are not stored persistently
        })
    });

    match result {
        Ok(state) => Ok(Some(state)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

fn store_sync_state_in_db(
    sync_state: &SyncState,
    conn: &rusqlite::Connection,
) -> Result<(), String> {
    let status_str = match sync_state.sync_status {
        SyncStatus::Idle => "idle",
        SyncStatus::InProgress => "in_progress",
        SyncStatus::Completed => "completed",
        SyncStatus::Failed => "failed",
        SyncStatus::Paused => "paused",
    };

    conn.execute(
        "INSERT OR REPLACE INTO gmail_sync_state 
         (account_id, history_id, last_sync_timestamp, messages_synced, messages_failed, sync_status, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (
            &sync_state.account_id,
            &sync_state.history_id,
            &sync_state.last_sync_timestamp,
            sync_state.messages_synced,
            sync_state.messages_failed,
            status_str,
            &chrono::Utc::now().to_rfc3339(),
        ),
    ).map_err(|e| format!("Failed to store sync state: {}", e))?;

    Ok(())
}

fn store_sync_config_in_db(
    config: &SyncConfig,
    conn: &rusqlite::Connection,
) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO gmail_sync_configs 
         (account_id, max_messages_per_batch, sync_interval_minutes, labels_to_sync, exclude_labels, 
          full_sync_on_startup, enable_incremental_sync, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        (
            &config.account_id,
            config.max_messages_per_batch,
            config.sync_interval_minutes,
            &config.labels_to_sync.as_ref().map(|l| serde_json::to_string(l).unwrap_or_default()),
            &config.exclude_labels.as_ref().map(|l| serde_json::to_string(l).unwrap_or_default()),
            config.full_sync_on_startup,
            config.enable_incremental_sync,
            &chrono::Utc::now().to_rfc3339(),
            &chrono::Utc::now().to_rfc3339(),
        ),
    ).map_err(|e| format!("Failed to store sync config: {}", e))?;

    Ok(())
}

async fn update_sync_status(
    account_id: &str,
    status: SyncStatus,
    db_manager: &State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let status_str = match status {
        SyncStatus::Idle => "idle",
        SyncStatus::InProgress => "in_progress",
        SyncStatus::Completed => "completed",
        SyncStatus::Failed => "failed",
        SyncStatus::Paused => "paused",
    };

    conn.execute(
        "UPDATE gmail_sync_state SET sync_status = ?, updated_at = ? WHERE account_id = ?",
        (status_str, &chrono::Utc::now().to_rfc3339(), account_id),
    ).map_err(|e| format!("Failed to update sync status: {}", e))?;

    Ok(())
}

async fn update_sync_completion(
    account_id: &str,
    result: &SyncResult,
    db_manager: &State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let status_str = match result.status {
        SyncStatus::Idle => "idle",
        SyncStatus::InProgress => "in_progress",
        SyncStatus::Completed => "completed",
        SyncStatus::Failed => "failed",
        SyncStatus::Paused => "paused",
    };

    conn.execute(
        "UPDATE gmail_sync_state 
         SET history_id = COALESCE(?, history_id), 
             last_sync_timestamp = ?,
             messages_synced = messages_synced + ?,
             messages_failed = messages_failed + ?,
             sync_status = ?,
             updated_at = ?
         WHERE account_id = ?",
        (
            &result.new_history_id,
            &chrono::Utc::now().to_rfc3339(),
            result.messages_processed,
            result.messages_failed,
            status_str,
            &chrono::Utc::now().to_rfc3339(),
            account_id,
        ),
    ).map_err(|e| format!("Failed to update sync completion: {}", e))?;

    Ok(())
}

async fn delete_message_from_db(
    message_id: &str,
    account_id: &str,
    db_manager: &State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    conn.execute(
        "DELETE FROM gmail_messages WHERE id = ? AND account_id = ?",
        (message_id, account_id),
    ).map_err(|e| format!("Failed to delete message: {}", e))?;

    Ok(())
}

async fn update_message_labels(
    message_id: &str,
    label_ids: &[String],
    add_labels: bool,
    account_id: &str,
    db_manager: &State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    if add_labels {
        // Add labels
        for label_id in label_ids {
            conn.execute(
                "INSERT OR REPLACE INTO gmail_message_labels 
                 (message_id, label_id, account_id, applied_at) 
                 VALUES (?, ?, ?, ?)",
                (message_id, label_id, account_id, &chrono::Utc::now().to_rfc3339()),
            ).map_err(|e| format!("Failed to add label: {}", e))?;
        }
    } else {
        // Remove labels
        for label_id in label_ids {
            conn.execute(
                "DELETE FROM gmail_message_labels 
                 WHERE message_id = ? AND label_id = ? AND account_id = ?",
                (message_id, label_id, account_id),
            ).map_err(|e| format!("Failed to remove label: {}", e))?;
        }
    }

    Ok(())
} 