#![cfg(feature = "gmail-compose")]
//! Gmail Contacts Commands
//!
//! This module provides Tauri command handlers for Gmail contacts management,
//! including fetching contacts from Google People API.

use tauri::State;
use std::sync::Arc;
use serde::{Deserialize, Serialize};

use crate::services::gmail::auth_service::GmailAuthService;

// =============================================================================
// Data Structures
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub photo_url: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub job_title: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PeopleApiResponse {
    connections: Option<Vec<PersonConnection>>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PersonConnection {
    #[serde(rename = "resourceName")]
    resource_name: String,
    names: Option<Vec<Name>>,
    #[serde(rename = "emailAddresses")]
    email_addresses: Option<Vec<EmailAddress>>,
    photos: Option<Vec<Photo>>,
    #[serde(rename = "phoneNumbers")]
    phone_numbers: Option<Vec<PhoneNumber>>,
    organizations: Option<Vec<Organization>>,
}

#[derive(Debug, Deserialize)]
struct Name {
    #[serde(rename = "displayName")]
    display_name: Option<String>,
    #[serde(rename = "givenName")]
    given_name: Option<String>,
    #[serde(rename = "familyName")]
    family_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct EmailAddress {
    value: String,
}

#[derive(Debug, Deserialize)]
struct Photo {
    url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PhoneNumber {
    value: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Organization {
    name: Option<String>,
    title: Option<String>,
}

// =============================================================================
// Command Handlers
// =============================================================================

/// Get Gmail contacts for an account using Google People API
#[tauri::command]
pub async fn get_gmail_contacts(
    account_id: String,
    max_results: Option<u32>,
    page_token: Option<String>,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<Vec<Contact>, String> {
    // Get auth tokens
    let tokens = auth_service
        .inner()
        .get_account_tokens(&account_id)
        .await
        .map_err(|e| format!("Failed to get auth tokens: {}", e))?
        .ok_or_else(|| "No tokens found for account".to_string())?;

    let access_token = tokens.access_token;

    // Build request URL
    let mut url = format!(
        "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos,phoneNumbers,organizations"
    );
    
    if let Some(max) = max_results {
        url.push_str(&format!("&pageSize={}", max.min(1000)));
    } else {
        url.push_str("&pageSize=100");
    }
    
    if let Some(token) = page_token {
        url.push_str(&format!("&pageToken={}", token));
    }

    // Make API request
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch contacts: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Failed to fetch contacts: {}", error_text));
    }

    let api_response: PeopleApiResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse contacts response: {}", e))?;

    // Convert to our Contact format
    let contacts = if let Some(connections) = api_response.connections {
        connections
            .into_iter()
            .filter_map(|person| {
                // Must have at least one email
                let email_addresses = person.email_addresses?;
                if email_addresses.is_empty() {
                    return None;
                }

                let primary_email = email_addresses[0].value.clone();
                
                let name_info = person.names.and_then(|names| names.into_iter().next());
                let photo = person.photos.and_then(|photos| photos.into_iter().next());
                let phone = person.phone_numbers
                    .and_then(|phones| phones.into_iter().next())
                    .and_then(|p| p.value);
                let org = person.organizations.and_then(|orgs| orgs.into_iter().next());

                Some(Contact {
                    id: person.resource_name,
                    email: primary_email,
                    name: name_info.as_ref().and_then(|n| n.display_name.clone()),
                    first_name: name_info.as_ref().and_then(|n| n.given_name.clone()),
                    last_name: name_info.as_ref().and_then(|n| n.family_name.clone()),
                    photo_url: photo.and_then(|p| p.url),
                    phone,
                    company: org.as_ref().and_then(|o| o.name.clone()),
                    job_title: org.and_then(|o| o.title),
                })
            })
            .collect()
    } else {
        Vec::new()
    };

    Ok(contacts)
}

/// Search Gmail contacts with a query
#[tauri::command]
pub async fn search_gmail_contacts(
    account_id: String,
    query: String,
    auth_service: State<'_, Arc<GmailAuthService>>,
) -> Result<Vec<Contact>, String> {
    // For now, we'll fetch all contacts and filter client-side
    // In a production app, you might want to use the People API's search functionality
    let all_contacts = get_gmail_contacts(account_id, Some(500), None, auth_service).await?;
    
    let query_lower = query.to_lowercase();
    let filtered: Vec<Contact> = all_contacts
        .into_iter()
        .filter(|contact| {
            contact.email.to_lowercase().contains(&query_lower) ||
            contact.name.as_ref().map_or(false, |n| n.to_lowercase().contains(&query_lower)) ||
            contact.company.as_ref().map_or(false, |c| c.to_lowercase().contains(&query_lower))
        })
        .take(20) // Limit results
        .collect();
    
    Ok(filtered)
}