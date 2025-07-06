// use anyhow::Result as AnyResult; // Will be used when implementing error handling
use serde::{Deserialize, Serialize};
use reqwest;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::process::{Child, Command}; // Removed Stdio - unused
use sysinfo::{System, Pid};
use tauri::{AppHandle, Emitter};
use tokio::time::{sleep, Duration};
use futures_util::StreamExt;
// use bytes::Bytes; // Will be used when implementing streaming

// Global sidecar process management
lazy_static::lazy_static! {
    static ref OLLAMA_PROCESS: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    static ref OLLAMA_PID: Arc<Mutex<Option<u32>>> = Arc::new(Mutex::new(None));
}

// Data structures for Ollama integration
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ModelInfo {
    pub name: String,
    pub size: Option<u64>,
    pub digest: Option<String>,
    pub modified_at: Option<String>,
    pub format: Option<String>,
    pub family: Option<String>,
    pub families: Option<Vec<String>>,
    pub parameter_size: Option<String>,
    pub quantization_level: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OllamaModelsResponse {
    pub models: Vec<ModelInfo>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OllamaGenerateRequest {
    pub model: String,
    pub prompt: String,
    pub stream: bool,
    pub context: Option<Vec<i32>>,
    pub options: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OllamaGenerateResponse {
    pub response: String,
    pub done: bool,
    pub context: Option<Vec<i32>>,
    pub total_duration: Option<u64>,
    pub load_duration: Option<u64>,
    pub prompt_eval_count: Option<u32>,
    pub prompt_eval_duration: Option<u64>,
    pub eval_count: Option<u32>,
    pub eval_duration: Option<u64>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OllamaHealthResponse {
    pub status: String,
    pub message: String,
    pub process_info: Option<ProcessInfo>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProcessInfo {
    pub pid: Option<u32>,
    pub cpu_usage: f32,
    pub memory_usage: u64,
    pub is_sidecar: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PullProgress {
    pub status: String,
    pub digest: Option<String>,
    pub total: Option<u64>,
    pub completed: Option<u64>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ModelDetails {
    pub name: String,
    pub size: u64,
    pub digest: String,
    pub modified_at: String,
    pub modelfile: Option<String>,
    pub template: Option<String>,
    pub details: Option<ModelMetadata>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ModelMetadata {
    pub format: String,
    pub family: String,
    pub families: Vec<String>,
    pub parameter_size: String,
    pub quantization_level: String,
}

// Helper function to get system process info
fn get_process_info(pid: u32) -> Option<ProcessInfo> {
    let mut system = System::new_all();
    system.refresh_all();
    
    if let Some(process) = system.process(Pid::from(pid as usize)) {
        Some(ProcessInfo {
            pid: Some(pid),
            cpu_usage: process.cpu_usage(),
            memory_usage: process.memory(),
            is_sidecar: true,
        })
    } else {
        None
    }
}

// Sidecar management commands
#[tauri::command]
pub async fn ollama_start_sidecar() -> Result<String, String> {
    let mut process_lock = OLLAMA_PROCESS.lock().await;
    
    // Check if already running
    if let Some(ref mut child) = *process_lock {
        match child.try_wait() {
            Ok(Some(_)) => {
                // Process has exited, clear it
                *process_lock = None;
            }
            Ok(None) => {
                // Process is still running
                return Ok("Ollama sidecar is already running".to_string());
            }
            Err(e) => {
                return Err(format!("Failed to check process status: {}", e));
            }
        }
    }

    // Start new sidecar process
    let ollama_command = if cfg!(target_os = "windows") {
        "ollama.exe"
    } else {
        "ollama"
    };

    match Command::new(ollama_command)
        .args(&["serve"])
        .env("OLLAMA_HOST", "127.0.0.1:11434")
        .env("OLLAMA_ORIGINS", "*")
        .spawn()
    {
        Ok(child) => {
            let pid = child.id();
            *OLLAMA_PID.lock().await = Some(pid);
            *process_lock = Some(child);
            
            // Wait a moment for the server to start
            sleep(Duration::from_secs(2)).await;
            
            Ok(format!("Ollama sidecar started with PID: {}", pid))
        }
        Err(e) => Err(format!("Failed to start Ollama sidecar: {}", e)),
    }
}

#[tauri::command]
pub async fn ollama_stop_sidecar() -> Result<String, String> {
    let mut process_lock = OLLAMA_PROCESS.lock().await;
    
    if let Some(mut child) = process_lock.take() {
        match child.kill() {
            Ok(_) => {
                *OLLAMA_PID.lock().await = None;
                Ok("Ollama sidecar stopped successfully".to_string())
            }
            Err(e) => Err(format!("Failed to stop Ollama sidecar: {}", e)),
        }
    } else {
        Ok("No Ollama sidecar process found".to_string())
    }
}

#[tauri::command]
pub async fn ollama_get_status() -> Result<OllamaHealthResponse, String> {
    let client = reqwest::Client::new();
    let url = "http://localhost:11434/api/tags";
    
    let pid_lock = OLLAMA_PID.lock().await;
    let process_info = if let Some(pid) = *pid_lock {
        get_process_info(pid)
    } else {
        None
    };
    
    match client.get(url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(OllamaHealthResponse {
                    status: "healthy".to_string(),
                    message: "Ollama is running and accessible".to_string(),
                    process_info,
                })
            } else {
                Ok(OllamaHealthResponse {
                    status: "error".to_string(),
                    message: format!("Ollama responded with status: {}", response.status()),
                    process_info,
                })
            }
        }
        Err(e) => {
            Ok(OllamaHealthResponse {
                status: "unreachable".to_string(),
                message: format!("Cannot connect to Ollama: {}", e),
                process_info,
            })
        }
    }
}

// Enhanced model management commands
#[tauri::command]
pub async fn ollama_health_check() -> Result<OllamaHealthResponse, String> {
    ollama_get_status().await
}

#[tauri::command]
pub async fn ollama_list_models() -> Result<Vec<ModelInfo>, String> {
    let client = reqwest::Client::new();
    let url = "http://localhost:11434/api/tags";
    
    match client.get(url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<OllamaModelsResponse>().await {
                    Ok(models_response) => Ok(models_response.models),
                    Err(e) => Err(format!("Failed to parse models response: {}", e)),
                }
            } else {
                Err(format!("Ollama API error: {}", response.status()))
            }
        }
        Err(e) => Err(format!("Failed to connect to Ollama: {}", e)),
    }
}

#[tauri::command]
pub async fn ollama_get_model_info(model_name: String) -> Result<ModelDetails, String> {
    let client = reqwest::Client::new();
    let url = "http://localhost:11434/api/show";
    
    let request_body = serde_json::json!({
        "name": model_name
    });
    
    match client.post(url).json(&request_body).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<ModelDetails>().await {
                    Ok(model_details) => Ok(model_details),
                    Err(e) => Err(format!("Failed to parse model details: {}", e)),
                }
            } else {
                let status = response.status();
                match response.text().await {
                    Ok(error_text) => Err(format!("Failed to get model info {}: {} - {}", model_name, status, error_text)),
                    Err(_) => Err(format!("Failed to get model info {}: {}", model_name, status)),
                }
            }
        }
        Err(e) => Err(format!("Failed to connect to Ollama while getting model info for {}: {}", model_name, e)),
    }
}

#[tauri::command]
pub async fn ollama_delete_model(model_name: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = "http://localhost:11434/api/delete";
    
    let request_body = serde_json::json!({
        "name": model_name
    });
    
    match client.delete(url).json(&request_body).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(format!("Successfully deleted model: {}", model_name))
            } else {
                let status = response.status();
                match response.text().await {
                    Ok(error_text) => Err(format!("Failed to delete model {}: {} - {}", model_name, status, error_text)),
                    Err(_) => Err(format!("Failed to delete model {}: {}", model_name, status)),
                }
            }
        }
        Err(e) => Err(format!("Failed to connect to Ollama while deleting model {}: {}", model_name, e)),
    }
}

// Enhanced pull with progress tracking
#[tauri::command]
pub async fn ollama_pull_model(app_handle: AppHandle, model: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = "http://localhost:11434/api/pull";
    
    let request_body = serde_json::json!({
        "name": model,
        "stream": true
    });
    
    match client.post(url).json(&request_body).send().await {
        Ok(response) => {
            if response.status().is_success() {
                let mut stream = response.bytes_stream();
                let mut buffer = String::new();
                
                while let Some(chunk_result) = stream.next().await {
                    match chunk_result {
                        Ok(chunk) => {
                            let chunk_str = String::from_utf8_lossy(&chunk);
                            buffer.push_str(&chunk_str);
                            
                            // Process complete JSON lines
                            while let Some(line_end) = buffer.find('\n') {
                                let line = buffer[..line_end].trim().to_string();
                                buffer = buffer[line_end + 1..].to_string();
                                
                                if !line.is_empty() {
                                    if let Ok(progress) = serde_json::from_str::<PullProgress>(&line) {
                                        // Emit progress event to frontend
                                        let _ = app_handle.emit("ollama_pull_progress", &progress);
                                        
                                        if progress.status == "success" {
                                            return Ok(format!("Successfully pulled model: {}", model));
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            return Err(format!("Stream error while pulling model {}: {}", model, e));
                        }
                    }
                }
                
                Ok(format!("Model pull completed: {}", model))
            } else {
                let status = response.status();
                match response.text().await {
                    Ok(error_text) => Err(format!("Failed to pull model {}: {} - {}", model, status, error_text)),
                    Err(_) => Err(format!("Failed to pull model {}: {}", model, status)),
                }
            }
        }
        Err(e) => Err(format!("Failed to connect to Ollama while pulling model {}: {}", model, e)),
    }
}

// Streaming chat implementation
#[tauri::command]
pub async fn ollama_chat_stream(
    app_handle: AppHandle,
    messages: Vec<serde_json::Value>,
    model: String,
    stream_id: String,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = "http://localhost:11434/api/chat";
    
    let request_body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": true
    });
    
    match client.post(url).json(&request_body).send().await {
        Ok(response) => {
            if response.status().is_success() {
                let mut stream = response.bytes_stream();
                let mut buffer = String::new();
                let mut full_response = String::new();
                
                while let Some(chunk_result) = stream.next().await {
                    match chunk_result {
                        Ok(chunk) => {
                            let chunk_str = String::from_utf8_lossy(&chunk);
                            buffer.push_str(&chunk_str);
                            
                            // Process complete JSON lines
                            while let Some(line_end) = buffer.find('\n') {
                                let line = buffer[..line_end].trim().to_string();
                                buffer = buffer[line_end + 1..].to_string();
                                
                                if !line.is_empty() {
                                    if let Ok(chat_response) = serde_json::from_str::<serde_json::Value>(&line) {
                                        if let Some(message) = chat_response.get("message") {
                                            if let Some(content) = message.get("content") {
                                                if let Some(content_str) = content.as_str() {
                                                    full_response.push_str(content_str);
                                                    
                                                    // Emit streaming event to frontend
                                                    let stream_event = serde_json::json!({
                                                        "stream_id": stream_id,
                                                        "content": content_str,
                                                        "full_content": full_response,
                                                        "done": chat_response.get("done").unwrap_or(&serde_json::Value::Bool(false))
                                                    });
                                                    
                                                    let _ = app_handle.emit("ollama_chat_stream", &stream_event);
                                                }
                                            }
                                        }
                                        
                                        if chat_response.get("done").unwrap_or(&serde_json::Value::Bool(false)).as_bool().unwrap_or(false) {
                                            return Ok(full_response);
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            return Err(format!("Stream error during chat: {}", e));
                        }
                    }
                }
                
                Ok(full_response)
            } else {
                let status = response.status();
                match response.text().await {
                    Ok(error_text) => Err(format!("Ollama API error {}: {}", status, error_text)),
                    Err(_) => Err(format!("Ollama API error: {}", status)),
                }
            }
        }
        Err(e) => Err(format!("Failed to connect to Ollama: {}", e)),
    }
}

// Legacy commands (keeping for backward compatibility)
#[tauri::command]
pub async fn ollama_generate(prompt: String, model: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = "http://localhost:11434/api/generate";
    
    let request_body = OllamaGenerateRequest {
        model,
        prompt,
        stream: false,
        context: None,
        options: None,
    };
    
    match client.post(url).json(&request_body).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<OllamaGenerateResponse>().await {
                    Ok(generate_response) => Ok(generate_response.response),
                    Err(e) => Err(format!("Failed to parse generate response: {}", e)),
                }
            } else {
                let status = response.status();
                match response.text().await {
                    Ok(error_text) => Err(format!("Ollama API error {}: {}", status, error_text)),
                    Err(_) => Err(format!("Ollama API error: {}", status)),
                }
            }
        }
        Err(e) => Err(format!("Failed to connect to Ollama: {}", e)),
    }
}

#[tauri::command]
pub async fn ollama_chat(messages: Vec<serde_json::Value>, model: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = "http://localhost:11434/api/chat";
    
    let request_body = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": false
    });
    
    match client.post(url).json(&request_body).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(chat_response) => {
                        if let Some(message) = chat_response.get("message") {
                            if let Some(content) = message.get("content") {
                                if let Some(content_str) = content.as_str() {
                                    Ok(content_str.to_string())
                                } else {
                                    Err("Invalid response format: content is not a string".to_string())
                                }
                            } else {
                                Err("Invalid response format: missing content field".to_string())
                            }
                        } else {
                            Err("Invalid response format: missing message field".to_string())
                        }
                    }
                    Err(e) => Err(format!("Failed to parse chat response: {}", e)),
                }
            } else {
                let status = response.status();
                match response.text().await {
                    Ok(error_text) => Err(format!("Ollama API error {}: {}", status, error_text)),
                    Err(_) => Err(format!("Ollama API error: {}", status)),
                }
            }
        }
        Err(e) => Err(format!("Failed to connect to Ollama: {}", e)),
    }
}