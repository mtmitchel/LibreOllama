//! Gmail API Serialization Tests
//!
//! Comprehensive tests for Gmail API response structure serialization/deserialization
//! to ensure all field mappings are correct and prevent runtime parsing errors.

#[cfg(test)]
mod tests {
    use crate::services::gmail::api_service::*;
    use serde_json;

    #[test]
    fn test_message_ref_deserialization() {
        let json = r#"
        {
            "id": "17b2c90e4b7a8a5b",
            "threadId": "17b2c90e4b7a8a5b"
        }
        "#;

        let message_ref: MessageRef = serde_json::from_str(json).unwrap();
        assert_eq!(message_ref.id, "17b2c90e4b7a8a5b");
        assert_eq!(message_ref.thread_id, "17b2c90e4b7a8a5b");
    }

    #[test]
    fn test_message_list_response_deserialization() {
        let json = r#"
        {
            "messages": [
                {
                    "id": "17b2c90e4b7a8a5b",
                    "threadId": "17b2c90e4b7a8a5b"
                },
                {
                    "id": "17b2c90e4b7a8a5c",
                    "threadId": "17b2c90e4b7a8a5c"
                }
            ],
            "nextPageToken": "nextPageToken123",
            "resultSizeEstimate": 100
        }
        "#;

        let response: MessageListResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.messages.unwrap().len(), 2);
        assert_eq!(response.next_page_token, Some("nextPageToken123".to_string()));
        assert_eq!(response.result_size_estimate, Some(100));
    }

    #[test]
    fn test_gmail_label_deserialization() {
        let json = r#"
        {
            "id": "INBOX",
            "name": "INBOX",
            "messageListVisibility": "show",
            "labelListVisibility": "labelShow",
            "type": "system",
            "messagesTotal": 100,
            "messagesUnread": 5,
            "threadsTotal": 90,
            "threadsUnread": 4
        }
        "#;

        let label: GmailLabel = serde_json::from_str(json).unwrap();
        assert_eq!(label.id, "INBOX");
        assert_eq!(label.name, "INBOX");
        assert_eq!(label.message_list_visibility, Some("show".to_string()));
        assert_eq!(label.label_list_visibility, Some("labelShow".to_string()));
        assert_eq!(label.label_type, Some("system".to_string()));
        assert_eq!(label.messages_total, Some(100));
        assert_eq!(label.messages_unread, Some(5));
        assert_eq!(label.threads_total, Some(90));
        assert_eq!(label.threads_unread, Some(4));
    }

    #[test]
    fn test_label_list_response_deserialization() {
        let json = r#"
        {
            "labels": [
                {
                    "id": "INBOX",
                    "name": "INBOX",
                    "type": "system"
                },
                {
                    "id": "UNREAD",
                    "name": "UNREAD",
                    "type": "system"
                }
            ]
        }
        "#;

        let response: LabelListResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.labels.len(), 2);
        assert_eq!(response.labels[0].id, "INBOX");
        assert_eq!(response.labels[1].id, "UNREAD");
    }

    #[test]
    fn test_gmail_message_deserialization() {
        let json = r#"
        {
            "id": "17b2c90e4b7a8a5b",
            "threadId": "17b2c90e4b7a8a5b",
            "labelIds": ["INBOX", "UNREAD"],
            "snippet": "This is a test message snippet",
            "historyId": "123456",
            "internalDate": "1609459200000",
            "payload": {
                "partId": "",
                "mimeType": "text/plain",
                "filename": "",
                "headers": [
                    {
                        "name": "Subject",
                        "value": "Test Subject"
                    }
                ],
                "body": {
                    "size": 100,
                    "data": "dGVzdCBtZXNzYWdlIGNvbnRlbnQ="
                }
            },
            "sizeEstimate": 1500
        }
        "#;

        let message: GmailMessage = serde_json::from_str(json).unwrap();
        assert_eq!(message.id, "17b2c90e4b7a8a5b");
        assert_eq!(message.thread_id, "17b2c90e4b7a8a5b");
        assert_eq!(message.label_ids, Some(vec!["INBOX".to_string(), "UNREAD".to_string()]));
        assert_eq!(message.snippet, Some("This is a test message snippet".to_string()));
        assert_eq!(message.history_id, Some("123456".to_string()));
        assert_eq!(message.internal_date, Some("1609459200000".to_string()));
        assert_eq!(message.size_estimate, Some(1500));
        assert_eq!(message.payload.mime_type, "text/plain");
    }

    #[test]
    fn test_gmail_payload_deserialization() {
        let json = r#"
        {
            "partId": "0",
            "mimeType": "multipart/alternative",
            "filename": "",
            "headers": [
                {
                    "name": "Content-Type",
                    "value": "multipart/alternative; boundary=\"boundary123\""
                }
            ],
            "body": {
                "size": 0
            },
            "parts": [
                {
                    "partId": "0.0",
                    "mimeType": "text/plain",
                    "filename": "",
                    "headers": [],
                    "body": {
                        "size": 100,
                        "data": "dGVzdCBwbGFpbiB0ZXh0"
                    }
                }
            ]
        }
        "#;

        let payload: GmailPayload = serde_json::from_str(json).unwrap();
        assert_eq!(payload.part_id, Some("0".to_string()));
        assert_eq!(payload.mime_type, "multipart/alternative");
        assert_eq!(payload.headers.len(), 1);
        assert!(payload.parts.is_some());
        assert_eq!(payload.parts.unwrap().len(), 1);
    }

    #[test]
    fn test_gmail_thread_deserialization() {
        let json = r#"
        {
            "id": "17b2c90e4b7a8a5b",
            "historyId": "123456",
            "messages": [
                {
                    "id": "17b2c90e4b7a8a5b",
                    "threadId": "17b2c90e4b7a8a5b",
                    "labelIds": ["INBOX"],
                    "snippet": "Message 1",
                    "payload": {
                        "mimeType": "text/plain",
                        "headers": [],
                        "body": {
                            "size": 50
                        }
                    }
                }
            ]
        }
        "#;

        let thread: GmailThread = serde_json::from_str(json).unwrap();
        assert_eq!(thread.id, "17b2c90e4b7a8a5b");
        assert_eq!(thread.history_id, Some("123456".to_string()));
        assert_eq!(thread.messages.len(), 1);
        assert_eq!(thread.messages[0].id, "17b2c90e4b7a8a5b");
    }

    #[test]
    fn test_gmail_body_deserialization() {
        let json = r#"
        {
            "attachmentId": "ANGjdJ8w7X4J",
            "size": 1024,
            "data": "dGVzdCBhdHRhY2htZW50IGRhdGE="
        }
        "#;

        let body: GmailBody = serde_json::from_str(json).unwrap();
        assert_eq!(body.attachment_id, Some("ANGjdJ8w7X4J".to_string()));
        assert_eq!(body.size, Some(1024));
        assert_eq!(body.data, Some("dGVzdCBhdHRhY2htZW50IGRhdGE=".to_string()));
    }

    #[test]
    fn test_empty_message_list_response() {
        let json = r#"
        {
            "resultSizeEstimate": 0
        }
        "#;

        let response: MessageListResponse = serde_json::from_str(json).unwrap();
        assert!(response.messages.is_none());
        assert!(response.next_page_token.is_none());
        assert_eq!(response.result_size_estimate, Some(0));
    }

    #[test]
    fn test_minimal_gmail_label() {
        let json = r#"
        {
            "id": "CATEGORY_PROMOTIONS",
            "name": "Promotions"
        }
        "#;

        let label: GmailLabel = serde_json::from_str(json).unwrap();
        assert_eq!(label.id, "CATEGORY_PROMOTIONS");
        assert_eq!(label.name, "Promotions");
        assert!(label.message_list_visibility.is_none());
        assert!(label.label_type.is_none());
    }

    #[test]
    fn test_email_address_parsing() {
        let json = r#"
        {
            "email": "test@example.com",
            "name": "Test User"
        }
        "#;

        let address: EmailAddress = serde_json::from_str(json).unwrap();
        assert_eq!(address.email, "test@example.com");
        assert_eq!(address.name, Some("Test User".to_string()));
    }

    #[test]
    fn test_processed_gmail_message() {
        let json = r#"
        {
            "id": "17b2c90e4b7a8a5b",
            "thread_id": "17b2c90e4b7a8a5b",
            "parsed_content": {
                "message_id": "17b2c90e4b7a8a5b",
                "thread_id": "17b2c90e4b7a8a5b",
                "subject": "Test Subject",
                "from": {
                    "email": "sender@example.com",
                    "name": "Sender Name"
                },
                "to": [],
                "cc": [],
                "bcc": [],
                "reply_to": null,
                "date": "2024-01-01T00:00:00Z",
                "body_text": "Test message content",
                "body_html": null,
                "attachments": [],
                "headers": {},
                "is_multipart": false,
                "content_type": "text/plain",
                "size_estimate": 100
            },
            "labels": ["INBOX", "UNREAD"],
            "snippet": "Test message content",
            "internal_date": "1609459200000",
            "size_estimate": 1500
        }
        "#;

        let processed: ProcessedGmailMessage = serde_json::from_str(json).unwrap();
        assert_eq!(processed.id, "17b2c90e4b7a8a5b");
        assert_eq!(processed.thread_id, "17b2c90e4b7a8a5b");
        assert_eq!(processed.labels, vec!["INBOX", "UNREAD"]);
        assert_eq!(processed.parsed_content.subject, Some("Test Subject".to_string()));
    }

    #[test]
    fn test_message_search_query() {
        let query = MessageSearchQuery {
            query: Some("from:test@example.com".to_string()),
            label_ids: Some(vec!["INBOX".to_string(), "UNREAD".to_string()]),
            max_results: Some(50),
            page_token: Some("nextPage123".to_string()),
            include_spam_trash: Some(false),
        };

        // Test serialization
        let json = serde_json::to_string(&query).unwrap();
        assert!(json.contains("from:test@example.com"));
        assert!(json.contains("INBOX"));

        // Test deserialization
        let parsed: MessageSearchQuery = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.query, Some("from:test@example.com".to_string()));
        assert_eq!(parsed.max_results, Some(50));
    }

    #[test]
    fn test_gmail_error_response_structure() {
        // Test parsing a Gmail API error response
        let error_json = r#"
        {
            "error": {
                "code": 401,
                "message": "Invalid Credentials",
                "status": "UNAUTHENTICATED"
            }
        }
        "#;

        let error_response: serde_json::Value = serde_json::from_str(error_json).unwrap();
        assert!(error_response.get("error").is_some());
        
        let error_obj = error_response.get("error").unwrap();
        assert_eq!(error_obj.get("code").unwrap().as_u64().unwrap(), 401);
        assert_eq!(error_obj.get("message").unwrap().as_str().unwrap(), "Invalid Credentials");
    }

    #[test]
    fn test_attachment_response_structure() {
        let json = r#"
        {
            "size": 2048,
            "data": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz"
        }
        "#;

        // This would be parsed by the internal AttachmentResponse struct in the API service
        let attachment_data: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(attachment_data.get("size").unwrap().as_u64().unwrap(), 2048);
        assert!(attachment_data.get("data").unwrap().as_str().unwrap().starts_with("iVBORw0"));
    }

    #[test]
    fn test_complex_multipart_payload() {
        let json = r#"
        {
            "partId": "",
            "mimeType": "multipart/mixed",
            "filename": "",
            "headers": [
                {
                    "name": "Content-Type",
                    "value": "multipart/mixed; boundary=\"----=_Part_123_456.789\""
                }
            ],
            "body": {
                "size": 0
            },
            "parts": [
                {
                    "partId": "0",
                    "mimeType": "multipart/alternative",
                    "filename": "",
                    "headers": [],
                    "body": {
                        "size": 0
                    },
                    "parts": [
                        {
                            "partId": "0.0",
                            "mimeType": "text/plain",
                            "filename": "",
                            "headers": [],
                            "body": {
                                "size": 123,
                                "data": "SGVsbG8gV29ybGQ="
                            }
                        },
                        {
                            "partId": "0.1",
                            "mimeType": "text/html",
                            "filename": "",
                            "headers": [],
                            "body": {
                                "size": 234,
                                "data": "PGgxPkhlbGxvIFdvcmxkPC9oMT4="
                            }
                        }
                    ]
                },
                {
                    "partId": "1",
                    "mimeType": "image/png",
                    "filename": "attachment.png",
                    "headers": [],
                    "body": {
                        "attachmentId": "ANGjdJ8w7X4J",
                        "size": 5678
                    }
                }
            ]
        }
        "#;

        let payload: GmailPayload = serde_json::from_str(json).unwrap();
        assert_eq!(payload.mime_type, "multipart/mixed");
        assert!(payload.parts.is_some());
        
        let parts = payload.parts.unwrap();
        assert_eq!(parts.len(), 2);
        
        // Test nested multipart structure
        assert_eq!(parts[0].mime_type, "multipart/alternative");
        assert!(parts[0].parts.is_some());
        assert_eq!(parts[0].parts.as_ref().unwrap().len(), 2);
        
        // Test attachment part
        assert_eq!(parts[1].mime_type, "image/png");
        assert_eq!(parts[1].filename, Some("attachment.png".to_string()));
        assert!(parts[1].body.as_ref().unwrap().attachment_id.is_some());
    }
} 