//! Notes management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting notes
//! in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::command;
use crate::database::models::Note; // Adjusted import
// Using database operations
use chrono::TimeZone; // Added for NaiveDateTime to DateTime<Utc> conversion

/// Request structure for creating a new note
#[derive(Debug, Deserialize)]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    pub tags: Option<Vec<String>>,
    pub folder_id: Option<String>,
    pub user_id: String,
}

/// Request structure for updating a note
#[derive(Debug, Deserialize)]
pub struct UpdateNoteRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub tags: Option<Vec<String>>,
    pub folder_id: Option<String>,
}

/// Response structure for note operations
#[derive(Debug, Serialize)]
pub struct NoteResponse {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Option<Vec<String>>,
    pub folder_id: Option<String>,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Note> for NoteResponse {
    fn from(note: Note) -> Self {
        Self {
            id: note.id.to_string(), // Convert i32 to String
            title: note.title,
            content: note.content,
            tags: Some(note.tags.clone()),
            folder_id: None, // folder_id doesn't exist in Note model
            user_id: note.user_id,
            created_at: chrono::Utc.from_utc_datetime(&note.created_at).to_rfc3339(),
            updated_at: chrono::Utc.from_utc_datetime(&note.updated_at).to_rfc3339(),
        }
    }
}

/// Create a new note
#[command]
pub async fn create_note(note: CreateNoteRequest) -> Result<NoteResponse, String> {
    let new_note = Note {
        id: 0, // Will be set by database
        title: note.title,
        content: note.content,
        user_id: note.user_id,
        tags: note.tags.unwrap_or_default(),
        created_at: chrono::Local::now().naive_local(),
        updated_at: chrono::Local::now().naive_local(),
    };



    crate::database::create_note(&new_note)
        .await
        .map_err(|e| format!("Failed to create note: {}", e))?;

    Ok(NoteResponse::from(new_note))
}

/// Get all notes for a user
#[command]
pub async fn get_notes(user_id: String) -> Result<Vec<NoteResponse>, String> {
    let notes = crate::database::get_notes(&user_id)
        .await
        .map_err(|e| format!("Failed to get notes: {}", e))?;

    Ok(notes.into_iter().map(NoteResponse::from).collect())
}

/// Update an existing note
#[command]
pub async fn update_note(id: String, note: UpdateNoteRequest) -> Result<NoteResponse, String> {
    let mut existing_note = crate::database::get_note_by_id(id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to get note: {}", e))?
        .ok_or_else(|| "Note not found".to_string())?;

    // Update fields if provided
    if let Some(title) = note.title {
        existing_note.title = title;
    }
    if let Some(content) = note.content {
        existing_note.content = content;
    }
    if let Some(tags) = note.tags {
        existing_note.tags = tags;
    }

    existing_note.updated_at = chrono::Local::now().naive_local(); // Update timestamp

    crate::database::update_note(&existing_note)
        .await
        .map_err(|e| format!("Failed to update note: {}", e))?;

    Ok(NoteResponse::from(existing_note))
}

/// Delete a note
#[command]
pub async fn delete_note(id: String) -> Result<(), String> {
    crate::database::delete_note(id.parse().unwrap_or_default()) // Parse String to i32
        .await
        .map_err(|e| format!("Failed to delete note: {}", e))?;

    Ok(())
}