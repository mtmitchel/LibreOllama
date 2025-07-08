//! Note-related database operations
//!
//! This module provides CRUD operations for notes.

use anyhow::Result;
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::Note;
use chrono::Local;
use serde_json;

// ===== Note Operations =====

/// Create a new note
pub fn create_note(
    conn: &Connection,
    title: &str,
    content: &str,
    user_id: &str,
    tags: Vec<String>,
) -> Result<i32> {
    let now = Local::now().naive_local();
    let tags_json = serde_json::to_string(&tags)?;

    conn.execute(
        "INSERT INTO notes (title, content, user_id, tags, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            title,
            content,
            user_id,
            tags_json,
            now,
            now
        ],
    )?;

    let note_id = conn.last_insert_rowid() as i32;
    Ok(note_id)
}

pub fn get_note(conn: &Connection, note_id: i32) -> Result<Option<Note>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, user_id, tags, created_at, updated_at 
         FROM notes WHERE id = ?1"
    )?;

    let note = stmt.query_row(params![note_id], |row| {
        let tags_json: String = row.get(4)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            user_id: row.get(3)?,
            tags,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    }).optional()?;

    Ok(note)
}

pub fn get_notes_by_user(conn: &Connection, user_id: &str) -> Result<Vec<Note>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, user_id, tags, created_at, updated_at 
         FROM notes WHERE user_id = ?1 ORDER BY updated_at DESC"
    )?;

    let notes = stmt.query_map(params![user_id], |row| {
        let tags_json: String = row.get(4)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            user_id: row.get(3)?,
            tags,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for note in notes {
        result.push(note?);
    }

    Ok(result)
}

pub fn get_notes_by_tag(conn: &Connection, user_id: &str, tag: &str) -> Result<Vec<Note>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, user_id, tags, created_at, updated_at 
         FROM notes WHERE user_id = ?1 AND tags LIKE ?2 ORDER BY updated_at DESC"
    )?;

    let tag_pattern = format!("%\"{}\"% ", tag);
    let notes = stmt.query_map(params![user_id, tag_pattern], |row| {
        let tags_json: String = row.get(4)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            user_id: row.get(3)?,
            tags,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for note in notes {
        result.push(note?);
    }

    Ok(result)
}

pub fn search_notes(conn: &Connection, user_id: &str, query: &str) -> Result<Vec<Note>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, user_id, tags, created_at, updated_at 
         FROM notes WHERE user_id = ?1 AND (title LIKE ?2 OR content LIKE ?2) ORDER BY updated_at DESC"
    )?;

    let search_pattern = format!("%{}%", query);
    let notes = stmt.query_map(params![user_id, search_pattern], |row| {
        let tags_json: String = row.get(4)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            user_id: row.get(3)?,
            tags,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for note in notes {
        result.push(note?);
    }

    Ok(result)
}

/// Update a note
pub fn update_note(
    conn: &Connection,
    note_id: i32,
    title: &str,
    content: &str,
    tags: Vec<String>,
) -> Result<()> {
    let now = Local::now().naive_local();
    let tags_json = serde_json::to_string(&tags)?;

    conn.execute(
        "UPDATE notes SET title = ?1, content = ?2, tags = ?3, updated_at = ?4 WHERE id = ?5",
        params![title, content, tags_json, now, note_id],
    )?;

    Ok(())
}

pub fn delete_note(conn: &Connection, note_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM notes WHERE id = ?1",
        params![note_id],
    )?;

    Ok(())
}

pub fn get_all_tags_by_user(conn: &Connection, user_id: &str) -> Result<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT DISTINCT tags FROM notes WHERE user_id = ?1"
    )?;

    let tags_results = stmt.query_map(params![user_id], |row| {
        let tags_json: String = row.get(0)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
        Ok(tags)
    })?;

    let mut all_tags: Vec<String> = Vec::new();
    for tags_result in tags_results {
        let tags = tags_result?;
        for tag in tags {
            if !all_tags.contains(&tag) {
                all_tags.push(tag);
            }
        }
    }

    all_tags.sort();
    Ok(all_tags)
}

pub fn get_recent_notes(conn: &Connection, user_id: &str, limit: i32) -> Result<Vec<Note>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, user_id, tags, created_at, updated_at 
         FROM notes WHERE user_id = ?1 ORDER BY updated_at DESC LIMIT ?2"
    )?;

    let notes = stmt.query_map(params![user_id, limit], |row| {
        let tags_json: String = row.get(4)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            user_id: row.get(3)?,
            tags,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for note in notes {
        result.push(note?);
    }

    Ok(result)
}

pub fn get_note_count_by_user(conn: &Connection, user_id: &str) -> Result<i32> {
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM notes WHERE user_id = ?1"
    )?;

    let count = stmt.query_row(params![user_id], |row| {
        row.get(0)
    })?;

    Ok(count)
} 