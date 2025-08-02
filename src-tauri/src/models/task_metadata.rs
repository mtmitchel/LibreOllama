use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeBlock {
    pub start_time: String,
    pub end_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMetadata {
    pub id: i64,
    pub google_task_id: String,
    pub task_list_id: String,
    pub priority: String,
    pub time_block: Option<TimeBlock>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Label {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subtask {
    pub id: i64,
    pub task_metadata_id: i64,
    pub title: String,
    pub completed: bool,
    pub position: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskMetadata {
    pub google_task_id: String,
    pub task_list_id: String,
    pub priority: Option<String>,
    pub labels: Option<Vec<String>>,
    pub subtasks: Option<Vec<CreateSubtask>>,
    pub time_block: Option<TimeBlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSubtask {
    pub title: String,
    pub completed: bool,
    pub position: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskMetadata {
    pub priority: Option<String>,
    pub labels: Option<Vec<String>>,
    pub subtasks: Option<Vec<UpdateSubtask>>,
    pub time_block: Option<TimeBlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSubtask {
    pub id: Option<i64>,
    pub title: String,
    pub completed: bool,
    pub position: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMetadataWithRelations {
    #[serde(flatten)]
    pub metadata: TaskMetadata,
    pub labels: Vec<Label>,
    pub subtasks: Vec<Subtask>,
}
