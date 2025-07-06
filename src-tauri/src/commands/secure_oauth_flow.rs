use anyhow::{anyhow, Result};
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge,
    PkceCodeVerifier, RedirectUrl, RevocationUrl, Scope, TokenResponse, TokenUrl,
    AccessToken, RefreshToken,
};
use oauth2::basic::{BasicClient, BasicTokenType};
use oauth2::reqwest::async_http_client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use std::time::{Duration, SystemTime};
use tauri::{AppHandle, Manager, State};

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
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub token_type: String,
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
            verifier: pkce_verifier.clone(),
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
            code_verifier: pkce_verifier.secret().clone(),
        })
    }

    /// Complete OAuth2 authorization flow
    pub async fn complete_authorization(
        &self,
        code: String,
        state: String,
        redirect_uri: String,
    ) -> Result<TokenResponse> {
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

        Ok(TokenResponse {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: token_result.refresh_token().map(|t| t.secret().clone()),
            expires_in: token_result.expires_in()
                .map(|d| d.as_secs())
                .unwrap_or(3600),
            token_type: match token_result.token_type() {
                Some(BasicTokenType::Bearer) => "Bearer".to_string(),
                _ => "Bearer".to_string(),
            },
        })
    }

    /// Refresh access token
    pub async fn refresh_token(
        &self,
        refresh_token: String,
        redirect_uri: String,
    ) -> Result<TokenResponse> {
        let client = self.create_client(&redirect_uri)?;
        
        let token_result = client
            .exchange_refresh_token(&RefreshToken::new(refresh_token.clone()))
            .request_async(async_http_client)
            .await
            .map_err(|e| anyhow!("Token refresh failed: {}", e))?;

        Ok(TokenResponse {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: Some(refresh_token), // Keep the same refresh token
            expires_in: token_result.expires_in()
                .map(|d| d.as_secs())
                .unwrap_or(3600),
            token_type: match token_result.token_type() {
                Some(BasicTokenType::Bearer) => "Bearer".to_string(),
                _ => "Bearer".to_string(),
            },
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
) -> Result<TokenResponse, String> {
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
) -> Result<TokenResponse, String> {
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
            redirect_uri: "http://localhost:1423/auth/gmail/callback".to_string(),
        };
        
        let auth_request = service.start_authorization(config).await.unwrap();
        
        assert!(!auth_request.auth_url.is_empty());
        assert!(!auth_request.state.is_empty());
        assert!(!auth_request.code_verifier.is_empty());
    }
} 