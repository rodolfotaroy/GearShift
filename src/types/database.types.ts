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
          id: string
          user_id: string
          car_id: string
          title: string
          description?: string
          event_type: 'maintenance' | 'inspection' | 'insurance' | 'tax' | 'other'
          start_date: string
          end_date?: string
          status: 'scheduled' | 'completed' | 'cancelled'
          recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          car_id: string
          title: string
          description?: string
          event_type?: 'maintenance' | 'inspection' | 'insurance' | 'tax' | 'other'
          start_date: string
          end_date?: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          car_id?: string
          title?: string
          description?: string
          event_type?: 'maintenance' | 'inspection' | 'insurance' | 'tax' | 'other'
          start_date?: string
          end_date?: string
          status?: 'scheduled' | 'completed' | 'cancelled'
          recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
          created_at?: string
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