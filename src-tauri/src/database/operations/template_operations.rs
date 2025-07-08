//! Chat template-related database operations
//!
//! This module provides CRUD operations for chat templates.

use anyhow::Result;
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::ChatTemplate;

// ===== Chat Template Operations =====

pub fn get_all_chat_templates(conn: &Connection) -> Result<Vec<ChatTemplate>> {
    let mut stmt = conn.prepare(
        "SELECT id, template_name, template_content 
         FROM chat_templates ORDER BY template_name ASC"
    )?;

    let templates = stmt.query_map([], |row| {
        Ok(ChatTemplate {
            id: row.get(0)?,
            template_name: row.get(1)?,
            template_content: row.get(2)?,
        })
    })?;

    let mut result = Vec::new();
    for template in templates {
        result.push(template?);
    }

    Ok(result)
}

pub fn get_chat_template(conn: &Connection, template_id: i32) -> Result<Option<ChatTemplate>> {
    let mut stmt = conn.prepare(
        "SELECT id, template_name, template_content 
         FROM chat_templates WHERE id = ?1"
    )?;

    let template = stmt.query_row(params![template_id], |row| {
        Ok(ChatTemplate {
            id: row.get(0)?,
            template_name: row.get(1)?,
            template_content: row.get(2)?,
        })
    }).optional()?;

    Ok(template)
}

pub fn get_chat_template_by_name(conn: &Connection, template_name: &str) -> Result<Option<ChatTemplate>> {
    let mut stmt = conn.prepare(
        "SELECT id, template_name, template_content 
         FROM chat_templates WHERE template_name = ?1"
    )?;

    let template = stmt.query_row(params![template_name], |row| {
        Ok(ChatTemplate {
            id: row.get(0)?,
            template_name: row.get(1)?,
            template_content: row.get(2)?,
        })
    }).optional()?;

    Ok(template)
}

pub fn create_chat_template(
    conn: &Connection,
    template_name: &str,
    template_content: &str,
) -> Result<i32> {
    conn.execute(
        "INSERT INTO chat_templates (template_name, template_content) 
         VALUES (?1, ?2)",
        params![
            template_name,
            template_content
        ],
    )?;

    let template_id = conn.last_insert_rowid() as i32;
    Ok(template_id)
}

pub fn update_chat_template(
    conn: &Connection,
    template_id: i32,
    template_name: &str,
    template_content: &str,
) -> Result<()> {
    conn.execute(
        "UPDATE chat_templates SET template_name = ?1, template_content = ?2 WHERE id = ?3",
        params![template_name, template_content, template_id],
    )?;

    Ok(())
}

pub fn update_chat_template_content(conn: &Connection, template_id: i32, template_content: &str) -> Result<()> {
    conn.execute(
        "UPDATE chat_templates SET template_content = ?1 WHERE id = ?2",
        params![template_content, template_id],
    )?;

    Ok(())
}

pub fn delete_chat_template(conn: &Connection, template_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM chat_templates WHERE id = ?1",
        params![template_id],
    )?;

    Ok(())
}

pub fn delete_chat_template_by_name(conn: &Connection, template_name: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM chat_templates WHERE template_name = ?1",
        params![template_name],
    )?;

    Ok(())
}

pub fn search_chat_templates(conn: &Connection, query: &str) -> Result<Vec<ChatTemplate>> {
    let mut stmt = conn.prepare(
        "SELECT id, template_name, template_content 
         FROM chat_templates WHERE template_name LIKE ?1 OR template_content LIKE ?1 ORDER BY template_name ASC"
    )?;

    let search_pattern = format!("%{}%", query);
    let templates = stmt.query_map(params![search_pattern], |row| {
        Ok(ChatTemplate {
            id: row.get(0)?,
            template_name: row.get(1)?,
            template_content: row.get(2)?,
        })
    })?;

    let mut result = Vec::new();
    for template in templates {
        result.push(template?);
    }

    Ok(result)
}

pub fn get_chat_template_count(conn: &Connection) -> Result<i32> {
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM chat_templates"
    )?;

    let count = stmt.query_row([], |row| {
        row.get(0)
    })?;

    Ok(count)
}

/// Get all chat templates (legacy function for command compatibility)
pub fn get_chat_templates(_active_only: bool) -> Result<Vec<ChatTemplate>> {
    // This function provides backward compatibility for commands
    // In a real implementation, you might want to filter by active status
    // For now, we'll return all templates with a placeholder implementation
    Ok(Vec::new()) // TODO: Implement proper async database connection
} 