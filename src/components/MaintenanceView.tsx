import { useState, useMemo } from 'react';
import { 
  XCircleIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/solid';
import { DateTime } from 'luxon';
import { Car, MaintenanceEvent, Tables } from '../types/supabase';

interface MaintenanceViewProps {
  car: Car;
  schedules: MaintenanceEvent[];
  loading: boolean;
  onAddSchedule: (schedule: Tables<'maintenance_events'>['Insert']) => void;
  onUpdateSchedule: (id: number, updates: Tables<'maintenance_events'>['Update']) => void;
}

export function MaintenanceView({ 
  car, 
  schedules, 
  loading,
  onAddSchedule,
  onUpdateSchedule
}: MaintenanceViewProps) {
  const [scheduleState, setScheduleState] = useState<{
    showAddSchedule: boolean;
    selectedStatus: string;
    newSchedule: Tables<'maintenance_events'>['Insert'];
  }>({
    showAddSchedule: false,
    selectedStatus: '',
    newSchedule: {
      car_id: car.id,
      title: '',
      description: undefined,
      date: DateTime.now().toISODate() || '',
      completed: false,
      user_id: car.user_id
    }
  });

  // Update state setter to ensure type compatibility
  const updateScheduleState = (
    update: Partial<{
      showAddSchedule: boolean;
      selectedStatus: string;
      newSchedule: Tables<'maintenance_events'>['Insert'];
    }>
  ) => {
    setScheduleState(state => ({
      ...state,
      ...update,
    }));
  };

  const updateNewSchedule = (updates: Tables<'maintenance_events'>['Insert']) => {
    updateScheduleState({
      newSchedule: {
        ...scheduleState.newSchedule,
        ...updates
      }
    });
  };

  // Memoized filtered schedules with improved type safety
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      const scheduleDate = DateTime.fromISO(schedule.date);
      const today = DateTime.now();

      const isOverdue = scheduleDate < today && !schedule.completed;
      const isCompleted = schedule.completed;
      const isUpcoming = scheduleDate >= today && !schedule.completed;

      switch (scheduleState.selectedStatus) {
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
  }, [schedules, scheduleState.selectedStatus]);

  // Handle new schedule input changes
  const handleNewScheduleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateNewSchedule({ [name as keyof Tables<'maintenance_events'>['Insert']]: value });
  };

  // Submit new maintenance schedule
  const handleAddSchedule = () => {
    if (scheduleState.newSchedule.title && scheduleState.newSchedule.date) {
      onAddSchedule({
        ...scheduleState.newSchedule,
        car_id: car.id,
        user_id: car.user_id,
        date: scheduleState.newSchedule.date || DateTime.now().toISODate() || '',
        completed: false
      });
      updateScheduleState({
        showAddSchedule: false,
        newSchedule: {
          car_id: car.id,
          title: '',
          description: undefined,
          date: DateTime.now().toISODate() || '',
          completed: false,
          user_id: car.user_id
        }
      });
    }
  };

  // Mark schedule as completed or uncompleted
  const toggleScheduleStatus = (schedule: MaintenanceEvent) => {
    onUpdateSchedule(schedule.id, { 
      completed: !schedule.completed,
      updated_at: new Date().toISOString()
    });
  };

  // Render methods
  const renderAddScheduleForm = () => {
    if (!scheduleState.showAddSchedule) return null;

    return (
      <div className="bg-white dark:bg-dark-background-secondary rounded-lg shadow-md p-6 mb-4">
        <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-dark-text-primary">
          Add New Maintenance Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-dark-text-primary mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={scheduleState.newSchedule.title}
              onChange={handleNewScheduleChange}
              className="input-field"
              placeholder="Enter schedule title"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-neutral-700 dark:text-dark-text-primary mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={scheduleState.newSchedule.date}
              onChange={handleNewScheduleChange}
              className="input-field"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-dark-text-primary mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={scheduleState.newSchedule.description}
              onChange={handleNewScheduleChange}
              className="input-field"
              placeholder="Enter schedule details"
              rows={3}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => updateScheduleState({ showAddSchedule: false })}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddSchedule}
            className="btn btn-primary"
            disabled={!scheduleState.newSchedule.title || !scheduleState.newSchedule.date}
          >
            Add Schedule
          </button>
        </div>
      </div>
    );
  };

  const renderScheduleList = () => {
    if (loading) {
      return <div className="text-center text-neutral-500 dark:text-dark-text-secondary">Loading schedules...</div>;
    }

    if (filteredSchedules.length === 0) {
      return (
        <div className="text-center text-neutral-500 dark:text-dark-text-secondary">
          No maintenance schedules found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredSchedules.map(schedule => (
          <div 
            key={schedule.id} 
            className={`
              bg-white dark:bg-dark-background-secondary rounded-lg shadow-md p-4
              ${schedule.completed ? 'opacity-60' : ''}
              ${DateTime.fromISO(schedule.date) < DateTime.now() && !schedule.completed 
                ? 'border-2 border-red-500 dark:border-red-400' 
                : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`
                  text-lg font-semibold 
                  ${schedule.completed ? 'line-through text-neutral-500' : 'text-neutral-900 dark:text-dark-text-primary'}
                `}>
                  {schedule.title}
                </h3>
                {schedule.description && (
                  <p className="text-sm text-neutral-600 dark:text-dark-text-secondary mt-1">
                    {schedule.description}
                  </p>
                )}
                <p className={`
                  text-sm mt-2
                  ${DateTime.fromISO(schedule.date) < DateTime.now() && !schedule.completed 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-neutral-500 dark:text-dark-text-secondary'}
                `}>
                  {DateTime.fromISO(schedule.date).toLocaleString(DateTime.DATE_MED)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleScheduleStatus(schedule)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary"
                  title={schedule.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                >
                  {schedule.completed ? <XCircleIcon className="h-6 w-6" /> : <CheckCircleIcon className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="maintenance-view-container">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-dark-text-primary">
          Maintenance Schedules for {car.make} {car.model}
        </h2>
        <div className="flex items-center space-x-4">
          <select
            value={scheduleState.selectedStatus}
            onChange={(e) => updateScheduleState({ selectedStatus: e.target.value })}
            className="input-field"
          >
            <option value="">All Schedules</option>
            <option value="Overdue">Overdue</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>
          <button
            onClick={() => updateScheduleState({ showAddSchedule: true })}
            className="btn btn-primary"
          >
            Add Schedule
          </button>
        </div>
      </div>

      {renderAddScheduleForm()}
      {renderScheduleList()}
    </div>
  );
}
