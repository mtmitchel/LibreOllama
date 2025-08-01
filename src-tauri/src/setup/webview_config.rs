use tauri::{Manager, Runtime};

/// Configure webview settings to disable context menus
pub fn configure_webview<R: Runtime>(app: &tauri::App<R>) -> Result<(), Box<dyn std::error::Error>> {
    // Inject JavaScript to globally disable context menus
    if let Some(window) = app.get_webview_window("main") {
        let script = r#"
            // Global context menu prevention
            (function() {
                // Prevent all context menus
                document.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    return false;
                }, true);
                
                // Also prevent on window
                window.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    return false;
                }, true);
                
                console.log('[Tauri] Context menus disabled globally');
            })();
        "#;
        
        // Inject the script
        window.eval(script)?;
    }
    
    Ok(())
}