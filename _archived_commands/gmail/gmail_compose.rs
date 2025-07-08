use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{command, State};
use anyhow::Result;
// use reqwest::Client; // Will be used when implementing actual Gmail API calls
use base64::{engine::general_purpose, Engine as _};
use rusqlite::OptionalExtension;

use crate::database::connection::DatabaseManager;
use crate::commands::token_storage::get_gmail_tokens;
use crate::commands::rate_limiter::{execute_rate_limited_request, RequestPriority};

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
    pub schedule_send: Option<String>, // ISO 8601 timestamp
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAddress {
    pub email: String,
    pub name: Option<String>,
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
    pub sent_at: String,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DraftSaveRequest {
    pub account_id: String,
    pub draft_id: Option<String>, // None for new draft, Some for updating existing
    pub compose_data: ComposeRequest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DraftResponse {
    pub draft_id: String,
    pub message_id: String,
    pub saved_at: String,
    pub auto_save: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageTemplate {
    pub template_id: String,
    pub name: String,
    pub subject_template: String,
    pub body_template: String,
    pub variables: Vec<TemplateVariable>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateVariable {
    pub name: String,
    pub description: String,
    pub default_value: Option<String>,
    pub required: bool,
}

/// Send an email through Gmail API
#[command]
pub async fn send_gmail_message(
    compose_request: ComposeRequest,
    db_manager: State<'_, DatabaseManager>,
) -> Result<SendResponse, String> {
    // Get authentication tokens
    let tokens = get_gmail_tokens(compose_request.account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get authentication tokens: {}", e))?
        .ok_or_else(|| "No valid tokens found for account".to_string())?;

    // Format the email message
    let message = format_email_message(&compose_request)
        .map_err(|e| format!("Failed to format email message: {}", e))?;

    // Prepare Gmail API request
    let mut headers = HashMap::new();
    headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));
    headers.insert("Content-Type".to_string(), "application/json".to_string());

    let request_body = serde_json::json!({
        "raw": general_purpose::STANDARD.encode(&message),
        "threadId": compose_request.thread_id
    });

    // Send through rate-limited API
    let response = execute_rate_limited_request(
        "POST".to_string(),
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send".to_string(),
        headers,
        Some(request_body.to_string()),
        RequestPriority::High,
    ).await.map_err(|e| format!("Failed to send email: {}", e))?;

    // Parse response
    let gmail_response: serde_json::Value = serde_json::from_str(&response.body)
        .map_err(|e| format!("Failed to parse Gmail response: {}", e))?;

    // Store sent message in local cache if successful
    if response.status_code == 200 {
        store_sent_message(&compose_request, &gmail_response, &db_manager).await?;
    }

    Ok(SendResponse {
        message_id: gmail_response["id"].as_str().unwrap_or("").to_string(),
        thread_id: gmail_response["threadId"].as_str().unwrap_or("").to_string(),
        label_ids: gmail_response["labelIds"].as_array()
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
            .unwrap_or_default(),
        sent_at: chrono::Utc::now().to_rfc3339(),
        size_estimate: gmail_response["sizeEstimate"].as_u64().unwrap_or(0),
        status: SendStatus::Sent,
        delivery_info: None, // Would be populated in production with actual delivery tracking
    })
}

/// Save email as draft
#[command]
pub async fn save_gmail_draft(
    draft_request: DraftSaveRequest,
    db_manager: State<'_, DatabaseManager>,
) -> Result<DraftResponse, String> {
    // Get authentication tokens
    let tokens = get_gmail_tokens(draft_request.account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get authentication tokens: {}", e))?
        .ok_or_else(|| "No valid tokens found for account".to_string())?;

    // Format the draft message
    let message = format_email_message(&draft_request.compose_data)
        .map_err(|e| format!("Failed to format draft message: {}", e))?;

    // Prepare Gmail API request
    let mut headers = HashMap::new();
    headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));
    headers.insert("Content-Type".to_string(), "application/json".to_string());

    let request_body = if let Some(draft_id) = &draft_request.draft_id {
        // Update existing draft
        serde_json::json!({
            "id": draft_id,
            "message": {
                "raw": general_purpose::STANDARD.encode(&message),
                "threadId": draft_request.compose_data.thread_id
            }
        })
    } else {
        // Create new draft
        serde_json::json!({
            "message": {
                "raw": general_purpose::STANDARD.encode(&message),
                "threadId": draft_request.compose_data.thread_id
            }
        })
    };

    let url = if draft_request.draft_id.is_some() {
        format!("https://gmail.googleapis.com/gmail/v1/users/me/drafts/{}", 
                draft_request.draft_id.as_ref().unwrap())
    } else {
        "https://gmail.googleapis.com/gmail/v1/users/me/drafts".to_string()
    };

    let method = if draft_request.draft_id.is_some() { "PUT" } else { "POST" };

    // Send through rate-limited API
    let response = execute_rate_limited_request(
        method.to_string(),
        url,
        headers,
        Some(request_body.to_string()),
        RequestPriority::Medium,
    ).await.map_err(|e| format!("Failed to save draft: {}", e))?;

    // Parse response
    let gmail_response: serde_json::Value = serde_json::from_str(&response.body)
        .map_err(|e| format!("Failed to parse Gmail response: {}", e))?;

    // Store draft in local cache
    if response.status_code == 200 {
        store_draft_locally(&draft_request, &gmail_response, &db_manager).await?;
    }

    Ok(DraftResponse {
        draft_id: gmail_response["id"].as_str().unwrap_or("").to_string(),
        message_id: gmail_response["message"]["id"].as_str().unwrap_or("").to_string(),
        saved_at: chrono::Utc::now().to_rfc3339(),
        auto_save: false,
    })
}

/// Get drafts for an account
#[command]
pub async fn get_gmail_drafts(
    account_id: String,
    max_results: Option<u32>,
    page_token: Option<String>,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Vec<DraftResponse>, String> {
    // Get authentication tokens
    let tokens = get_gmail_tokens(account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get authentication tokens: {}", e))?
        .ok_or_else(|| "No valid tokens found for account".to_string())?;

    // Prepare Gmail API request
    let mut headers = HashMap::new();
    headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));

    let mut url = "https://gmail.googleapis.com/gmail/v1/users/me/drafts".to_string();
    let mut query_params = Vec::new();
    
    if let Some(max) = max_results {
        query_params.push(format!("maxResults={}", max));
    }
    if let Some(token) = page_token {
        query_params.push(format!("pageToken={}", token));
    }
    
    if !query_params.is_empty() {
        url = format!("{}?{}", url, query_params.join("&"));
    }

    // Send through rate-limited API
    let response = execute_rate_limited_request(
        "GET".to_string(),
        url,
        headers,
        None,
        RequestPriority::Medium,
    ).await.map_err(|e| format!("Failed to get drafts: {}", e))?;

    // Parse response
    let gmail_response: serde_json::Value = serde_json::from_str(&response.body)
        .map_err(|e| format!("Failed to parse Gmail response: {}", e))?;

    let empty_vec = Vec::new();
    let drafts = gmail_response["drafts"].as_array().unwrap_or(&empty_vec);
    let mut draft_responses = Vec::new();

    for draft in drafts {
        draft_responses.push(DraftResponse {
            draft_id: draft["id"].as_str().unwrap_or("").to_string(),
            message_id: draft["message"]["id"].as_str().unwrap_or("").to_string(),
            saved_at: chrono::Utc::now().to_rfc3339(), // Would be actual timestamp in production
            auto_save: false,
        });
    }

    Ok(draft_responses)
}

/// Delete a draft
#[command]
pub async fn delete_gmail_draft(
    account_id: String,
    draft_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<bool, String> {
    // Get authentication tokens
    let tokens = get_gmail_tokens(account_id.clone(), db_manager.clone()).await
        .map_err(|e| format!("Failed to get authentication tokens: {}", e))?
        .ok_or_else(|| "No valid tokens found for account".to_string())?;

    // Prepare Gmail API request
    let mut headers = HashMap::new();
    headers.insert("Authorization".to_string(), format!("Bearer {}", tokens.access_token));

    let url = format!("https://gmail.googleapis.com/gmail/v1/users/me/drafts/{}", draft_id);

    // Send through rate-limited API
    let response = execute_rate_limited_request(
        "DELETE".to_string(),
        url,
        headers,
        None,
        RequestPriority::Medium,
    ).await.map_err(|e| format!("Failed to delete draft: {}", e))?;

    // Remove from local cache
    if response.status_code == 204 {
        remove_draft_locally(&account_id, &draft_id, &db_manager).await?;
        Ok(true)
    } else {
        Ok(false)
    }
}

/// Send scheduled email
#[command]
pub async fn schedule_gmail_message(
    compose_request: ComposeRequest,
    schedule_time: String, // ISO 8601 timestamp
    db_manager: State<'_, DatabaseManager>,
) -> Result<SendResponse, String> {
    // For now, we'll store the scheduled message locally and implement actual scheduling
    // In production, this would integrate with Gmail's scheduled send feature
    
    // Validate schedule time
    let schedule_dt = chrono::DateTime::parse_from_rfc3339(&schedule_time)
        .map_err(|e| format!("Invalid schedule time format: {}", e))?;
    
    if schedule_dt <= chrono::Utc::now() {
        return Err("Schedule time must be in the future".to_string());
    }

    // Store scheduled message
    store_scheduled_message(&compose_request, &schedule_time, &db_manager).await?;

    Ok(SendResponse {
        message_id: format!("scheduled_{}", uuid::Uuid::new_v4()),
        thread_id: compose_request.thread_id.clone().unwrap_or_default(),
        label_ids: vec!["SCHEDULED".to_string()],
        sent_at: schedule_time,
        size_estimate: estimate_message_size(&compose_request),
        status: SendStatus::Scheduled,
        delivery_info: None,
    })
}

/// Get message templates
#[command]
pub async fn get_message_templates(
    _account_id: String,
    _db_manager: State<'_, DatabaseManager>,
) -> Result<Vec<MessageTemplate>, String> {
    // In production, this would fetch from database or API
    Ok(vec![
        MessageTemplate {
            template_id: "meeting_invite".to_string(),
            name: "Meeting Invitation".to_string(),
            subject_template: "Meeting: {{meeting_title}} - {{date}}".to_string(),
            body_template: "Hi {{recipient_name}},\n\nYou're invited to attend {{meeting_title}} on {{date}} at {{time}}.\n\nLocation: {{location}}\nDuration: {{duration}}\n\nBest regards,\n{{sender_name}}".to_string(),
            variables: vec![
                TemplateVariable {
                    name: "meeting_title".to_string(),
                    description: "Title of the meeting".to_string(),
                    default_value: None,
                    required: true,
                },
                TemplateVariable {
                    name: "recipient_name".to_string(),
                    description: "Name of the recipient".to_string(),
                    default_value: None,
                    required: true,
                },
                TemplateVariable {
                    name: "date".to_string(),
                    description: "Meeting date".to_string(),
                    default_value: None,
                    required: true,
                },
                TemplateVariable {
                    name: "time".to_string(),
                    description: "Meeting time".to_string(),
                    default_value: None,
                    required: true,
                },
                TemplateVariable {
                    name: "location".to_string(),
                    description: "Meeting location".to_string(),
                    default_value: Some("Virtual/Online".to_string()),
                    required: false,
                },
            ],
        },
        MessageTemplate {
            template_id: "follow_up".to_string(),
            name: "Follow Up".to_string(),
            subject_template: "Following up on {{subject}}".to_string(),
            body_template: "Hi {{recipient_name}},\n\nI wanted to follow up on {{subject}}.\n\n{{follow_up_message}}\n\nLet me know if you have any questions.\n\nBest regards,\n{{sender_name}}".to_string(),
            variables: vec![
                TemplateVariable {
                    name: "recipient_name".to_string(),
                    description: "Name of the recipient".to_string(),
                    default_value: None,
                    required: true,
                },
                TemplateVariable {
                    name: "subject".to_string(),
                    description: "Subject being followed up on".to_string(),
                    default_value: None,
                    required: true,
                },
                TemplateVariable {
                    name: "follow_up_message".to_string(),
                    description: "Specific follow-up message".to_string(),
                    default_value: None,
                    required: true,
                },
            ],
        },
    ])
}

/// Format reply or forward message
#[command]
pub async fn format_reply_message(
    account_id: String,
    original_message_id: String,
    reply_type: String, // "reply", "reply_all", or "forward"
    additional_recipients: Option<Vec<EmailAddress>>,
    db_manager: State<'_, DatabaseManager>,
) -> Result<ComposeRequest, String> {
    // Get the original message from cache or API
    let original_message = get_cached_message(&account_id, &original_message_id, &db_manager).await?;
    
    let mut compose_request = ComposeRequest {
        account_id,
        to: Vec::new(),
        cc: None,
        bcc: None,
        subject: String::new(),
        body_text: None,
        body_html: None,
        attachments: None,
        reply_to_message_id: Some(original_message_id.clone()),
        thread_id: Some(original_message.thread_id.clone()),
        importance: MessageImportance::Normal,
        delivery_receipt: false,
        read_receipt: false,
        schedule_send: None,
    };

    match reply_type.as_str() {
        "reply" => {
            compose_request.to = vec![original_message.from.clone()];
            compose_request.subject = if original_message.subject.starts_with("Re: ") {
                original_message.subject.clone()
            } else {
                format!("Re: {}", original_message.subject)
            };
        },
        "reply_all" => {
            compose_request.to = vec![original_message.from.clone()];
            compose_request.to.extend(original_message.to.clone());
            compose_request.cc = if !original_message.cc.is_empty() {
                Some(original_message.cc.clone())
            } else {
                None
            };
            compose_request.subject = if original_message.subject.starts_with("Re: ") {
                original_message.subject.clone()
            } else {
                format!("Re: {}", original_message.subject)
            };
        },
        "forward" => {
            if let Some(recipients) = additional_recipients {
                compose_request.to = recipients;
            }
            compose_request.subject = if original_message.subject.starts_with("Fwd: ") {
                original_message.subject.clone()
            } else {
                format!("Fwd: {}", original_message.subject)
            };
            
            // Include original message content
            let forwarded_content = format!(
                "\n\n---------- Forwarded message ----------\nFrom: {} <{}>\nDate: {}\nSubject: {}\nTo: {}\n\n{}",
                original_message.from.name.as_ref().unwrap_or(&"".to_string()),
                original_message.from.email,
                original_message.date,
                original_message.subject,
                original_message.to.iter()
                    .map(|addr| format!("{} <{}>", addr.name.as_ref().unwrap_or(&addr.email), addr.email))
                    .collect::<Vec<_>>()
                    .join(", "),
                original_message.body_text.as_ref().unwrap_or(&String::new())
            );
            compose_request.body_text = Some(forwarded_content);
        },
        _ => return Err("Invalid reply type. Must be 'reply', 'reply_all', or 'forward'".to_string()),
    }

    Ok(compose_request)
}

// Helper functions

fn format_email_message(compose: &ComposeRequest) -> Result<String> {
    let mut message = String::new();
    
    // Headers
    message.push_str(&format!("From: {}\r\n", format_email_address_list(&[compose.to[0].clone()])));
    message.push_str(&format!("To: {}\r\n", format_email_address_list(&compose.to)));
    
    if let Some(cc) = &compose.cc {
        if !cc.is_empty() {
            message.push_str(&format!("Cc: {}\r\n", format_email_address_list(cc)));
        }
    }
    
    if let Some(bcc) = &compose.bcc {
        if !bcc.is_empty() {
            message.push_str(&format!("Bcc: {}\r\n", format_email_address_list(bcc)));
        }
    }
    
    message.push_str(&format!("Subject: {}\r\n", compose.subject));
    message.push_str(&format!("Date: {}\r\n", chrono::Utc::now().to_rfc2822()));
    message.push_str("MIME-Version: 1.0\r\n");
    
    // Importance header
    match compose.importance {
        MessageImportance::High => message.push_str("X-Priority: 1\r\nImportance: high\r\n"),
        MessageImportance::Low => message.push_str("X-Priority: 5\r\nImportance: low\r\n"),
        MessageImportance::Normal => {},
    }
    
    // Reply-to headers
    if let Some(reply_to_id) = &compose.reply_to_message_id {
        message.push_str(&format!("In-Reply-To: <{}>\r\n", reply_to_id));
        message.push_str(&format!("References: <{}>\r\n", reply_to_id));
    }
    
    // Content type
    let has_attachments = compose.attachments.as_ref().map_or(false, |a| !a.is_empty());
    let has_html = compose.body_html.is_some();
    
    if has_attachments {
        let boundary = format!("boundary_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));
        message.push_str(&format!("Content-Type: multipart/mixed; boundary=\"{}\"\r\n\r\n", boundary));
        
        // Message body part
        message.push_str(&format!("--{}\r\n", boundary));
        if has_html {
            message.push_str("Content-Type: multipart/alternative; boundary=\"alt_boundary\"\r\n\r\n");
            message.push_str("--alt_boundary\r\n");
            message.push_str("Content-Type: text/plain; charset=utf-8\r\n\r\n");
            message.push_str(&compose.body_text.as_ref().unwrap_or(&String::new()));
            message.push_str("\r\n--alt_boundary\r\n");
            message.push_str("Content-Type: text/html; charset=utf-8\r\n\r\n");
            message.push_str(&compose.body_html.as_ref().unwrap());
            message.push_str("\r\n--alt_boundary--\r\n");
        } else {
            message.push_str("Content-Type: text/plain; charset=utf-8\r\n\r\n");
            message.push_str(&compose.body_text.as_ref().unwrap_or(&String::new()));
            message.push_str("\r\n");
        }
        
        // Attachments
        if let Some(attachments) = &compose.attachments {
            for attachment in attachments {
                message.push_str(&format!("--{}\r\n", boundary));
                message.push_str(&format!("Content-Type: {}\r\n", attachment.content_type));
                message.push_str("Content-Transfer-Encoding: base64\r\n");
                message.push_str(&format!("Content-Disposition: attachment; filename=\"{}\"\r\n", attachment.filename));
                if let Some(cid) = &attachment.content_id {
                    message.push_str(&format!("Content-ID: <{}>\r\n", cid));
                }
                message.push_str("\r\n");
                message.push_str(&attachment.data);
                message.push_str("\r\n");
            }
        }
        
        message.push_str(&format!("--{}--\r\n", boundary));
    } else if has_html {
        message.push_str("Content-Type: multipart/alternative; boundary=\"alt_boundary\"\r\n\r\n");
        message.push_str("--alt_boundary\r\n");
        message.push_str("Content-Type: text/plain; charset=utf-8\r\n\r\n");
        message.push_str(&compose.body_text.as_ref().unwrap_or(&String::new()));
        message.push_str("\r\n--alt_boundary\r\n");
        message.push_str("Content-Type: text/html; charset=utf-8\r\n\r\n");
        message.push_str(&compose.body_html.as_ref().unwrap());
        message.push_str("\r\n--alt_boundary--\r\n");
    } else {
        message.push_str("Content-Type: text/plain; charset=utf-8\r\n\r\n");
        message.push_str(&compose.body_text.as_ref().unwrap_or(&String::new()));
        message.push_str("\r\n");
    }
    
    Ok(message)
}

fn format_email_address_list(addresses: &[EmailAddress]) -> String {
    addresses.iter()
        .map(|addr| {
            if let Some(name) = &addr.name {
                format!("{} <{}>", name, addr.email)
            } else {
                addr.email.clone()
            }
        })
        .collect::<Vec<_>>()
        .join(", ")
}

async fn store_sent_message(
    compose: &ComposeRequest,
    gmail_response: &serde_json::Value,
    db_manager: &DatabaseManager,
) -> Result<(), String> {
    // Store in local cache for sent items
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let message_id = gmail_response["id"].as_str().unwrap_or("");
    let thread_id = gmail_response["threadId"].as_str().unwrap_or("");
    
    conn.execute(
        "INSERT OR REPLACE INTO gmail_messages 
         (id, thread_id, account_id, from_email, to_emails, subject, body_text, body_html, 
          is_read, is_starred, has_attachments, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        rusqlite::params![
            message_id,
            thread_id,
            &compose.account_id,
            "", // Would get sender email from account
            &serde_json::to_string(&compose.to).unwrap_or_default(),
            &compose.subject,
            &compose.body_text,
            &compose.body_html,
            true, // Sent messages are read
            false,
            compose.attachments.as_ref().map_or(false, |a| !a.is_empty()),
            &chrono::Utc::now().to_rfc3339(),
            &chrono::Utc::now().to_rfc3339(),
        ],
    ).map_err(|e| format!("Failed to store sent message: {}", e))?;

    Ok(())
}

async fn store_draft_locally(
    draft_request: &DraftSaveRequest,
    gmail_response: &serde_json::Value,
    db_manager: &DatabaseManager,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let draft_id = gmail_response["id"].as_str().unwrap_or("");
    let message_id = gmail_response["message"]["id"].as_str().unwrap_or("");
    
    conn.execute(
        "INSERT OR REPLACE INTO gmail_drafts 
         (id, message_id, account_id, to_emails, subject, body_text, body_html, 
          has_attachments, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            draft_id,
            message_id,
            &draft_request.account_id,
            &serde_json::to_string(&draft_request.compose_data.to).unwrap_or_default(),
            &draft_request.compose_data.subject,
            &draft_request.compose_data.body_text,
            &draft_request.compose_data.body_html,
            draft_request.compose_data.attachments.as_ref().map_or(false, |a| !a.is_empty()),
            &chrono::Utc::now().to_rfc3339(),
            &chrono::Utc::now().to_rfc3339(),
        ],
    ).map_err(|e| format!("Failed to store draft: {}", e))?;

    Ok(())
}

async fn remove_draft_locally(
    account_id: &str,
    draft_id: &str,
    db_manager: &DatabaseManager,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    conn.execute(
        "DELETE FROM gmail_drafts WHERE id = ?1 AND account_id = ?2",
        rusqlite::params![draft_id, account_id],
    ).map_err(|e| format!("Failed to remove draft: {}", e))?;

    Ok(())
}

async fn store_scheduled_message(
    compose: &ComposeRequest,
    schedule_time: &str,
    db_manager: &DatabaseManager,
) -> Result<(), String> {
    // Store scheduled message in database for later processing
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let scheduled_id = uuid::Uuid::new_v4().to_string();
    let compose_json = serde_json::to_string(compose)
        .map_err(|e| format!("Failed to serialize compose data: {}", e))?;

    conn.execute(
        "INSERT INTO scheduled_messages 
         (id, account_id, scheduled_time, compose_data, status, created_at)
         VALUES (?1, ?2, ?3, ?4, 'pending', ?5)",
        rusqlite::params![
            &scheduled_id,
            &compose.account_id,
            schedule_time,
            &compose_json,
            &chrono::Utc::now().to_rfc3339(),
        ],
    ).map_err(|e| format!("Failed to store scheduled message: {}", e))?;

    Ok(())
}

fn estimate_message_size(compose: &ComposeRequest) -> u64 {
    let mut size = 0u64;
    
    size += compose.subject.len() as u64;
    size += compose.body_text.as_ref().map_or(0, |b| b.len()) as u64;
    size += compose.body_html.as_ref().map_or(0, |b| b.len()) as u64;
    
    if let Some(attachments) = &compose.attachments {
        for attachment in attachments {
            size += attachment.size;
        }
    }
    
    size += 1024; // Estimated header overhead
    size
}

async fn get_cached_message(
    account_id: &str,
    message_id: &str,
    db_manager: &DatabaseManager,
) -> Result<CachedMessage, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let result = conn.query_row(
        "SELECT from_email, to_emails, cc_emails, subject, body_text, thread_id, date_header 
         FROM gmail_messages WHERE id = ?1 AND account_id = ?2",
        rusqlite::params![message_id, account_id],
        |row| {
            Ok(CachedMessage {
                from: EmailAddress {
                    email: row.get(0)?,
                    name: None,
                },
                to: serde_json::from_str(&row.get::<_, String>(1)?)
                    .unwrap_or_default(),
                cc: serde_json::from_str(&row.get::<_, String>(2)?)
                    .unwrap_or_default(),
                subject: row.get(3)?,
                body_text: row.get(4)?,
                thread_id: row.get(5)?,
                date: row.get(6)?,
            })
        },
    ).optional()
    .map_err(|e| format!("Failed to query cached message: {}", e))?;

    result.ok_or_else(|| "Message not found in cache".to_string())
}

#[derive(Debug)]
struct CachedMessage {
    from: EmailAddress,
    to: Vec<EmailAddress>,
    cc: Vec<EmailAddress>,
    subject: String,
    body_text: Option<String>,
    thread_id: String,
    date: String,
}

// Dependencies
use uuid;
use chrono;
use rusqlite; 