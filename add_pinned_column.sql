-- Add the missing 'pinned' column to chat_sessions table
ALTER TABLE chat_sessions ADD COLUMN pinned BOOLEAN DEFAULT FALSE;

-- Create an index for better performance when filtering by pinned status
CREATE INDEX idx_chat_sessions_pinned ON chat_sessions(pinned);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN chat_sessions.pinned IS 'Indicates if the chat session is pinned by the user';