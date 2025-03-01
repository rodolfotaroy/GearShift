import { useState, useEffect, useCallback } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components';
import { 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';
import { Database } from '../types/database.types';

// Use database types for stronger typing
type MaintenanceEvent = Database['public']['Tables']['maintenance_events']['Row'];
type Car = Database['public']['Tables']['cars']['Row'];

const SERVICE_TYPES = [
  'Oil Change', 
  'Tire Rotation', 
  'Brake Service', 
  'Engine Tune-up', 
  'Other'
] as const;

const Maintenance: React.FC = () => {
  const { supabaseClient } = useSupabase();
  const { user, loading: authLoading } = useAuth();
  
  // Consolidated state management
  const [state, setState] = useState<{
    cars: Car[];
    selectedCar: Car | null;
    schedules: MaintenanceEvent[];
    history: MaintenanceEvent[];
    loading: boolean;
    error: string | null;
  }>({
    cars: [],
    selectedCar: null,
    schedules: [],
    history: [],
    loading: true,
    error: null
  });

  // Centralized data fetching with improved error handling
  const fetchData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false, error: 'No authenticated user' }));
      return;
    }

    try {
      // Fetch cars
      const { data: carsData, error: carsError } = await supabaseClient
        .from('cars')
        .select('*')
        .eq('user_id', user.id);

      if (carsError) throw carsError;

      // Fetch maintenance events
      const { data: eventsData, error: eventsError } = await supabaseClient
        .from('maintenance_events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (eventsError) throw eventsError;

      setState(prev => ({
        ...prev,
        cars: carsData || [],
        schedules: eventsData || [],
        selectedCar: carsData?.[0] || null,
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Maintenance Data Fetch Error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [user, supabaseClient]);

  // Trigger data fetch on component mount and user change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add maintenance event with robust error handling
  const addMaintenanceEvent = async (eventData: Partial<MaintenanceEvent>) => {
    if (!state.selectedCar) {
      console.error('No car selected');
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .insert({
          ...eventData,
          car_id: state.selectedCar.id,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        schedules: [data, ...prev.schedules]
      }));
    } catch (error) {
      console.error('Error adding maintenance event:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add maintenance event'
      }));
    }
  };

  // Render loading or error states
  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading maintenance data...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-100 p-4 rounded-lg">
        <p className="text-red-600">Error: {state.error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Maintenance view components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Car Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Vehicles</h2>
          {state.cars.map(car => (
            <div 
              key={car.id} 
              onClick={() => setState(prev => ({ ...prev, selectedCar: car }))}
              className={`cursor-pointer p-3 rounded-lg ${
                state.selectedCar?.id === car.id 
                  ? 'bg-indigo-100 dark:bg-indigo-900' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {car.year} {car.make} {car.model}
            </div>
          ))}
        </div>

        {/* Maintenance Schedule */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Maintenance Schedule</h2>
          {state.schedules.map(event => (
            <div 
              key={event.id} 
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4"
            >
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
              <p className="text-sm text-gray-500">
                Date: {DateTime.fromISO(event.date).toLocaleString(DateTime.DATE_FULL)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
