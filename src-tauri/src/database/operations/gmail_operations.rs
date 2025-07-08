//! Gmail-related database operations
//!
//! This module provides CRUD operations for all Gmail models including accounts,
//! labels, threads, messages, attachments, sync state, and drafts.

use anyhow::Result;
use rusqlite::{Connection, params, OptionalExtension};
use chrono::{Local, NaiveDateTime};
use crate::database::models::{
    GmailAccount, GmailLabel, GmailThread, GmailMessage, 
    GmailAttachment, GmailSyncState, GmailDraft
};

// ===== Gmail Account Operations =====

pub fn create_gmail_account(
    conn: &Connection,
    user_id: &str,
    email: &str,
    access_token: &str,
    refresh_token: &str,
    token_expires_at: NaiveDateTime,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO gmail_accounts (user_id, email, access_token, refresh_token, token_expires_at, is_active, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            user_id,
            email,
            access_token,
            refresh_token,
            token_expires_at,
            true,
            now,
            now
        ],
    )?;

    let account_id = conn.last_insert_rowid() as i32;
    Ok(account_id)
}

pub fn get_gmail_account(conn: &Connection, account_id: i32) -> Result<Option<GmailAccount>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, email, access_token, refresh_token, token_expires_at, is_active, created_at, updated_at 
         FROM gmail_accounts WHERE id = ?1"
    )?;

    let account = stmt.query_row(params![account_id], |row| {
        Ok(GmailAccount {
            id: row.get(0)?,
            user_id: row.get(1)?,
            email_address: row.get(2)?,
            display_name: None,
            profile_picture_url: None,
            access_token_encrypted: row.get(3)?,
            refresh_token_encrypted: row.get(4)?,
            token_expires_at: row.get(5)?,
            scopes: vec![],
            is_active: row.get(6)?,
            last_sync_at: None,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }).optional()?;

    Ok(account)
}

pub fn get_gmail_account_by_email(conn: &Connection, email: &str) -> Result<Option<GmailAccount>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, email, access_token, refresh_token, token_expires_at, is_active, created_at, updated_at 
         FROM gmail_accounts WHERE email = ?1"
    )?;

    let account = stmt.query_row(params![email], |row| {
        Ok(GmailAccount {
            id: row.get(0)?,
            user_id: row.get(1)?,
            email_address: row.get(2)?,
            display_name: None,
            profile_picture_url: None,
            access_token_encrypted: row.get(3)?,
            refresh_token_encrypted: row.get(4)?,
            token_expires_at: row.get(5)?,
            scopes: vec![],
            is_active: row.get(6)?,
            last_sync_at: None,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }).optional()?;

    Ok(account)
}

pub fn get_gmail_accounts_by_user(conn: &Connection, user_id: &str) -> Result<Vec<GmailAccount>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, email, access_token, refresh_token, token_expires_at, is_active, created_at, updated_at 
         FROM gmail_accounts WHERE user_id = ?1 ORDER BY email ASC"
    )?;

    let accounts = stmt.query_map(params![user_id], |row| {
        Ok(GmailAccount {
            id: row.get(0)?,
            user_id: row.get(1)?,
            email_address: row.get(2)?,
            display_name: None,
            profile_picture_url: None,
            access_token_encrypted: row.get(3)?,
            refresh_token_encrypted: row.get(4)?,
            token_expires_at: row.get(5)?,
            scopes: vec![],
            is_active: row.get(6)?,
            last_sync_at: None,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;

    let mut result = Vec::new();
    for account in accounts {
        result.push(account?);
    }

    Ok(result)
}

pub fn update_gmail_account_tokens(
    conn: &Connection,
    account_id: i32,
    access_token: &str,
    refresh_token: &str,
    token_expires_at: NaiveDateTime,
) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE gmail_accounts SET access_token = ?1, refresh_token = ?2, token_expires_at = ?3, updated_at = ?4 WHERE id = ?5",
        params![access_token, refresh_token, token_expires_at, now, account_id],
    )?;

    Ok(())
}

pub fn set_gmail_account_active_status(conn: &Connection, account_id: i32, is_active: bool) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE gmail_accounts SET is_active = ?1, updated_at = ?2 WHERE id = ?3",
        params![is_active, now, account_id],
    )?;

    Ok(())
}

pub fn delete_gmail_account(conn: &Connection, account_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM gmail_accounts WHERE id = ?1",
        params![account_id],
    )?;

    Ok(())
}

// ===== Gmail Label Operations =====

pub fn create_gmail_label(
    conn: &Connection,
    account_id: i32,
    label_id: &str,
    name: &str,
    message_list_visibility: &str,
    label_list_visibility: &str,
    label_type: &str,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO gmail_labels (account_id, label_id, name, message_list_visibility, label_list_visibility, type, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            account_id,
            label_id,
            name,
            message_list_visibility,
            label_list_visibility,
            label_type,
            now,
            now
        ],
    )?;

    let db_id = conn.last_insert_rowid() as i32;
    Ok(db_id)
}

pub fn get_gmail_label(conn: &Connection, id: i32) -> Result<Option<GmailLabel>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, label_id, name, message_list_visibility, label_list_visibility, type, created_at, updated_at 
         FROM gmail_labels WHERE id = ?1"
    )?;

    let label = stmt.query_row(params![id], |row| {
        Ok(GmailLabel {
            id: row.get(0)?,
            account_id: row.get(1)?,
            name: row.get(3)?,
            message_list_visibility: row.get(4)?,
            label_list_visibility: row.get(5)?,
            label_type: row.get(6)?,
            messages_total: None,
            messages_unread: None,
            threads_total: None,
            threads_unread: None,
            color_text: None,
            color_background: None,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }).optional()?;

    Ok(label)
}

pub fn get_gmail_labels_by_account(conn: &Connection, account_id: i32) -> Result<Vec<GmailLabel>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, label_id, name, message_list_visibility, label_list_visibility, type, created_at, updated_at 
         FROM gmail_labels WHERE account_id = ?1 ORDER BY name ASC"
    )?;

    let labels = stmt.query_map(params![account_id], |row| {
        Ok(GmailLabel {
            id: row.get(0)?,
            account_id: row.get(1)?,
            name: row.get(3)?,
            message_list_visibility: row.get(4)?,
            label_list_visibility: row.get(5)?,
            label_type: row.get(6)?,
            messages_total: None,
            messages_unread: None,
            threads_total: None,
            threads_unread: None,
            color_text: None,
            color_background: None,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;

    let mut result = Vec::new();
    for label in labels {
        result.push(label?);
    }

    Ok(result)
}

pub fn update_gmail_label(
    conn: &Connection,
    id: i32,
    name: &str,
    message_list_visibility: &str,
    label_list_visibility: &str,
) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE gmail_labels SET name = ?1, message_list_visibility = ?2, label_list_visibility = ?3, updated_at = ?4 WHERE id = ?5",
        params![name, message_list_visibility, label_list_visibility, now, id],
    )?;

    Ok(())
}

pub fn delete_gmail_label(conn: &Connection, id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM gmail_labels WHERE id = ?1",
        params![id],
    )?;

    Ok(())
}

// ===== Gmail Thread Operations =====

pub fn create_gmail_thread(
    conn: &Connection,
    account_id: i32,
    thread_id: &str,
    snippet: &str,
    history_id: &str,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO gmail_threads (account_id, thread_id, snippet, history_id, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            account_id,
            thread_id,
            snippet,
            history_id,
            now,
            now
        ],
    )?;

    let db_id = conn.last_insert_rowid() as i32;
    Ok(db_id)
}

pub fn get_gmail_thread(conn: &Connection, id: i32) -> Result<Option<GmailThread>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, thread_id, snippet, history_id, created_at, updated_at 
         FROM gmail_threads WHERE id = ?1"
    )?;

    let thread = stmt.query_row(params![id], |row| {
        Ok(GmailThread {
            id: row.get(0)?,
            account_id: row.get(1)?,
            history_id: row.get(4)?,
            snippet: row.get(3)?,
            message_count: 0,
            is_read: false,
            is_starred: false,
            has_attachments: false,
            participants: vec![],
            subject: None,
            last_message_date: None,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    }).optional()?;

    Ok(thread)
}

pub fn get_gmail_threads_by_account(conn: &Connection, account_id: i32) -> Result<Vec<GmailThread>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, thread_id, snippet, history_id, created_at, updated_at 
         FROM gmail_threads WHERE account_id = ?1 ORDER BY updated_at DESC"
    )?;

    let threads = stmt.query_map(params![account_id], |row| {
        Ok(GmailThread {
            id: row.get(0)?,
            account_id: row.get(1)?,
            history_id: row.get(4)?,
            snippet: row.get(3)?,
            message_count: 0,
            is_read: false,
            is_starred: false,
            has_attachments: false,
            participants: vec![],
            subject: None,
            last_message_date: None,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for thread in threads {
        result.push(thread?);
    }

    Ok(result)
}

pub fn update_gmail_thread(
    conn: &Connection,
    id: i32,
    snippet: &str,
    history_id: &str,
) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE gmail_threads SET snippet = ?1, history_id = ?2, updated_at = ?3 WHERE id = ?4",
        params![snippet, history_id, now, id],
    )?;

    Ok(())
}

pub fn delete_gmail_thread(conn: &Connection, id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM gmail_threads WHERE id = ?1",
        params![id],
    )?;

    Ok(())
}

// ===== Gmail Message Operations =====

pub fn create_gmail_message(
    conn: &Connection,
    account_id: i32,
    message_id: &str,
    thread_id: &str,
    label_ids: &str,
    snippet: &str,
    payload: &str,
    size_estimate: i32,
    history_id: &str,
    internal_date: NaiveDateTime,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO gmail_messages (account_id, message_id, thread_id, label_ids, snippet, payload, size_estimate, history_id, internal_date, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            account_id,
            message_id,
            thread_id,
            label_ids,
            snippet,
            payload,
            size_estimate,
            history_id,
            internal_date,
            now,
            now
        ],
    )?;

    let db_id = conn.last_insert_rowid() as i32;
    Ok(db_id)
}

pub fn get_gmail_message(conn: &Connection, id: i32) -> Result<Option<GmailMessage>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, message_id, thread_id, label_ids, snippet, payload, size_estimate, history_id, internal_date, created_at, updated_at 
         FROM gmail_messages WHERE id = ?1"
    )?;

    let message = stmt.query_row(params![id], |row| {
        Ok(GmailMessage {
            id: row.get(0)?,
            thread_id: row.get(3)?,
            account_id: row.get(1)?,
            history_id: row.get(8)?,
            internal_date: row.get(9)?,
            size_estimate: row.get(7)?,
            snippet: row.get(5)?,
            is_read: false,
            is_starred: false,
            is_important: false,
            from_email: "".to_string(),
            from_name: None,
            to_emails: vec![],
            cc_emails: vec![],
            bcc_emails: vec![],
            subject: None,
            date_header: None,
            message_id_header: None,
            reply_to: None,
            body_text: None,
            body_html: None,
            raw_headers: serde_json::json!({}),
            has_attachments: false,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    }).optional()?;

    Ok(message)
}

pub fn get_gmail_messages_by_thread(conn: &Connection, thread_id: &str) -> Result<Vec<GmailMessage>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, message_id, thread_id, label_ids, snippet, payload, size_estimate, history_id, internal_date, created_at, updated_at 
         FROM gmail_messages WHERE thread_id = ?1 ORDER BY internal_date ASC"
    )?;

    let messages = stmt.query_map(params![thread_id], |row| {
        Ok(GmailMessage {
            id: row.get(0)?,
            thread_id: row.get(3)?,
            account_id: row.get(1)?,
            history_id: row.get(8)?,
            internal_date: row.get(9)?,
            size_estimate: row.get(7)?,
            snippet: row.get(5)?,
            is_read: false,
            is_starred: false,
            is_important: false,
            from_email: "".to_string(),
            from_name: None,
            to_emails: vec![],
            cc_emails: vec![],
            bcc_emails: vec![],
            subject: None,
            date_header: None,
            message_id_header: None,
            reply_to: None,
            body_text: None,
            body_html: None,
            raw_headers: serde_json::json!({}),
            has_attachments: false,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?;

    let mut result = Vec::new();
    for message in messages {
        result.push(message?);
    }

    Ok(result)
}

pub fn get_gmail_messages_by_account(conn: &Connection, account_id: i32, limit: i32) -> Result<Vec<GmailMessage>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, message_id, thread_id, label_ids, snippet, payload, size_estimate, history_id, internal_date, created_at, updated_at 
         FROM gmail_messages WHERE account_id = ?1 ORDER BY internal_date DESC LIMIT ?2"
    )?;

    let messages = stmt.query_map(params![account_id, limit], |row| {
        Ok(GmailMessage {
            id: row.get(0)?,
            thread_id: row.get(3)?,
            account_id: row.get(1)?,
            history_id: row.get(8)?,
            internal_date: row.get(9)?,
            size_estimate: row.get(7)?,
            snippet: row.get(5)?,
            is_read: false,
            is_starred: false,
            is_important: false,
            from_email: "".to_string(),
            from_name: None,
            to_emails: vec![],
            cc_emails: vec![],
            bcc_emails: vec![],
            subject: None,
            date_header: None,
            message_id_header: None,
            reply_to: None,
            body_text: None,
            body_html: None,
            raw_headers: serde_json::json!({}),
            has_attachments: false,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    })?;

    let mut result = Vec::new();
    for message in messages {
        result.push(message?);
    }

    Ok(result)
}

pub fn update_gmail_message_labels(conn: &Connection, id: i32, label_ids: &str) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE gmail_messages SET label_ids = ?1, updated_at = ?2 WHERE id = ?3",
        params![label_ids, now, id],
    )?;

    Ok(())
}

pub fn delete_gmail_message(conn: &Connection, id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM gmail_messages WHERE id = ?1",
        params![id],
    )?;

    Ok(())
}

// ===== Gmail Attachment Operations =====

pub fn create_gmail_attachment(
    conn: &Connection,
    message_id: i32,
    attachment_id: &str,
    filename: &str,
    mime_type: &str,
    size: i32,
    data: Option<&[u8]>,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO gmail_attachments (message_id, attachment_id, filename, mime_type, size, data, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            message_id,
            attachment_id,
            filename,
            mime_type,
            size,
            data,
            now,
            now
        ],
    )?;

    let db_id = conn.last_insert_rowid() as i32;
    Ok(db_id)
}

pub fn get_gmail_attachment(conn: &Connection, id: i32) -> Result<Option<GmailAttachment>> {
    let mut stmt = conn.prepare(
        "SELECT id, message_id, attachment_id, filename, mime_type, size, data, created_at, updated_at 
         FROM gmail_attachments WHERE id = ?1"
    )?;

    let attachment = stmt.query_row(params![id], |row| {
        Ok(GmailAttachment {
            id: row.get(0)?,
            message_id: row.get(1)?,
            account_id: "".to_string(),
            attachment_id: row.get(2)?,
            filename: row.get(3)?,
            mime_type: row.get(4)?,
            size_bytes: row.get(5)?,
            is_downloaded: false,
            local_path: None,
            download_date: None,
            created_at: row.get(7)?,
        })
    }).optional()?;

    Ok(attachment)
}

pub fn get_gmail_attachments_by_message(conn: &Connection, message_id: i32) -> Result<Vec<GmailAttachment>> {
    let mut stmt = conn.prepare(
        "SELECT id, message_id, attachment_id, filename, mime_type, size, data, created_at, updated_at 
         FROM gmail_attachments WHERE message_id = ?1 ORDER BY filename ASC"
    )?;

    let attachments = stmt.query_map(params![message_id], |row| {
        Ok(GmailAttachment {
            id: row.get(0)?,
            message_id: row.get(1)?,
            account_id: "".to_string(),
            attachment_id: row.get(2)?,
            filename: row.get(3)?,
            mime_type: row.get(4)?,
            size_bytes: row.get(5)?,
            is_downloaded: false,
            local_path: None,
            download_date: None,
            created_at: row.get(7)?,
        })
    })?;

    let mut result = Vec::new();
    for attachment in attachments {
        result.push(attachment?);
    }

    Ok(result)
}

pub fn update_gmail_attachment_data(conn: &Connection, id: i32, data: &[u8]) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE gmail_attachments SET data = ?1, updated_at = ?2 WHERE id = ?3",
        params![data, now, id],
    )?;

    Ok(())
}

pub fn delete_gmail_attachment(conn: &Connection, id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM gmail_attachments WHERE id = ?1",
        params![id],
    )?;

    Ok(())
}

// ===== Gmail Sync State Operations =====

pub fn create_gmail_sync_state(
    conn: &Connection,
    account_id: i32,
    history_id: &str,
    next_page_token: Option<&str>,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO gmail_sync_state (account_id, last_history_id, next_page_token, last_sync_at, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            account_id,
            history_id,
            next_page_token,
            now,
            now,
            now
        ],
    )?;

    let db_id = conn.last_insert_rowid() as i32;
    Ok(db_id)
}

pub fn get_gmail_sync_state_by_account(conn: &Connection, account_id: i32) -> Result<Option<GmailSyncState>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, last_history_id, next_page_token, last_sync_at, created_at, updated_at 
         FROM gmail_sync_state WHERE account_id = ?1"
    )?;

    let sync_state = stmt.query_row(params![account_id], |row| {
        Ok(GmailSyncState {
            id: row.get(0)?,
            account_id: row.get(1)?,
            sync_type: "messages".to_string(),
            last_sync_at: row.get(4)?,
            last_history_id: row.get(2)?,
            next_page_token: row.get(3)?,
            sync_status: "completed".to_string(),
            error_message: None,
            messages_synced: None,
            total_messages: None,
            started_at: None,
            completed_at: None,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    }).optional()?;

    Ok(sync_state)
}

pub fn update_gmail_sync_state(
    conn: &Connection,
    account_id: i32,
    history_id: &str,
    next_page_token: Option<&str>,
) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE gmail_sync_state SET last_history_id = ?1, next_page_token = ?2, last_sync_at = ?3, updated_at = ?4 WHERE account_id = ?5",
        params![history_id, next_page_token, now, now, account_id],
    )?;

    Ok(())
}

pub fn delete_gmail_sync_state(conn: &Connection, account_id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM gmail_sync_state WHERE account_id = ?1",
        params![account_id],
    )?;

    Ok(())
}

// ===== Gmail Draft Operations =====

pub fn create_gmail_draft(
    conn: &Connection,
    account_id: i32,
    draft_id: &str,
    message: &str,
) -> Result<i32> {
    let now = Local::now().naive_local();

    conn.execute(
        "INSERT INTO gmail_drafts (account_id, draft_id, message, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            account_id,
            draft_id,
            message,
            now,
            now
        ],
    )?;

    let db_id = conn.last_insert_rowid() as i32;
    Ok(db_id)
}

pub fn get_gmail_draft(conn: &Connection, id: i32) -> Result<Option<GmailDraft>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, draft_id, message, created_at, updated_at 
         FROM gmail_drafts WHERE id = ?1"
    )?;

    let draft = stmt.query_row(params![id], |row| {
        Ok(GmailDraft {
            id: row.get(0)?,
            message_id: None,
            account_id: row.get(1)?,
            to_emails: vec![],
            cc_emails: vec![],
            bcc_emails: vec![],
            subject: None,
            body_text: None,
            body_html: None,
            attachments: serde_json::json!({}),
            is_reply: false,
            reply_to_message_id: None,
            thread_id: None,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    }).optional()?;

    Ok(draft)
}

pub fn get_gmail_drafts_by_account(conn: &Connection, account_id: i32) -> Result<Vec<GmailDraft>> {
    let mut stmt = conn.prepare(
        "SELECT id, account_id, draft_id, message, created_at, updated_at 
         FROM gmail_drafts WHERE account_id = ?1 ORDER BY updated_at DESC"
    )?;

    let drafts = stmt.query_map(params![account_id], |row| {
        Ok(GmailDraft {
            id: row.get(0)?,
            message_id: None,
            account_id: row.get(1)?,
            to_emails: vec![],
            cc_emails: vec![],
            bcc_emails: vec![],
            subject: None,
            body_text: None,
            body_html: None,
            attachments: serde_json::json!({}),
            is_reply: false,
            reply_to_message_id: None,
            thread_id: None,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    })?;

    let mut result = Vec::new();
    for draft in drafts {
        result.push(draft?);
    }

    Ok(result)
}

pub fn update_gmail_draft(conn: &Connection, id: i32, message: &str) -> Result<()> {
    let now = Local::now().naive_local();

    conn.execute(
        "UPDATE gmail_drafts SET message = ?1, updated_at = ?2 WHERE id = ?3",
        params![message, now, id],
    )?;

    Ok(())
}

pub fn delete_gmail_draft(conn: &Connection, id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM gmail_drafts WHERE id = ?1",
        params![id],
    )?;

    Ok(())
} 