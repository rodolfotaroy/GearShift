-- Add user_id column to maintenance_events
ALTER TABLE maintenance_events 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE maintenance_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own maintenance events" ON maintenance_events;
DROP POLICY IF EXISTS "Users can create their own maintenance events" ON maintenance_events;
DROP POLICY IF EXISTS "Users can update their own maintenance events" ON maintenance_events;
DROP POLICY IF EXISTS "Users can delete their own maintenance events" ON maintenance_events;

-- Create policies for maintenance_events
CREATE POLICY "Users can view their own maintenance events" ON maintenance_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own maintenance events" ON maintenance_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own maintenance events" ON maintenance_events
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own maintenance events" ON maintenance_events
    FOR DELETE USING (auth.uid() = user_id);