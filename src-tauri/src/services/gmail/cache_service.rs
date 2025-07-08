use serde::{Deserialize, Serialize};
use std::sync::Arc;
use anyhow::{Result, Context};
use chrono::{Utc, Duration};
use rusqlite::{Connection, params, OptionalExtension};

use crate::database::connection::DatabaseManager;
use crate::services::gmail::{ProcessedGmailMessage, EmailAddress};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
    pub max_cache_size_mb: u64,
    pub max_age_days: u64,
    pub enable_thread_caching: bool,
    pub enable_attachment_caching: bool,
    pub enable_search_caching: bool,
    pub cache_compression: bool,
    pub offline_mode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_messages: u64,
    pub total_threads: u64,
    pub total_attachments: u64,
    pub cache_size_mb: f64,
    pub hit_rate: f64,
    pub last_cleanup: Option<String>,
    pub offline_messages: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedMessage {
    pub id: String,
    pub thread_id: String,
    pub account_id: String,
    pub message_data: ProcessedGmailMessage,
    pub cached_at: String,
    pub last_accessed: String,
    pub access_count: u32,
    pub is_offline_available: bool,
    pub cache_priority: CachePriority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CachePriority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadCache {
    pub thread_id: String,
    pub account_id: String,
    pub message_count: u32,
    pub latest_message_date: String,
    pub labels: Vec<String>,
    pub participants: Vec<EmailAddress>,
    pub subject: String,
    pub has_attachments: bool,
    pub is_read: bool,
    pub is_starred: bool,
    pub cached_at: String,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheQuery {
    pub account_id: String,
    pub thread_ids: Option<Vec<String>>,
    pub message_ids: Option<Vec<String>>,
    pub labels: Option<Vec<String>>,
    pub date_range: Option<(String, String)>,
    pub has_attachments: Option<bool>,
    pub is_read: Option<bool>,
    pub is_starred: Option<bool>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheQueryResult {
    pub messages: Vec<CachedMessage>,
    pub threads: Vec<ThreadCache>,
    pub total_count: u32,
    pub cache_hit: bool,
    pub query_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentCache {
    pub attachment_id: String,
    pub message_id: String,
    pub filename: String,
    pub content_type: String,
    pub size_bytes: u64,
    pub local_path: Option<String>,
    pub is_downloaded: bool,
    pub download_date: Option<String>,
    pub cached_at: String,
    pub last_accessed: String,
}

#[allow(dead_code)]
pub struct GmailCacheService {
    db_manager: Arc<DatabaseManager>,
}

#[allow(dead_code)]
impl GmailCacheService {
    pub fn new(db_manager: Arc<DatabaseManager>) -> Self {
        Self {
            db_manager,
        }
    }

    /// Initialize cache configuration for an account
    pub async fn initialize_cache_config(
        &self,
        account_id: &str,
        config: &CacheConfig,
    ) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        // Store cache configuration
        conn.execute(
            "INSERT OR REPLACE INTO cache_config 
             (account_id, max_cache_size_mb, max_age_days, enable_thread_caching, 
              enable_attachment_caching, enable_search_caching, cache_compression, 
              offline_mode, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                account_id,
                config.max_cache_size_mb,
                config.max_age_days,
                config.enable_thread_caching,
                config.enable_attachment_caching,
                config.enable_search_caching,
                config.cache_compression,
                config.offline_mode,
                &Utc::now().to_rfc3339(),
                &Utc::now().to_rfc3339(),
            ],
        ).context("Failed to store cache config")?;

        Ok(())
    }

    /// Get cached messages based on query
    pub async fn get_cached_messages(
        &self,
        query: &CacheQuery,
    ) -> Result<CacheQueryResult> {
        let start_time = std::time::Instant::now();
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let mut where_clauses = vec!["account_id = ?1".to_string()];
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(query.account_id.clone())];
        let mut param_index = 2;

        // Build dynamic WHERE clause based on query parameters
        if let Some(thread_ids) = &query.thread_ids {
            let placeholders = thread_ids.iter()
                .map(|_| format!("?{}", param_index))
                .collect::<Vec<_>>()
                .join(", ");
            where_clauses.push(format!("thread_id IN ({})", placeholders));
            for thread_id in thread_ids {
                params.push(Box::new(thread_id.clone()));
                param_index += 1;
            }
        }

        if let Some(message_ids) = &query.message_ids {
            let placeholders = message_ids.iter()
                .map(|_| format!("?{}", param_index))
                .collect::<Vec<_>>()
                .join(", ");
            where_clauses.push(format!("message_id IN ({})", placeholders));
            for message_id in message_ids {
                params.push(Box::new(message_id.clone()));
                param_index += 1;
            }
        }

        if let Some(labels) = &query.labels {
            // Join with message_labels table
            let label_placeholders = labels.iter()
                .map(|_| format!("?{}", param_index))
                .collect::<Vec<_>>()
                .join(", ");
            where_clauses.push(format!(
                "message_id IN (SELECT message_id FROM gmail_message_labels WHERE label_id IN ({}))",
                label_placeholders
            ));
            for label in labels {
                params.push(Box::new(label.clone()));
                param_index += 1;
            }
        }

        if let Some((start_date, end_date)) = &query.date_range {
            where_clauses.push(format!("cached_at BETWEEN ?{} AND ?{}", param_index, param_index + 1));
            params.push(Box::new(start_date.clone()));
            params.push(Box::new(end_date.clone()));
            param_index += 2;
        }

        if let Some(has_attachments) = query.has_attachments {
            where_clauses.push(format!("has_attachments = ?{}", param_index));
            params.push(Box::new(has_attachments));
            param_index += 1;
        }

        if let Some(is_read) = query.is_read {
            where_clauses.push(format!("is_read = ?{}", param_index));
            params.push(Box::new(is_read));
            param_index += 1;
        }

        if let Some(is_starred) = query.is_starred {
            where_clauses.push(format!("is_starred = ?{}", param_index));
            params.push(Box::new(is_starred));
        }

        let where_clause = where_clauses.join(" AND ");
        let limit_clause = query.limit.map(|l| format!(" LIMIT {}", l)).unwrap_or_default();
        let offset_clause = query.offset.map(|o| format!(" OFFSET {}", o)).unwrap_or_default();

        let query_sql = format!(
            "SELECT message_id, thread_id, account_id, message_data, cached_at, 
             last_accessed, access_count, is_offline_available, cache_priority 
             FROM gmail_message_cache 
             WHERE {} 
             ORDER BY cached_at DESC{}{}",
            where_clause, limit_clause, offset_clause
        );

        let mut stmt = conn.prepare(&query_sql)
            .context("Failed to prepare cache query")?;

        // Convert params to the correct type for rusqlite
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(&param_refs[..], |row| {
            let message_data_json: String = row.get(3)?;
            let message_data: ProcessedGmailMessage = serde_json::from_str(&message_data_json)
                .map_err(|_e| rusqlite::Error::InvalidColumnType(3, "ProcessedGmailMessage".to_string(), rusqlite::types::Type::Text))?;

            Ok(CachedMessage {
                id: row.get(0)?,
                thread_id: row.get(1)?,
                account_id: row.get(2)?,
                message_data,
                cached_at: row.get(4)?,
                last_accessed: row.get(5)?,
                access_count: row.get(6)?,
                is_offline_available: row.get(7)?,
                cache_priority: CachePriority::Medium, // Default priority
            })
        }).context("Failed to query cached messages")?;

        let messages: Vec<CachedMessage> = rows.collect::<Result<Vec<_>, _>>()
            .context("Failed to collect cached messages")?;

        // Get thread cache data
        let threads = self.get_cached_threads(&conn, &query.account_id, query.thread_ids.as_deref().unwrap_or(&[]))?;

        // Count total messages
        let total_count = messages.len() as u32;
        let query_time_ms = start_time.elapsed().as_millis() as u64;

        Ok(CacheQueryResult {
            messages,
            threads,
            total_count,
            cache_hit: true,
            query_time_ms,
        })
    }

    /// Cache a message with priority and offline availability
    pub async fn cache_message(
        &self,
        message: &ProcessedGmailMessage,
        account_id: &str,
        priority: CachePriority,
        offline_available: bool,
    ) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let now = Utc::now().to_rfc3339();
        let message_data_json = serde_json::to_string(message)
            .context("Failed to serialize message data")?;

        conn.execute(
            "INSERT OR REPLACE INTO gmail_message_cache 
             (message_id, thread_id, account_id, message_data, cached_at, 
              last_accessed, access_count, is_offline_available, cache_priority, 
              created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                &message.id,
                &message.thread_id,
                account_id,
                &message_data_json,
                &now,
                &now,
                1,
                offline_available,
                format!("{:?}", priority),
                &now,
                &now,
            ],
        ).context("Failed to cache message")?;

        // Update thread cache
        self.update_thread_cache(&conn, message, account_id)?;

        // Cache message attachments if enabled
        if let Some(config) = self.get_cache_config(&conn, account_id)? {
            if config.enable_attachment_caching {
                self.cache_message_attachments(&conn, message, account_id)?;
            }
        }

        Ok(())
    }

    /// Get cache statistics for an account
    pub async fn get_cache_stats(&self, account_id: &str) -> Result<CacheStats> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        // Get total messages
        let total_messages: u64 = conn.query_row(
            "SELECT COUNT(*) FROM gmail_message_cache WHERE account_id = ?1",
            params![account_id],
            |row| row.get(0),
        ).context("Failed to get total messages count")?;

        // Get total threads
        let total_threads: u64 = conn.query_row(
            "SELECT COUNT(DISTINCT thread_id) FROM gmail_message_cache WHERE account_id = ?1",
            params![account_id],
            |row| row.get(0),
        ).context("Failed to get total threads count")?;

        // Get total attachments
        let total_attachments: u64 = conn.query_row(
            "SELECT COUNT(*) FROM gmail_attachments WHERE account_id = ?1",
            params![account_id],
            |row| row.get(0),
        ).context("Failed to get total attachments count")?;

        // Calculate cache size
        let cache_size_mb = self.calculate_cache_size(&conn, account_id)?;
        let hit_rate = self.calculate_hit_rate(&conn, account_id)?;
        let last_cleanup = self.get_last_cleanup_time(&conn, account_id)?;

        // Get offline messages count
        let offline_messages: u64 = conn.query_row(
            "SELECT COUNT(*) FROM gmail_message_cache WHERE account_id = ?1 AND is_offline_available = 1",
            params![account_id],
            |row| row.get(0),
        ).context("Failed to get offline messages count")?;

        Ok(CacheStats {
            total_messages,
            total_threads,
            total_attachments,
            cache_size_mb,
            hit_rate,
            last_cleanup,
            offline_messages,
        })
    }

    /// Cleanup cache based on configuration
    pub async fn cleanup_cache(&self, account_id: &str, force: bool) -> Result<u64> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let config = self.get_cache_config(&conn, account_id)?
            .ok_or_else(|| anyhow::anyhow!("No cache config found for account"))?;

        let mut cleaned_count = 0u64;

        // Check if cleanup is needed
        if !force && !self.is_cache_over_limit(&conn, account_id, &config)? {
            return Ok(0);
        }

        // Clean up expired messages
        let cutoff_date = (Utc::now() - Duration::days(config.max_age_days as i64)).to_rfc3339();
        let expired_count = conn.execute(
            "DELETE FROM gmail_message_cache 
             WHERE account_id = ?1 AND cached_at < ?2 AND cache_priority != 'Critical'",
            params![account_id, &cutoff_date],
        ).context("Failed to delete expired messages")?;

        cleaned_count += expired_count as u64;

        // Clean up LRU messages if still over limit
        if self.is_cache_over_limit(&conn, account_id, &config)? {
            let lru_count = self.cleanup_lru_messages(&conn, account_id, &config)?;
            cleaned_count += lru_count as u64;
        }

        // Update last cleanup time
        conn.execute(
            "INSERT OR REPLACE INTO cache_stats 
             (account_id, last_cleanup, updated_at) 
             VALUES (?1, ?2, ?3)",
            params![account_id, &Utc::now().to_rfc3339(), &Utc::now().to_rfc3339()],
        ).context("Failed to update cleanup time")?;

        Ok(cleaned_count)
    }

    /// Enable offline access for specific messages
    pub async fn enable_offline_access(&self, message_ids: &[String], account_id: &str) -> Result<u32> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let mut updated_count = 0u32;

        for message_id in message_ids {
            let result = conn.execute(
                "UPDATE gmail_message_cache 
                 SET is_offline_available = 1, cache_priority = 'High', updated_at = ?1 
                 WHERE message_id = ?2 AND account_id = ?3",
                params![&Utc::now().to_rfc3339(), message_id, account_id],
            ).context("Failed to enable offline access")?;

            if result > 0 {
                updated_count += 1;
            }
        }

        Ok(updated_count)
    }

    /// Get offline-available messages
    pub async fn get_offline_messages(&self, account_id: &str) -> Result<Vec<CachedMessage>> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let mut stmt = conn.prepare(
            "SELECT message_id, thread_id, account_id, message_data, cached_at, 
             last_accessed, access_count, is_offline_available, cache_priority 
             FROM gmail_message_cache 
             WHERE account_id = ?1 AND is_offline_available = 1 
             ORDER BY cached_at DESC"
        ).context("Failed to prepare offline messages query")?;

        let rows = stmt.query_map(params![account_id], |row| {
            let message_data_json: String = row.get(3)?;
            let message_data: ProcessedGmailMessage = serde_json::from_str(&message_data_json)
                .map_err(|_e| rusqlite::Error::InvalidColumnType(3, "ProcessedGmailMessage".to_string(), rusqlite::types::Type::Text))?;

            Ok(CachedMessage {
                id: row.get(0)?,
                thread_id: row.get(1)?,
                account_id: row.get(2)?,
                message_data,
                cached_at: row.get(4)?,
                last_accessed: row.get(5)?,
                access_count: row.get(6)?,
                is_offline_available: row.get(7)?,
                cache_priority: CachePriority::High,
            })
        }).context("Failed to query offline messages")?;

        let messages: Vec<CachedMessage> = rows.collect::<Result<Vec<_>, _>>()
            .context("Failed to collect offline messages")?;

        Ok(messages)
    }

    /// Preload messages for offline access
    pub async fn preload_for_offline(&self, account_id: &str, days_back: u32, include_attachments: bool) -> Result<u32> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let cutoff_date = (Utc::now() - Duration::days(days_back as i64)).to_rfc3339();
        
        let updated_count = conn.execute(
            "UPDATE gmail_message_cache 
             SET is_offline_available = 1, cache_priority = 'High', updated_at = ?1 
             WHERE account_id = ?2 AND cached_at >= ?3",
            params![&Utc::now().to_rfc3339(), account_id, &cutoff_date],
        ).context("Failed to preload messages for offline")?;

        // Preload attachments if requested
        if include_attachments {
            conn.execute(
                "UPDATE gmail_attachments 
                 SET is_downloaded = 1, updated_at = ?1 
                 WHERE account_id = ?2 AND created_at >= ?3",
                params![&Utc::now().to_rfc3339(), account_id, &cutoff_date],
            ).context("Failed to preload attachments for offline")?;
        }

        Ok(updated_count as u32)
    }

    // Helper methods
    fn update_thread_cache(&self, conn: &Connection, message: &ProcessedGmailMessage, account_id: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        
        // Extract participants from parsed_content
        let mut participants = Vec::new();
        participants.push(message.parsed_content.from.clone());
        participants.extend(message.parsed_content.to.clone());
        participants.extend(message.parsed_content.cc.clone());
        
        let participants_json = serde_json::to_string(&participants)
            .context("Failed to serialize participants")?;

        // Determine read/starred status from labels
        let is_read = !message.labels.contains(&"UNREAD".to_string());
        let is_starred = message.labels.contains(&"STARRED".to_string());

        conn.execute(
            "INSERT OR REPLACE INTO gmail_thread_cache 
             (thread_id, account_id, message_count, latest_message_date, 
              labels, participants, subject, has_attachments, is_read, is_starred, 
              cached_at, last_updated, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                &message.thread_id,
                account_id,
                1, // This would be calculated from actual thread data
                &message.internal_date.as_deref().unwrap_or(""),
                &serde_json::to_string(&message.labels).unwrap_or_default(),
                &participants_json,
                &message.parsed_content.subject.as_deref().unwrap_or(""),
                !message.parsed_content.attachments.is_empty(),
                is_read,
                is_starred,
                &now,
                &now,
                &now,
                &now,
            ],
        ).context("Failed to update thread cache")?;

        Ok(())
    }

    fn cache_message_attachments(&self, conn: &Connection, message: &ProcessedGmailMessage, account_id: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();

        for attachment in &message.parsed_content.attachments {
            conn.execute(
                "INSERT OR REPLACE INTO gmail_attachments 
                 (attachment_id, message_id, account_id, filename, content_type, 
                  size_bytes, is_downloaded, cached_at, last_accessed, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![
                    &attachment.id,
                    &message.id,
                    account_id,
                    &attachment.filename.as_deref().unwrap_or("unknown"),
                    &attachment.content_type,
                    attachment.size.unwrap_or(0) as u64,
                    false, // Not downloaded by default
                    &now,
                    &now,
                    &now,
                    &now,
                ],
            ).context("Failed to cache attachment")?;
        }

        Ok(())
    }

    fn get_cached_threads(&self, conn: &Connection, account_id: &str, thread_ids: &[String]) -> Result<Vec<ThreadCache>> {
        if thread_ids.is_empty() {
            return Ok(vec![]);
        }

        let placeholders = thread_ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let query = format!(
            "SELECT thread_id, account_id, message_count, latest_message_date, 
             labels, participants, subject, has_attachments, is_read, is_starred, 
             cached_at, last_updated 
             FROM gmail_thread_cache 
             WHERE account_id = ? AND thread_id IN ({})",
            placeholders
        );

        let mut stmt = conn.prepare(&query)
            .context("Failed to prepare thread cache query")?;

        let mut params: Vec<&dyn rusqlite::ToSql> = vec![&account_id];
        for thread_id in thread_ids {
            params.push(thread_id);
        }

        let rows = stmt.query_map(&params[..], |row| {
            let labels_json: String = row.get(4)?;
            let labels: Vec<String> = serde_json::from_str(&labels_json).unwrap_or_default();
            
            let participants_json: String = row.get(5)?;
            let participants: Vec<EmailAddress> = serde_json::from_str(&participants_json).unwrap_or_default();

            Ok(ThreadCache {
                thread_id: row.get(0)?,
                account_id: row.get(1)?,
                message_count: row.get(2)?,
                latest_message_date: row.get(3)?,
                labels,
                participants,
                subject: row.get(6)?,
                has_attachments: row.get(7)?,
                is_read: row.get(8)?,
                is_starred: row.get(9)?,
                cached_at: row.get(10)?,
                last_updated: row.get(11)?,
            })
        }).context("Failed to query thread cache")?;

        let threads: Vec<ThreadCache> = rows.collect::<Result<Vec<_>, _>>()
            .context("Failed to collect thread cache")?;

        Ok(threads)
    }

    fn get_cache_config(&self, conn: &Connection, account_id: &str) -> Result<Option<CacheConfig>> {
        let result = conn.query_row(
            "SELECT max_cache_size_mb, max_age_days, enable_thread_caching, 
             enable_attachment_caching, enable_search_caching, cache_compression, offline_mode 
             FROM cache_config 
             WHERE account_id = ?1",
            params![account_id],
            |row| {
                Ok(CacheConfig {
                    max_cache_size_mb: row.get(0)?,
                    max_age_days: row.get(1)?,
                    enable_thread_caching: row.get(2)?,
                    enable_attachment_caching: row.get(3)?,
                    enable_search_caching: row.get(4)?,
                    cache_compression: row.get(5)?,
                    offline_mode: row.get(6)?,
                })
            }
        ).optional().context("Failed to get cache config")?;

        Ok(result)
    }

    fn calculate_cache_size(&self, conn: &Connection, account_id: &str) -> Result<f64> {
        let size_bytes: i64 = conn.query_row(
            "SELECT COALESCE(SUM(LENGTH(message_data)), 0) FROM gmail_message_cache WHERE account_id = ?1",
            params![account_id],
            |row| row.get(0),
        ).context("Failed to calculate cache size")?;

        Ok(size_bytes as f64 / (1024.0 * 1024.0)) // Convert to MB
    }

    fn calculate_hit_rate(&self, conn: &Connection, account_id: &str) -> Result<f64> {
        let total_accesses: i64 = conn.query_row(
            "SELECT COALESCE(SUM(access_count), 0) FROM gmail_message_cache WHERE account_id = ?1",
            params![account_id],
            |row| row.get(0),
        ).context("Failed to calculate total accesses")?;

        if total_accesses == 0 {
            return Ok(0.0);
        }

        let cache_hits: i64 = conn.query_row(
            "SELECT COUNT(*) FROM gmail_message_cache WHERE account_id = ?1 AND access_count > 1",
            params![account_id],
            |row| row.get(0),
        ).context("Failed to calculate cache hits")?;

        Ok((cache_hits as f64 / total_accesses as f64) * 100.0)
    }

    fn get_last_cleanup_time(&self, conn: &Connection, account_id: &str) -> Result<Option<String>> {
        let result = conn.query_row(
            "SELECT last_cleanup FROM cache_stats WHERE account_id = ?1",
            params![account_id],
            |row| row.get(0),
        ).optional().context("Failed to get last cleanup time")?;

        Ok(result)
    }

    fn is_cache_over_limit(&self, conn: &Connection, account_id: &str, config: &CacheConfig) -> Result<bool> {
        let current_size = self.calculate_cache_size(conn, account_id)?;
        Ok(current_size > config.max_cache_size_mb as f64)
    }

    fn cleanup_lru_messages(&self, conn: &Connection, account_id: &str, _config: &CacheConfig) -> Result<usize> {
        // Clean to 25% of cache entries (LRU cleanup)
        
        let deleted_count = conn.execute(
            "DELETE FROM gmail_message_cache 
             WHERE account_id = ?1 AND cache_priority != 'Critical' 
             AND message_id IN (
                 SELECT message_id FROM gmail_message_cache 
                 WHERE account_id = ?1 AND cache_priority != 'Critical'
                 ORDER BY last_accessed ASC, access_count ASC 
                 LIMIT (SELECT COUNT(*) FROM gmail_message_cache WHERE account_id = ?1) / 4
             )",
            params![account_id],
        ).context("Failed to cleanup LRU messages")?;

        Ok(deleted_count)
    }
} 