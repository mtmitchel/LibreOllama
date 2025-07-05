use anyhow::{anyhow, Result};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use chrono::{DateTime, Utc};
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge,
    PkceCodeVerifier, RedirectUrl, RevocationUrl, Scope, TokenResponse, TokenUrl,
};
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;
use tokio::sync::oneshot;
use url::Url;

// Gmail API Configuration
const GMAIL_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GMAIL_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GMAIL_REVOKE_URL: &str = "https://oauth2.googleapis.com/revoke";
const GMAIL_API_BASE: &str = "https://gmail.googleapis.com/gmail/v1";

// Gmail API Scopes
const GMAIL_SCOPES: &[&str] = &[
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.compose",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailConfig {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub token_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GmailMessage {
    pub id: String,
    pub thread_id: String,
    pub label_ids: Vec<String>,
    pub snippet: String,
    pub payload: GmailPayload,
    pub size_estimate: Option<i64>,
    pub history_id: Option<String>,
    pub internal_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GmailPayload {
    pub part_id: Option<String>,
    pub mime_type: String,
    pub filename: Option<String>,
    pub headers: Vec<GmailHeader>,
    pub body: Option<GmailBody>,
    pub parts: Option<Vec<GmailPayload>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GmailHeader {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GmailBody {
    pub attachment_id: Option<String>,
    pub size: Option<i64>,
    pub data: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GmailLabel {
    pub id: String,
    pub name: String,
    pub message_list_visibility: Option<String>,
    pub label_list_visibility: Option<String>,
    #[serde(rename = "type")]
    pub label_type: Option<String>,
    pub messages_total: Option<i32>,
    pub messages_unread: Option<i32>,
    pub threads_total: Option<i32>,
    pub threads_unread: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GmailListResponse<T> {
    pub messages: Option<Vec<T>>,
    pub threads: Option<Vec<T>>,
    pub labels: Option<Vec<T>>,
    pub next_page_token: Option<String>,
    pub result_size_estimate: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SendEmailRequest {
    pub to: Vec<String>,
    pub cc: Option<Vec<String>>,
    pub bcc: Option<Vec<String>>,
    pub subject: String,
    pub body: String,
    pub html_body: Option<String>,
}

// OAuth2 state management
#[derive(Debug)]
pub struct OAuthState {
    pub verifier: PkceCodeVerifier,
    pub sender: oneshot::Sender<Result<String>>,
}

pub type OAuthStateMap = Arc<Mutex<HashMap<String, OAuthState>>>;

#[derive(Debug)]
pub struct GmailService {
    pub config: GmailConfig,
    pub tokens: Option<GmailTokens>,
    pub client: Client,
    pub oauth_client: BasicClient,
}

impl GmailService {
    pub fn new(config: GmailConfig) -> Result<Self> {
        let oauth_client = BasicClient::new(
            ClientId::new(config.client_id.clone()),
            Some(ClientSecret::new(config.client_secret.clone())),
            AuthUrl::new(GMAIL_AUTH_URL.to_string())?,
            Some(TokenUrl::new(GMAIL_TOKEN_URL.to_string())?),
        )
        .set_redirect_uri(RedirectUrl::new(config.redirect_uri.clone())?)
        .set_revocation_uri(RevocationUrl::new(GMAIL_REVOKE_URL.to_string())?);

        Ok(Self {
            config,
            tokens: None,
            client: Client::new(),
            oauth_client,
        })
    }

    pub fn generate_auth_url(&self) -> Result<(String, PkceCodeVerifier)> {
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

        let mut auth_request = self.oauth_client
            .authorize_url(CsrfToken::new_random)
            .set_pkce_challenge(pkce_challenge);

        for scope in GMAIL_SCOPES {
            auth_request = auth_request.add_scope(Scope::new(scope.to_string()));
        }

        let (auth_url, _csrf_token) = auth_request.url();

        Ok((auth_url.to_string(), pkce_verifier))
    }

    pub async fn exchange_code_for_tokens(&mut self, code: String, verifier: PkceCodeVerifier) -> Result<GmailTokens> {
        let token_result = self.oauth_client
            .exchange_code(AuthorizationCode::new(code))
            .set_pkce_verifier(verifier)
            .request_async(async_http_client)
            .await
            .map_err(|e| anyhow!("Token exchange failed: {}", e))?;

        let expires_at = token_result.expires_in().map(|duration| {
            Utc::now() + chrono::Duration::seconds(duration.as_secs() as i64)
        });

        let tokens = GmailTokens {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: token_result.refresh_token().map(|rt| rt.secret().clone()),
            expires_at,
            token_type: token_result.token_type().as_ref().to_string(),
        };

        self.tokens = Some(tokens.clone());
        Ok(tokens)
    }

    pub async fn refresh_access_token(&mut self) -> Result<GmailTokens> {
        let current_tokens = self.tokens.as_ref()
            .ok_or_else(|| anyhow!("No tokens available"))?;

        let refresh_token = current_tokens.refresh_token.as_ref()
            .ok_or_else(|| anyhow!("No refresh token available"))?;

        let token_result = self.oauth_client
            .exchange_refresh_token(&oauth2::RefreshToken::new(refresh_token.clone()))
            .request_async(async_http_client)
            .await
            .map_err(|e| anyhow!("Token refresh failed: {}", e))?;

        let expires_at = token_result.expires_in().map(|duration| {
            Utc::now() + chrono::Duration::seconds(duration.as_secs() as i64)
        });

        let new_tokens = GmailTokens {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: current_tokens.refresh_token.clone(), // Keep existing refresh token
            expires_at,
            token_type: token_result.token_type().as_ref().to_string(),
        };

        self.tokens = Some(new_tokens.clone());
        Ok(new_tokens)
    }

    async fn make_api_request<T>(&mut self, endpoint: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        // Check if token needs refresh
        if let Some(tokens) = &self.tokens {
            if let Some(expires_at) = tokens.expires_at {
                if expires_at <= Utc::now() {
                    self.refresh_access_token().await?;
                }
            }
        }

        let tokens = self.tokens.as_ref()
            .ok_or_else(|| anyhow!("Not authenticated"))?;

        let url = format!("{}{}", GMAIL_API_BASE, endpoint);
        let response = self.client
            .get(&url)
            .bearer_auth(&tokens.access_token)
            .send()
            .await
            .map_err(|e| anyhow!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(anyhow!("API request failed: {} - {}", status, error_text));
        }

        response.json().await
            .map_err(|e| anyhow!("Failed to parse response: {}", e))
    }

    pub async fn get_labels(&mut self) -> Result<Vec<GmailLabel>> {
        let response: GmailListResponse<GmailLabel> = self.make_api_request("/users/me/labels").await?;
        Ok(response.labels.unwrap_or_default())
    }

    pub async fn get_messages(&mut self, label_id: Option<&str>, max_results: Option<u32>) -> Result<GmailListResponse<serde_json::Value>> {
        let mut endpoint = String::from("/users/me/messages");
        let mut params = Vec::new();

        if let Some(label) = label_id {
            params.push(format!("labelIds={}", label));
        }
        if let Some(max) = max_results {
            params.push(format!("maxResults={}", max));
        }

        if !params.is_empty() {
            endpoint.push('?');
            endpoint.push_str(&params.join("&"));
        }

        self.make_api_request(&endpoint).await
    }

    pub async fn get_message(&mut self, message_id: &str) -> Result<GmailMessage> {
        let endpoint = format!("/users/me/messages/{}", message_id);
        self.make_api_request(&endpoint).await
    }

    pub async fn send_email(&mut self, email: SendEmailRequest) -> Result<GmailMessage> {
        let tokens = self.tokens.as_ref()
            .ok_or_else(|| anyhow!("Not authenticated"))?;

        // Create raw email message
        let raw_message = self.create_raw_email(&email)?;
        
        let mut request_body = HashMap::new();
        request_body.insert("raw", URL_SAFE_NO_PAD.encode(&raw_message));

        let url = format!("{}/users/me/messages/send", GMAIL_API_BASE);
        let response = self.client
            .post(&url)
            .bearer_auth(&tokens.access_token)
            .json(&request_body)
            .send()
            .await
            .map_err(|e| anyhow!("Send request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(anyhow!("Send email failed: {} - {}", status, error_text));
        }

        response.json().await
            .map_err(|e| anyhow!("Failed to parse send response: {}", e))
    }

    fn create_raw_email(&self, email: &SendEmailRequest) -> Result<Vec<u8>> {
        let mut message = String::new();
        
        // Headers
        message.push_str(&format!("To: {}\r\n", email.to.join(", ")));
        if let Some(cc) = &email.cc {
            if !cc.is_empty() {
                message.push_str(&format!("Cc: {}\r\n", cc.join(", ")));
            }
        }
        if let Some(bcc) = &email.bcc {
            if !bcc.is_empty() {
                message.push_str(&format!("Bcc: {}\r\n", bcc.join(", ")));
            }
        }
        message.push_str(&format!("Subject: {}\r\n", email.subject));
        message.push_str("MIME-Version: 1.0\r\n");
        
        if email.html_body.is_some() {
            message.push_str("Content-Type: text/html; charset=\"UTF-8\"\r\n");
        } else {
            message.push_str("Content-Type: text/plain; charset=\"UTF-8\"\r\n");
        }
        
        message.push_str("\r\n");
        
        // Body
        if let Some(html_body) = &email.html_body {
            message.push_str(html_body);
        } else {
            message.push_str(&email.body);
        }

        Ok(message.into_bytes())
    }
}

// Tauri Commands
#[tauri::command]
pub async fn gmail_generate_auth_url(
    config: GmailConfig,
    state: State<'_, OAuthStateMap>,
) -> Result<String, String> {
    let service = GmailService::new(config).map_err(|e| e.to_string())?;
    let (auth_url, verifier) = service.generate_auth_url().map_err(|e| e.to_string())?;
    
    // Generate a state token for this auth request
    let state_token = uuid::Uuid::new_v4().to_string();
    let (sender, _receiver) = oneshot::channel();
    
    let oauth_state = OAuthState {
        verifier,
        sender,
    };
    
    state.lock().unwrap().insert(state_token.clone(), oauth_state);
    
    Ok(auth_url)
}

#[tauri::command]
pub async fn gmail_exchange_code(
    config: GmailConfig,
    code: String,
    state_token: String,
    state: State<'_, OAuthStateMap>,
) -> Result<GmailTokens, String> {
    let oauth_state = {
        let mut state_map = state.lock().unwrap();
        state_map.remove(&state_token)
    };
    
    let oauth_state = oauth_state.ok_or("Invalid state token")?;
    
    let mut service = GmailService::new(config).map_err(|e| e.to_string())?;
    let tokens = service.exchange_code_for_tokens(code, oauth_state.verifier)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(tokens)
}

#[tauri::command]
pub async fn gmail_get_labels(
    config: GmailConfig,
    tokens: GmailTokens,
) -> Result<Vec<GmailLabel>, String> {
    let mut service = GmailService::new(config).map_err(|e| e.to_string())?;
    service.tokens = Some(tokens);
    
    service.get_labels().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gmail_get_messages(
    config: GmailConfig,
    tokens: GmailTokens,
    label_id: Option<String>,
    max_results: Option<u32>,
) -> Result<GmailListResponse<serde_json::Value>, String> {
    let mut service = GmailService::new(config).map_err(|e| e.to_string())?;
    service.tokens = Some(tokens);
    
    service.get_messages(label_id.as_deref(), max_results)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gmail_get_message(
    config: GmailConfig,
    tokens: GmailTokens,
    message_id: String,
) -> Result<GmailMessage, String> {
    let mut service = GmailService::new(config).map_err(|e| e.to_string())?;
    service.tokens = Some(tokens);
    
    service.get_message(&message_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gmail_send_email(
    config: GmailConfig,
    tokens: GmailTokens,
    email: SendEmailRequest,
) -> Result<GmailMessage, String> {
    let mut service = GmailService::new(config).map_err(|e| e.to_string())?;
    service.tokens = Some(tokens);
    
    service.send_email(email).await.map_err(|e| e.to_string())
} 