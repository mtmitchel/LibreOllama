use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use tauri::{command, State};
use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc, Duration};
use rusqlite::{Connection, params, OptionalExtension};

use crate::database::connection::DatabaseManager;
use crate::commands::gmail_integration::ProcessedGmailMessage;
use crate::commands::email_parser::{ParsedEmailMessage, EmailAddress, EmailAttachment};

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

/// Initialize cache configuration for an account
#[command]
pub async fn initialize_cache_config(
    account_id: String,
    config: CacheConfig,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    // Store cache configuration
    conn.execute(
        "INSERT OR REPLACE INTO cache_config 
         (account_id, max_cache_size_mb, max_age_days, enable_thread_caching, 
          enable_attachment_caching, enable_search_caching, cache_compression, 
          offline_mode, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            &account_id,
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
    ).map_err(|e| format!("Failed to store cache config: {}", e))?;

    Ok(())
}

/// Get cached messages based on query
#[command]
pub async fn get_cached_messages(
    query: CacheQuery,
    db_manager: State<'_, DatabaseManager>,
) -> Result<CacheQueryResult, String> {
    let start_time = std::time::Instant::now();
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

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
        param_index += 1;
    }

    let where_clause = where_clauses.join(" AND ");
    let limit_clause = query.limit.map(|l| format!(" LIMIT {}", l)).unwrap_or_default();
    let offset_clause = query.offset.map(|o| format!(" OFFSET {}", o)).unwrap_or_default();

    let sql = format!(
        "SELECT message_id, thread_id, message_data, cached_at, last_accessed, 
                access_count, is_offline_available, cache_priority
         FROM message_cache 
         WHERE {} 
         ORDER BY last_accessed DESC{}{}",
        where_clause, limit_clause, offset_clause
    );

    let mut stmt = conn.prepare(&sql)
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter()
        .map(|p| p.as_ref())
        .collect();

    let rows = stmt.query_map(&param_refs[..], |row| {
        let message_data_json: String = row.get(2)?;
        let message_data: ProcessedGmailMessage = serde_json::from_str(&message_data_json)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                2, rusqlite::types::Type::Text, Box::new(e)
            ))?;

        let cache_priority_str: String = row.get(7)?;
        let cache_priority = match cache_priority_str.as_str() {
            "low" => CachePriority::Low,
            "medium" => CachePriority::Medium,
            "high" => CachePriority::High,
            "critical" => CachePriority::Critical,
            _ => CachePriority::Medium,
        };

        Ok(CachedMessage {
            id: row.get(0)?,
            thread_id: row.get(1)?,
            account_id: query.account_id.clone(),
            message_data,
            cached_at: row.get(3)?,
            last_accessed: row.get(4)?,
            access_count: row.get(5)?,
            is_offline_available: row.get(6)?,
            cache_priority,
        })
    }).map_err(|e| format!("Failed to execute query: {}", e))?;

    let mut messages = Vec::new();
    for row in rows {
        match row {
            Ok(message) => {
                let message_id = message.id.clone();
                messages.push(message);
                // Update access count
                let _ = update_message_access_count(&conn, &message_id);
            }
            Err(e) => eprintln!("Error processing cached message: {}", e),
        }
    }

    // Get thread information for these messages
    let thread_ids: HashSet<String> = messages.iter()
        .map(|m| m.thread_id.clone())
        .collect();

    let threads = if !thread_ids.is_empty() {
        get_cached_threads(&conn, &query.account_id, &thread_ids.into_iter().collect::<Vec<_>>())?
    } else {
        Vec::new()
    };

    let query_time_ms = start_time.elapsed().as_millis() as u64;

    Ok(CacheQueryResult {
        total_count: messages.len() as u32,
        messages,
        threads,
        cache_hit: true,
        query_time_ms,
    })
}

/// Cache a message with specified priority
#[command]
pub async fn cache_message(
    message: ProcessedGmailMessage,
    account_id: String,
    priority: CachePriority,
    offline_available: bool,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let message_data_json = serde_json::to_string(&message)
        .map_err(|e| format!("Failed to serialize message: {}", e))?;

    let priority_str = match priority {
        CachePriority::Low => "low",
        CachePriority::Medium => "medium",
        CachePriority::High => "high",
        CachePriority::Critical => "critical",
    };

    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT OR REPLACE INTO message_cache 
         (message_id, thread_id, account_id, message_data, cached_at, last_accessed, 
          access_count, is_offline_available, cache_priority)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            &message.id,
            &message.thread_id,
            &account_id,
            &message_data_json,
            &now,
            &now,
            0,
            offline_available,
            priority_str,
        ],
    ).map_err(|e| format!("Failed to cache message: {}", e))?;

    // Update thread cache
    update_thread_cache(&conn, &message, &account_id)?;

    // Cache attachments if enabled
    if let Some(config) = get_cache_config(&conn, &account_id)? {
        if config.enable_attachment_caching {
            cache_message_attachments(&conn, &message, &account_id)?;
        }
    }

    Ok(())
}

/// Get cache statistics for an account
#[command]
pub async fn get_cache_stats(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<CacheStats, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let total_messages: u64 = conn.query_row(
        "SELECT COUNT(*) FROM message_cache WHERE account_id = ?1",
        params![&account_id],
        |row| row.get(0),
    ).unwrap_or(0);

    let total_threads: u64 = conn.query_row(
        "SELECT COUNT(*) FROM thread_cache WHERE account_id = ?1",
        params![&account_id],
        |row| row.get(0),
    ).unwrap_or(0);

    let total_attachments: u64 = conn.query_row(
        "SELECT COUNT(*) FROM attachment_cache WHERE account_id = ?1",
        params![&account_id],
        |row| row.get(0),
    ).unwrap_or(0);

    let offline_messages: u64 = conn.query_row(
        "SELECT COUNT(*) FROM message_cache WHERE account_id = ?1 AND is_offline_available = 1",
        params![&account_id],
        |row| row.get(0),
    ).unwrap_or(0);

    // Calculate cache size (approximate)
    let cache_size_mb = calculate_cache_size(&conn, &account_id)?;

    // Calculate hit rate from cache statistics
    let hit_rate = calculate_hit_rate(&conn, &account_id)?;

    let last_cleanup = get_last_cleanup_time(&conn, &account_id)?;

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

/// Clean up old cache entries based on configuration
#[command]
pub async fn cleanup_cache(
    account_id: String,
    force: bool,
    db_manager: State<'_, DatabaseManager>,
) -> Result<u64, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let config = get_cache_config(&conn, &account_id)?
        .ok_or("No cache configuration found")?;

    let cutoff_date = Utc::now() - Duration::days(config.max_age_days as i64);
    let cutoff_str = cutoff_date.to_rfc3339();

    let mut total_deleted = 0;

    // Delete old messages (except critical priority)
    let deleted_messages = conn.execute(
        "DELETE FROM message_cache 
         WHERE account_id = ?1 AND cached_at < ?2 AND cache_priority != 'critical'",
        params![&account_id, &cutoff_str],
    ).map_err(|e| format!("Failed to delete old messages: {}", e))?;

    total_deleted += deleted_messages;

    // Delete orphaned threads
    let deleted_threads = conn.execute(
        "DELETE FROM thread_cache 
         WHERE account_id = ?1 AND thread_id NOT IN (
             SELECT DISTINCT thread_id FROM message_cache WHERE account_id = ?1
         )",
        params![&account_id],
    ).map_err(|e| format!("Failed to delete orphaned threads: {}", e))?;

    total_deleted += deleted_threads;

    // Delete orphaned attachments
    let deleted_attachments = conn.execute(
        "DELETE FROM attachment_cache 
         WHERE account_id = ?1 AND message_id NOT IN (
             SELECT DISTINCT message_id FROM message_cache WHERE account_id = ?1
         )",
        params![&account_id],
    ).map_err(|e| format!("Failed to delete orphaned attachments: {}", e))?;

    total_deleted += deleted_attachments;

    // If force cleanup or over size limit, delete least recently used
    if force || is_cache_over_limit(&conn, &account_id, &config)? {
        let lru_deleted = cleanup_lru_messages(&conn, &account_id, &config)?;
        total_deleted += lru_deleted;
    }

    // Update last cleanup time
    conn.execute(
        "UPDATE cache_config SET last_cleanup = ?1 WHERE account_id = ?2",
        params![&Utc::now().to_rfc3339(), &account_id],
    ).map_err(|e| format!("Failed to update cleanup time: {}", e))?;

    Ok(total_deleted as u64)
}

/// Enable offline mode for specific messages
#[command]
pub async fn enable_offline_access(
    message_ids: Vec<String>,
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<u32, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let mut updated = 0;

    for message_id in message_ids {
        let result = conn.execute(
            "UPDATE message_cache 
             SET is_offline_available = 1, cache_priority = 'high' 
             WHERE message_id = ?1 AND account_id = ?2",
            params![&message_id, &account_id],
        ).map_err(|e| format!("Failed to enable offline access: {}", e))?;

        if result > 0 {
            updated += 1;
        }
    }

    Ok(updated)
}

/// Get offline available messages
#[command]
pub async fn get_offline_messages(
    account_id: String,
    db_manager: State<'_, DatabaseManager>,
) -> Result<Vec<CachedMessage>, String> {
    let query = CacheQuery {
        account_id,
        thread_ids: None,
        message_ids: None,
        labels: None,
        date_range: None,
        has_attachments: None,
        is_read: None,
        is_starred: None,
        limit: None,
        offset: None,
    };

    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let mut stmt = conn.prepare(
        "SELECT message_id, thread_id, message_data, cached_at, last_accessed, 
                access_count, is_offline_available, cache_priority
         FROM message_cache 
         WHERE account_id = ?1 AND is_offline_available = 1
         ORDER BY cached_at DESC"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let rows = stmt.query_map(params![&query.account_id], |row| {
        let message_data_json: String = row.get(2)?;
        let message_data: ProcessedGmailMessage = serde_json::from_str(&message_data_json)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                2, rusqlite::types::Type::Text, Box::new(e)
            ))?;

        let cache_priority_str: String = row.get(7)?;
        let cache_priority = match cache_priority_str.as_str() {
            "low" => CachePriority::Low,
            "medium" => CachePriority::Medium,
            "high" => CachePriority::High,
            "critical" => CachePriority::Critical,
            _ => CachePriority::Medium,
        };

        Ok(CachedMessage {
            id: row.get(0)?,
            thread_id: row.get(1)?,
            account_id: query.account_id.clone(),
            message_data,
            cached_at: row.get(3)?,
            last_accessed: row.get(4)?,
            access_count: row.get(5)?,
            is_offline_available: row.get(6)?,
            cache_priority,
        })
    }).map_err(|e| format!("Failed to execute query: {}", e))?;

    let mut messages = Vec::new();
    for row in rows {
        match row {
            Ok(message) => messages.push(message),
            Err(e) => eprintln!("Error processing offline message: {}", e),
        }
    }

    Ok(messages)
}

/// Preload messages for offline access
#[command]
pub async fn preload_for_offline(
    account_id: String,
    days_back: u32,
    include_attachments: bool,
    db_manager: State<'_, DatabaseManager>,
) -> Result<u32, String> {
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let cutoff_date = Utc::now() - Duration::days(days_back as i64);
    let cutoff_str = cutoff_date.to_rfc3339();

    // Mark recent messages as offline available
    let updated = conn.execute(
        "UPDATE message_cache 
         SET is_offline_available = 1, cache_priority = 'high' 
         WHERE account_id = ?1 AND cached_at >= ?2",
        params![&account_id, &cutoff_str],
    ).map_err(|e| format!("Failed to preload messages: {}", e))?;

    if include_attachments {
        // Mark attachments for offline download
        let _attachment_updated = conn.execute(
            "UPDATE attachment_cache 
             SET is_downloaded = 1 
             WHERE account_id = ?1 AND message_id IN (
                 SELECT message_id FROM message_cache 
                 WHERE account_id = ?1 AND cached_at >= ?2 AND is_offline_available = 1
             )",
            params![&account_id, &cutoff_str],
        ).map_err(|e| format!("Failed to preload attachments: {}", e))?;
    }

    Ok(updated as u32)
}

// Helper functions

fn update_thread_cache(
    conn: &Connection,
    message: &ProcessedGmailMessage,
    account_id: &str,
) -> Result<(), String> {
    // Get existing thread info or create new
    let existing_thread = conn.query_row(
        "SELECT message_count, latest_message_date FROM thread_cache 
         WHERE thread_id = ?1 AND account_id = ?2",
        params![&message.thread_id, account_id],
        |row| Ok((row.get::<_, u32>(0)?, row.get::<_, String>(1)?)),
    ).optional().map_err(|e| format!("Failed to query thread cache: {}", e))?;

    let (message_count, latest_date) = if let Some((count, date)) = existing_thread {
        (count + 1, date)
    } else {
        (1, message.internal_date.clone().unwrap_or_else(|| Utc::now().to_rfc3339()))
    };

    // Extract thread information from message
    let participants: Vec<EmailAddress> = {
        let mut participants = Vec::new();
        participants.push(message.parsed_content.from.clone());
        participants.extend(message.parsed_content.to.clone());
        participants.extend(message.parsed_content.cc.clone());
        participants
    };

    let participants_json = serde_json::to_string(&participants)
        .unwrap_or_default();

    conn.execute(
        "INSERT OR REPLACE INTO thread_cache 
         (thread_id, account_id, message_count, latest_message_date, labels, 
          participants, subject, has_attachments, is_read, is_starred, 
          cached_at, last_updated)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            &message.thread_id,
            account_id,
            message_count,
            &latest_date,
            &serde_json::to_string(&message.labels).unwrap_or_default(),
            &participants_json,
            &message.parsed_content.subject.as_deref().unwrap_or(""),
            !message.parsed_content.attachments.is_empty(),
            false, // is_read - would need to check labels
            false, // is_starred - would need to check labels
            &Utc::now().to_rfc3339(),
            &Utc::now().to_rfc3339(),
        ],
    ).map_err(|e| format!("Failed to update thread cache: {}", e))?;

    Ok(())
}

fn cache_message_attachments(
    conn: &Connection,
    message: &ProcessedGmailMessage,
    account_id: &str,
) -> Result<(), String> {
    for attachment in &message.parsed_content.attachments {
        conn.execute(
            "INSERT OR REPLACE INTO attachment_cache 
             (attachment_id, message_id, account_id, filename, content_type, 
              size_bytes, local_path, is_downloaded, download_date, cached_at, last_accessed)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                &attachment.id,
                &message.id,
                account_id,
                &attachment.filename.as_deref().unwrap_or(""),
                &attachment.content_type,
                attachment.size.unwrap_or(0) as u64,
                None::<String>, // local_path - not downloaded yet
                false, // is_downloaded
                None::<String>, // download_date
                &Utc::now().to_rfc3339(),
                &Utc::now().to_rfc3339(),
            ],
        ).map_err(|e| format!("Failed to cache attachment: {}", e))?;
    }

    Ok(())
}

fn get_cached_threads(
    conn: &Connection,
    account_id: &str,
    thread_ids: &[String],
) -> Result<Vec<ThreadCache>, String> {
    let placeholders = thread_ids.iter()
        .enumerate()
        .map(|(i, _)| format!("?{}", i + 2))
        .collect::<Vec<_>>()
        .join(", ");

    let sql = format!(
        "SELECT thread_id, message_count, latest_message_date, labels, participants, 
                subject, has_attachments, is_read, is_starred, cached_at, last_updated
         FROM thread_cache 
         WHERE account_id = ?1 AND thread_id IN ({})",
        placeholders
    );

    let mut stmt = conn.prepare(&sql)
        .map_err(|e| format!("Failed to prepare thread query: {}", e))?;

    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(account_id.to_string())];
    for thread_id in thread_ids {
        params.push(Box::new(thread_id.clone()));
    }

    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter()
        .map(|p| p.as_ref())
        .collect();

    let rows = stmt.query_map(&param_refs[..], |row| {
        let labels_json: String = row.get(3)?;
        let labels: Vec<String> = serde_json::from_str(&labels_json).unwrap_or_default();

        let participants_json: String = row.get(4)?;
        let participants: Vec<EmailAddress> = serde_json::from_str(&participants_json).unwrap_or_default();

        Ok(ThreadCache {
            thread_id: row.get(0)?,
            account_id: account_id.to_string(),
            message_count: row.get(1)?,
            latest_message_date: row.get(2)?,
            labels,
            participants,
            subject: row.get(5)?,
            has_attachments: row.get(6)?,
            is_read: row.get(7)?,
            is_starred: row.get(8)?,
            cached_at: row.get(9)?,
            last_updated: row.get(10)?,
        })
    }).map_err(|e| format!("Failed to execute thread query: {}", e))?;

    let mut threads = Vec::new();
    for row in rows {
        match row {
            Ok(thread) => threads.push(thread),
            Err(e) => eprintln!("Error processing cached thread: {}", e),
        }
    }

    Ok(threads)
}

fn update_message_access_count(conn: &Connection, message_id: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE message_cache 
         SET access_count = access_count + 1, last_accessed = ?1 
         WHERE message_id = ?2",
        params![&Utc::now().to_rfc3339(), message_id],
    ).map_err(|e| format!("Failed to update access count: {}", e))?;

    Ok(())
}

fn get_cache_config(conn: &Connection, account_id: &str) -> Result<Option<CacheConfig>, String> {
    let result = conn.query_row(
        "SELECT max_cache_size_mb, max_age_days, enable_thread_caching, 
                enable_attachment_caching, enable_search_caching, cache_compression, offline_mode
         FROM cache_config WHERE account_id = ?1",
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
        },
    ).optional().map_err(|e| format!("Failed to get cache config: {}", e))?;

    Ok(result)
}

fn calculate_cache_size(conn: &Connection, account_id: &str) -> Result<f64, String> {
    let size_bytes: i64 = conn.query_row(
        "SELECT SUM(LENGTH(message_data)) FROM message_cache WHERE account_id = ?1",
        params![account_id],
        |row| row.get(0),
    ).unwrap_or(0);

    Ok(size_bytes as f64 / 1024.0 / 1024.0) // Convert to MB
}

fn calculate_hit_rate(conn: &Connection, account_id: &str) -> Result<f64, String> {
    let total_accesses: i64 = conn.query_row(
        "SELECT SUM(access_count) FROM message_cache WHERE account_id = ?1",
        params![account_id],
        |row| row.get(0),
    ).unwrap_or(0);

    let total_messages: i64 = conn.query_row(
        "SELECT COUNT(*) FROM message_cache WHERE account_id = ?1",
        params![account_id],
        |row| row.get(0),
    ).unwrap_or(0);

    if total_messages == 0 {
        return Ok(0.0);
    }

    Ok(total_accesses as f64 / total_messages as f64)
}

fn get_last_cleanup_time(conn: &Connection, account_id: &str) -> Result<Option<String>, String> {
    let result = conn.query_row(
        "SELECT last_cleanup FROM cache_config WHERE account_id = ?1",
        params![account_id],
        |row| row.get(0),
    ).optional().map_err(|e| format!("Failed to get last cleanup time: {}", e))?;

    Ok(result)
}

fn is_cache_over_limit(conn: &Connection, account_id: &str, config: &CacheConfig) -> Result<bool, String> {
    let current_size = calculate_cache_size(conn, account_id)?;
    Ok(current_size > config.max_cache_size_mb as f64)
}

fn cleanup_lru_messages(conn: &Connection, account_id: &str, config: &CacheConfig) -> Result<usize, String> {
    let target_size = config.max_cache_size_mb as f64 * 0.8; // Clean up to 80% of limit
    let current_size = calculate_cache_size(conn, account_id)?;

    if current_size <= target_size {
        return Ok(0);
    }

    // Delete least recently used messages (except critical priority)
    let deleted = conn.execute(
        "DELETE FROM message_cache 
         WHERE account_id = ?1 AND cache_priority != 'critical'
         AND message_id IN (
             SELECT message_id FROM message_cache 
             WHERE account_id = ?1 AND cache_priority != 'critical'
             ORDER BY last_accessed ASC 
             LIMIT ?2
         )",
        params![account_id, (current_size - target_size) as i64 * 10], // Rough estimate
    ).map_err(|e| format!("Failed to cleanup LRU messages: {}", e))?;

    Ok(deleted)
} 