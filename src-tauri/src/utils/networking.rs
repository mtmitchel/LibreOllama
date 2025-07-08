//! Networking utilities
//!
//! Provides common networking helper functions.

use crate::errors::{LibreOllamaError, Result};

/// Check if a port is available
pub fn is_port_available(port: u16) -> bool {
    std::net::TcpListener::bind(format!("127.0.0.1:{}", port)).is_ok()
}

/// Find an available port in a range
pub fn find_available_port(start: u16, end: u16) -> Option<u16> {
    (start..=end).find(|&port| is_port_available(port))
}

/// Basic HTTP client with timeout
pub async fn http_get_with_timeout(url: &str, timeout_secs: u64) -> Result<String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(timeout_secs))
        .build()
        .map_err(|e| LibreOllamaError::Network {
            message: format!("Failed to create HTTP client: {}", e),
            url: None,
        })?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| LibreOllamaError::Network {
            message: format!("HTTP request failed: {}", e),
            url: Some(url.to_string()),
        })?;

    if !response.status().is_success() {
        return Err(LibreOllamaError::Network {
            message: format!("HTTP request failed with status: {}", response.status()),
            url: Some(url.to_string()),
        });
    }

    response.text().await.map_err(|e| LibreOllamaError::Network {
        message: format!("Failed to read response body: {}", e),
        url: Some(url.to_string()),
    })
} 