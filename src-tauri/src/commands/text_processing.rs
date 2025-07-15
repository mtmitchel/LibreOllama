use strip_markdown::strip_markdown;

#[tauri::command]
pub fn clean_text(text: String) -> String {
    strip_markdown(&text)
} 