import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { MaintenanceView } from '../components/MaintenanceView';
import { MaintenanceCostTracker } from '../components/MaintenanceCostTracker';
import { DocumentView } from '../components/DocumentView';

type Car = {
  id: number;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  mileage?: number;
  vin?: string;
  image_url?: string;
  user_id: string;
};

type Schedule = {
  id: number;
  car_id: number;
  date: string;
  description: string;
  cost?: number;
};

export default function CarDetails() {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'documents' | 'costs'>('maintenance');

  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!user || !carId) {
        navigate('/cars');
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', parseInt(carId, 10))
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching car details', error);
          setError('Failed to load car details');
          navigate('/cars');
          return;
        }

        setCar(data);

        const { data: schedulesData, error: schedulesError } = await supabase
          .from('maintenance_events')
          .select('*')
          .eq('car_id', parseInt(carId, 10))
          .order('date', { ascending: false });

        if (schedulesError) {
          console.error('Error fetching maintenance schedules', schedulesError);
          setError('Failed to load maintenance schedules');
          navigate('/cars');
          return;
        }

        setSchedules(schedulesData || []);
      } catch (err) {
        console.error('Error fetching car details', err);
        setError('Failed to load car details');
        navigate('/cars');
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [carId, user, navigate]);

  const handleAddSchedule = async (schedule: Schedule) => {
    if (!car) return;

    try {
      const { data, error } = await supabase
        .from('maintenance_events')
        .insert({ ...schedule, car_id: car.id });

      if (error) {
        console.error('Error adding maintenance schedule', error);
        return;
      }

      const { data: updatedSchedules } = await supabase
        .from('maintenance_events')
        .select('*')
        .eq('car_id', car.id)
        .order('date', { ascending: false });

      setSchedules(updatedSchedules || []);
    } catch (err) {
      console.error('Error adding maintenance schedule', err);
    }
  };

  const handleUpdateSchedule = async (id: number, updates: Partial<Schedule>) => {
    try {
      const { error } = await supabase
        .from('maintenance_events')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating maintenance schedule', error);
        return;
      }

      const { data: updatedSchedules } = await supabase
        .from('maintenance_events')
        .select('*')
        .eq('car_id', car?.id)
        .order('date', { ascending: false });

      setSchedules(updatedSchedules || []);
    } catch (err) {
      console.error('Error updating maintenance schedule', err);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      const { error } = await supabase
        .from('maintenance_events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting maintenance schedule', error);
        return;
      }

      const { data: updatedSchedules } = await supabase
        .from('maintenance_events')
        .select('*')
        .eq('car_id', car?.id)
        .order('date', { ascending: false });

      setSchedules(updatedSchedules || []);
    } catch (err) {
      console.error('Error deleting maintenance schedule', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load car details. Please try again.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          {car.image_url && (
            <img 
              src={car.image_url} 
              alt={`${car.year} ${car.make} ${car.model}`} 
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {car.year} {car.make} {car.model}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Plate: {car.plate_number} | VIN: {car.vin}
            </p>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'maintenance'
                  ? 'text-primary-500 border-primary-500 border-b-2'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Maintenance
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'text-primary-500 border-primary-500 border-b-2'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'costs'
                  ? 'text-primary-500 border-primary-500 border-b-2'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Maintenance Costs
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'maintenance' && (
            <MaintenanceView 
              car={car}
              schedules={schedules}
              loading={loading}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
            />
          )}
          {activeTab === 'documents' && <DocumentView car={car} />}
          {activeTab === 'costs' && <MaintenanceCostTracker car={car} />}
        </div>
      </div>
    </div>
  );
}
