import { useState, useEffect } from 'react';
import { MaintenanceView } from '../components/MaintenanceView';
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

  useEffect(() => {
    async function fetchCars() {
      if (!user) return;

      const { data, error } = await supabaseClient
        .from('cars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cars:', error);
      } else {
        setCars(data || []);
        if (data && data.length > 0) {
          setSelectedCar(data[0]);
        }
      }
    }

    fetchCars();
  }, [user, supabaseClient]);

  useEffect(() => {
    async function fetchSchedules() {
      if (!selectedCar || !user) return;

      setLoading(true);
      
      const startOfMonth = DateTime.now().startOf('month').toISODate();
      const endOfMonth = DateTime.now().endOf('month').toISODate();

      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .select('*')
        .eq('car_id', selectedCar.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance events:', error);
      } else {
        setSchedules(data || []);
      }
      setLoading(false);
    }

    fetchSchedules();
  }, [selectedCar, user, supabaseClient]);

  const handleAddSchedule = async (schedule: Database['public']['Tables']['maintenance_events']['Insert']) => {
    if (!selectedCar || !user) return;

    const { data, error } = await supabaseClient
      .from('maintenance_events')
      .insert({
        ...schedule,
        car_id: selectedCar.id,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding maintenance event:', error);
      return;
    }

    setSchedules(prev => [data, ...prev]);
  };

  const handleUpdateSchedule = async (id: number, updates: Database['public']['Tables']['maintenance_events']['Update']) => {
    const { data, error } = await supabaseClient
      .from('maintenance_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating maintenance event:', error);
      return;
    }

    setSchedules(prev => prev.map(schedule => 
      schedule.id === id ? data : schedule
    ));
  };

  return (
    <div className="container mx-auto p-4">
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
            <MaintenanceView 
              car={selectedCar} 
              schedules={schedules}
              loading={loading}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
            />
          )}
        </div>
      </div>
    </div>
  );
}
