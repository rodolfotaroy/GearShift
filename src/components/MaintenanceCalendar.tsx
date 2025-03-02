import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import { Database } from '../types/supabase';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid';

// Styles for react-big-calendar
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Localization
const localizer = momentLocalizer(moment);

interface MaintenanceCalendarProps {
  schedules: Database['public']['Tables']['maintenance_events']['Row'][];
  onUpdateSchedule: (id: number, updates: Database['public']['Tables']['maintenance_events']['Update']) => void;
  onDeleteSchedule: (id: number) => void;
}

export function MaintenanceCalendar({ 
  schedules, 
  onUpdateSchedule,
  onDeleteSchedule 
}: MaintenanceCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<Database['public']['Tables']['maintenance_events']['Row'] | null>(null);

  // Convert maintenance events to calendar events
  const events = useMemo(() => {
    return schedules.map(schedule => ({
      id: schedule.id,
      title: schedule.title,
      start: new Date(schedule.date),
      end: new Date(schedule.date),
      allDay: true,
      resource: schedule
    }));
  }, [schedules]);

  // Handle event selection
  const handleSelectEvent = (event: { resource: Database['public']['Tables']['maintenance_events']['Row'] }) => {
    setSelectedEvent(event.resource);
  };

  // Close event details modal
  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  // Handle event deletion
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      onDeleteSchedule(selectedEvent.id);
      handleCloseModal();
    }
  };

  // Handle event edit (toggle completion)
  const handleEditEvent = () => {
    if (selectedEvent) {
      onUpdateSchedule(selectedEvent.id, { 
        completed: !selectedEvent.completed,
        updated_at: new Date().toISOString()
      });
      handleCloseModal();
    }
  };

  return (
    <div className="maintenance-calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        views={['month', 'week', 'day']}
        defaultView="month"
      />

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-background-secondary rounded-lg shadow-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4 text-neutral-900 dark:text-dark-text-primary">
              {selectedEvent.title}
            </h2>
            <div className="space-y-2 mb-4">
              <p>
                <span className="font-semibold">Date:</span> {moment(selectedEvent.date).format('MMMM D, YYYY')}
              </p>
              {selectedEvent.description && (
                <p>
                  <span className="font-semibold">Description:</span> {selectedEvent.description}
                </p>
              )}
              <p>
                <span className="font-semibold">Status:</span> 
                {selectedEvent.completed ? 'Completed' : 'Pending'}
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleEditEvent}
                className={`flex items-center space-x-2 px-4 py-2 rounded ${
                  selectedEvent.completed 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <PencilIcon className="h-5 w-5" />
                <span>{selectedEvent.completed ? 'Mark Incomplete' : 'Mark Complete'}</span>
              </button>
              <button
                onClick={handleDeleteEvent}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                <TrashIcon className="h-5 w-5" />
                <span>Delete</span>
              </button>
              <button
                onClick={handleCloseModal}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
