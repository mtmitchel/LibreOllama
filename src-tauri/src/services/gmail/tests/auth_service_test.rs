#[cfg(test)]
mod tests {
    use super::super::*;
    use crate::database::connection::DatabaseManager;
    use std::sync::Arc;
    use tokio;

    // Test helpers
    async fn setup_test_auth_service() -> Result<GmailAuthService> {
        std::env::set_var("GMAIL_CLIENT_ID", "test_client_id");
        std::env::set_var("GMAIL_CLIENT_SECRET", "test_client_secret_for_testing");
        std::env::set_var("DATABASE_ENCRYPTION_KEY", "test_encryption_key_32_chars_long");
        
        let db_manager = Arc::new(crate::database::init_database().await?);
        let encryption_key = [42u8; 32];
        
        GmailAuthService::new(db_manager, encryption_key)
    }

    const TEST_USER_INFO: UserInfo = UserInfo {
        email: "test@gmail.com".to_string(),
        name: Some("Test User".to_string()),
        picture: Some("https://example.com/picture.jpg".to_string()),
    };

    const TEST_TOKENS: GmailTokens = GmailTokens {
        access_token: "ya29.test_access_token".to_string(),
        refresh_token: Some("1//test_refresh_token".to_string()),
        expires_at: Some("2024-12-31T23:59:59Z".to_string()),
        token_type: "Bearer".to_string(),
    };

    #[tokio::test]
    async fn test_auth_service_creation() {
        let service = setup_test_auth_service().await;
        assert!(service.is_ok(), "Failed to create auth service: {:?}", service.err());
    }

    #[tokio::test]
    async fn test_start_authorization_generates_valid_request() {
        let service = setup_test_auth_service().await.unwrap();
        
        let auth_request = service.start_authorization(None).await;
        assert!(auth_request.is_ok(), "Failed to start authorization: {:?}", auth_request.err());
        
        let auth_request = auth_request.unwrap();
        
        // Verify auth URL contains required parameters
        assert!(auth_request.auth_url.contains("https://accounts.google.com"));
        assert!(auth_request.auth_url.contains("response_type=code"));
        assert!(auth_request.auth_url.contains("client_id="));
        assert!(auth_request.auth_url.contains("scope="));
        assert!(auth_request.auth_url.contains("redirect_uri="));
        assert!(auth_request.auth_url.contains("state="));
        assert!(auth_request.auth_url.contains("code_challenge="));
        assert!(auth_request.auth_url.contains("code_challenge_method=S256"));
        
        // Verify state is returned
        assert!(!auth_request.state.is_empty());
        
        // Verify code verifier placeholder (actual verifier is stored securely)
        assert_eq!(auth_request.code_verifier, "stored_securely_on_backend");
    }

    #[tokio::test]
    async fn test_start_authorization_with_custom_redirect() {
        let service = setup_test_auth_service().await.unwrap();
        let custom_redirect = "http://localhost:3000/auth/callback".to_string();
        
        let auth_request = service.start_authorization(Some(custom_redirect.clone())).await;
        assert!(auth_request.is_ok());
        
        let auth_request = auth_request.unwrap();
        assert!(auth_request.auth_url.contains(&urlencoding::encode(&custom_redirect)));
    }

    #[tokio::test]
    async fn test_complete_authorization_with_invalid_state() {
        let service = setup_test_auth_service().await.unwrap();
        
        // Try to complete with invalid state
        let result = service.complete_authorization(
            "test_code".to_string(),
            "invalid_state".to_string(),
            None,
        ).await;
        
        assert!(result.is_err());
        if let Err(LibreOllamaError::OAuth { message, .. }) = result {
            assert!(message.contains("Invalid or expired authorization state"));
        } else {
            panic!("Expected OAuth error for invalid state");
        }
    }

    #[tokio::test]
    async fn test_token_encryption_decryption() {
        let test_token = "ya29.test_access_token_12345";
        let key = [42u8; 32];
        
        let encrypted = encrypt_data(test_token, &key).unwrap();
        let decrypted = decrypt_data(&encrypted, &key).unwrap();
        
        assert_eq!(test_token, decrypted);
        assert_ne!(test_token, encrypted); // Should be encrypted, not plain text
        assert!(encrypted.len() > test_token.len()); // Encrypted should be longer due to nonce
    }

    #[tokio::test]
    async fn test_store_and_retrieve_account_tokens() {
        let service = setup_test_auth_service().await.unwrap();
        let account_id = "test_account_123".to_string();
        
        // Store tokens
        let store_result = service.store_account_tokens(
            account_id.clone(),
            TEST_TOKENS.clone(),
            TEST_USER_INFO.clone(),
        ).await;
        assert!(store_result.is_ok(), "Failed to store tokens: {:?}", store_result.err());
        
        // Retrieve tokens
        let retrieved_tokens = service.get_account_tokens(&account_id).await;
        assert!(retrieved_tokens.is_ok(), "Failed to retrieve tokens: {:?}", retrieved_tokens.err());
        
        let retrieved_tokens = retrieved_tokens.unwrap();
        assert!(retrieved_tokens.is_some(), "No tokens found for account");
        
        let tokens = retrieved_tokens.unwrap();
        assert_eq!(tokens.access_token, TEST_TOKENS.access_token);
        assert_eq!(tokens.refresh_token, TEST_TOKENS.refresh_token);
        assert_eq!(tokens.expires_at, TEST_TOKENS.expires_at);
        assert_eq!(tokens.token_type, TEST_TOKENS.token_type);
    }

    #[tokio::test]
    async fn test_store_account_with_invalid_email() {
        let service = setup_test_auth_service().await.unwrap();
        
        let invalid_user_info = UserInfo {
            email: "invalid_email".to_string(), // Missing @ symbol
            name: Some("Test User".to_string()),
            picture: None,
        };
        
        let result = service.store_account_tokens(
            "test_account".to_string(),
            TEST_TOKENS.clone(),
            invalid_user_info,
        ).await;
        
        assert!(result.is_err());
        if let Err(LibreOllamaError::InvalidInput { message, field }) = result {
            assert!(message.contains("Invalid email address"));
            assert_eq!(field, Some("user_email".to_string()));
        } else {
            panic!("Expected InvalidInput error for invalid email");
        }
    }

    #[tokio::test]
    async fn test_get_user_accounts() {
        let service = setup_test_auth_service().await.unwrap();
        let user_id = "test_user@gmail.com";
        
        // Store a test account
        service.store_account_tokens(
            "account_1".to_string(),
            TEST_TOKENS.clone(),
            TEST_USER_INFO.clone(),
        ).await.unwrap();
        
        let accounts = service.get_user_accounts(user_id).await;
        assert!(accounts.is_ok(), "Failed to get user accounts: {:?}", accounts.err());
        
        let accounts = accounts.unwrap();
        assert_eq!(accounts.len(), 1);
        assert_eq!(accounts[0].email, TEST_USER_INFO.email);
        assert_eq!(accounts[0].name, TEST_USER_INFO.name);
        assert!(accounts[0].is_active);
    }

    #[tokio::test]
    async fn test_token_validation() {
        let service = setup_test_auth_service().await.unwrap();
        let account_id = "test_account_validation".to_string();
        
        // Store tokens with future expiration
        let future_tokens = GmailTokens {
            expires_at: Some(chrono::Utc::now().checked_add_signed(chrono::Duration::hours(1)).unwrap().to_rfc3339()),
            ..TEST_TOKENS.clone()
        };
        
        service.store_account_tokens(
            account_id.clone(),
            future_tokens,
            TEST_USER_INFO.clone(),
        ).await.unwrap();
        
        // Should be valid
        let is_valid = service.is_token_valid(&account_id).await;
        assert!(is_valid.is_ok() && is_valid.unwrap(), "Token should be valid");
        
        // Store tokens with past expiration
        let expired_tokens = GmailTokens {
            expires_at: Some(chrono::Utc::now().checked_sub_signed(chrono::Duration::hours(1)).unwrap().to_rfc3339()),
            ..TEST_TOKENS.clone()
        };
        
        service.store_account_tokens(
            account_id.clone(),
            expired_tokens,
            TEST_USER_INFO.clone(),
        ).await.unwrap();
        
        // Should be invalid
        let is_valid = service.is_token_valid(&account_id).await;
        assert!(is_valid.is_ok() && !is_valid.unwrap(), "Token should be expired");
    }

    #[tokio::test]
    async fn test_remove_account() {
        let service = setup_test_auth_service().await.unwrap();
        let account_id = "test_account_removal".to_string();
        
        // Store account
        service.store_account_tokens(
            account_id.clone(),
            TEST_TOKENS.clone(),
            TEST_USER_INFO.clone(),
        ).await.unwrap();
        
        // Verify it exists
        let tokens = service.get_account_tokens(&account_id).await.unwrap();
        assert!(tokens.is_some(), "Account should exist before removal");
        
        // Remove account
        let remove_result = service.remove_account(&account_id).await;
        assert!(remove_result.is_ok(), "Failed to remove account: {:?}", remove_result.err());
        
        // Verify it's gone
        let tokens = service.get_account_tokens(&account_id).await.unwrap();
        assert!(tokens.is_none(), "Account should not exist after removal");
    }

    #[tokio::test]
    async fn test_update_sync_timestamp() {
        let service = setup_test_auth_service().await.unwrap();
        let account_id = "test_account_sync".to_string();
        
        // Store account
        service.store_account_tokens(
            account_id.clone(),
            TEST_TOKENS.clone(),
            TEST_USER_INFO.clone(),
        ).await.unwrap();
        
        // Update sync timestamp
        let update_result = service.update_sync_timestamp(&account_id).await;
        assert!(update_result.is_ok(), "Failed to update sync timestamp: {:?}", update_result.err());
        
        // Verify timestamp was updated (would need to check database directly)
        // This is a basic test that the operation completes without error
    }

    #[tokio::test]
    async fn test_multiple_concurrent_authorizations() {
        let service = setup_test_auth_service().await.unwrap();
        
        // Start multiple authorization requests concurrently
        let auth1 = service.start_authorization(None);
        let auth2 = service.start_authorization(None);
        let auth3 = service.start_authorization(None);
        
        let (result1, result2, result3) = tokio::join!(auth1, auth2, auth3);
        
        assert!(result1.is_ok(), "First auth should succeed");
        assert!(result2.is_ok(), "Second auth should succeed");
        assert!(result3.is_ok(), "Third auth should succeed");
        
        // All should have different states
        let auth1 = result1.unwrap();
        let auth2 = result2.unwrap();
        let auth3 = result3.unwrap();
        
        assert_ne!(auth1.state, auth2.state);
        assert_ne!(auth2.state, auth3.state);
        assert_ne!(auth1.state, auth3.state);
    }

    #[tokio::test]
    async fn test_authorization_cleanup() {
        let service = setup_test_auth_service().await.unwrap();
        
        // Start authorization
        let auth_request = service.start_authorization(None).await.unwrap();
        
        // Verify pending authorization exists (indirectly by trying to complete with valid state)
        // In a real scenario, we'd have access to the internal state
        
        // For testing cleanup, we rely on the 10-minute timeout mechanism
        // which is tested by the internal cleanup in start_authorization
        
        // This test verifies the basic flow works without panicking
        assert!(!auth_request.state.is_empty());
    }

    #[tokio::test] 
    async fn test_gmail_scopes_configuration() {
        // Verify all required Gmail scopes are present
        assert_eq!(GMAIL_SCOPES.len(), 5);
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/gmail.readonly"));
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/gmail.send"));
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/gmail.modify"));
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/gmail.compose"));
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/userinfo.email"));
    }

    #[tokio::test]
    async fn test_oauth_urls_configuration() {
        // Verify OAuth URLs are correctly configured
        assert_eq!(GMAIL_AUTH_URL, "https://accounts.google.com/o/oauth2/v2/auth");
        assert_eq!(GMAIL_TOKEN_URL, "https://oauth2.googleapis.com/token");
        assert_eq!(GMAIL_USERINFO_URL, "https://www.googleapis.com/oauth2/v2/userinfo");
        assert_eq!(GMAIL_REVOKE_URL, "https://oauth2.googleapis.com/revoke");
    }

    #[tokio::test]
    async fn test_error_handling_edge_cases() {
        let service = setup_test_auth_service().await.unwrap();
        
        // Test retrieving tokens for non-existent account
        let tokens = service.get_account_tokens("non_existent_account").await;
        assert!(tokens.is_ok());
        assert!(tokens.unwrap().is_none());
        
        // Test token validation for non-existent account
        let is_valid = service.is_token_valid("non_existent_account").await;
        assert!(is_valid.is_ok());
        assert!(!is_valid.unwrap());
        
        // Test removing non-existent account (should not error)
        let remove_result = service.remove_account("non_existent_account").await;
        assert!(remove_result.is_ok());
    }
} 