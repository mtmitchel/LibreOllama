//! Request cache-related database operations
//!
//! This module provides CRUD operations for request caches.

use anyhow::Result;
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::RequestCache;
use chrono::{Local, NaiveDateTime};

// ===== Request Cache Operations =====

// Request Cache Operations

// Request Cache Operations
pub fn create_cache_entry(
    conn: &Connection,
    request_hash: &str,
    response_body: &str,
    expires_at: NaiveDateTime,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO request_cache (request_hash, response_body, expires_at, created_at) 
         VALUES (?1, ?2, ?3, ?4)",
        params![
            request_hash,
            response_body,
            expires_at,
            now
        ],
    )?;

    let cache_id = conn.last_insert_rowid() as i32;
    Ok(cache_id)
}

pub fn get_cache_entry_by_hash(conn: &Connection, request_hash: &str) -> Result<Option<RequestCache>> {
    let mut stmt = conn.prepare(
        "SELECT id, request_hash, response_body, expires_at, created_at 
         FROM request_cache WHERE request_hash = ?1"
    )?;

    let entry = stmt.query_row(params![request_hash], |row| {
        Ok(RequestCache {
            id: row.get(0)?,
            request_hash: row.get(1)?,
            response_body: row.get(2)?,
            expires_at: row.get(3)?,
            created_at: row.get(4)?,
        })
    }).optional()?;

    Ok(entry)
}

pub fn get_cache_entry(conn: &Connection, cache_id: i32) -> Result<Option<RequestCache>> {
    let mut stmt = conn.prepare(
        "SELECT id, request_hash, response_body, expires_at, created_at 
         FROM request_cache WHERE id = ?1"
    )?;

    let entry = stmt.query_row(params![cache_id], |row| {
        Ok(RequestCache {
            id: row.get(0)?,
            request_hash: row.get(1)?,
            response_body: row.get(2)?,
            expires_at: row.get(3)?,
            created_at: row.get(4)?,
        })
    }).optional()?;

    Ok(entry)
}

pub fn get_valid_cache_entry(conn: &Connection, request_hash: &str) -> Result<Option<RequestCache>> {
    let now = Local::now().naive_local();
    let mut stmt = conn.prepare(
        "SELECT id, request_hash, response_body, expires_at, created_at 
         FROM request_cache WHERE request_hash = ?1 AND expires_at > ?2"
    )?;

    let entry = stmt.query_row(params![request_hash, now], |row| {
        Ok(RequestCache {
            id: row.get(0)?,
            request_hash: row.get(1)?,
            response_body: row.get(2)?,
            expires_at: row.get(3)?,
            created_at: row.get(4)?,
        })
    }).optional()?;

    Ok(entry)
}

pub fn update_cache_entry(
    conn: &Connection,
    cache_id: i32,
    response_body: &str,
    expires_at: NaiveDateTime,
) -> Result<()> {
    conn.execute(
        "UPDATE request_cache SET response_body = ?1, expires_at = ?2 WHERE id = ?3",
        params![response_body, expires_at, cache_id],
    )?;

    Ok(())
}

pub fn update_cache_entry_by_hash(
    conn: &Connection,
    request_hash: &str,
    response_body: &str,
    expires_at: NaiveDateTime,
) -> Result<()> {
    conn.execute(
        "UPDATE request_cache SET response_body = ?1, expires_at = ?2 WHERE request_hash = ?3",
        params![response_body, expires_at, request_hash],
    )?;

    Ok(())
}

pub fn delete_cache_entry(conn: &Connection, cache_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM request_cache WHERE id = ?1",
        params![cache_id],
    )?;

    Ok(())
}

pub fn delete_cache_entry_by_hash(conn: &Connection, request_hash: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM request_cache WHERE request_hash = ?1",
        params![request_hash],
    )?;

    Ok(())
}

pub fn delete_expired_cache_entries(conn: &Connection) -> Result<usize> {
    let now = Local::now().naive_local();
    let rows_affected = conn.execute(
        "DELETE FROM request_cache WHERE expires_at <= ?1",
        params![now],
    )?;

    Ok(rows_affected)
}

pub fn get_all_cache_entries(conn: &Connection) -> Result<Vec<RequestCache>> {
    let mut stmt = conn.prepare(
        "SELECT id, request_hash, response_body, expires_at, created_at 
         FROM request_cache ORDER BY created_at DESC"
    )?;

    let entries = stmt.query_map([], |row| {
        Ok(RequestCache {
            id: row.get(0)?,
            request_hash: row.get(1)?,
            response_body: row.get(2)?,
            expires_at: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;

    let mut result = Vec::new();
    for entry in entries {
        result.push(entry?);
    }

    Ok(result)
}

pub fn get_cache_entries_by_pattern(conn: &Connection, pattern: &str) -> Result<Vec<RequestCache>> {
    let mut stmt = conn.prepare(
        "SELECT id, request_hash, response_body, expires_at, created_at 
         FROM request_cache WHERE request_hash LIKE ?1 ORDER BY created_at DESC"
    )?;

    let search_pattern = format!("%{}%", pattern);
    let entries = stmt.query_map(params![search_pattern], |row| {
        Ok(RequestCache {
            id: row.get(0)?,
            request_hash: row.get(1)?,
            response_body: row.get(2)?,
            expires_at: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;

    let mut result = Vec::new();
    for entry in entries {
        result.push(entry?);
    }

    Ok(result)
}

pub fn get_cache_count(conn: &Connection) -> Result<i32> {
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM request_cache"
    )?;

    let count = stmt.query_row([], |row| {
        row.get(0)
    })?;

    Ok(count)
}

pub fn get_expired_cache_count(conn: &Connection) -> Result<i32> {
    let now = Local::now().naive_local();
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM request_cache WHERE expires_at <= ?1"
    )?;

    let count = stmt.query_row(params![now], |row| {
        row.get(0)
    })?;

    Ok(count)
}

pub fn clear_all_cache(conn: &Connection) -> Result<usize> {
    let rows_affected = conn.execute(
        "DELETE FROM request_cache",
        [],
    )?;

    Ok(rows_affected)
} 