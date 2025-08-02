-- Migration 003: Add timeBlock support to task metadata
-- This migration creates the task metadata tables if they don't exist
-- and adds time_block column support

-- Create task_metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_task_id TEXT NOT NULL UNIQUE,
    task_list_id TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    time_block TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create labels table if it doesn't exist
CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create task_labels junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_metadata_id INTEGER NOT NULL,
    label_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_metadata_id) REFERENCES task_metadata(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE,
    UNIQUE(task_metadata_id, label_id)
);

-- Create subtasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_metadata_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_metadata_id) REFERENCES task_metadata(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_metadata_google_task_id ON task_metadata(google_task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_metadata_id ON task_labels(task_metadata_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_metadata_id ON subtasks(task_metadata_id);

-- Insert version record
INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (11, datetime('now'));