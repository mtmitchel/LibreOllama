//! Folder-related database operations
//!
//! This module provides CRUD operations for folders.

use anyhow::Result;
use rusqlite::{Connection, params, OptionalExtension};
use crate::database::models::Folder;
use chrono::Local;

// Folder Operations
pub fn create_folder(
    conn: &Connection,
    folder_name: &str,
    parent_id: Option<i32>,
    user_id: &str,
    color: Option<&str>,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO folders (folder_name, parent_id, user_id, color, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            folder_name,
            parent_id,
            user_id,
            color,
            now,
            now
        ],
    )?;

    let folder_id = conn.last_insert_rowid() as i32;
    Ok(folder_id)
}

pub fn get_folder(conn: &Connection, folder_id: i32) -> Result<Option<Folder>> {
    let mut stmt = conn.prepare(
        "SELECT id, folder_name, parent_id, user_id, color, created_at, updated_at 
         FROM folders WHERE id = ?1"
    )?;

    let folder = stmt.query_row(params![folder_id], |row| {
        Ok(Folder {
            id: row.get(0)?,
            folder_name: row.get(1)?,
            parent_id: row.get(2)?,
            user_id: row.get(3)?,
            color: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    }).optional()?;

    Ok(folder)
}

pub fn get_folders_by_user(conn: &Connection, user_id: &str) -> Result<Vec<Folder>> {
    let mut stmt = conn.prepare(
        "SELECT id, folder_name, parent_id, user_id, color, created_at, updated_at 
         FROM folders WHERE user_id = ?1 ORDER BY folder_name ASC"
    )?;

    let folders = stmt.query_map(params![user_id], |row| {
        Ok(Folder {
            id: row.get(0)?,
            folder_name: row.get(1)?,
            parent_id: row.get(2)?,
            user_id: row.get(3)?,
            color: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for folder in folders {
        result.push(folder?);
    }

    Ok(result)
}

pub fn get_root_folders_by_user(conn: &Connection, user_id: &str) -> Result<Vec<Folder>> {
    let mut stmt = conn.prepare(
        "SELECT id, folder_name, parent_id, user_id, color, created_at, updated_at 
         FROM folders WHERE user_id = ?1 AND parent_id IS NULL ORDER BY folder_name ASC"
    )?;

    let folders = stmt.query_map(params![user_id], |row| {
        Ok(Folder {
            id: row.get(0)?,
            folder_name: row.get(1)?,
            parent_id: row.get(2)?,
            user_id: row.get(3)?,
            color: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for folder in folders {
        result.push(folder?);
    }

    Ok(result)
}

pub fn get_subfolders(conn: &Connection, parent_id: i32) -> Result<Vec<Folder>> {
    let mut stmt = conn.prepare(
        "SELECT id, folder_name, parent_id, user_id, color, created_at, updated_at 
         FROM folders WHERE parent_id = ?1 ORDER BY folder_name ASC"
    )?;

    let folders = stmt.query_map(params![parent_id], |row| {
        Ok(Folder {
            id: row.get(0)?,
            folder_name: row.get(1)?,
            parent_id: row.get(2)?,
            user_id: row.get(3)?,
            color: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for folder in folders {
        result.push(folder?);
    }

    Ok(result)
}

pub fn update_folder(
    conn: &Connection,
    folder_id: i32,
    folder_name: &str,
    parent_id: Option<i32>,
    color: Option<&str>,
) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE folders SET folder_name = ?1, parent_id = ?2, color = ?3, updated_at = ?4 WHERE id = ?5",
        params![folder_name, parent_id, color, now, folder_id],
    )?;

    Ok(())
}

pub fn move_folder(conn: &Connection, folder_id: i32, new_parent_id: Option<i32>) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE folders SET parent_id = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_parent_id, now, folder_id],
    )?;

    Ok(())
}

pub fn delete_folder(conn: &Connection, folder_id: i32) -> Result<()> {
    // First, recursively delete all subfolders
    let subfolders = get_subfolders(conn, folder_id)?;
    for subfolder in subfolders {
        delete_folder(conn, subfolder.id)?;
    }

    // Then delete the folder itself
    conn.execute(
        "DELETE FROM folders WHERE id = ?1",
        params![folder_id],
    )?;

    Ok(())
}

pub fn get_folder_hierarchy(conn: &Connection, user_id: &str) -> Result<Vec<Folder>> {
    let mut stmt = conn.prepare(
        "WITH RECURSIVE folder_hierarchy AS (
            SELECT id, folder_name, parent_id, user_id, color, created_at, updated_at, 0 as level
            FROM folders 
            WHERE user_id = ?1 AND parent_id IS NULL
            
            UNION ALL
            
            SELECT f.id, f.folder_name, f.parent_id, f.user_id, f.color, f.created_at, f.updated_at, fh.level + 1
            FROM folders f
            JOIN folder_hierarchy fh ON f.parent_id = fh.id
        )
        SELECT id, folder_name, parent_id, user_id, color, created_at, updated_at
        FROM folder_hierarchy 
        ORDER BY level, folder_name"
    )?;

    let folders = stmt.query_map(params![user_id], |row| {
        Ok(Folder {
            id: row.get(0)?,
            folder_name: row.get(1)?,
            parent_id: row.get(2)?,
            user_id: row.get(3)?,
            color: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for folder in folders {
        result.push(folder?);
    }

    Ok(result)
}

pub fn get_folder_path(conn: &Connection, folder_id: i32) -> Result<Vec<String>> {
    let mut path = Vec::new();
    let mut current_id = Some(folder_id);

    while let Some(id) = current_id {
        let mut stmt = conn.prepare(
            "SELECT folder_name, parent_id FROM folders WHERE id = ?1"
        )?;

        let (folder_name, parent_id): (String, Option<i32>) = stmt.query_row(params![id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?;

        path.insert(0, folder_name);
        current_id = parent_id;
    }

    Ok(path)
} 