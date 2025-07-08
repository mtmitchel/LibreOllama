//! Onboarding-related database operations
//!
//! This module provides CRUD operations for user onboarding status.

use anyhow::Result;
use rusqlite::{Connection, OptionalExtension};

/// Onboarding status structure
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct OnboardingStatus {
    pub is_completed: bool,
    pub current_step: String,
    pub completed_steps: String, // JSON array
    pub selected_persona: Option<String>,
    pub ollama_setup_status: String,
    pub selected_models: String, // JSON array
    pub sample_data_created: bool,
    pub tour_progress: String, // JSON object
    pub started_at: String,
    pub completed_at: Option<String>,
}


/// Get onboarding status for a user
pub fn get_onboarding_status(conn: &Connection, user_id: &str) -> Result<Option<OnboardingStatus>> {
    let mut stmt = conn.prepare(
        "SELECT is_completed, current_step, completed_steps, selected_persona, 
                ollama_setup_status, selected_models, sample_data_created, 
                tour_progress, started_at, completed_at
         FROM user_onboarding 
         WHERE user_id = ?1"
    )?;

    let result = stmt.query_row([user_id], |row| {
        Ok(OnboardingStatus {
            is_completed: row.get(0)?,
            current_step: row.get(1)?,
            completed_steps: row.get(2)?,
            selected_persona: row.get(3)?,
            ollama_setup_status: row.get(4)?,
            selected_models: row.get(5)?,
            sample_data_created: row.get(6)?,
            tour_progress: row.get(7)?,
            started_at: row.get(8)?,
            completed_at: row.get(9)?,
        })
    }).optional()?;

    Ok(result)
}

/// Update onboarding status for a user
pub fn update_onboarding_status(
    conn: &Connection, 
    user_id: &str, 
    status: &OnboardingStatus
) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO user_onboarding 
         (id, user_id, is_completed, current_step, completed_steps, selected_persona,
          ollama_setup_status, selected_models, sample_data_created, tour_progress,
          started_at, completed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        [
            &format!("onboarding_{}", user_id),
            user_id,
            &status.is_completed.to_string(),
            &status.current_step,
            &status.completed_steps,
            status.selected_persona.as_deref().unwrap_or(""),
            &status.ollama_setup_status,
            &status.selected_models,
            &status.sample_data_created.to_string(),
            &status.tour_progress,
            &status.started_at,
            status.completed_at.as_deref().unwrap_or(""),
        ],
    )?;

    Ok(())
} 