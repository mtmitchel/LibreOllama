use strip_markdown::strip_markdown;
use regex::Regex;

#[tauri::command]
pub fn clean_text(text: String) -> String {
    strip_markdown(&text)
}

#[tauri::command]
pub fn format_ai_response(text: String) -> String {
    let mut formatted = text;
    
    // 1. Clean up excessive whitespace while preserving intentional formatting
    let whitespace_re = Regex::new(r"\n{3,}").unwrap();
    formatted = whitespace_re.replace_all(&formatted, "\n\n").to_string();
    
    // 2. Ensure code blocks are properly formatted
    let code_block_re = Regex::new(r"```(\w*)\n?([\s\S]*?)```").unwrap();
    formatted = code_block_re.replace_all(&formatted, |caps: &regex::Captures| {
        let lang = caps.get(1).map_or("", |m| m.as_str());
        let code = caps.get(2).map_or("", |m| m.as_str());
        if lang.is_empty() {
            format!("```\n{}\n```", code.trim())
        } else {
            format!("```{}\n{}\n```", lang, code.trim())
        }
    }).to_string();
    
    // 3. Fix inline code formatting
    let inline_code_re = Regex::new(r"`([^`]+)`").unwrap();
    formatted = inline_code_re.replace_all(&formatted, "`$1`").to_string();
    
    // 4. Ensure lists are properly formatted
    // Fix numbered lists
    let numbered_list_re = Regex::new(r"^(\d+)\.?\s+(.+)$").unwrap();
    let lines: Vec<String> = formatted.lines().map(|line| {
        if numbered_list_re.is_match(line) {
            numbered_list_re.replace(line, "$1. $2").to_string()
        } else {
            line.to_string()
        }
    }).collect();
    formatted = lines.join("\n");
    
    // Fix bullet points
    let bullet_re = Regex::new(r"^[\*\-]\s+(.+)$").unwrap();
    let lines: Vec<String> = formatted.lines().map(|line| {
        if bullet_re.is_match(line) {
            bullet_re.replace(line, "• $1").to_string()
        } else {
            line.to_string()
        }
    }).collect();
    formatted = lines.join("\n");
    
    // 5. Add proper spacing around headers
    let header_re = Regex::new(r"^(#{1,6})\s+(.+)$").unwrap();
    let mut result_lines: Vec<String> = Vec::new();
    let mut prev_was_header = false;
    
    for line in formatted.lines() {
        if header_re.is_match(line) {
            if !result_lines.is_empty() && !prev_was_header {
                // Add blank line before header if previous line wasn't empty or header
                if let Some(last) = result_lines.last() {
                    if !last.is_empty() {
                        result_lines.push(String::new());
                    }
                }
            }
            result_lines.push(line.to_string());
            prev_was_header = true;
        } else {
            if prev_was_header && !line.is_empty() {
                // Add blank line after header if next line isn't empty
                result_lines.push(String::new());
            }
            result_lines.push(line.to_string());
            prev_was_header = false;
        }
    }
    
    formatted = result_lines.join("\n");
    
    // 6. Ensure proper sentence spacing
    let sentence_re = Regex::new(r"([.!?])\s*([A-Z])").unwrap();
    formatted = sentence_re.replace_all(&formatted, "$1 $2").to_string();
    
    // 7. Clean up any trailing whitespace
    formatted = formatted.lines()
        .map(|line| line.trim_end())
        .collect::<Vec<_>>()
        .join("\n");
    
    // 8. Ensure the response ends cleanly
    formatted = formatted.trim().to_string();
    
    formatted
} 