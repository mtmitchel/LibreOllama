-- Check what tables currently exist in your Supabase database
-- Run this first to see what's already there

SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name; 