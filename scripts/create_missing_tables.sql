-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES public.cars(id),
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create maintenance_events table (if not exists)
CREATE TABLE IF NOT EXISTS public.maintenance_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES public.cars(id),
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ
);
