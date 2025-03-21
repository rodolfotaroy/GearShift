import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Database } from '../types/supabase';
import { PencilIcon, TrashIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface CarProfileViewProps {
  car: Database['public']['Tables']['cars']['Row'];
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CarProfileView: React.FC<CarProfileViewProps> = ({ 
  car,
  onEdit,
  onDelete
}) => {
  const navigate = useNavigate();
  const { supabaseClient } = useSupabase();
  const [maintenanceHistory, setMaintenanceHistory] = useState<Database['public']['Tables']['maintenance_events']['Row'][]>([]);

  useEffect(() => {
    const fetchMaintenanceHistory = async () => {
      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .select('*')
        .eq('car_id', car.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance history:', error);
      } else {
        setMaintenanceHistory(data || []);
      }
    };

    fetchMaintenanceHistory();
  }, [car.id, supabaseClient]);

  const handleCardClick = () => {
    navigate(`/cars/${car.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold group-hover:text-primary-500 transition-colors">
          {car.year} {car.make} {car.model}
        </h2>
        <div className="flex space-x-2">
          {onEdit && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
          <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600 dark:text-gray-300">Plate Number</p>
          <p className="font-medium">{car.plate_number || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-300">VIN</p>
          <p className="font-medium">{car.vin || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-300">Mileage</p>
          <p className="font-medium">{car.mileage ? `${car.mileage} miles` : 'N/A'}</p>
        </div>
      </div>
      {car.image_url && (
        <div className="mt-4">
          <img 
            src={car.image_url} 
            alt={`${car.year} ${car.make} ${car.model}`} 
            className="w-full h-48 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
          />
        </div>
      )}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Maintenance History</h3>
        {maintenanceHistory.length === 0 ? (
          <p className="text-gray-500">No maintenance records found</p>
        ) : (
          <ul className="space-y-2">
            {maintenanceHistory.slice(0, 2).map((event) => (
              <li 
                key={event.id} 
                className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">{event.description}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
            {maintenanceHistory.length > 2 && (
              <li className="text-sm text-gray-500 text-center">
                +{maintenanceHistory.length - 2} more maintenance records
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};
