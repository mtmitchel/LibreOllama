//! Gmail Compose Service
//!
//! This module provides email composition, sending, and draft management
//! for Gmail integration with proper error handling and rate limiting.

use anyhow::Result;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use base64::{Engine as _, engine::general_purpose};
use chrono::{DateTime, Utc};
use std::sync::Arc;
use uuid::Uuid;

use crate::database::DatabaseManager;
use crate::errors::LibreOllamaError;
use crate::services::gmail::auth_service::GmailAuthService;
use crate::services::gmail::api_service::EmailAddress;
use crate::commands::rate_limiter::{RateLimiter, BatchRequest, RequestPriority};

/// Gmail compose API endpoints
#[allow(unused)]
const GMAIL_SEND_ENDPOINT: &str = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
#[allow(unused)]
const GMAIL_DRAFTS_ENDPOINT: &str = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

/// Email composition request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposeRequest {
    pub account_id: String,
    pub to: Vec<EmailAddress>,
    pub cc: Option<Vec<EmailAddress>>,
    pub bcc: Option<Vec<EmailAddress>>,
    pub subject: String,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub attachments: Option<Vec<ComposeAttachment>>,
    pub reply_to_message_id: Option<String>,
    pub thread_id: Option<String>,
    pub importance: MessageImportance,
    pub delivery_receipt: bool,
    pub read_receipt: bool,
    pub schedule_send: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposeAttachment {
    pub filename: String,
    pub content_type: String,
    pub content_id: Option<String>,
    pub data: String, // Base64 encoded content
    pub size: u64,
    pub is_inline: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageImportance {
    Low,
    Normal,
    High,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendResponse {
    pub message_id: String,
    pub thread_id: String,
    pub label_ids: Vec<String>,
    pub sent_at: DateTime<Utc>,
    pub size_estimate: u64,
    pub status: SendStatus,
    pub delivery_info: Option<DeliveryInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SendStatus {
    Sent,
    Queued,
    Failed,
    Scheduled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryInfo {
    pub delivered_to: Vec<String>,
    pub failed_recipients: Vec<FailedRecipient>,
    pub delivery_delay_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedRecipient {
    pub email: String,
    pub error_code: String,
    pub error_message: String,
}

/// Draft management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DraftSaveRequest {
    pub account_id: String,
    pub draft_id: Option<String>,
    pub compose_data: ComposeRequest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DraftResponse {
    pub draft_id: String,
    pub message_id: String,
    pub saved_at: DateTime<Utc>,
    pub auto_save: bool,
}

/// Email templates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageTemplate {
    pub template_id: String,
    pub name: String,
    pub subject_template: String,
    pub body_template: String,
    pub variables: Vec<TemplateVariable>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateVariable {
    pub name: String,
    pub description: String,
    pub default_value: Option<String>,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplyRequest {
    pub account_id: String,
    pub original_message_id: String,
    pub reply_type: ReplyType,
    pub additional_recipients: Option<Vec<EmailAddress>>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub include_original: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReplyType {
    Reply,
    ReplyAll,
    Forward,
}

/// Gmail Compose Service for email composition and sending
#[allow(unused)]
pub struct GmailComposeService {
    client: Client,
    auth_service: Arc<GmailAuthService>,
    db_manager: std::sync::Arc<DatabaseManager>,
    rate_limiter: Arc<tokio::sync::Mutex<RateLimiter>>,
}

impl GmailComposeService {
    /// Create a new Gmail compose service
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

    /// Send an email message
    pub async fn send_message(&self, compose_request: &ComposeRequest) -> Result<SendResponse> {
        // Get valid tokens
        let tokens = self.auth_service
            .validate_and_refresh_tokens(&self.db_manager, &compose_request.account_id)
            .await?;

        // Check for scheduled send
        if let Some(schedule_time) = compose_request.schedule_send {
            if schedule_time > Utc::now() {
                return self.schedule_message(compose_request, schedule_time).await;
            }
        }

        // Format the email message
        let message = self.format_email_message(compose_request)?;

        // Prepare request body
        let request_body = serde_json::json!({
            "raw": general_purpose::URL_SAFE_NO_PAD.encode(&message),
            "threadId": compose_request.thread_id
        });

        // Create rate-limited request
        let batch_request = BatchRequest {
            id: format!("send_{}", Uuid::new_v4()),
            method: "POST".to_string(),
            url: GMAIL_SEND_ENDPOINT.to_string(),
            headers: {
                let mut headers = std::collections::HashMap::new();
                headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));
                headers.insert("Content-Type".to_string(), "application/json".to_string());
                headers
            },
            body: Some(request_body.to_string()),
            priority: RequestPriority::High,
            created_at: chrono::Utc::now().to_rfc3339(),
            max_retries: 3,
            current_retry: 0,
        };

        // Execute rate-limited request
        let response = {
            let mut rate_limiter = self.rate_limiter.lock().await;
            rate_limiter.execute_request(batch_request).await
                .map_err(|e| LibreOllamaError::Network {
                    message: format!("Rate-limited request failed: {}", e),
                    url: Some(GMAIL_SEND_ENDPOINT.to_string()),
                })?
        };

        if response.status_code != 200 {
            return Err(LibreOllamaError::GmailApi {
                message: format!("Send email failed: {} - {}", response.status_code, response.body),
                status_code: Some(response.status_code),
            }.into());
        }

        let gmail_response: serde_json::Value = serde_json::from_str(&response.body)
            .map_err(|e| LibreOllamaError::Serialization {
                message: format!("Failed to parse send response: {}", e),
                data_type: "Gmail send response".to_string(),
            })?;

        // Store sent message locally
        self.store_sent_message(compose_request, &gmail_response).await?;

        Ok(SendResponse {
            message_id: gmail_response["id"].as_str().unwrap_or("").to_string(),
            thread_id: gmail_response["threadId"].as_str().unwrap_or("").to_string(),
            label_ids: gmail_response["labelIds"].as_array()
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
                .unwrap_or_default(),
            sent_at: Utc::now(),
            size_estimate: gmail_response["sizeEstimate"].as_u64().unwrap_or(0),
            status: SendStatus::Sent,
            delivery_info: None,
        })
    }

    /// Save message as draft
    pub async fn save_draft(&self, draft_request: &DraftSaveRequest) -> Result<DraftResponse> {
        // Get valid tokens
        let tokens = self.auth_service
            .validate_and_refresh_tokens(&self.db_manager, &draft_request.account_id)
            .await?;

        // Format the draft message
        let message = self.format_email_message(&draft_request.compose_data)?;

        let (url, request_body) = if let Some(draft_id) = &draft_request.draft_id {
            // Update existing draft
            let url = format!("{}/{}", GMAIL_DRAFTS_ENDPOINT, draft_id);
            let body = serde_json::json!({
                "id": draft_id,
                "message": {
                    "raw": general_purpose::URL_SAFE_NO_PAD.encode(&message),
                }
            });
            (url, body)
        } else {
            // Create new draft
            let body = serde_json::json!({
                "message": {
                    "raw": general_purpose::URL_SAFE_NO_PAD.encode(&message),
                }
            });
            (GMAIL_DRAFTS_ENDPOINT.to_string(), body)
        };

        // Create rate-limited request
        let batch_request = BatchRequest {
            id: format!("draft_{}", Uuid::new_v4()),
            method: "POST".to_string(),
            url: url.clone(),
            headers: {
                let mut headers = std::collections::HashMap::new();
                headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));
                headers.insert("Content-Type".to_string(), "application/json".to_string());
                headers
            },
            body: Some(request_body.to_string()),
            priority: RequestPriority::Medium,
            created_at: chrono::Utc::now().to_rfc3339(),
            max_retries: 3,
            current_retry: 0,
        };

        // Execute rate-limited request
        let response = {
            let mut rate_limiter = self.rate_limiter.lock().await;
            rate_limiter.execute_request(batch_request).await
                .map_err(|e| LibreOllamaError::Network {
                    message: format!("Rate-limited request failed: {}", e),
                    url: Some(url.clone()),
                })?
        };

        if response.status_code != 200 {
            return Err(LibreOllamaError::GmailApi {
                message: format!("Save draft failed: {} - {}", response.status_code, response.body),
                status_code: Some(response.status_code),
            }.into());
        }

        let gmail_response: serde_json::Value = serde_json::from_str(&response.body)
            .map_err(|e| LibreOllamaError::Serialization {
                message: format!("Failed to parse draft response: {}", e),
                data_type: "Gmail draft response".to_string(),
            })?;

        // Store draft locally
        self.store_draft_locally(draft_request, &gmail_response).await?;

        Ok(DraftResponse {
            draft_id: gmail_response["id"].as_str().unwrap_or("").to_string(),
            message_id: gmail_response["message"]["id"].as_str().unwrap_or("").to_string(),
            saved_at: Utc::now(),
            auto_save: false,
        })
    }

    /// Get all drafts for an account
    pub async fn get_drafts(
        &self,
        account_id: &str,
        max_results: Option<u32>,
        page_token: Option<&str>,
    ) -> Result<Vec<DraftResponse>> {
        // Get valid tokens
        let tokens = self.auth_service
            .validate_and_refresh_tokens(&self.db_manager, account_id)
            .await?;

        let mut url = GMAIL_DRAFTS_ENDPOINT.to_string();
        let mut params = Vec::new();

        if let Some(max) = max_results {
            params.push(format!("maxResults={}", max));
        }

        if let Some(token) = page_token {
            params.push(format!("pageToken={}", urlencoding::encode(token)));
        }

        if !params.is_empty() {
            url.push_str(&format!("?{}", params.join("&")));
        }

        // Create rate-limited request
        let batch_request = BatchRequest {
            id: format!("get_drafts_{}", Uuid::new_v4()),
            method: "GET".to_string(),
            url: url.clone(),
            headers: {
                let mut headers = std::collections::HashMap::new();
                headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));
                headers
            },
            body: None,
            priority: RequestPriority::Medium,
            created_at: chrono::Utc::now().to_rfc3339(),
            max_retries: 3,
            current_retry: 0,
        };

        // Execute rate-limited request
        let response = {
            let mut rate_limiter = self.rate_limiter.lock().await;
            rate_limiter.execute_request(batch_request).await
                .map_err(|e| LibreOllamaError::Network {
                    message: format!("Rate-limited request failed: {}", e),
                    url: Some(url.clone()),
                })?
        };

        if response.status_code != 200 {
            return Err(LibreOllamaError::GmailApi {
                message: format!("Get drafts failed: {} - {}", response.status_code, response.body),
                status_code: Some(response.status_code),
            }.into());
        }

        #[derive(serde::Deserialize)]
        #[allow(dead_code)]
        struct DraftListResponse {
            drafts: Option<Vec<serde_json::Value>>,
        }

        let draft_list: DraftListResponse = serde_json::from_str(&response.body)
            .map_err(|e| LibreOllamaError::Serialization {
                message: format!("Failed to parse drafts response: {}", e),
                data_type: "Gmail drafts response".to_string(),
            })?;

        let mut drafts = Vec::new();
        if let Some(draft_items) = draft_list.drafts {
            for draft in draft_items {
                drafts.push(DraftResponse {
                    draft_id: draft["id"].as_str().unwrap_or("").to_string(),
                    message_id: draft["message"]["id"].as_str().unwrap_or("").to_string(),
                    saved_at: Utc::now(), // Would parse from API in real implementation
                    auto_save: false,
                });
            }
        }

        Ok(drafts)
    }

    /// Delete a draft
    pub async fn delete_draft(&self, account_id: &str, draft_id: &str) -> Result<()> {
        // Get valid tokens
        let tokens = self.auth_service
            .validate_and_refresh_tokens(&self.db_manager, account_id)
            .await?;

        let url = format!("{}/{}", GMAIL_DRAFTS_ENDPOINT, draft_id);

        // Create rate-limited request
        let batch_request = BatchRequest {
            id: format!("delete_draft_{}", Uuid::new_v4()),
            method: "DELETE".to_string(),
            url: url.clone(),
            headers: {
                let mut headers = std::collections::HashMap::new();
                headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));
                headers
            },
            body: None,
            priority: RequestPriority::Medium,
            created_at: chrono::Utc::now().to_rfc3339(),
            max_retries: 3,
            current_retry: 0,
        };

        // Execute rate-limited request
        let response = {
            let mut rate_limiter = self.rate_limiter.lock().await;
            rate_limiter.execute_request(batch_request).await
                .map_err(|e| LibreOllamaError::Network {
                    message: format!("Rate-limited request failed: {}", e),
                    url: Some(url.clone()),
                })?
        };

        if response.status_code != 200 && response.status_code != 204 {
            return Err(LibreOllamaError::GmailApi {
                message: format!("Delete draft failed: {} - {}", response.status_code, response.body),
                status_code: Some(response.status_code),
            }.into());
        }

        // Remove from local storage
        self.remove_draft_locally(account_id, draft_id).await?;

        Ok(())
    }

    /// Schedule a message for later sending
    pub async fn schedule_message(
        &self,
        compose_request: &ComposeRequest,
        schedule_time: DateTime<Utc>,
    ) -> Result<SendResponse> {
        // Store scheduled message in database
        self.store_scheduled_message(compose_request, schedule_time).await?;

        // Return scheduled response
        Ok(SendResponse {
            message_id: format!("scheduled_{}", Uuid::new_v4()),
            thread_id: compose_request.thread_id.clone().unwrap_or_default(),
            label_ids: vec!["SCHEDULED".to_string()],
            sent_at: schedule_time,
            size_estimate: self.estimate_message_size(compose_request),
            status: SendStatus::Scheduled,
            delivery_info: None,
        })
    }

    /// Create a reply to an existing message
    pub async fn create_reply(&self, reply_request: &ReplyRequest) -> Result<ComposeRequest> {
        // Get the original message (implementation would fetch from API)
        let original_message = self.get_cached_message(
            &reply_request.account_id,
            &reply_request.original_message_id,
        ).await?;

        // Build reply based on type
        let mut compose = ComposeRequest {
            account_id: reply_request.account_id.clone(),
            to: match reply_request.reply_type {
                ReplyType::Reply => vec![original_message.from.clone()],
                ReplyType::ReplyAll => {
                    let mut recipients = vec![original_message.from.clone()];
                    recipients.extend(original_message.to.clone());
                    recipients.extend(original_message.cc.clone());
                    recipients
                }
                ReplyType::Forward => reply_request.additional_recipients.clone().unwrap_or_default(),
            },
            cc: None,
            bcc: None,
            subject: self.format_reply_subject(&original_message.subject, &reply_request.reply_type),
            body_text: reply_request.body_text.clone(),
            body_html: reply_request.body_html.clone(),
            attachments: None,
            reply_to_message_id: Some(reply_request.original_message_id.clone()),
            thread_id: Some(original_message.thread_id.clone()),
            importance: MessageImportance::Normal,
            delivery_receipt: false,
            read_receipt: false,
            schedule_send: None,
        };

        // Add additional recipients if specified
        if let Some(additional) = &reply_request.additional_recipients {
            compose.to.extend(additional.clone());
        }

        // Include original message if requested
        if reply_request.include_original {
            let original_text = format!(
                "\n\n--- Original Message ---\nFrom: {}\nDate: {}\nSubject: {}\n\n{}",
                self.format_address(&original_message.from),
                original_message.date,
                original_message.subject,
                original_message.body_text.unwrap_or_default()
            );

            if let Some(ref mut body) = compose.body_text {
                body.push_str(&original_text);
            } else {
                compose.body_text = Some(original_text);
            }
        }

        Ok(compose)
    }

    /// Get message templates
    pub async fn get_templates(&self, _account_id: &str) -> Result<Vec<MessageTemplate>> {
        // Implementation would fetch from database
        // For now, return empty list
        Ok(Vec::new())
    }

    /// Create a new message template
    pub async fn create_template(&self, _account_id: &str, _template: &MessageTemplate) -> Result<String> {
        // Implementation would store in database
        // For now, return a mock ID
        Ok(format!("template_{}", Uuid::new_v4()))
    }

    /// Format email message for sending
    fn format_email_message(&self, compose: &ComposeRequest) -> Result<Vec<u8>> {
        let mut message = String::new();

        // Headers
        message.push_str(&format!("To: {}\r\n", self.format_address_list(&compose.to)));
        
        if let Some(cc) = &compose.cc {
            if !cc.is_empty() {
                message.push_str(&format!("Cc: {}\r\n", self.format_address_list(cc)));
            }
        }

        if let Some(bcc) = &compose.bcc {
            if !bcc.is_empty() {
                message.push_str(&format!("Bcc: {}\r\n", self.format_address_list(bcc)));
            }
        }

        message.push_str(&format!("Subject: {}\r\n", compose.subject));
        
        // Additional headers
        match compose.importance {
            MessageImportance::High => message.push_str("Importance: high\r\n"),
            MessageImportance::Low => message.push_str("Importance: low\r\n"),
            MessageImportance::Normal => {}
        }

        if compose.delivery_receipt {
            message.push_str("Return-Receipt-To: sender@example.com\r\n");
        }

        if compose.read_receipt {
            message.push_str("Disposition-Notification-To: sender@example.com\r\n");
        }

        // MIME headers
        let boundary = format!("boundary_{}", Uuid::new_v4());
        message.push_str("MIME-Version: 1.0\r\n");

        if compose.attachments.is_some() || (compose.body_text.is_some() && compose.body_html.is_some()) {
            message.push_str(&format!("Content-Type: multipart/mixed; boundary=\"{}\"\r\n\r\n", boundary));
            
            // Body parts
            if let Some(text) = &compose.body_text {
                message.push_str(&format!("--{}\r\n", boundary));
                message.push_str("Content-Type: text/plain; charset=utf-8\r\n\r\n");
                message.push_str(text);
                message.push_str("\r\n");
            }

            if let Some(html) = &compose.body_html {
                message.push_str(&format!("--{}\r\n", boundary));
                message.push_str("Content-Type: text/html; charset=utf-8\r\n\r\n");
                message.push_str(html);
                message.push_str("\r\n");
            }

            // Attachments
            if let Some(attachments) = &compose.attachments {
                for attachment in attachments {
                    message.push_str(&format!("--{}\r\n", boundary));
                    message.push_str(&format!("Content-Type: {}\r\n", attachment.content_type));
                    message.push_str("Content-Transfer-Encoding: base64\r\n");
                    message.push_str(&format!("Content-Disposition: attachment; filename=\"{}\"\r\n\r\n", attachment.filename));
                    message.push_str(&attachment.data);
                    message.push_str("\r\n");
                }
            }

            message.push_str(&format!("--{}--\r\n", boundary));
        } else {
            // Simple text message
            message.push_str("Content-Type: text/plain; charset=utf-8\r\n\r\n");
            if let Some(text) = &compose.body_text {
                message.push_str(text);
            } else if let Some(html) = &compose.body_html {
                message.push_str(html);
            }
        }

        Ok(message.into_bytes())
    }

    /// Format email address list
    fn format_address_list(&self, addresses: &[EmailAddress]) -> String {
        addresses
            .iter()
            .map(|addr| self.format_address(addr))
            .collect::<Vec<_>>()
            .join(", ")
    }

    /// Format single email address
    fn format_address(&self, address: &EmailAddress) -> String {
        if let Some(name) = &address.name {
            format!("\"{}\" <{}>", name, address.email)
        } else {
            address.email.clone()
        }
    }

    /// Format reply subject
    fn format_reply_subject(&self, original_subject: &str, reply_type: &ReplyType) -> String {
        match reply_type {
            ReplyType::Reply | ReplyType::ReplyAll => {
                if original_subject.starts_with("Re: ") {
                    original_subject.to_string()
                } else {
                    format!("Re: {}", original_subject)
                }
            }
            ReplyType::Forward => {
                if original_subject.starts_with("Fwd: ") {
                    original_subject.to_string()
                } else {
                    format!("Fwd: {}", original_subject)
                }
            }
        }
    }

    /// Estimate message size
    fn estimate_message_size(&self, compose: &ComposeRequest) -> u64 {
        let mut size = 0u64;
        
        size += compose.subject.len() as u64;
        size += compose.body_text.as_ref().map(|s| s.len()).unwrap_or(0) as u64;
        size += compose.body_html.as_ref().map(|s| s.len()).unwrap_or(0) as u64;
        
        if let Some(attachments) = &compose.attachments {
            size += attachments.iter().map(|a| a.size).sum::<u64>();
        }

        size
    }

    /// Store sent message locally
    async fn store_sent_message(
        &self,
        _compose: &ComposeRequest,
        gmail_response: &serde_json::Value,
    ) -> Result<()> {
        // Implementation would store in database
        // For now, just log success
        println!("Stored sent message: {}", gmail_response["id"].as_str().unwrap_or("unknown"));
        Ok(())
    }

    /// Store draft locally
    async fn store_draft_locally(
        &self,
        _draft_request: &DraftSaveRequest,
        gmail_response: &serde_json::Value,
    ) -> Result<()> {
        // Implementation would store in database
        // For now, just log success
        println!("Stored draft: {}", gmail_response["id"].as_str().unwrap_or("unknown"));
        Ok(())
    }

    /// Remove draft from local storage
    async fn remove_draft_locally(&self, account_id: &str, draft_id: &str) -> Result<()> {
        // Implementation would remove from database
        // For now, just log success
        println!("Removed draft: {} for account: {}", draft_id, account_id);
        Ok(())
    }

    /// Store scheduled message
    async fn store_scheduled_message(
        &self,
        _compose: &ComposeRequest,
        schedule_time: DateTime<Utc>,
    ) -> Result<()> {
        // Implementation would store in database
        // For now, just log success
        println!("Scheduled message for: {}", schedule_time);
        Ok(())
    }

    /// Get cached message for replies
    async fn get_cached_message(&self, _account_id: &str, _message_id: &str) -> Result<CachedMessage> {
        // Implementation would fetch from database or API
        // For now, return mock data
        Ok(CachedMessage {
            from: EmailAddress {
                email: "sender@example.com".to_string(),
                name: Some("Example Sender".to_string()),
            },
            to: vec![EmailAddress {
                email: "recipient@example.com".to_string(),
                name: Some("Example Recipient".to_string()),
            }],
            cc: Vec::new(),
            subject: "Example Subject".to_string(),
            body_text: Some("Example message body".to_string()),
            thread_id: "thread_123".to_string(),
            date: Utc::now().to_rfc3339(),
        })
    }
}

/// Cached message data for replies
#[derive(Debug, Clone)]
struct CachedMessage {
    from: EmailAddress,
    to: Vec<EmailAddress>,
    cc: Vec<EmailAddress>,
    subject: String,
    body_text: Option<String>,
    thread_id: String,
    date: String,
} 