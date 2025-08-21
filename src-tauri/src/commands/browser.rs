use tauri::{WebviewUrl, WebviewWindowBuilder, WindowBuilder, Manager, PhysicalPosition, PhysicalSize, LogicalPosition, LogicalSize};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct BrowserWindowOptions {
    pub url: String,
    pub title: Option<String>,
    pub width: Option<f64>,
    pub height: Option<f64>,
}

#[tauri::command]
pub async fn open_browser_window(
    app_handle: tauri::AppHandle,
    options: BrowserWindowOptions,
) -> Result<String, String> {
    let window_label = format!("browser-{}", Utc::now().timestamp_millis());
    let toolbar_height = 56.0;
    let width = options.width.unwrap_or(1200.0);
    let height = options.height.unwrap_or(820.0);
    
    // Create main window without webview
    let window = WindowBuilder::new(
        &app_handle,
        &window_label,
    )
    .title(options.title.unwrap_or_else(|| "Browser".to_string()))
    .inner_size(width, height)
    .resizable(true)
    .decorations(false)
    .center()
    .build()
    .map_err(|e| format!("Failed to create window: {}", e))?;
    
    // Create toolbar webview
    let toolbar_url = if cfg!(debug_assertions) {
        format!("http://localhost:1423/browser-control?windowLabel={}&url={}&mode=toolbar", 
                window_label, urlencoding::encode(&options.url))
    } else {
        format!("index.html#/browser-control?windowLabel={}&url={}&mode=toolbar", 
                window_label, urlencoding::encode(&options.url))
    };
    
    let toolbar = window.add_child(
        tauri::webview::WebviewBuilder::new(
            "toolbar",
            WebviewUrl::External(toolbar_url.parse().unwrap())
        )
        .auto_resize(),
        LogicalPosition::new(0.0, 0.0),
        LogicalSize::new(width, toolbar_height),
    )
    .map_err(|e| format!("Failed to add toolbar: {}", e))?;
    
    // Ensure toolbar is visible
    toolbar.show().map_err(|e| format!("Failed to show toolbar: {}", e))?;
    
    // Create content webview  
    let _content = window.add_child(
        tauri::webview::WebviewBuilder::new(
            "content",
            WebviewUrl::External(options.url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
        )
        .auto_resize()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
        LogicalPosition::new(0.0, toolbar_height),
        LogicalSize::new(width, height - toolbar_height),
    )
    .map_err(|e| format!("Failed to add content: {}", e))?;
    
    window.show().map_err(|e| format!("Failed to show window: {}", e))?;
    
    Ok(window_label)
}

#[tauri::command]
pub async fn close_browser_window(
    app_handle: tauri::AppHandle,
    window_label: String,
) -> Result<(), String> {
    // Try to close as a window first (for multi-webview setup)
    if let Some(window) = app_handle.get_window(&window_label) {
        window.close().map_err(|e| format!("Failed to close window: {}", e))?;
    } else if let Some(window) = app_handle.get_webview_window(&window_label) {
        // Fallback to webview window for single-webview setup
        window.close().map_err(|e| format!("Failed to close window: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn navigate_browser_window(
    app_handle: tauri::AppHandle,
    window_label: String,
    url: String,
) -> Result<(), String> {
    // For multi-webview setup, navigate the content webview
    if let Some(window) = app_handle.get_window(&window_label) {
        // Get all webviews in the window
        let webviews = window.webviews();
        for webview in webviews {
            if webview.label() == "content" {
                webview.navigate(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
                    .map_err(|e| format!("Failed to navigate: {}", e))?;
                return Ok(());
            }
        }
    }
    
    // Fallback to single webview window
    if let Some(window) = app_handle.get_webview_window(&window_label) {
        window.navigate(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
            .map_err(|e| format!("Failed to navigate: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_browser_window_url(
    app_handle: tauri::AppHandle,
    window_label: String,
) -> Result<String, String> {
    // For multi-webview setup, get URL from the content webview
    if let Some(window) = app_handle.get_window(&window_label) {
        let webviews = window.webviews();
        for webview in webviews {
            if webview.label() == "content" {
                return webview.url()
                    .map(|u| u.to_string())
                    .map_err(|e| format!("Failed to get URL: {}", e));
            }
        }
    }
    
    // Fallback to single webview window
    if let Some(window) = app_handle.get_webview_window(&window_label) {
        window.url()
            .map(|u| u.to_string())
            .map_err(|e| format!("Failed to get URL: {}", e))
    } else {
        Err("Window not found".to_string())
    }
}

/// Open an always-on-top controller window positioned near the top-right of the parent browser window
#[tauri::command]
pub async fn open_browser_controller_window(
    app_handle: tauri::AppHandle,
    parent_label: String,
    url: Option<String>,
) -> Result<String, String> {
    let parent = app_handle
        .get_webview_window(&parent_label)
        .ok_or_else(|| "Parent window not found".to_string())?;

    // Derive initial position from parent window
    let parent_pos = parent
        .outer_position()
        .map_err(|e| format!("Failed to get parent position: {}", e))?;
    let parent_size = parent
        .outer_size()
        .map_err(|e| format!("Failed to get parent size: {}", e))?;

    // Controller window dimensions: full parent width, toolbar height
    let ctrl_height: i32 = 56;

    let controller_label = format!("browser-controller-{}", Utc::now().timestamp_millis());

    // Load our app route for the controller UI. Use hash route so it works in dev and prod.
    let route = if let Some(ref u) = url {
        format!("#/browser-control?windowLabel={}&url={}", parent_label, urlencoding::encode(u))
    } else {
        format!("#/browser-control?windowLabel={}", parent_label)
    };

    // In dev, point to the Vite dev server; in prod, load from bundled assets
    let controller_url = if cfg!(debug_assertions) {
        // BrowserRouter expects real path, not hash. Use /browser-control in dev.
        let dev = if let Some(ref u) = url {
            format!("http://localhost:1423/browser-control?windowLabel={}&url={}", parent_label, urlencoding::encode(u))
        } else {
            format!("http://localhost:1423/browser-control?windowLabel={}", parent_label)
        };
        WebviewUrl::External(dev.parse().map_err(|e| format!("Invalid dev URL: {}", e))?)
    } else {
        // For prod, continue to use index.html with hash route so SPA loads
        WebviewUrl::App(format!("index.html{}", route).into())
    };

    println!("[controller] Creating controller for parent {} with URL {:?}", parent_label, url);
    let controller = WebviewWindowBuilder::new(
        &app_handle,
        &controller_label,
        controller_url,
    )
    .title("Browser Controls")
    // Frameless, always-on-top toolbar that docks to parent top edge
    .decorations(false)
    .always_on_top(true)
    .transparent(true)
    .inner_size(parent_size.width as f64, ctrl_height as f64)
    .build()
    .map_err(|e| format!("Failed to create controller window: {}", e))?;

    println!("[controller] Window built; docking to parent top edge");
    // Position the controller at the parent's top-left corner
    controller
        .set_position(PhysicalPosition::new(parent_pos.x, parent_pos.y))
        .map_err(|e| format!("Failed to set controller position: {}", e))?;
    controller
        .set_size(PhysicalSize::new(parent_size.width, ctrl_height as u32))
        .map_err(|e| format!("Failed to set controller size: {}", e))?;
    controller.show().map_err(|e| format!("Failed to show controller window: {}", e))?;

    Ok(controller_label)
}

/// Open a single-window browser shell that renders our DS chrome and embeds
/// a child webview for the external URL (created on the frontend page)
#[tauri::command]
pub async fn open_browser_shell_window(
    app_handle: tauri::AppHandle,
    url: String,
    title: Option<String>,
    width: Option<f64>,
    height: Option<f64>,
) -> Result<String, String> {
    let label = format!("browser-shell-{}", Utc::now().timestamp_millis());

    // Build route to our shell page with query param
    let route_hash = format!("#/browser-shell?url={}", urlencoding::encode(&url));
    let route_path = format!("/browser-shell?url={}", urlencoding::encode(&url));
    let shell_url = if cfg!(debug_assertions) {
        // In dev, use BrowserRouter path (no hash)
        let dev = format!("http://localhost:1423{}", route_path);
        WebviewUrl::External(dev.parse().map_err(|e| format!("Invalid dev URL: {}", e))?)
    } else {
        // In prod, load bundled index with hash route
        WebviewUrl::App(format!("index.html{}", route_hash).into())
    };

    let window = WebviewWindowBuilder::new(&app_handle, &label, shell_url)
        .title(title.unwrap_or_else(|| "Browser".to_string()))
        .inner_size(width.unwrap_or(1200.0), height.unwrap_or(820.0))
        .resizable(true)
        .decorations(false)
        .always_on_top(false)
        .center()
        .build()
        .map_err(|e| format!("Failed to create browser shell window: {}", e))?;

    window.show().map_err(|e| format!("Failed to show shell window: {}", e))?;
    Ok(label)
}

/// Open URL in system default browser
/// This ensures the system default browser is used (Chrome in your case)
#[tauri::command]
pub async fn open_url_in_system_browser(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // On Windows, use cmd /c start with empty title to respect system default
        Command::new("cmd")
            .args(&["/c", "start", "", &url])
            .spawn()
            .map_err(|e| format!("Failed to open URL in browser: {}", e))?;
        return Ok(());
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL in browser: {}", e))?;
        return Ok(());
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL in browser: {}", e))?;
        return Ok(());
    }
    
    #[allow(unreachable_code)]
    Err("Unsupported operating system".to_string())
}

/// Fetch HTML content from a URL for reader view
#[tauri::command]
pub async fn fetch_url_html(url: String) -> Result<String, String> {
    // Validate URL
    let parsed_url = url.parse::<reqwest::Url>()
        .map_err(|e| format!("Invalid URL: {}", e))?;
    
    // Only allow http/https
    if !["http", "https"].contains(&parsed_url.scheme()) {
        return Err("Only HTTP/HTTPS URLs are supported".to_string());
    }
    
    // Create client with desktop user agent
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    // Fetch the URL
    let response = client.get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch URL: {}", e))?;
    
    // Check content length (reject if > 10MB)
    if let Some(content_length) = response.content_length() {
        if content_length > 10_000_000 {
            return Err("Response too large (>10MB)".to_string());
        }
    }
    
    // Get the HTML content
    let html = response.text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    // Reject if still too large after reading
    if html.len() > 10_000_000 {
        return Err("HTML content too large (>10MB)".to_string());
    }
    
    Ok(html)
}