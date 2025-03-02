import { useState, useEffect } from 'react';
import { MaintenanceView } from '../components/MaintenanceView';
import { MaintenanceCalendar } from '../components/MaintenanceCalendar';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/supabase';
import { DateTime } from 'luxon';

export function Maintenance() {
  const { supabaseClient } = useSupabase();
  const { user } = useAuth();
  const [cars, setCars] = useState<Database['public']['Tables']['cars']['Row'][]>([]);
  const [selectedCar, setSelectedCar] = useState<Database['public']['Tables']['cars']['Row'] | null>(null);
  const [schedules, setSchedules] = useState<Database['public']['Tables']['maintenance_events']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    async function fetchCars() {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabaseClient
          .from('cars')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setCars(data || []);
        if (data && data.length > 0) {
          setSelectedCar(data[0]);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to fetch cars. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchCars();
  }, [user, supabaseClient]);

  useEffect(() => {
    async function fetchSchedules() {
      if (!selectedCar || !user) return;

      setLoading(true);
      setError(null);
      
      try {
        const startOfMonth = DateTime.now().startOf('month').toISODate();
        const endOfMonth = DateTime.now().endOf('month').toISODate();

        const { data, error } = await supabaseClient
          .from('maintenance_events')
          .select('*')
          .eq('car_id', selectedCar.id)
          .eq('user_id', user.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
          .order('date', { ascending: false });

        if (error) throw error;

        setSchedules(data || []);
      } catch (err) {
        console.error('Error fetching maintenance events:', err);
        setError('Failed to fetch maintenance events. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchSchedules();
  }, [selectedCar, user, supabaseClient]);

  const handleAddSchedule = async (schedule: Database['public']['Tables']['maintenance_events']['Insert']) => {
    if (!selectedCar || !user) return;

    try {
      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .insert({
          ...schedule,
          car_id: selectedCar.id,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setSchedules(prev => [data, ...prev]);
    } catch (err) {
      console.error('Error adding maintenance event:', err);
      setError('Failed to add maintenance event. Please check your connection and try again.');
    }
  };

  const handleUpdateSchedule = async (id: number, updates: Database['public']['Tables']['maintenance_events']['Update']) => {
    try {
      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSchedules(prev => prev.map(schedule => 
        schedule.id === id ? data : schedule
      ));
    } catch (err) {
      console.error('Error updating maintenance event:', err);
      setError('Failed to update maintenance event. Please check your connection and try again.');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      const { error } = await supabaseClient
        .from('maintenance_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSchedules(prev => prev.filter(schedule => schedule.id !== id));
    } catch (err) {
      console.error('Error deleting maintenance event:', err);
      setError('Failed to delete maintenance event. Please check your connection and try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Maintenance Schedules</h1>
        <div className="flex items-center space-x-4">
          <div className="flex bg-neutral-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="w-1/4">
          <h2 className="text-xl font-bold mb-4">My Cars</h2>
          <ul className="space-y-2">
            {cars.map(car => (
              <li 
                key={car.id} 
                className={`p-2 cursor-pointer rounded ${selectedCar?.id === car.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                onClick={() => setSelectedCar(car)}
              >
                {car.make} {car.model} ({car.year})
              </li>
            ))}
          </ul>
        </div>
        <div className="w-3/4">
          {selectedCar && (
            <>
              {viewMode === 'list' ? (
                <MaintenanceView 
                  car={selectedCar} 
                  schedules={schedules}
                  loading={loading}
                  onAddSchedule={handleAddSchedule}
                  onUpdateSchedule={handleUpdateSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                />
              ) : (
                <MaintenanceCalendar 
                  schedules={schedules}
                  onUpdateSchedule={handleUpdateSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
