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

/// Get user information using access token (for initial auth flow)
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

/// Debug command to check secure table existence and contents
#[tauri::command]
pub async fn debug_gmail_secure_table(
    auth_service: State<'_, Arc<GmailAuthService>>,
    db_manager: State<'_, DatabaseManager>,
) -> Result<String, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    // Check if table exists
    let table_exists = conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='gmail_accounts_secure'")
        .map_err(|e| e.to_string())?
        .exists([])
        .map_err(|e| e.to_string())?;
    
    if !table_exists {
        return Ok("gmail_accounts_secure table does not exist".to_string());
    }
    
    // Get table info
    let mut stmt = conn.prepare("PRAGMA table_info(gmail_accounts_secure)").map_err(|e| e.to_string())?;
    let column_info: Vec<String> = stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        let data_type: String = row.get(2)?;
        Ok(format!("{}: {}", name, data_type))
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;
    
    // Count rows
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM gmail_accounts_secure", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    Ok(format!(
        "Table exists: true\nColumns: {}\nRows: {}",
        column_info.join(", "),
        count
    ))
}

/// Debug Gmail token expiration times
#[tauri::command]
pub async fn debug_gmail_token_expiration(
    db_manager: State<'_, DatabaseManager>,
) -> Result<String, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    // Get all accounts and their expiration times
    let mut stmt = conn.prepare(
        "SELECT id, email_address, token_expires_at FROM gmail_accounts_secure WHERE is_active = 1"
    ).map_err(|e| e.to_string())?;
    
    let mut results = Vec::new();
    let rows = stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        let email: String = row.get(1)?;
        let expires_at: Option<String> = row.get(2)?;
        Ok((id, email, expires_at))
    }).map_err(|e| e.to_string())?;
    
    for row in rows {
        let (id, email, expires_at) = row.map_err(|e| e.to_string())?;
        
        let status = match expires_at {
            Some(ref expires_str) => {
                // Try to parse as RFC3339
                match chrono::DateTime::parse_from_rfc3339(expires_str) {
                    Ok(expires_time) => {
                        let now = chrono::Utc::now().timestamp();
                        let expires_timestamp = expires_time.timestamp();
                        if expires_timestamp > now {
                            format!("VALID (expires in {} seconds)", expires_timestamp - now)
                        } else {
                            format!("EXPIRED ({} seconds ago)", now - expires_timestamp)
                        }
                    }
                    Err(e) => {
                        // Check if it's a unix timestamp
                        if expires_str.chars().all(|c| c.is_ascii_digit()) {
                            if let Ok(timestamp) = expires_str.parse::<i64>() {
                                let now = chrono::Utc::now().timestamp();
                                if timestamp > now {
                                    format!("VALID (unix timestamp, expires in {} seconds)", timestamp - now)
                                } else {
                                    format!("EXPIRED (unix timestamp, {} seconds ago)", now - timestamp)
                                }
                            } else {
                                format!("CORRUPTED (failed to parse as timestamp): '{}'", expires_str)
                            }
                        } else {
                            format!("CORRUPTED (not RFC3339 or timestamp): '{}' - {}", expires_str, e)
                        }
                    }
                }
            }
            None => "NO_EXPIRATION".to_string(),
        };
        
        results.push(format!("Account: {} ({})\n  Expires At: {:?}\n  Status: {}", 
                           id, email, expires_at, status));
    }
    
    if results.is_empty() {
        Ok("No active Gmail accounts found".to_string())
    } else {
        Ok(format!("Gmail Token Expiration Debug:\n\n{}", results.join("\n\n")))
    }
}

/// Clean up corrupted Gmail token expiration times
#[tauri::command]
pub async fn cleanup_corrupted_gmail_tokens(
    db_manager: State<'_, DatabaseManager>,
) -> Result<String, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    // Find corrupted expiration times
    let mut stmt = conn.prepare(
        "SELECT id, email_address, token_expires_at FROM gmail_accounts_secure WHERE is_active = 1 AND token_expires_at IS NOT NULL"
    ).map_err(|e| e.to_string())?;
    
    let mut corrupted_accounts = Vec::new();
    let rows = stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        let email: String = row.get(1)?;
        let expires_at: String = row.get(2)?;
        Ok((id, email, expires_at))
    }).map_err(|e| e.to_string())?;
    
    for row in rows {
        let (id, email, expires_at) = row.map_err(|e| e.to_string())?;
        
        // Check if the expiration time is corrupted
        if chrono::DateTime::parse_from_rfc3339(&expires_at).is_err() {
            // Also check if it's not a valid unix timestamp
            if !expires_at.chars().all(|c| c.is_ascii_digit()) || expires_at.parse::<i64>().is_err() {
                corrupted_accounts.push((id, email, expires_at));
            }
        }
    }
    
    if corrupted_accounts.is_empty() {
        return Ok("No corrupted token expiration times found".to_string());
    }
    
    // Clean up corrupted entries
    let mut cleaned_count = 0;
    for (id, email, corrupted_value) in &corrupted_accounts {
        match conn.execute(
            "UPDATE gmail_accounts_secure SET token_expires_at = NULL WHERE id = ?1",
            [id],
        ) {
            Ok(_) => {
                cleaned_count += 1;
                println!("✅ Cleaned up corrupted expiration for account {} ({}): '{}'", id, email, corrupted_value);
            }
            Err(e) => {
                eprintln!("❌ Failed to clean up account {} ({}): {}", id, email, e);
            }
        }
    }
    
    Ok(format!(
        "Cleanup completed:\n- Found {} corrupted expiration times\n- Successfully cleaned up {} accounts\n- These accounts will need to re-authenticate",
        corrupted_accounts.len(),
        cleaned_count
    ))
} 