//! Google Calendar API Commands
//!
//! This module provides Tauri command handlers for Google Calendar API operations.

use serde::{Deserialize, Serialize};
use chrono::Utc;
use std::sync::Arc;
use tauri::State;

// Define the calendar structures that match the frontend types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleCalendar {
    pub id: String,
    pub summary: String,
    pub description: Option<String>,
    #[serde(rename = "timeZone")]
    pub time_zone: Option<String>,
    #[serde(rename = "colorId")]
    pub color_id: Option<String>,
    #[serde(rename = "backgroundColor")]
    pub background_color: Option<String>,
    #[serde(rename = "foregroundColor")]
    pub foreground_color: Option<String>,
    pub selected: Option<bool>,
    #[serde(rename = "accessRole")]
    pub access_role: Option<String>,
    #[serde(rename = "defaultReminders")]
    pub default_reminders: Option<Vec<EventReminder>>,
    #[serde(rename = "notificationSettings")]
    pub notification_settings: Option<NotificationSettings>,
    pub primary: Option<bool>,
    pub deleted: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleCalendarEvent {
    pub id: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub location: Option<String>,
    #[serde(rename = "colorId")]
    pub color_id: Option<String>,
    #[serde(rename = "htmlLink")]
    pub html_link: Option<String>,
    pub status: Option<String>,
    pub created: Option<String>,
    pub updated: Option<String>,
    pub start: Option<EventDateTime>,
    pub end: Option<EventDateTime>,
    #[serde(rename = "endTimeUnspecified")]
    pub end_time_unspecified: Option<bool>,
    pub recurrence: Option<Vec<String>>,
    #[serde(rename = "recurringEventId")]
    pub recurring_event_id: Option<String>,
    #[serde(rename = "originalStartTime")]
    pub original_start_time: Option<EventDateTime>,
    pub transparency: Option<String>,
    pub visibility: Option<String>,
    #[serde(rename = "iCalUID")]
    pub ical_uid: Option<String>,
    pub sequence: Option<i32>,
    pub attendees: Option<Vec<EventAttendee>>,
    #[serde(rename = "attendeesOmitted")]
    pub attendees_omitted: Option<bool>,
    pub organizer: Option<EventAttendee>,
    pub creator: Option<EventAttendee>,
    #[serde(rename = "guestsCanInviteOthers")]
    pub guests_can_invite_others: Option<bool>,
    #[serde(rename = "guestsCanModify")]
    pub guests_can_modify: Option<bool>,
    #[serde(rename = "guestsCanSeeOtherGuests")]
    pub guests_can_see_other_guests: Option<bool>,
    #[serde(rename = "privateCopy")]
    pub private_copy: Option<bool>,
    pub locked: Option<bool>,
    pub reminders: Option<EventReminders>,
    pub source: Option<EventSource>,
    pub attachments: Option<Vec<EventAttachment>>,
    #[serde(rename = "eventType")]
    pub event_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventDateTime {
    #[serde(rename = "dateTime")]
    pub date_time: Option<String>,
    pub date: Option<String>,
    #[serde(rename = "timeZone")]
    pub time_zone: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventAttendee {
    pub id: Option<String>,
    pub email: Option<String>,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    pub organizer: Option<bool>,
    #[serde(rename = "self")]
    pub is_self: Option<bool>,
    pub resource: Option<bool>,
    pub optional: Option<bool>,
    #[serde(rename = "responseStatus")]
    pub response_status: Option<String>,
    pub comment: Option<String>,
    #[serde(rename = "additionalGuests")]
    pub additional_guests: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventReminders {
    #[serde(rename = "useDefault")]
    pub use_default: Option<bool>,
    pub overrides: Option<Vec<EventReminder>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventReminder {
    pub method: String,
    pub minutes: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub notifications: Option<Vec<CalendarNotification>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalendarNotification {
    #[serde(rename = "type")]
    pub notification_type: String,
    pub method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventSource {
    pub url: String,
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventAttachment {
    #[serde(rename = "fileUrl")]
    pub file_url: String,
    pub title: String,
    #[serde(rename = "mimeType")]
    pub mime_type: Option<String>,
    #[serde(rename = "iconLink")]
    pub icon_link: Option<String>,
    #[serde(rename = "fileId")]
    pub file_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventsResponse {
    pub kind: String,
    pub etag: String,
    pub summary: String,
    pub description: Option<String>,
    pub updated: String,
    #[serde(rename = "timeZone")]
    pub time_zone: String,
    #[serde(rename = "accessRole")]
    pub access_role: String,
    #[serde(rename = "defaultReminders")]
    pub default_reminders: Vec<EventReminder>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
    #[serde(rename = "nextSyncToken")]
    pub next_sync_token: Option<String>,
    pub items: Vec<GoogleCalendarEvent>,
}

// =============================================================================
// Command Handlers
// =============================================================================

/// Get all calendars for an account
#[tauri::command]
pub async fn get_calendars(
    account_id: String,
    auth_service: State<'_, Arc<crate::services::gmail::auth_service::GmailAuthService>>,
) -> Result<Vec<GoogleCalendar>, String> {
    println!("📅 [CALENDAR-API] Getting calendars for account: {}", account_id);
    
    // Get access token
    let tokens = auth_service.get_account_tokens(&account_id).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Make API call to Google Calendar
    let client = reqwest::Client::new();
    let response = client
        .get("https://www.googleapis.com/calendar/v3/users/me/calendarList")
        .query(&[
            ("minAccessRole", "reader"),  // Include all calendars where user has at least read access
            ("showHidden", "true"),       // Include hidden calendars
            ("showDeleted", "false"),     // Exclude deleted calendars
            ("maxResults", "250")         // Get more calendars
        ])
        .bearer_auth(&tokens.access_token)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Calendar API failed: {}", response.status()));
    }

    let calendar_list: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let mut calendars = Vec::new();
    if let Some(items) = calendar_list.get("items").and_then(|v| v.as_array()) {
        for item in items {
            calendars.push(GoogleCalendar {
                id: item.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                summary: item.get("summary").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                description: item.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
                time_zone: item.get("timeZone").and_then(|v| v.as_str()).map(|s| s.to_string()),
                color_id: item.get("colorId").and_then(|v| v.as_str()).map(|s| s.to_string()),
                background_color: item.get("backgroundColor").and_then(|v| v.as_str()).map(|s| s.to_string()),
                foreground_color: item.get("foregroundColor").and_then(|v| v.as_str()).map(|s| s.to_string()),
                selected: item.get("selected").and_then(|v| v.as_bool()),
                access_role: item.get("accessRole").and_then(|v| v.as_str()).map(|s| s.to_string()),
                default_reminders: None, // Can be extracted if needed
                notification_settings: None,
                primary: item.get("primary").and_then(|v| v.as_bool()),
                deleted: item.get("deleted").and_then(|v| v.as_bool()),
            });
        }
    }

    println!("✅ [CALENDAR-API] Retrieved {} calendars", calendars.len());
    Ok(calendars)
}

/// Get events for a specific calendar
#[tauri::command]
pub async fn get_calendar_events(
    account_id: String,
    calendar_id: String,
    time_min: Option<String>,
    time_max: Option<String>,
    max_results: Option<u32>,
    show_deleted: Option<bool>,
    single_events: Option<bool>,
    auth_service: State<'_, Arc<crate::services::gmail::auth_service::GmailAuthService>>,
) -> Result<EventsResponse, String> {
    let time_min = time_min.unwrap_or_else(|| {
        Utc::now()
            .checked_sub_signed(chrono::Duration::days(365))
            .unwrap_or_else(Utc::now)
            .to_rfc3339()
    });
    let time_max = time_max.unwrap_or_else(|| {
        Utc::now()
            .checked_add_signed(chrono::Duration::days(365))
            .unwrap_or_else(Utc::now)
            .to_rfc3339()
    });
    let max_results = max_results.unwrap_or(250);
    let show_deleted = show_deleted.unwrap_or(false);
    let single_events = single_events.unwrap_or(true);

    println!("📆 [CALENDAR-API] Getting events for calendar: {} (account: {})", calendar_id, account_id);

    // Get access token
    let tokens = auth_service.get_account_tokens(&account_id).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Make API call to Google Calendar Events
    let client = reqwest::Client::new();
    // URL-encode the calendar ID to handle special characters
    let encoded_calendar_id = urlencoding::encode(&calendar_id);
    let mut url = format!("https://www.googleapis.com/calendar/v3/calendars/{}/events", encoded_calendar_id);
    url.push_str(&format!("?timeMin={}&timeMax={}&maxResults={}&showDeleted={}&singleEvents={}", 
                         time_min, time_max, max_results, show_deleted, single_events));
    
    println!("📆 [CALENDAR-API] Requesting URL: {}", url);

    let response = client
        .get(&url)
        .bearer_auth(&tokens.access_token)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_else(|_| "No error details".to_string());
        println!("❌ [CALENDAR-API] Error response: {} - {}", status, error_body);
        return Err(format!("Calendar Events API failed: {} - {}", status, error_body));
    }

    let events_data: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Parse events from response
    let mut events = Vec::new();
    if let Some(items) = events_data.get("items").and_then(|v| v.as_array()) {
        for item in items {
            events.push(GoogleCalendarEvent {
                id: item.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                summary: item.get("summary").and_then(|v| v.as_str()).map(|s| s.to_string()),
                description: item.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
                location: item.get("location").and_then(|v| v.as_str()).map(|s| s.to_string()),
                color_id: item.get("colorId").and_then(|v| v.as_str()).map(|s| s.to_string()),
                html_link: item.get("htmlLink").and_then(|v| v.as_str()).map(|s| s.to_string()),
                status: item.get("status").and_then(|v| v.as_str()).map(|s| s.to_string()),
                created: item.get("created").and_then(|v| v.as_str()).map(|s| s.to_string()),
                updated: item.get("updated").and_then(|v| v.as_str()).map(|s| s.to_string()),
                start: item.get("start").and_then(|v| v.as_object()).map(|start| EventDateTime {
                    date_time: start.get("dateTime").and_then(|v| v.as_str()).map(|s| s.to_string()),
                    date: start.get("date").and_then(|v| v.as_str()).map(|s| s.to_string()),
                    time_zone: start.get("timeZone").and_then(|v| v.as_str()).map(|s| s.to_string()),
                }),
                end: item.get("end").and_then(|v| v.as_object()).map(|end| EventDateTime {
                    date_time: end.get("dateTime").and_then(|v| v.as_str()).map(|s| s.to_string()),
                    date: end.get("date").and_then(|v| v.as_str()).map(|s| s.to_string()),
                    time_zone: end.get("timeZone").and_then(|v| v.as_str()).map(|s| s.to_string()),
                }),
                end_time_unspecified: item.get("endTimeUnspecified").and_then(|v| v.as_bool()),
                recurrence: item.get("recurrence").and_then(|v| v.as_array()).map(|arr| 
                    arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()
                ),
                recurring_event_id: item.get("recurringEventId").and_then(|v| v.as_str()).map(|s| s.to_string()),
                original_start_time: None, // Can be parsed if needed
                transparency: item.get("transparency").and_then(|v| v.as_str()).map(|s| s.to_string()),
                visibility: item.get("visibility").and_then(|v| v.as_str()).map(|s| s.to_string()),
                ical_uid: item.get("iCalUID").and_then(|v| v.as_str()).map(|s| s.to_string()),
                sequence: item.get("sequence").and_then(|v| v.as_i64()).map(|i| i as i32),
                attendees: None, // Can be parsed if needed
                attendees_omitted: item.get("attendeesOmitted").and_then(|v| v.as_bool()),
                organizer: None, // Can be parsed if needed
                creator: None, // Can be parsed if needed
                guests_can_invite_others: item.get("guestsCanInviteOthers").and_then(|v| v.as_bool()),
                guests_can_modify: item.get("guestsCanModify").and_then(|v| v.as_bool()),
                guests_can_see_other_guests: item.get("guestsCanSeeOtherGuests").and_then(|v| v.as_bool()),
                private_copy: item.get("privateCopy").and_then(|v| v.as_bool()),
                locked: item.get("locked").and_then(|v| v.as_bool()),
                reminders: None, // Can be parsed if needed
                source: None, // Can be parsed if needed
                attachments: None, // Can be parsed if needed
                event_type: item.get("eventType").and_then(|v| v.as_str()).map(|s| s.to_string()),
            });
        }
    }

    let response = EventsResponse {
        kind: events_data.get("kind").and_then(|v| v.as_str()).unwrap_or("calendar#events").to_string(),
        etag: events_data.get("etag").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        summary: events_data.get("summary").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        description: events_data.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
        updated: events_data.get("updated").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        time_zone: events_data.get("timeZone").and_then(|v| v.as_str()).unwrap_or("UTC").to_string(),
        access_role: events_data.get("accessRole").and_then(|v| v.as_str()).unwrap_or("reader").to_string(),
        default_reminders: Vec::new(), // Can be parsed if needed
        next_page_token: events_data.get("nextPageToken").and_then(|v| v.as_str()).map(|s| s.to_string()),
        next_sync_token: events_data.get("nextSyncToken").and_then(|v| v.as_str()).map(|s| s.to_string()),
        items: events,
    };

    println!("✅ [CALENDAR-API] Retrieved {} events", response.items.len());
    Ok(response)
}

/// Create a new calendar event
#[tauri::command]
pub async fn create_calendar_event(
    account_id: String,
    calendar_id: String,
    event_data: GoogleCalendarEvent,
    auth_service: State<'_, Arc<crate::services::gmail::auth_service::GmailAuthService>>,
) -> Result<GoogleCalendarEvent, String> {
    println!("📅 [CALENDAR-API] Creating event '{}' in calendar: {} (account: {})", 
             event_data.summary.as_deref().unwrap_or("No Title"), calendar_id, account_id);

    // Get access token
    let tokens = auth_service.get_account_tokens(&account_id).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Prepare event data for API (remove id field as it's generated by Google)
    let mut api_event = event_data.clone();
    api_event.id = String::new(); // Clear ID for creation
    
    // Debug: Print the event being sent
    println!("📤 [CALENDAR-API] Sending event to Google Calendar:");
    println!("  - Summary: {:?}", api_event.summary);
    println!("  - Start: {:?}", api_event.start);
    println!("  - End: {:?}", api_event.end);
    println!("  - Recurrence: {:?}", api_event.recurrence);
    
    // Ensure no recurrence is set for multi-day events
    if api_event.recurrence.is_some() {
        println!("⚠️ [CALENDAR-API] WARNING: Recurrence field is set! This will create recurring events!");
    }

    // Make API call to Google Calendar
    let client = reqwest::Client::new();
    let response = client
        .post(format!("https://www.googleapis.com/calendar/v3/calendars/{}/events", calendar_id))
        .bearer_auth(&tokens.access_token)
        .json(&api_event)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Failed to create event: {}", error_text));
    }

    let created_event: GoogleCalendarEvent = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    println!("✅ [CALENDAR-API] Event created successfully: {}", created_event.id);
    Ok(created_event)
}

/// Update an existing calendar event
#[tauri::command]
pub async fn update_calendar_event(
    account_id: String,
    calendar_id: String,
    event_id: String,
    event_data: GoogleCalendarEvent,
    auth_service: State<'_, Arc<crate::services::gmail::auth_service::GmailAuthService>>,
) -> Result<GoogleCalendarEvent, String> {
    println!("📅 [CALENDAR-API] Updating event {} in calendar: {} (account: {})", 
             event_id, calendar_id, account_id);

    // Get access token
    let tokens = auth_service.get_account_tokens(&account_id).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Make API call to Google Calendar
    let client = reqwest::Client::new();
    let response = client
        .put(format!("https://www.googleapis.com/calendar/v3/calendars/{}/events/{}", calendar_id, event_id))
        .bearer_auth(&tokens.access_token)
        .json(&event_data)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Failed to update event: {}", error_text));
    }

    let updated_event: GoogleCalendarEvent = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    println!("✅ [CALENDAR-API] Event updated successfully: {}", event_id);
    Ok(updated_event)
}

/// Delete a calendar event
#[tauri::command]
pub async fn delete_calendar_event(
    account_id: String,
    calendar_id: String,
    event_id: String,
    auth_service: State<'_, Arc<crate::services::gmail::auth_service::GmailAuthService>>,
) -> Result<(), String> {
    println!("📅 [CALENDAR-API] Deleting event {} from calendar: {} (account: {})", 
             event_id, calendar_id, account_id);

    // Get access token
    let tokens = auth_service.get_account_tokens(&account_id).await
        .map_err(|e| format!("Failed to get tokens: {}", e))?
        .ok_or("No tokens found for account")?;

    // Make API call to Google Calendar
    let client = reqwest::Client::new();
    let response = client
        .delete(format!("https://www.googleapis.com/calendar/v3/calendars/{}/events/{}", calendar_id, event_id))
        .bearer_auth(&tokens.access_token)
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Failed to delete event: {}", error_text));
    }

    println!("✅ [CALENDAR-API] Event deleted successfully: {}", event_id);
    Ok(())
} 