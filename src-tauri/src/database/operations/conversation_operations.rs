//! Conversation context-related database operations
//!
//! This module provides CRUD operations for conversation contexts.

use anyhow::Result;
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::ConversationContext;

// ===== Conversation Context Operations =====

// Conversation Context Operations

pub fn create_conversation_context(
    conn: &Connection,
    context_name: &str,
    context_data: &str,
    context_window_size: i32,
    context_summary: Option<&str>,
) -> Result<i32> {
    conn.execute(
        "INSERT INTO conversation_contexts (context_name, context_data, context_window_size, context_summary) 
         VALUES (?1, ?2, ?3, ?4)",
        params![
            context_name,
            context_data,
            context_window_size,
            context_summary
        ],
    )?;

    let context_id = conn.last_insert_rowid() as i32;
    Ok(context_id)
}

pub fn get_conversation_context(conn: &Connection, context_id: i32) -> Result<Option<ConversationContext>> {
    let mut stmt = conn.prepare(
        "SELECT id, context_name, context_data, context_window_size, context_summary 
         FROM conversation_contexts WHERE id = ?1"
    )?;

    let context = stmt.query_row(params![context_id], |row| {
        Ok(ConversationContext {
            id: row.get(0)?,
            context_name: row.get(1)?,
            context_data: row.get(2)?,
            context_window_size: row.get(3)?,
            context_summary: row.get(4)?,
        })
    }).optional()?;

    Ok(context)
}

pub fn get_conversation_context_by_name(conn: &Connection, context_name: &str) -> Result<Option<ConversationContext>> {
    let mut stmt = conn.prepare(
        "SELECT id, context_name, context_data, context_window_size, context_summary 
         FROM conversation_contexts WHERE context_name = ?1"
    )?;

    let context = stmt.query_row(params![context_name], |row| {
        Ok(ConversationContext {
            id: row.get(0)?,
            context_name: row.get(1)?,
            context_data: row.get(2)?,
            context_window_size: row.get(3)?,
            context_summary: row.get(4)?,
        })
    }).optional()?;

    Ok(context)
}

pub fn get_all_conversation_contexts(conn: &Connection) -> Result<Vec<ConversationContext>> {
    let mut stmt = conn.prepare(
        "SELECT id, context_name, context_data, context_window_size, context_summary 
         FROM conversation_contexts ORDER BY context_name ASC"
    )?;

    let contexts = stmt.query_map([], |row| {
        Ok(ConversationContext {
            id: row.get(0)?,
            context_name: row.get(1)?,
            context_data: row.get(2)?,
            context_window_size: row.get(3)?,
            context_summary: row.get(4)?,
        })
    })?;

    let mut result = Vec::new();
    for context in contexts {
        result.push(context?);
    }

    Ok(result)
}

pub fn update_conversation_context(
    conn: &Connection,
    context_id: i32,
    context_data: &str,
    context_window_size: i32,
    context_summary: Option<&str>,
) -> Result<()> {
    conn.execute(
        "UPDATE conversation_contexts SET context_data = ?1, context_window_size = ?2, context_summary = ?3 WHERE id = ?4",
        params![context_data, context_window_size, context_summary, context_id],
    )?;

    Ok(())
}

pub fn update_conversation_context_data(conn: &Connection, context_id: i32, context_data: &str) -> Result<()> {
    conn.execute(
        "UPDATE conversation_contexts SET context_data = ?1 WHERE id = ?2",
        params![context_data, context_id],
    )?;

    Ok(())
}

pub fn update_conversation_context_summary(conn: &Connection, context_id: i32, context_summary: &str) -> Result<()> {
    conn.execute(
        "UPDATE conversation_contexts SET context_summary = ?1 WHERE id = ?2",
        params![context_summary, context_id],
    )?;

    Ok(())
}

pub fn delete_conversation_context(conn: &Connection, context_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM conversation_contexts WHERE id = ?1",
        params![context_id],
    )?;

    Ok(())
}

pub fn delete_conversation_context_by_name(conn: &Connection, context_name: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM conversation_contexts WHERE context_name = ?1",
        params![context_name],
    )?;

    Ok(())
}

pub fn get_conversation_contexts_by_window_size(conn: &Connection, min_size: i32, max_size: i32) -> Result<Vec<ConversationContext>> {
    let mut stmt = conn.prepare(
        "SELECT id, context_name, context_data, context_window_size, context_summary 
         FROM conversation_contexts WHERE context_window_size >= ?1 AND context_window_size <= ?2 ORDER BY context_window_size ASC"
    )?;

    let contexts = stmt.query_map(params![min_size, max_size], |row| {
        Ok(ConversationContext {
            id: row.get(0)?,
            context_name: row.get(1)?,
            context_data: row.get(2)?,
            context_window_size: row.get(3)?,
            context_summary: row.get(4)?,
        })
    })?;

    let mut result = Vec::new();
    for context in contexts {
        result.push(context?);
    }

    Ok(result)
}

pub fn search_conversation_contexts(conn: &Connection, query: &str) -> Result<Vec<ConversationContext>> {
    let mut stmt = conn.prepare(
        "SELECT id, context_name, context_data, context_window_size, context_summary 
         FROM conversation_contexts WHERE context_name LIKE ?1 OR context_summary LIKE ?1 ORDER BY context_name ASC"
    )?;

    let search_pattern = format!("%{}%", query);
    let contexts = stmt.query_map(params![search_pattern], |row| {
        Ok(ConversationContext {
            id: row.get(0)?,
            context_name: row.get(1)?,
            context_data: row.get(2)?,
            context_window_size: row.get(3)?,
            context_summary: row.get(4)?,
        })
    })?;

    let mut result = Vec::new();
    for context in contexts {
        result.push(context?);
    }

    Ok(result)
} 