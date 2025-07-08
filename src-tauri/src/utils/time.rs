//! Time utilities for LibreOllama
//!
//! Provides common time handling, formatting, and parsing functions.

use chrono::{DateTime, NaiveDateTime, Utc};

/// Format timestamp for display
pub fn format_timestamp(timestamp: &DateTime<Utc>) -> String {
    timestamp.format("%Y-%m-%d %H:%M:%S UTC").to_string()
}

/// Parse RFC3339 timestamp
pub fn parse_rfc3339(timestamp: &str) -> Result<DateTime<Utc>, String> {
    DateTime::parse_from_rfc3339(timestamp)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| format!("Failed to parse timestamp: {}", e))
}

/// Get current timestamp as string
pub fn current_timestamp() -> String {
    Utc::now().to_rfc3339()
}

/// Parse naive datetime from string
pub fn parse_naive_datetime(datetime_str: &str) -> Result<NaiveDateTime, String> {
    NaiveDateTime::parse_from_str(datetime_str, "%Y-%m-%d %H:%M:%S")
        .map_err(|e| format!("Failed to parse datetime: {}", e))
}

/// Calculate time ago in human readable format
pub fn time_ago(timestamp: &DateTime<Utc>) -> String {
    let now = Utc::now();
    let duration = now.signed_duration_since(*timestamp);
    
    if duration.num_seconds() < 60 {
        "just now".to_string()
    } else if duration.num_minutes() < 60 {
        format!("{} minute{} ago", duration.num_minutes(), 
                if duration.num_minutes() == 1 { "" } else { "s" })
    } else if duration.num_hours() < 24 {
        format!("{} hour{} ago", duration.num_hours(),
                if duration.num_hours() == 1 { "" } else { "s" })
    } else {
        format!("{} day{} ago", duration.num_days(),
                if duration.num_days() == 1 { "" } else { "s" })
    }
} 