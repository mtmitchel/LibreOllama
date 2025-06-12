use tauri::command;
use std::fs;

#[command]
pub async fn save_canvas_data(data: String, filename: String) -> Result<(), String> {
    fs::write(filename, data).map_err(|e| e.to_string())
}

#[command]
pub async fn load_canvas_data(filename: String) -> Result<String, String> {
    fs::read_to_string(filename).map_err(|e| e.to_string())
}
