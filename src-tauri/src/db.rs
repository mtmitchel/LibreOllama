use std::sync::{Arc, Mutex};
use crate::database::DatabaseManager;

// Type alias for database pool
pub type DbPool = Arc<Mutex<DatabaseManager>>;