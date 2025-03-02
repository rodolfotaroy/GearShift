import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { DateTime } from 'luxon';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Database } from '../types/supabase';
import EventModal from '../components/calendar/EventModal';

const localizer = momentLocalizer(moment);

// Use database types for stronger typing
type CalendarEvent = Database['public']['Tables']['maintenance_events']['Row'] & {
  start?: Date;
  end?: Date;
  title?: string;
};
type Car = Database['public']['Tables']['cars']['Row'];

export default function Calendar() {
  const { supabaseClient } = useSupabase();
  const { user } = useAuth();

  // Consolidated state management
  const [state, setState] = useState<{
    events: CalendarEvent[];
    cars: Car[];
    selectedEvent: CalendarEvent | null;
    selectedDate: Date;
    loading: boolean;
    error: string | null;
    filters: {
      car?: number;
      type?: string;
    };
    isEventModalOpen: boolean;
  }>({
    events: [],
    cars: [],
    selectedEvent: null,
    selectedDate: new Date(),
    loading: true,
    error: null,
    filters: {},
    isEventModalOpen: false
  });

  // Centralized data fetching with improved error handling
  const fetchData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false, error: 'No authenticated user' }));
      return;
    }

    try {
      // Fetch cars
      const carsResponse = await supabaseClient
        .from('cars')
        .select('*')
        .eq('user_id', user.id);

      if (carsResponse.error) throw carsResponse.error;

      // Fetch events for the current month
      const startOfMonth = DateTime.fromJSDate(state.selectedDate).startOf('month').toISO();
      const endOfMonth = DateTime.fromJSDate(state.selectedDate).endOf('month').toISO();

      let eventsQuery = supabaseClient
        .from('maintenance_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth || '')
        .lte('date', endOfMonth || '');

      if (state.filters.car) {
        eventsQuery = eventsQuery.eq('car_id', state.filters.car);
      }

      const eventsResponse = await eventsQuery;

      if (eventsResponse.error) throw eventsResponse.error;

      // Transform events for BigCalendar
      const transformedEvents = (eventsResponse.data || []).map(event => ({
        ...event,
        start: new Date(event.date),
        end: new Date(event.date),
        title: event.title
      }));

      setState(prev => ({
        ...prev,
        cars: carsResponse.data || [],
        events: transformedEvents,
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Calendar Data Fetch Error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [user, supabaseClient, state.selectedDate, state.filters]);

  // Trigger data fetch on component mount and dependencies
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Event handling
  const handleSelectEvent = (event: CalendarEvent) => {
    setState(prev => ({
      ...prev,
      selectedEvent: event,
      isEventModalOpen: true
    }));
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setState(prev => ({
      ...prev,
      selectedEvent: {
        date: start.toISOString(),
        title: '',
        description: '',
        car_id: state.filters.car || undefined,
        user_id: user?.id
      },
      isEventModalOpen: true
    }));
  };

  const handleCloseModal = () => {
    setState(prev => ({
      ...prev,
      selectedEvent: null,
      isEventModalOpen: false
    }));
  };

  const handleSubmitEvent = async (eventData: CalendarEvent) => {
    try {
      if (eventData.id) {
        // Update existing event
        const { error } = await supabaseClient
          .from('maintenance_events')
          .update(eventData)
          .eq('id', eventData.id);

        if (error) throw error;
      } else {
        // Create new event
        const { error } = await supabaseClient
          .from('maintenance_events')
          .insert(eventData);

        if (error) throw error;
      }

      // Refresh data
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving event:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save event'
      }));
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const { error } = await supabaseClient
        .from('maintenance_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      // Refresh data
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting event:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete event'
      }));
    }
  };

  // Render loading or error states
  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading calendar events...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-100 p-4 rounded-lg">
        <p className="text-red-600">Error: {state.error}</p>
        <div onClick={() => fetchData()}>Retry</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <select 
            onChange={(e) => setState(prev => ({ 
              ...prev, 
              filters: { ...prev.filters, car: Number(e.target.value) } 
            }))}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Cars</option>
            {state.cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.year} {car.make} {car.model}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: '600px' }}>
          <BigCalendar
            localizer={localizer}
            events={state.events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            views={['month', 'week', 'day']}
            defaultView="month"
            className="dark:text-white"
          />
        </div>

        {state.isEventModalOpen && (
          <EventModal
            isOpen={state.isEventModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleSubmitEvent}
            onDelete={handleDeleteEvent}
            event={state.selectedEvent}
            setEvent={(updatedEvent) => setState(prev => ({ ...prev, selectedEvent: updatedEvent }))}
            cars={state.cars}
            mode={state.selectedEvent?.id ? 'edit' : 'create'}
          />
        )}
      </div>
    </div>
  );
}
