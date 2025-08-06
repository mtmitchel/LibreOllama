-- Migration 004: Add task_id_map for stable local IDs
-- This migration creates a mapping table between stable local IDs and Google Task IDs
-- This allows tasks to maintain their metadata when moved between lists (which changes Google ID)

-- Create task_id_map table to maintain stable local IDs
CREATE TABLE IF NOT EXISTS task_id_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_id TEXT NOT NULL UNIQUE,
    google_task_id TEXT NOT NULL,
    task_list_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_task_id_map_local_id ON task_id_map(local_id);
CREATE INDEX IF NOT EXISTS idx_task_id_map_google_task_id ON task_id_map(google_task_id);
CREATE INDEX IF NOT EXISTS idx_task_id_map_task_list ON task_id_map(task_list_id);

-- Add local_id column to task_metadata table if not exists
-- This links metadata to the stable local ID instead of Google ID
ALTER TABLE task_metadata ADD COLUMN local_id TEXT;

-- Create index on local_id in task_metadata
CREATE INDEX IF NOT EXISTS idx_task_metadata_local_id ON task_metadata(local_id);

-- Migrate existing tasks to have local IDs (using google_task_id as initial local_id)
-- This ensures backward compatibility
INSERT INTO task_id_map (local_id, google_task_id, task_list_id)
SELECT 
    'local-' || google_task_id,
    google_task_id,
    task_list_id
FROM task_metadata
WHERE NOT EXISTS (
    SELECT 1 FROM task_id_map 
    WHERE task_id_map.google_task_id = task_metadata.google_task_id
);

-- Update task_metadata to use the new local_id
UPDATE task_metadata 
SET local_id = 'local-' || google_task_id
WHERE local_id IS NULL;

-- Insert version record
INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (12, datetime('now'));