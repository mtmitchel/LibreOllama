// Gmail Services Test Suite
// Comprehensive unit and integration tests for all Gmail services

pub mod auth_service_test;
pub mod api_service_test; 
pub mod sync_service_test;
pub mod compose_service_test;
pub mod cache_service_test;
pub mod attachment_service_test;
pub mod test_helpers;

// Common test utilities and mocks
use crate::database::connection::DatabaseManager;
use std::sync::Arc;

/// Create a test database manager for all Gmail service tests
pub async fn create_test_db_manager() -> Result<Arc<DatabaseManager>, Box<dyn std::error::Error>> {
    // Set test environment variables
    std::env::set_var("GMAIL_CLIENT_ID", "test_client_id");
    std::env::set_var("GMAIL_CLIENT_SECRET", "test_client_secret_for_testing_purposes_only");
    std::env::set_var("DATABASE_ENCRYPTION_KEY", "test_encryption_key_32_chars_long");
    
    let db_manager = crate::database::init_database().await?;
    Ok(Arc::new(db_manager))
}

/// Test encryption key for all services
pub const TEST_ENCRYPTION_KEY: [u8; 32] = [42u8; 32];

/// Common test account data
pub const TEST_ACCOUNT_ID: &str = "test_account_123";
pub const TEST_USER_EMAIL: &str = "test@gmail.com";
pub const TEST_ACCESS_TOKEN: &str = "ya29.test_access_token";
pub const TEST_REFRESH_TOKEN: &str = "1//test_refresh_token"; 