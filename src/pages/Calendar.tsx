import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { DateTime } from 'luxon';
import { Database } from '../types/supabase';

// Use database types for stronger typing
type CalendarEvent = Database['public']['Tables']['maintenance_events']['Row'];
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
  }>({
    events: [],
    cars: [],
    selectedEvent: null,
    selectedDate: new Date(),
    loading: true,
    error: null,
    filters: {}
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

      const eventsResponse = await supabaseClient
        .from('maintenance_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth || '')
        .lte('date', endOfMonth || '')
        ...(state.filters.car ? [{ eq: 'car_id', value: state.filters.car }] : []);

      if (eventsResponse.error) throw eventsResponse.error;

      setState(prev => ({
        ...prev,
        cars: carsResponse.data || [],
        events: eventsResponse.data || [],
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

  // Delete event with robust error handling
  const deleteEvent = async (eventId: number) => {
    try {
      const { error } = await supabaseClient
        .from('maintenance_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      // Update local state to remove the deleted event
      setState(prev => ({
        ...prev,
        events: prev.events.filter(event => event.id !== eventId)
      }));
    } catch (error) {
      console.error('Error deleting event:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete event'
      }));
    }
  };

  // Add new event with robust error handling
  const addEvent = async (newEvent: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .insert({
          ...newEvent,
          user_id: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state to add the new event
      setState(prev => ({
        ...prev,
        events: [...prev.events, data]
      }));
    } catch (error) {
      console.error('Error adding event:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add event'
      }));
    }
  };

  // Update existing event with robust error handling
  const updateEvent = async (updatedEvent: CalendarEvent) => {
    try {
      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .update({
          ...updatedEvent,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedEvent.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state to reflect the changes
      setState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === updatedEvent.id ? data : event
        )
      }));
    } catch (error) {
      console.error('Error updating event:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update event'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar Navigation */}
        <div className="flex items-center space-x-4">
          <div 
            onClick={() => setState(prev => ({ 
              ...prev, 
              selectedDate: DateTime.fromJSDate(prev.selectedDate).minus({ months: 1 }).toJSDate() 
            }))}
          >
          </div>
          <h2 className="text-xl font-semibold">
            {DateTime.fromJSDate(state.selectedDate).toFormat('MMMM yyyy')}
          </h2>
          <div 
            onClick={() => setState(prev => ({ 
              ...prev, 
              selectedDate: DateTime.fromJSDate(prev.selectedDate).plus({ months: 1 }).toJSDate() 
            }))}
          >
          </div>
        </div>

        {/* Event List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Events</h3>
          {state.events.map(event => (
            <div 
              key={event.id} 
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4"
            >
              <h4 className="font-medium">{event.title}</h4>
              <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
              <p className="text-sm text-gray-500">
                Date: {DateTime.fromISO(event.date).toLocaleString(DateTime.DATE_FULL)}
              </p>
              <div className="flex justify-end space-x-2 mt-2">
                <div 
                  onClick={() => deleteEvent(event.id)}
                >
                  Delete
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="space-y-2">
            <select 
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                filters: { ...prev.filters, car: Number(e.target.value) } 
              }))}
              className="w-full p-2 border rounded"
            >
              <option value="">All Cars</option>
              {state.cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.year} {car.make} {car.model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
