use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskIdMap {
    pub id: i32,
    pub local_id: String,
    pub google_task_id: String,
    pub task_list_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskIdMap {
    pub local_id: String,
    pub google_task_id: String,
    pub task_list_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskIdMap {
    pub google_task_id: Option<String>,
    pub task_list_id: Option<String>,
}