use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use anyhow::{Result, Context};
use tokio::fs as async_fs;
use tokio::io::AsyncWriteExt;
use chrono::{DateTime, Utc};
use sha2::{Digest, Sha256};
use uuid::Uuid;
use rusqlite::OptionalExtension;

use crate::database::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailAttachment {
    pub id: String,
    pub message_id: String,
    pub filename: String,
    pub mime_type: String,
    pub size: u64,
    pub part_id: Option<String>,
    pub cid: Option<String>,
    pub disposition: Option<String>,
    pub is_inline: bool,
    pub download_url: Option<String>,
    pub thumbnail_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentDownload {
    pub id: String,
    pub attachment_id: String,
    pub message_id: String,
    pub account_id: String,
    pub filename: String,
    pub mime_type: String,
    pub size: u64,
    pub status: String,
    pub progress: u8,
    pub downloaded_size: u64,
    pub local_path: Option<String>,
    pub download_url: Option<String>,
    pub thumbnail_path: Option<String>,
    pub error: Option<String>,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentCache {
    pub id: String,
    pub attachment_id: String,
    pub message_id: String,
    pub account_id: String,
    pub filename: String,
    pub local_path: String,
    pub thumbnail_path: Option<String>,
    pub size: u64,
    pub mime_type: String,
    pub downloaded_at: DateTime<Utc>,
    pub last_accessed_at: DateTime<Utc>,
    pub access_count: u32,
    pub expires_at: DateTime<Utc>,
    pub is_secure: bool,
    pub checksum: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentStorageConfig {
    pub max_file_size: u64,
    pub max_total_storage: u64,
    pub retention_days: u32,
    pub enable_encryption: bool,
    pub enable_compression: bool,
    pub enable_thumbnails: bool,
    pub allowed_mime_types: Vec<String>,
    pub blocked_mime_types: Vec<String>,
    pub enable_virus_scanning: bool,
    pub download_timeout: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentStorageStats {
    pub total_files: u32,
    pub total_size: u64,
    pub available_space: u64,
    pub oldest_file: Option<DateTime<Utc>>,
    pub newest_file: Option<DateTime<Utc>>,
    pub cache_hit_rate: f64,
    pub download_count: u32,
    pub cleanup_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentSecurity {
    pub attachment_id: String,
    pub scan_status: String,
    pub scan_result: Option<AttachmentScanResult>,
    pub is_quarantined: bool,
    pub is_safe: bool,
    pub threats: Option<Vec<String>>,
    pub scan_date: Option<DateTime<Utc>>,
    pub scan_engine: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentScanResult {
    pub is_clean: bool,
    pub threats: Vec<AttachmentThreat>,
    pub risk_level: String,
    pub recommendation: String,
    pub scan_engine: String,
    pub scan_version: String,
    pub scan_date: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentThreat {
    pub threat_type: String,
    pub name: String,
    pub description: String,
    pub severity: String,
    pub action: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentPreview {
    pub attachment_id: String,
    pub preview_type: String,
    pub preview_url: Option<String>,
    pub thumbnail_url: Option<String>,
    pub metadata: Option<AttachmentMetadata>,
    pub can_preview: bool,
    pub requires_download: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentMetadata {
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub duration: Option<u32>,
    pub pages: Option<u32>,
    pub author: Option<String>,
    pub title: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub modified_at: Option<DateTime<Utc>>,
    pub is_password_protected: Option<bool>,
    pub has_embedded_content: Option<bool>,
}

#[allow(dead_code)]
pub struct GmailAttachmentService {
    db_manager: Arc<DatabaseManager>,
    storage_path: PathBuf,
    config: AttachmentStorageConfig,
}

#[allow(dead_code)]
impl GmailAttachmentService {
    pub fn new(db_manager: Arc<DatabaseManager>, storage_path: PathBuf) -> Self {
        let config = AttachmentStorageConfig {
            max_file_size: 100 * 1024 * 1024, // 100MB
            max_total_storage: 1024 * 1024 * 1024, // 1GB
            retention_days: 30,
            enable_encryption: true,
            enable_compression: true,
            enable_thumbnails: true,
            allowed_mime_types: vec![
                "image/*".to_string(),
                "text/*".to_string(),
                "application/pdf".to_string(),
                "application/msword".to_string(),
                "application/vnd.openxmlformats-officedocument.*".to_string(),
                "audio/*".to_string(),
                "video/*".to_string(),
            ],
            blocked_mime_types: vec![
                "application/x-executable".to_string(),
                "application/x-msdownload".to_string(),
                "application/x-msdos-program".to_string(),
                "application/javascript".to_string(),
                "text/javascript".to_string(),
            ],
            enable_virus_scanning: true,
            download_timeout: 300,
        };

        Self {
            db_manager,
            storage_path,
            config,
        }
    }

    /// Initialize attachment storage with configuration
    pub async fn init_attachment_storage(&self, config: &AttachmentStorageConfig) -> Result<()> {
        // Create storage directory if it doesn't exist
        if !self.storage_path.exists() {
            async_fs::create_dir_all(&self.storage_path).await
                .context("Failed to create attachment storage directory")?;
        }

        // Store configuration in database
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        conn.execute(
            "INSERT OR REPLACE INTO attachment_storage_config 
             (max_file_size, max_total_storage, retention_days, enable_encryption, 
              enable_compression, enable_thumbnails, allowed_mime_types, blocked_mime_types, 
              enable_virus_scanning, download_timeout, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            rusqlite::params![
                config.max_file_size,
                config.max_total_storage,
                config.retention_days,
                config.enable_encryption,
                config.enable_compression,
                config.enable_thumbnails,
                serde_json::to_string(&config.allowed_mime_types).unwrap_or_default(),
                serde_json::to_string(&config.blocked_mime_types).unwrap_or_default(),
                config.enable_virus_scanning,
                config.download_timeout,
                &Utc::now().to_rfc3339(),
                &Utc::now().to_rfc3339(),
            ],
        ).context("Failed to store attachment storage config")?;

        Ok(())
    }

    /// Get attachment info from Gmail
    pub async fn get_gmail_attachment_info(
        &self,
        _account_id: &str,
        message_id: &str,
        attachment_id: &str,
    ) -> Result<GmailAttachment> {
        // Mock implementation for now
        Ok(GmailAttachment {
            id: attachment_id.to_string(),
            message_id: message_id.to_string(),
            filename: "mock_attachment.pdf".to_string(),
            mime_type: "application/pdf".to_string(),
            size: 1024,
            part_id: Some("0.1".to_string()),
            cid: None,
            disposition: Some("attachment".to_string()),
            is_inline: false,
            download_url: None,
            thumbnail_url: None,
        })
    }

    /// Download attachment from Gmail
    pub async fn download_attachment(
        &self,
        account_id: &str,
        message_id: &str,
        attachment_id: &str,
        generate_thumbnail: bool,
    ) -> Result<AttachmentDownload> {
        // Check if attachment is cached
        if let Some(cached) = self.get_cached_attachment(attachment_id).await? {
            return Ok(AttachmentDownload {
                id: Uuid::new_v4().to_string(),
                attachment_id: attachment_id.to_string(),
                message_id: message_id.to_string(),
                account_id: account_id.to_string(),
                filename: cached.filename,
                mime_type: cached.mime_type,
                size: cached.size,
                status: "completed".to_string(),
                progress: 100,
                downloaded_size: cached.size,
                local_path: Some(cached.local_path),
                download_url: None,
                thumbnail_path: cached.thumbnail_path,
                error: None,
                started_at: cached.downloaded_at,
                completed_at: Some(cached.downloaded_at),
                expires_at: Some(cached.expires_at),
            });
        }

        // Get attachment info
        let attachment = self.get_gmail_attachment_info(account_id, message_id, attachment_id).await?;

        // Validate attachment
        self.validate_attachment(&attachment)?;

        // Perform download
        let (local_path, thumbnail_path, checksum) = self.perform_download(&attachment, account_id, message_id, generate_thumbnail).await?;

        let download = AttachmentDownload {
            id: Uuid::new_v4().to_string(),
            attachment_id: attachment.id.clone(),
            message_id: message_id.to_string(),
            account_id: account_id.to_string(),
            filename: attachment.filename.clone(),
            mime_type: attachment.mime_type.clone(),
            size: attachment.size,
            status: "completed".to_string(),
            progress: 100,
            downloaded_size: attachment.size,
            local_path: Some(local_path),
            download_url: attachment.download_url,
            thumbnail_path,
            error: None,
            started_at: Utc::now(),
            completed_at: Some(Utc::now()),
            expires_at: Some(Utc::now() + chrono::Duration::days(self.config.retention_days as i64)),
        };

        // Add to cache
        self.add_to_cache(&download, &checksum).await?;

        Ok(download)
    }

    /// Scan attachment for security threats
    pub async fn scan_attachment(
        &self,
        _file_path: &str,
        _filename: &str,
        mime_type: &str,
    ) -> Result<AttachmentSecurity> {
        // Mock security scan implementation
        let is_safe = !self.config.blocked_mime_types.iter().any(|blocked| {
            if blocked.ends_with('*') {
                mime_type.starts_with(&blocked[..blocked.len()-1])
            } else {
                mime_type == blocked
            }
        });

        Ok(AttachmentSecurity {
            attachment_id: "mock_attachment_id".to_string(),
            scan_status: if is_safe { "clean" } else { "threat_detected" }.to_string(),
            scan_result: Some(AttachmentScanResult {
                is_clean: is_safe,
                threats: if is_safe { vec![] } else { vec![
                    AttachmentThreat {
                        threat_type: "potentially_unwanted_program".to_string(),
                        name: "Generic.Suspicious".to_string(),
                        description: "File type is blocked by policy".to_string(),
                        severity: "medium".to_string(),
                        action: "quarantine".to_string(),
                    }
                ] },
                risk_level: if is_safe { "low" } else { "medium" }.to_string(),
                recommendation: if is_safe { "safe_to_open" } else { "do_not_open" }.to_string(),
                scan_engine: "MockScanner".to_string(),
                scan_version: "1.0.0".to_string(),
                scan_date: Utc::now(),
            }),
            is_quarantined: !is_safe,
            is_safe,
            threats: if is_safe { None } else { Some(vec!["Potentially unwanted program".to_string()]) },
            scan_date: Some(Utc::now()),
            scan_engine: Some("MockScanner".to_string()),
        })
    }

    /// Generate attachment preview
    pub async fn generate_attachment_preview(
        &self,
        file_path: &str,
        mime_type: &str,
        filename: &str,
    ) -> Result<AttachmentPreview> {
        let can_preview = self.can_generate_thumbnail(mime_type);
        
        Ok(AttachmentPreview {
            attachment_id: "mock_attachment_id".to_string(),
            preview_type: if can_preview { "image" } else { "none" }.to_string(),
            preview_url: if can_preview { Some(format!("file://{}", file_path)) } else { None },
            thumbnail_url: if can_preview { Some(format!("file://{}_thumb", file_path)) } else { None },
            metadata: Some(AttachmentMetadata {
                width: if mime_type.starts_with("image/") { Some(800) } else { None },
                height: if mime_type.starts_with("image/") { Some(600) } else { None },
                duration: if mime_type.starts_with("video/") { Some(120) } else { None },
                pages: if mime_type == "application/pdf" { Some(5) } else { None },
                author: None,
                title: Some(filename.to_string()),
                created_at: Some(Utc::now()),
                modified_at: Some(Utc::now()),
                is_password_protected: Some(false),
                has_embedded_content: Some(false),
            }),
            can_preview,
            requires_download: true,
        })
    }

    /// Get attachment storage statistics
    pub async fn get_attachment_storage_stats(&self) -> Result<AttachmentStorageStats> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let total_files: u32 = conn.query_row(
            "SELECT COUNT(*) FROM gmail_attachments",
            [],
            |row| row.get(0),
        ).context("Failed to get total files count")?;

        let total_size: u64 = conn.query_row(
            "SELECT COALESCE(SUM(size_bytes), 0) FROM gmail_attachments",
            [],
            |row| row.get(0),
        ).context("Failed to get total size")?;

        let available_space = self.config.max_total_storage - total_size;

        Ok(AttachmentStorageStats {
            total_files,
            total_size,
            available_space,
            oldest_file: Some(Utc::now() - chrono::Duration::days(30)),
            newest_file: Some(Utc::now()),
            cache_hit_rate: 85.0,
            download_count: total_files,
            cleanup_date: Some(Utc::now() - chrono::Duration::days(1)),
        })
    }

    /// Get attachment cache
    pub async fn get_attachment_cache(&self) -> Result<Vec<AttachmentCache>> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let mut stmt = conn.prepare(
            "SELECT attachment_id, message_id, account_id, filename, local_path, 
             thumbnail_path, size_bytes, mime_type, downloaded_at, last_accessed_at, 
             access_count, expires_at, is_secure, checksum 
             FROM gmail_attachments_cache 
             ORDER BY downloaded_at DESC"
        ).context("Failed to prepare cache query")?;

        let rows = stmt.query_map([], |row| {
            Ok(AttachmentCache {
                id: row.get(0)?,
                attachment_id: row.get(0)?,
                message_id: row.get(1)?,
                account_id: row.get(2)?,
                filename: row.get(3)?,
                local_path: row.get(4)?,
                thumbnail_path: row.get(5)?,
                size: row.get(6)?,
                mime_type: row.get(7)?,
                downloaded_at: Utc::now(), // Mock timestamp
                last_accessed_at: Utc::now(), // Mock timestamp
                access_count: row.get(10)?,
                expires_at: Utc::now() + chrono::Duration::days(30), // Mock expiry
                is_secure: row.get(12)?,
                checksum: row.get(13)?,
            })
        }).context("Failed to query attachment cache")?;

        let cache_entries: Vec<AttachmentCache> = rows.collect::<Result<Vec<_>, _>>()
            .context("Failed to collect cache entries")?;

        Ok(cache_entries)
    }

    /// Cleanup expired attachments
    pub async fn cleanup_expired_attachments(&self) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let cutoff_date = Utc::now() - chrono::Duration::days(self.config.retention_days as i64);

        // Delete expired attachments from cache
        conn.execute(
            "DELETE FROM gmail_attachments_cache WHERE expires_at < ?1",
            rusqlite::params![cutoff_date.to_rfc3339()],
        ).context("Failed to delete expired attachments from cache")?;

        // Clean up files from disk
        // (This would involve reading the deleted entries and removing files)
        println!("Would clean up expired attachment files from disk");

        Ok(())
    }

    /// Delete attachment file
    pub async fn delete_attachment_file(&self, file_path: &str) -> Result<()> {
        let path = PathBuf::from(file_path);
        if path.exists() {
            async_fs::remove_file(&path).await
                .context("Failed to delete attachment file")?;
        }
        Ok(())
    }

    /// Add attachment to cache
    pub async fn add_attachment_to_cache(&self, cache_entry: &AttachmentCache) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        conn.execute(
            "INSERT OR REPLACE INTO gmail_attachments_cache 
             (attachment_id, message_id, account_id, filename, local_path, 
              thumbnail_path, size_bytes, mime_type, downloaded_at, last_accessed_at, 
              access_count, expires_at, is_secure, checksum, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            rusqlite::params![
                &cache_entry.attachment_id,
                &cache_entry.message_id,
                &cache_entry.account_id,
                &cache_entry.filename,
                &cache_entry.local_path,
                &cache_entry.thumbnail_path,
                cache_entry.size,
                &cache_entry.mime_type,
                &cache_entry.downloaded_at.to_rfc3339(),
                &cache_entry.last_accessed_at.to_rfc3339(),
                cache_entry.access_count,
                &cache_entry.expires_at.to_rfc3339(),
                cache_entry.is_secure,
                &cache_entry.checksum,
                &Utc::now().to_rfc3339(),
                &Utc::now().to_rfc3339(),
            ],
        ).context("Failed to add attachment to cache")?;

        Ok(())
    }

    /// Update cache access information
    pub async fn update_cache_access(&self, attachment_id: &str, access_count: u32) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        conn.execute(
            "UPDATE gmail_attachments_cache 
             SET last_accessed_at = ?1, access_count = ?2, updated_at = ?3 
             WHERE attachment_id = ?4",
            rusqlite::params![
                &Utc::now().to_rfc3339(),
                access_count,
                &Utc::now().to_rfc3339(),
                attachment_id,
            ],
        ).context("Failed to update cache access")?;

        Ok(())
    }

    /// Remove attachment from cache
    pub async fn remove_from_cache(&self, attachment_id: &str) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        conn.execute(
            "DELETE FROM gmail_attachments_cache WHERE attachment_id = ?1",
            rusqlite::params![attachment_id],
        ).context("Failed to remove from cache")?;

        Ok(())
    }

    /// Update attachment configuration
    pub async fn update_attachment_config(&self, config: &AttachmentStorageConfig) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        conn.execute(
            "UPDATE attachment_storage_config 
             SET max_file_size = ?1, max_total_storage = ?2, retention_days = ?3, 
                 enable_encryption = ?4, enable_compression = ?5, enable_thumbnails = ?6, 
                 allowed_mime_types = ?7, blocked_mime_types = ?8, enable_virus_scanning = ?9, 
                 download_timeout = ?10, updated_at = ?11",
            rusqlite::params![
                config.max_file_size,
                config.max_total_storage,
                config.retention_days,
                config.enable_encryption,
                config.enable_compression,
                config.enable_thumbnails,
                serde_json::to_string(&config.allowed_mime_types).unwrap_or_default(),
                serde_json::to_string(&config.blocked_mime_types).unwrap_or_default(),
                config.enable_virus_scanning,
                config.download_timeout,
                &Utc::now().to_rfc3339(),
            ],
        ).context("Failed to update attachment config")?;

        Ok(())
    }

    /// Cleanup attachment service resources
    pub async fn cleanup_attachment_service(&self) -> Result<()> {
        println!("Cleaning up attachment service resources");
        Ok(())
    }

    // Helper methods
    async fn perform_download(
        &self,
        attachment: &GmailAttachment,
        account_id: &str,
        _message_id: &str,
        generate_thumbnail: bool,
    ) -> Result<(String, Option<String>, String)> {
        // Create directory structure
        let account_dir = self.storage_path.join(account_id);
        if !account_dir.exists() {
            async_fs::create_dir_all(&account_dir).await
                .context("Failed to create account directory")?;
        }

        // Generate file path
        let file_extension = self.get_file_extension(&attachment.filename);
        let file_name = format!("{}_{}.{}", attachment.id, Uuid::new_v4(), file_extension);
        let file_path = account_dir.join(&file_name);

        // Mock file download (in real implementation, this would download from Gmail API)
        let mock_content = b"Mock file content";
        let mut file = async_fs::File::create(&file_path).await
            .context("Failed to create attachment file")?;
        file.write_all(mock_content).await
            .context("Failed to write attachment content")?;

        // Generate checksum
        let mut hasher = Sha256::new();
        hasher.update(mock_content);
        let checksum = format!("{:x}", hasher.finalize());

        // Generate thumbnail if requested
        let thumbnail_path = if generate_thumbnail && self.can_generate_thumbnail(&attachment.mime_type) {
            Some(self.generate_thumbnail(&file_path, &attachment.mime_type).await?)
        } else {
            None
        };

        Ok((file_path.to_string_lossy().to_string(), thumbnail_path, checksum))
    }

    fn validate_attachment(&self, attachment: &GmailAttachment) -> Result<()> {
        // Check file size
        if attachment.size > self.config.max_file_size {
            return Err(anyhow::anyhow!("File size exceeds maximum allowed size"));
        }

        // Check mime type
        if self.config.blocked_mime_types.iter().any(|blocked| {
            self.mime_type_matches(&attachment.mime_type, blocked)
        }) {
            return Err(anyhow::anyhow!("File type is blocked"));
        }

        Ok(())
    }

    fn mime_type_matches(&self, mime_type: &str, pattern: &str) -> bool {
        if pattern.ends_with('*') {
            mime_type.starts_with(&pattern[..pattern.len()-1])
        } else {
            mime_type == pattern
        }
    }

    async fn get_cached_attachment(&self, attachment_id: &str) -> Result<Option<AttachmentCache>> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let result = conn.query_row(
            "SELECT attachment_id, message_id, account_id, filename, local_path, 
             thumbnail_path, size_bytes, mime_type, access_count, is_secure, checksum 
             FROM gmail_attachments_cache 
             WHERE attachment_id = ?1",
            rusqlite::params![attachment_id],
            |row| {
                Ok(AttachmentCache {
                    id: row.get(0)?,
                    attachment_id: row.get(0)?,
                    message_id: row.get(1)?,
                    account_id: row.get(2)?,
                    filename: row.get(3)?,
                    local_path: row.get(4)?,
                    thumbnail_path: row.get(5)?,
                    size: row.get(6)?,
                    mime_type: row.get(7)?,
                    downloaded_at: Utc::now(), // Mock timestamp
                    last_accessed_at: Utc::now(), // Mock timestamp
                    access_count: row.get(8)?,
                    expires_at: Utc::now() + chrono::Duration::days(30), // Mock expiry
                    is_secure: row.get(9)?,
                    checksum: row.get(10)?,
                })
            }
        ).optional().context("Failed to get cached attachment")?;

        Ok(result)
    }

    async fn add_to_cache(&self, download: &AttachmentDownload, checksum: &str) -> Result<()> {
        let cache_entry = AttachmentCache {
            id: download.attachment_id.clone(),
            attachment_id: download.attachment_id.clone(),
            message_id: download.message_id.clone(),
            account_id: download.account_id.clone(),
            filename: download.filename.clone(),
            local_path: download.local_path.clone().unwrap_or_default(),
            thumbnail_path: download.thumbnail_path.clone(),
            size: download.size,
            mime_type: download.mime_type.clone(),
            downloaded_at: download.started_at,
            last_accessed_at: download.started_at,
            access_count: 1,
            expires_at: download.expires_at.unwrap_or(Utc::now() + chrono::Duration::days(30)),
            is_secure: self.is_secure_file_type(&download.mime_type),
            checksum: Some(checksum.to_string()),
        };

        self.add_attachment_to_cache(&cache_entry).await
    }

    async fn generate_thumbnail(&self, file_path: &PathBuf, _mime_type: &str) -> Result<String> {
        // Mock thumbnail generation
        let thumb_path = file_path.with_extension("thumb.jpg");
        let mock_thumb_content = b"Mock thumbnail content";
        
        let mut thumb_file = async_fs::File::create(&thumb_path).await
            .context("Failed to create thumbnail file")?;
        thumb_file.write_all(mock_thumb_content).await
            .context("Failed to write thumbnail content")?;

        Ok(thumb_path.to_string_lossy().to_string())
    }

    fn can_generate_thumbnail(&self, mime_type: &str) -> bool {
        mime_type.starts_with("image/") || 
        mime_type == "application/pdf" || 
        mime_type.starts_with("video/")
    }

    fn is_secure_file_type(&self, mime_type: &str) -> bool {
        !self.config.blocked_mime_types.iter().any(|blocked| {
            self.mime_type_matches(mime_type, blocked)
        })
    }

    fn get_file_extension(&self, filename: &str) -> String {
        filename.split('.').next_back().unwrap_or("bin").to_string()
    }
} 