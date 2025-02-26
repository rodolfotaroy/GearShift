export interface Car {
  id: number;
  make: string;
  model: string;
}

export interface MaintenanceEvent {
  id: number;
  car_id: number;
  title: string;
  description: string | null;
  event_type: 'maintenance' | 'inspection' | 'insurance' | 'tax' | 'other';
  start_date: string;
  end_date: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrence_interval: number | null;
  recurrence_end_date: string | null;
  parent_event_id: number | null;
  notification_days_before: number[] | null;
}

export interface MaintenanceNotification {
  id: number;
  event_id: number;
  notification_date: string;
  sent_at: string | null;
  created_at: string;
}
