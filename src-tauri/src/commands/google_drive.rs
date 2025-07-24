use reqwest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageQuota {
    pub limit: Option<String>,
    pub usage: Option<String>,
    #[serde(rename = "usageInDrive")]
    pub usage_in_drive: Option<String>,
    #[serde(rename = "usageInDriveTrash")]
    pub usage_in_drive_trash: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DriveAboutResponse {
    #[serde(rename = "storageQuota")]
    pub storage_quota: Option<StorageQuota>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuotaInfo {
    pub used: u64,
    pub total: u64,
}

#[tauri::command]
pub async fn get_google_drive_quota(access_token: String) -> Result<QuotaInfo, String> {
    println!("[DEBUG] Fetching Google Drive quota with token");
    println!("[DEBUG] Token length: {}", access_token.len());
    println!("[DEBUG] Token starts with: {}", if access_token.len() > 10 { &access_token[0..10] } else { &access_token });
    
    if access_token.is_empty() {
        eprintln!("[ERROR] Empty access token provided");
        return Err("Empty access token".to_string());
    }
    
    let client = reqwest::Client::new();
    
    let response = client
        .get("https://www.googleapis.com/drive/v3/about")
        .query(&[("fields", "storageQuota(limit,usage,usageInDrive,usageInDriveTrash)")])
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| {
            eprintln!("[ERROR] Failed to send request to Google Drive API: {}", e);
            format!("Network error: {}", e)
        })?;

    if response.status().is_success() {
        let data: DriveAboutResponse = response.json().await.map_err(|e| {
            eprintln!("[ERROR] Failed to parse Google Drive API response: {}", e);
            format!("Failed to parse response: {}", e)
        })?;
        
        if let Some(quota) = data.storage_quota {
            println!("[DEBUG] Received quota data: {:?}", quota);
            
            // Parse usage (this should always be present)
            let used = quota.usage
                .as_ref()
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(0);
            
            // Parse limit (may be None for unlimited/custom quotas)
            let total = quota.limit
                .as_ref()
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(0);
            
            if total == 0 {
                println!("[WARN] No storage limit returned - account may have unlimited or custom quota");
            }
            
            Ok(QuotaInfo { used, total })
        } else {
            eprintln!("[ERROR] No storage quota data in response");
            Err("No storage quota data available".to_string())
        }
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        eprintln!("[ERROR] Google Drive API request failed with status {}: {}", status, error_text);
        
        if status.as_u16() == 401 {
            Err("Authentication failed - token may be expired".to_string())
        } else if status.as_u16() == 403 {
            Err("Access forbidden - check API permissions".to_string())
        } else {
            Err(format!("API request failed with status {}: {}", status, error_text))
        }
    }
}