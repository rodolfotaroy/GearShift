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
          created_at: string
          car_id: string
          event_type: string
          status: string
          date: string
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          car_id: string
          event_type: string
          status: string
          date: string
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          car_id?: string
          event_type?: string
          status?: string
          date?: string
          notes?: string | null
          user_id?: string
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