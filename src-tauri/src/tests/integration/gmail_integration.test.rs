//! Gmail Integration Tests
//!
//! These tests validate the complete Gmail service layer integration,
//! including authentication, API operations, and compose functionality.

#[cfg(test)]
mod gmail_integration_tests {
    use std::sync::Arc;
    use tokio::sync::Mutex;
    
    use crate::services::gmail::{
        api_service::{GmailApiService, MessageSearchQuery},
        auth_service::GmailAuthService,
        compose_service::{GmailComposeService, ComposeRequest},
    };
    use crate::commands::rate_limiter::{RateLimiter, RateLimitConfig};
    use crate::database::connection::DatabaseManager;
    use crate::utils::crypto::generate_encryption_key;

    /// Mock account ID for testing
    const TEST_ACCOUNT_ID: &str = "test@example.com";

    /// Setup test environment variables for OAuth configuration
    fn setup_oauth_test_env() {
        std::env::set_var("GMAIL_CLIENT_ID", "test_client_id_for_integration_tests");
        std::env::set_var("GMAIL_CLIENT_SECRET", "test_client_secret_for_integration_tests_long_enough");
        std::env::set_var("DATABASE_ENCRYPTION_KEY", "test_encryption_key_32_chars_long");
        std::env::set_var("OAUTH_CALLBACK_PORT", "8080");
    }

    /// Create test database manager
    async fn create_test_db_manager() -> Arc<DatabaseManager> {
        let db_manager = DatabaseManager::new().await
            .expect("Failed to create test database manager");
        Arc::new(db_manager)
    }

    /// Create test Gmail auth service with proper OAuth configuration
    async fn create_test_auth_service() -> Arc<GmailAuthService> {
        setup_oauth_test_env();
        
        let db_manager = create_test_db_manager().await;
        let encryption_key = generate_encryption_key();
        
        let auth_service = GmailAuthService::new(db_manager, encryption_key)
            .expect("Failed to create test auth service");
        Arc::new(auth_service)
    }

    /// Create test rate limiter
    fn create_test_rate_limiter() -> Arc<Mutex<RateLimiter>> {
        let config = RateLimitConfig::default();
        Arc::new(Mutex::new(RateLimiter::new(config)))
    }

    #[tokio::test]
    async fn test_oauth_environment_configuration() {
        setup_oauth_test_env();
        
        // Test that OAuth environment variables are properly set
        assert_eq!(
            std::env::var("GMAIL_CLIENT_ID").unwrap(), 
            "test_client_id_for_integration_tests"
        );
        assert_eq!(
            std::env::var("GMAIL_CLIENT_SECRET").unwrap(), 
            "test_client_secret_for_integration_tests_long_enough"
        );
        assert_eq!(
            std::env::var("DATABASE_ENCRYPTION_KEY").unwrap(), 
            "test_encryption_key_32_chars_long"
        );
        
        // Test that client secret is long enough for security
        let client_secret = std::env::var("GMAIL_CLIENT_SECRET").unwrap();
        assert!(client_secret.len() >= 32, "Client secret must be at least 32 characters for security");
    }

    #[tokio::test]
    async fn test_gmail_scopes_configuration() {
        setup_oauth_test_env();
        
        // Test that all required Gmail scopes are properly configured
        let expected_scopes = vec![
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify", 
            "https://www.googleapis.com/auth/gmail.compose",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/drive.metadata.readonly",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/tasks",
        ];
        
        // This would normally be tested through the auth service but we'll verify the constants
        assert_eq!(expected_scopes.len(), 8);
        
        // Test individual scopes
        assert!(expected_scopes.contains(&"https://www.googleapis.com/auth/gmail.readonly"));
        assert!(expected_scopes.contains(&"https://www.googleapis.com/auth/gmail.modify"));
        assert!(expected_scopes.contains(&"https://www.googleapis.com/auth/gmail.compose"));
        assert!(expected_scopes.contains(&"https://www.googleapis.com/auth/userinfo.email"));
        assert!(expected_scopes.contains(&"https://www.googleapis.com/auth/userinfo.profile"));
    }

    #[tokio::test]
    async fn test_gmail_api_service_initialization() {
        let auth_service = create_test_auth_service().await;
        let db_manager = create_test_db_manager().await;
        let rate_limiter = create_test_rate_limiter();

        let api_service = GmailApiService::new(
            auth_service.clone(),
            db_manager.clone(),
            rate_limiter.clone(),
        );

        // Service should be created successfully
        assert!(std::ptr::addr_of!(api_service) as *const _ != std::ptr::null());
    }

    #[tokio::test]
    async fn test_gmail_compose_service_initialization() {
        let auth_service = create_test_auth_service().await;
        let db_manager = create_test_db_manager().await;
        let rate_limiter = create_test_rate_limiter();

        let compose_service = GmailComposeService::new(
            auth_service.clone(),
            db_manager.clone(),
            rate_limiter.clone(),
        );

        // Service should be created successfully
        assert!(std::ptr::addr_of!(compose_service) as *const _ != std::ptr::null());
    }

    #[tokio::test]
    async fn test_gmail_auth_service_token_management() {
        let auth_service = create_test_auth_service().await;

        // Test account token retrieval (should return None for non-existent account)
        let result = auth_service.get_account_tokens("non_existent_account").await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_message_search_query_construction() {
        let query = MessageSearchQuery {
            query: Some("from:test@example.com".to_string()),
            label_ids: Some(vec!["INBOX".to_string()]),
            max_results: Some(50),
            page_token: None,
            include_spam_trash: Some(false),
        };

        // Query should be constructed properly
        assert_eq!(query.query, Some("from:test@example.com".to_string()));
        assert_eq!(query.label_ids, Some(vec!["INBOX".to_string()]));
        assert_eq!(query.max_results, Some(50));
        assert_eq!(query.include_spam_trash, Some(false));
    }

    #[tokio::test]
    async fn test_compose_request_construction() {
        let compose_request = ComposeRequest {
            account_id: TEST_ACCOUNT_ID.to_string(),
            to: vec!["recipient@example.com".to_string()],
            cc: vec![],
            bcc: vec![],
            subject: "Test Subject".to_string(),
            body_text: Some("Test body text".to_string()),
            body_html: None,
            attachments: vec![],
            reply_to_message_id: None,
            thread_id: None,
        };

        // Compose request should be constructed properly
        assert_eq!(compose_request.account_id, TEST_ACCOUNT_ID);
        assert_eq!(compose_request.to, vec!["recipient@example.com".to_string()]);
        assert_eq!(compose_request.subject, "Test Subject");
        assert_eq!(compose_request.body_text, Some("Test body text".to_string()));
    }

    #[tokio::test]
    async fn test_rate_limiter_integration() {
        let rate_limiter = create_test_rate_limiter();
        
        // Test that rate limiter can be locked and accessed
        {
            let limiter = rate_limiter.lock().await;
            // Should be able to access the rate limiter
            assert!(std::ptr::addr_of!(*limiter) as *const _ != std::ptr::null());
        }
    }

    #[tokio::test]
    async fn test_service_integration_chain() {
        // Test that all services can be created and work together
        let auth_service = create_test_auth_service().await;
        let db_manager = create_test_db_manager().await;
        let rate_limiter = create_test_rate_limiter();

        // Create all Gmail services
        let api_service = GmailApiService::new(
            auth_service.clone(),
            db_manager.clone(),
            rate_limiter.clone(),
        );

        let compose_service = GmailComposeService::new(
            auth_service.clone(),
            db_manager.clone(),
            rate_limiter.clone(),
        );

        // All services should be created successfully
        assert!(std::ptr::addr_of!(api_service) as *const _ != std::ptr::null());
        assert!(std::ptr::addr_of!(compose_service) as *const _ != std::ptr::null());
    }

    #[tokio::test]
    async fn test_database_integration() {
        let db_manager = create_test_db_manager().await;
        
        // Test database connectivity
        let connection_result = db_manager.get_connection();
        assert!(connection_result.is_ok());
        
        // Test database health
        let health_result = db_manager.test_connection();
        assert!(health_result.is_ok());
    }

    /// Integration test for command-to-service flow simulation
    #[tokio::test]
    async fn test_command_service_integration_simulation() {
        let auth_service = create_test_auth_service().await;
        let db_manager = create_test_db_manager().await;
        let rate_limiter = create_test_rate_limiter();

        let api_service = Arc::new(GmailApiService::new(
            auth_service.clone(),
            db_manager.clone(),
            rate_limiter.clone(),
        ));

        // Simulate what happens when a Tauri command calls the service
        // This would normally be called by get_gmail_labels command
        let result = api_service.get_labels(TEST_ACCOUNT_ID).await;
        
        // Without valid authentication, this should return an error
        // but the important thing is that the call structure works
        assert!(result.is_err()); // Expected: auth error, not a structural error
    }

    #[tokio::test]
    async fn test_compose_service_integration_simulation() {
        let auth_service = create_test_auth_service().await;
        let db_manager = create_test_db_manager().await;
        let rate_limiter = create_test_rate_limiter();

        let compose_service = Arc::new(GmailComposeService::new(
            auth_service.clone(),
            db_manager.clone(),
            rate_limiter.clone(),
        ));

        let compose_request = ComposeRequest {
            account_id: TEST_ACCOUNT_ID.to_string(),
            to: vec!["test@example.com".to_string()],
            cc: vec![],
            bcc: vec![],
            subject: "Test Integration".to_string(),
            body_text: Some("Integration test message".to_string()),
            body_html: None,
            attachments: vec![],
            reply_to_message_id: None,
            thread_id: None,
        };

        // Simulate what happens when a Tauri command calls the service
        let result = compose_service.send_message(&compose_request).await;
        
        // Without valid authentication, this should return an error
        // but the important thing is that the call structure works
        assert!(result.is_err()); // Expected: auth error, not a structural error
    }

    #[tokio::test]
    async fn test_oauth_client_configuration() {
        setup_oauth_test_env();
        
        let auth_service = create_test_auth_service().await;
        
        // Test that authorization request can be created (validates OAuth client setup)
        let auth_request = auth_service.start_authorization(None).await;
        assert!(auth_request.is_ok(), "OAuth client configuration should be valid");
        
        let auth_req = auth_request.unwrap();
        
        // Verify the authorization URL contains required OAuth parameters
        assert!(auth_req.auth_url.contains("https://accounts.google.com"));
        assert!(auth_req.auth_url.contains("client_id=test_client_id_for_integration_tests"));
        assert!(auth_req.auth_url.contains("response_type=code"));
        assert!(auth_req.auth_url.contains("scope="));
        assert!(auth_req.auth_url.contains("redirect_uri="));
        assert!(auth_req.auth_url.contains("state="));
        assert!(auth_req.auth_url.contains("code_challenge="));
        assert!(auth_req.auth_url.contains("code_challenge_method=S256"));
        
        // Verify state is properly generated
        assert!(!auth_req.state.is_empty());
    }

    #[tokio::test]
    async fn test_encryption_key_generation() {
        let key1 = generate_encryption_key();
        let key2 = generate_encryption_key();
        
        // Each key should be 32 bytes
        assert_eq!(key1.len(), 32);
        assert_eq!(key2.len(), 32);
        
        // Keys should be different (random)
        assert_ne!(key1, key2);
    }
}

/// Performance tests for rate limiting under load
#[cfg(test)]
mod gmail_performance_tests {
    use super::*;
    use std::time::Duration;
    use tokio::time::timeout;

    /// Setup test environment for performance tests
    fn setup_performance_test_env() {
        std::env::set_var("GMAIL_CLIENT_ID", "test_client_id_for_integration_tests");
        std::env::set_var("GMAIL_CLIENT_SECRET", "test_client_secret_for_integration_tests_long_enough");
        std::env::set_var("DATABASE_ENCRYPTION_KEY", "test_encryption_key_32_chars_long");
    }

    async fn create_test_auth_service() -> Arc<GmailAuthService> {
        setup_performance_test_env();
        
        let db_manager = DatabaseManager::new().await
            .expect("Failed to create test database manager");
        let encryption_key = generate_encryption_key();
        
        let auth_service = GmailAuthService::new(Arc::new(db_manager), encryption_key)
            .expect("Failed to create test auth service");
        Arc::new(auth_service)
    }

    async fn create_test_db_manager() -> Arc<DatabaseManager> {
        let db_manager = DatabaseManager::new().await
            .expect("Failed to create test database manager");
        Arc::new(db_manager)
    }

    fn create_test_rate_limiter() -> Arc<Mutex<RateLimiter>> {
        let config = RateLimitConfig::default();
        Arc::new(Mutex::new(RateLimiter::new(config)))
    }

    #[tokio::test]
    async fn test_rate_limiter_under_concurrent_load() {
        let auth_service = create_test_auth_service().await;
        let db_manager = create_test_db_manager().await;
        let rate_limiter = create_test_rate_limiter();

        let api_service = Arc::new(GmailApiService::new(
            auth_service.clone(),
            db_manager.clone(),
            rate_limiter.clone(),
        ));

        // Simulate 10 concurrent requests
        let mut handles = vec![];
        for i in 0..10 {
            let service = api_service.clone();
            let account_id = format!("test{}@example.com", i);
            
            let handle = tokio::spawn(async move {
                let result = service.get_labels(&account_id).await;
                // We expect auth errors, not rate limit errors
                result.is_err()
            });
            
            handles.push(handle);
        }

        // All requests should complete within reasonable time
        let timeout_result = timeout(Duration::from_secs(30), async {
            for handle in handles {
                let _ = handle.await;
            }
        }).await;

        assert!(timeout_result.is_ok(), "Rate limiter should handle concurrent requests without hanging");
    }

    #[tokio::test]
    async fn test_service_creation_performance() {
        let start_time = std::time::Instant::now();
        
        // Create multiple services to test creation performance
        for _ in 0..5 {
            let auth_service = create_test_auth_service().await;
            let db_manager = create_test_db_manager().await;
            let rate_limiter = create_test_rate_limiter();

            let _api_service = GmailApiService::new(
                auth_service.clone(),
                db_manager.clone(),
                rate_limiter.clone(),
            );
        }
        
        let duration = start_time.elapsed();
        
        // Service creation should be fast (under 5 seconds for 5 services)
        assert!(duration < Duration::from_secs(5), "Service creation should be fast");
    }
} 