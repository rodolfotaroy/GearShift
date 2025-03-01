-- Add user_id column to cars table if not exists
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing cars with a default user_id (optional)
-- Replace 'your-default-user-id' with an actual user ID from your auth.users table
UPDATE public.cars 
SET user_id = (
    SELECT id 
    FROM auth.users 
    LIMIT 1
)
WHERE user_id IS NULL;

-- Ensure the column is not nullable after updating
ALTER TABLE public.cars 
ALTER COLUMN user_id SET NOT NULL;
