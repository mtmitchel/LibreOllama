-- Check if time_block column exists in task_metadata table
SELECT sql FROM sqlite_master 
WHERE type='table' AND name='task_metadata';

-- Check schema version
SELECT * FROM schema_version ORDER BY version DESC LIMIT 5;

-- Check if any task has timeBlock data
SELECT * FROM task_metadata WHERE time_block IS NOT NULL;