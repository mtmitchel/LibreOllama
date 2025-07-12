#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailLabel {
    pub id: String,
    pub name: String,
    #[serde(rename = "messageListVisibility")]
    pub message_list_visibility: Option<String>,
    #[serde(rename = "labelListVisibility")]
    pub label_list_visibility: Option<String>,
    #[serde(rename = "type")]
    pub label_type: String, // "system" or "user"
    // These fields will be populated by individual label requests
    #[serde(rename = "messagesTotal", default)]
    pub messages_total: Option<i64>,
    #[serde(rename = "messagesUnread", default)]
    pub messages_unread: Option<i64>,
    #[serde(rename = "threadsTotal", default)]
    pub threads_total: Option<i64>,
    #[serde(rename = "threadsUnread", default)]
    pub threads_unread: Option<i64>,
} 