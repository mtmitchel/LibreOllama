use crate::utils::http::fetch_image_as_base64;

#[tauri::command]
pub async fn proxy_google_image(url: String) -> Result<String, String> {
    fetch_image_as_base64(&url)
        .await
        .map_err(|e| e.to_string())
} 