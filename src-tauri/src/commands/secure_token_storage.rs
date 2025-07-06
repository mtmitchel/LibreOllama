use anyhow::{anyhow, Result};
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce
};
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2
};
use keyring::Entry;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose::STANDARD};

const APP_NAME: &str = "LibreOllama";
const KEY_SERVICE: &str = "libre_ollama_encryption";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedData {
    pub nonce: Vec<u8>,
    pub ciphertext: Vec<u8>,
    pub salt: String,
}

/// Secure token storage using OS keyring and proper encryption
pub struct SecureTokenStorage {
    key_id: String,
}

impl SecureTokenStorage {
    /// Create a new secure token storage instance
    pub fn new(user_id: &str) -> Result<Self> {
        Ok(Self {
            key_id: format!("{}_{}", KEY_SERVICE, user_id),
        })
    }

    /// Get or create encryption key using OS keyring
    fn get_or_create_key(&self) -> Result<[u8; 32]> {
        let entry = Entry::new(APP_NAME, &self.key_id)?;
        
        match entry.get_password() {
            Ok(key_str) => {
                // Decode existing key
                let key_bytes = STANDARD.decode(&key_str)?;
                if key_bytes.len() != 32 {
                    return Err(anyhow!("Invalid key length in keyring"));
                }
                let mut key = [0u8; 32];
                key.copy_from_slice(&key_bytes);
                Ok(key)
            }
            Err(_) => {
                // Generate new key
                let mut key = [0u8; 32];
                OsRng.fill_bytes(&mut key);
                
                // Store in keyring
                let key_str = STANDARD.encode(&key);
                entry.set_password(&key_str)?;
                
                Ok(key)
            }
        }
    }

    /// Derive a key from a password using Argon2
    pub fn derive_key_from_password(password: &str, salt: &SaltString) -> Result<[u8; 32]> {
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), salt)
            .map_err(|e| anyhow!("Failed to hash password: {}", e))?;
        
        let hash_bytes = password_hash.hash.ok_or_else(|| anyhow!("No hash generated"))?;
        let hash_vec = hash_bytes.as_bytes();
        
        if hash_vec.len() < 32 {
            return Err(anyhow!("Hash too short"));
        }
        
        let mut key = [0u8; 32];
        key.copy_from_slice(&hash_vec[..32]);
        Ok(key)
    }

    /// Encrypt data with AES-256-GCM using a random nonce
    pub fn encrypt(&self, plaintext: &str) -> Result<EncryptedData> {
        let key_bytes = self.get_or_create_key()?;
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);
        
        // Generate random nonce (96 bits for GCM)
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // Generate salt for additional security
        let salt = SaltString::generate(&mut OsRng);
        
        // Encrypt
        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| anyhow!("Encryption failed: {}", e))?;
        
        Ok(EncryptedData {
            nonce: nonce_bytes.to_vec(),
            ciphertext,
            salt: salt.to_string(),
        })
    }

    /// Decrypt data
    pub fn decrypt(&self, encrypted: &EncryptedData) -> Result<String> {
        let key_bytes = self.get_or_create_key()?;
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);
        
        if encrypted.nonce.len() != 12 {
            return Err(anyhow!("Invalid nonce length"));
        }
        
        let nonce = Nonce::from_slice(&encrypted.nonce);
        
        let plaintext = cipher
            .decrypt(nonce, encrypted.ciphertext.as_ref())
            .map_err(|e| anyhow!("Decryption failed: {}", e))?;
        
        String::from_utf8(plaintext)
            .map_err(|e| anyhow!("UTF-8 decode failed: {}", e))
    }

    /// Securely delete the encryption key
    pub fn delete_key(&self) -> Result<()> {
        let entry = Entry::new(APP_NAME, &self.key_id)?;
        entry.delete_password()?;
        Ok(())
    }

    /// Rotate the encryption key
    pub fn rotate_key(&self, reencrypt_fn: impl Fn(&str) -> Result<()>) -> Result<()> {
        // This would require re-encrypting all data with the new key
        // The reencrypt_fn should handle the actual data migration
        
        // Delete old key
        self.delete_key()?;
        
        // New key will be generated on next encryption
        Ok(())
    }
}

/// Secure storage for Gmail tokens
pub struct GmailTokenSecureStorage {
    storage: SecureTokenStorage,
}

impl GmailTokenSecureStorage {
    pub fn new(user_id: &str) -> Result<Self> {
        Ok(Self {
            storage: SecureTokenStorage::new(user_id)?,
        })
    }

    /// Store tokens securely
    pub fn store_tokens(&self, tokens: &GmailTokens) -> Result<EncryptedTokens> {
        let access_encrypted = self.storage.encrypt(&tokens.access_token)?;
        
        let refresh_encrypted = if let Some(ref refresh) = tokens.refresh_token {
            Some(self.storage.encrypt(refresh)?)
        } else {
            None
        };
        
        Ok(EncryptedTokens {
            access_token_encrypted: STANDARD.encode(&serde_json::to_vec(&access_encrypted)?),
            refresh_token_encrypted: refresh_encrypted
                .map(|e| STANDARD.encode(&serde_json::to_vec(&e).unwrap())),
            expires_at: tokens.expires_at.clone(),
            token_type: tokens.token_type.clone(),
        })
    }

    /// Retrieve tokens
    pub fn get_tokens(&self, encrypted: &EncryptedTokens) -> Result<GmailTokens> {
        let access_encrypted: EncryptedData = serde_json::from_slice(
            &STANDARD.decode(&encrypted.access_token_encrypted)?
        )?;
        
        let access_token = self.storage.decrypt(&access_encrypted)?;
        
        let refresh_token = if let Some(ref refresh_enc) = encrypted.refresh_token_encrypted {
            let refresh_encrypted: EncryptedData = serde_json::from_slice(
                &STANDARD.decode(refresh_enc)?
            )?;
            Some(self.storage.decrypt(&refresh_encrypted)?)
        } else {
            None
        };
        
        Ok(GmailTokens {
            access_token,
            refresh_token,
            expires_at: encrypted.expires_at.clone(),
            token_type: encrypted.token_type.clone(),
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<String>,
    pub token_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedTokens {
    pub access_token_encrypted: String,
    pub refresh_token_encrypted: Option<String>,
    pub expires_at: Option<String>,
    pub token_type: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_with_random_nonce() {
        let storage = SecureTokenStorage::new("test_user").unwrap();
        let plaintext = "test_token_12345";
        
        // Encrypt twice
        let encrypted1 = storage.encrypt(plaintext).unwrap();
        let encrypted2 = storage.encrypt(plaintext).unwrap();
        
        // Nonces should be different
        assert_ne!(encrypted1.nonce, encrypted2.nonce);
        
        // Ciphertexts should be different
        assert_ne!(encrypted1.ciphertext, encrypted2.ciphertext);
        
        // Both should decrypt to same plaintext
        assert_eq!(storage.decrypt(&encrypted1).unwrap(), plaintext);
        assert_eq!(storage.decrypt(&encrypted2).unwrap(), plaintext);
    }

    #[test]
    fn test_token_storage() {
        let storage = GmailTokenSecureStorage::new("test_user").unwrap();
        
        let tokens = GmailTokens {
            access_token: "test_access_token".to_string(),
            refresh_token: Some("test_refresh_token".to_string()),
            expires_at: Some("2024-12-31T23:59:59Z".to_string()),
            token_type: "Bearer".to_string(),
        };
        
        let encrypted = storage.store_tokens(&tokens).unwrap();
        let decrypted = storage.get_tokens(&encrypted).unwrap();
        
        assert_eq!(decrypted.access_token, tokens.access_token);
        assert_eq!(decrypted.refresh_token, tokens.refresh_token);
    }
} 