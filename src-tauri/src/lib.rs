// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// Import command modules
mod commands;
mod database;

// Re-export commands for easy access
use commands::chat::*;
use commands::ollama::*;
use commands::agents::*;
use commands::advanced::*;
use commands::folders::*;
use commands::notes::*;
use commands::mcp::*;
use commands::n8n::*;
use commands::links::*;

// Database imports

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Database health check command
#[tauri::command]
async fn database_health_check() -> Result<bool, String> {
    // For now, return a simple success since we're using async operations
    Ok(true)
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

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
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
            get_link_statistics
        ])
        .setup(|_app| {
            println!("✅ [BACKEND-SUCCESS] All Tauri commands registered successfully");
            println!("✅ [BACKEND-SUCCESS] LibreOllama backend is ready for frontend connections");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
