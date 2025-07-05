use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{command, State};
use anyhow::{anyhow, Result};
use reqwest::Client;
use tokio::time::sleep;

use crate::database::connection::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    pub requests_per_minute: u32,
    pub requests_per_second: u32,
    pub max_batch_size: u32,
    pub initial_backoff_ms: u64,
    pub max_backoff_ms: u64,
    pub backoff_multiplier: f64,
    pub max_retries: u32,
    pub queue_timeout_minutes: u32,
    pub enable_batching: bool,
    pub enable_adaptive_rate_limiting: bool,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            requests_per_minute: 250,        // Gmail API default
            requests_per_second: 10,         // Conservative limit
            max_batch_size: 100,             // Gmail batch limit
            initial_backoff_ms: 1000,        // 1 second initial backoff
            max_backoff_ms: 300000,          // 5 minutes max backoff
            backoff_multiplier: 2.0,         // Exponential backoff
            max_retries: 5,                  // Maximum retry attempts
            queue_timeout_minutes: 30,       // Request queue timeout
            enable_batching: true,           // Enable batch operations
            enable_adaptive_rate_limiting: true, // Adaptive rate limiting
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiQuotaStatus {
    pub daily_quota_used: u64,
    pub daily_quota_limit: u64,
    pub per_user_rate_limit: u32,
    pub requests_in_current_minute: u32,
    pub requests_in_current_second: u32,
    pub quota_reset_time: String,
    pub is_near_limit: bool,
    pub adaptive_delay_ms: u64,
    pub quota_utilization_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchRequest {
    pub id: String,
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub priority: RequestPriority,
    pub created_at: String,
    pub max_retries: u32,
    pub current_retry: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum RequestPriority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResponse {
    pub id: String,
    pub status_code: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub error: Option<String>,
    pub retry_count: u32,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueStats {
    pub pending_requests: u32,
    pub processing_requests: u32,
    pub completed_requests: u64,
    pub failed_requests: u64,
    pub average_wait_time_ms: u64,
    pub current_rate_limit_delay_ms: u64,
    pub quota_utilization_percent: f64,
}

#[derive(Debug)]
pub struct RequestQueue {
    pub pending: VecDeque<BatchRequest>,
    pub processing: HashMap<String, BatchRequest>,
    pub completed: u64,
    pub failed: u64,
    pub last_request_time: Option<Instant>,
    pub request_times: VecDeque<Instant>,
}

impl Default for RequestQueue {
    fn default() -> Self {
        Self {
            pending: VecDeque::new(),
            processing: HashMap::new(),
            completed: 0,
            failed: 0,
            last_request_time: None,
            request_times: VecDeque::new(),
        }
    }
}

#[derive(Debug)]
pub struct RateLimiter {
    pub config: RateLimitConfig,
    pub quota_status: ApiQuotaStatus,
    pub request_queue: Arc<Mutex<RequestQueue>>,
    pub last_quota_check: Instant,
    pub adaptive_delay: u64,
}

impl RateLimiter {
    pub fn new(config: RateLimitConfig) -> Self {
        Self {
            config,
            quota_status: ApiQuotaStatus {
                daily_quota_used: 0,
                daily_quota_limit: 1000000000, // 1 billion default
                per_user_rate_limit: 250,
                requests_in_current_minute: 0,
                requests_in_current_second: 0,
                quota_reset_time: chrono::Utc::now().to_rfc3339(),
                is_near_limit: false,
                adaptive_delay_ms: 0,
                quota_utilization_percent: 0.0,
            },
            request_queue: Arc::new(Mutex::new(RequestQueue::default())),
            last_quota_check: Instant::now(),
            adaptive_delay: 0,
        }
    }

    pub async fn execute_request(&mut self, request: BatchRequest) -> Result<BatchResponse> {
        // Check if we need to wait for rate limits
        self.wait_for_rate_limit().await?;

        // Update quota tracking
        self.update_quota_tracking()?;

        // Execute the request
        let start_time = Instant::now();
        let result = self.make_http_request(&request).await;

        let duration = start_time.elapsed().as_millis() as u64;

        match result {
            Ok(response) => {
                self.handle_successful_request();
                Ok(BatchResponse {
                    id: request.id,
                    status_code: response.status().as_u16(),
                    headers: extract_headers(&response),
                    body: response.text().await?,
                    error: None,
                    retry_count: request.current_retry,
                    duration_ms: duration,
                })
            }
            Err(e) => {
                if self.should_retry(&request, &e) {
                    self.schedule_retry(request).await?;
                    Err(anyhow!("Request scheduled for retry: {}", e))
                } else {
                    self.handle_failed_request();
                    Ok(BatchResponse {
                        id: request.id,
                        status_code: 0,
                        headers: HashMap::new(),
                        body: String::new(),
                        error: Some(e.to_string()),
                        retry_count: request.current_retry,
                        duration_ms: duration,
                    })
                }
            }
        }
    }

    pub async fn execute_batch(&mut self, requests: Vec<BatchRequest>) -> Result<Vec<BatchResponse>> {
        if !self.config.enable_batching || requests.len() <= 1 {
            // Execute requests individually
            let mut responses = Vec::new();
            for request in requests {
                let response = self.execute_request(request).await?;
                responses.push(response);
            }
            return Ok(responses);
        }

        // Group requests into batches
        let batches = self.create_batches(requests);
        let mut all_responses = Vec::new();

        for batch in batches {
            let batch_responses = self.execute_gmail_batch(batch).await?;
            all_responses.extend(batch_responses);
        }

        Ok(all_responses)
    }

    async fn wait_for_rate_limit(&mut self) -> Result<()> {
        let now = Instant::now();
        
        // Check requests per second limit
        let wait_time = {
            let queue = self.request_queue.lock().unwrap();
            if let Some(last_request) = queue.last_request_time {
                let time_since_last = now.duration_since(last_request);
                let min_interval = Duration::from_millis(1000 / self.config.requests_per_second as u64);
                
                if time_since_last < min_interval {
                    Some(min_interval - time_since_last)
                } else {
                    None
                }
            } else {
                None
            }
        };
        
        if let Some(wait_time) = wait_time {
            sleep(wait_time).await;
        }

        // Check requests per minute limit
        self.enforce_per_minute_limit().await?;

        // Apply adaptive delay if enabled
        if self.config.enable_adaptive_rate_limiting && self.adaptive_delay > 0 {
            sleep(Duration::from_millis(self.adaptive_delay)).await;
            self.adaptive_delay = (self.adaptive_delay as f64 * 0.9) as u64; // Gradually reduce
        }

        Ok(())
    }

    async fn enforce_per_minute_limit(&mut self) -> Result<()> {
        let now = Instant::now();
        let one_minute_ago = now - Duration::from_secs(60);

        let wait_time = {
            let mut queue = self.request_queue.lock().unwrap();
            
            // Remove old timestamps
            while let Some(&front_time) = queue.request_times.front() {
                if front_time < one_minute_ago {
                    queue.request_times.pop_front();
                } else {
                    break;
                }
            }

            // Check if we're at the limit
            if queue.request_times.len() >= self.config.requests_per_minute as usize {
                let oldest_request = *queue.request_times.front().unwrap();
                Some(Duration::from_secs(60) - now.duration_since(oldest_request))
            } else {
                None
            }
        };
        
        if let Some(wait_time) = wait_time {
            if wait_time > Duration::from_secs(0) {
                sleep(wait_time).await;
            }
        }

        Ok(())
    }

    fn update_quota_tracking(&mut self) -> Result<()> {
        let now = Instant::now();
        
        // Update request tracking
        {
            let mut queue = self.request_queue.lock().unwrap();
            queue.last_request_time = Some(now);
            queue.request_times.push_back(now);
        }

        // Update quota status (simplified - in production, this would query Gmail API)
        self.quota_status.requests_in_current_minute += 1;
        self.quota_status.requests_in_current_second += 1;
        self.quota_status.daily_quota_used += 1;

        // Check if we're approaching limits
        let minute_utilization = self.quota_status.requests_in_current_minute as f64 / self.config.requests_per_minute as f64;
        let daily_utilization = self.quota_status.daily_quota_used as f64 / self.quota_status.daily_quota_limit as f64;
        
        self.quota_status.is_near_limit = minute_utilization > 0.8 || daily_utilization > 0.9;
        self.quota_status.quota_utilization_percent = daily_utilization * 100.0;

        // Adaptive rate limiting
        if self.config.enable_adaptive_rate_limiting {
            if minute_utilization > 0.7 {
                self.adaptive_delay = ((minute_utilization - 0.7) * 5000.0) as u64; // Up to 1.5 second delay
            }
        }

        Ok(())
    }

    async fn make_http_request(&self, request: &BatchRequest) -> Result<reqwest::Response> {
        let client = Client::new();
        let mut req_builder = match request.method.as_str() {
            "GET" => client.get(&request.url),
            "POST" => client.post(&request.url),
            "PUT" => client.put(&request.url),
            "DELETE" => client.delete(&request.url),
            "PATCH" => client.patch(&request.url),
            _ => return Err(anyhow!("Unsupported HTTP method: {}", request.method)),
        };

        // Add headers
        for (key, value) in &request.headers {
            req_builder = req_builder.header(key, value);
        }

        // Add body if present
        if let Some(body) = &request.body {
            req_builder = req_builder.body(body.clone());
        }

        let response = req_builder.send().await?;

        // Check for rate limit errors
        let status = response.status().as_u16();
        if status == 429 {
            return Err(anyhow!("Rate limit exceeded"));
        }

        if status == 403 {
            let body = response.text().await?;
            if body.contains("quotaExceeded") || body.contains("rateLimitExceeded") {
                return Err(anyhow!("Quota or rate limit exceeded: {}", body));
            }
            // Create a new response since we consumed the original
            return Err(anyhow!("Forbidden access"));
        }

        Ok(response)
    }

    fn should_retry(&self, request: &BatchRequest, error: &anyhow::Error) -> bool {
        if request.current_retry >= request.max_retries {
            return false;
        }

        let error_str = error.to_string().to_lowercase();
        
        // Retry on rate limits, network errors, and temporary server errors
        error_str.contains("rate limit") ||
        error_str.contains("quota") ||
        error_str.contains("timeout") ||
        error_str.contains("connection") ||
        error_str.contains("502") ||
        error_str.contains("503") ||
        error_str.contains("504")
    }

    async fn schedule_retry(&mut self, mut request: BatchRequest) -> Result<()> {
        request.current_retry += 1;
        
        // Calculate exponential backoff delay
        let backoff_delay = self.config.initial_backoff_ms as f64 * 
            self.config.backoff_multiplier.powi(request.current_retry as i32);
        let delay = std::cmp::min(backoff_delay as u64, self.config.max_backoff_ms);

        // Add some jitter to prevent thundering herd
        let jitter = rand::random::<f64>() * 0.1; // ±10% jitter
        let final_delay = (delay as f64 * (1.0 + jitter)) as u64;

        // Schedule the retry
        tokio::spawn(async move {
            sleep(Duration::from_millis(final_delay)).await;
            // In a real implementation, you'd add the request back to the queue
        });

        Ok(())
    }

    fn handle_successful_request(&mut self) {
        let mut queue = self.request_queue.lock().unwrap();
        queue.completed += 1;
        
        // Reduce adaptive delay on success
        if self.config.enable_adaptive_rate_limiting {
            self.adaptive_delay = (self.adaptive_delay as f64 * 0.8) as u64;
        }
    }

    fn handle_failed_request(&mut self) {
        let mut queue = self.request_queue.lock().unwrap();
        queue.failed += 1;
        
        // Increase adaptive delay on failure
        if self.config.enable_adaptive_rate_limiting {
            self.adaptive_delay = std::cmp::min(self.adaptive_delay + 1000, self.config.max_backoff_ms);
        }
    }

    fn create_batches(&self, requests: Vec<BatchRequest>) -> Vec<Vec<BatchRequest>> {
        let mut batches = Vec::new();
        let mut current_batch = Vec::new();

        for request in requests {
            current_batch.push(request);
            
            if current_batch.len() >= self.config.max_batch_size as usize {
                batches.push(current_batch);
                current_batch = Vec::new();
            }
        }

        if !current_batch.is_empty() {
            batches.push(current_batch);
        }

        batches
    }

    async fn execute_gmail_batch(&mut self, requests: Vec<BatchRequest>) -> Result<Vec<BatchResponse>> {
        // Create Gmail batch request
        let boundary = format!("batch_{}", uuid::Uuid::new_v4());
        let mut batch_body = String::new();

        for (i, request) in requests.iter().enumerate() {
            batch_body.push_str(&format!("--{}\r\n", boundary));
            batch_body.push_str("Content-Type: application/http\r\n");
            batch_body.push_str(&format!("Content-ID: {}\r\n\r\n", i + 1));
            
            batch_body.push_str(&format!("{} {} HTTP/1.1\r\n", request.method, extract_path(&request.url)));
            batch_body.push_str("Host: gmail.googleapis.com\r\n");
            
            for (key, value) in &request.headers {
                if key.to_lowercase() != "host" {
                    batch_body.push_str(&format!("{}: {}\r\n", key, value));
                }
            }
            
            batch_body.push_str("\r\n");
            
            if let Some(body) = &request.body {
                batch_body.push_str(body);
            }
            
            batch_body.push_str("\r\n");
        }

        batch_body.push_str(&format!("--{}--\r\n", boundary));

        // Execute batch request
        let batch_request = BatchRequest {
            id: format!("batch_{}", uuid::Uuid::new_v4()),
            method: "POST".to_string(),
            url: "https://www.googleapis.com/batch/gmail/v1".to_string(),
            headers: {
                let mut headers = HashMap::new();
                headers.insert("Content-Type".to_string(), format!("multipart/mixed; boundary={}", boundary));
                headers
            },
            body: Some(batch_body),
            priority: RequestPriority::Medium,
            created_at: chrono::Utc::now().to_rfc3339(),
            max_retries: self.config.max_retries,
            current_retry: 0,
        };

        let batch_response = self.execute_request(batch_request).await?;
        
        // Parse batch response
        self.parse_batch_response(batch_response, requests).await
    }

    async fn parse_batch_response(&self, batch_response: BatchResponse, original_requests: Vec<BatchRequest>) -> Result<Vec<BatchResponse>> {
        let mut responses = Vec::new();
        
        // Parse multipart response (simplified)
        let lines: Vec<&str> = batch_response.body.lines().collect();
        let mut current_response = None;
        let mut response_body = String::new();
        let mut in_body = false;

        for line in lines {
            if line.starts_with("--") {
                if let Some(response) = current_response.take() {
                    responses.push(response);
                }
                in_body = false;
                response_body.clear();
            } else if line.starts_with("HTTP/") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let status_code = parts[1].parse::<u16>().unwrap_or(500);
                    current_response = Some(BatchResponse {
                        id: format!("response_{}", responses.len()),
                        status_code,
                        headers: HashMap::new(),
                        body: String::new(),
                        error: None,
                        retry_count: 0,
                        duration_ms: 0,
                    });
                }
            } else if line.is_empty() && current_response.is_some() {
                in_body = true;
            } else if in_body {
                response_body.push_str(line);
                response_body.push('\n');
            }
        }

        if let Some(mut response) = current_response {
            response.body = response_body;
            responses.push(response);
        }

        // Match responses with original requests
        for (i, response) in responses.iter_mut().enumerate() {
            if let Some(original_request) = original_requests.get(i) {
                response.id = original_request.id.clone();
            }
        }

        Ok(responses)
    }
}

// Tauri command implementations

/// Initialize rate limiter configuration
#[command]
pub async fn initialize_rate_limiter(
    config: RateLimitConfig,
    db_manager: State<'_, DatabaseManager>,
) -> Result<(), String> {
    // Store rate limiter configuration in database
    let conn = db_manager.get_connection()
        .map_err(|e| format!("Database connection failed: {}", e))?;

    let config_json = serde_json::to_string(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    conn.execute(
        "INSERT OR REPLACE INTO rate_limit_config (id, config_json, created_at, updated_at) 
         VALUES ('default', ?1, ?2, ?3)",
        rusqlite::params![
            &config_json,
            &chrono::Utc::now().to_rfc3339(),
            &chrono::Utc::now().to_rfc3339(),
        ],
    ).map_err(|e| format!("Failed to store rate limit config: {}", e))?;

    Ok(())
}

/// Get current quota status
#[command]
pub async fn get_quota_status() -> Result<ApiQuotaStatus, String> {
    // In a real implementation, this would query the Gmail API for current quota usage
    Ok(ApiQuotaStatus {
        daily_quota_used: 12500,
        daily_quota_limit: 1000000000,
        per_user_rate_limit: 250,
        requests_in_current_minute: 15,
        requests_in_current_second: 2,
        quota_reset_time: (chrono::Utc::now() + chrono::Duration::hours(24)).to_rfc3339(),
        is_near_limit: false,
        adaptive_delay_ms: 0,
        quota_utilization_percent: 1.25,
    })
}

/// Get queue statistics
#[command]
pub async fn get_queue_stats() -> Result<QueueStats, String> {
    // In a real implementation, this would return actual queue statistics
    Ok(QueueStats {
        pending_requests: 0,
        processing_requests: 0,
        completed_requests: 1250,
        failed_requests: 23,
        average_wait_time_ms: 150,
        current_rate_limit_delay_ms: 0,
        quota_utilization_percent: 1.25,
    })
}

/// Execute a rate-limited Gmail API request
#[command]
pub async fn execute_rate_limited_request(
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Option<String>,
    priority: RequestPriority,
) -> Result<BatchResponse, String> {
    let config = RateLimitConfig::default();
    let mut rate_limiter = RateLimiter::new(config);

    let request = BatchRequest {
        id: uuid::Uuid::new_v4().to_string(),
        method,
        url,
        headers,
        body,
        priority,
        created_at: chrono::Utc::now().to_rfc3339(),
        max_retries: 3,
        current_retry: 0,
    };

    rate_limiter.execute_request(request).await
        .map_err(|e| e.to_string())
}

/// Execute multiple requests as a batch
#[command]
pub async fn execute_batch_requests(
    requests: Vec<serde_json::Value>,
) -> Result<Vec<BatchResponse>, String> {
    let config = RateLimitConfig::default();
    let mut rate_limiter = RateLimiter::new(config);

    let batch_requests: Result<Vec<BatchRequest>, _> = requests.into_iter()
        .map(|req| serde_json::from_value(req))
        .collect();

    let batch_requests = batch_requests
        .map_err(|e| format!("Failed to parse batch requests: {}", e))?;

    rate_limiter.execute_batch(batch_requests).await
        .map_err(|e| e.to_string())
}

// Helper functions

fn extract_headers(response: &reqwest::Response) -> HashMap<String, String> {
    let mut headers = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            headers.insert(key.to_string(), value_str.to_string());
        }
    }
    headers
}

fn extract_path(url: &str) -> String {
    if let Ok(parsed) = url::Url::parse(url) {
        format!("{}{}", parsed.path(), 
                parsed.query().map(|q| format!("?{}", q)).unwrap_or_default())
    } else {
        url.to_string()
    }
}

// Additional dependencies needed
use uuid;
use url;