import { useState, useMemo } from 'react';
import { Button } from './Button';
import { 
  XCircleIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/solid';
import { DateTime } from 'luxon';
import { Database } from '../types/database.types';

// Use database types for stronger typing
type MaintenanceEvent = Database['public']['Tables']['maintenance_events']['Row'];
type Car = Database['public']['Tables']['cars']['Row'];

export default function MaintenanceView({ 
  car, 
  schedules, 
  loading,
  onAddSchedule,
  onUpdateSchedule
}: {
  car: Car;
  schedules: MaintenanceEvent[];
  loading: boolean;
  onAddSchedule: (schedule: Partial<MaintenanceEvent>) => void;
  onUpdateSchedule: (id: number, updates: Partial<MaintenanceEvent>) => void;
}) {
  const [state, setState] = useState<{
    showAddSchedule: boolean;
    selectedStatus: string;
    newSchedule: Partial<MaintenanceEvent>;
  }>({
    showAddSchedule: false,
    selectedStatus: '',
    newSchedule: {
      car_id: car.id,
      title: '',
      description: '',
      date: DateTime.now().plus({ months: 1 }).toISODate() || '',
      completed: false
    }
  });

  // Memoized filtered schedules with improved type safety
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      const scheduleDate = DateTime.fromISO(schedule.date);
      const today = DateTime.now();

      const isOverdue = scheduleDate < today && !schedule.completed;
      const isCompleted = schedule.completed;
      const isUpcoming = scheduleDate >= today && !schedule.completed;

      switch (state.selectedStatus) {
        case 'Overdue':
          return isOverdue;
        case 'Completed':
          return isCompleted;
        case 'Upcoming':
          return isUpcoming;
        default:
          return true;
      }
    });
  }, [schedules, state.selectedStatus]);

  // Handle new schedule input changes
  const handleNewScheduleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      newSchedule: {
        ...prev.newSchedule,
        [name]: value
      }
    }));
  };

  // Submit new maintenance schedule
  const handleAddSchedule = () => {
    if (state.newSchedule.title && state.newSchedule.date) {
      onAddSchedule(state.newSchedule);
      setState(prev => ({
        ...prev,
        showAddSchedule: false,
        newSchedule: {
          car_id: car.id,
          title: '',
          description: '',
          date: DateTime.now().plus({ months: 1 }).toISODate() || '',
          completed: false
        }
      }));
    }
  };

  // Status filter UI component
  const StatusFilterButtons = () => (
    <div className="flex space-x-2 mb-4">
      {['Overdue', 'Upcoming', 'Completed'].map(status => (
        <button
          key={status}
          onClick={() => setState(prev => ({
            ...prev,
            selectedStatus: status === prev.selectedStatus ? '' : status
          }))}
          className={`px-3 py-1 rounded ${
            state.selectedStatus === status 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading maintenance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Filter Buttons */}
      <StatusFilterButtons />

      {/* Maintenance Schedule Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Maintenance Schedule</h2>
        <Button onClick={() => setState(prev => ({ ...prev, showAddSchedule: true }))}>
          Add Schedule
        </Button>
      </div>

      {/* Maintenance Schedules List */}
      <div className="space-y-4">
        {filteredSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <h3 className="font-medium">{schedule.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{schedule.description}</p>
              <p className="text-sm text-gray-500">
                Date: {DateTime.fromISO(schedule.date).toLocaleString(DateTime.DATE_FULL)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {!schedule.completed ? (
                <CheckCircleIcon 
                  className="h-6 w-6 text-green-500 cursor-pointer hover:text-green-600"
                  onClick={() => onUpdateSchedule(schedule.id, { completed: true })}
                />
              ) : (
                <XCircleIcon 
                  className="h-6 w-6 text-red-500 cursor-pointer hover:text-red-600"
                  onClick={() => onUpdateSchedule(schedule.id, { completed: false })}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Maintenance Schedule Modal */}
      {state.showAddSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Add Maintenance Schedule</h2>
            
            {/* Title Input */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={state.newSchedule.title}
                onChange={handleNewScheduleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                placeholder="Enter maintenance event title"
              />
            </div>

            {/* Description Input */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={state.newSchedule.description}
                onChange={handleNewScheduleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                placeholder="Enter maintenance event description"
              />
            </div>

            {/* Date Input */}
            <div className="mb-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={state.newSchedule.date}
                onChange={handleNewScheduleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => setState(prev => ({ ...prev, showAddSchedule: false }))}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAddSchedule}
              >
                Add Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
