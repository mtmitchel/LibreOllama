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

// Re-export commands for easy access using new domain-grouped structure
use commands::gmail::*;        // Gmail auth and operations (consolidated)
use commands::tasks::*;        // Google Tasks API operations
use commands::calendar::*;     // Google Calendar API operations
use commands::google_drive::*; // Google Drive API operations
use commands::agents::*;       // Agent lifecycle commands  
use commands::chat::*;         // Chat session commands
use commands::projects::*;     // Project management commands
use commands::system::*;       // System and advanced commands
use commands::text_processing::*;
use commands::llm::*;

// Legacy command imports (maintained for compatibility)
use commands::ollama::*;
// Note: These imports have been removed as the commands are not currently used
use commands::folders::*;
use commands::notes::*;
// use commands::mcp::*;
// use commands::n8n::*;
// use commands::links::*;
// use commands::canvas::*;

// CONSOLIDATED: All Gmail auth functionality now in commands::gmail::auth
// - secure_oauth_flow → gmail/auth
// - secure_token_commands → gmail/auth  
// - secure_token_storage → gmail/auth

// Database imports
use std::sync::Arc;

// Environment variable loading

// Import required services and configuration
use crate::config::ConfigManager;
use crate::services::gmail::{GmailCacheService, GmailSyncService};
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
async fn init_database_system() -> Result<(), String> {
    println!("🔧 [BACKEND-DEBUG] Starting database initialization...");
    
    match database::init_database().await {
        Ok(db_manager) => {
            println!("✅ [BACKEND-SUCCESS] Database initialized successfully");
            
            // Test database connectivity
            match db_manager.test_connection() {
                Ok(true) => {
                    println!("✅ [BACKEND-SUCCESS] Database connection test passed");
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
    
    // Initialize the async runtime for database setup
    let rt = tokio::runtime::Runtime::new().expect("Failed to create async runtime");
    
    // Initialize database before starting the app
    rt.block_on(async {
        if let Err(e) = init_database_system().await {
            eprintln!("❌ [BACKEND-CRITICAL] Failed to initialize database: {}", e);
            eprintln!("⚠️  [BACKEND-WARNING] Continuing without database - some features may be limited");
            // Note: Instead of exiting, we'll continue and let the frontend handle the error gracefully
            // This allows the app to start and show proper error messages to the user
        }
    });

    println!("🔧 [BACKEND-DEBUG] Database initialization complete, registering Tauri commands...");

    // CRITICAL FIX: Enable WebView2 hardware acceleration for canvas rendering
    // This addresses the primary cause of canvas failures in Tauri applications
    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", 
        "--ignore-gpu-blocklist --enable-accelerated-canvas --enable-webgl --enable-accelerated-2d-canvas");
    
    println!("🎨 [BACKEND-DEBUG] WebView2 hardware acceleration enabled for canvas rendering");

    // REMOVED: Legacy OAuth state management
    // let oauth_state: commands::gmail::OAuthStateMap = Arc::new(Mutex::new(HashMap::new()));

    // Initialize database manager for state management
    let db_manager = rt.block_on(async {
        match database::init_database().await {
            Ok(manager) => manager,
            Err(_) => {
                // Create a dummy manager if initialization failed
                // This allows the app to start but token storage won't work
                database::connection::DatabaseManager::new().await.unwrap_or_else(|_| {
                    panic!("Failed to create database manager");
                })
            }
        }
    });

    // Initialize Gmail authentication service
    println!("🔐 [BACKEND-DEBUG] Initializing Gmail authentication service...");
    
    // Debug configuration (don't log the actual values for security)
    let config = ConfigManager::new().unwrap_or_default();
    let client_id_set = !config.oauth().client_id.is_empty();
    let client_secret_set = !config.oauth().client_secret.is_empty();
    println!("🔐 [BACKEND-DEBUG] GMAIL_CLIENT_ID set: {}", client_id_set);
    println!("🔐 [BACKEND-DEBUG] GMAIL_CLIENT_SECRET set: {}", client_secret_set);

    // Initialize Gmail services
    let db_manager_arc = Arc::new(db_manager.clone());
    
    let gmail_cache_service = GmailCacheService::new(db_manager_arc.clone());
    let gmail_sync_service = GmailSyncService::new(db_manager_arc.clone());
    
    println!("✅ [BACKEND-SUCCESS] Gmail services initialized");

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())

        // .manage(oauth_state) // REMOVED: Legacy OAuth state management
        .manage(db_manager)
        .manage(gmail_cache_service)
        .manage(gmail_sync_service);

    // Gmail authentication service will be initialized in setup

    builder
        .setup(|app| {
            println!("🔧 [BACKEND-DEBUG] Starting application setup...");
            
            // Initialize configuration first
            let _config = match ConfigManager::new() {
                Ok(config) => config,
                Err(e) => {
                    eprintln!("⚠️  [BACKEND-WARNING] Failed to initialize configuration: {}", e);
                    eprintln!("⚠️  [BACKEND-WARNING] Using default configuration");
                    ConfigManager::default()
                }
            };

            // Initialize Gmail authentication service
            let db_manager = app.state::<database::connection::DatabaseManager>();
            let encryption_key = crate::utils::crypto::get_persistent_encryption_key();
            let gmail_auth_service = match crate::services::gmail::auth_service::GmailAuthService::new(Arc::new(db_manager.inner().clone()), encryption_key) {
                Ok(service) => {
                    println!("✅ [BACKEND-SUCCESS] Gmail authentication service initialized");
                    Some(Arc::new(service))
                },
                Err(e) => {
                    eprintln!("⚠️  [BACKEND-WARNING] Failed to initialize Gmail auth service: {}", e);
                    eprintln!("⚠️  [BACKEND-WARNING] Gmail authentication disabled - configure OAuth credentials in .env file");
                    eprintln!("💡 [BACKEND-INFO] Create 'src-tauri/.env' file with GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET");
                    None
                }
            };

            // Initialize rate limiter
            let rate_limiter_config = crate::commands::rate_limiter::RateLimitConfig::default();
            let rate_limiter = Arc::new(tokio::sync::Mutex::new(
                crate::commands::rate_limiter::RateLimiter::new(rate_limiter_config)
            ));
            println!("✅ [BACKEND-SUCCESS] Rate limiter initialized");

            // Initialize Gmail services only if auth service is available
            if let Some(auth_service) = gmail_auth_service {
                // Initialize Gmail compose service
                let gmail_compose_service = Arc::new(
                    crate::services::gmail::compose_service::GmailComposeService::new(
                        auth_service.clone(),
                        Arc::new(db_manager.inner().clone()),
                        rate_limiter.clone(),
                    )
                );
                println!("✅ [BACKEND-SUCCESS] Gmail compose service initialized");

                // Initialize Gmail API service
                let gmail_api_service = Arc::new(
                    crate::services::gmail::api_service::GmailApiService::new(
                        auth_service.clone(),
                        Arc::new(db_manager.inner().clone()),
                        rate_limiter.clone(),
                    )
                );
                println!("✅ [BACKEND-SUCCESS] Gmail API service initialized");

                // Store new services in app state
                app.manage(auth_service);
                app.manage(rate_limiter);
                app.manage(gmail_compose_service);
                app.manage(gmail_api_service);
                
                println!("✅ [BACKEND-SUCCESS] All Gmail services initialized and managed");
            } else {
                // Still manage the rate limiter for other services
                app.manage(rate_limiter);
                println!("⚠️  [BACKEND-WARNING] Gmail services disabled - OAuth credentials not configured");
            }

            println!("✅ [BACKEND-SUCCESS] All Tauri commands registered successfully");
            println!("🔒 [BACKEND-SUCCESS] Gmail OAuth state management initialized");
            println!("✅ [BACKEND-SUCCESS] LibreOllama backend is ready for frontend connections");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_google_client_id,
            database_health_check,
            // Gmail commands
            start_gmail_oauth_with_callback,
            get_gmail_accounts_secure,
            get_gmail_labels,
            search_gmail_messages,
            get_gmail_message,
            get_parsed_gmail_message,
            get_gmail_thread,
            get_gmail_user_info,
            store_gmail_tokens_secure,
            get_gmail_tokens_secure,
            debug_gmail_secure_table,
            debug_gmail_token_expiration,
            cleanup_corrupted_gmail_tokens,
            debug_list_all_gmail_accounts,
            migrate_gmail_accounts_to_default_user,
            clear_all_gmail_tokens,
            get_gmail_attachment,
            send_gmail_message,
            save_gmail_draft,
            get_gmail_drafts,
            delete_gmail_draft,
            create_gmail_reply,
            get_gmail_templates,
            create_gmail_template,
            // Tasks commands
            get_task_lists,
            get_tasks,
            create_task,
            update_task,
            delete_task,
            toggle_task_complete,
            create_task_list,
            update_task_list,
            delete_task_list,
            move_task,
            // Task metadata commands - temporarily disabled due to SQLx migration
            // get_task_metadata,
            // create_task_metadata,
            // update_task_metadata,
            // delete_task_metadata,
            // get_all_labels,
            // Calendar commands
            get_calendars,
            get_calendar_events,
            create_calendar_event,
            update_calendar_event,
            delete_calendar_event,
            // Google Drive commands
            get_google_drive_quota,
            // Chat commands
            create_session,
            get_sessions,
            send_message,
            get_session_messages,
            delete_session,
            update_session_title,
            get_database_stats,
            // Ollama commands - legacy
            ollama_health_check,
            ollama_list_models,
            ollama_generate,
            ollama_chat,
            ollama_pull_model,
            // Ollama commands - enhanced Phase 3.1
            ollama_start_sidecar,
            ollama_stop_sidecar,
            ollama_get_status,
            ollama_get_model_info,
            ollama_delete_model,
            ollama_chat_stream,
            // Agent commands
            create_agent,
            get_agents,
            get_agent,
            update_agent,
            delete_agent,
            execute_agent,
            get_agent_executions,
            // Advanced Phase 3.3 commands
            get_conversation_context,
            update_conversation_context,
            get_chat_templates,
            get_chat_template,
            create_chat_template,
            update_chat_template,
            increment_template_usage,
            record_performance_metric,
            cache_request,
            get_cached_request,
            get_user_preference,
            set_user_preference,
            get_all_user_preferences,
            log_application_event,
            get_application_logs,
            export_chat_session,
            export_chat_session_markdown,
            get_system_health,
            // Project commands
            create_project,
            get_projects,
            get_project,
            update_project,
            delete_project,
            create_project_goal,
            get_project_goals,
            update_project_goal,
            delete_project_goal,
            create_project_asset,
            get_project_assets,
            delete_project_asset,
            get_project_stats,
            // Folder commands
            create_folder,
            get_folders,
            update_folder,
            delete_folder,
            // Notes commands
            get_notes,
            create_note,
            update_note,
            delete_note,
            clean_text,
            // LLM chat commands
            llm_chat_openai,
            llm_chat_anthropic,
            llm_chat_openrouter,
            llm_chat_deepseek,
            llm_chat_gemini,
            llm_chat_mistral,
            // LLM model listing commands
            llm_list_openai_models,
            llm_list_anthropic_models,
            llm_list_openrouter_models,
            llm_list_deepseek_models,
            llm_list_gemini_models,
            llm_list_mistral_models,
            // LLM settings commands
            save_llm_provider_settings,
            get_llm_provider_settings,
            set_enabled_models,
            get_enabled_models
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
