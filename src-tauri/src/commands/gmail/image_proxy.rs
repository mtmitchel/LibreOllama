use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use reqwest;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProxyImageResponse {
    pub data: String,  // Base64 encoded image data
    pub content_type: String,
}

#[tauri::command]
pub async fn proxy_image(url: String) -> Result<ProxyImageResponse, String> {
    // Validate URL
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Invalid URL scheme".to_string());
    }

    // Create HTTP client with browser-like settings
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .danger_accept_invalid_certs(true) // For self-signed certs
        // Use a real browser user agent to avoid being blocked
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Extract domain from URL for Referer spoofing
    let referer = if let Ok(parsed_url) = reqwest::Url::parse(&url) {
        if let Some(host) = parsed_url.host_str() {
            // For CDN URLs, try to guess the original domain
            if host.contains("cloudfront") || host.contains("amazonaws") || host.contains("d1zi9vf8w50o75") {
                // This specific CDN is used by Instacart
                "https://www.instacart.com/".to_string()
            } else if host.contains("fbcdn") {
                "https://www.facebook.com/".to_string()
            } else if host.contains("twimg") {
                "https://twitter.com/".to_string()
            } else if host.contains("googleusercontent") {
                "https://mail.google.com/".to_string()
            } else {
                // Default to the image's own domain
                format!("{}://{}/", parsed_url.scheme(), host)
            }
        } else {
            "https://mail.google.com/".to_string()
        }
    } else {
        "https://mail.google.com/".to_string()
    };

    // Fetch the image with browser-like headers and Referer spoofing
    // Note: We don't send Sec-* headers as they can flag us as a browser in CORS mode
    let response = client
        .get(&url)
        .header("Accept", "image/webp,image/apng,image/*,*/*;q=0.8")
        .header("Accept-Language", "en-US,en;q=0.9")
        .header("Accept-Encoding", "gzip, deflate, br")
        .header("Referer", referer.clone())
        .header("Origin", referer)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch image: {}", e))?;

    // Check status
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    // Get content type
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("image/png")
        .to_string();

    // Validate it's an image (be more permissive)
    if !content_type.starts_with("image/") && !content_type.starts_with("application/octet-stream") {
        // Some servers return application/octet-stream for images
        return Err(format!("Not an image: {}", content_type));
    }
    
    // If content type is octet-stream, try to guess from URL
    let final_content_type = if content_type == "application/octet-stream" {
        if url.ends_with(".png") { "image/png" }
        else if url.ends_with(".jpg") || url.ends_with(".jpeg") { "image/jpeg" }
        else if url.ends_with(".gif") { "image/gif" }
        else if url.ends_with(".webp") { "image/webp" }
        else if url.ends_with(".svg") { "image/svg+xml" }
        else { &content_type }
    } else {
        &content_type
    }.to_string();

    // Get the image bytes
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read image bytes: {}", e))?;

    // Limit size to 10MB (hero images can be large)
    if bytes.len() > 10 * 1024 * 1024 {
        return Err(format!("Image too large (>10MB): {} bytes", bytes.len()));
    }

    // Encode to base64
    let base64_data = BASE64.encode(&bytes);

    Ok(ProxyImageResponse {
        data: base64_data,
        content_type: final_content_type,
    })
}

// Cache for proxied images to avoid repeated fetches
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;

lazy_static::lazy_static! {
    static ref IMAGE_CACHE: Arc<RwLock<HashMap<String, ProxyImageResponse>>> = 
        Arc::new(RwLock::new(HashMap::new()));
}

#[tauri::command]
pub async fn proxy_image_cached(url: String) -> Result<ProxyImageResponse, String> {
    // Check cache first
    {
        let cache = IMAGE_CACHE.read().await;
        if let Some(cached) = cache.get(&url) {
            return Ok(cached.clone());
        }
    }

    // Fetch image
    let response = proxy_image(url.clone()).await?;

    // Store in cache
    {
        let mut cache = IMAGE_CACHE.write().await;
        cache.insert(url, response.clone());
        
        // Limit cache size to 100 images
        if cache.len() > 100 {
            // Remove oldest entries (simple FIFO)
            let keys: Vec<String> = cache.keys().take(20).cloned().collect();
            for key in keys {
                cache.remove(&key);
            }
        }
    }

    Ok(response)
}

#[tauri::command]
pub fn clear_image_proxy_cache() -> Result<(), String> {
    tokio::spawn(async {
        let mut cache = IMAGE_CACHE.write().await;
        cache.clear();
    });
    Ok(())
}