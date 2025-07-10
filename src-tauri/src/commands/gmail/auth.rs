//! Gmail Authentication Commands
//!
//! This module provides Tauri command handlers for Gmail authentication,
//! delegating all business logic to the GmailAuthService.

use tauri::State;
use std::sync::Arc;
use serde::{Deserialize, Serialize};

use crate::services::gmail::auth_service::{
    GmailAuthService, AuthorizationRequest, GmailTokenResponse, 
    GmailTokens, UserInfo, CallbackResult, StoredGmailAccount
};
use crate::database::connection::DatabaseManager;

// =============================================================================
// Configuration Structures
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthConfig {
    pub redirect_uri: String,
}

// =============================================================================
// Command Handlers
// =============================================================================

/// Start Gmail OAuth2 authorization flow
#[tauri::command]
pub async fn start_gmail_oauth(
    config: OAuthConfig,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<AuthorizationRequest, String> {
    auth_service
        .start_authorization(Some(config.redirect_uri))
        .await
        .map_err(|e| e.to_string())
}

/// Start OAuth flow with automatic callback handling
#[tauri::command]
pub async fn start_gmail_oauth_with_callback(
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<GmailTokenResponse, String> {
    use std::sync::{Arc, Mutex};
    use std::thread;
    use std::time::Duration;
    use std::collections::HashMap;
    use url::Url;
    
    // Start a temporary HTTP server on localhost:8080
    let result = Arc::new(Mutex::new(None));
    let result_clone = result.clone();
    
    let server_handle = thread::spawn(move || {
        use std::io::prelude::*;
        use std::net::{TcpListener, TcpStream};
        
        let listener = TcpListener::bind("127.0.0.1:8080").unwrap();
        listener.set_nonblocking(true).unwrap();
        
        for _ in 0..300 { // 30 second timeout (100ms * 300)
            if let Ok((mut stream, _)) = listener.accept() {
                let mut buffer = [0; 1024];
                if let Ok(_) = stream.read(&mut buffer) {
                    let request = String::from_utf8_lossy(&buffer[..]);
                    if let Some(line) = request.lines().next() {
                        if line.contains("GET /auth/callback") {
                            // Extract code from URL
                            if let Some(query_start) = line.find("?") {
                                if let Some(query_end) = line.find(" HTTP/") {
                                    let query = &line[query_start+1..query_end];
                                    let params: HashMap<&str, &str> = query
                                        .split('&')
                                        .filter_map(|param| {
                                            let mut parts = param.split('=');
                                            Some((parts.next()?, parts.next()?))
                                        })
                                        .collect();
                                    
                                    if let (Some(code), Some(state)) = (params.get("code"), params.get("state")) {
                                        *result_clone.lock().unwrap() = Some((code.to_string(), state.to_string()));
                                        
                                        // Send success response
                                        let response = "HTTP/1.1 200 OK\r\n\r\n<html><body><h1>Authentication successful!</h1><p>You can close this window.</p></body></html>";
                                        let _ = stream.write(response.as_bytes());
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            thread::sleep(Duration::from_millis(100));
        }
    });
    
    // Start OAuth flow
    let auth_request = auth_service
        .start_authorization(Some("http://localhost:8080/auth/callback".to_string()))
        .await
        .map_err(|e| e.to_string())?;
    
    // Open browser
    if let Err(e) = open::that(&auth_request.auth_url) {
        return Err(format!("Failed to open browser: {}", e));
    }
    
    // Wait for callback
    server_handle.join().map_err(|_| "Server thread failed")?;
    
    let (code, state) = result.lock().unwrap().take()
        .ok_or("OAuth callback timeout or failed")?;
    
    // Complete OAuth flow
    auth_service
        .complete_authorization(code, state, Some("http://localhost:8080/auth/callback".to_string()))
        .await
        .map_err(|e| e.to_string())
}

/// Complete Gmail OAuth2 authorization flow
#[tauri::command]
pub async fn complete_gmail_oauth(
    code: String,
    state: String,
    redirect_uri: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<GmailTokenResponse, String> {
    auth_service
        .complete_authorization(code, state, Some(redirect_uri))
        .await
        .map_err(|e| e.to_string())
}

/// Refresh Gmail access token
#[tauri::command]
pub async fn refresh_gmail_token(
    refresh_token: String,
    redirect_uri: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<GmailTokenResponse, String> {
    auth_service
        .refresh_token(refresh_token, Some(redirect_uri))
        .await
        .map_err(|e| e.to_string())
}

/// Revoke Gmail token
#[tauri::command]
pub async fn revoke_gmail_token(
    token: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<(), String> {
    auth_service
        .revoke_token(token)
        .await
        .map_err(|e| e.to_string())
}

/// Get user information using access token
#[tauri::command]
pub async fn get_gmail_user_info(
    access_token: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<UserInfo, String> {
    auth_service
        .get_user_info(&access_token)
        .await
        .map_err(|e| e.to_string())
}

/// Store Gmail tokens securely
#[tauri::command]
pub async fn store_gmail_tokens_secure(
    account_id: String,
    tokens: GmailTokens,
    user_info: UserInfo,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<(), String> {
    auth_service
        .store_account_tokens(account_id, tokens, user_info)
        .await
        .map_err(|e| e.to_string())
}

/// Get Gmail tokens for an account
#[tauri::command]
pub async fn get_gmail_tokens_secure(
    account_id: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<Option<GmailTokens>, String> {
    auth_service
        .get_account_tokens(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get all Gmail accounts for a user
#[tauri::command]
pub async fn get_gmail_accounts_secure(
    user_id: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<Vec<StoredGmailAccount>, String> {
    auth_service
        .get_user_accounts(&user_id)
        .await
        .map_err(|e| e.to_string())
}

/// Remove Gmail account
#[tauri::command]
pub async fn remove_gmail_tokens_secure(
    account_id: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<(), String> {
    auth_service
        .remove_account(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Clear Gmail tokens for a specific account (for token corruption recovery)
#[tauri::command]
pub async fn clear_gmail_tokens(
    account_id: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<(), String> {
    auth_service
        .remove_account(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Update Gmail sync timestamp
#[tauri::command]
pub async fn update_gmail_sync_timestamp_secure(
    account_id: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<(), String> {
    auth_service
        .update_sync_timestamp(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Check if Gmail token is valid
#[tauri::command]
pub async fn check_token_validity_secure(
    account_id: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<bool, String> {
    auth_service
        .is_token_valid(&account_id)
        .await
        .map_err(|e| e.to_string())
}

/// Validate and refresh tokens if needed
#[tauri::command]
pub async fn validate_and_refresh_gmail_tokens(
    account_id: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
    db_manager: State<'_, DatabaseManager>,
) -> Result<GmailTokens, String> {
    auth_service
        .validate_and_refresh_tokens(&Arc::new(db_manager.inner().clone()), &account_id)
        .await
        .map_err(|e| e.to_string())
}

// =============================================================================
// Legacy Command Stubs (for migration compatibility)
// =============================================================================

/// Legacy OAuth callback server (deprecated, kept for compatibility)
#[tauri::command]
pub async fn start_oauth_callback_server_and_wait(
    _port: u16,
    _expected_state: String,
    _timeout_ms: u64,
) -> Result<CallbackResult, String> {
    Err("This command is deprecated. Use the new OAuth flow with proper redirect URIs.".to_string())
}

/// Legacy token migration (deprecated)
#[tauri::command] 
pub async fn migrate_tokens_to_secure_storage(
    _db_manager: State<'_, DatabaseManager>,
) -> Result<u32, String> {
    Ok(0) // No migration needed with new architecture
}

/// Legacy table creation (deprecated)
#[tauri::command]
pub async fn create_secure_accounts_table(
    _db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    Ok(()) // Table creation is handled by database initialization
}

/// Legacy account check (deprecated)
#[tauri::command]
pub async fn check_legacy_gmail_accounts(
    _db_manager: State<'_, DatabaseManager>,
) -> Result<bool, String> {
    Ok(false) // No legacy accounts with new architecture
}

/// Legacy table check (deprecated)
#[tauri::command]
pub async fn check_secure_accounts_table(
    _db_manager: State<'_, DatabaseManager>,
) -> Result<bool, String> {
    Ok(true) // Table always exists with new architecture
} 