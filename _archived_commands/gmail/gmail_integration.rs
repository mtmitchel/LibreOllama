use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database::connection::DatabaseManager;
use crate::commands::email_parser::{
    ParsedEmailMessage, GmailApiMessage, parse_gmail_api_message, 
    sanitize_html_content, html_to_text
};
use crate::commands::token_storage::get_gmail_tokens;
use reqwest::Client;
use base64::{engine::general_purpose, Engine as _};
// Types are defined locally in this file

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedGmailMessage {
    pub id: String,
    pub thread_id: String,
    pub parsed_content: ParsedEmailMessage,
    pub labels: Vec<String>,
    pub snippet: Option<String>,
    pub internal_date: Option<String>,
    pub size_estimate: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailSyncResult {
    pub messages_processed: usize,
    pub messages_failed: usize,
    pub errors: Vec<String>,
    pub last_history_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailSearchQuery {
    pub account_id: String,
    pub query: Option<String>,
    pub label_ids: Option<Vec<String>>,
    pub max_results: Option<u32>,
    pub page_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailSearchResult {
    pub messages: Vec<ProcessedGmailMessage>,
    pub next_page_token: Option<String>,
    pub result_size_estimate: Option<u32>,
}

/// Parse and process a Gmail API message with full MIME parsing
#[tauri::command]
pub async fn parse_gmail_message(
    account_id: String,
    message_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<ProcessedGmailMessage, String> {
    // Get stored tokens for the account
    let tokens = get_gmail_tokens(account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Fetch the message from Gmail API
    let client = Client::new();
    let url = format!(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/{}?format=full",
        message_id
    );

    let response = client
        .get(&url)
        .bearer_auth(&tokens.access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch message: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Gmail API error: {} - {}",
            response.status(),
            response.text().await.unwrap_or_default()
        ));
    }

    let gmail_message: GmailApiMessage = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Gmail API response: {}", e))?;

    // Parse the message content
    let parsed_content = parse_gmail_api_message(&gmail_message)
        .map_err(|e| format!("Failed to parse email content: {}", e))?;

    Ok(ProcessedGmailMessage {
        id: gmail_message.id,
        thread_id: gmail_message.thread_id,
        parsed_content,
        labels: gmail_message.label_ids.unwrap_or_default(),
        snippet: gmail_message.snippet,
        internal_date: gmail_message.internal_date,
        size_estimate: gmail_message.size_estimate,
    })
}

/// Get and parse multiple messages from a Gmail thread
#[tauri::command]
pub async fn parse_gmail_thread(
    account_id: String,
    thread_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Vec<ProcessedGmailMessage>, String> {
    // Get stored tokens for the account
    let tokens = get_gmail_tokens(account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Fetch the thread from Gmail API
    let client = Client::new();
    let url = format!(
        "https://gmail.googleapis.com/gmail/v1/users/me/threads/{}?format=full",
        thread_id
    );

    let response = client
        .get(&url)
        .bearer_auth(&tokens.access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch thread: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Gmail API error: {} - {}",
            response.status(),
            response.text().await.unwrap_or_default()
        ));
    }

    #[derive(Deserialize)]
    struct GmailThread {
        id: String,
        messages: Vec<GmailApiMessage>,
    }

    let gmail_thread: GmailThread = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Gmail API response: {}", e))?;

    // Parse all messages in the thread
    let mut processed_messages = Vec::new();
    for gmail_message in gmail_thread.messages {
        match parse_gmail_api_message(&gmail_message) {
            Ok(parsed_content) => {
                processed_messages.push(ProcessedGmailMessage {
                    id: gmail_message.id,
                    thread_id: gmail_message.thread_id,
                    parsed_content,
                    labels: gmail_message.label_ids.unwrap_or_default(),
                    snippet: gmail_message.snippet,
                    internal_date: gmail_message.internal_date,
                    size_estimate: gmail_message.size_estimate,
                });
            }
            Err(e) => {
                eprintln!("Failed to parse message {}: {}", gmail_message.id, e);
                // Continue processing other messages
            }
        }
    }

    Ok(processed_messages)
}

/// Search Gmail messages with parsing
#[tauri::command]
pub async fn search_and_parse_gmail_messages(
    search_query: EmailSearchQuery,
    db_manager: State<'_, DatabaseManager>,
) -> Result<EmailSearchResult, String> {
    // Get stored tokens for the account
    let tokens = get_gmail_tokens(search_query.account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Build search URL
    let client = Client::new();
    let mut url = "https://gmail.googleapis.com/gmail/v1/users/me/messages".to_string();
    let mut params = Vec::new();

    if let Some(query) = &search_query.query {
        params.push(format!("q={}", urlencoding::encode(query)));
    }
    
    if let Some(label_ids) = &search_query.label_ids {
        for label_id in label_ids {
            params.push(format!("labelIds={}", urlencoding::encode(label_id)));
        }
    }
    
    if let Some(max_results) = search_query.max_results {
        params.push(format!("maxResults={}", max_results));
    }
    
    if let Some(page_token) = &search_query.page_token {
        params.push(format!("pageToken={}", urlencoding::encode(page_token)));
    }

    if !params.is_empty() {
        url.push('?');
        url.push_str(&params.join("&"));
    }

    // Fetch message list
    let response = client
        .get(&url)
        .bearer_auth(&tokens.access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to search messages: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Gmail API error: {} - {}",
            response.status(),
            response.text().await.unwrap_or_default()
        ));
    }

    #[derive(Deserialize)]
    struct MessageListResponse {
        messages: Option<Vec<MessageRef>>,
        #[serde(rename = "nextPageToken")]
        next_page_token: Option<String>,
        #[serde(rename = "resultSizeEstimate")]
        result_size_estimate: Option<u32>,
    }

    #[derive(Deserialize)]
    struct MessageRef {
        id: String,
        #[serde(rename = "threadId")]
        thread_id: String,
    }

    let search_response: MessageListResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse search response: {}", e))?;

    let mut processed_messages = Vec::new();

    if let Some(message_refs) = search_response.messages {
        // Fetch and parse each message
        for message_ref in message_refs {
            let message_id = message_ref.id.clone();
            match parse_gmail_message(
                search_query.account_id.clone(), 
                message_ref.id, 
                db_manager.clone()
            ).await {
                Ok(processed_message) => {
                    processed_messages.push(processed_message);
                }
                Err(e) => {
                    eprintln!("Failed to parse message {}: {}", message_id, e);
                    // Continue processing other messages
                }
            }
        }
    }

    Ok(EmailSearchResult {
        messages: processed_messages,
        next_page_token: search_response.next_page_token,
        result_size_estimate: search_response.result_size_estimate,
    })
}

/// Extract text content from HTML email body
#[tauri::command]
pub async fn extract_text_from_html(html_content: String) -> Result<String, String> {
    // Sanitize and convert HTML to text
    let sanitized = sanitize_html_content(&html_content);
    let text = html_to_text(&sanitized);
    Ok(text)
}

/// Sync Gmail messages and store them in the local database
#[tauri::command]
pub async fn sync_gmail_messages(
    account_id: String,
    label_id: Option<String>,
    max_messages: Option<u32>,
    db_manager: State<'_, DatabaseManager>,
) -> Result<EmailSyncResult, String> {
    // Get stored tokens for the account
    let _tokens = get_gmail_tokens(account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    let mut messages_processed = 0;
    let mut messages_failed = 0;
    let mut errors = Vec::new();
    let mut last_history_id = None;

    // Build query for messages to sync
    let search_query = EmailSearchQuery {
        account_id: account_id.clone(),
        query: None,
        label_ids: label_id.map(|id| vec![id]),
        max_results: max_messages,
        page_token: None,
    };

    match search_and_parse_gmail_messages(search_query, db_manager.clone()).await {
        Ok(search_result) => {
            for message in search_result.messages {
                match store_parsed_message_in_db(&message, &account_id, &db_manager).await {
                    Ok(_) => {
                        messages_processed += 1;
                        // Update last_history_id from the latest message
                        if let Some(internal_date) = &message.internal_date {
                            last_history_id = Some(internal_date.clone());
                        }
                    }
                    Err(e) => {
                        messages_failed += 1;
                        errors.push(format!("Failed to store message {}: {}", message.id, e));
                    }
                }
            }
        }
        Err(e) => {
            errors.push(format!("Failed to search messages: {}", e));
        }
    }

    Ok(EmailSyncResult {
        messages_processed,
        messages_failed,
        errors,
        last_history_id,
    })
}

/// Store a parsed Gmail message in the local database
pub async fn store_parsed_message_in_db(
    message: &ProcessedGmailMessage,
    account_id: &str,
    db_manager: &DatabaseManager,
) -> Result<()> {
    let conn = db_manager.get_connection()?;
    
    // Store the message in gmail_messages table - using named parameters to avoid tuple limit
    conn.execute(
        "INSERT OR REPLACE INTO gmail_messages (
            id, thread_id, account_id, snippet, from_email, from_name,
            subject, body_text, body_html, has_attachments, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        (
            &message.id,
            &message.thread_id,
            account_id,
            &message.snippet,
            &message.parsed_content.from.email,
            &message.parsed_content.from.name,
            &message.parsed_content.subject,
            &message.parsed_content.body_text,
            &message.parsed_content.body_html,
            !message.parsed_content.attachments.is_empty(),
            &chrono::Utc::now().to_rfc3339(),
            &chrono::Utc::now().to_rfc3339(),
        ),
    )?;

    // Store attachments if any
    for (index, attachment) in message.parsed_content.attachments.iter().enumerate() {
        conn.execute(
            "INSERT OR REPLACE INTO gmail_attachments (
                id, message_id, account_id, attachment_id, filename, mime_type,
                size_bytes, is_downloaded, local_path, download_date, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            (
                format!("{}_{}", message.id, index),
                &message.id,
                account_id,
                &attachment.id,
                &attachment.filename,
                &attachment.content_type,
                attachment.size.unwrap_or(0) as i64,
                false,
                None::<String>,
                None::<String>,
                &chrono::Utc::now().to_rfc3339(),
            ),
        )?;
    }

    // Store message labels
    for label_id in &message.labels {
        conn.execute(
            "INSERT OR REPLACE INTO gmail_message_labels (
                message_id, label_id, account_id, applied_at
            ) VALUES (?1, ?2, ?3, ?4)",
            (
                &message.id,
                label_id,
                account_id,
                &chrono::Utc::now().to_rfc3339(),
            ),
        )?;
    }

    Ok(())
}

/// Get attachment content from Gmail API
#[tauri::command]
pub async fn get_gmail_attachment(
    account_id: String,
    message_id: String,
    attachment_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Vec<u8>, String> {
    // Get stored tokens for the account
    let tokens = get_gmail_tokens(account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Fetch attachment from Gmail API
    let client = Client::new();
    let url = format!(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/{}/attachments/{}",
        message_id, attachment_id
    );

    let response = client
        .get(&url)
        .bearer_auth(&tokens.access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch attachment: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Gmail API error: {} - {}",
            response.status(),
            response.text().await.unwrap_or_default()
        ));
    }

    #[derive(Deserialize)]
    struct AttachmentResponse {
        data: String,
        size: Option<i32>,
    }

    let attachment_response: AttachmentResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse attachment response: {}", e))?;

    // Decode base64 data
    let decoded_data = general_purpose::URL_SAFE_NO_PAD
        .decode(&attachment_response.data)
        .map_err(|e| format!("Failed to decode attachment data: {}", e))?;

    Ok(decoded_data)
} 