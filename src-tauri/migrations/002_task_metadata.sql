-- Task metadata table for storing labels, priority, and other metadata
CREATE TABLE IF NOT EXISTS task_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_task_id TEXT NOT NULL UNIQUE,
    task_list_id TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Labels table
CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task labels junction table (many-to-many)
CREATE TABLE IF NOT EXISTS task_labels (
    task_metadata_id INTEGER NOT NULL,
    label_id INTEGER NOT NULL,
    PRIMARY KEY (task_metadata_id, label_id),
    FOREIGN KEY (task_metadata_id) REFERENCES task_metadata(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_metadata_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_metadata_id) REFERENCES task_metadata(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_task_metadata_google_task_id ON task_metadata(google_task_id);
CREATE INDEX idx_task_metadata_task_list_id ON task_metadata(task_list_id);
CREATE INDEX idx_task_labels_task_id ON task_labels(task_metadata_id);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_metadata_id);

-- Trigger to update the updated_at timestamp
CREATE TRIGGER update_task_metadata_timestamp 
AFTER UPDATE ON task_metadata
BEGIN
    UPDATE task_metadata SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;