use anyhow::{anyhow, Result};
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge,
    PkceCodeVerifier, RedirectUrl, RevocationUrl, Scope, TokenResponse, TokenUrl,
    RefreshToken,
};
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{RwLock, oneshot};
use std::collections::HashMap;
use std::time::{Duration, SystemTime};
use tauri::{AppHandle, Manager, State};
use tokio::time::timeout;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use urlencoding;

// OAuth2 endpoints
const GMAIL_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GMAIL_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GMAIL_REVOKE_URL: &str = "https://oauth2.googleapis.com/revoke";

// Required scopes
const GMAIL_SCOPES: &[&str] = &[
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthConfig {
    pub redirect_uri: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthorizationRequest {
    pub auth_url: String,
    pub state: String,
    pub code_verifier: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthTokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub token_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthCallbackResult {
    pub code: String,
    pub state: String,
}

#[derive(Debug)]
struct PendingAuthorization {
    verifier: PkceCodeVerifier,
    csrf_token: CsrfToken,
    created_at: SystemTime,
}

pub struct SecureOAuthService {
    client_id: String,
    client_secret: String,
    pending_authorizations: Arc<RwLock<HashMap<String, PendingAuthorization>>>,
    oauth_callback_sender: Arc<RwLock<Option<oneshot::Sender<OAuthCallbackResult>>>>,
}

impl SecureOAuthService {
    /// Create a new OAuth service instance
    /// Client credentials are loaded from environment variables or secure config
    pub fn new() -> Result<Self> {
        // In production, load from secure configuration or environment
        let client_id = std::env::var("GMAIL_CLIENT_ID")
            .map_err(|_| anyhow!("GMAIL_CLIENT_ID not set"))?;
        let client_secret = std::env::var("GMAIL_CLIENT_SECRET")
            .map_err(|_| anyhow!("GMAIL_CLIENT_SECRET not set"))?;

        Ok(Self {
            client_id,
            client_secret,
            pending_authorizations: Arc::new(RwLock::new(HashMap::new())),
            oauth_callback_sender: Arc::new(RwLock::new(None)),
        })
    }

    /// Create OAuth2 client
    fn create_client(&self, redirect_uri: &str) -> Result<BasicClient> {
        let client = BasicClient::new(
            ClientId::new(self.client_id.clone()),
            Some(ClientSecret::new(self.client_secret.clone())),
            AuthUrl::new(GMAIL_AUTH_URL.to_string())?,
            Some(TokenUrl::new(GMAIL_TOKEN_URL.to_string())?),
        )
        .set_redirect_uri(RedirectUrl::new(redirect_uri.to_string())?)
        .set_revocation_uri(RevocationUrl::new(GMAIL_REVOKE_URL.to_string())?);

        Ok(client)
    }

    /// Start OAuth2 authorization flow with PKCE
    pub async fn start_authorization(&self, config: OAuthConfig) -> Result<AuthorizationRequest> {
        let client = self.create_client(&config.redirect_uri)?;

        // Generate PKCE challenge
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

        // Generate CSRF token
        let (auth_url, csrf_token) = client
            .authorize_url(CsrfToken::new_random)
            .add_scopes(GMAIL_SCOPES.iter().map(|&s| Scope::new(s.to_string())))
            .set_pkce_challenge(pkce_challenge)
            .add_extra_param("access_type", "offline")
            .add_extra_param("prompt", "consent")
            .url();

        // Store pending authorization
        let state = csrf_token.secret().clone();
        let pending = PendingAuthorization {
            verifier: pkce_verifier,
            csrf_token: csrf_token.clone(),
            created_at: SystemTime::now(),
        };

        {
            let mut pending_auths = self.pending_authorizations.write().await;
            pending_auths.insert(state.clone(), pending);
            
            // Clean up old pending authorizations (older than 10 minutes)
            pending_auths.retain(|_, auth| {
                auth.created_at.elapsed().unwrap_or(Duration::from_secs(0)) < Duration::from_secs(600)
            });
        }

        Ok(AuthorizationRequest {
            auth_url: auth_url.to_string(),
            state,
            code_verifier: "generated_by_backend".to_string(), // PKCE verifier is stored securely on backend
        })
    }

    /// Complete OAuth2 authorization flow
    pub async fn complete_authorization(
        &self,
        code: String,
        state: String,
        redirect_uri: String,
    ) -> Result<OAuthTokenResponse> {
        // Retrieve and remove pending authorization
        let pending = {
            let mut pending_auths = self.pending_authorizations.write().await;
            pending_auths.remove(&state)
                .ok_or_else(|| anyhow!("Invalid or expired authorization state"))?
        };

        // Verify CSRF token
        if pending.csrf_token.secret() != &state {
            return Err(anyhow!("CSRF token mismatch"));
        }

        // Exchange code for tokens
        let client = self.create_client(&redirect_uri)?;
        let token_result = client
            .exchange_code(AuthorizationCode::new(code))
            .set_pkce_verifier(pending.verifier)
            .request_async(async_http_client)
            .await
            .map_err(|e| anyhow!("Token exchange failed: {}", e))?;

        Ok(OAuthTokenResponse {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: token_result.refresh_token().map(|t| t.secret().clone()),
            expires_in: token_result.expires_in()
                .map(|d| d.as_secs())
                .unwrap_or(3600),
            token_type: "Bearer".to_string(),
        })
    }

    /// Refresh access token
    pub async fn refresh_token(
        &self,
        refresh_token: String,
        redirect_uri: String,
    ) -> Result<OAuthTokenResponse> {
        let client = self.create_client(&redirect_uri)?;
        
        let token_result = client
            .exchange_refresh_token(&RefreshToken::new(refresh_token.clone()))
            .request_async(async_http_client)
            .await
            .map_err(|e| anyhow!("Token refresh failed: {}", e))?;

        Ok(OAuthTokenResponse {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: Some(refresh_token), // Keep the same refresh token
            expires_in: token_result.expires_in()
                .map(|d| d.as_secs())
                .unwrap_or(3600),
            token_type: "Bearer".to_string(),
        })
    }

    /// Revoke tokens
    pub async fn revoke_token(&self, token: String) -> Result<()> {
        let client = reqwest::Client::new();
        let params = [("token", token)];

        let response = client
            .post(GMAIL_REVOKE_URL)
            .form(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Failed to revoke token: {}", response.status()));
        }

        Ok(())
    }

    /// Start OAuth callback server and wait for callback
    pub async fn start_oauth_callback_server_and_wait(&self, port: u16, expected_state: String, timeout_ms: u64) -> Result<OAuthCallbackResult> {
        let addr = format!("127.0.0.1:{}", port);
        let listener = TcpListener::bind(&addr).await?;
        
        println!("🌐 [OAUTH-SERVER] Started callback server on {}", addr);
        
        // Set up the callback channel 
        let (tx, rx) = oneshot::channel();
        
        // Start the server loop
        let expected_state_clone = expected_state.clone();
        tokio::spawn(async move {
            loop {
                match listener.accept().await {
                    Ok((stream, client_addr)) => {
                        println!("🔗 [OAUTH-SERVER] Received connection from {}", client_addr);
                        Self::handle_oauth_callback_simple(stream, expected_state_clone.clone(), tx).await;
                        break; // Exit after handling the first callback
                    }
                    Err(e) => {
                        eprintln!("❌ [OAUTH-SERVER] Failed to accept connection: {}", e);
                        break;
                    }
                }
            }
        });
        
        println!("⏳ [OAUTH-SERVER] Waiting for OAuth callback (timeout: {}ms)", timeout_ms);
        
        // Wait for the callback with timeout
        let result = timeout(Duration::from_millis(timeout_ms), rx).await;
        
        match result {
            Ok(Ok(callback_result)) => {
                println!("✅ [OAUTH-SERVER] Received OAuth callback successfully");
                Ok(callback_result)
            },
            Ok(Err(_)) => {
                eprintln!("❌ [OAUTH-SERVER] OAuth callback channel closed unexpectedly");
                Err(anyhow!("OAuth callback channel closed"))
            },
            Err(_) => {
                eprintln!("⏰ [OAUTH-SERVER] OAuth callback timeout after {}ms", timeout_ms);
                Err(anyhow!("OAuth callback timeout"))
            },
        }
    }

    /// Handle OAuth callback request (simple version)
    async fn handle_oauth_callback_simple(
        mut stream: tokio::net::TcpStream,
        expected_state: String,
        callback_sender: oneshot::Sender<OAuthCallbackResult>,
    ) {
        let mut sender = Some(callback_sender);
        let mut buffer = [0; 2048]; // Increased buffer size
        match stream.read(&mut buffer).await {
            Ok(size) => {
                let request = String::from_utf8_lossy(&buffer[..size]);
                println!("🔍 [OAUTH-SERVER] Received HTTP request:\n{}", request.lines().next().unwrap_or(""));
                
                // Parse the HTTP request to extract the callback URL
                if let Some(first_line) = request.lines().next() {
                    if first_line.starts_with("GET /auth/gmail/callback") {
                        // Extract query parameters
                        if let Some(query_start) = first_line.find('?') {
                            let query_end = first_line.rfind(" HTTP/").unwrap_or(first_line.len());
                            let query = &first_line[query_start + 1..query_end];
                            
                            println!("🔍 [OAUTH-SERVER] Parsing query string: {}", query);
                            
                            let mut code = None;
                            let mut state = None;
                            let mut error = None;
                            
                            for param in query.split('&') {
                                if let Some((key, value)) = param.split_once('=') {
                                    // URL decode the value
                                    let decoded_value = urlencoding::decode(value).unwrap_or_else(|_| value.into());
                                    match key {
                                        "code" => {
                                            code = Some(decoded_value.to_string());
                                            println!("✅ [OAUTH-SERVER] Found authorization code");
                                        },
                                        "state" => {
                                            state = Some(decoded_value.to_string());
                                            println!("✅ [OAUTH-SERVER] Found state parameter");
                                        },
                                        "error" => {
                                            error = Some(decoded_value.to_string());
                                            println!("❌ [OAUTH-SERVER] Found error parameter: {}", decoded_value);
                                        },
                                        _ => {}
                                    }
                                }
                            }
                            
                            if let Some(error_msg) = error {
                                // Send error response
                                let response = format!(
                                    "HTTP/1.1 400 Bad Request\r\nContent-Type: text/html\r\n\r\n<html><body><h1>Authorization Error</h1><p>OAuth error: {}</p></body></html>",
                                    error_msg
                                );
                                let _ = stream.write_all(response.as_bytes()).await;
                                println!("❌ [OAUTH-SERVER] OAuth error: {}", error_msg);
                                return;
                            }
                            
                            if let (Some(code), Some(state)) = (code, state) {
                                // Send success response
                                let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<html><body><h1>✅ Authorization Successful!</h1><p>You can close this browser window and return to LibreOllama.</p><script>setTimeout(() => window.close(), 3000);</script></body></html>";
                                let _ = stream.write_all(response.as_bytes()).await;
                                
                                println!("✅ [OAUTH-SERVER] Sending callback result: code={}, state={}", code.len(), state);
                                
                                // Send callback result
                                if let Some(tx) = sender.take() {
                                    let _ = tx.send(OAuthCallbackResult { code, state });
                                }
                                return;
                            }
                        }
                    }
                }
                
                // Send error response for invalid requests
                let response = "HTTP/1.1 400 Bad Request\r\nContent-Type: text/html\r\n\r\n<html><body><h1>❌ Authorization Failed</h1><p>Invalid OAuth callback request.</p></body></html>";
                let _ = stream.write_all(response.as_bytes()).await;
                println!("❌ [OAUTH-SERVER] Invalid callback request format");
            }
            Err(e) => {
                eprintln!("❌ [OAUTH-SERVER] Failed to read from stream: {}", e);
            }
        }
    }

    /// Wait for OAuth callback to complete
    pub async fn wait_for_oauth_callback(&self, timeout_ms: u64) -> Result<OAuthCallbackResult> {
        println!("⏳ [OAUTH-SERVER] Waiting for OAuth callback (timeout: {}ms)", timeout_ms);
        
        // Wait for an existing callback channel that should be set up by start_oauth_callback_server
        let rx = {
            let mut retries = 0;
            loop {
                let callback_sender = self.oauth_callback_sender.read().await;
                if callback_sender.is_some() {
                    break;
                }
                
                retries += 1;
                if retries > 100 { // 10 seconds of waiting
                    return Err(anyhow!("OAuth callback server not ready"));
                }
                
                drop(callback_sender);
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
            
            // Take the receiver from the sender
            let mut callback_sender = self.oauth_callback_sender.write().await;
            if let Some(tx) = callback_sender.take() {
                let (new_tx, rx) = oneshot::channel();
                *callback_sender = Some(new_tx);
                rx
            } else {
                return Err(anyhow!("OAuth callback channel not available"));
            }
        };
        
        // Wait for the callback with timeout
        let result = timeout(Duration::from_millis(timeout_ms), rx).await;
        
        match result {
            Ok(Ok(callback_result)) => {
                println!("✅ [OAUTH-SERVER] Received OAuth callback successfully");
                Ok(callback_result)
            },
            Ok(Err(_)) => {
                eprintln!("❌ [OAUTH-SERVER] OAuth callback channel closed unexpectedly");
                Err(anyhow!("OAuth callback channel closed"))
            },
            Err(_) => {
                eprintln!("⏰ [OAUTH-SERVER] OAuth callback timeout after {}ms", timeout_ms);
                Err(anyhow!("OAuth callback timeout"))
            },
        }
    }
}

// Tauri commands

#[tauri::command]
pub async fn start_gmail_oauth(
    config: OAuthConfig,
    oauth_service: State<'_, Arc<SecureOAuthService>>,
) -> Result<AuthorizationRequest, String> {
    oauth_service
        .start_authorization(config)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn complete_gmail_oauth(
    code: String,
    state: String,
    redirect_uri: String,
    oauth_service: State<'_, Arc<SecureOAuthService>>,
) -> Result<OAuthTokenResponse, String> {
    oauth_service
        .complete_authorization(code, state, redirect_uri)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn refresh_gmail_token(
    refresh_token: String,
    redirect_uri: String,
    oauth_service: State<'_, Arc<SecureOAuthService>>,
) -> Result<OAuthTokenResponse, String> {
    oauth_service
        .refresh_token(refresh_token, redirect_uri)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn revoke_gmail_token(
    token: String,
    oauth_service: State<'_, Arc<SecureOAuthService>>,
) -> Result<(), String> {
    oauth_service
        .revoke_token(token)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start_oauth_callback_server_and_wait(
    port: u16,
    expected_state: String,
    timeout_ms: u64,
    oauth_service: State<'_, Arc<SecureOAuthService>>,
) -> Result<OAuthCallbackResult, String> {
    oauth_service
        .start_oauth_callback_server_and_wait(port, expected_state, timeout_ms)
        .await
        .map_err(|e| e.to_string())
}

/// Initialize OAuth service in Tauri app
pub fn init_oauth_service(app: &AppHandle) -> Result<()> {
    let oauth_service = Arc::new(SecureOAuthService::new()?);
    app.manage(oauth_service);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_oauth_flow() {
        // This would require mock OAuth server for proper testing
        let service = SecureOAuthService::new().unwrap();
        
        let config = OAuthConfig {
            redirect_uri: "http://localhost:8080/auth/gmail/callback".to_string(),
        };
        
        let auth_request = service.start_authorization(config).await.unwrap();
        
        assert!(!auth_request.auth_url.is_empty());
        assert!(!auth_request.state.is_empty());
        assert!(!auth_request.code_verifier.is_empty());
    }
} 