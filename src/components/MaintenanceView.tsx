import { useState } from 'react';
import { Button } from './Button';
import { 
  XCircleIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/solid';
import { DateTime } from 'luxon';
import { Database } from '../types/database.types';

type MaintenanceEvent = Database['public']['Tables']['maintenance_events']['Row'];

export default function MaintenanceView({ 
  car, 
  schedules, 
  loading
}: {
  car: any;
  schedules: MaintenanceEvent[];
  loading: boolean;
}) {
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [newSchedule, setNewSchedule] = useState<MaintenanceEvent>({
    id: 0,
    car_id: car?.id ? Number(car.id) : 0,
    title: '',
    description: '',
    date: DateTime.now().plus({ months: 1 }).toISODate() || '',
    completed: false,
    created_at: DateTime.now().toISODate() || '',
    updated_at: DateTime.now().toISODate() || '',
    notes: ''
  });

  const filteredSchedules = schedules.filter(schedule => {
    const scheduleDate = DateTime.fromISO(schedule.date);
    const today = DateTime.now();

    const isOverdue = scheduleDate < today && !schedule.completed;
    const isCompleted = schedule.completed;
    const isUpcoming = scheduleDate >= today && !schedule.completed;

    switch (selectedStatus) {
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

  // Status filter UI component
  const StatusFilterButtons = () => (
    <div className="flex space-x-2 mb-4">
      {['Overdue', 'Upcoming', 'Completed'].map(status => (
        <button
          key={status}
          onClick={() => setSelectedStatus(status === selectedStatus ? '' : status)}
          className={`px-3 py-1 rounded ${
            selectedStatus === status 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );

  if (loading || !car) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading... or No Car Selected</div>
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
        <Button onClick={() => setShowAddSchedule(true)}>
          Add Schedule
        </Button>
      </div>

      {/* Maintenance Schedules List */}
      <div className="space-y-4">
        {filteredSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-white dark:bg-gray-800 shadow rounded-lg"
          >
            <div className="px-4 py-4 flex items-center justify-between sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {DateTime.fromISO(schedule.date) < DateTime.now() && !schedule.completed ? (
                    <XCircleIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  )}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {schedule.title || 'Maintenance Event'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Due: {DateTime.fromISO(schedule.date).toFormat('yyyy/MM/dd')}
                  </div>
                  {schedule.notes && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {schedule.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Maintenance Schedule Modal */}
      {showAddSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Add Maintenance Schedule</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Implement add maintenance schedule logic
            }}>
              {/* Form fields for adding a maintenance schedule */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="date"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <textarea
                  placeholder="Notes"
                  value={newSchedule.notes || ''}
                  onChange={(e) => setNewSchedule({...newSchedule, notes: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button onClick={() => setShowAddSchedule(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
