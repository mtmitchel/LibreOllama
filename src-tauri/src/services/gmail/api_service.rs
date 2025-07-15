//! Gmail API Service
//!
//! This module provides a unified interface for Gmail API operations,
//! consolidating message retrieval, parsing, search, and content processing.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use base64::{Engine as _, engine::general_purpose};
use std::sync::Arc;
use uuid::Uuid;
use chrono;

use crate::database::DatabaseManager;
use crate::errors::{LibreOllamaError, Result};
use crate::services::gmail::auth_service::GmailAuthService;
use crate::commands::rate_limiter::{RateLimiter, BatchRequest, RequestPriority};

/// Gmail API endpoints
const GMAIL_API_BASE: &str = "https://www.googleapis.com/gmail/v1";

/// Gmail API message structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailMessage {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: String,
    #[serde(rename = "labelIds")]
    pub label_ids: Option<Vec<String>>,
    pub snippet: Option<String>,
    #[serde(rename = "historyId")]
    pub history_id: Option<String>,
    #[serde(rename = "internalDate")]
    pub internal_date: Option<String>,
    pub payload: GmailPayload,
    #[serde(rename = "sizeEstimate")]
    pub size_estimate: Option<i32>,
    pub raw: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailPayload {
    #[serde(rename = "partId")]
    pub part_id: Option<String>,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    pub filename: Option<String>,
    pub headers: Vec<GmailHeader>,
    pub body: Option<GmailBody>,
    pub parts: Option<Vec<GmailPayload>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailHeader {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailBody {
    #[serde(rename = "attachmentId")]
    pub attachment_id: Option<String>,
    pub size: Option<i32>,
    pub data: Option<String>, // Base64 encoded
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailLabel {
    pub id: String,
    pub name: String,
    #[serde(rename = "messageListVisibility")]
    pub message_list_visibility: Option<String>,
    #[serde(rename = "labelListVisibility")]
    pub label_list_visibility: Option<String>,
    #[serde(rename = "type")]
    pub label_type: Option<String>,
    #[serde(rename = "messagesTotal")]
    pub messages_total: Option<i64>,
    #[serde(rename = "messagesUnread")]
    pub messages_unread: Option<i64>,
    #[serde(rename = "threadsTotal")]
    pub threads_total: Option<i64>,
    #[serde(rename = "threadsUnread")]
    pub threads_unread: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailThread {
    pub id: String,
    pub messages: Vec<GmailMessage>,
    #[serde(rename = "historyId")]
    pub history_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageListResponse {
    pub messages: Option<Vec<MessageRef>>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
    #[serde(rename = "resultSizeEstimate")]
    pub result_size_estimate: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageRef {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelListResponse {
    pub labels: Vec<GmailLabel>,
}

/// Parsed email content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedEmail {
    pub message_id: Option<String>,
    pub thread_id: Option<String>,
    pub subject: Option<String>,
    pub from: EmailAddress,
    pub to: Vec<EmailAddress>,
    pub cc: Vec<EmailAddress>,
    pub bcc: Vec<EmailAddress>,
    pub reply_to: Option<EmailAddress>,
    pub date: Option<String>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub attachments: Vec<EmailAttachment>,
    pub headers: HashMap<String, String>,
    pub is_multipart: bool,
    pub content_type: String,
    pub size_estimate: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAddress {
    pub email: String,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAttachment {
    pub id: String,
    pub filename: Option<String>,
    pub content_type: String,
    pub size: Option<usize>,
    pub content_id: Option<String>,
    pub is_inline: bool,
    pub data: Option<Vec<u8>>,
}

/// Processed Gmail message with parsed content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedGmailMessage {
    pub id: String,
    pub thread_id: String,
    pub parsed_content: ParsedEmail,
    pub labels: Vec<String>,
    pub snippet: Option<String>,
    pub internal_date: Option<String>,
    pub size_estimate: Option<i32>,
}

/// Search query parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageSearchQuery {
    pub query: Option<String>,
    pub label_ids: Option<Vec<String>>,
    pub max_results: Option<u32>,
    pub page_token: Option<String>,
    pub include_spam_trash: Option<bool>,
}

/// Search results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageSearchResult {
    pub messages: Vec<ProcessedGmailMessage>,
    pub next_page_token: Option<String>,
    pub result_size_estimate: Option<u32>,
}

/// Gmail API Service for all Gmail operations
pub struct GmailApiService {
    client: Client,
    auth_service: Arc<GmailAuthService>,
    db_manager: std::sync::Arc<DatabaseManager>,
    rate_limiter: Arc<tokio::sync::Mutex<RateLimiter>>,
}

impl GmailApiService {
    /// Create a new Gmail API service
    pub fn new(
        auth_service: Arc<GmailAuthService>,
        db_manager: std::sync::Arc<DatabaseManager>,
        rate_limiter: Arc<tokio::sync::Mutex<RateLimiter>>,
    ) -> Self {
        Self {
            client: Client::new(),
            auth_service,
            db_manager,
            rate_limiter,
        }
    }

    /// Make authenticated API request to Gmail
    async fn make_api_request<T>(&self, account_id: &str, endpoint: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        // Get valid tokens for the account
        let tokens = self.auth_service
            .validate_and_refresh_tokens(&self.db_manager, account_id)
            .await?;

        let url = format!("{}/{}", GMAIL_API_BASE, endpoint.trim_start_matches('/'));
        
        // Create rate-limited request
        let batch_request = BatchRequest {
            id: format!("gmail_api_{}", Uuid::new_v4()),
            method: "GET".to_string(),
            url: url.clone(),
            headers: {
                let mut headers = std::collections::HashMap::new();
                headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));
                headers.insert("Accept".to_string(), "application/json".to_string());
                headers
            },
            body: None,
            priority: RequestPriority::Medium,
            created_at: chrono::Utc::now().to_rfc3339(),
            max_retries: 3,
            current_retry: 0,
        };

        // Execute request through rate limiter
        let response = {
            let mut rate_limiter = self.rate_limiter.lock().await;
            rate_limiter.execute_request(batch_request).await
                .map_err(|e| LibreOllamaError::Network {
                    message: format!("Rate limited Gmail API request failed: {}", e),
                    url: Some(url.clone()),
                })?
        };

        // Parse response
        if response.status_code != 200 {
            return Err(LibreOllamaError::GmailApi {
                message: format!("Gmail API error: {} - {}", response.status_code, response.body),
                status_code: Some(response.status_code as u16),
            });
        }

        serde_json::from_str(&response.body)
            .map_err(|e| LibreOllamaError::Serialization {
                message: format!("Failed to parse Gmail API response: {}", e),
                data_type: "Gmail API Response".to_string(),
            })
    }

    /// Make a POST API request to Gmail for modifying data
    async fn make_api_post_request<T>(
        &self,
        account_id: &str,
        endpoint: &str,
        body: serde_json::Value,
    ) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        // Get valid tokens for the account
        let tokens = self.auth_service
            .validate_and_refresh_tokens(&self.db_manager, account_id)
            .await?;

        let url = format!("{}/{}", GMAIL_API_BASE, endpoint.trim_start_matches('/'));

        let batch_request = BatchRequest {
            id: format!("gmail_api_post_{}", Uuid::new_v4()),
            method: "POST".to_string(),
            url: url.clone(),
            headers: {
                let mut headers = std::collections::HashMap::new();
                headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));
                headers.insert("Content-Type".to_string(), "application/json".to_string());
                headers
            },
            body: Some(body.to_string()),
            priority: RequestPriority::High, // Modifications are high priority
            created_at: chrono::Utc::now().to_rfc3339(),
            max_retries: 2,
            current_retry: 0,
        };

        let response = {
            let mut rate_limiter = self.rate_limiter.lock().await;
            rate_limiter.execute_request(batch_request).await
                .map_err(|e| LibreOllamaError::Network {
                    message: format!("Rate limited Gmail POST request failed: {}", e),
                    url: Some(url.clone()),
                })?
        };

        if response.status_code < 200 || response.status_code >= 300 {
             return Err(LibreOllamaError::GmailApi {
                message: format!("Gmail API POST error: {} - {}", response.status_code, response.body),
                status_code: Some(response.status_code as u16),
            });
        }

        // Handle cases with no response body (e.g., 204 No Content)
        if response.body.is_empty() {
            // Create a default value for T, assuming it implements Deserialize and Default
            return Ok(serde_json::from_value(serde_json::Value::Null).unwrap_or_else(|_| serde_json::from_str("{}").unwrap()));
        }

        serde_json::from_str(&response.body)
            .map_err(|e| LibreOllamaError::Serialization {
                message: format!("Failed to parse Gmail POST response: {}", e),
                data_type: "Gmail API Response".to_string(),
            })
    }

    /// Get all labels for an account
    pub async fn get_labels(&self, account_id: &str) -> Result<Vec<GmailLabel>> {
        println!("🏷️  [GMAIL-API] Getting labels for account: {}", account_id);
        
        // Get valid tokens, though they are not used in the URL but required for auth
        let _tokens = self.auth_service.get_account_tokens(account_id).await?
            .ok_or_else(|| LibreOllamaError::InvalidInput {
                field: Some("account_id".to_string()),
                message: format!("No tokens found for account_id: {}", account_id),
            })?;

        let endpoint = format!("users/{}/labels", account_id);

        let list_response = self
            .make_api_request::<serde_json::Value>(account_id, &endpoint).await?;

        let mut labels = vec![];
        if let Some(items) = list_response.get("labels").and_then(|v| v.as_array()) {
            for item in items {
                if let Ok(label) = serde_json::from_value::<GmailLabel>(item.clone()) {
                    labels.push(label);
                }
            }
        } else {
            return Ok(labels); // Return empty vec if no labels found
        }

        // Fetch details for each label to get message counts (sequentially for now)
        let mut detailed_labels = Vec::new();
        for mut label in labels {
            let endpoint = format!("users/me/labels/{}", label.id);
            if let Ok(detail_response) = self.make_api_request::<serde_json::Value>(account_id, &endpoint).await {
                label.messages_total = detail_response.get("messagesTotal").and_then(|v| v.as_i64());
                label.messages_unread = detail_response.get("messagesUnread").and_then(|v| v.as_i64());
                label.threads_total = detail_response.get("threadsTotal").and_then(|v| v.as_i64());
                label.threads_unread = detail_response.get("threadsUnread").and_then(|v| v.as_i64());
            }
            detailed_labels.push(label);
        }

        println!("✅ [GMAIL-API] Successfully parsed {} labels with details", detailed_labels.len());
        Ok(detailed_labels)
    }
    
    /// Modify labels for a batch of messages
    pub async fn modify_messages(
        &self,
        account_id: &str,
        message_ids: Vec<String>,
        add_label_ids: Vec<String>,
        remove_label_ids: Vec<String>,
    ) -> Result<()> {
        let body = serde_json::json!({
            "ids": message_ids,
            "addLabelIds": add_label_ids,
            "removeLabelIds": remove_label_ids,
        });

        self.make_api_post_request::<serde_json::Value>(
            account_id,
            "users/me/messages/batchModify",
            body,
        )
        .await?;

        Ok(())
    }

    /// Move a batch of messages to the trash
    pub async fn trash_messages(&self, account_id: &str, message_ids: Vec<String>) -> Result<()> {
        let body = serde_json::json!({ "ids": message_ids });

        self.make_api_post_request::<serde_json::Value>(
            account_id,
            "users/me/messages/batchTrash",
            body,
        )
        .await?;

        Ok(())
    }

    /// Get messages with optional filtering
    pub async fn get_messages(
        &self,
        account_id: &str,
        query: &MessageSearchQuery,
    ) -> Result<MessageListResponse> {
        let mut endpoint = "users/me/messages".to_string();
        let mut params = Vec::new();

        if let Some(q) = &query.query {
            params.push(format!("q={}", urlencoding::encode(q)));
        }

        if let Some(label_ids) = &query.label_ids {
            for label_id in label_ids {
                params.push(format!("labelIds={}", urlencoding::encode(label_id)));
            }
        }

        if let Some(max_results) = query.max_results {
            params.push(format!("maxResults={}", max_results));
        }

        if let Some(page_token) = &query.page_token {
            params.push(format!("pageToken={}", urlencoding::encode(page_token)));
        }

        if let Some(include_spam_trash) = query.include_spam_trash {
            params.push(format!("includeSpamTrash={}", include_spam_trash));
        }

        if !params.is_empty() {
            endpoint.push_str(&format!("?{}", params.join("&")));
        }

        self.make_api_request(account_id, &endpoint).await
    }

    /// Get a specific message by ID
    pub async fn get_message(&self, account_id: &str, message_id: &str) -> Result<GmailMessage> {
        let endpoint = format!("users/me/messages/{}?format=full", message_id);
        self.make_api_request(account_id, &endpoint).await
    }

    /// Get a message with parsed content
    pub async fn get_parsed_message(
        &self,
        account_id: &str,
        message_id: &str,
    ) -> Result<ProcessedGmailMessage> {
        let gmail_message = self.get_message(account_id, message_id).await?;
        let parsed_content = self.parse_gmail_message(&gmail_message)?;

        // Generate snippet from parsed content if Gmail API snippet is empty or contains error text
        let snippet = self.generate_snippet(&gmail_message.snippet, &parsed_content);

        Ok(ProcessedGmailMessage {
            id: gmail_message.id,
            thread_id: gmail_message.thread_id,
            parsed_content,
            labels: gmail_message.label_ids.unwrap_or_default(),
            snippet: Some(snippet),
            internal_date: gmail_message.internal_date,
            size_estimate: gmail_message.size_estimate,
        })
    }

    /// Get an entire thread with parsed messages
    pub async fn get_thread(&self, account_id: &str, thread_id: &str) -> Result<Vec<ProcessedGmailMessage>> {
        let endpoint = format!("users/me/threads/{}?format=full", thread_id);
        let gmail_thread: GmailThread = self.make_api_request(account_id, &endpoint).await?;

        let mut processed_messages = Vec::new();
        for gmail_message in gmail_thread.messages {
            match self.parse_gmail_message(&gmail_message) {
                Ok(parsed_content) => {
                    // Generate snippet from parsed content if Gmail API snippet is empty or contains error text
                    let snippet = self.generate_snippet(&gmail_message.snippet, &parsed_content);
                    
                    processed_messages.push(ProcessedGmailMessage {
                        id: gmail_message.id,
                        thread_id: gmail_message.thread_id,
                        parsed_content,
                        labels: gmail_message.label_ids.unwrap_or_default(),
                        snippet: Some(snippet),
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

    /// Search messages with parsing
    pub async fn search_messages(
        &self,
        account_id: &str,
        query: &MessageSearchQuery,
    ) -> Result<MessageSearchResult> {
        let message_list = self.get_messages(account_id, query).await?;

        let mut processed_messages = Vec::new();
        if let Some(messages) = message_list.messages {
            for message_ref in messages {
                match self.get_parsed_message(account_id, &message_ref.id).await {
                    Ok(processed) => processed_messages.push(processed),
                    Err(e) => {
                        eprintln!("Failed to get/parse message {}: {}", message_ref.id, e);
                        // Continue processing other messages
                    }
                }
            }
        }

        Ok(MessageSearchResult {
            messages: processed_messages,
            next_page_token: message_list.next_page_token,
            result_size_estimate: message_list.result_size_estimate,
        })
    }

    /// Get message attachment data
    pub async fn get_attachment(
        &self,
        account_id: &str,
        message_id: &str,
        attachment_id: &str,
    ) -> Result<Vec<u8>> {
        let endpoint = format!(
            "users/me/messages/{}/attachments/{}",
            message_id, attachment_id
        );

        #[derive(Deserialize)]
            struct AttachmentResponse {
            data: String,
            size: Option<i32>,
        }

        let response: AttachmentResponse = self.make_api_request(account_id, &endpoint).await?;

        // Decode base64 data using robust method
        self.decode_base64_with_padding(&response.data)
    }

    /// Parse Gmail message content
    fn parse_gmail_message(&self, gmail_message: &GmailMessage) -> Result<ParsedEmail> {
        // If we have raw content, use that for better parsing
        if let Some(raw) = &gmail_message.raw {
            let decoded = self.decode_base64_with_padding(raw)?;
            
            let raw_str = String::from_utf8(decoded)
                .map_err(|e| LibreOllamaError::Serialization {
                    message: format!("Failed to convert raw message to UTF-8: {}", e),
                    data_type: "utf8".to_string(),
                })?;
            
            return self.parse_raw_email(&raw_str, &gmail_message.id, &gmail_message.thread_id);
        }

        // Otherwise, parse from the payload structure
        self.parse_gmail_payload(&gmail_message.payload, &gmail_message.id, &gmail_message.thread_id)
    }

    /// Parse raw email content
    fn parse_raw_email(&self, raw_content: &str, message_id: &str, thread_id: &str) -> Result<ParsedEmail> {
        // For now, we'll implement a basic parser
        // In a full implementation, you'd use a crate like `mailparse`
        let headers = self.extract_headers_from_raw(raw_content)?;
        
        let subject = headers.get("subject").cloned();
        let from = self.parse_address(headers.get("from").unwrap_or(&String::new()))?;
        let to = self.parse_address_list(headers.get("to").unwrap_or(&String::new()));
        let cc = self.parse_address_list(headers.get("cc").unwrap_or(&String::new()));
        let bcc = self.parse_address_list(headers.get("bcc").unwrap_or(&String::new()));
        let reply_to = self.parse_optional_address(headers.get("reply-to").unwrap_or(&String::new()))?;
        let date = headers.get("date").cloned();

        // Extract body content (simplified)
        let (body_text, body_html) = self.extract_body_from_raw(raw_content)?;

        let content_type = headers.get("content-type").cloned().unwrap_or_default();
        let is_multipart = raw_content.contains("multipart/");

        Ok(ParsedEmail {
            message_id: Some(message_id.to_string()),
            thread_id: Some(thread_id.to_string()),
            subject,
            from,
            to,
            cc,
            bcc,
            reply_to,
            date,
            body_text,
            body_html,
            attachments: Vec::new(), // TODO: Extract attachments
            headers,
            is_multipart,
            content_type,
            size_estimate: Some(raw_content.len()),
        })
    }

    /// Parse Gmail API payload structure
    fn parse_gmail_payload(&self, payload: &GmailPayload, message_id: &str, thread_id: &str) -> Result<ParsedEmail> {
        let headers = self.extract_gmail_headers(&payload.headers);
        
        let subject = headers.get("subject").cloned();
        let from = self.parse_address(headers.get("from").unwrap_or(&String::new()))?;
        let to = self.parse_address_list(headers.get("to").unwrap_or(&String::new()));
        let cc = self.parse_address_list(headers.get("cc").unwrap_or(&String::new()));
        let bcc = self.parse_address_list(headers.get("bcc").unwrap_or(&String::new()));
        let reply_to = self.parse_optional_address(headers.get("reply-to").unwrap_or(&String::new()))?;
        let date = headers.get("date").cloned();

        // Extract body content and attachments
        let (body_text, body_html, attachments) = self.extract_gmail_content(payload)?;

        Ok(ParsedEmail {
            message_id: Some(message_id.to_string()),
            thread_id: Some(thread_id.to_string()),
            subject,
            from,
            to,
            cc,
            bcc,
            reply_to,
            date,
            body_text,
            body_html,
            attachments,
            headers,
            is_multipart: payload.mime_type.starts_with("multipart/"),
            content_type: payload.mime_type.clone(),
            size_estimate: None,
        })
    }

    /// Extract headers from Gmail API format
    fn extract_gmail_headers(&self, headers: &[GmailHeader]) -> HashMap<String, String> {
        headers
            .iter()
            .map(|h| (h.name.to_lowercase(), h.value.clone()))
            .collect()
    }

    /// Extract headers from raw email
    fn extract_headers_from_raw(&self, raw_content: &str) -> Result<HashMap<String, String>> {
        let mut headers = HashMap::new();
        let lines: Vec<&str> = raw_content.lines().collect();
        
        let mut i = 0;
        while i < lines.len() {
            let line = lines[i];
            if line.trim().is_empty() {
                break; // End of headers
            }
            
            if let Some(colon_pos) = line.find(':') {
                let key = line[..colon_pos].trim().to_lowercase();
                let mut value = line[colon_pos + 1..].trim().to_string();
                
                // Handle header continuation lines
                i += 1;
                while i < lines.len() && (lines[i].starts_with(' ') || lines[i].starts_with('\t')) {
                    value.push(' ');
                    value.push_str(lines[i].trim());
                    i += 1;
                }
                
                headers.insert(key, value);
            } else {
                i += 1;
            }
        }
        
        Ok(headers)
    }

    /// Extract body content from raw email
    fn extract_body_from_raw(&self, raw_content: &str) -> Result<(Option<String>, Option<String>)> {
        // Find the end of headers (double newline)
        if let Some(body_start) = raw_content.find("\r\n\r\n").or_else(|| raw_content.find("\n\n")) {
            let body = &raw_content[body_start..].trim();
            
            // For now, treat all content as text
            // In a full implementation, you'd parse MIME types
            Ok((Some(body.to_string()), None))
        } else {
            Ok((None, None))
        }
    }

    /// Extract content from Gmail payload
    fn extract_gmail_content(&self, payload: &GmailPayload) -> Result<(Option<String>, Option<String>, Vec<EmailAttachment>)> {
        let mut body_text = None;
        let mut body_html = None;
        let mut attachments = Vec::new();

        self.extract_gmail_parts_recursive(payload, &mut body_text, &mut body_html, &mut attachments)?;

        Ok((body_text, body_html, attachments))
    }

    /// Recursively extract parts from Gmail payload
    fn extract_gmail_parts_recursive(
        &self,
        part: &GmailPayload,
        body_text: &mut Option<String>,
        body_html: &mut Option<String>,
        attachments: &mut Vec<EmailAttachment>,
    ) -> Result<()> {
        // Check if this part has content
        if let Some(body) = &part.body {
            if let Some(data) = &body.data {
                // Decode base64 content with robust padding handling
                let decoded = self.decode_base64_with_padding(data)?;

                let content = String::from_utf8_lossy(&decoded);

                match part.mime_type.as_str() {
                    "text/plain" => {
                        if body_text.is_none() {
                            *body_text = Some(content.to_string());
                        }
                    }
                    "text/html" => {
                        if body_html.is_none() {
                            *body_html = Some(content.to_string());
                        }
                    }
                    _ => {
                        // Handle as attachment
                        if part.filename.is_some() || body.attachment_id.is_some() {
                            attachments.push(EmailAttachment {
                                id: body.attachment_id.clone().unwrap_or_else(|| 
                                    format!("att_{}", attachments.len())
                                ),
                                filename: part.filename.clone(),
                                content_type: part.mime_type.clone(),
                                size: body.size.map(|s| s as usize),
                                content_id: None,
                                is_inline: false,
                                data: Some(decoded),
                            });
                        }
                    }
                }
            }
        }

        // Process child parts
        if let Some(parts) = &part.parts {
            for child_part in parts {
                self.extract_gmail_parts_recursive(child_part, body_text, body_html, attachments)?;
            }
        }

        Ok(())
    }

    /// Parse email address
    fn parse_address(&self, addr_str: &str) -> Result<EmailAddress> {
        let trimmed = addr_str.trim();
        
        if let Some(start) = trimmed.rfind('<') {
            if let Some(end) = trimmed.rfind('>') {
                if start < end {
                    let email = trimmed[(start + 1)..end].trim().to_string();
                    let name = if start > 0 {
                        let name_part = trimmed[..start].trim();
                        let clean_name = name_part.trim_matches('"').trim();
                        if clean_name.is_empty() {
                            None
                        } else {
                            Some(clean_name.to_string())
                        }
                    } else {
                        None
                    };
                    return Ok(EmailAddress { email, name });
                }
            }
        }
        
        Ok(EmailAddress {
            email: trimmed.to_string(),
            name: None,
        })
    }

    /// Parse optional email address
    fn parse_optional_address(&self, addr_str: &str) -> Result<Option<EmailAddress>> {
        if addr_str.trim().is_empty() {
            Ok(None)
        } else {
            Ok(Some(self.parse_address(addr_str)?))
        }
    }

    /// Parse list of email addresses
    fn parse_address_list(&self, addr_list: &str) -> Vec<EmailAddress> {
        if addr_list.trim().is_empty() {
            return Vec::new();
        }

        // Split by comma, but be careful about commas inside quoted names
        let addresses = self.split_address_list(addr_list);
        addresses
            .into_iter()
            .filter_map(|addr| self.parse_address(&addr).ok())
            .collect()
    }

    /// Split address list respecting quoted names
    fn split_address_list(&self, addr_list: &str) -> Vec<String> {
        let mut addresses = Vec::new();
        let mut current = String::new();
        let mut in_quotes = false;
        let mut in_brackets = false;

        for ch in addr_list.chars() {
            match ch {
                '"' => {
                    in_quotes = !in_quotes;
                    current.push(ch);
                }
                '<' => {
                    in_brackets = true;
                    current.push(ch);
                }
                '>' => {
                    in_brackets = false;
                    current.push(ch);
                }
                ',' => {
                    if !in_quotes && !in_brackets {
                        if !current.trim().is_empty() {
                            addresses.push(current.trim().to_string());
                        }
                        current.clear();
                    } else {
                        current.push(ch);
                    }
                }
                _ => {
                    current.push(ch);
                }
            }
        }

        if !current.trim().is_empty() {
            addresses.push(current.trim().to_string());
        }

        addresses
    }

    /// Convert HTML to plain text
    pub fn html_to_text(&self, html: &str) -> String {
        // Basic HTML to text conversion
        // In a full implementation, you'd use a proper HTML parser
        html.replace("<br>", "\n")
            .replace("<br/>", "\n")
            .replace("<br />", "\n")
            .replace("<p>", "\n")
            .replace("</p>", "\n")
            .replace("<div>", "\n")
            .replace("</div>", "\n")
            .chars()
            .collect::<String>()
            .lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// Generate a snippet from parsed content as fallback
    fn generate_snippet(&self, api_snippet: &Option<String>, parsed_content: &ParsedEmail) -> String {
        // Check if Gmail API snippet is usable
        if let Some(snippet) = api_snippet {
            let cleaned_snippet = snippet.trim();
            
            // Skip if snippet is empty or contains error indicators
            if !cleaned_snippet.is_empty() 
                && !cleaned_snippet.to_lowercase().contains("invalid")
                && !cleaned_snippet.to_lowercase().contains("error")
                && !cleaned_snippet.to_lowercase().contains("failed")
                && cleaned_snippet.len() > 5  // Reasonable minimum length
            {
                return cleaned_snippet.to_string();
            }
        }

        // Generate snippet from parsed content
        let text_content = if let Some(text) = &parsed_content.body_text {
            text.clone()
        } else if let Some(html) = &parsed_content.body_html {
            self.html_to_text(html)
        } else {
            // No body content, use subject as fallback
            parsed_content.subject.clone().unwrap_or_else(|| "No content".to_string())
        };

        // Clean and truncate the snippet
        let cleaned_text = text_content
            .lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join(" ");

        let snippet = if cleaned_text.len() > 120 {
            format!("{}...", &cleaned_text[..120])
        } else {
            cleaned_text
        };

        if snippet.trim().is_empty() {
            "(No content preview)".to_string()
        } else {
            snippet
        }
    }

    /// Decode Base64 data with robust padding handling
    fn decode_base64_with_padding(&self, data: &str) -> Result<Vec<u8>> {
        // Clean the input data
        let cleaned_data = data.trim().replace('\n', "").replace('\r', "").replace(' ', "");
        
        // Try URL_SAFE_NO_PAD first (Gmail API standard)
        if let Ok(decoded) = general_purpose::URL_SAFE_NO_PAD.decode(&cleaned_data) {
            return Ok(decoded);
        }

        // Try with standard Base64 encoding
        if let Ok(decoded) = general_purpose::STANDARD.decode(&cleaned_data) {
            return Ok(decoded);
        }

        // Try adding padding
        let mut padded_data = cleaned_data.clone();
        while padded_data.len() % 4 != 0 {
            padded_data.push('=');
        }
        
        if let Ok(decoded) = general_purpose::URL_SAFE_NO_PAD.decode(&padded_data) {
            return Ok(decoded);
        }

        // Try standard with padding
        if let Ok(decoded) = general_purpose::STANDARD.decode(&padded_data) {
            return Ok(decoded);
        }

        // Try URL_SAFE with padding
        if let Ok(decoded) = general_purpose::URL_SAFE.decode(&padded_data) {
            return Ok(decoded);
        }

        // Try replacing URL-safe characters and decode as standard
        let standard_data = cleaned_data.replace('-', "+").replace('_', "/");
        if let Ok(decoded) = general_purpose::STANDARD.decode(&standard_data) {
            return Ok(decoded);
        }

        // Try standard with proper padding
        let mut standard_padded = standard_data;
        while standard_padded.len() % 4 != 0 {
            standard_padded.push('=');
        }
        if let Ok(decoded) = general_purpose::STANDARD.decode(&standard_padded) {
            return Ok(decoded);
        }

        // If it's empty or very short, return empty
        if cleaned_data.is_empty() || cleaned_data.len() < 4 {
            return Ok(Vec::new());
        }

        // All attempts failed, return a more detailed error
        Err(LibreOllamaError::Serialization {
            message: format!("Failed to decode base64 data after all attempts. Data length: {}, sample: '{}'", 
                cleaned_data.len(), 
                if cleaned_data.len() > 20 { &cleaned_data[..20] } else { &cleaned_data }
            ),
            data_type: "base64".to_string(),
        })
    }

    /// Make API request with detailed logging for debugging
    async fn make_api_request_with_logging(&self, account_id: &str, endpoint: &str) -> Result<String> {
        println!("🔍 [GMAIL-API] Making request to endpoint: {}", endpoint);
        
        // Get valid tokens for the account
        let tokens = self.auth_service
            .validate_and_refresh_tokens(&self.db_manager, account_id)
            .await?;

        let url = format!("{}/{}", GMAIL_API_BASE, endpoint.trim_start_matches('/'));
        println!("🔍 [GMAIL-API] Full URL: {}", url);
        
        // Create rate-limited request
        let batch_request = BatchRequest {
            id: format!("gmail_api_{}", Uuid::new_v4()),
            method: "GET".to_string(),
            url: url.clone(),
            headers: {
                let mut headers = std::collections::HashMap::new();
                headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));
                headers.insert("Accept".to_string(), "application/json".to_string());
                headers
            },
            body: None,
            priority: RequestPriority::Medium,
            created_at: chrono::Utc::now().to_rfc3339(),
            max_retries: 3,
            current_retry: 0,
        };

        // Execute request through rate limiter
        let response = {
            let mut rate_limiter = self.rate_limiter.lock().await;
            rate_limiter.execute_request(batch_request).await
                .map_err(|e| LibreOllamaError::Network {
                    message: format!("Rate limited Gmail API request failed: {}", e),
                    url: Some(url.clone()),
                })?
        };

        println!("🔍 [GMAIL-API] Response status: {}", response.status_code);
        println!("🔍 [GMAIL-API] Response body preview: {}", response.body.chars().take(300).collect::<String>());

        // Parse response
        if response.status_code != 200 {
            return Err(LibreOllamaError::GmailApi {
                message: format!("Gmail API error: {} - {}", response.status_code, response.body),
                status_code: Some(response.status_code as u16),
            });
        }

        Ok(response.body)
    }
} 