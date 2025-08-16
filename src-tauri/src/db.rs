use std::sync::{Arc, Mutex};
use crate::database::DatabaseManager;

// Type alias for database pool
#[allow(dead_code)]
pub type DbPool = Arc<Mutex<DatabaseManager>>;