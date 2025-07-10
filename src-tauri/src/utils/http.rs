use base64::{engine::general_purpose, Engine as _};

pub async fn fetch_image_as_base64(url: &str) -> Result<String, reqwest::Error> {
    let response = reqwest::get(url).await?;
    let content_type = response
        .headers()
        .get("content-type")
        .map(|v| v.to_str().unwrap_or("image/jpeg"))
        .unwrap_or("image/jpeg")
        .to_string();
    
    let bytes = response.bytes().await?;
    let base64_image = general_purpose::STANDARD.encode(&bytes);
    
    Ok(format!("data:{};base64,{}", content_type, base64_image))
} 