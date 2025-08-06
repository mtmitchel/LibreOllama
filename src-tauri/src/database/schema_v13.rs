/// Run migration v13 - Add task_id_map for stable local IDs
pub fn run_migration_v13(conn: &rusqlite::Connection) -> anyhow::Result<()> {
    use anyhow::Context;
    
    // Create task_id_map table to maintain stable local IDs
    conn.execute(
        "CREATE TABLE IF NOT EXISTS task_id_map (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            local_id TEXT NOT NULL UNIQUE,
            google_task_id TEXT NOT NULL,
            task_list_id TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).context("Failed to create task_id_map table")?;

    // Create indexes for efficient lookups
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_task_id_map_local_id ON task_id_map(local_id)",
        [],
    ).context("Failed to create idx_task_id_map_local_id")?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_task_id_map_google_task_id ON task_id_map(google_task_id)",
        [],
    ).context("Failed to create idx_task_id_map_google_task_id")?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_task_id_map_task_list ON task_id_map(task_list_id)",
        [],
    ).context("Failed to create idx_task_id_map_task_list")?;

    // Add local_id column to task_metadata table if not exists
    let has_local_id: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('task_metadata') WHERE name='local_id'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        )
        .unwrap_or(false);

    if !has_local_id {
        conn.execute(
            "ALTER TABLE task_metadata ADD COLUMN local_id TEXT",
            [],
        ).context("Failed to add local_id column to task_metadata")?;
        
        // Create index on local_id in task_metadata
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_task_metadata_local_id ON task_metadata(local_id)",
            [],
        ).context("Failed to create idx_task_metadata_local_id")?;
    }

    // Migrate existing tasks to have local IDs (using google_task_id as initial local_id)
    // This ensures backward compatibility
    conn.execute(
        "INSERT INTO task_id_map (local_id, google_task_id, task_list_id)
         SELECT 
             'local-' || google_task_id,
             google_task_id,
             task_list_id
         FROM task_metadata
         WHERE NOT EXISTS (
             SELECT 1 FROM task_id_map 
             WHERE task_id_map.google_task_id = task_metadata.google_task_id
         )",
        [],
    ).context("Failed to migrate existing tasks to task_id_map")?;

    // Update task_metadata to use the new local_id
    conn.execute(
        "UPDATE task_metadata 
         SET local_id = 'local-' || google_task_id
         WHERE local_id IS NULL",
        [],
    ).context("Failed to update task_metadata with local_ids")?;

    Ok(())
}