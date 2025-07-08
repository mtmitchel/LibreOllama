use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use anyhow::{Result, Context};
use reqwest::Client;
use chrono::{DateTime, Utc, Duration};
use tokio::sync::RwLock;
use rusqlite::OptionalExtension;

use crate::database::DatabaseManager;
use crate::services::gmail::GmailTokens;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncState {
    pub account_id: String,
    pub history_id: Option<String>,
    pub last_sync_timestamp: Option<String>,
    pub messages_synced: u64,
    pub messages_failed: u64,
    pub sync_status: SyncStatus,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncStatus {
    Idle,
    InProgress,
    Completed,
    Failed,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub account_id: String,
    pub max_messages_per_batch: u32,
    pub sync_interval_minutes: u32,
    pub labels_to_sync: Option<Vec<String>>,
    pub exclude_labels: Option<Vec<String>>,
    pub full_sync_on_startup: bool,
    pub enable_incremental_sync: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub account_id: String,
    pub sync_type: SyncType,
    pub messages_processed: u64,
    pub messages_failed: u64,
    pub new_history_id: Option<String>,
    pub duration_ms: u64,
    pub errors: Vec<String>,
    pub status: SyncStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncType {
    Full,
    Incremental,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailSyncConfig {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchMessageResponse {
    pub messages: Vec<serde_json::Value>,
    pub history_id: String,
    pub next_page_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryResponse {
    pub history: Vec<serde_json::Value>,
    pub history_id: String,
    pub next_page_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushNotificationSetupResponse {
    pub success: bool,
    pub expiration: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushNotificationData {
    pub account_id: String,
    pub history_id: String,
    pub email_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(Default)]
pub struct AccountSyncState {
    pub account_id: String,
    pub last_history_id: Option<String>,
    pub last_sync_time: Option<DateTime<Utc>>,
    pub push_subscription_id: Option<String>,
    pub push_expiration: Option<DateTime<Utc>>,
    pub is_syncing: bool,
    pub error_message: Option<String>,
}


#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct GmailHistoryResponse {
    history: Option<Vec<GmailHistoryRecord>>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
    #[serde(rename = "historyId")]
    history_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct GmailHistoryRecord {
    id: String,
    messages: Option<Vec<GmailHistoryMessage>>,
    #[serde(rename = "messagesAdded")]
    messages_added: Option<Vec<GmailHistoryMessage>>,
    #[serde(rename = "messagesDeleted")]
    messages_deleted: Option<Vec<GmailHistoryMessage>>,
    #[serde(rename = "labelsAdded")]
    labels_added: Option<Vec<GmailLabelChange>>,
    #[serde(rename = "labelsRemoved")]
    labels_removed: Option<Vec<GmailLabelChange>>,
}

#[derive(Debug, Deserialize)]
struct GmailHistoryMessage {
    id: String,
    #[serde(rename = "threadId")]
    thread_id: String,
}

#[derive(Debug, Deserialize)]
struct GmailLabelChange {
    message: GmailHistoryMessage,
    #[serde(rename = "labelIds")]
    label_ids: Vec<String>,
}

// Account sync state management
pub type AccountSyncStates = RwLock<HashMap<String, AccountSyncState>>;

#[allow(dead_code)]
pub struct GmailSyncService {
    db_manager: Arc<DatabaseManager>,
    client: Client,
    sync_states: Arc<AccountSyncStates>,
}

#[allow(dead_code)]
impl GmailSyncService {
    pub fn new(db_manager: Arc<DatabaseManager>) -> Self {
        Self {
            db_manager,
            client: Client::new(),
            sync_states: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Initialize sync state for a Gmail account
    pub async fn initialize_sync_state(&self, account_id: &str, config: &SyncConfig) -> Result<SyncState> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        // Get or create sync state
        let existing_state = self.get_sync_state_from_db(account_id, &conn)?;
        
        let sync_state = match existing_state {
            Some(state) => state,
            None => {
                // Create new sync state
                let new_state = SyncState {
                    account_id: account_id.to_string(),
                    history_id: None,
                    last_sync_timestamp: None,
                    messages_synced: 0,
                    messages_failed: 0,
                    sync_status: SyncStatus::Idle,
                    errors: Vec::new(),
                };
                
                // Store in database
                self.store_sync_state_in_db(&new_state, &conn)?;
                new_state
            }
        };

        // Store sync configuration
        self.store_sync_config_in_db(config, &conn)?;

        Ok(sync_state)
    }

    /// Perform full sync of Gmail messages for an account
    pub async fn perform_full_sync(&self, account_id: &str, max_messages: Option<u32>) -> Result<SyncResult> {
        let start_time = std::time::Instant::now();
        let mut sync_result = SyncResult {
            account_id: account_id.to_string(),
            sync_type: SyncType::Full,
            messages_processed: 0,
            messages_failed: 0,
            new_history_id: None,
            duration_ms: 0,
            errors: Vec::new(),
            status: SyncStatus::InProgress,
        };

        // Update sync state to in-progress
        self.update_sync_status(account_id, SyncStatus::InProgress).await?;

        // Get tokens for the account (this would be implemented to get from auth service)
        // For now, we'll use a placeholder
        let tokens = GmailTokens {
            access_token: "placeholder".to_string(),
            refresh_token: Some("placeholder".to_string()),
            expires_at: None,
            token_type: "Bearer".to_string(),
        };

        let mut page_token: Option<String> = None;
        let mut total_processed = 0u64;
        let mut total_failed = 0u64;
        let batch_size = max_messages.unwrap_or(100).min(500); // Gmail API limit

        loop {
            match self.sync_message_batch(
                &tokens.access_token,
                account_id,
                batch_size,
                page_token.clone(),
            ).await {
                Ok((processed, failed, next_token, history_id)) => {
                    total_processed += processed;
                    total_failed += failed;
                    
                    if let Some(hist_id) = history_id {
                        sync_result.new_history_id = Some(hist_id);
                    }

                    // Check if we have more pages and haven't hit the limit
                    if let Some(token) = next_token {
                        if max_messages.is_none_or(|max| total_processed < max as u64) {
                            page_token = Some(token);
                            continue;
                        }
                    }
                    break;
                }
                Err(e) => {
                    sync_result.errors.push(format!("Batch sync failed: {}", e));
                    total_failed += batch_size as u64;
                    break;
                }
            }
        }

        sync_result.messages_processed = total_processed;
        sync_result.messages_failed = total_failed;
        sync_result.duration_ms = start_time.elapsed().as_millis() as u64;
        sync_result.status = if total_failed == 0 { SyncStatus::Completed } else { SyncStatus::Failed };

        // Update sync completion
        self.update_sync_completion(account_id, &sync_result).await?;

        Ok(sync_result)
    }

    /// Perform incremental sync using history API
    pub async fn perform_incremental_sync(&self, account_id: &str) -> Result<SyncResult> {
        let start_time = std::time::Instant::now();
        let mut sync_result = SyncResult {
            account_id: account_id.to_string(),
            sync_type: SyncType::Incremental,
            messages_processed: 0,
            messages_failed: 0,
            new_history_id: None,
            duration_ms: 0,
            errors: Vec::new(),
            status: SyncStatus::InProgress,
        };

        // Get current sync state
        let sync_state = self.get_sync_state(account_id).await?
            .ok_or_else(|| anyhow::anyhow!("No sync state found for account {}", account_id))?;

        let start_history_id = sync_state.history_id
            .ok_or_else(|| anyhow::anyhow!("No history ID found for incremental sync"))?;

        // Get tokens for the account
        let tokens = GmailTokens {
            access_token: "placeholder".to_string(),
            refresh_token: Some("placeholder".to_string()),
            expires_at: None,
            token_type: "Bearer".to_string(),
        };

        // Process history changes
        match self.process_history_changes(&tokens.access_token, account_id, &start_history_id).await {
            Ok((processed, failed, new_history_id)) => {
                sync_result.messages_processed = processed;
                sync_result.messages_failed = failed;
                sync_result.new_history_id = new_history_id;
                sync_result.status = if failed == 0 { SyncStatus::Completed } else { SyncStatus::Failed };
            }
            Err(e) => {
                sync_result.errors.push(format!("History processing failed: {}", e));
                sync_result.status = SyncStatus::Failed;
            }
        }

        sync_result.duration_ms = start_time.elapsed().as_millis() as u64;

        // Update sync completion
        self.update_sync_completion(account_id, &sync_result).await?;

        Ok(sync_result)
    }

    /// Get sync state for an account
    pub async fn get_sync_state(&self, account_id: &str) -> Result<Option<SyncState>> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        self.get_sync_state_from_db(account_id, &conn)
    }

    /// Pause sync for an account
    pub async fn pause_sync(&self, account_id: &str) -> Result<()> {
        self.update_sync_status(account_id, SyncStatus::Paused).await
    }

    /// Resume sync for an account
    pub async fn resume_sync(&self, account_id: &str) -> Result<SyncResult> {
        // Update status to idle first
        self.update_sync_status(account_id, SyncStatus::Idle).await?;
        
        // Perform incremental sync
        self.perform_incremental_sync(account_id).await
    }

    /// Get messages in batch from Gmail API
    pub async fn get_messages_batch(
        &self,
        account_id: &str,
        _max_results: Option<u32>,
        page_token: Option<String>,
        config: &GmailSyncConfig,
        tokens: &GmailTokens,
    ) -> Result<BatchMessageResponse> {
        self.create_gmail_client(config, tokens).await?;

        // Mock implementation for now
        let full_messages = vec![
            serde_json::json!({
                "id": "mock_message_1",
                "threadId": "mock_thread_1",
                "subject": "Mock Email Subject",
                "from": "test@example.com",
                "to": ["user@example.com"],
                "date": "2024-01-01T00:00:00Z",
                "body": "Mock email body content"
            })
        ];

        println!("Would store {} messages for account {}", full_messages.len(), account_id);

        Ok(BatchMessageResponse {
            messages: full_messages,
            history_id: "mock_history_id".to_string(),
            next_page_token: page_token,
        })
    }

    /// Get history changes from Gmail API
    pub async fn get_history(
        &self,
        account_id: &str,
        _start_history_id: &str,
        config: &GmailSyncConfig,
        tokens: &GmailTokens,
    ) -> Result<HistoryResponse> {
        self.create_gmail_client(config, tokens).await?;

        // Mock implementation
        let history = vec![
            serde_json::json!({
                "id": "mock_history_1",
                "messages": [{"id": "mock_message_1", "threadId": "mock_thread_1"}],
                "messagesAdded": [{"message": {"id": "mock_message_1"}}]
            })
        ];

        println!("Would store history for account {}", account_id);

        Ok(HistoryResponse {
            history,
            history_id: "mock_history_id".to_string(),
            next_page_token: None,
        })
    }

    /// Setup push notifications for real-time sync
    pub async fn setup_push_notifications(
        &self,
        account_id: &str,
        topic_name: &str,
        config: &GmailSyncConfig,
        tokens: &GmailTokens,
    ) -> Result<PushNotificationSetupResponse> {
        self.create_gmail_client(config, tokens).await?;

        // Mock implementation
        let mut states = self.sync_states.write().await;
        let state = states.entry(account_id.to_string()).or_insert_with(|| AccountSyncState {
            account_id: account_id.to_string(),
            ..Default::default()
        });

        state.push_subscription_id = Some("mock_subscription_id".to_string());
        state.push_expiration = Some(Utc::now() + Duration::days(7));
        state.last_history_id = Some("mock_history_id".to_string());

        println!("Would set up push notifications for account {} with topic {}", account_id, topic_name);

        Ok(PushNotificationSetupResponse {
            success: true,
            expiration: "mock_expiration".to_string(),
        })
    }

    /// Stop push notifications
    pub async fn stop_push_notifications(
        &self,
        account_id: &str,
        config: &GmailSyncConfig,
        tokens: &GmailTokens,
    ) -> Result<()> {
        self.create_gmail_client(config, tokens).await?;

        // Mock implementation
        let mut states = self.sync_states.write().await;
        if let Some(state) = states.get_mut(account_id) {
            state.push_subscription_id = None;
            state.push_expiration = None;
        }

        println!("Would stop push notifications for account {}", account_id);
        Ok(())
    }

    /// Handle incoming push notification
    pub async fn handle_push_notification(&self, notification_data: &PushNotificationData) -> Result<()> {
        println!("Handling push notification for account {}", notification_data.account_id);
        
        // Trigger incremental sync
        self.perform_incremental_sync(&notification_data.account_id).await?;
        
        Ok(())
    }

    /// Get account sync state
    pub async fn get_account_sync_state(&self, account_id: &str) -> Result<Option<AccountSyncState>> {
        let states = self.sync_states.read().await;
        Ok(states.get(account_id).cloned())
    }

    /// Update account sync state
    pub async fn update_account_sync_state(&self, account_id: &str, sync_state: AccountSyncState) -> Result<()> {
        let mut states = self.sync_states.write().await;
        states.insert(account_id.to_string(), sync_state);
        Ok(())
    }

    /// Message operations
    pub async fn mark_as_read(&self, account_id: &str, message_ids: &[String], config: &GmailSyncConfig, tokens: &GmailTokens) -> Result<()> {
        self.create_gmail_client(config, tokens).await?;
        println!("Would mark {} messages as read for account {}", message_ids.len(), account_id);
        Ok(())
    }

    pub async fn mark_as_unread(&self, account_id: &str, message_ids: &[String], config: &GmailSyncConfig, tokens: &GmailTokens) -> Result<()> {
        self.create_gmail_client(config, tokens).await?;
        println!("Would mark {} messages as unread for account {}", message_ids.len(), account_id);
        Ok(())
    }

    pub async fn star_messages(&self, account_id: &str, message_ids: &[String], config: &GmailSyncConfig, tokens: &GmailTokens) -> Result<()> {
        self.create_gmail_client(config, tokens).await?;
        println!("Would star {} messages for account {}", message_ids.len(), account_id);
        Ok(())
    }

    pub async fn unstar_messages(&self, account_id: &str, message_ids: &[String], config: &GmailSyncConfig, tokens: &GmailTokens) -> Result<()> {
        self.create_gmail_client(config, tokens).await?;
        println!("Would unstar {} messages for account {}", message_ids.len(), account_id);
        Ok(())
    }

    pub async fn delete_messages(&self, account_id: &str, message_ids: &[String], config: &GmailSyncConfig, tokens: &GmailTokens) -> Result<()> {
        self.create_gmail_client(config, tokens).await?;
        println!("Would delete {} messages for account {}", message_ids.len(), account_id);
        Ok(())
    }

    pub async fn archive_messages(&self, account_id: &str, message_ids: &[String], config: &GmailSyncConfig, tokens: &GmailTokens) -> Result<()> {
        self.create_gmail_client(config, tokens).await?;
        println!("Would archive {} messages for account {}", message_ids.len(), account_id);
        Ok(())
    }

    pub async fn modify_labels(&self, account_id: &str, message_ids: &[String], add_labels: &[String], remove_labels: &[String], config: &GmailSyncConfig, tokens: &GmailTokens) -> Result<()> {
        self.create_gmail_client(config, tokens).await?;
        println!("Would modify labels for {} messages in account {}: add {:?}, remove {:?}", message_ids.len(), account_id, add_labels, remove_labels);
        Ok(())
    }

    // Helper methods
    async fn create_gmail_client(&self, _config: &GmailSyncConfig, _tokens: &GmailTokens) -> Result<()> {
        // Mock implementation
        println!("Creating Gmail client for {}", _config.client_id);
        Ok(())
    }

    async fn sync_message_batch(
        &self,
        _access_token: &str,
        account_id: &str,
        batch_size: u32,
        page_token: Option<String>,
    ) -> Result<(u64, u64, Option<String>, Option<String>)> {
        // Mock implementation
        println!("Syncing batch of {} messages for account {}", batch_size, account_id);
        Ok((batch_size as u64, 0, page_token, Some("mock_history_id".to_string())))
    }

    async fn process_history_changes(
        &self,
        _access_token: &str,
        account_id: &str,
        start_history_id: &str,
    ) -> Result<(u64, u64, Option<String>)> {
        // Mock implementation
        println!("Processing history changes for account {} from history ID {}", account_id, start_history_id);
        Ok((10, 0, Some("new_history_id".to_string())))
    }

    fn get_sync_state_from_db(&self, account_id: &str, conn: &rusqlite::Connection) -> Result<Option<SyncState>> {
        let result = conn.query_row(
            "SELECT account_id, history_id, last_sync_timestamp, messages_synced, 
             messages_failed, sync_status, errors 
             FROM sync_states 
             WHERE account_id = ?1",
            rusqlite::params![account_id],
            |row| {
                let errors_json: String = row.get(6)?;
                let errors: Vec<String> = serde_json::from_str(&errors_json).unwrap_or_default();
                
                let sync_status_str: String = row.get(5)?;
                let sync_status = match sync_status_str.as_str() {
                    "InProgress" => SyncStatus::InProgress,
                    "Completed" => SyncStatus::Completed,
                    "Failed" => SyncStatus::Failed,
                    "Paused" => SyncStatus::Paused,
                    _ => SyncStatus::Idle,
                };

                Ok(SyncState {
                    account_id: row.get(0)?,
                    history_id: row.get(1)?,
                    last_sync_timestamp: row.get(2)?,
                    messages_synced: row.get(3)?,
                    messages_failed: row.get(4)?,
                    sync_status,
                    errors,
                })
            }
        ).optional().context("Failed to get sync state from database")?;

        Ok(result)
    }

    fn store_sync_state_in_db(&self, sync_state: &SyncState, conn: &rusqlite::Connection) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        let errors_json = serde_json::to_string(&sync_state.errors)
            .context("Failed to serialize errors")?;

        conn.execute(
            "INSERT OR REPLACE INTO sync_states 
             (account_id, history_id, last_sync_timestamp, messages_synced, 
              messages_failed, sync_status, errors, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                &sync_state.account_id,
                &sync_state.history_id,
                &sync_state.last_sync_timestamp,
                sync_state.messages_synced,
                sync_state.messages_failed,
                format!("{:?}", sync_state.sync_status),
                &errors_json,
                &now,
                &now,
            ],
        ).context("Failed to store sync state")?;

        Ok(())
    }

    fn store_sync_config_in_db(&self, config: &SyncConfig, conn: &rusqlite::Connection) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        let labels_to_sync_json = config.labels_to_sync.as_ref()
            .map(|labels| serde_json::to_string(labels).unwrap_or_default())
            .unwrap_or_default();
        let exclude_labels_json = config.exclude_labels.as_ref()
            .map(|labels| serde_json::to_string(labels).unwrap_or_default())
            .unwrap_or_default();

        conn.execute(
            "INSERT OR REPLACE INTO sync_configs 
             (account_id, max_messages_per_batch, sync_interval_minutes, 
              labels_to_sync, exclude_labels, full_sync_on_startup, 
              enable_incremental_sync, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                &config.account_id,
                config.max_messages_per_batch,
                config.sync_interval_minutes,
                &labels_to_sync_json,
                &exclude_labels_json,
                config.full_sync_on_startup,
                config.enable_incremental_sync,
                &now,
                &now,
            ],
        ).context("Failed to store sync config")?;

        Ok(())
    }

    async fn update_sync_status(&self, account_id: &str, status: SyncStatus) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        conn.execute(
            "UPDATE sync_states SET sync_status = ?1, updated_at = ?2 WHERE account_id = ?3",
            rusqlite::params![format!("{:?}", status), &Utc::now().to_rfc3339(), account_id],
        ).context("Failed to update sync status")?;

        Ok(())
    }

    async fn update_sync_completion(&self, account_id: &str, result: &SyncResult) -> Result<()> {
        let conn = self.db_manager.get_connection()
            .context("Failed to get database connection")?;

        let errors_json = serde_json::to_string(&result.errors)
            .context("Failed to serialize errors")?;

        conn.execute(
            "UPDATE sync_states 
             SET messages_synced = ?1, messages_failed = ?2, sync_status = ?3, 
                 errors = ?4, history_id = ?5, last_sync_timestamp = ?6, updated_at = ?7 
             WHERE account_id = ?8",
            rusqlite::params![
                result.messages_processed,
                result.messages_failed,
                format!("{:?}", result.status),
                &errors_json,
                &result.new_history_id,
                &Utc::now().to_rfc3339(),
                &Utc::now().to_rfc3339(),
                account_id,
            ],
        ).context("Failed to update sync completion")?;

        Ok(())
    }
} 