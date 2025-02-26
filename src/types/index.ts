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
    id: number;
    car_id: number;
    service_type: ServiceType;
    due_date: string;
    mileage_due?: number;
    description?: string;
    is_completed: boolean;
    created_at: string;
    user_id: string;
}

export interface ServiceHistory {
    id: number;
    car_id: number;
    service_type: ServiceType;
    service_date: string;
    mileage?: number;
    cost?: number;
    description?: string;
    document_urls?: string[];
    created_at: string;
    user_id: string;
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

export interface MaintenanceEvent {
    id: number;
    car_id: number;
    title: string;
    description: string;
    event_type: EventType;
    start_date: string;
    status: EventStatus;
    user_id: string;
}

export type EventType = "maintenance" | "service" | "inspection" | "other";
export type EventStatus = "scheduled" | "completed" | "cancelled" | "in_progress";

export const EVENT_TYPES: EventType[] = ["maintenance", "service", "inspection", "other"];
export const EVENT_STATUS: EventStatus[] = ["scheduled", "completed", "cancelled", "in_progress"];

export type ServiceType = "Oil Change" | "Tire Rotation" | "Brake Service" | "Air Filter" | "Battery" | "Inspection" | "Other";
export const SERVICE_TYPES: ServiceType[] = ["Oil Change", "Tire Rotation", "Brake Service", "Air Filter", "Battery", "Inspection", "Other"];

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
