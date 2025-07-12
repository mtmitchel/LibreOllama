//! OAuth Callback Handler Commands
//!
//! Provides OAuth callback handling with local HTTP server and browser opening
//! functionality for secure authentication flow.

use tauri::{State, Window, Emitter};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::time::{Duration, SystemTime};
use tokio::sync::oneshot;
use std::net::{TcpListener, TcpStream};
use std::io::{Read, Write};
use std::thread;
use url::Url;

/// OAuth callback data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthCallback {
    pub code: String,
    pub state: String,
    pub error: Option<String>,
    pub error_description: Option<String>,
}

/// OAuth listener state
pub struct OAuthListenerState {
    pub active_listeners: HashMap<String, oneshot::Sender<OAuthCallback>>,
    pub server_ports: Vec<u16>,
}

impl Default for OAuthListenerState {
    fn default() -> Self {
        Self {
            active_listeners: HashMap::new(),
            server_ports: vec![8080, 8081, 8082, 1423, 1424, 1425], // Fallback ports
        }
    }
}

/// Start OAuth callback listener
#[tauri::command]
pub async fn listen_oauth_callback(
    window: Window,
    oauth_state: State<'_, Arc<Mutex<OAuthListenerState>>>,
) -> Result<(), String> {
    let (tx, rx) = oneshot::channel();
    
    // Find available port
    let port = {
        let state = oauth_state.lock().unwrap();
        find_available_port(&state.server_ports)
            .ok_or("No available ports for OAuth callback server")?
    };
    
    // Start local HTTP server
    let window_clone = window.clone();
    thread::spawn(move || {
        if let Err(e) = start_callback_server(port, tx, window_clone) {
            eprintln!("OAuth callback server error: {}", e);
        }
    });
    
    Ok(())
}

/// Open browser with URL
#[tauri::command]
pub async fn open_browser(url: String) -> Result<(), String> {
    // Try multiple methods to open browser
    
    // Method 1: Use system's default browser
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let result = Command::new("cmd")
            .args(&["/C", "start", &url])
            .output();
        
        if result.is_ok() {
            return Ok(());
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let result = Command::new("open")
            .arg(&url)
            .output();
        
        if result.is_ok() {
            return Ok(());
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        let result = Command::new("xdg-open")
            .arg(&url)
            .output();
        
        if result.is_ok() {
            return Ok(());
        }
    }
    
    // Method 2: Use webbrowser crate as fallback
    match webbrowser::open(&url) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open browser: {}", e)),
    }
}

/// Handle OAuth redirect (for when callback comes through app)
#[tauri::command]
pub async fn handle_oauth_redirect(
    callback_url: String,
    window: Window,
) -> Result<(), String> {
    let callback = parse_oauth_callback(&callback_url)?;
    
    // Emit event to frontend
    window.emit("oauth_callback", &callback)
        .map_err(|e| format!("Failed to emit OAuth callback event: {}", e))?;
    
    Ok(())
}

/// Get available ports for OAuth callback
#[tauri::command]
pub async fn get_oauth_ports(
    oauth_state: State<'_, Arc<Mutex<OAuthListenerState>>>,
) -> Result<Vec<u16>, String> {
    let state = oauth_state.lock().unwrap();
    Ok(state.server_ports.clone())
}

// Helper functions

/// Find an available port from the list
fn find_available_port(ports: &[u16]) -> Option<u16> {
    for &port in ports {
        if TcpListener::bind(("127.0.0.1", port)).is_ok() {
            return Some(port);
        }
    }
    None
}

/// Start local HTTP server for OAuth callback
fn start_callback_server(
    port: u16, 
    callback_sender: oneshot::Sender<OAuthCallback>,
    window: Window,
) -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind(("127.0.0.1", port))?;
    listener.set_nonblocking(true)?;
    
    println!("OAuth callback server listening on http://127.0.0.1:{}", port);
    
    let start_time = SystemTime::now();
    let timeout = Duration::from_secs(120); // 2 minutes timeout
    
    loop {
        // Check for timeout
        if start_time.elapsed().unwrap_or(Duration::from_secs(0)) > timeout {
            println!("OAuth callback server timed out");
            break;
        }
        
        match listener.accept() {
            Ok((mut stream, addr)) => {
                println!("OAuth callback received from {}", addr);
                
                match handle_callback_request(&mut stream) {
                    Ok(Some(callback)) => {
                        // Send callback data
                        let _ = callback_sender.send(callback.clone());
                        
                        // Also emit to frontend
                        let _ = window.emit("oauth_callback", &callback);
                        
                        // Send success response
                        send_success_response(&mut stream)?;
                        break;
                    }
                    Ok(None) => {
                        // Not an OAuth callback, continue listening
                        send_error_response(&mut stream, "Invalid OAuth callback")?;
                    }
                    Err(e) => {
                        eprintln!("Error handling callback request: {}", e);
                        send_error_response(&mut stream, "Server error")?;
                    }
                }
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                // No connection available, sleep briefly and continue
                thread::sleep(Duration::from_millis(100));
                continue;
            }
            Err(e) => {
                eprintln!("Error accepting connection: {}", e);
                break;
            }
        }
    }
    
    Ok(())
}

/// Handle HTTP request and extract OAuth callback data
fn handle_callback_request(stream: &mut TcpStream) -> Result<Option<OAuthCallback>, Box<dyn std::error::Error>> {
    let mut buffer = [0; 4096];
    let bytes_read = stream.read(&mut buffer)?;
    let request = String::from_utf8_lossy(&buffer[..bytes_read]);
    
    // Parse HTTP request
    let lines: Vec<&str> = request.lines().collect();
    if lines.is_empty() {
        return Ok(None);
    }
    
    let request_line = lines[0];
    let parts: Vec<&str> = request_line.split_whitespace().collect();
    if parts.len() < 2 {
        return Ok(None);
    }
    
    let path = parts[1];
    
    // Check if this is an OAuth callback
    if !path.starts_with("/auth/") && !path.starts_with("/callback") && !path.contains("code=") {
        return Ok(None);
    }
    
    // Parse callback URL
    let full_url = format!("http://localhost{}", path);
    parse_oauth_callback(&full_url).map(Some)
}

/// Parse OAuth callback parameters from URL
fn parse_oauth_callback(url: &str) -> Result<OAuthCallback, String> {
    let parsed_url = Url::parse(url)
        .map_err(|e| format!("Invalid callback URL: {}", e))?;
    
    let mut code = None;
    let mut state = None;
    let mut error = None;
    let mut error_description = None;
    
    for (key, value) in parsed_url.query_pairs() {
        match key.as_ref() {
            "code" => code = Some(value.to_string()),
            "state" => state = Some(value.to_string()),
            "error" => error = Some(value.to_string()),
            "error_description" => error_description = Some(value.to_string()),
            _ => {} // Ignore other parameters
        }
    }
    
    let code = code.ok_or("Missing 'code' parameter in OAuth callback")?;
    let state = state.ok_or("Missing 'state' parameter in OAuth callback")?;
    
    Ok(OAuthCallback {
        code,
        state,
        error,
        error_description,
    })
}

/// Send success response to browser
fn send_success_response(stream: &mut TcpStream) -> Result<(), Box<dyn std::error::Error>> {
    let response = r#"HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Connection: close

<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            margin: 0 0 1rem 0;
            font-size: 2rem;
            font-weight: 600;
        }
        p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .close-note {
            margin-top: 1.5rem;
            font-size: 0.9rem;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Authentication Successful!</h1>
        <p>Your Gmail account has been connected to LibreOllama.</p>
        <p class="close-note">You can safely close this browser window.</p>
    </div>
    <script>
        // Auto-close after 3 seconds
        setTimeout(() => {
            window.close();
        }, 3000);
    </script>
</body>
</html>"#;
    
    stream.write_all(response.as_bytes())?;
    stream.flush()?;
    Ok(())
}

/// Send error response to browser
fn send_error_response(stream: &mut TcpStream, error_msg: &str) -> Result<(), Box<dyn std::error::Error>> {
    let response = format!(r#"HTTP/1.1 400 Bad Request
Content-Type: text/html; charset=utf-8
Connection: close

<!DOCTYPE html>
<html>
<head>
    <title>Authentication Error</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
        }}
        .container {{
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }}
        .error-icon {{
            font-size: 4rem;
            margin-bottom: 1rem;
        }}
        h1 {{
            margin: 0 0 1rem 0;
            font-size: 2rem;
            font-weight: 600;
        }}
        p {{
            margin: 0 0 1rem 0;
            opacity: 0.9;
            font-size: 1.1rem;
        }}
        .error-details {{
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
            font-family: monospace;
            font-size: 0.9rem;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Authentication Error</h1>
        <p>There was a problem connecting your Gmail account.</p>
        <div class="error-details">{}</div>
        <p>Please try again or contact support if the problem persists.</p>
    </div>
</body>
</html>"#, error_msg);
    
    stream.write_all(response.as_bytes())?;
    stream.flush()?;
    Ok(())
} 