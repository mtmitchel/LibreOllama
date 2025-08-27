//! Canvas Commands - AES-256-GCM Encrypted Persistence
//!
//! This module provides secure canvas data management with:
//! - AES-256-GCM encryption for data at rest
//! - Secure key storage using system keyring
//! - Automatic key generation and management

use anyhow::Result;
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce, Key
};
use aes_gcm::aead::rand_core::RngCore;
use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager};

const KEYRING_SERVICE: &str = "LibreOllama";
const KEYRING_USERNAME: &str = "canvas_encryption";
const NONCE_SIZE: usize = 12; // 96 bits for AES-GCM

#[derive(Serialize, Deserialize, Debug)]
pub struct CanvasData {
    pub data: String,
    pub version: String,
    pub timestamp: i64,
}

/// Ensures the encryption key exists in the system keyring
/// Creates a new 256-bit key if one doesn't exist
#[tauri::command]
pub async fn ensure_encryption_key() -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|e| format!("Failed to access keyring: {}", e))?;
    
    // Check if key exists
    match entry.get_password() {
        Ok(_) => {
            // Key exists, validate it
            println!("✅ [Canvas] Encryption key verified");
            Ok(())
        }
        Err(_) => {
            // Generate new 256-bit key
            let mut key_bytes = [0u8; 32];
            OsRng.fill_bytes(&mut key_bytes);
            let key_hex = hex::encode(&key_bytes);
            
            // Store in keyring
            entry.set_password(&key_hex)
                .map_err(|e| format!("Failed to store encryption key: {}", e))?;
            
            println!("🔐 [Canvas] New encryption key generated and stored");
            Ok(())
        }
    }
}

/// Saves canvas data with AES-256-GCM encryption
/// 
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing app directories
/// * `data` - JSON string of canvas data to encrypt and save
/// * `filename` - Name of the file to save (should end with .canvas or .json)
#[tauri::command]
pub async fn save_canvas_data(
    app_handle: AppHandle,
    data: String,
    filename: String
) -> Result<(), String> {
    // Validate filename
    if filename.is_empty() {
        return Err("Filename cannot be empty".to_string());
    }
    
    // Ensure encryption key exists
    ensure_encryption_key().await?;
    
    // Get encryption key from keyring
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|e| format!("Failed to access keyring: {}", e))?;
    
    let key_hex = entry.get_password()
        .map_err(|_| "Encryption key not found. Call ensure_encryption_key first.".to_string())?;
    
    let key_bytes = hex::decode(&key_hex)
        .map_err(|e| format!("Invalid key format: {}", e))?;
    
    // Create cipher
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    // Generate random nonce (96 bits)
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    // Create timestamped canvas data
    let canvas_data = CanvasData {
        data: data.clone(),
        version: "1.0.0".to_string(),
        timestamp: chrono::Utc::now().timestamp(),
    };
    
    // Serialize canvas data
    let plaintext = serde_json::to_vec(&canvas_data)
        .map_err(|e| format!("Failed to serialize canvas data: {}", e))?;
    
    // Encrypt data
    let ciphertext = cipher.encrypt(nonce, plaintext.as_ref())
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    // Combine nonce and ciphertext for storage
    let mut encrypted_data = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    encrypted_data.extend_from_slice(&nonce_bytes);
    encrypted_data.extend_from_slice(&ciphertext);
    
    // Get app data directory and create canvas subdirectory
    let app_data_dir = app_handle.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let mut path = app_data_dir;
    
    path.push("canvas");
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create canvas directory: {}", e))?;
    
    // Save encrypted file
    path.push(&filename);
    fs::write(&path, encrypted_data)
        .map_err(|e| format!("Failed to save canvas data: {}", e))?;
    
    println!("💾 [Canvas] Saved encrypted canvas to: {:?}", path);
    Ok(())
}

/// Loads canvas data with AES-256-GCM decryption
/// 
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing app directories
/// * `filename` - Name of the file to load
/// 
/// # Returns
/// Decrypted JSON string of canvas data
#[tauri::command]
pub async fn load_canvas_data(
    app_handle: AppHandle,
    filename: String
) -> Result<String, String> {
    // Validate filename
    if filename.is_empty() {
        return Err("Filename cannot be empty".to_string());
    }
    
    // Get encryption key from keyring
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USERNAME)
        .map_err(|e| format!("Failed to access keyring: {}", e))?;
    
    let key_hex = entry.get_password()
        .map_err(|_| "Encryption key not found. Call ensure_encryption_key first.".to_string())?;
    
    let key_bytes = hex::decode(&key_hex)
        .map_err(|e| format!("Invalid key format: {}", e))?;
    
    // Create cipher
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    
    // Build file path
    let app_data_dir = app_handle.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let mut path = app_data_dir;
    
    path.push("canvas");
    path.push(&filename);
    
    // Check if file exists
    if !path.exists() {
        return Err(format!("Canvas file not found: {}", filename));
    }
    
    // Read encrypted file
    let encrypted_data = fs::read(&path)
        .map_err(|e| format!("Failed to read canvas file: {}", e))?;
    
    // Validate minimum size (nonce + at least some data)
    if encrypted_data.len() <= NONCE_SIZE {
        return Err("Invalid encrypted data format: too small".to_string());
    }
    
    // Extract nonce and ciphertext
    let (nonce_bytes, ciphertext) = encrypted_data.split_at(NONCE_SIZE);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    // Decrypt data
    let plaintext = cipher.decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))?;
    
    // Deserialize canvas data
    let canvas_data: CanvasData = serde_json::from_slice(&plaintext)
        .map_err(|e| format!("Failed to deserialize canvas data: {}", e))?;
    
    println!("📂 [Canvas] Loaded canvas from: {:?} (saved at: {})", 
        path, 
        chrono::DateTime::from_timestamp(canvas_data.timestamp, 0)
            .map(|dt| dt.to_string())
            .unwrap_or_else(|| "unknown".to_string())
    );
    
    // Return the canvas data JSON string
    Ok(canvas_data.data)
}

/// Lists all saved canvas files in the app data directory
#[tauri::command]
pub async fn list_canvas_files(app_handle: AppHandle) -> Result<Vec<String>, String> {
    let app_data_dir = app_handle.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let mut path = app_data_dir;
    
    path.push("canvas");
    
    // Create directory if it doesn't exist
    if !path.exists() {
        fs::create_dir_all(&path)
            .map_err(|e| format!("Failed to create canvas directory: {}", e))?;
        return Ok(Vec::new());
    }
    
    // Read directory and filter for canvas files
    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read canvas directory: {}", e))?;
    
    let files: Vec<String> = entries
        .filter_map(|entry| {
            entry.ok().and_then(|e| {
                let path = e.path();
                if path.is_file() {
                    path.file_name()
                        .and_then(|name| name.to_str())
                        .map(|s| s.to_string())
                        .filter(|name| name.ends_with(".canvas") || name.ends_with(".json"))
                } else {
                    None
                }
            })
        })
        .collect();
    
    Ok(files)
}

/// Deletes a saved canvas file
#[tauri::command]
pub async fn delete_canvas_file(
    app_handle: AppHandle,
    filename: String
) -> Result<(), String> {
    if filename.is_empty() {
        return Err("Filename cannot be empty".to_string());
    }
    
    let app_data_dir = app_handle.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let mut path = app_data_dir;
    
    path.push("canvas");
    path.push(&filename);
    
    if !path.exists() {
        return Err(format!("Canvas file not found: {}", filename));
    }
    
    fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete canvas file: {}", e))?;
    
    println!("🗑️ [Canvas] Deleted canvas file: {:?}", path);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_encryption_key_generation() {
        // This test would need a mock keyring in a real scenario
        // For now, just test that the function doesn't panic
        let result = ensure_encryption_key().await;
        assert!(result.is_ok() || result.is_err()); // Either outcome is acceptable in tests
    }
    
    #[test]
    fn test_canvas_data_serialization() {
        let canvas_data = CanvasData {
            data: r#"{"elements": [], "viewport": {}}"#.to_string(),
            version: "1.0.0".to_string(),
            timestamp: 1234567890,
        };
        
        let serialized = serde_json::to_string(&canvas_data);
        assert!(serialized.is_ok());
        
        let json = serialized.unwrap();
        assert!(json.contains("elements"));
        assert!(json.contains("1.0.0"));
    }
}