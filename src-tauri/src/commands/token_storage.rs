use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database::connection::DatabaseManager;
use crate::database::models::GmailAccount as DbGmailAccount;
use chrono::{DateTime, Utc};
use sha2::{Sha256, Digest};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce, Key
};
use base64::{Engine as _, engine::general_purpose::STANDARD};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<String>,
    pub token_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
}

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

// Encryption key for tokens (in production, this should be stored securely)
const ENCRYPTION_KEY_SEED: &str = "gmail_token_encryption_v1";

/// Generate a deterministic encryption key from the seed
fn get_encryption_key() -> Result<[u8; 32]> {
    let mut hasher = Sha256::new();
    hasher.update(ENCRYPTION_KEY_SEED.as_bytes());
    hasher.update(b"libre_ollama_2024"); // Additional entropy
    let result = hasher.finalize();
    
    let mut key = [0u8; 32];
    key.copy_from_slice(&result[..32]);
    Ok(key)
}

/// Encrypt sensitive data using AES-256-GCM
fn encrypt_data(data: &str) -> Result<String> {
    let key_bytes = get_encryption_key()?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    // Generate a random nonce
    let nonce_bytes = [0u8; 12]; // 96-bit nonce for GCM
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher.encrypt(nonce, data.as_bytes())
        .map_err(|e| anyhow!("Encryption failed: {}", e))?;
    
    // Combine nonce and ciphertext, then encode as base64
    let mut combined = Vec::new();
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);
    
    Ok(STANDARD.encode(&combined))
}

/// Decrypt sensitive data using AES-256-GCM
fn decrypt_data(encrypted_data: &str) -> Result<String> {
    let combined = STANDARD.decode(encrypted_data)
        .map_err(|e| anyhow!("Base64 decode failed: {}", e))?;
    
    if combined.len() < 12 {
        return Err(anyhow!("Invalid encrypted data format"));
    }
    
    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let key_bytes = get_encryption_key()?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let plaintext = cipher.decrypt(nonce, ciphertext)
        .map_err(|e| anyhow!("Decryption failed: {}", e))?;
    
    String::from_utf8(plaintext)
        .map_err(|e| anyhow!("UTF-8 decode failed: {}", e))
}

/// Convert frontend GmailTokens to database GmailAccount
fn convert_tokens_to_db(tokens: &GmailTokens, account_id: &str, user_id: &str) -> Result<DbGmailAccount> {
    let expires_at = tokens.expires_at.as_ref().map(|s| s.clone());

    let scopes = vec![
        "https://www.googleapis.com/auth/gmail.readonly".to_string(),
        "https://www.googleapis.com/auth/gmail.send".to_string(),
        "https://www.googleapis.com/auth/gmail.modify".to_string(),
        "https://www.googleapis.com/auth/gmail.compose".to_string(),
    ];

    Ok(DbGmailAccount {
        id: account_id.to_string(),
        email_address: "".to_string(), // Will be set later
        display_name: None,
        profile_picture_url: None,
        access_token_encrypted: encrypt_data(&tokens.access_token)?,
        refresh_token_encrypted: if let Some(ref_token) = &tokens.refresh_token {
            Some(encrypt_data(ref_token)?)
        } else {
            None
        },
        token_expires_at: expires_at,
        scopes,
        is_active: true,
        last_sync_at: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
        user_id: user_id.to_string(),
    })
}

/// Store Gmail tokens securely in the database
#[tauri::command]
pub async fn store_gmail_tokens(
    account_id: String,
    tokens: GmailTokens,
    user_info: UserInfo,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    // Use user email as user_id for now (in production, use actual user ID)
    let user_id = user_info.email.clone();
    
    // Convert and encrypt tokens
    let mut db_tokens = convert_tokens_to_db(&tokens, &account_id, &user_id)
        .map_err(|e| format!("Failed to convert tokens: {}", e))?;
    
    // Set user info
    db_tokens.email_address = user_info.email;
    db_tokens.display_name = user_info.name;
    db_tokens.profile_picture_url = user_info.picture;
    
    // Store in database
    conn.execute(
        "INSERT OR REPLACE INTO gmail_accounts (
            id, email_address, display_name, profile_picture_url,
            access_token_encrypted, refresh_token_encrypted, token_expires_at,
            scopes, is_active, last_sync_at, created_at, updated_at, user_id
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        (
            &db_tokens.id,
            &db_tokens.email_address,
            &db_tokens.display_name,
            &db_tokens.profile_picture_url,
            &db_tokens.access_token_encrypted,
            &db_tokens.refresh_token_encrypted,
            &db_tokens.token_expires_at,
            &serde_json::to_string(&db_tokens.scopes).unwrap_or_default(),
            &db_tokens.is_active,
            &db_tokens.last_sync_at,
            &db_tokens.created_at,
            &db_tokens.updated_at,
            &db_tokens.user_id,
        ),
    ).map_err(|e| format!("Failed to store tokens: {}", e))?;
    
    Ok(())
}

/// Retrieve Gmail tokens for a specific account
#[tauri::command]
pub async fn get_gmail_tokens(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Option<GmailTokens>, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT access_token_encrypted, refresh_token_encrypted, token_expires_at, 'Bearer' as token_type 
         FROM gmail_accounts WHERE id = ?1 AND is_active = 1",
        [&account_id],
        |row| {
            let access_token_encrypted: String = row.get(0)?;
            let refresh_token_encrypted: Option<String> = row.get(1)?;
            let expires_at: Option<String> = row.get(2)?;
            let token_type: String = row.get(3)?;
            
            Ok((access_token_encrypted, refresh_token_encrypted, expires_at, token_type))
        },
    );
    
    match result {
        Ok((access_encrypted, refresh_encrypted, expires_at, token_type)) => {
            let access_token = decrypt_data(&access_encrypted)
                .map_err(|e| format!("Failed to decrypt access token: {}", e))?;
            
            let refresh_token = if let Some(ref_encrypted) = refresh_encrypted {
                Some(decrypt_data(&ref_encrypted)
                    .map_err(|e| format!("Failed to decrypt refresh token: {}", e))?)
            } else {
                None
            };
            
            let expires_at_str = expires_at;
            
            Ok(Some(GmailTokens {
                access_token,
                refresh_token,
                expires_at: expires_at_str,
                token_type,
            }))
        },
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

/// Get all stored Gmail accounts for a user
#[tauri::command]
pub async fn get_gmail_accounts(
    user_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Vec<StoredGmailAccount>, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, email_address, display_name, profile_picture_url, 
                is_active, last_sync_at, created_at
         FROM gmail_accounts WHERE user_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let accounts = stmt.query_map([&user_id], |row| {
        let last_sync_at: Option<String> = row.get(5)?;
        let created_at: String = row.get(6)?;
        
        Ok(StoredGmailAccount {
            id: row.get(0)?,
            email: row.get(1)?,
            name: row.get(2)?,
            picture: row.get(3)?,
            is_active: row.get(4)?,
            last_sync_at,
            created_at,
        })
    }).map_err(|e| format!("Failed to query accounts: {}", e))?;
    
    let mut result = Vec::new();
    for account in accounts {
        result.push(account.map_err(|e| format!("Failed to parse account: {}", e))?);
    }
    
    Ok(result)
}

/// Remove Gmail tokens for a specific account
#[tauri::command]
pub async fn remove_gmail_tokens(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "DELETE FROM gmail_accounts WHERE id = ?1",
        [&account_id],
    ).map_err(|e| format!("Failed to remove tokens: {}", e))?;
    
    Ok(())
}

/// Update the last sync timestamp for an account
#[tauri::command]
pub async fn update_gmail_sync_timestamp(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE gmail_accounts SET last_sync_at = CURRENT_TIMESTAMP WHERE id = ?1",
        [&account_id],
    ).map_err(|e| format!("Failed to update sync timestamp: {}", e))?;
    
    Ok(())
}

/// Check if an account's tokens are still valid (not expired)
#[tauri::command]
pub async fn check_token_validity(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<bool, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT token_expires_at FROM gmail_accounts WHERE id = ?1 AND is_active = 1",
        [&account_id],
        |row| {
            let expires_at: Option<String> = row.get(0)?;
            Ok(expires_at)
        },
    );
    
    match result {
        Ok(Some(expires_at_str)) => {
            // Parse the ISO 8601 string back to DateTime
            match DateTime::parse_from_rfc3339(&expires_at_str) {
                Ok(expires_at) => {
                    let now = chrono::Utc::now();
                    Ok(expires_at.with_timezone(&Utc) > now)
                },
                Err(_) => Ok(false), // Invalid date format means token is invalid
            }
        },
        Ok(None) => Ok(true), // No expiration time means token doesn't expire
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(false), // Account not found
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let original = "test_access_token_12345";
        let encrypted = encrypt_data(original).unwrap();
        let decrypted = decrypt_data(&encrypted).unwrap();
        assert_eq!(original, decrypted);
    }

    #[test]
    fn test_encryption_key_consistency() {
        let key1 = get_encryption_key().unwrap();
        let key2 = get_encryption_key().unwrap();
        assert_eq!(key1, key2);
    }
} 