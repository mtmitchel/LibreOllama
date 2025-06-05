//! Database models for Phase 3.3 advanced features
//!
//! This module contains additional data models for context management,
//! chat templates, performance metrics, and other advanced features.

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Conversation context for memory management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationContext {
    pub id: String,
    pub session_id: String,
    pub context_window_size: i32,
    pub context_summary: Option<String>,
    pub token_count: i32,
    pub last_updated: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

impl ConversationContext {
    pub fn new(session_id: String, context_window_size: Option<i32>) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            session_id,
            context_window_size: context_window_size.unwrap_or(4096),
            context_summary: None,
            token_count: 0,
            last_updated: Utc::now(),
            created_at: Utc::now(),
        }
    }

    pub fn update_context(&mut self, new_token_count: i32, summary: Option<String>) {
        self.token_count = new_token_count;
        self.context_summary = summary;
        self.last_updated = Utc::now();
    }
}

/// Chat template for conversation presets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatTemplate {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub system_message: Option<String>,
    pub initial_prompts: Option<String>, // JSON array
    pub model_config: Option<String>, // JSON config
    pub is_default: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub usage_count: i32,
}

impl ChatTemplate {
    pub fn new(name: String, description: Option<String>, system_message: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            system_message,
            initial_prompts: None,
            model_config: None,
            is_default: false,
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            usage_count: 0,
        }
    }

    pub fn increment_usage(&mut self) {
        self.usage_count += 1;
        self.updated_at = Utc::now();
    }
}

/// Conversation branch for forking conversations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationBranch {
    pub id: String,
    pub parent_session_id: String,
    pub branch_session_id: String,
    pub branch_point_message_id: String,
    pub branch_name: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl ConversationBranch {
    pub fn new(
        parent_session_id: String,
        branch_session_id: String,
        branch_point_message_id: String,
        branch_name: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            parent_session_id,
            branch_session_id,
            branch_point_message_id,
            branch_name,
            created_at: Utc::now(),
        }
    }
}

/// Performance metric types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MetricType {
    ResponseTime,
    TokenGenerationRate,
    MemoryUsage,
    CacheHitRate,
    ModelLoadTime,
    StreamingLatency,
}

impl std::fmt::Display for MetricType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MetricType::ResponseTime => write!(f, "response_time"),
            MetricType::TokenGenerationRate => write!(f, "token_generation_rate"),
            MetricType::MemoryUsage => write!(f, "memory_usage"),
            MetricType::CacheHitRate => write!(f, "cache_hit_rate"),
            MetricType::ModelLoadTime => write!(f, "model_load_time"),
            MetricType::StreamingLatency => write!(f, "streaming_latency"),
        }
    }
}

impl From<String> for MetricType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "response_time" => MetricType::ResponseTime,
            "token_generation_rate" => MetricType::TokenGenerationRate,
            "memory_usage" => MetricType::MemoryUsage,
            "cache_hit_rate" => MetricType::CacheHitRate,
            "model_load_time" => MetricType::ModelLoadTime,
            "streaming_latency" => MetricType::StreamingLatency,
            _ => MetricType::ResponseTime, // Default fallback
        }
    }
}

/// Performance metric entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetric {
    pub id: String,
    pub metric_type: MetricType,
    pub metric_value: f64,
    pub session_id: Option<String>,
    pub model_name: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub metadata: Option<String>, // JSON
}

impl PerformanceMetric {
    pub fn new(
        metric_type: MetricType,
        metric_value: f64,
        session_id: Option<String>,
        model_name: Option<String>,
        metadata: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            metric_type,
            metric_value,
            session_id,
            model_name,
            timestamp: Utc::now(),
            metadata,
        }
    }
}

/// Model analytics for performance tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelAnalytics {
    pub id: String,
    pub model_name: String,
    pub total_requests: i32,
    pub total_tokens_generated: i64,
    pub average_response_time: f64,
    pub last_used: Option<DateTime<Utc>>,
    pub performance_score: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl ModelAnalytics {
    pub fn new(model_name: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            model_name,
            total_requests: 0,
            total_tokens_generated: 0,
            average_response_time: 0.0,
            last_used: None,
            performance_score: 0.0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    pub fn update_usage(&mut self, response_time: f64, tokens_generated: i32) {
        self.total_requests += 1;
        self.total_tokens_generated += tokens_generated as i64;
        
        // Update average response time
        self.average_response_time = 
            (self.average_response_time * (self.total_requests - 1) as f64 + response_time) 
            / self.total_requests as f64;
        
        self.last_used = Some(Utc::now());
        self.updated_at = Utc::now();
        
        // Calculate performance score (tokens per second)
        if response_time > 0.0 {
            self.performance_score = tokens_generated as f64 / (response_time / 1000.0);
        }
    }
}

/// Request cache entry for performance optimization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestCache {
    pub id: String,
    pub request_hash: String,
    pub model_name: String,
    pub prompt_text: String,
    pub response_text: String,
    pub response_metadata: Option<String>, // JSON
    pub hit_count: i32,
    pub created_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}

impl RequestCache {
    pub fn new(
        request_hash: String,
        model_name: String,
        prompt_text: String,
        response_text: String,
        response_metadata: Option<String>,
        expires_in_hours: Option<i64>,
    ) -> Self {
        let expires_at = expires_in_hours.map(|hours| {
            Utc::now() + chrono::Duration::hours(hours)
        });

        Self {
            id: Uuid::new_v4().to_string(),
            request_hash,
            model_name,
            prompt_text,
            response_text,
            response_metadata,
            hit_count: 1,
            created_at: Utc::now(),
            last_accessed: Utc::now(),
            expires_at,
        }
    }

    pub fn increment_hit(&mut self) {
        self.hit_count += 1;
        self.last_accessed = Utc::now();
    }

    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            Utc::now() > expires_at
        } else {
            false
        }
    }
}

/// Log levels for application logging
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
    Fatal,
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogLevel::Debug => write!(f, "DEBUG"),
            LogLevel::Info => write!(f, "INFO"),
            LogLevel::Warn => write!(f, "WARN"),
            LogLevel::Error => write!(f, "ERROR"),
            LogLevel::Fatal => write!(f, "FATAL"),
        }
    }
}

impl From<String> for LogLevel {
    fn from(s: String) -> Self {
        match s.as_str() {
            "DEBUG" => LogLevel::Debug,
            "INFO" => LogLevel::Info,
            "WARN" => LogLevel::Warn,
            "ERROR" => LogLevel::Error,
            "FATAL" => LogLevel::Fatal,
            _ => LogLevel::Info, // Default fallback
        }
    }
}

/// Application log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationLog {
    pub id: String,
    pub log_level: LogLevel,
    pub message: String,
    pub component: Option<String>,
    pub session_id: Option<String>,
    pub error_code: Option<String>,
    pub stack_trace: Option<String>,
    pub metadata: Option<String>, // JSON
    pub timestamp: DateTime<Utc>,
}

impl ApplicationLog {
    pub fn new(
        log_level: LogLevel,
        message: String,
        component: Option<String>,
        session_id: Option<String>,
        error_code: Option<String>,
        stack_trace: Option<String>,
        metadata: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            log_level,
            message,
            component,
            session_id,
            error_code,
            stack_trace,
            metadata,
            timestamp: Utc::now(),
        }
    }
}

/// User preference types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PreferenceType {
    String,
    Number,
    Boolean,
    Json,
}

impl std::fmt::Display for PreferenceType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PreferenceType::String => write!(f, "string"),
            PreferenceType::Number => write!(f, "number"),
            PreferenceType::Boolean => write!(f, "boolean"),
            PreferenceType::Json => write!(f, "json"),
        }
    }
}

impl From<String> for PreferenceType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "string" => PreferenceType::String,
            "number" => PreferenceType::Number,
            "boolean" => PreferenceType::Boolean,
            "json" => PreferenceType::Json,
            _ => PreferenceType::String, // Default fallback
        }
    }
}

/// User preference entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreference {
    pub id: String,
    pub preference_key: String,
    pub preference_value: String,
    pub preference_type: PreferenceType,
    pub description: Option<String>,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl UserPreference {
    pub fn new(
        preference_key: String,
        preference_value: String,
        preference_type: PreferenceType,
        description: Option<String>,
        is_system: bool,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            preference_key,
            preference_value,
            preference_type,
            description,
            is_system,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    pub fn update_value(&mut self, new_value: String) {
        self.preference_value = new_value;
        self.updated_at = Utc::now();
    }

    pub fn get_as_bool(&self) -> Option<bool> {
        match self.preference_type {
            PreferenceType::Boolean => self.preference_value.parse::<bool>().ok(),
            _ => None,
        }
    }

    pub fn get_as_number(&self) -> Option<f64> {
        match self.preference_type {
            PreferenceType::Number => self.preference_value.parse::<f64>().ok(),
            _ => None,
        }
    }
}