-- Check task_metadata table structure
SELECT sql FROM sqlite_master WHERE type='table' AND name='task_metadata';

-- Check for any task with timeBlock data
SELECT * FROM task_metadata WHERE time_block IS NOT NULL;

-- Check a specific task by Google ID (replace with actual ID)
SELECT * FROM task_metadata WHERE google_task_id LIKE '%TZTEST%' OR google_task_id IN (
    SELECT id FROM tasks WHERE title LIKE '%TZTEST%'
);