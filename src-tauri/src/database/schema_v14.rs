/// Run migration v14 - Simplify labels storage as JSON
pub fn run_migration_v14(conn: &rusqlite::Connection) -> anyhow::Result<()> {
    use anyhow::Context;
    
    // Add labels_json column to task_metadata table if not exists
    let has_labels_json: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('task_metadata') WHERE name='labels_json'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        )
        .unwrap_or(false);

    if !has_labels_json {
        conn.execute(
            "ALTER TABLE task_metadata ADD COLUMN labels_json TEXT",
            [],
        ).context("Failed to add labels_json column to task_metadata")?;
        println!("Added labels_json column to task_metadata table");
    }

    // Migrate any existing labels from the separate tables to JSON
    // First check if the labels tables exist
    let labels_table_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='labels'",
            [],
            |row| {
                let count: i32 = row.get(0)?;
                Ok(count > 0)
            },
        )
        .unwrap_or(false);

    if labels_table_exists {
        // Migrate existing labels to JSON format
        let mut stmt = conn.prepare(
            "SELECT tm.google_task_id, GROUP_CONCAT(l.name || ':' || COALESCE(l.color, 'blue'))
             FROM task_metadata tm
             JOIN task_labels tl ON tm.id = tl.task_metadata_id
             JOIN labels l ON tl.label_id = l.id
             GROUP BY tm.google_task_id"
        )?;
        
        let label_mappings: Vec<(String, String)> = stmt
            .query_map([], |row| {
                Ok((row.get(0)?, row.get(1)?))
            })?
            .collect::<Result<Vec<_>, _>>()?;

        // Update task_metadata with JSON labels
        for (task_id, labels_str) in label_mappings {
            let labels: Vec<serde_json::Value> = labels_str
                .split(',')
                .map(|label| {
                    let parts: Vec<&str> = label.split(':').collect();
                    serde_json::json!({
                        "name": parts.get(0).unwrap_or(&""),
                        "color": parts.get(1).unwrap_or(&"blue")
                    })
                })
                .collect();
            
            let labels_json = serde_json::to_string(&labels)?;
            conn.execute(
                "UPDATE task_metadata SET labels_json = ?1 WHERE google_task_id = ?2",
                rusqlite::params![labels_json, task_id],
            )?;
        }
        
        println!("Migrated existing labels to JSON format");
    }

    Ok(())
}