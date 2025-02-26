export interface Car {
    id: number;
    make: string;
    model: string;
    year?: number;
    image_url?: string;
    created_at: string;
    user_id: string;
    vin?: string;
    last_oil_change?: string;
    next_oil_change?: string;
    last_inspection_date?: string;
    next_inspection_date?: string;
    mileage?: number;
}

export interface Expense {
    id: number;
    car_id: number;
    category: string;
    amount: number;
    date: string;
    description?: string;
    created_at: string;
    user_id: string;
}

export interface MaintenanceSchedule {
    id: number;
    car_id: number;
    service_type: string;
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
    service_type: string;
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
    document_type: string;
    title: string;
    file_url: string;
    expiry_date?: string;
    description?: string;
    created_at: string;
    user_id: string;
}

export const EXPENSE_CATEGORIES = [
    'Gas',
    'Car Wash',
    'Repairs',
    'Accessories',
    'Insurance',
    'Road Tax',
    'JAF',
    'Other'
] as const;

export const DOCUMENT_TYPES = [
    'Receipt',
    'Warranty',
    'Insurance',
    'Registration',
    'Inspection',
    'Service Record',
    'Other'
] as const;

export const SERVICE_TYPES = [
    'Oil Change',
    'Tire Rotation',
    'Brake Service',
    'Air Filter',
    'Battery',
    'Inspection',
    'Other'
] as const;
