//! Note-related database operations
//!
//! This module provides CRUD operations for notes.

use rusqlite::{Connection, Result, params};
use crate::database::models::Note;
use chrono::Local;

pub fn get_note(conn: &Connection, id: i32) -> Result<Option<Note>> {
    let mut stmt = conn.prepare("SELECT id, title, content, user_id, folder_id, created_at, updated_at FROM notes WHERE id = ?1")?;
    let note_iter = stmt.query_map(params![id], |row| {
        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            user_id: row.get(3)?,
            folder_id: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    if let Some(note_result) = note_iter.last() {
        note_result.map(Some)
    } else {
        Ok(None)
    }
}


pub fn create_note(conn: &Connection, title: &str, content: &str, user_id: &str, folder_id: Option<i32>) -> Result<Note> {
    let now = Local::now().naive_local();
    conn.execute(
        "INSERT INTO notes (title, content, user_id, folder_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![title, content, user_id, folder_id, now, now],
    )?;
    let note_id = conn.last_insert_rowid() as i32;
    get_note(conn, note_id).and_then(|n| n.ok_or_else(|| rusqlite::Error::QueryReturnedNoRows))
}

pub fn update_note(conn: &mut Connection, id: i32, title: Option<&str>, content: Option<&str>, folder_id: Option<Option<i32>>) -> Result<Note> {
    let tx = conn.transaction()?;
    let mut updated = false;

    if let Some(t) = title {
        tx.execute("UPDATE notes SET title = ?1 WHERE id = ?2", params![t, id])?;
        updated = true;
    }

    if let Some(c) = content {
        tx.execute("UPDATE notes SET content = ?1 WHERE id = ?2", params![c, id])?;
        updated = true;
    }
    
    if let Some(fid) = folder_id {
        tx.execute("UPDATE notes SET folder_id = ?1 WHERE id = ?2", params![fid, id])?;
        updated = true;
    }

    if updated {
        let now = Local::now().naive_local();
        tx.execute("UPDATE notes SET updated_at = ?1 WHERE id = ?2", params![now, id])?;
    }
    
    tx.commit()?;

    get_note(conn, id).and_then(|n| n.ok_or_else(|| rusqlite::Error::QueryReturnedNoRows))
}

pub fn delete_note(conn: &Connection, id: i32) -> Result<usize> {
    conn.execute("DELETE FROM notes WHERE id = ?1", params![id])
}

pub fn get_all_notes(conn: &Connection) -> Result<Vec<Note>> {
    let mut stmt = conn.prepare("SELECT id, title, content, user_id, folder_id, created_at, updated_at FROM notes")?;
    let note_iter = stmt.query_map([], |row| {
        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            user_id: row.get(3)?,
            folder_id: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut notes = Vec::new();
    for note in note_iter {
        notes.push(note?);
    }
    Ok(notes)
} 