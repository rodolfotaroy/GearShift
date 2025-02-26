-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage for car images and documents
INSERT INTO storage.buckets (id, name) 
VALUES ('car-images', 'car-images')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name) 
VALUES ('car-documents', 'car-documents')
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view car images
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');

-- Allow authenticated users to upload car images and documents
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('car-images', 'car-documents') 
    AND auth.role() = 'authenticated'
  );

-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- New fields for maintenance
    vin TEXT,
    last_oil_change DATE,
    next_oil_change DATE,
    last_inspection_date DATE,
    next_inspection_date DATE,
    mileage INTEGER DEFAULT 0
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create maintenance_schedule table
CREATE TABLE IF NOT EXISTS maintenance_schedule (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    due_date DATE NOT NULL,
    mileage_due INTEGER,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create service_history table
CREATE TABLE IF NOT EXISTS service_history (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    service_date DATE NOT NULL,
    mileage INTEGER,
    cost DECIMAL(10,2),
    description TEXT,
    document_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    expiry_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for cars
CREATE POLICY "Users can view their own cars" ON cars
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cars" ON cars
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cars" ON cars
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cars" ON cars
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for expenses
CREATE POLICY "Users can view their own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for maintenance_schedule
CREATE POLICY "Users can view their own maintenance schedules" ON maintenance_schedule
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own maintenance schedules" ON maintenance_schedule
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own maintenance schedules" ON maintenance_schedule
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own maintenance schedules" ON maintenance_schedule
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for service_history
CREATE POLICY "Users can view their own service history" ON service_history
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own service history" ON service_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own service history" ON service_history
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own service history" ON service_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for documents
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);
