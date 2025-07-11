//! Notes commands
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use crate::database::models::Note;
use crate::database::operations;
use chrono::TimeZone;

#[derive(Debug, Serialize)]
pub struct NoteResponse {
    pub id: String,
    pub title: String,
    pub content: String,
    pub folder_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Note> for NoteResponse {
    fn from(note: Note) -> Self {
        Self {
            id: note.id.to_string(),
            title: note.title,
            content: note.content,
            folder_id: note.folder_id.map(|id| id.to_string()),
            created_at: note.created_at.to_string(),
            updated_at: note.updated_at.to_string(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateNoteRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub folder_id: Option<Option<i32>>,
}

#[command]
pub async fn get_notes(
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<Vec<NoteResponse>, String> {
    let db_manager_clone = db_manager.inner().clone();
    let notes = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::note_operations::get_all_notes(&conn).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(notes.into_iter().map(NoteResponse::from).collect())
}

#[command]
pub async fn create_note(
    title: String,
    content: String,
    folder_id: Option<i32>,
    user_id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<NoteResponse, String> {
    let db_manager_clone = db_manager.inner().clone();
    let created_note = tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::note_operations::create_note(&conn, &title, &content, &user_id, folder_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(NoteResponse::from(created_note))
}

#[command]
pub async fn update_note(
    id: String,
    note: UpdateNoteRequest,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<NoteResponse, String> {
    let note_id = id.parse().map_err(|_| "Invalid note ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();
    let updated_note = tokio::task::spawn_blocking(move || {
        let mut conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::note_operations::update_note(&mut conn, note_id, note.title.as_deref(), note.content.as_deref(), note.folder_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(NoteResponse::from(updated_note))
}

#[command]
pub async fn delete_note(
    id: String,
    db_manager: State<'_, crate::database::DatabaseManager>,
) -> Result<(), String> {
    let note_id = id.parse().map_err(|_| "Invalid note ID".to_string())?;
    let db_manager_clone = db_manager.inner().clone();
    tokio::task::spawn_blocking(move || {
        let conn = db_manager_clone.get_connection().map_err(|e| e.to_string())?;
        operations::note_operations::delete_note(&conn, note_id).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e)?;

    Ok(())
} 