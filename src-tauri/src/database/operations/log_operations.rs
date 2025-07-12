//! Application log-related database operations
//!
//! This module provides CRUD operations for application logs.

use anyhow::Result;
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::ApplicationLog;
use chrono::{Local, NaiveDateTime};

// ===== Application Log Operations =====

/// Create a new application log entry
pub fn create_application_log(
    conn: &Connection,
    log_level: &str,
    message: &str,
    module_name: &str,
    function_name: &str,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO application_logs (log_level, message, module_name, function_name, timestamp) 
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            log_level,
            message,
            module_name,
            function_name,
            now
        ],
    )?;

    let log_id = conn.last_insert_rowid() as i32;
    Ok(log_id)
}

/// Get application logs with filtering options
pub fn get_application_log(conn: &Connection, log_id: i32) -> Result<Option<ApplicationLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, log_level, message, module_name, function_name, timestamp 
         FROM application_logs WHERE id = ?1"
    )?;

    let log = stmt.query_row(params![log_id], |row| {
        Ok(ApplicationLog {
            id: row.get(0)?,
            log_level: row.get(1)?,
            message: row.get(2)?,
            module_name: row.get(3)?,
            function_name: row.get(4)?,
            line_number: None, // Default line_number
            user_id: None, // Default user_id
            session_id: None, // Default session_id
            request_id: None, // Default request_id
            timestamp: row.get(5)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    }).optional()?;

    Ok(log)
}

pub fn get_application_logs_by_level(conn: &Connection, log_level: &str) -> Result<Vec<ApplicationLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, log_level, message, module_name, function_name, timestamp 
         FROM application_logs WHERE log_level = ?1 ORDER BY timestamp DESC"
    )?;

    let logs = stmt.query_map(params![log_level], |row| {
        Ok(ApplicationLog {
            id: row.get(0)?,
            log_level: row.get(1)?,
            message: row.get(2)?,
            module_name: row.get(3)?,
            function_name: row.get(4)?,
            line_number: None, // Default line_number
            user_id: None, // Default user_id
            session_id: None, // Default session_id
            request_id: None, // Default request_id
            timestamp: row.get(5)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for log in logs {
        result.push(log?);
    }

    Ok(result)
}

pub fn get_application_logs_by_module(conn: &Connection, module_name: &str) -> Result<Vec<ApplicationLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, log_level, message, module_name, function_name, timestamp 
         FROM application_logs WHERE module_name = ?1 ORDER BY timestamp DESC"
    )?;

    let logs = stmt.query_map(params![module_name], |row| {
        Ok(ApplicationLog {
            id: row.get(0)?,
            log_level: row.get(1)?,
            message: row.get(2)?,
            module_name: row.get(3)?,
            function_name: row.get(4)?,
            line_number: None, // Default line_number
            user_id: None, // Default user_id
            session_id: None, // Default session_id
            request_id: None, // Default request_id
            timestamp: row.get(5)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for log in logs {
        result.push(log?);
    }

    Ok(result)
}

pub fn get_application_logs_in_range(
    conn: &Connection,
    start_time: NaiveDateTime,
    end_time: NaiveDateTime,
) -> Result<Vec<ApplicationLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, log_level, message, module_name, function_name, timestamp 
         FROM application_logs WHERE timestamp >= ?1 AND timestamp <= ?2 ORDER BY timestamp DESC"
    )?;

    let logs = stmt.query_map(params![start_time, end_time], |row| {
        Ok(ApplicationLog {
            id: row.get(0)?,
            log_level: row.get(1)?,
            message: row.get(2)?,
            module_name: row.get(3)?,
            function_name: row.get(4)?,
            line_number: None, // Default line_number
            user_id: None, // Default user_id
            session_id: None, // Default session_id
            request_id: None, // Default request_id
            timestamp: row.get(5)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for log in logs {
        result.push(log?);
    }

    Ok(result)
}

pub fn get_recent_application_logs(conn: &Connection, limit: i32) -> Result<Vec<ApplicationLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, log_level, message, module_name, function_name, timestamp 
         FROM application_logs ORDER BY timestamp DESC LIMIT ?1"
    )?;

    let logs = stmt.query_map(params![limit], |row| {
        Ok(ApplicationLog {
            id: row.get(0)?,
            log_level: row.get(1)?,
            message: row.get(2)?,
            module_name: row.get(3)?,
            function_name: row.get(4)?,
            line_number: None, // Default line_number
            user_id: None, // Default user_id
            session_id: None, // Default session_id
            request_id: None, // Default request_id
            timestamp: row.get(5)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for log in logs {
        result.push(log?);
    }

    Ok(result)
}

pub fn search_application_logs(conn: &Connection, query: &str) -> Result<Vec<ApplicationLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, log_level, message, module_name, function_name, timestamp 
         FROM application_logs WHERE message LIKE ?1 OR module_name LIKE ?1 OR function_name LIKE ?1 ORDER BY timestamp DESC"
    )?;

    let search_pattern = format!("%{}%", query);
    let logs = stmt.query_map(params![search_pattern], |row| {
        Ok(ApplicationLog {
            id: row.get(0)?,
            log_level: row.get(1)?,
            message: row.get(2)?,
            module_name: row.get(3)?,
            function_name: row.get(4)?,
            line_number: None, // Default line_number
            user_id: None, // Default user_id
            session_id: None, // Default session_id
            request_id: None, // Default request_id
            timestamp: row.get(5)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for log in logs {
        result.push(log?);
    }

    Ok(result)
}

pub fn get_application_logs_by_level_and_module(
    conn: &Connection,
    log_level: &str,
    module_name: &str,
) -> Result<Vec<ApplicationLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, log_level, message, module_name, function_name, timestamp 
         FROM application_logs WHERE log_level = ?1 AND module_name = ?2 ORDER BY timestamp DESC"
    )?;

    let logs = stmt.query_map(params![log_level, module_name], |row| {
        Ok(ApplicationLog {
            id: row.get(0)?,
            log_level: row.get(1)?,
            message: row.get(2)?,
            module_name: row.get(3)?,
            function_name: row.get(4)?,
            line_number: None, // Default line_number
            user_id: None, // Default user_id
            session_id: None, // Default session_id
            request_id: None, // Default request_id
            timestamp: row.get(5)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for log in logs {
        result.push(log?);
    }

    Ok(result)
}

pub fn delete_old_application_logs(conn: &Connection, before_timestamp: NaiveDateTime) -> Result<usize> {
    let rows_affected = conn.execute(
        "DELETE FROM application_logs WHERE timestamp < ?1",
        params![before_timestamp],
    )?;

    Ok(rows_affected)
}

pub fn delete_application_logs_by_level(conn: &Connection, log_level: &str) -> Result<usize> {
    let rows_affected = conn.execute(
        "DELETE FROM application_logs WHERE log_level = ?1",
        params![log_level],
    )?;

    Ok(rows_affected)
}

pub fn get_application_log_count(conn: &Connection) -> Result<i32> {
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM application_logs"
    )?;

    let count = stmt.query_row([], |row| {
        row.get(0)
    })?;

    Ok(count)
}

pub fn get_application_log_count_by_level(conn: &Connection, log_level: &str) -> Result<i32> {
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM application_logs WHERE log_level = ?1"
    )?;

    let count = stmt.query_row(params![log_level], |row| {
        row.get(0)
    })?;

    Ok(count)
}

/// Clear all application logs (helper function)
pub fn clear_all_application_logs(conn: &Connection) -> Result<usize> {
    let rows_affected = conn.execute("DELETE FROM application_logs", [])?;
    Ok(rows_affected)
}

/// Get all application logs
pub fn get_all_application_logs(conn: &Connection) -> Result<Vec<crate::database::models::ApplicationLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, log_level, message, module_name, function_name, line_number, user_id, session_id, request_id, timestamp, created_at 
         FROM application_logs ORDER BY created_at DESC"
    )?;

    let logs = stmt.query_map([], |row| {
        let log_level_str: String = row.get(1)?;
        Ok(crate::database::models::ApplicationLog {
            id: row.get(0)?,
            log_level: crate::database::models::LogLevel::from_string(&log_level_str),
            message: row.get(2)?,
            module_name: row.get(3)?,
            function_name: row.get(4)?,
            line_number: row.get(5).ok(),
            user_id: row.get(6).ok(),
            session_id: row.get(7).ok(),
            request_id: row.get(8).ok(),
            timestamp: row.get(9)?,
            created_at: row.get(10)?,
        })
    })?;

    let mut result = Vec::new();
    for log in logs {
        result.push(log?);
    }

    Ok(result)
}

/// Get application logs with dynamic filtering
pub fn get_application_logs_filtered(
    conn: &Connection,
    log_level: Option<String>,
    component: Option<String>,
    start_time: Option<NaiveDateTime>,
    end_time: Option<NaiveDateTime>,
    limit: Option<usize>,
) -> Result<Vec<ApplicationLog>> {
    let mut query = "SELECT id, log_level, message, module_name, function_name, timestamp FROM application_logs WHERE 1=1".to_string();
    let mut params: Vec<rusqlite::types::ToSqlOutput> = Vec::new();

    if let Some(level) = log_level {
        query.push_str(" AND log_level = ?");
        params.push(rusqlite::types::ToSqlOutput::from(level));
    }

    if let Some(comp) = component {
        // Assuming 'component' maps to 'module_name'
        query.push_str(" AND module_name = ?");
        params.push(rusqlite::types::ToSqlOutput::from(comp));
    }
    
    if let Some(start) = start_time {
        query.push_str(" AND timestamp >= ?");
        params.push(rusqlite::types::ToSqlOutput::from(start.format("%Y-%m-%d %H:%M:%S").to_string()));
    }

    if let Some(end) = end_time {
        query.push_str(" AND timestamp <= ?");
        params.push(rusqlite::types::ToSqlOutput::from(end.format("%Y-%m-%d %H:%M:%S").to_string()));
    }

    query.push_str(" ORDER BY timestamp DESC");

    if let Some(lim) = limit {
        query.push_str(" LIMIT ?");
        params.push(rusqlite::types::ToSqlOutput::from(lim as i64));
    }

    let mut stmt = conn.prepare(&query)?;

    // Create a slice of references for query_map
    let params_slice: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p as &dyn rusqlite::ToSql).collect();

    let logs = stmt.query_map(&params_slice[..], |row| {
        Ok(ApplicationLog {
            id: row.get(0)?,
            log_level: row.get(1)?,
            message: row.get(2)?,
            module_name: row.get(3)?,
            function_name: row.get(4)?,
            line_number: None, // Default line_number
            user_id: None, // Default user_id
            session_id: None, // Default session_id
            request_id: None, // Default request_id
            timestamp: row.get(5)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for log in logs {
        result.push(log?);
    }

    Ok(result)
} 