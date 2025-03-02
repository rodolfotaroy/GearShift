import { Database } from './database.types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export Database type
export type { Database } from './database.types';

// Type aliases for commonly used types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
export type Car = Tables<'cars'>;
export type MaintenanceEvent = Tables<'maintenance_events'>;

export interface MaintenanceFormData {
  title: string;
  description?: string;
  date: string;
  car_id: number;
  completed?: boolean;
}

export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseQueryResult = Database['public']['Tables']['expenses']['Row'] & {
  cars?: {
    make: string;
    model: string;
  };
}
