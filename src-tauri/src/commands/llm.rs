use async_openai::{
    types::{CreateChatCompletionRequestArgs, ChatCompletionRequestMessage},
    Client as OpenAIClient,
};
use serde_json::{Value, json};
use reqwest;
use serde::{Serialize, Deserialize};
use tauri::{AppHandle, Manager};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LlmProviderConfig {
    pub key: Option<String>,
    pub base_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
struct LlmSettings {
    providers: HashMap<String, LlmProviderConfig>,
    enabled_models: HashMap<String, Vec<String>>,
}

#[allow(dead_code)]
fn get_settings_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let path = app_handle.path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("llm_settings.json");
    Ok(path)
}

#[allow(dead_code)]
fn read_settings(path: &PathBuf) -> Result<LlmSettings, String> {
    if !path.exists() {
        return Ok(LlmSettings::default());
    }
    let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[allow(dead_code)]
fn write_settings(path: &PathBuf, settings: &LlmSettings) -> Result<(), String> {
    let data = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_llm_provider_settings(
    app_handle: AppHandle,
    settings: HashMap<String, LlmProviderConfig>,
) -> Result<(), String> {
    let path = get_settings_path(&app_handle)?;
    let mut current_settings = read_settings(&path).unwrap_or_default();
    current_settings.providers = settings;
    write_settings(&path, &current_settings)
}

#[tauri::command]
pub async fn get_llm_provider_settings(
    app_handle: AppHandle,
) -> Result<HashMap<String, LlmProviderConfig>, String> {
    let path = get_settings_path(&app_handle)?;
    let settings = read_settings(&path)?;
    Ok(settings.providers)
}

#[tauri::command]
pub async fn set_enabled_models(
    app_handle: AppHandle,
    provider: String,
    model_ids: Vec<String>,
) -> Result<(), String> {
    let path = get_settings_path(&app_handle)?;
    let mut settings = read_settings(&path)?;
    settings.enabled_models.insert(provider, model_ids);
    write_settings(&path, &settings)
}

#[tauri::command]
pub async fn get_enabled_models(
    app_handle: AppHandle,
    provider: String,
) -> Result<Vec<String>, String> {
    let path = get_settings_path(&app_handle)?;
    let settings = read_settings(&path)?;
    Ok(settings.enabled_models.get(&provider).cloned().unwrap_or_default())
}

// ========== CHAT COMMANDS ==========

#[tauri::command]
pub async fn llm_chat_openai(
    messages: Vec<Value>,
    model: String,
    api_key: String,
    base_url: Option<String>,
) -> Result<String, String> {
    let client = if let Some(url) = base_url {
        OpenAIClient::with_config(
            async_openai::config::OpenAIConfig::new()
                .with_api_key(api_key)
                .with_api_base(url)
        )
    } else {
        OpenAIClient::with_config(
            async_openai::config::OpenAIConfig::new()
                .with_api_key(api_key)
        )
    };

    let request_messages: Vec<ChatCompletionRequestMessage> = messages
        .into_iter()
        .map(|msg| serde_json::from_value(msg).unwrap())
        .collect();

    let request = CreateChatCompletionRequestArgs::default()
        .model(model)
        .messages(request_messages)
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .chat()
        .create(request)
        .await
        .map_err(|e| e.to_string())?;

    Ok(response.choices[0].message.content.clone().unwrap_or_default())
}

#[tauri::command]
pub async fn llm_chat_anthropic(
    messages: Vec<Value>,
    model: String,
    api_key: String,
    base_url: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://api.anthropic.com".to_string());
    let endpoint = format!("{}/v1/messages", url);

    let request_body = json!({
        "model": model,
        "max_tokens": 1000,
        "messages": messages
    });

    let response = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("anthropic-version", "2023-06-01")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Anthropic API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let content = response_json
        .get("content")
        .and_then(|content| content.get(0))
        .and_then(|first| first.get("text"))
        .and_then(|text| text.as_str())
        .unwrap_or("")
        .to_string();

    Ok(content)
}

#[tauri::command]
pub async fn llm_chat_openrouter(
    messages: Vec<Value>,
    model: String,
    api_key: String,
    base_url: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://openrouter.ai".to_string());
    let endpoint = format!("{}/api/v1/chat/completions", url);

    let request_body = json!({
        "model": model,
        "messages": messages
    });

    let response = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("OpenRouter API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let content = response_json
        .get("choices")
        .and_then(|choices| choices.get(0))
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(|content| content.as_str())
        .unwrap_or("")
        .to_string();

    Ok(content)
}

#[tauri::command]
pub async fn llm_chat_deepseek(
    messages: Vec<Value>,
    model: String,
    api_key: String,
    base_url: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://api.deepseek.com".to_string());
    let endpoint = format!("{}/v1/chat/completions", url);

    let request_body = json!({
        "model": model,
        "messages": messages,
        "stream": false
    });

    let response = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("DeepSeek API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let content = response_json
        .get("choices")
        .and_then(|choices| choices.get(0))
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(|content| content.as_str())
        .unwrap_or("")
        .to_string();

    Ok(content)
}

#[tauri::command]
pub async fn llm_chat_gemini(
    messages: Vec<Value>,
    model: String,
    api_key: String,
    base_url: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://generativelanguage.googleapis.com".to_string());
    let endpoint = format!("{}/v1beta/models/{}:generateContent?key={}", url, model, api_key);

    // Convert messages to Gemini format
    let contents = messages.iter().map(|msg| {
        json!({
            "parts": [{"text": msg.get("content").unwrap_or(&json!("")).as_str().unwrap_or("")}],
            "role": if msg.get("role").unwrap_or(&json!("user")).as_str().unwrap_or("user") == "assistant" { "model" } else { "user" }
        })
    }).collect::<Vec<_>>();

    let request_body = json!({
        "contents": contents
    });

    let response = client
        .post(&endpoint)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Gemini API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let content = response_json
        .get("candidates")
        .and_then(|candidates| candidates.get(0))
        .and_then(|candidate| candidate.get("content"))
        .and_then(|content| content.get("parts"))
        .and_then(|parts| parts.get(0))
        .and_then(|part| part.get("text"))
        .and_then(|text| text.as_str())
        .unwrap_or("")
        .to_string();

    Ok(content)
}

#[tauri::command]
pub async fn llm_chat_mistral(
    messages: Vec<Value>,
    model: String,
    api_key: String,
    base_url: Option<String>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://api.mistral.ai".to_string());
    let endpoint = if url.ends_with("/v1") {
        format!("{}/chat/completions", url)
    } else {
        format!("{}/v1/chat/completions", url)
    };

    let request_body = json!({
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1000
    });

    let response = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Mistral API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let content = response_json
        .get("choices")
        .and_then(|choices| choices.get(0))
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(|content| content.as_str())
        .unwrap_or("")
        .to_string();

    Ok(content)
}

// ========== MODEL LISTING COMMANDS ==========

#[tauri::command]
pub async fn llm_list_openai_models(
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<Value>, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://api.openai.com".to_string());
    let endpoint = format!("{}/v1/models", url);

    let response = client
        .get(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("OpenAI API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let models = response_json
        .get("data")
        .and_then(|data| data.as_array())
        .map(|arr| arr.clone())
        .unwrap_or_else(Vec::new);

    Ok(models)
}

#[tauri::command]
pub async fn llm_list_anthropic_models(
    _api_key: String,
    _base_url: Option<String>,
) -> Result<Vec<Value>, String> {
    // Anthropic doesn't have a public models API endpoint, return hardcoded list
    let models = vec![
        json!({
            "id": "claude-3-opus-20240229",
            "object": "model",
            "display_name": "Claude 3 Opus"
        }),
        json!({
            "id": "claude-3-sonnet-20240229", 
            "object": "model",
            "display_name": "Claude 3 Sonnet"
        }),
        json!({
            "id": "claude-3-haiku-20240307",
            "object": "model", 
            "display_name": "Claude 3 Haiku"
        })
    ];

    Ok(models)
}

#[tauri::command]
pub async fn llm_list_openrouter_models(
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<Value>, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://openrouter.ai".to_string());
    let endpoint = format!("{}/api/v1/models", url);

    let response = client
        .get(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("OpenRouter API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let models = response_json
        .get("data")
        .and_then(|data| data.as_array())
        .map(|arr| arr.clone())
        .unwrap_or_else(Vec::new);

    Ok(models)
}

#[tauri::command]
pub async fn llm_list_deepseek_models(
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<Value>, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://api.deepseek.com".to_string());
    let endpoint = format!("{}/v1/models", url);

    let response = client
        .get(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("DeepSeek API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let models = response_json
        .get("data")
        .and_then(|data| data.as_array())
        .map(|arr| arr.clone())
        .unwrap_or_else(Vec::new);

    Ok(models)
}

#[tauri::command]
pub async fn llm_list_gemini_models(
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<Value>, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://generativelanguage.googleapis.com".to_string());
    let endpoint = format!("{}/v1beta/models?key={}", url, api_key);

    let response = client
        .get(&endpoint)
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Gemini API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let models = response_json
        .get("models")
        .and_then(|models| models.as_array())
        .map(|arr| arr.clone())
        .unwrap_or_else(Vec::new);

    Ok(models)
}

#[tauri::command]
pub async fn llm_list_mistral_models(
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<Value>, String> {
    let client = reqwest::Client::new();
    let url = base_url.unwrap_or_else(|| "https://api.mistral.ai".to_string());
    let endpoint = if url.ends_with("/v1") {
        format!("{}/models", url)
    } else {
        format!("{}/v1/models", url)
    };

    let response = client
        .get(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Mistral API error: {}", error_text));
    }

    let response_json: Value = response.json().await.map_err(|e| e.to_string())?;
    
    let models = response_json
        .get("data")
        .and_then(|data| data.as_array())
        .map(|arr| arr.clone())
        .unwrap_or_else(Vec::new);

    Ok(models)
} 