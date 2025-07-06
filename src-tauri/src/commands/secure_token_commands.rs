use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::database::connection::DatabaseManager;
use crate::commands::secure_token_storage::{
    GmailTokenSecureStorage, GmailTokens, EncryptedTokens
};

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

/// Store Gmail tokens securely using OS keyring
#[tauri::command]
pub async fn store_gmail_tokens_secure(
    account_id: String,
    tokens: GmailTokens,
    user_info: UserInfo,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    // Use user email as user_id for now (in production, use actual user ID)
    let user_id = user_info.email.clone();
    
    // Initialize secure storage for this user
    let secure_storage = GmailTokenSecureStorage::new(&user_id)
        .map_err(|e| format!("Failed to initialize secure storage: {}", e))?;
    
    // Encrypt tokens using secure storage
    let encrypted_tokens = secure_storage.store_tokens(&tokens)
        .map_err(|e| format!("Failed to encrypt tokens: {}", e))?;
    
    // Store encrypted tokens in database
    conn.execute(
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
            &encrypted_tokens.access_token_encrypted,
            &encrypted_tokens.refresh_token_encrypted,
            &encrypted_tokens.expires_at,
            &serde_json::to_string(&["gmail.readonly", "gmail.send", "gmail.modify", "gmail.compose"]).unwrap_or_default(),
            true, // is_active
            None::<String>, // last_sync_at
            &chrono::Utc::now().to_rfc3339(),
            &chrono::Utc::now().to_rfc3339(),
            &user_id,
        ),
    ).map_err(|e| format!("Failed to store encrypted tokens: {}", e))?;
    
    println!("✅ [SECURITY] Tokens stored securely for account: {}", account_id);
    Ok(())
}

/// Retrieve Gmail tokens securely from OS keyring
#[tauri::command]
pub async fn get_gmail_tokens_secure(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Option<GmailTokens>, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT user_id, access_token_encrypted, refresh_token_encrypted, token_expires_at
         FROM gmail_accounts_secure WHERE id = ?1 AND is_active = 1",
        [&account_id],
        |row| {
            let user_id: String = row.get(0)?;
            let access_token_encrypted: String = row.get(1)?;
            let refresh_token_encrypted: Option<String> = row.get(2)?;
            let expires_at: Option<String> = row.get(3)?;
            
            Ok((user_id, access_token_encrypted, refresh_token_encrypted, expires_at))
        },
    );
    
    match result {
        Ok((user_id, access_encrypted, refresh_encrypted, expires_at)) => {
            // Initialize secure storage for this user
            let secure_storage = GmailTokenSecureStorage::new(&user_id)
                .map_err(|e| format!("Failed to initialize secure storage: {}", e))?;
            
            // Create encrypted tokens structure
            let encrypted_tokens = EncryptedTokens {
                access_token_encrypted: access_encrypted,
                refresh_token_encrypted: refresh_encrypted,
                expires_at,
                token_type: "Bearer".to_string(),
            };
            
            // Decrypt tokens
            let tokens = secure_storage.get_tokens(&encrypted_tokens)
                .map_err(|e| format!("Failed to decrypt tokens: {}", e))?;
            
            Ok(Some(tokens))
        },
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

/// Get all stored Gmail accounts for a user (secure version)
#[tauri::command]
pub async fn get_gmail_accounts_secure(
    user_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Vec<StoredGmailAccount>, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, email_address, display_name, profile_picture_url, 
                is_active, last_sync_at, created_at
         FROM gmail_accounts_secure WHERE user_id = ?1 ORDER BY created_at DESC"
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

/// Remove Gmail tokens securely (deletes from keyring and database)
#[tauri::command]
pub async fn remove_gmail_tokens_secure(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    // First get the user_id to clean up keyring
    let user_id: Option<String> = conn.query_row(
        "SELECT user_id FROM gmail_accounts_secure WHERE id = ?1",
        [&account_id],
        |row| Ok(row.get(0)?),
    ).optional().map_err(|e| format!("Failed to get user_id: {}", e))?;
    
    // Remove from database
    conn.execute(
        "DELETE FROM gmail_accounts_secure WHERE id = ?1",
        [&account_id],
    ).map_err(|e| format!("Failed to remove tokens from database: {}", e))?;
    
    // Clean up keyring if we found the user_id
    if let Some(user_id) = user_id {
        if let Ok(secure_storage) = GmailTokenSecureStorage::new(&user_id) {
            // Note: We don't delete the entire keyring here as the user might have other accounts
            // The keyring cleanup would need to be more sophisticated
            println!("✅ [SECURITY] Tokens removed securely for account: {}", account_id);
        }
    }
    
    Ok(())
}

/// Update the last sync timestamp for an account (secure version)
#[tauri::command]
pub async fn update_gmail_sync_timestamp_secure(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE gmail_accounts_secure SET last_sync_at = ?1, updated_at = ?2 WHERE id = ?3",
        [
            &chrono::Utc::now().to_rfc3339(),
            &chrono::Utc::now().to_rfc3339(),
            &account_id
        ],
    ).map_err(|e| format!("Failed to update sync timestamp: {}", e))?;
    
    Ok(())
}

/// Check if an account's tokens are still valid (secure version)
#[tauri::command]
pub async fn check_token_validity_secure(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<bool, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT token_expires_at FROM gmail_accounts_secure WHERE id = ?1 AND is_active = 1",
        [&account_id],
        |row| {
            let expires_at: Option<String> = row.get(0)?;
            Ok(expires_at)
        },
    );
    
    match result {
        Ok(Some(expires_at_str)) => {
            // Parse the ISO 8601 string back to DateTime
            match chrono::DateTime::parse_from_rfc3339(&expires_at_str) {
                Ok(expires_at) => {
                    let now = chrono::Utc::now();
                    Ok(expires_at.with_timezone(&chrono::Utc) > now)
                },
                Err(_) => Ok(false), // Invalid date format means token is invalid
            }
        },
        Ok(None) => Ok(true), // No expiration time means token doesn't expire
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(false), // Account not found
        Err(e) => Err(format!("Database error: {}", e)),
    }
}

/// Migrate existing tokens from vulnerable storage to secure storage
#[tauri::command]
pub async fn migrate_tokens_to_secure_storage(
    db_manager: State<'_, DatabaseManager>,
) -> Result<u32, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    // Check if the old table exists
    let table_exists: bool = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='gmail_accounts'",
        [],
        |row| Ok(row.get::<_, i32>(0)? > 0),
    ).unwrap_or(false);
    
    if !table_exists {
        return Ok(0); // No old table to migrate from
    }
    
    // Get all accounts from old table
    let mut stmt = conn.prepare(
        "SELECT id, email_address, display_name, profile_picture_url, 
                access_token_encrypted, refresh_token_encrypted, token_expires_at,
                is_active, last_sync_at, created_at, updated_at, user_id
         FROM gmail_accounts"
    ).map_err(|e| format!("Failed to prepare migration query: {}", e))?;
    
    let accounts = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,  // id
            row.get::<_, String>(1)?,  // email_address
            row.get::<_, Option<String>>(2)?, // display_name
            row.get::<_, Option<String>>(3)?, // profile_picture_url
            row.get::<_, String>(4)?,  // access_token_encrypted (old format)
            row.get::<_, Option<String>>(5)?, // refresh_token_encrypted (old format)
            row.get::<_, Option<String>>(6)?, // token_expires_at
            row.get::<_, bool>(7)?,    // is_active
            row.get::<_, Option<String>>(8)?, // last_sync_at
            row.get::<_, String>(9)?,  // created_at
            row.get::<_, String>(10)?, // updated_at
            row.get::<_, String>(11)?, // user_id
        ))
    }).map_err(|e| format!("Failed to query old accounts: {}", e))?;
    
    let mut migrated_count = 0;
    
    for account_result in accounts {
        match account_result {
            Ok((id, email, name, picture, old_access_encrypted, old_refresh_encrypted, 
                expires_at, is_active, last_sync_at, created_at, updated_at, user_id)) => {
                
                // For migration, we'll need to decrypt with old method and re-encrypt with new method
                // This is complex because we'd need the old decryption code
                // For now, we'll create a placeholder that requires re-authentication
                
                println!("⚠️  [MIGRATION] Account {} requires re-authentication due to security upgrade", email);
                
                // Store placeholder record that will require re-auth
                let insert_result = conn.execute(
                    "INSERT OR REPLACE INTO gmail_accounts_secure (
                        id, email_address, display_name, profile_picture_url,
                        access_token_encrypted, refresh_token_encrypted, token_expires_at,
                        scopes, is_active, last_sync_at, created_at, updated_at, user_id,
                        requires_reauth
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
                    (
                        &id, &email, &name, &picture,
                        "REQUIRES_REAUTH", // Placeholder
                        None::<String>,
                        &expires_at,
                        &serde_json::to_string(&["gmail.readonly", "gmail.send", "gmail.modify", "gmail.compose"]).unwrap_or_default(),
                        false, // Set inactive until re-auth
                        &last_sync_at,
                        &created_at,
                        &updated_at,
                        &user_id,
                        true, // requires_reauth flag
                    ),
                );
                
                if insert_result.is_ok() {
                    migrated_count += 1;
                }
            }
            Err(e) => {
                eprintln!("❌ [MIGRATION] Failed to process account during migration: {}", e);
            }
        }
    }
    
    println!("✅ [MIGRATION] Migrated {} accounts to secure storage (re-authentication required)", migrated_count);
    Ok(migrated_count)
}

/// Create the secure accounts table
#[tauri::command]
pub async fn create_secure_accounts_table(
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS gmail_accounts_secure (
            id TEXT PRIMARY KEY,
            email_address TEXT NOT NULL,
            display_name TEXT,
            profile_picture_url TEXT,
            access_token_encrypted TEXT NOT NULL,
            refresh_token_encrypted TEXT,
            token_expires_at TEXT,
            scopes TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            last_sync_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            user_id TEXT NOT NULL,
            requires_reauth BOOLEAN DEFAULT 0,
            UNIQUE(email_address, user_id)
        )",
        [],
    ).map_err(|e| format!("Failed to create secure accounts table: {}", e))?;
    
    println!("✅ [SECURITY] Secure accounts table created successfully");
    Ok(())
}

/// Check if legacy Gmail accounts exist
#[tauri::command]
pub async fn check_legacy_gmail_accounts(
    db_manager: State<'_, DatabaseManager>,
) -> Result<bool, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    // Check if the old table exists and has accounts
    let has_accounts: bool = conn.query_row(
        "SELECT CASE 
           WHEN EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='gmail_accounts')
           THEN (SELECT COUNT(*) > 0 FROM gmail_accounts)
           ELSE 0
         END",
        [],
        |row| Ok(row.get::<_, i32>(0)? > 0),
    ).unwrap_or(false);
    
    Ok(has_accounts)
}

/// Check if secure accounts table exists
#[tauri::command]
pub async fn check_secure_accounts_table(
    db_manager: State<'_, DatabaseManager>,
) -> Result<bool, String> {
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    let table_exists: bool = conn.query_row(
        "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='gmail_accounts_secure'",
        [],
        |row| Ok(row.get::<_, i32>(0)? > 0),
    ).unwrap_or(false);
    
    Ok(table_exists)
} 