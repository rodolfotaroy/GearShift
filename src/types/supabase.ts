import { Database } from './database.types'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  created_at: string;
  image_url?: string;
  user_id: string;
}

export interface MaintenanceEvent {
  id: string;
  car_id: number;
  title: string;
  description?: string;
  date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceFormData {
  title: string;
  description?: string;
  date: string;
  car_id: number;
  completed?: boolean;
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
