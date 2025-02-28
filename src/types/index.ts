export interface Car {
    id: number;
    make: string;
    model: string;
    year?: number;
    image_url?: string | null;
    created_at: string;
    user_id: string;
    vin?: string | null;
    last_oil_change?: string;
    next_oil_change?: string;
    last_inspection_date?: string;
    next_inspection_date?: string;
    mileage?: number | null;
}

export interface Expense {
    id: number;
    car_id: number;
    category: ExpenseCategory;
    amount: number;
    date: string;
    description?: string;
    created_at: string;
    user_id: string;
}

export interface MaintenanceSchedule {
    id?: number;
    car_id: number;
    service_type: string;
    due_date: string;
    mileage_due: number;
    description: string;
    status: 'Pending' | 'Completed' | 'Overdue';
}

export interface ServiceHistory {
    id?: number;
    car_id: number;
    service_type: string;
    service_date: string;
    mileage: number;
    cost: number;
    description: string;
}

export interface Document {
    id: number;
    car_id: number;
    document_type: DocumentType;
    title: string;
    file_url: string;
    expiry_date?: string;
    description?: string;
    created_at: string;
    user_id: string;
}

export interface CalendarEvent {
    id?: string;
    car_id: string;
    title: string;
    description: string;
    event_type: typeof EVENT_TYPES[number];
    start_date: string;
    end_date?: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    recurrence_interval?: number;
    recurrence_end_date?: string;
    reminder_days?: string[];
    created_at?: string;
}

export type EventType = "maintenance" | "service" | "inspection" | "other";
export type EventStatus = "scheduled" | "completed" | "cancelled" | "in_progress";

export const EVENT_TYPES: EventType[] = ["maintenance", "service", "inspection", "other"];
export const EVENT_STATUS: EventStatus[] = ["scheduled", "completed", "cancelled", "in_progress"];

export const SERVICE_TYPES = [
  'Oil Change', 
  'Tire Rotation', 
  'Brake Inspection', 
  'Battery Check', 
  'Air Filter Replacement', 
  'Transmission Service', 
  'Coolant Flush', 
  'Other'
] as const;

export const EVENT_TYPES_NEW = [
  'Maintenance', 
  'Fuel', 
  'Insurance', 
  'Registration', 
  'Inspection', 
  'Other'
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];
export type EventTypeNew = typeof EVENT_TYPES_NEW[number];

export type DocumentType = "Receipt" | "Warranty" | "Insurance" | "Registration" | "Inspection" | "Service Record" | "Other";
export const DOCUMENT_TYPES: DocumentType[] = ["Receipt", "Warranty", "Insurance", "Registration", "Inspection", "Service Record", "Other"];

export const EXPENSE_CATEGORIES = [
    'Gas',
    'Car Wash',
    'Repairs',
    'Insurance',
    'Registration',
    'Maintenance',
    'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
