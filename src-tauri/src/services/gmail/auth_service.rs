//! Gmail Authentication Service
//!
//! This module provides a unified interface for Gmail authentication operations,
//! consolidating OAuth2 flow, secure token storage, and account management.

use oauth2::{
    basic::BasicClient,
    reqwest::async_http_client,
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, 
    PkceCodeChallenge, PkceCodeVerifier, 
    RedirectUrl, RefreshToken, RevocationUrl, Scope, TokenUrl,
    TokenResponse, // Import the trait to use token methods
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tokio::sync::{oneshot, RwLock};

use crate::config::get_config_manager;
use crate::database::connection::DatabaseManager;
use crate::utils::crypto::{encrypt_data, decrypt_data};
use crate::errors::{LibreOllamaError, Result};

/// Gmail OAuth2 scopes
pub const GMAIL_SCOPES: &[&str] = &[
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/tasks",
];

/// Gmail OAuth2 endpoints
pub const GMAIL_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
pub const GMAIL_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
pub const GMAIL_REVOKE_URL: &str = "https://oauth2.googleapis.com/revoke";
pub const GMAIL_USERINFO_URL: &str = "https://www.googleapis.com/oauth2/v2/userinfo";

/// Configuration for Gmail OAuth2 authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub redirect_uri: String,
    pub client_id: String,
    pub client_secret: String,
}

/// Authorization request details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthorizationRequest {
    pub auth_url: String,
    pub state: String,
    pub code_verifier: String,
}

/// Token response from Gmail OAuth2 (renamed to avoid conflict)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailTokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub token_type: String,
    pub scope: Option<String>,
}

/// Gmail tokens for storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<String>,
    pub token_type: String,
}

/// User information from Gmail
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
}

/// Stored Gmail account information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredGmailAccount {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub is_active: bool,
    pub last_sync_at: Option<String>,
    pub created_at: String,
}

/// Result of OAuth2 callback processing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallbackResult {
    pub code: String,
    pub state: String,
}

#[derive(Debug)]
struct PendingAuthorization {
    verifier: PkceCodeVerifier,
    csrf_token: CsrfToken,
    created_at: SystemTime,
}

/// Comprehensive Gmail Authentication Service
/// 
/// This service provides a unified interface for all Gmail authentication operations,
/// consolidating OAuth2 flow, secure token storage, and account management.
#[derive(Debug, Clone)]
pub struct GmailAuthService {
    config: AuthConfig,
    pending_authorizations: Arc<RwLock<HashMap<String, PendingAuthorization>>>,
    #[allow(dead_code)]
    callback_sender: Arc<RwLock<Option<oneshot::Sender<CallbackResult>>>>,
    db_manager: Arc<DatabaseManager>,
    encryption_key: [u8; 32],
}

impl GmailAuthService {
    /// Create a new Gmail Authentication Service
    pub fn new(db_manager: Arc<DatabaseManager>, encryption_key: [u8; 32]) -> Result<Self> {
        let config_manager = get_config_manager()
            .map_err(|e| LibreOllamaError::Configuration {
                message: format!("Failed to get config manager: {}", e),
                config_key: None,
            })?;

        let auth_config = AuthConfig {
            redirect_uri: config_manager.oauth().redirect_uri.clone(),
            client_id: config_manager.oauth().client_id.clone(),
            client_secret: config_manager.oauth().client_secret.clone(),
        };

        // Validate configuration
        if auth_config.client_id.is_empty() || auth_config.client_secret.is_empty() {
            return Err(LibreOllamaError::GmailAuth { 
                message: "Gmail OAuth credentials not configured".to_string(),
                code: Some("missing_credentials".to_string()),
            });
        }

        Ok(Self {
            config: auth_config,
            pending_authorizations: Arc::new(RwLock::new(HashMap::new())),
            callback_sender: Arc::new(RwLock::new(None)),
            db_manager,
            encryption_key,
        })
    }

    /// Create OAuth2 client with proper configuration
    fn create_oauth_client(&self, redirect_uri: &str) -> Result<BasicClient> {
        Ok(BasicClient::new(
            ClientId::new(self.config.client_id.clone()),
            Some(ClientSecret::new(self.config.client_secret.clone())),
            AuthUrl::new(GMAIL_AUTH_URL.to_string())
                .map_err(|e| LibreOllamaError::OAuth {
                    message: format!("Invalid auth URL: {}", e),
                    step: "client_creation".to_string(),
                })?,
            Some(TokenUrl::new(GMAIL_TOKEN_URL.to_string())
                .map_err(|e| LibreOllamaError::OAuth {
                    message: format!("Invalid token URL: {}", e),
                    step: "client_creation".to_string(),
                })?),
        )
        .set_redirect_uri(RedirectUrl::new(redirect_uri.to_string())
            .map_err(|e| LibreOllamaError::OAuth {
                message: format!("Invalid redirect URI: {}", e),
                step: "client_creation".to_string(),
            })?)
        .set_revocation_uri(RevocationUrl::new(GMAIL_REVOKE_URL.to_string())
            .map_err(|e| LibreOllamaError::OAuth {
                message: format!("Invalid revocation URL: {}", e),
                step: "client_creation".to_string(),
            })?))
    }

    /// Start OAuth2 authorization flow with PKCE
    pub async fn start_authorization(&self, redirect_uri: Option<String>) -> Result<AuthorizationRequest> {
        let redirect_uri = redirect_uri.unwrap_or_else(|| self.config.redirect_uri.clone());
        let client = self.create_oauth_client(&redirect_uri)?;

        // Generate PKCE challenge for security
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

        // Generate CSRF token for state verification
        let (auth_url, csrf_token) = client
            .authorize_url(CsrfToken::new_random)
            .add_scopes(GMAIL_SCOPES.iter().map(|&s| Scope::new(s.to_string())))
            .set_pkce_challenge(pkce_challenge)
            .add_extra_param("access_type", "offline")
            .add_extra_param("prompt", "consent")
            .url();

        // Store pending authorization securely
        let state = csrf_token.secret().clone();
        let pending = PendingAuthorization {
            verifier: pkce_verifier,
            csrf_token: csrf_token.clone(),
            created_at: SystemTime::now(),
        };

        {
            let mut pending_auths = self.pending_authorizations.write().await;
            pending_auths.insert(state.clone(), pending);
            
            // Clean up expired authorizations (older than 10 minutes)
            pending_auths.retain(|_, auth| {
                auth.created_at.elapsed().unwrap_or(Duration::from_secs(0)) < Duration::from_secs(600)
            });
        }

        Ok(AuthorizationRequest {
            auth_url: auth_url.to_string(),
            state,
            code_verifier: "stored_securely_on_backend".to_string(),
        })
    }

    /// Complete OAuth2 authorization and exchange code for tokens
    pub async fn complete_authorization(
        &self,
        code: String,
        state: String,
        redirect_uri: Option<String>,
    ) -> Result<GmailTokenResponse> {
        let redirect_uri = redirect_uri.unwrap_or_else(|| self.config.redirect_uri.clone());

        // Retrieve and validate pending authorization
        let pending = {
            let mut pending_auths = self.pending_authorizations.write().await;
            pending_auths.remove(&state)
                .ok_or_else(|| LibreOllamaError::OAuth {
                    message: "Invalid or expired authorization state".to_string(),
                    step: "state_validation".to_string(),
                })?
        };

        // Verify CSRF token
        if pending.csrf_token.secret() != &state {
            return Err(LibreOllamaError::OAuth {
                message: "CSRF token mismatch".to_string(),
                step: "csrf_validation".to_string(),
            });
        }

        // Exchange authorization code for tokens
        let client = self.create_oauth_client(&redirect_uri)?;
        let token_result = client
            .exchange_code(AuthorizationCode::new(code))
            .set_pkce_verifier(pending.verifier)
            .request_async(async_http_client)
            .await
            .map_err(|e| LibreOllamaError::OAuth {
                message: format!("Token exchange failed: {}", e),
                step: "token_exchange".to_string(),
            })?;

        Ok(GmailTokenResponse {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: token_result.refresh_token().map(|t| t.secret().clone()),
            expires_in: token_result.expires_in()
                .map(|d| d.as_secs())
                .unwrap_or(3600),
            token_type: "Bearer".to_string(),
            scope: token_result.scopes()
                .map(|scopes| scopes.iter().map(|s| s.to_string()).collect::<Vec<_>>().join(" ")),
        })
    }

    /// Refresh access token using refresh token
    pub async fn refresh_token(
        &self,
        refresh_token: String,
        redirect_uri: Option<String>,
    ) -> Result<GmailTokenResponse> {
        let redirect_uri = redirect_uri.unwrap_or_else(|| self.config.redirect_uri.clone());
        let client = self.create_oauth_client(&redirect_uri)?;
        
        let token_result = client
            .exchange_refresh_token(&RefreshToken::new(refresh_token))
            .request_async(async_http_client)
            .await
            .map_err(|e| LibreOllamaError::OAuth {
                message: format!("Token refresh failed: {}", e),
                step: "token_refresh".to_string(),
            })?;

        Ok(GmailTokenResponse {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: token_result.refresh_token().map(|t| t.secret().clone()),
            expires_in: token_result.expires_in()
                .map(|d| d.as_secs())
                .unwrap_or(3600),
            token_type: "Bearer".to_string(),
            scope: token_result.scopes()
                .map(|scopes| scopes.iter().map(|s| s.to_string()).collect::<Vec<_>>().join(" ")),
        })
    }

    /// Get user information using access token
    pub async fn get_user_info(&self, access_token: &str) -> Result<UserInfo> {
        let client = Client::new();
        let response = client
            .get(GMAIL_USERINFO_URL)
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| LibreOllamaError::Network {
                message: format!("Failed to get user info: {}", e),
                url: Some(GMAIL_USERINFO_URL.to_string()),
            })?;

        if !response.status().is_success() {
            return Err(LibreOllamaError::GmailApi {
                message: format!("User info request failed with status: {}", response.status()),
                status_code: Some(response.status().as_u16()),
            });
        }

        let user_info: UserInfo = response.json().await
            .map_err(|e| LibreOllamaError::Serialization {
                message: format!("Failed to parse user info response: {}", e),
                data_type: "UserInfo".to_string(),
            })?;

        // Validate email
        if user_info.email.is_empty() || !user_info.email.contains('@') {
            return Err(LibreOllamaError::InvalidInput {
                message: "Invalid email address".to_string(),
                field: Some("user_email".to_string()),
            });
        }

        Ok(user_info)
    }

    /// Store Gmail tokens securely with account information
    pub async fn store_account_tokens(
        &self,
        account_id: String,
        tokens: GmailTokens,
        user_info: UserInfo,
    ) -> Result<()> {
        // Validate email format
        if user_info.email.is_empty() || !user_info.email.contains('@') {
            return Err(LibreOllamaError::InvalidInput {
                message: "Invalid email address".to_string(),
                field: Some("user_email".to_string()),
            });
        }

        let conn = self.db_manager.get_connection()
            .map_err(|e| LibreOllamaError::DatabaseQuery {
                message: format!("Failed to get database connection: {}", e),
                query_type: "connection".to_string(),
            })?;

        // Encrypt tokens before storage
        let access_token_encrypted = encrypt_data(&tokens.access_token, &self.encryption_key)
            .map_err(|e| LibreOllamaError::Crypto {
                message: format!("Failed to encrypt access token: {}", e),
            })?;

        let refresh_token_encrypted = if let Some(ref refresh_token) = tokens.refresh_token {
            Some(encrypt_data(refresh_token, &self.encryption_key)
                .map_err(|e| LibreOllamaError::Crypto {
                    message: format!("Failed to encrypt refresh token: {}", e),
                })?)
        } else {
            None
        };

        // Store account with encrypted tokens - retry logic for reliability
        let mut retry_count = 0;
        const MAX_RETRIES: u32 = 3;
        
        loop {
            let result = conn.execute(
                "INSERT OR REPLACE INTO gmail_accounts_secure (
                    id, email_address, display_name, profile_picture_url,
                    access_token_encrypted, refresh_token_encrypted, token_expires_at,
                    scopes, is_active, last_sync_at, created_at, updated_at, user_id
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                (
                    &account_id,
                    &user_info.email,
                    &user_info.name,
                    &user_info.picture,
                    &access_token_encrypted,
                    &refresh_token_encrypted,
                    &tokens.expires_at,
                    &serde_json::to_string(GMAIL_SCOPES).unwrap_or_default(),
                    true, // is_active
                    None::<String>, // last_sync_at
                    &chrono::Utc::now().to_rfc3339(),
                    &chrono::Utc::now().to_rfc3339(),
                    "default_user", // use default_user as user_id for now
                ),
            );
            
            match result {
                Ok(_) => break,
                Err(e) => {
                    retry_count += 1;
                    if retry_count >= MAX_RETRIES {
                        return Err(LibreOllamaError::DatabaseQuery {
                            message: format!("Failed to store account tokens after {} retries: {}", MAX_RETRIES, e),
                            query_type: "insert".to_string(),
                        });
                    }
                    // Wait a bit before retrying
                    tokio::time::sleep(tokio::time::Duration::from_millis(100 * retry_count as u64)).await;
                }
            }
        }

        Ok(())
    }

    /// Retrieve Gmail tokens for a specific account
    pub async fn get_account_tokens(&self, account_id: &str) -> Result<Option<GmailTokens>> {
        let conn = self.db_manager.get_connection()
            .map_err(|e| LibreOllamaError::DatabaseQuery {
                message: format!("Failed to get database connection: {}", e),
                query_type: "connection".to_string(),
            })?;

        // Add retry logic for token retrieval reliability
        let mut retry_count = 0;
        const MAX_RETRIES: u32 = 3;
        
        let result = loop {
            let query_result = conn.query_row(
                "SELECT access_token_encrypted, refresh_token_encrypted, token_expires_at
                 FROM gmail_accounts_secure WHERE id = ?1 AND is_active = 1",
                [account_id],
                |row| {
                    let access_token_encrypted: String = row.get(0)?;
                    let refresh_token_encrypted: Option<String> = row.get(1)?;
                    let expires_at: Option<String> = row.get(2)?;
                    
                    Ok((access_token_encrypted, refresh_token_encrypted, expires_at))
                },
            );
            
            match query_result {
                Ok(data) => break Ok(data),
                Err(rusqlite::Error::QueryReturnedNoRows) => break Err(rusqlite::Error::QueryReturnedNoRows),
                Err(e) => {
                    retry_count += 1;
                    if retry_count >= MAX_RETRIES {
                        break Err(e);
                    }
                    // Wait a bit before retrying
                    std::thread::sleep(std::time::Duration::from_millis(50 * retry_count as u64));
                }
            }
        };

        match result {
            Ok((access_encrypted, refresh_encrypted, expires_at)) => {
                // Decrypt tokens
                let access_token = decrypt_data(&access_encrypted, &self.encryption_key)
                    .map_err(|e| LibreOllamaError::Crypto {
                        message: format!("Failed to decrypt access token: {}", e),
                    })?;

                let refresh_token = if let Some(ref refresh_encrypted) = refresh_encrypted {
                    Some(decrypt_data(refresh_encrypted, &self.encryption_key)
                        .map_err(|e| LibreOllamaError::Crypto {
                            message: format!("Failed to decrypt refresh token: {}", e),
                        })?)
                } else {
                    None
                };

                Ok(Some(GmailTokens {
                    access_token,
                    refresh_token,
                    expires_at,
                    token_type: "Bearer".to_string(),
                }))
            },
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(LibreOllamaError::DatabaseQuery {
                message: format!("Failed to retrieve tokens: {}", e),
                query_type: "select".to_string(),
            }),
        }
    }

    /// Revoke a token (access or refresh)
    pub async fn revoke_token(&self, token: String) -> Result<()> {
        let client = Client::new();
        let response = client
            .post(GMAIL_REVOKE_URL)
            .form(&[("token", token.as_str())])
            .send()
            .await
            .map_err(|e| LibreOllamaError::Network {
                message: format!("Token revocation request failed: {}", e),
                url: Some(GMAIL_REVOKE_URL.to_string()),
            })?;

        if !response.status().is_success() {
            return Err(LibreOllamaError::GmailAuth {
                message: format!("Token revocation failed with status: {}", response.status()),
                code: Some(response.status().as_u16().to_string()),
            });
        }

        Ok(())
    }

    /// Get all accounts for a user
    pub async fn get_user_accounts(&self, user_id: &str) -> Result<Vec<StoredGmailAccount>> {
        let conn = self.db_manager.get_connection()
            .map_err(|e| LibreOllamaError::DatabaseQuery {
                message: format!("Failed to get database connection: {}", e),
                query_type: "connection".to_string(),
            })?;

        let mut stmt = conn.prepare(
            "SELECT id, email_address, display_name, profile_picture_url, 
                    is_active, last_sync_at, created_at
             FROM gmail_accounts_secure WHERE user_id = ?1"
        ).map_err(|e| LibreOllamaError::DatabaseQuery {
            message: format!("Failed to prepare statement: {}", e),
            query_type: "prepare".to_string(),
        })?;

        let rows = stmt.query_map([user_id], |row| {
            Ok(StoredGmailAccount {
                id: row.get(0)?,
                email: row.get(1)?,
                name: row.get(2)?,
                picture: row.get(3)?,
                is_active: row.get(4)?,
                last_sync_at: row.get(5)?,
                created_at: row.get(6)?,
            })
        }).map_err(|e| LibreOllamaError::DatabaseQuery {
            message: format!("Failed to query accounts: {}", e),
            query_type: "select".to_string(),
        })?;

        let mut accounts = Vec::new();
        for row in rows {
            accounts.push(row.map_err(|e| LibreOllamaError::DatabaseQuery {
                message: format!("Failed to process account row: {}", e),
                query_type: "select".to_string(),
            })?);
        }

        Ok(accounts)
    }

    /// Remove an account (delete from database and revoke tokens)
    pub async fn remove_account(&self, account_id: &str) -> Result<()> {
        // Try to fetch tokens to revoke them first, but don't block deletion if decryption fails
        let tokens_opt = match self.get_account_tokens(account_id).await {
            Ok(tokens) => tokens,
            Err(e) => {
                eprintln!(
                    "⚠️  [AUTH-WARNING] Could not retrieve tokens for account {} during removal: {}. Proceeding to delete account without revocation.",
                    account_id, e
                );
                None
            }
        };

        if let Some(tokens) = tokens_opt {
            // Revoke access token
            let _ = self.revoke_token(tokens.access_token).await;
            
            // Revoke refresh token if present
            if let Some(refresh_token) = tokens.refresh_token {
                let _ = self.revoke_token(refresh_token).await;
            }
        }

        // Remove from database
        let conn = self.db_manager.get_connection()
            .map_err(|e| LibreOllamaError::DatabaseQuery {
                message: format!("Failed to get database connection: {}", e),
                query_type: "connection".to_string(),
            })?;

        conn.execute(
            "DELETE FROM gmail_accounts_secure WHERE id = ?1",
            [account_id],
        ).map_err(|e| LibreOllamaError::DatabaseQuery {
            message: format!("Failed to delete account: {}", e),
            query_type: "delete".to_string(),
        })?;

        Ok(())
    }

    /// Check if a token is valid (not expired)
    pub async fn is_token_valid(&self, account_id: &str) -> Result<bool> {
        if let Some(tokens) = self.get_account_tokens(account_id).await? {
            if let Some(expires_at) = tokens.expires_at {
                // Attempt RFC3339 parsing first
                if let Ok(expires_time) = chrono::DateTime::parse_from_rfc3339(&expires_at) {
                    return Ok(expires_time.timestamp() > chrono::Utc::now().timestamp());
                }

                // If parsing failed, check if it is a numeric Unix timestamp (seconds or milliseconds)
                if expires_at.chars().all(|c| c.is_ascii_digit()) {
                    if let Ok(mut timestamp) = expires_at.parse::<i64>() {
                        // Detect millisecond precision (13-digit or greater)
                        if timestamp > 999_999_9999 { // > Sat Nov 20 2286 17:46:39 GMT
                            // Convert milliseconds to seconds
                            timestamp /= 1000;
                        }

                        return Ok(timestamp > chrono::Utc::now().timestamp());
                    }
                }

                // Log corrupted data only once per call path
                eprintln!("⚠️  [AUTH-WARNING] Corrupted expiration time for account {}: '{}' (unrecognized format)", account_id, expires_at);

                // Cleanup invalid expiration value so we don't spam logs in future checks
                if let Err(cleanup_error) = self.cleanup_corrupted_expiration(account_id).await {
                    eprintln!("⚠️  [AUTH-WARNING] Failed to cleanup corrupted expiration: {}", cleanup_error);
                }

                Ok(false)
            } else {
                Ok(true) // If no expiration time, assume valid
            }
        } else {
            Ok(false)
        }
    }
    
    /// Clean up corrupted expiration time data
    async fn cleanup_corrupted_expiration(&self, account_id: &str) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .map_err(|e| LibreOllamaError::DatabaseQuery {
                message: format!("Failed to get database connection: {}", e),
                query_type: "connection".to_string(),
            })?;

        conn.execute(
            "UPDATE gmail_accounts_secure SET token_expires_at = NULL WHERE id = ?1",
            [account_id],
        ).map_err(|e| LibreOllamaError::DatabaseQuery {
            message: format!("Failed to cleanup corrupted expiration: {}", e),
            query_type: "update".to_string(),
        })?;

        Ok(())
    }

    /// Validate tokens and refresh if necessary, returning valid tokens
    pub async fn validate_and_refresh_tokens(&self, _db_manager: &std::sync::Arc<DatabaseManager>, account_id: &str) -> Result<GmailTokens> {
        // Get current tokens
        let tokens = self.get_account_tokens(account_id).await?
            .ok_or_else(|| LibreOllamaError::GmailAuth {
                message: format!("No tokens found for account: {}", account_id),
                code: Some("NO_TOKENS".to_string()),
            })?;

        // Check if token is still valid
        if self.is_token_valid(account_id).await? {
            return Ok(tokens);
        }

        // Token is expired, try to refresh
        if let Some(refresh_token) = tokens.refresh_token {
            match self.refresh_token(refresh_token, None).await {
                Ok(new_token_response) => {
                    // Convert response to tokens and store
                    let new_tokens = GmailTokens {
                        access_token: new_token_response.access_token,
                        refresh_token: new_token_response.refresh_token,
                        expires_at: Some(
                            chrono::Utc::now()
                                .checked_add_signed(chrono::Duration::seconds(new_token_response.expires_in as i64))
                                .unwrap_or_else(chrono::Utc::now)
                                .to_rfc3339()
                        ),
                        token_type: new_token_response.token_type,
                    };

                    // Store the refreshed tokens
                    let conn = self.db_manager.get_connection()
                        .map_err(|e| LibreOllamaError::DatabaseQuery {
                            message: format!("Failed to get database connection: {}", e),
                            query_type: "connection".to_string(),
                        })?;

                    let access_token_encrypted = encrypt_data(&new_tokens.access_token, &self.encryption_key)
                        .map_err(|e| LibreOllamaError::Crypto {
                            message: format!("Failed to encrypt access token: {}", e),
                        })?;

                    let refresh_token_encrypted = if let Some(ref refresh) = new_tokens.refresh_token {
                        Some(encrypt_data(refresh, &self.encryption_key)
                            .map_err(|e| LibreOllamaError::Crypto {
                                message: format!("Failed to encrypt refresh token: {}", e),
                            })?)
                    } else {
                        None
                    };

                    conn.execute(
                        "UPDATE gmail_accounts_secure 
                         SET access_token_encrypted = ?1, refresh_token_encrypted = ?2, token_expires_at = ?3
                         WHERE id = ?4",
                        (
                            &access_token_encrypted,
                            &refresh_token_encrypted,
                            &new_tokens.expires_at,
                            account_id,
                        ),
                    ).map_err(|e| LibreOllamaError::DatabaseQuery {
                        message: format!("Failed to update tokens: {}", e),
                        query_type: "update".to_string(),
                    })?;

                    Ok(new_tokens)
                },
                Err(e) => {
                    Err(LibreOllamaError::GmailAuth {
                        message: format!("Failed to refresh token for account {}: {}", account_id, e),
                        code: Some("REFRESH_FAILED".to_string()),
                    })
                }
            }
        } else {
            Err(LibreOllamaError::GmailAuth {
                message: format!("No refresh token available for account: {}", account_id),
                code: Some("NO_REFRESH_TOKEN".to_string()),
            })
        }
    }

    /// Update last sync timestamp for an account
    #[allow(dead_code)]
    pub async fn update_sync_timestamp(&self, account_id: &str) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .map_err(|e| LibreOllamaError::DatabaseQuery {
                message: format!("Failed to get database connection: {}", e),
                query_type: "connection".to_string(),
            })?;

        conn.execute(
            "UPDATE gmail_accounts_secure SET last_sync_at = ?1 WHERE id = ?2",
            [&chrono::Utc::now().to_rfc3339(), account_id],
        ).map_err(|e| LibreOllamaError::DatabaseQuery {
            message: format!("Failed to update sync timestamp: {}", e),
            query_type: "update".to_string(),
        })?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
#[allow(unused_imports)]
use crate::database::connection;

    // Test helpers
    async fn setup_test_auth_service() -> Result<GmailAuthService> {
        // Set all required environment variables
        std::env::set_var("GMAIL_CLIENT_ID", "test_client_id_12345");
        std::env::set_var("GMAIL_CLIENT_SECRET", "test_client_secret_for_testing_purposes_very_long");
        std::env::set_var("DATABASE_ENCRYPTION_KEY", "test_encryption_key_that_is_32_characters_long");
        std::env::set_var("OAUTH_CALLBACK_PORT", "8080");
        
        // Initialize config first
        let _ = crate::config::get_config_manager();
        
        let db_manager = Arc::new(crate::database::init_database().await?);
        let encryption_key = [42u8; 32];
        
        GmailAuthService::new(db_manager, encryption_key)
    }

    #[tokio::test]
    async fn test_auth_service_creation() {
        let service = setup_test_auth_service().await;
        assert!(service.is_ok(), "Failed to create auth service: {:?}", service.err());
    }

    #[tokio::test]
    async fn test_token_encryption_decryption() {
        let test_token = "test_access_token_12345";
        let key = [42u8; 32];
        
        let encrypted = encrypt_data(test_token, &key).unwrap();
        let decrypted = decrypt_data(&encrypted, &key).unwrap();
        
        assert_eq!(test_token, decrypted);
    }

    #[test]
    fn test_gmail_scopes_configuration() {
        assert_eq!(GMAIL_SCOPES.len(), 8);
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/gmail.readonly"));
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/gmail.modify"));
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/gmail.compose"));
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/userinfo.email"));
        assert!(GMAIL_SCOPES.contains(&"https://www.googleapis.com/auth/userinfo.profile"));
    }
} 