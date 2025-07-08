//! Minimal cryptographic utilities for LibreOllama
//!
//! Provides only the essential encryption functions actually used in the codebase.

use crate::errors::{LibreOllamaError, Result};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};
use base64::{Engine as _, engine::general_purpose::STANDARD};
use rand::{rngs::OsRng, RngCore};

/// Generate a random nonce for encryption operations
fn generate_nonce() -> [u8; 12] {
    let mut nonce = [0u8; 12];
    OsRng.fill_bytes(&mut nonce);
    nonce
}

/// Generate a secure random encryption key
pub fn generate_encryption_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    OsRng.fill_bytes(&mut key);
    key
}

/// Encrypt data using AES-256-GCM with random nonce
pub fn encrypt_data(data: &str, key: &[u8; 32]) -> Result<String> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| LibreOllamaError::Crypto {
            message: format!("Cipher initialization failed: {}", e),
        })?;

    let nonce_bytes = generate_nonce();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, data.as_bytes())
        .map_err(|e| LibreOllamaError::Crypto {
            message: format!("Encryption failed: {}", e),
        })?;

    // Combine nonce + ciphertext and encode as base64
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    
    Ok(STANDARD.encode(combined))
}

/// Decrypt data using AES-256-GCM
pub fn decrypt_data(encrypted_data: &str, key: &[u8; 32]) -> Result<String> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| LibreOllamaError::Crypto {
            message: format!("Cipher initialization failed: {}", e),
        })?;

    // Decode from base64
    let combined = STANDARD
        .decode(encrypted_data)
        .map_err(|e| LibreOllamaError::Crypto {
            message: format!("Base64 decode failed: {}", e),
        })?;

    if combined.len() < 12 {
        return Err(LibreOllamaError::Crypto {
            message: "Invalid encrypted data length".to_string(),
        });
    }

    // Split nonce and ciphertext
    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| LibreOllamaError::Crypto {
            message: format!("Decryption failed: {}", e),
        })?;

    String::from_utf8(plaintext)
        .map_err(|e| LibreOllamaError::Crypto {
            message: format!("UTF-8 decode failed: {}", e),
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let key = generate_encryption_key();
        let data = "sensitive test data";

        let encrypted = encrypt_data(data, &key).expect("Encryption should succeed");
        let decrypted = decrypt_data(&encrypted, &key).expect("Decryption should succeed");

        assert_eq!(data, decrypted);
    }

    #[test]
    fn test_different_keys_fail() {
        let key1 = generate_encryption_key();
        let key2 = generate_encryption_key();
        let data = "test data";

        let encrypted = encrypt_data(data, &key1).expect("Encryption should succeed");
        let result = decrypt_data(&encrypted, &key2);

        assert!(result.is_err());
    }
} 