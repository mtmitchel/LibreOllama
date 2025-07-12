//! Gmail API Integration Tests
//!
//! Tests that verify Gmail API operations work end-to-end with proper error handling,
//! token management, and response parsing.

#[cfg(test)]
mod tests {
    use crate::services::gmail::api_service::*;
    use crate::services::gmail::auth_service::GmailAuthService;
    use crate::commands::rate_limiter::{RateLimiter, RateLimitConfig};
    use std::sync::Arc;
    use tokio::sync::Mutex;

    // Test helpers
    async fn setup_test_services() -> (Arc<GmailAuthService>, Arc<GmailApiService>) {
        // Set test environment variables
        std::env::set_var("GMAIL_CLIENT_ID", "test_client_id_for_integration");
        std::env::set_var("GMAIL_CLIENT_SECRET", "test_client_secret_for_integration_testing_long_enough");
        std::env::set_var("DATABASE_ENCRYPTION_KEY", "test_encryption_key_32_chars_long");
        std::env::set_var("OAUTH_CALLBACK_PORT", "8080");
        
        let db_manager = Arc::new(crate::database::init_database().await.unwrap());
        let encryption_key = [42u8; 32];
        
        let auth_service = Arc::new(GmailAuthService::new(db_manager.clone(), encryption_key).unwrap());
        
        let rate_limiter = Arc::new(Mutex::new(RateLimiter::new(RateLimitConfig::default())));
        let api_service = Arc::new(GmailApiService::new(
            auth_service.clone(),
            db_manager,
            rate_limiter,
        ));
        
        (auth_service, api_service)
    }

    const TEST_ACCOUNT_ID: &str = "test_account_integration";

    #[tokio::test]
    async fn test_api_service_initialization() {
        let (_auth_service, api_service) = setup_test_services().await;
        
        // Service should be created successfully
        assert!(std::ptr::addr_of!(*api_service) as *const _ != std::ptr::null());
    }

    #[tokio::test]
    async fn test_get_labels_without_auth() {
        let (_auth_service, api_service) = setup_test_services().await;
        
        // Attempting to get labels without valid authentication should fail gracefully
        let result = api_service.get_labels(TEST_ACCOUNT_ID).await;
        
        // Should return an error since no tokens are stored
        assert!(result.is_err());
        
        // Error should be related to authentication/token issues
        let error_msg = result.err().unwrap().to_string();
        assert!(
            error_msg.contains("No tokens found") || 
            error_msg.contains("authentication") ||
            error_msg.contains("token")
        );
    }

    #[tokio::test]
    async fn test_search_messages_without_auth() {
        let (_auth_service, api_service) = setup_test_services().await;
        
        let search_query = MessageSearchQuery {
            query: Some("from:test@example.com".to_string()),
            label_ids: Some(vec!["INBOX".to_string()]),
            max_results: Some(10),
            page_token: None,
            include_spam_trash: Some(false),
        };
        
        let result = api_service.search_messages(TEST_ACCOUNT_ID, &search_query).await;
        
        // Should return an error since no tokens are stored
        assert!(result.is_err());
        
        let error_msg = result.err().unwrap().to_string();
        assert!(
            error_msg.contains("No tokens found") || 
            error_msg.contains("authentication") ||
            error_msg.contains("token")
        );
    }

    #[tokio::test]
    async fn test_get_message_without_auth() {
        let (_auth_service, api_service) = setup_test_services().await;
        
        let result = api_service.get_message(TEST_ACCOUNT_ID, "fake_message_id").await;
        
        // Should return an error since no tokens are stored
        assert!(result.is_err());
        
        let error_msg = result.err().unwrap().to_string();
        assert!(
            error_msg.contains("No tokens found") || 
            error_msg.contains("authentication") ||
            error_msg.contains("token")
        );
    }

    #[tokio::test]
    async fn test_get_thread_without_auth() {
        let (_auth_service, api_service) = setup_test_services().await;
        
        let result = api_service.get_thread(TEST_ACCOUNT_ID, "fake_thread_id").await;
        
        // Should return an error since no tokens are stored
        assert!(result.is_err());
        
        let error_msg = result.err().unwrap().to_string();
        assert!(
            error_msg.contains("No tokens found") || 
            error_msg.contains("authentication") ||
            error_msg.contains("token")
        );
    }

    #[tokio::test]
    async fn test_get_attachment_without_auth() {
        let (_auth_service, api_service) = setup_test_services().await;
        
        let result = api_service.get_attachment(
            TEST_ACCOUNT_ID, 
            "fake_message_id", 
            "fake_attachment_id"
        ).await;
        
        // Should return an error since no tokens are stored
        assert!(result.is_err());
        
        let error_msg = result.err().unwrap().to_string();
        assert!(
            error_msg.contains("No tokens found") || 
            error_msg.contains("authentication") ||
            error_msg.contains("token")
        );
    }

    #[tokio::test]
    async fn test_message_search_query_construction() {
        // Test comprehensive query construction
        let query = MessageSearchQuery {
            query: Some("has:attachment in:inbox".to_string()),
            label_ids: Some(vec!["INBOX".to_string(), "UNREAD".to_string()]),
            max_results: Some(50),
            page_token: Some("next_page_token_123".to_string()),
            include_spam_trash: Some(false),
        };

        // Verify query structure
        assert_eq!(query.query, Some("has:attachment in:inbox".to_string()));
        assert_eq!(query.label_ids, Some(vec!["INBOX".to_string(), "UNREAD".to_string()]));
        assert_eq!(query.max_results, Some(50));
        assert_eq!(query.page_token, Some("next_page_token_123".to_string()));
        assert_eq!(query.include_spam_trash, Some(false));
    }

    #[tokio::test]
    async fn test_empty_message_search_query() {
        // Test minimal query construction
        let query = MessageSearchQuery {
            query: None,
            label_ids: None,
            max_results: None,
            page_token: None,
            include_spam_trash: None,
        };

        // Should handle empty query gracefully
        assert!(query.query.is_none());
        assert!(query.label_ids.is_none());
        assert!(query.max_results.is_none());
        assert!(query.page_token.is_none());
        assert!(query.include_spam_trash.is_none());
    }

    #[tokio::test]
    async fn test_rate_limiter_integration() {
        let (_auth_service, api_service) = setup_test_services().await;
        
        // Multiple rapid requests should be handled by rate limiter
        let futures = (0..5).map(|_| {
            api_service.get_labels(TEST_ACCOUNT_ID)
        });
        
        let results = futures_util::future::join_all(futures).await;
        
        // All should fail with authentication errors (not rate limiting errors)
        // since we don't have valid tokens, but the rate limiter should handle the requests
        for result in results {
            assert!(result.is_err());
            let error_msg = result.err().unwrap().to_string();
            // Should be auth errors, not rate limiting errors
            assert!(
                error_msg.contains("No tokens found") || 
                error_msg.contains("authentication") ||
                error_msg.contains("token")
            );
            // Should NOT contain rate limiting errors
            assert!(!error_msg.contains("rate limit"));
        }
    }

    #[tokio::test]
    async fn test_error_handling_for_invalid_account_id() {
        let (_auth_service, api_service) = setup_test_services().await;
        
        // Test with empty account ID
        let result = api_service.get_labels("").await;
        assert!(result.is_err());
        
        // Test with special characters in account ID
        let result = api_service.get_labels("invalid@#$%^&*()").await;
        assert!(result.is_err());
        
        // Test with very long account ID
        let long_account_id = "a".repeat(1000);
        let result = api_service.get_labels(&long_account_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_concurrent_api_operations() {
        let (_auth_service, api_service) = setup_test_services().await;
        
        // Test concurrent operations of different types
        let labels_future = api_service.get_labels(TEST_ACCOUNT_ID);
        let search_query = MessageSearchQuery {
            query: Some("test".to_string()),
            label_ids: None,
            max_results: Some(10),
            page_token: None,
            include_spam_trash: Some(false),
        };
        let search_future = api_service.search_messages(TEST_ACCOUNT_ID, &search_query);
        let message_future = api_service.get_message(TEST_ACCOUNT_ID, "test_message_id");
        
        let (labels_result, search_result, message_result) = 
            tokio::join!(labels_future, search_future, message_future);
        
        // All should fail with auth errors but handle concurrency properly
        assert!(labels_result.is_err());
        assert!(search_result.is_err());
        assert!(message_result.is_err());
        
        // Verify they're auth errors, not concurrency issues
        let labels_error = labels_result.err().unwrap().to_string();
        let search_error = search_result.err().unwrap().to_string();
        let message_error = message_result.err().unwrap().to_string();
        
        for error_msg in [&labels_error, &search_error, &message_error] {
            assert!(
                error_msg.contains("No tokens found") || 
                error_msg.contains("authentication") ||
                error_msg.contains("token")
            );
        }
    }

    #[tokio::test]
    async fn test_api_service_with_mock_tokens() {
        let (auth_service, api_service) = setup_test_services().await;
        
        // Store mock tokens to test token validation flow
        let mock_tokens = crate::services::gmail::auth_service::GmailTokens {
            access_token: "ya29.mock_access_token".to_string(),
            refresh_token: Some("1//mock_refresh_token".to_string()),
            expires_at: Some(chrono::Utc::now().checked_add_signed(chrono::Duration::hours(1)).unwrap().to_rfc3339()),
            token_type: "Bearer".to_string(),
        };
        
        let mock_user_info = crate::services::gmail::auth_service::UserInfo {
            id: "mock_user_id".to_string(),
            email: "test@gmail.com".to_string(),
            name: Some("Test User".to_string()),
            picture: None,
        };
        
        // Store the mock tokens using email as account_id
        let account_id = "test@gmail.com";
        let store_result = auth_service.store_account_tokens(
            account_id.to_string(),
            mock_tokens,
            mock_user_info,
        ).await;
        
        assert!(store_result.is_ok(), "Failed to store mock tokens");
        
        // Now API calls should get further - they'll fail when trying to refresh the mock token
        let result = api_service.get_labels(account_id).await;
        
        // Should now fail with token refresh errors rather than "No tokens found" 
        assert!(result.is_err());
        let error_msg = result.err().unwrap().to_string();
        
        // Should NOT be a "No tokens found" error anymore
        assert!(!error_msg.contains("No tokens found"));
        
        // Should be a token refresh or API error since we have mock tokens
        assert!(
            error_msg.contains("Failed to refresh token") ||
            error_msg.contains("Token refresh failed") ||
            error_msg.contains("Server returned error response") ||
            error_msg.contains("Gmail API error") ||
            error_msg.contains("Rate limited Gmail API request failed") ||
            error_msg.contains("network") ||
            error_msg.contains("connection") ||
            error_msg.contains("Invalid Credentials") ||
            error_msg.contains("401")
        );
    }

    #[tokio::test]
    async fn test_email_address_validation() {
        // Test EmailAddress struct creation and validation
        let valid_address = EmailAddress {
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
        };
        
        assert_eq!(valid_address.email, "test@example.com");
        assert_eq!(valid_address.name, Some("Test User".to_string()));
        
        let minimal_address = EmailAddress {
            email: "minimal@example.com".to_string(),
            name: None,
        };
        
        assert_eq!(minimal_address.email, "minimal@example.com");
        assert!(minimal_address.name.is_none());
    }

    #[tokio::test]
    async fn test_processed_gmail_message_structure() {
        // Test ProcessedGmailMessage construction
        let parsed_email = ParsedEmail {
            message_id: Some("test_message_id".to_string()),
            thread_id: Some("test_thread_id".to_string()),
            subject: Some("Test Subject".to_string()),
            from: EmailAddress {
                email: "sender@example.com".to_string(),
                name: Some("Sender Name".to_string()),
            },
            to: vec![EmailAddress {
                email: "recipient@example.com".to_string(),
                name: Some("Recipient Name".to_string()),
            }],
            cc: vec![],
            bcc: vec![],
            reply_to: None,
            date: Some("2024-01-01T00:00:00Z".to_string()),
            body_text: Some("Test message content".to_string()),
            body_html: None,
            attachments: vec![],
            headers: std::collections::HashMap::new(),
            is_multipart: false,
            content_type: "text/plain".to_string(),
            size_estimate: Some(150),
        };
        
        let processed_message = ProcessedGmailMessage {
            id: "test_message_id".to_string(),
            thread_id: "test_thread_id".to_string(),
            parsed_content: parsed_email,
            labels: vec!["INBOX".to_string(), "UNREAD".to_string()],
            snippet: Some("Test message content".to_string()),
            internal_date: Some("1609459200000".to_string()),
            size_estimate: Some(1500),
        };
        
        assert_eq!(processed_message.id, "test_message_id");
        assert_eq!(processed_message.thread_id, "test_thread_id");
        assert_eq!(processed_message.labels, vec!["INBOX", "UNREAD"]);
        assert_eq!(processed_message.parsed_content.subject, Some("Test Subject".to_string()));
        assert_eq!(processed_message.parsed_content.from.email, "sender@example.com");
        assert_eq!(processed_message.parsed_content.to.len(), 1);
    }
} 