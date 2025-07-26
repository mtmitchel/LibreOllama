-- Create table for storing task metadata that Google Tasks doesn't support
CREATE TABLE IF NOT EXISTS task_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_task_id TEXT NOT NULL UNIQUE,
    google_list_id TEXT NOT NULL,
    priority TEXT,
    labels TEXT, -- JSON array stored as text
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_metadata_google_task_id ON task_metadata(google_task_id);
CREATE INDEX IF NOT EXISTS idx_task_metadata_google_list_id ON task_metadata(google_list_id);