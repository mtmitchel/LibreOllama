use tauri::{Manager, Runtime};

/// Configure webview settings
pub fn configure_webview<R: Runtime>(app: &tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    // Context menus are now enabled by default
    // If you need to disable them for specific areas, do it in the frontend components
    
    if let Some(_window) = app.get_webview_window("main") {
        println!("[Tauri] Webview configured - context menus enabled");
    }
    
    Ok(())
}