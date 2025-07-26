//! Simple task metadata commands that work with the frontend's local storage approach
use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMetadata {
    pub labels: Vec<String>,
    pub priority: String,
    pub subtasks: Vec<Subtask>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subtask {
    pub id: String,
    pub title: String,
    pub completed: bool,
}

// Simple in-memory storage for development
pub type MetadataStore = Mutex<HashMap<String, TaskMetadata>>;

#[tauri::command]
pub async fn get_task_metadata(
    google_task_id: String,
    store: State<'_, MetadataStore>,
) -> Result<Option<TaskMetadata>, String> {
    let store = store.lock().map_err(|e| e.to_string())?;
    Ok(store.get(&google_task_id).cloned())
}

#[tauri::command]
pub async fn set_task_metadata(
    google_task_id: String,
    metadata: TaskMetadata,
    store: State<'_, MetadataStore>,
) -> Result<(), String> {
    let mut store = store.lock().map_err(|e| e.to_string())?;
    store.insert(google_task_id, metadata);
    Ok(())
}

#[tauri::command]
pub async fn delete_task_metadata(
    google_task_id: String,
    store: State<'_, MetadataStore>,
) -> Result<(), String> {
    let mut store = store.lock().map_err(|e| e.to_string())?;
    store.remove(&google_task_id);
    Ok(())
}

#[tauri::command]
pub async fn get_all_labels(
    store: State<'_, MetadataStore>,
) -> Result<Vec<String>, String> {
    let store = store.lock().map_err(|e| e.to_string())?;
    let mut all_labels = std::collections::HashSet::new();
    
    for metadata in store.values() {
        for label in &metadata.labels {
            all_labels.insert(label.clone());
        }
    }
    
    let mut labels: Vec<String> = all_labels.into_iter().collect();
    labels.sort();
    Ok(labels)
}