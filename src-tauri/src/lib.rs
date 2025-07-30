// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// Import command modules
mod commands;
mod database;
mod models;
mod db;

// Import foundation modules
mod errors;
mod utils;
mod config;

// Import services module
mod services;

// Re-export commands for easy access
use commands::tasks::all_task_data::*;
use commands::tasks::metadata::*;
use commands::tasks::sync::*;

// Database imports
use std::sync::Arc;

// Import required services and configuration
use crate::config::ConfigManager;
use crate::services::gmail::{auth_service::GmailAuthService, api_service::GmailApiService, GmailCacheService, GmailSyncService};
use crate::services::google::tasks_service::GoogleTasksService;
use crate::commands::rate_limiter::RateLimiter;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_google_client_id() -> Result<String, String> {
    match ConfigManager::new() {
        Ok(config) => {
            let client_id = config.oauth().client_id.clone();
            if client_id.is_empty() {
                // In development mode, try to get from environment variable
                if let Ok(env_client_id) = std::env::var("GMAIL_CLIENT_ID") {
                    if !env_client_id.is_empty() {
                        return Ok(env_client_id);
                    }
                }
                Err("Google Client ID not configured. Please set GMAIL_CLIENT_ID environment variable.".to_string())
            } else {
                Ok(client_id)
            }
        }
        Err(e) => Err(format!("Failed to load configuration: {}", e))
    }
}

/// Initialize database and return success status
async fn init_database_system(app: tauri::AppHandle) -> Result<(), String> {
    println!("🔧 [BACKEND-DEBUG] Starting database initialization...");

    match database::init_database().await {
        Ok(db_manager) => {
            println!("✅ [BACKEND-SUCCESS] Database initialized successfully");

            // Test database connectivity
            match db_manager.test_connection() {
                Ok(true) => {
                    println!("✅ [BACKEND-SUCCESS] Database connection test passed");
                    app.manage(Arc::new(db_manager));
                    Ok(())
                }
                Ok(false) => {
                    let error_msg = "Database connection test failed - query returned unexpected result";
                    eprintln!("❌ [BACKEND-ERROR] {}", error_msg);
                    Err(error_msg.to_string())
                }
                Err(e) => {
                    let error_msg = format!("Database connection test failed: {}", e);
                    eprintln!("❌ [BACKEND-ERROR] {}", error_msg);
                    Err(error_msg)
                }
            }
        }
        Err(e) => {
            let error_msg = format!("Database initialization failed: {}", e);
            eprintln!("❌ [BACKEND-ERROR] {}", error_msg);
            Err(error_msg)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("🚀 [BACKEND-DEBUG] Starting LibreOllama Tauri application...");

    // Load environment variables from .env file
    match dotenv::dotenv() {
        Ok(path) => println!("✅ [BACKEND-SUCCESS] Loaded .env file from: {:?}", path),
        Err(e) => println!("⚠️  [BACKEND-WARNING] No .env file found or failed to load: {}", e),
    }

    // CRITICAL FIX: Enable WebView2 hardware acceleration for canvas rendering
    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", 
        "--ignore-gpu-blocklist --enable-accelerated-canvas --enable-webgl --enable-accelerated-2d-canvas");

    println!("🎨 [BACKEND-DEBUG] WebView2 hardware acceleration enabled for canvas rendering");

    tauri::Builder::default()
        .setup(|app| {
            let rt = tokio::runtime::Runtime::new().expect("Failed to create async runtime");
            rt.block_on(async {
                if let Err(e) = init_database_system(app.handle().clone()).await {
                    eprintln!("❌ [BACKEND-CRITICAL] Failed to initialize database: {}", e);
                }
            });

            let db_manager: tauri::State<Arc<database::DatabaseManager>> = app.state();
            let db_manager_arc = db_manager.inner().clone();

            let gmail_cache_service = GmailCacheService::new(db_manager_arc.clone());
            app.manage(gmail_cache_service);

            let gmail_sync_service = GmailSyncService::new(db_manager_arc.clone());
            app.manage(gmail_sync_service);
            
            let encryption_key = [0u8; 32]; // Placeholder key
            let auth_service = GmailAuthService::new(db_manager_arc.clone(), encryption_key).expect("Failed to create auth service");
            app.manage(Arc::new(auth_service));
            
            let auth_service_state: tauri::State<Arc<GmailAuthService>> = app.state();
            let google_tasks_service = GoogleTasksService::new(auth_service_state.inner().clone(), db_manager_arc.clone());
            app.manage(google_tasks_service);
            
            // Initialize rate limiter for Gmail API
            let rate_limiter = Arc::new(tokio::sync::Mutex::new(RateLimiter::new(crate::commands::rate_limiter::RateLimitConfig::default())));
            
            // Initialize Gmail API service
            let gmail_api_service = GmailApiService::new(auth_service_state.inner().clone(), db_manager_arc.clone(), rate_limiter);
            app.manage(Arc::new(gmail_api_service));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_google_client_id,
            // Gmail authentication commands
            commands::gmail::auth::start_gmail_oauth_with_callback,
            commands::gmail::auth::get_gmail_accounts_secure,
            commands::gmail::auth::get_gmail_user_info,
            commands::gmail::auth::store_gmail_tokens_secure,
            commands::gmail::auth::get_gmail_tokens_secure,
            // Gmail API commands
            commands::gmail::api::search_gmail_messages,
            commands::gmail::api::get_gmail_labels,
            commands::gmail::api::get_gmail_message,
            commands::gmail::api::get_parsed_gmail_message,
            commands::gmail::api::get_gmail_thread,
            commands::gmail::api::modify_gmail_messages,
            commands::gmail::api::trash_gmail_messages,
            commands::gmail::api::get_gmail_attachment,
            // Project commands
            commands::projects::get_projects,
            // Agent commands
            commands::agents::lifecycle::get_agents,
            // Task commands
            get_task_metadata,
            create_task_metadata,
            update_task_metadata,
            delete_task_metadata,
            get_all_labels,
            get_all_task_data,
            create_google_task,
            update_google_task,
            delete_google_task,
            update_google_task_list,
            // Calendar commands
            commands::calendar::get_calendars,
            commands::calendar::get_calendar_events,
            commands::calendar::create_calendar_event,
            commands::calendar::update_calendar_event,
            commands::calendar::delete_calendar_event,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}