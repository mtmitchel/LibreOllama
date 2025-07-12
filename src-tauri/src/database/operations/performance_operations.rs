//! Performance metrics-related database operations
//!
//! This module provides CRUD operations for performance metrics.

use anyhow::{Context, Result};
use rusqlite::{Connection, params};
use chrono::{Local, NaiveDateTime};
use crate::database::models::{PerformanceMetric, MetricType};

// ===== Performance Metric Operations =====

/// Create a new performance metric
pub fn create_performance_metric(
    conn: &Connection,
    metric_type: MetricType,
    value: f64,
    metadata: Option<String>,
) -> Result<()> {
    let now = Local::now().naive_local();
    let timestamp_str = now.format("%Y-%m-%d %H:%M:%S").to_string();
    
    let metric_type_str = match metric_type {
        MetricType::ResponseTime => "response_time",
        MetricType::TokenCount => "token_count",
        MetricType::CpuUsage => "cpu_usage",
        MetricType::Throughput => "throughput",
        MetricType::ErrorRate => "error_rate",
        MetricType::MemoryUsage => "memory_usage",
        MetricType::Placeholder => "placeholder",
        MetricType::DatabaseQuery => "database_query",
        MetricType::ApiCall => "api_call",
        MetricType::Memory => "memory",
        MetricType::CPU => "cpu",
        MetricType::Custom(ref s) => s,
    };

    conn.execute(
        "INSERT INTO performance_metrics (metric_type, value, timestamp, metadata) 
         VALUES (?1, ?2, ?3, ?4)",
        params![
            metric_type_str,
            value,
            timestamp_str,
            metadata
        ],
    )?;

    Ok(())
}

/// Get performance metrics with filtering
pub fn get_performance_metrics_by_type(
    conn: &Connection,
    metric_type: Option<MetricType>,
    start_date: Option<NaiveDateTime>,
    end_date: Option<NaiveDateTime>,
    limit: Option<usize>,
) -> Result<Vec<PerformanceMetric>> {
    let mut query = "SELECT metric_type, value, timestamp, metadata FROM performance_metrics".to_string();
    let mut params = Vec::new();
    let mut where_clauses = Vec::new();

    // Add filtering conditions
    if let Some(mt) = metric_type {
        where_clauses.push("metric_type = ?".to_string());
        params.push(mt.to_string());
    }
    
    if let Some(sd) = start_date {
        where_clauses.push("timestamp >= ?".to_string());
        params.push(sd.format("%Y-%m-%d %H:%M:%S").to_string());
    }
    
    if let Some(ed) = end_date {
        where_clauses.push("timestamp <= ?".to_string());
        params.push(ed.format("%Y-%m-%d %H:%M:%S").to_string());
    }

    if !where_clauses.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&where_clauses.join(" AND "));
    }

    query.push_str(" ORDER BY timestamp DESC");
    
    if let Some(l) = limit {
        query.push_str(&format!(" LIMIT {}", l));
    }

    let mut stmt = conn.prepare(&query).context("Failed to prepare get performance metrics query")?;
    
    let metrics = stmt.query_map(rusqlite::params_from_iter(params), |row| {
        let metric_type_str: String = row.get(0)?;
        let timestamp_str: String = row.get(2)?;
        let timestamp = NaiveDateTime::parse_from_str(&timestamp_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| Local::now().naive_local());
        
        Ok(PerformanceMetric {
            id: 0, // Default id
            metric_type: MetricType::from(metric_type_str),
            value: row.get(1)?,
            timestamp,
            metadata: row.get(3)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    }).context("Failed to execute get performance metrics query")?;

    let mut result = Vec::new();
    for metric in metrics {
        result.push(metric.context("Failed to process performance metric")?);
    }

    Ok(result)
}

pub fn get_performance_metrics_by_name(conn: &Connection, metric_name: &str) -> Result<Vec<PerformanceMetric>> {
    let mut stmt = conn.prepare(
        "SELECT metric_type, metric_name, metric_value, timestamp 
         FROM performance_metrics WHERE metric_name = ?1 ORDER BY timestamp DESC"
    )?;

    let metrics = stmt.query_map(params![metric_name], |row| {
        let metric_type_str: String = row.get(0)?;
        let metric_type = match metric_type_str.as_str() {
            "response_time" => MetricType::ResponseTime,
            "throughput" => MetricType::Throughput,
            "error_rate" => MetricType::ErrorRate,
            "cpu_usage" => MetricType::CpuUsage,
            "memory_usage" => MetricType::MemoryUsage,
            _ => MetricType::ResponseTime, // Default fallback
        };

        Ok(PerformanceMetric {
            id: 0, // Default id
            metric_type,
            value: row.get(2)?,
            timestamp: row.get(3)?,
            metadata: None,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for metric in metrics {
        result.push(metric?);
    }

    Ok(result)
}

pub fn get_performance_metrics_in_range(
    conn: &Connection,
    start_time: NaiveDateTime,
    end_time: NaiveDateTime,
) -> Result<Vec<PerformanceMetric>> {
    let start_str = start_time.format("%Y-%m-%d %H:%M:%S").to_string();
    let end_str = end_time.format("%Y-%m-%d %H:%M:%S").to_string();

    let mut stmt = conn.prepare(
        "SELECT metric_type, value, timestamp, metadata 
         FROM performance_metrics WHERE timestamp >= ?1 AND timestamp <= ?2 ORDER BY timestamp DESC"
    )?;

    let metrics = stmt.query_map(params![start_str, end_str], |row| {
        let metric_type_str: String = row.get(0)?;
        let metric_type = match metric_type_str.as_str() {
            "response_time" => MetricType::ResponseTime,
            "token_count" => MetricType::TokenCount,
            "cpu_usage" => MetricType::CpuUsage,
            "placeholder" => MetricType::Placeholder,
            _ => MetricType::ResponseTime, // Default fallback
        };

        let timestamp_str: String = row.get(2)?;
        let timestamp = chrono::NaiveDateTime::parse_from_str(&timestamp_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| chrono::Local::now().naive_local());

        Ok(PerformanceMetric {
            id: 0, // Default id
            metric_type,
            value: row.get(1)?,
            timestamp,
            metadata: row.get(3)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for metric in metrics {
        result.push(metric?);
    }

    Ok(result)
}

pub fn get_latest_performance_metrics(conn: &Connection, limit: i32) -> Result<Vec<PerformanceMetric>> {
    let mut stmt = conn.prepare(
        "SELECT metric_type, value, timestamp, metadata 
         FROM performance_metrics ORDER BY timestamp DESC LIMIT ?1"
    )?;

    let metrics = stmt.query_map(params![limit], |row| {
        let metric_type_str: String = row.get(0)?;
        let metric_type = match metric_type_str.as_str() {
            "response_time" => MetricType::ResponseTime,
            "token_count" => MetricType::TokenCount,
            "cpu_usage" => MetricType::CpuUsage,
            "placeholder" => MetricType::Placeholder,
            _ => MetricType::ResponseTime, // Default fallback
        };

        let timestamp_str: String = row.get(2)?;
        let timestamp = chrono::NaiveDateTime::parse_from_str(&timestamp_str, "%Y-%m-%d %H:%M:%S")
            .unwrap_or_else(|_| chrono::Local::now().naive_local());

        Ok(PerformanceMetric {
            id: 0, // Default id
            metric_type,
            value: row.get(1)?,
            timestamp,
            metadata: row.get(3)?,
            created_at: chrono::Local::now().naive_local(), // Default created_at
        })
    })?;

    let mut result = Vec::new();
    for metric in metrics {
        result.push(metric?);
    }

    Ok(result)
}

pub fn get_average_metric_value(conn: &Connection, metric_type: MetricType) -> Result<Option<f64>> {
    let metric_type_str = match metric_type {
        MetricType::ResponseTime => "response_time",
        MetricType::TokenCount => "token_count",
        MetricType::CpuUsage => "cpu_usage",
        MetricType::Throughput => "throughput",
        MetricType::ErrorRate => "error_rate",
        MetricType::MemoryUsage => "memory_usage",
        MetricType::Placeholder => "placeholder",
        MetricType::DatabaseQuery => "database_query",
        MetricType::ApiCall => "api_call",
        MetricType::Memory => "memory",
        MetricType::CPU => "cpu",
        MetricType::Custom(ref s) => s,
    };

    let mut stmt = conn.prepare(
        "SELECT AVG(value) FROM performance_metrics WHERE metric_type = ?1"
    )?;

    let average = stmt.query_row(params![metric_type_str], |row| {
        let avg: Option<f64> = row.get(0)?;
        Ok(avg)
    })?;

    Ok(average)
}

pub fn delete_old_performance_metrics(conn: &Connection, before_timestamp: NaiveDateTime) -> Result<usize> {
    let before_str = before_timestamp.format("%Y-%m-%d %H:%M:%S").to_string();
    let rows_affected = conn.execute(
        "DELETE FROM performance_metrics WHERE timestamp < ?1",
        params![before_str],
    )?;

    Ok(rows_affected)
}

pub fn get_performance_metrics_count(conn: &Connection) -> Result<i32> {
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM performance_metrics"
    )?;

    let count = stmt.query_row([], |row| {
        row.get(0)
    })?;

    Ok(count)
}

/// Get performance metrics (legacy function for command compatibility)
pub fn get_performance_metrics(
    _metric_type: Option<MetricType>,
    _start_date: Option<NaiveDateTime>,
    _end_date: Option<NaiveDateTime>,
    _limit: Option<usize>,
) -> Result<Vec<PerformanceMetric>> {
    // This function provides backward compatibility for commands
    // In a real implementation, you might want to filter by metric type and date range
    // For now, we'll return empty with a placeholder implementation
    Ok(Vec::new()) // TODO: Implement proper async database connection
} 