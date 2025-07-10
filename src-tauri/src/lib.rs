// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// Import command modules
mod commands;
mod database;

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
use commands::agents::*;       // Agent lifecycle commands  
use commands::chat::*;         // Chat session commands
use commands::system::*;       // System and advanced commands

// Legacy command imports (maintained for compatibility)
use commands::ollama::*;
use commands::folders::*;
use commands::notes::*;
use commands::mcp::*;
use commands::n8n::*;
use commands::links::*;
use commands::canvas::*;
use commands::rate_limiter::*;

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
            let encryption_key = crate::utils::crypto::generate_encryption_key();
            let gmail_auth_service = match crate::services::gmail::auth_service::GmailAuthService::new(Arc::new(db_manager.inner().clone()), encryption_key) {
                Ok(service) => {
                    println!("✅ [BACKEND-SUCCESS] Gmail authentication service initialized");
                    Arc::new(service)
                },
                Err(e) => {
                    eprintln!("⚠️  [BACKEND-WARNING] Failed to initialize Gmail auth service: {}", e);
                    eprintln!("⚠️  [BACKEND-WARNING] Gmail authentication will use legacy methods");
                    // Continue without the new service
                    return Ok(());
                }
            };

            // Initialize rate limiter
            let rate_limiter_config = crate::commands::rate_limiter::RateLimitConfig::default();
            let rate_limiter = Arc::new(tokio::sync::Mutex::new(
                crate::commands::rate_limiter::RateLimiter::new(rate_limiter_config)
            ));
            println!("✅ [BACKEND-SUCCESS] Rate limiter initialized");

            // Initialize Gmail compose service
            let gmail_compose_service = Arc::new(
                crate::services::gmail::compose_service::GmailComposeService::new(
                    gmail_auth_service.clone(),
                    Arc::new(db_manager.inner().clone()),
                    rate_limiter.clone(),
                )
            );
            println!("✅ [BACKEND-SUCCESS] Gmail compose service initialized");

            // Initialize Gmail API service
            let gmail_api_service = Arc::new(
                crate::services::gmail::api_service::GmailApiService::new(
                    gmail_auth_service.clone(),
                    Arc::new(db_manager.inner().clone()),
                    rate_limiter.clone(),
                )
            );
            println!("✅ [BACKEND-SUCCESS] Gmail API service initialized");

            // Store new services in app state
            app.manage(gmail_auth_service);
            app.manage(rate_limiter);
            app.manage(gmail_compose_service);
            app.manage(gmail_api_service);

            println!("✅ [BACKEND-SUCCESS] All Tauri commands registered successfully");
            println!("🔒 [BACKEND-SUCCESS] Gmail OAuth state management initialized");
            println!("✅ [BACKEND-SUCCESS] LibreOllama backend is ready for frontend connections");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            database_health_check,
            // Chat commands
            create_session,
            get_sessions,
            send_message,
            get_session_messages,
            delete_session,
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
            // Folder commands
            create_folder,
            get_folders,
            update_folder,
            delete_folder,
            // Notes commands
            create_note,
            get_notes,
            update_note,
            delete_note,
            // MCP server commands
            create_mcp_server,
            get_mcp_servers,
            update_mcp_server,
            delete_mcp_server,
            // N8N connection commands
            create_n8n_connection,
            get_n8n_connections,
            update_n8n_connection,
            delete_n8n_connection,
            // Bidirectional linking commands
            create_link,
            get_outgoing_links_for_content,
            get_backlinks_for_content,
            update_link,
            delete_link,
            index_content,
            get_content_index_for_item,
            search_content_for_links,
            get_link_suggestions_for_text,
            get_related_content_for_item,
            get_cross_reference_data,
            log_link_action,
            cleanup_link_suggestions,
            create_multiple_links,
            batch_index_content,
            get_link_statistics,
            // Canvas commands for Konva.js integration
            save_canvas_data,
            load_canvas_data,
            // LEGACY GMAIL COMMANDS REMOVED: functionality is now in services/gmail
            // gmail_generate_auth_url,
            // gmail_exchange_code,
            // gmail_get_labels,
            // gmail_get_messages,
            // gmail_get_message,
            // gmail_send_email,
            // Gmail Auth commands
            start_gmail_oauth,
            complete_gmail_oauth,
            refresh_gmail_token,
            revoke_gmail_token,
            get_gmail_user_info,
            store_gmail_tokens_secure,
            get_gmail_tokens_secure,
            get_gmail_accounts_secure,
            remove_gmail_tokens_secure,
            clear_gmail_tokens,
            update_gmail_sync_timestamp_secure,
            check_token_validity_secure,
            validate_and_refresh_gmail_tokens,
            start_oauth_callback_server_and_wait,
            migrate_tokens_to_secure_storage,
            create_secure_accounts_table,
            check_legacy_gmail_accounts,
            check_secure_accounts_table,
            // Gmail API commands
            get_gmail_labels,
            search_gmail_messages,
            get_gmail_message,
            get_parsed_gmail_message,
            get_gmail_thread,
            get_gmail_attachment,
            // Gmail compose commands
            send_gmail_message,
            save_gmail_draft,
            get_gmail_drafts,
            delete_gmail_draft,
            create_gmail_reply,
            get_gmail_templates,
            create_gmail_template,
            // Gmail sync commands
            initialize_gmail_sync,
            perform_gmail_full_sync,
            perform_gmail_incremental_sync,
            get_gmail_sync_state,
            pause_gmail_sync,
            resume_gmail_sync,
            get_gmail_messages_batch,
            get_gmail_history,
            setup_gmail_push_notifications,
            stop_gmail_push_notifications,
            handle_gmail_push_notification,
            get_gmail_account_sync_state,
            update_gmail_account_sync_state,
            mark_gmail_messages_as_read,
            mark_gmail_messages_as_unread,
            star_gmail_messages,
            unstar_gmail_messages,
            delete_gmail_messages,
            archive_gmail_messages,
            modify_gmail_message_labels,
            // Gmail cache commands
            initialize_gmail_cache_config,
            get_gmail_cached_messages,
            cache_gmail_message,
            get_gmail_cache_stats,
            cleanup_gmail_cache,
            enable_gmail_offline_access,
            get_gmail_offline_messages,
            preload_gmail_for_offline,
            // Google Tasks API commands
            get_task_lists,
            get_tasks,
            create_task,
            update_task,
            move_task,
            delete_task,
            create_task_list,
            update_task_list,
            delete_task_list,
            // Google Calendar API commands
            get_calendars,
            get_calendar_events,
            create_calendar_event,
            update_calendar_event,
            delete_calendar_event,
            // Rate limiter commands
            initialize_rate_limiter,
            get_quota_status,
            get_queue_stats,
            execute_rate_limited_request,
            execute_batch_requests
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
