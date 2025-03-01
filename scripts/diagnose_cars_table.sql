-- Check table structure
\d public.cars;

-- If user_id column doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='cars' AND column_name='user_id'
    ) THEN
        ALTER TABLE public.cars 
        ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create a function to ensure all cars have a user_id
CREATE OR REPLACE FUNCTION assign_default_user_id()
RETURNS VOID AS $$
DECLARE
    default_user_id UUID;
BEGIN
    -- Get the first user ID
    SELECT id INTO default_user_id 
    FROM auth.users 
    LIMIT 1;

    -- Update cars without a user_id
    UPDATE public.cars 
    SET user_id = default_user_id
    WHERE user_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Call the function to assign default user_id
SELECT assign_default_user_id();

-- Ensure user_id is not nullable
ALTER TABLE public.cars 
ALTER COLUMN user_id SET NOT NULL;

-- Verify the changes
SELECT * FROM public.cars LIMIT 5;
