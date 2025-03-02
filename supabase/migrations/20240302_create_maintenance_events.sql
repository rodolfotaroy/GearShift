-- Create maintenance_events table
CREATE TABLE IF NOT EXISTS maintenance_events (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE maintenance_events ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance_events
CREATE POLICY "Users can view their own maintenance events" ON maintenance_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own maintenance events" ON maintenance_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own maintenance events" ON maintenance_events
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own maintenance events" ON maintenance_events
    FOR DELETE USING (auth.uid() = user_id);
