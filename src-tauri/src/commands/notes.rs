//! Note management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting notes
//! in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::{command, State};
use crate::database::models::Note;
use crate::database::operations;
use chrono::TimeZone;

/// Request structure for creating a new note
#[derive(Debug, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    pub user_id: String,
    pub tags: Vec<String>,
}

/// Request structure for updating a note
#[derive(Debug, Deserialize)]
pub struct UpdateNoteRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub tags: Option<Vec<String>>,
}

/// Response structure for note operations
#[derive(Debug, Serialize)]
pub struct NoteResponse {
    pub id: String,
    pub title: String,
    pub content: String,
    pub user_id: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Note> for NoteResponse {
    fn from(note: Note) -> Self {
        Self {
            id: note.id.to_string(),
            title: note.title,
            content: note.content,
            user_id: note.user_id,
            tags: note.tags,
            created_at: chrono::Utc.from_utc_datetime(&note.created_at).to_rfc3339(),
            updated_at: chrono::Utc.from_utc_datetime(&note.updated_at).to_rfc3339(),
        }
    }
}

/// Create a new note
#[command]
pub async fn create_note(
    note: CreateNoteRequest,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<NoteResponse, String> {
    let db_manager_clone = db_manager.inner().clone();
    let note_title = note.title.clone();
    let note_content = note.content.clone();
    let note_user_id = note.user_id.clone();
    let note_tags = note.tags.clone();
    
    let created_note_id = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::note_operations::create_note(
            &conn,
            &note.title,
            &note.content,
            &note.user_id,
            note.tags,
        )
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;
    
    let new_note = Note {
        id: created_note_id,
        title: note_title,
        content: note_content,
        user_id: note_user_id,
        tags: note_tags,
        created_at: chrono::Local::now().naive_local(),
        updated_at: chrono::Local::now().naive_local(),
    };

    Ok(NoteResponse::from(new_note))
}

/// Get all notes for a user
#[command]
pub async fn get_notes(
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<NoteResponse>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let notes = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::note_operations::get_notes_by_user(&conn, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(notes.into_iter().map(NoteResponse::from).collect())
}

/// Get a specific note by ID
#[command]
pub async fn get_note(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Option<NoteResponse>, String> {
    let note_id = id.parse().map_err(|_| "Invalid note ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();
    
    let note = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::note_operations::get_note(&conn, note_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(note.map(NoteResponse::from))
}

/// Update an existing note
#[command]
pub async fn update_note(
    id: String,
    note_update: UpdateNoteRequest,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<NoteResponse, String> {
    let note_id = id.parse().map_err(|_| "Invalid note ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    let mut existing_note = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::note_operations::get_note(&conn, note_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?
    .ok_or_else(|| "Note not found".to_string())?;

    if let Some(title) = note_update.title { existing_note.title = title; }
    if let Some(content) = note_update.content { existing_note.content = content; }
    if let Some(tags) = note_update.tags { existing_note.tags = tags; }
    existing_note.updated_at = chrono::Local::now().naive_local();

    let note_id = existing_note.id;
    let note_title = existing_note.title.clone();
    let note_content = existing_note.content.clone();
    let note_tags = existing_note.tags.clone();
    
    let db_manager_clone_update = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone_update.get_connection()?;
        operations::note_operations::update_note(&conn, note_id, &note_title, &note_content, note_tags)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(NoteResponse::from(existing_note))
}

/// Delete a note
#[command]
pub async fn delete_note(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let note_id = id.parse().map_err(|_| "Invalid note ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();

    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::note_operations::delete_note(&conn, note_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(())
}

/// Search notes by content or title
#[command]
pub async fn search_notes(
    query: String,
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<NoteResponse>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let notes = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection()?;
        operations::note_operations::search_notes(&conn, &query, &user_id)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e: anyhow::Error| e.to_string())?;

    Ok(notes.into_iter().map(NoteResponse::from).collect())
} 