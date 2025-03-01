-- Comprehensive table diagnostic script

-- Check table existence
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cars'
) AS cars_table_exists;

-- Check column structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cars';

-- Check RLS policies
SELECT 
    polname, 
    polqual, 
    polcmd
FROM pg_policy
WHERE polrelid = 'public.cars'::regclass;

-- Sample data check
SELECT * FROM cars LIMIT 5;

-- User ID column specific check
SELECT 
    COUNT(*) AS total_cars,
    COUNT(user_id) AS cars_with_user_id,
    COUNT(*) - COUNT(user_id) AS cars_without_user_id
FROM cars;
