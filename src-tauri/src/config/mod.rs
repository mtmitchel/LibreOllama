//! Configuration Management for LibreOllama
//!
//! Centralizes all configuration handling including OAuth settings,
//! database configuration, and environment variable management.

use crate::errors::{LibreOllamaError, Result};
use serde::{Deserialize, Serialize};
use std::env;
use std::path::PathBuf;

/// Main application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(Default)]
pub struct AppConfig {
    pub oauth: OAuthConfig,
    pub database: DatabaseConfig,
    pub gmail: GmailConfig,
    pub sync: SyncConfig,
    pub security: SecurityConfig,
    pub paths: PathConfig,
}

/// OAuth configuration settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthConfig {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
    pub callback_port: u16,
    pub callback_timeout_ms: u64,
    pub scopes: Vec<String>,
}

/// Database configuration settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub db_path: PathBuf,
    pub encryption_key: String,
    pub connection_timeout_ms: u64,
    pub max_connections: u32,
    pub enable_wal_mode: bool,
    pub backup_interval_hours: u64,
}

/// Gmail-specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailConfig {
    pub max_messages_per_sync: u32,
    pub sync_interval_minutes: u64,
    pub rate_limit_requests_per_minute: u32,
    pub attachment_max_size_mb: u64,
    pub cache_retention_days: u32,
    pub enable_push_notifications: bool,
}

/// Sync configuration settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub max_retry_attempts: u32,
    pub retry_delay_ms: u64,
    pub batch_size: u32,
    pub parallel_accounts: u32,
    pub full_sync_interval_hours: u64,
    pub incremental_sync_interval_minutes: u64,
}

/// Security configuration settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub token_encryption_algorithm: String,
    pub key_derivation_rounds: u32,
    pub session_timeout_minutes: u64,
    pub enable_secure_storage: bool,
    pub log_sensitive_data: bool,
}

/// Path configuration for various data directories
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathConfig {
    pub data_dir: PathBuf,
    pub cache_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub temp_dir: PathBuf,
    pub attachments_dir: PathBuf,
}


impl Default for OAuthConfig {
    fn default() -> Self {
        Self {
            client_id: String::new(),
            client_secret: String::new(),
            redirect_uri: "http://localhost:1423/auth/gmail/callback".to_string(),
            callback_port: 1423,
            callback_timeout_ms: 120_000, // 2 minutes
            scopes: vec![
                "https://www.googleapis.com/auth/gmail.readonly".to_string(),
                "https://www.googleapis.com/auth/gmail.send".to_string(),
                "https://www.googleapis.com/auth/gmail.modify".to_string(),
                "https://www.googleapis.com/auth/gmail.compose".to_string(),
                "https://www.googleapis.com/auth/userinfo.email".to_string(),
                "https://www.googleapis.com/auth/userinfo.profile".to_string(),
                "https://www.googleapis.com/auth/drive.metadata.readonly".to_string(),
            ],
        }
    }
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        let data_dir = get_default_data_dir();
        Self {
            db_path: data_dir.join("database.db"),
            encryption_key: "default_key_change_in_production".to_string(),
            connection_timeout_ms: 30_000,
            max_connections: 10,
            enable_wal_mode: true,
            backup_interval_hours: 24,
        }
    }
}

impl Default for GmailConfig {
    fn default() -> Self {
        Self {
            max_messages_per_sync: 100,
            sync_interval_minutes: 5,
            rate_limit_requests_per_minute: 200,
            attachment_max_size_mb: 25,
            cache_retention_days: 30,
            enable_push_notifications: false,
        }
    }
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            max_retry_attempts: 3,
            retry_delay_ms: 5_000,
            batch_size: 50,
            parallel_accounts: 5,
            full_sync_interval_hours: 24,
            incremental_sync_interval_minutes: 15,
        }
    }
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            token_encryption_algorithm: "AES256-GCM".to_string(),
            key_derivation_rounds: 100_000,
            session_timeout_minutes: 60,
            enable_secure_storage: true,
            log_sensitive_data: false,
        }
    }
}

impl Default for PathConfig {
    fn default() -> Self {
        let data_dir = get_default_data_dir();
        Self {
            data_dir: data_dir.clone(),
            cache_dir: data_dir.join("cache"),
            logs_dir: data_dir.join("logs"),
            temp_dir: data_dir.join("temp"),
            attachments_dir: data_dir.join("attachments"),
        }
    }
}

/// Get the default data directory for the application
pub fn get_default_data_dir() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("LibreOllama")
}

/// Environment variable configuration
pub struct EnvConfig;

#[allow(dead_code)]
impl EnvConfig {
    /// Load configuration from environment variables
    pub fn load() -> Result<AppConfig> {
        let mut config = AppConfig::default();

        // OAuth configuration from environment
        if let Ok(client_id) = env::var("GMAIL_CLIENT_ID") {
            config.oauth.client_id = client_id;
        }
        if let Ok(client_secret) = env::var("GMAIL_CLIENT_SECRET") {
            config.oauth.client_secret = client_secret;
        }
        if let Ok(redirect_uri) = env::var("OAUTH_REDIRECT_URI") {
            config.oauth.redirect_uri = redirect_uri;
        }
        if let Ok(port) = env::var("OAUTH_CALLBACK_PORT") {
            config.oauth.callback_port = port.parse().unwrap_or(1423);
        }

        // Database configuration from environment
        if let Ok(db_path) = env::var("DATABASE_PATH") {
            config.database.db_path = PathBuf::from(db_path);
        }
        if let Ok(encryption_key) = env::var("DATABASE_ENCRYPTION_KEY") {
            config.database.encryption_key = encryption_key;
        }

        // Gmail configuration from environment
        if let Ok(max_messages) = env::var("GMAIL_MAX_MESSAGES_PER_SYNC") {
            config.gmail.max_messages_per_sync = max_messages.parse().unwrap_or(100);
        }
        if let Ok(sync_interval) = env::var("GMAIL_SYNC_INTERVAL_MINUTES") {
            config.gmail.sync_interval_minutes = sync_interval.parse().unwrap_or(5);
        }
        if let Ok(rate_limit) = env::var("GMAIL_RATE_LIMIT_RPM") {
            config.gmail.rate_limit_requests_per_minute = rate_limit.parse().unwrap_or(200);
        }

        // Security configuration from environment
        if let Ok(secure_storage) = env::var("ENABLE_SECURE_STORAGE") {
            config.security.enable_secure_storage = secure_storage.parse().unwrap_or(true);
        }
        if let Ok(log_sensitive) = env::var("LOG_SENSITIVE_DATA") {
            config.security.log_sensitive_data = log_sensitive.parse().unwrap_or(false);
        }

        // Path configuration from environment
        if let Ok(data_dir) = env::var("DATA_DIRECTORY") {
            let data_path = PathBuf::from(data_dir);
            config.paths = PathConfig {
                data_dir: data_path.clone(),
                cache_dir: data_path.join("cache"),
                logs_dir: data_path.join("logs"),
                temp_dir: data_path.join("temp"),
                attachments_dir: data_path.join("attachments"),
            };
        }

        Self::validate_config(&config)?;
        Ok(config)
    }

    /// Get a specific environment variable with fallback
    pub fn get_env_var(key: &str) -> Result<String> {
        env::var(key).map_err(|_| LibreOllamaError::Environment {
            variable: key.to_string(),
        })
    }

    /// Get an optional environment variable
    pub fn get_optional_env_var(key: &str) -> Option<String> {
        env::var(key).ok()
    }

    /// Get environment variable as specific type
    pub fn get_env_var_as<T>(key: &str) -> Result<T>
    where
        T: std::str::FromStr,
        T::Err: std::fmt::Display,
    {
        let value = Self::get_env_var(key)?;
        value.parse().map_err(|e| LibreOllamaError::Configuration {
            message: format!("Failed to parse environment variable {}: {}", key, e),
            config_key: Some(key.to_string()),
        })
    }

    /// Set environment variable for testing
    #[cfg(test)]
    pub fn set_env_var(key: &str, value: &str) {
        env::set_var(key, value);
    }

    /// Validate configuration values
    fn validate_config(config: &AppConfig) -> Result<()> {
        // Validate OAuth configuration
        if config.oauth.client_id.is_empty() {
            return Err(LibreOllamaError::Configuration {
                message: "OAuth client ID is required".to_string(),
                config_key: Some("oauth.client_id".to_string()),
            });
        }

        if config.oauth.client_secret.is_empty() {
            return Err(LibreOllamaError::Configuration {
                message: "OAuth client secret is required".to_string(),
                config_key: Some("oauth.client_secret".to_string()),
            });
        }

        // Validate OAuth port range
        if config.oauth.callback_port < 1024 {
            return Err(LibreOllamaError::Configuration {
                message: "OAuth callback port must be 1024 or greater".to_string(),
                config_key: Some("oauth.callback_port".to_string()),
            });
        }

        // Validate database encryption key
        if config.database.encryption_key.len() < 32 {
            return Err(LibreOllamaError::Configuration {
                message: "Database encryption key must be at least 32 characters".to_string(),
                config_key: Some("database.encryption_key".to_string()),
            });
        }

        // Validate Gmail configuration
        if config.gmail.max_messages_per_sync == 0 {
            return Err(LibreOllamaError::Configuration {
                message: "Gmail max messages per sync must be greater than 0".to_string(),
                config_key: Some("gmail.max_messages_per_sync".to_string()),
            });
        }

        // Validate sync configuration
        if config.sync.max_retry_attempts == 0 {
            return Err(LibreOllamaError::Configuration {
                message: "Sync max retry attempts must be greater than 0".to_string(),
                config_key: Some("sync.max_retry_attempts".to_string()),
            });
        }

        Ok(())
    }
}

/// Configuration manager for runtime config access
#[derive(Default)]
pub struct ConfigManager {
    config: AppConfig,
}

#[allow(dead_code)]
impl ConfigManager {
    /// Create new configuration manager with environment-loaded config
    pub fn new() -> Result<Self> {
        let config = EnvConfig::load()?;
        Ok(Self { config })
    }

    /// Create configuration manager with custom config
    pub fn with_config(config: AppConfig) -> Self {
        Self { config }
    }

    /// Get immutable reference to configuration
    pub fn config(&self) -> &AppConfig {
        &self.config
    }

    /// Get OAuth configuration
    pub fn oauth(&self) -> &OAuthConfig {
        &self.config.oauth
    }

    /// Get database configuration
    pub fn database(&self) -> &DatabaseConfig {
        &self.config.database
    }

    /// Get Gmail configuration
    pub fn gmail(&self) -> &GmailConfig {
        &self.config.gmail
    }

    /// Get sync configuration
    pub fn sync(&self) -> &SyncConfig {
        &self.config.sync
    }

    /// Get security configuration
    pub fn security(&self) -> &SecurityConfig {
        &self.config.security
    }

    /// Get path configuration
    pub fn paths(&self) -> &PathConfig {
        &self.config.paths
    }

    /// Ensure all configured directories exist
    pub fn ensure_directories(&self) -> Result<()> {
        let dirs_to_create = [
            &self.config.paths.data_dir,
            &self.config.paths.cache_dir,
            &self.config.paths.logs_dir,
            &self.config.paths.temp_dir,
            &self.config.paths.attachments_dir,
        ];

        for dir in &dirs_to_create {
            if !dir.exists() {
                std::fs::create_dir_all(dir).map_err(|e| LibreOllamaError::FileSystem {
                    message: format!("Failed to create directory {}: {}", dir.display(), e),
                    path: Some(dir.to_string_lossy().to_string()),
                })?;
            }
        }

        Ok(())
    }

    /// Update configuration at runtime (for testing)
    #[cfg(test)]
    pub fn update_config(&mut self, config: AppConfig) {
        self.config = config;
    }
}

/// Global configuration instance (lazy initialization)
use std::sync::OnceLock;
static CONFIG_MANAGER: OnceLock<ConfigManager> = OnceLock::new();

/// Get global configuration manager instance
pub fn get_config_manager() -> Result<&'static ConfigManager> {
    Ok(CONFIG_MANAGER.get_or_init(|| {
        ConfigManager::new().unwrap_or_else(|e| {
            eprintln!("Failed to initialize global config: {}", e);
            ConfigManager::default()
        })
    }))
}

/// Initialize configuration manager with custom config (for testing)
#[cfg(test)]
pub fn init_config_manager_with_config(config: AppConfig) -> &'static ConfigManager {
    CONFIG_MANAGER.get_or_init(|| ConfigManager::with_config(config))
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config_creation() {
        let config = AppConfig::default();
        assert!(!config.oauth.scopes.is_empty());
        assert!(config.oauth.callback_port > 0);
        assert!(!config.database.db_path.as_os_str().is_empty());
    }

    #[test]
    fn test_env_var_loading() {
        // Clean up any existing vars from other tests
        env::remove_var("GMAIL_CLIENT_ID");
        env::remove_var("GMAIL_CLIENT_SECRET");
        env::remove_var("OAUTH_CALLBACK_PORT");
        env::remove_var("DATABASE_ENCRYPTION_KEY");
        
        EnvConfig::set_env_var("GMAIL_CLIENT_ID", "test_client_id_for_integration_tests");
        EnvConfig::set_env_var("GMAIL_CLIENT_SECRET", "test_client_secret_for_integration_tests_long_enough");
        EnvConfig::set_env_var("OAUTH_CALLBACK_PORT", "8080");
        EnvConfig::set_env_var("DATABASE_ENCRYPTION_KEY", "test_encryption_key_for_tests_that_is_long_enough_to_pass_validation");

        let config = EnvConfig::load().unwrap();
        assert_eq!(config.oauth.client_id, "test_client_id_for_integration_tests");
        assert_eq!(config.oauth.client_secret, "test_client_secret_for_integration_tests_long_enough");
        assert_eq!(config.oauth.callback_port, 8080);
        assert_eq!(config.database.encryption_key, "test_encryption_key_for_tests_that_is_long_enough_to_pass_validation");

        // Clean up
        env::remove_var("GMAIL_CLIENT_ID");
        env::remove_var("GMAIL_CLIENT_SECRET");
        env::remove_var("OAUTH_CALLBACK_PORT");
        env::remove_var("DATABASE_ENCRYPTION_KEY");
    }

    #[test]
    fn test_config_validation() {
        let mut config = AppConfig::default();
        
        // Valid config should pass
        config.oauth.client_id = "valid_client_id".to_string();
        config.oauth.client_secret = "valid_client_secret_long_enough".to_string();
        config.database.encryption_key = "a_very_long_encryption_key_that_meets_requirements".to_string();
        
        assert!(EnvConfig::validate_config(&config).is_ok());

        // Invalid config should fail
        config.oauth.client_id.clear();
        assert!(EnvConfig::validate_config(&config).is_err());
    }

    #[test]
    fn test_config_manager_creation() {
        // Clean up any existing vars from other tests
        env::remove_var("GMAIL_CLIENT_ID");
        env::remove_var("GMAIL_CLIENT_SECRET");
        env::remove_var("DATABASE_ENCRYPTION_KEY");
        
        // Set required environment variables for testing
        EnvConfig::set_env_var("GMAIL_CLIENT_ID", "test_client_id_for_integration_tests");
        EnvConfig::set_env_var("GMAIL_CLIENT_SECRET", "test_client_secret_for_integration_tests_long_enough");
        EnvConfig::set_env_var("DATABASE_ENCRYPTION_KEY", "test_encryption_key_for_tests_that_is_long_enough_to_pass_validation");
        
        let manager = ConfigManager::new();
        assert!(manager.is_ok());

        let manager = manager.unwrap();
        assert_eq!(manager.oauth().client_id, "test_client_id_for_integration_tests");

        // Clean up
        env::remove_var("GMAIL_CLIENT_ID");
        env::remove_var("GMAIL_CLIENT_SECRET");
        env::remove_var("DATABASE_ENCRYPTION_KEY");
    }

    #[test]
    fn test_directory_creation() {
        let temp_dir = std::env::temp_dir().join("libreollama_test");
        let mut config = AppConfig::default();
        config.paths.data_dir = temp_dir.clone();
        config.paths.cache_dir = temp_dir.join("cache");

        let manager = ConfigManager::with_config(config);
        assert!(manager.ensure_directories().is_ok());
        assert!(temp_dir.exists());
        assert!(temp_dir.join("cache").exists());

        // Clean up
        let _ = std::fs::remove_dir_all(temp_dir);
    }
} 