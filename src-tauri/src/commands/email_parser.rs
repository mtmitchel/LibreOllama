use anyhow::{anyhow, Result};
use mailparse::{parse_mail, MailHeaderMap, ParsedMail};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use base64::{engine::general_purpose, Engine as _};
// use chrono::{DateTime, Utc}; // Will be used when implementing actual date parsing

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedEmailMessage {
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
    pub data: Option<Vec<u8>>, // Base64 decoded data
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailApiMessage {
    pub id: String,
    pub thread_id: String,
    pub label_ids: Option<Vec<String>>,
    pub snippet: Option<String>,
    pub history_id: Option<String>,
    pub internal_date: Option<String>,
    pub payload: GmailMessagePayload,
    pub size_estimate: Option<i32>,
    pub raw: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailMessagePayload {
    pub part_id: Option<String>,
    pub mime_type: String,
    pub filename: Option<String>,
    pub headers: Vec<GmailHeader>,
    pub body: Option<GmailMessageBody>,
    pub parts: Option<Vec<GmailMessagePayload>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailHeader {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailMessageBody {
    pub attachment_id: Option<String>,
    pub size: Option<i32>,
    pub data: Option<String>, // Base64 encoded
}

impl EmailAddress {
    pub fn new(email: String, name: Option<String>) -> Self {
        Self { email, name }
    }

    pub fn from_string(addr_str: &str) -> Result<Self> {
        // Parse email addresses in various formats:
        // "email@domain.com"
        // "Name <email@domain.com>"
        // "Name" <email@domain.com>
        
        let trimmed = addr_str.trim();
        
        // Check if it contains angle brackets
        if let Some(start) = trimmed.rfind('<') {
            if let Some(end) = trimmed.rfind('>') {
                if start < end {
                    let email = trimmed[(start + 1)..end].trim().to_string();
                    let name = if start > 0 {
                        let name_part = trimmed[..start].trim();
                        // Remove surrounding quotes if present
                        let clean_name = name_part.trim_matches('"').trim();
                        if clean_name.is_empty() {
                            None
                        } else {
                            Some(clean_name.to_string())
                        }
                    } else {
                        None
                    };
                    return Ok(Self::new(email, name));
                }
            }
        }
        
        // If no angle brackets, assume it's just an email
        Ok(Self::new(trimmed.to_string(), None))
    }
}

/// Parse a raw email message using mailparse
pub fn parse_raw_email(raw_content: &str) -> Result<ParsedEmailMessage> {
    let parsed = parse_mail(raw_content.as_bytes())
        .map_err(|e| anyhow!("Failed to parse email: {}", e))?;
    
    extract_email_data(&parsed)
}

/// Parse a Gmail API message response
pub fn parse_gmail_api_message(gmail_msg: &GmailApiMessage) -> Result<ParsedEmailMessage> {
    // If we have raw content, use that for better parsing
    if let Some(raw) = &gmail_msg.raw {
        let decoded = general_purpose::STANDARD.decode(raw)
            .map_err(|e| anyhow!("Failed to decode base64 raw message: {}", e))?;
        let raw_str = String::from_utf8(decoded)
            .map_err(|e| anyhow!("Failed to convert raw message to UTF-8: {}", e))?;
        return parse_raw_email(&raw_str);
    }
    
    // Otherwise, parse from the payload structure
    parse_gmail_payload(&gmail_msg.payload, gmail_msg.id.clone(), gmail_msg.thread_id.clone())
}

/// Extract email data from a parsed mail object
fn extract_email_data(parsed: &ParsedMail) -> Result<ParsedEmailMessage> {
    let headers = extract_headers(&parsed.headers);
    
    let subject = headers.get("subject").cloned();
    let message_id = headers.get("message-id").cloned();
    let date = headers.get("date").cloned();
    
    // Parse addresses
    let from = parse_address_header(&headers, "from")?;
    let to = parse_address_list_header(&headers, "to");
    let cc = parse_address_list_header(&headers, "cc");
    let bcc = parse_address_list_header(&headers, "bcc");
    let reply_to = parse_optional_address_header(&headers, "reply-to")?;
    
    // Extract body content and attachments
    let (body_text, body_html, attachments) = extract_content_and_attachments(parsed)?;
    
    let content_type = parsed.ctype.mimetype.clone();
    let is_multipart = content_type.starts_with("multipart/");
    
    Ok(ParsedEmailMessage {
        message_id,
        thread_id: None, // Will be set from Gmail API data
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
        is_multipart,
        content_type,
        size_estimate: None,
    })
}

/// Parse Gmail API payload structure
fn parse_gmail_payload(
    payload: &GmailMessagePayload,
    message_id: String,
    thread_id: String,
) -> Result<ParsedEmailMessage> {
    let headers = extract_gmail_headers(&payload.headers);
    
    let subject = headers.get("subject").cloned();
    let date = headers.get("date").cloned();
    
    // Parse addresses
    let from = parse_address_header(&headers, "from")?;
    let to = parse_address_list_header(&headers, "to");
    let cc = parse_address_list_header(&headers, "cc");
    let bcc = parse_address_list_header(&headers, "bcc");
    let reply_to = parse_optional_address_header(&headers, "reply-to")?;
    
    // Extract content from payload
    let (body_text, body_html, attachments) = extract_gmail_content(payload)?;
    
    let content_type = payload.mime_type.clone();
    let is_multipart = content_type.starts_with("multipart/");
    
    Ok(ParsedEmailMessage {
        message_id: Some(message_id),
        thread_id: Some(thread_id),
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
        is_multipart,
        content_type,
        size_estimate: None,
    })
}

/// Extract headers from mailparse headers
fn extract_headers(headers: &[mailparse::MailHeader]) -> HashMap<String, String> {
    let mut result = HashMap::new();
    
    for header in headers {
        let name = header.get_key().to_lowercase();
        let value = header.get_value();
        result.insert(name, value);
    }
    
    result
}

/// Extract headers from Gmail API headers
fn extract_gmail_headers(headers: &[GmailHeader]) -> HashMap<String, String> {
    let mut result = HashMap::new();
    
    for header in headers {
        result.insert(header.name.to_lowercase(), header.value.clone());
    }
    
    result
}

/// Parse a single email address from headers
fn parse_address_header(headers: &HashMap<String, String>, header_name: &str) -> Result<EmailAddress> {
    match headers.get(header_name) {
        Some(value) => EmailAddress::from_string(value),
        None => Err(anyhow!("Missing required header: {}", header_name)),
    }
}

/// Parse optional single email address from headers
fn parse_optional_address_header(
    headers: &HashMap<String, String>,
    header_name: &str,
) -> Result<Option<EmailAddress>> {
    match headers.get(header_name) {
        Some(value) => Ok(Some(EmailAddress::from_string(value)?)),
        None => Ok(None),
    }
}

/// Parse a list of email addresses from headers
fn parse_address_list_header(headers: &HashMap<String, String>, header_name: &str) -> Vec<EmailAddress> {
    match headers.get(header_name) {
        Some(value) => parse_address_list(value),
        None => Vec::new(),
    }
}

/// Parse a comma-separated list of email addresses
fn parse_address_list(addr_list: &str) -> Vec<EmailAddress> {
    let mut addresses = Vec::new();
    
    // Split by comma, but be careful about commas inside quoted names
    let parts = split_address_list(addr_list);
    
    for part in parts {
        if let Ok(addr) = EmailAddress::from_string(&part) {
            addresses.push(addr);
        }
    }
    
    addresses
}

/// Split address list handling quoted names with commas
fn split_address_list(addr_list: &str) -> Vec<String> {
    let mut parts = Vec::new();
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
                        parts.push(current.trim().to_string());
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
        parts.push(current.trim().to_string());
    }
    
    parts
}

/// Extract content and attachments from parsed mail
fn extract_content_and_attachments(
    parsed: &ParsedMail,
) -> Result<(Option<String>, Option<String>, Vec<EmailAttachment>)> {
    let mut body_text = None;
    let mut body_html = None;
    let mut attachments = Vec::new();
    
    extract_parts_recursive(parsed, &mut body_text, &mut body_html, &mut attachments)?;
    
    Ok((body_text, body_html, attachments))
}

/// Recursively extract parts from a multipart message
fn extract_parts_recursive(
    part: &ParsedMail,
    body_text: &mut Option<String>,
    body_html: &mut Option<String>,
    attachments: &mut Vec<EmailAttachment>,
) -> Result<()> {
    let content_type = &part.ctype.mimetype;
    let content_disposition = part.ctype.params.get("disposition");
    
    // Check if this is an attachment
    let is_attachment = content_disposition
        .map(|d| d == "attachment")
        .unwrap_or(false) ||
        part.ctype.params.contains_key("filename") ||
        part.ctype.params.contains_key("name");
    
    if is_attachment {
        // Handle attachment
        let filename = part.ctype.params.get("filename")
            .or_else(|| part.ctype.params.get("name"))
            .cloned();
        
        let content_id = part.headers.get_first_value("content-id");
        
        let is_inline = content_disposition
            .map(|d| d == "inline")
            .unwrap_or(false);
        
        let attachment = EmailAttachment {
            id: format!("att_{}", attachments.len()),
            filename,
            content_type: content_type.clone(),
            size: Some(part.get_body_raw()?.len()),
            content_id,
            is_inline,
            data: Some(part.get_body_raw()?.to_vec()),
        };
        
        attachments.push(attachment);
    } else {
        // Handle body content
        match content_type.as_str() {
            "text/plain" => {
                if body_text.is_none() {
                    *body_text = Some(part.get_body()?);
                }
            }
            "text/html" => {
                if body_html.is_none() {
                    *body_html = Some(part.get_body()?);
                }
            }
            mime_type if mime_type.starts_with("multipart/") => {
                // Recursively process multipart content
                for subpart in &part.subparts {
                    extract_parts_recursive(subpart, body_text, body_html, attachments)?;
                }
            }
            _ => {
                // Unknown content type, treat as attachment
                let attachment = EmailAttachment {
                    id: format!("att_{}", attachments.len()),
                    filename: part.ctype.params.get("name").cloned(),
                    content_type: content_type.clone(),
                    size: Some(part.get_body_raw()?.len()),
                    content_id: None,
                    is_inline: false,
                    data: Some(part.get_body_raw()?.to_vec()),
                };
                attachments.push(attachment);
            }
        }
    }
    
    Ok(())
}

/// Extract content from Gmail API payload structure
fn extract_gmail_content(
    payload: &GmailMessagePayload,
) -> Result<(Option<String>, Option<String>, Vec<EmailAttachment>)> {
    let mut body_text = None;
    let mut body_html = None;
    let mut attachments = Vec::new();
    
    extract_gmail_parts_recursive(payload, &mut body_text, &mut body_html, &mut attachments)?;
    
    Ok((body_text, body_html, attachments))
}

/// Recursively extract content from Gmail API payload parts
fn extract_gmail_parts_recursive(
    part: &GmailMessagePayload,
    body_text: &mut Option<String>,
    body_html: &mut Option<String>,
    attachments: &mut Vec<EmailAttachment>,
) -> Result<()> {
    let mime_type = &part.mime_type;
    
    // Check if this part has a filename (likely an attachment)
    let is_attachment = part.filename.is_some() && !part.filename.as_ref().unwrap().is_empty();
    
    if is_attachment {
        // Handle attachment
        let attachment = EmailAttachment {
            id: part.body.as_ref()
                .and_then(|b| b.attachment_id.clone())
                .unwrap_or_else(|| format!("att_{}", attachments.len())),
            filename: part.filename.clone(),
            content_type: mime_type.clone(),
            size: part.body.as_ref().and_then(|b| b.size.map(|s| s as usize)),
            content_id: None,
            is_inline: false,
            data: part.body.as_ref()
                .and_then(|b| b.data.as_ref())
                .and_then(|data| general_purpose::STANDARD.decode(data).ok()),
        };
        attachments.push(attachment);
    } else {
        // Handle body content
        match mime_type.as_str() {
            "text/plain" => {
                if body_text.is_none() {
                    if let Some(body) = &part.body {
                        if let Some(data) = &body.data {
                            let decoded = general_purpose::STANDARD.decode(data)?;
                            *body_text = Some(String::from_utf8(decoded)?);
                        }
                    }
                }
            }
            "text/html" => {
                if body_html.is_none() {
                    if let Some(body) = &part.body {
                        if let Some(data) = &body.data {
                            let decoded = general_purpose::STANDARD.decode(data)?;
                            *body_html = Some(String::from_utf8(decoded)?);
                        }
                    }
                }
            }
            mime_type if mime_type.starts_with("multipart/") => {
                // Process multipart content
                if let Some(parts) = &part.parts {
                    for subpart in parts {
                        extract_gmail_parts_recursive(subpart, body_text, body_html, attachments)?;
                    }
                }
            }
            _ => {
                // Unknown content type with data, treat as attachment if it has content
                if let Some(body) = &part.body {
                    if body.data.is_some() {
                        let attachment = EmailAttachment {
                            id: body.attachment_id.clone()
                                .unwrap_or_else(|| format!("att_{}", attachments.len())),
                            filename: part.filename.clone(),
                            content_type: mime_type.clone(),
                            size: body.size.map(|s| s as usize),
                            content_id: None,
                            is_inline: false,
                            data: body.data.as_ref()
                                .and_then(|data| general_purpose::STANDARD.decode(data).ok()),
                        };
                        attachments.push(attachment);
                    }
                }
            }
        }
    }
    
    // Always check for sub-parts
    if let Some(parts) = &part.parts {
        for subpart in parts {
            extract_gmail_parts_recursive(subpart, body_text, body_html, attachments)?;
        }
    }
    
    Ok(())
}

/// Clean and sanitize HTML content
pub fn sanitize_html_content(html: &str) -> String {
    // Basic HTML sanitization - in production, use a proper HTML sanitizer
    html.replace("<script", "&lt;script")
        .replace("</script>", "&lt;/script&gt;")
        .replace("javascript:", "")
        .replace("vbscript:", "")
        .replace("on", "&on")
}

/// Extract plain text from HTML content
pub fn html_to_text(html: &str) -> String {
    // Basic HTML to text conversion
    // In production, use a proper HTML parser like scraper or html2text
    html.replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
        .replace("</p>", "\n\n")
        .replace("</div>", "\n")
        .replace("</h1>", "\n\n")
        .replace("</h2>", "\n\n")
        .replace("</h3>", "\n\n")
        .replace("</h4>", "\n\n")
        .replace("</h5>", "\n\n")
        .replace("</h6>", "\n\n")
        // Remove all HTML tags
        .chars()
        .fold((String::new(), false), |(mut acc, in_tag), ch| {
            match ch {
                '<' => (acc, true),
                '>' => (acc, false),
                c if !in_tag => {
                    acc.push(c);
                    (acc, false)
                }
                _ => (acc, in_tag),
            }
        })
        .0
        .trim()
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_email_address_parsing() {
        // Test simple email
        let addr = EmailAddress::from_string("test@example.com").unwrap();
        assert_eq!(addr.email, "test@example.com");
        assert_eq!(addr.name, None);

        // Test email with name in brackets
        let addr = EmailAddress::from_string("John Doe <john@example.com>").unwrap();
        assert_eq!(addr.email, "john@example.com");
        assert_eq!(addr.name, Some("John Doe".to_string()));

        // Test email with quoted name
        let addr = EmailAddress::from_string("\"John Doe\" <john@example.com>").unwrap();
        assert_eq!(addr.email, "john@example.com");
        assert_eq!(addr.name, Some("John Doe".to_string()));
    }

    #[test]
    fn test_address_list_splitting() {
        let list = "john@example.com, \"Jane, Doe\" <jane@example.com>, bob@test.com";
        let addresses = parse_address_list(list);
        assert_eq!(addresses.len(), 3);
        assert_eq!(addresses[0].email, "john@example.com");
        assert_eq!(addresses[1].email, "jane@example.com");
        assert_eq!(addresses[1].name, Some("Jane, Doe".to_string()));
        assert_eq!(addresses[2].email, "bob@test.com");
    }

    #[test]
    fn test_html_to_text() {
        let html = "<p>Hello <strong>world</strong>!</p><br/><div>How are you?</div>";
        let text = html_to_text(html);
        assert!(text.contains("Hello world!"));
        assert!(text.contains("How are you?"));
        assert!(!text.contains("<p>"));
    }
} 