export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string
          created_at: string
          make: string
          model: string
          year: number
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          make: string
          model: string
          year: number
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          make?: string
          model?: string
          year?: number
          user_id?: string
        }
      }
      maintenance_events: {
        Row: {
          id: number
          car_id: number
          title: string
          description?: string
          date: string
          completed: boolean
          created_at: string
          updated_at: string
          notes?: string
        }
        Insert: {
          id?: number
          car_id: number
          title: string
          description?: string
          date: string
          completed: boolean
          created_at?: string
          updated_at?: string
          notes?: string
        }
        Update: {
          id?: number
          car_id?: number
          title?: string
          description?: string
          date?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
          notes?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface MaintenanceSchedule {
  id: number;
  car_id: number;
  title: string;
  description?: string;
  date: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  event_type?: 'maintenance' | 'inspection' | 'insurance' | 'tax' | 'other';
}