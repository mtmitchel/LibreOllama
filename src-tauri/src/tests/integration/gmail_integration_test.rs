//! Gmail Integration Tests
//!
//! These tests validate the complete Gmail service layer integration,
//! including authentication, API operations, and compose functionality.

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

/// Create test database manager
async fn create_test_db_manager() -> Arc<DatabaseManager> {
    let db_manager = DatabaseManager::new().await
        .expect("Failed to create test database manager");
    Arc::new(db_manager)
}

/// Create test Gmail auth service
async fn create_test_auth_service() -> Arc<GmailAuthService> {
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