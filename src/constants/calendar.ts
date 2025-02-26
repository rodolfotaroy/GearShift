export const EVENT_TYPES = {
  maintenance: { label: 'Maintenance', color: 'bg-blue-100 text-blue-800' },
  inspection: { label: 'Inspection', color: 'bg-yellow-100 text-yellow-800' },
  insurance: { label: 'Insurance', color: 'bg-green-100 text-green-800' },
  tax: { label: 'Tax', color: 'bg-red-100 text-red-800' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800' },
} as const;

export const RECURRENCE_TYPES = {
  none: 'No Recurrence',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
} as const;

export const EVENT_STATUS = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
} as const;
