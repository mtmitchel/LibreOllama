//! Notes management commands for Tauri
//!
//! This module provides commands for creating, reading, updating, and deleting notes
//! in the LibreOllama application.

use serde::{Deserialize, Serialize};
use tauri::command;
use crate::database::{models::Note, operations};

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
        let tags = note.tags.and_then(|t| {
            if t.is_empty() {
                None
            } else {
                serde_json::from_str::<Vec<String>>(&t).ok()
            }
        });

        Self {
            id: note.id,
            title: note.title,
            content: note.content,
            tags,
            folder_id: note.folder_id,
            user_id: note.user_id,
            created_at: note.created_at.to_rfc3339(),
            updated_at: note.updated_at.to_rfc3339(),
        }
    }
}

/// Create a new note
#[command]
pub async fn create_note(note: CreateNoteRequest) -> Result<NoteResponse, String> {
    let mut new_note = Note::new(
        note.title,
        note.content,
        note.user_id,
        note.folder_id,
    );

    // Serialize tags if provided
    if let Some(tags) = note.tags {
        new_note.tags = Some(serde_json::to_string(&tags)
            .map_err(|e| format!("Failed to serialize tags: {}", e))?);
    }

    operations::create_note(&new_note)
        .map_err(|e| format!("Failed to create note: {}", e))?;

    Ok(NoteResponse::from(new_note))
}

/// Get all notes for a user
#[command]
pub async fn get_notes(user_id: String) -> Result<Vec<NoteResponse>, String> {
    let notes = operations::get_notes(&user_id)
        .map_err(|e| format!("Failed to get notes: {}", e))?;

    Ok(notes.into_iter().map(NoteResponse::from).collect())
}

/// Update an existing note
#[command]
pub async fn update_note(id: String, note: UpdateNoteRequest) -> Result<NoteResponse, String> {
    let mut existing_note = operations::get_note_by_id(&id)
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
        existing_note.tags = Some(serde_json::to_string(&tags)
            .map_err(|e| format!("Failed to serialize tags: {}", e))?);
    }
    if let Some(folder_id) = note.folder_id {
        existing_note.folder_id = Some(folder_id);
    }

    existing_note.touch();

    operations::update_note(&existing_note)
        .map_err(|e| format!("Failed to update note: {}", e))?;

    Ok(NoteResponse::from(existing_note))
}

/// Delete a note
#[command]
pub async fn delete_note(id: String) -> Result<(), String> {
    operations::delete_note(&id)
        .map_err(|e| format!("Failed to delete note: {}", e))?;

    Ok(())
}