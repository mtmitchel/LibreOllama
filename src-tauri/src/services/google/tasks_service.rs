use crate::database::DatabaseManager;
use crate::errors::{LibreOllamaError, Result};
use crate::services::gmail::auth_service::GmailAuthService;
use reqwest::{Client, Method};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
// use chrono::Utc; // not used

const GOOGLE_TASKS_API_BASE: &str = "https://tasks.googleapis.com/tasks/v1";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleTaskList {
    pub id: String,
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleTask {
    pub id: String,
    pub title: String,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub status: String,
    pub position: Option<String>,
    pub updated: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskInput {
    pub title: String,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskInput {
    pub title: Option<String>,
    pub notes: Option<String>,
    pub due: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone)]
pub struct GoogleTasksService {
    client: Client,
    auth_service: Arc<GmailAuthService>,
    db_manager: Arc<DatabaseManager>,
}

impl GoogleTasksService {
    pub fn new(auth_service: Arc<GmailAuthService>, db_manager: Arc<DatabaseManager>) -> Self {
        Self {
            client: Client::new(),
            auth_service,
            db_manager,
        }
    }

    async fn make_api_request<T>(&self, account_id: &str, endpoint: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let tokens = self
            .auth_service
            .validate_and_refresh_tokens(&self.db_manager, account_id)
            .await?;

        let url = format!("{}/{}", GOOGLE_TASKS_API_BASE, endpoint.trim_start_matches('/'));

        let response = self
            .client
            .get(&url)
            .bearer_auth(tokens.access_token)
            .send()
            .await
            .map_err(|e| LibreOllamaError::Network {
                message: format!("Google Tasks API request failed: {}", e),
                url: Some(url.clone()),
            })?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(LibreOllamaError::GoogleTasksApi {
                message: format!("Google Tasks API error: {}", error_text),
            });
        }

        response.json::<T>().await.map_err(|e| LibreOllamaError::Serialization {
            message: format!("Failed to parse Google Tasks API response: {}", e),
            data_type: "Google Tasks API Response".to_string(),
        })
    }

    pub async fn get_task_lists(&self, account_id: &str) -> Result<Vec<GoogleTaskList>> {
        #[derive(Deserialize)]
        struct TaskListsResponse {
            items: Option<Vec<GoogleTaskList>>,
            #[serde(rename = "nextPageToken")]
            next_page_token: Option<String>,
        }

        let mut all_lists = Vec::new();
        let mut page_token: Option<String> = None;

        loop {
            let mut endpoint = "users/@me/lists?maxResults=100".to_string();
            if let Some(token) = &page_token {
                endpoint.push_str(&format!("&pageToken={}", token));
            }

            let response: TaskListsResponse = self.make_api_request(account_id, &endpoint).await?;
            
            if let Some(lists) = response.items {
                all_lists.extend(lists);
            }

            if response.next_page_token.is_none() {
                break;
            }
            
            page_token = response.next_page_token;
        }

        Ok(all_lists)
    }

    pub async fn get_tasks(&self, account_id: &str, task_list_id: &str) -> Result<Vec<GoogleTask>> {
        #[derive(Deserialize)]
        struct TasksResponse {
            items: Option<Vec<GoogleTask>>,
            #[serde(rename = "nextPageToken")]
            next_page_token: Option<String>,
        }

        let mut all_tasks = Vec::new();
        let mut page_token: Option<String> = None;

        loop {
            let mut endpoint = format!("lists/{}/tasks?maxResults=100", task_list_id);
            
            // CRITICAL: Always fetch completed tasks for client-side filtering
            // Include showHidden=true to get tasks marked as completed in Gmail/Calendar/mobile
            endpoint.push_str("&showCompleted=true&showHidden=true");
            
            if let Some(token) = &page_token {
                endpoint.push_str(&format!("&pageToken={}", token));
            }

            let response: TasksResponse = self.make_api_request(account_id, &endpoint).await?;
            
            if let Some(tasks) = response.items {
                all_tasks.extend(tasks);
            }

            if response.next_page_token.is_none() {
                break;
            }
            
            page_token = response.next_page_token;
        }

        Ok(all_tasks)
    }

    async fn make_api_request_with_body<T, B>(&self, account_id: &str, endpoint: &str, method: Method, body: Option<B>) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
        B: Serialize,
    {
        let tokens = self
            .auth_service
            .validate_and_refresh_tokens(&self.db_manager, account_id)
            .await?;

        let url = format!("{}/{}", GOOGLE_TASKS_API_BASE, endpoint.trim_start_matches('/'));

        let mut request = self
            .client
            .request(method, &url)
            .bearer_auth(tokens.access_token)
            .header("Content-Type", "application/json");

        if let Some(body_data) = body {
            request = request.json(&body_data);
        }

        let response = request
            .send()
            .await
            .map_err(|e| LibreOllamaError::Network {
                message: format!("Google Tasks API request failed: {}", e),
                url: Some(url.clone()),
            })?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(LibreOllamaError::GoogleTasksApi {
                message: format!("Google Tasks API error: {}", error_text),
            });
        }

        response.json::<T>().await.map_err(|e| LibreOllamaError::Serialization {
            message: format!("Failed to parse Google Tasks API response: {}", e),
            data_type: "Google Tasks API Response".to_string(),
        })
    }

    pub async fn create_task(&self, account_id: &str, task_list_id: &str, input: CreateTaskInput) -> Result<GoogleTask> {
        let endpoint = format!("lists/{}/tasks", task_list_id);
        
        // Convert due date to RFC 3339 format if provided
        let due_rfc3339 = if let Some(due) = input.due {
            // If it's already in RFC 3339 format, use as-is
            if due.contains('T') {
                Some(due)
            } else {
                // For YYYY-MM-DD format, create RFC 3339 timestamp
                // We use a time that ensures the date remains correct when Google
                // returns it at midnight UTC. For users in negative UTC offsets
                // (Americas), we need to use a later time.
                Some(format!("{}T20:00:00.000Z", due))
            }
        } else {
            None
        };
        
        let body = serde_json::json!({
            "title": input.title,
            "notes": input.notes,
            "due": due_rfc3339,
            "status": input.status.unwrap_or_else(|| "needsAction".to_string())
        });

        self.make_api_request_with_body(account_id, &endpoint, Method::POST, Some(body)).await
    }

    #[allow(dead_code)]
    pub async fn get_single_task(&self, account_id: &str, task_list_id: &str, task_id: &str) -> Result<GoogleTask> {
        let endpoint = format!("lists/{}/tasks/{}", task_list_id, task_id);
        self.make_api_request(account_id, &endpoint).await
    }

    pub async fn update_task(&self, account_id: &str, task_list_id: &str, task_id: &str, input: UpdateTaskInput) -> Result<GoogleTask> {
        let endpoint = format!("lists/{}/tasks/{}", task_list_id, task_id);
        
        // Convert due date to RFC 3339 format if provided
        let due_rfc3339 = if let Some(due) = input.due {
            // If it's already in RFC 3339 format, use as-is
            if due.contains('T') {
                Some(due)
            } else {
                // For YYYY-MM-DD format, create RFC 3339 timestamp
                // We use a time that ensures the date remains correct when Google
                // returns it at midnight UTC. For users in negative UTC offsets
                // (Americas), we need to use a later time.
                Some(format!("{}T20:00:00.000Z", due))
            }
        } else {
            None
        };
        
        // Build body dynamically to only include non-None fields
        // This prevents sending null values that would clear existing data
        let mut body = serde_json::Map::new();
        body.insert("id".to_string(), serde_json::json!(task_id));
        
        if let Some(title) = input.title {
            body.insert("title".to_string(), serde_json::json!(title));
        }
        if let Some(notes) = input.notes {
            body.insert("notes".to_string(), serde_json::json!(notes));
        }
        if let Some(due) = due_rfc3339 {
            body.insert("due".to_string(), serde_json::json!(due));
        }
        if let Some(status) = input.status {
            body.insert("status".to_string(), serde_json::json!(status));
        }
        
        let body = serde_json::Value::Object(body);

        self.make_api_request_with_body(account_id, &endpoint, Method::PATCH, Some(body)).await
    }

    pub async fn delete_task(&self, account_id: &str, task_list_id: &str, task_id: &str) -> Result<()> {
        let endpoint = format!("lists/{}/tasks/{}", task_list_id, task_id);
        
        let tokens = self
            .auth_service
            .validate_and_refresh_tokens(&self.db_manager, account_id)
            .await?;

        let url = format!("{}/{}", GOOGLE_TASKS_API_BASE, endpoint.trim_start_matches('/'));

        let response = self
            .client
            .delete(&url)
            .bearer_auth(tokens.access_token)
            .send()
            .await
            .map_err(|e| LibreOllamaError::Network {
                message: format!("Google Tasks API request failed: {}", e),
                url: Some(url.clone()),
            })?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(LibreOllamaError::GoogleTasksApi {
                message: format!("Google Tasks API error: {}", error_text),
            });
        }

        Ok(())
    }

    #[allow(dead_code)]
    pub async fn update_task_list(&self, account_id: &str, task_list_id: &str, new_title: String) -> Result<GoogleTaskList> {
        let endpoint = format!("users/@me/lists/{}", task_list_id);
        let body = serde_json::json!({
            "title": new_title
        });

        self.make_api_request_with_body(account_id, &endpoint, Method::PATCH, Some(body)).await
    }
}
