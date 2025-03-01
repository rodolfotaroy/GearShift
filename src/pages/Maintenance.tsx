import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';

const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const { supabaseClient } = useSupabase();
  const [maintenanceEvents, setMaintenanceEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        return;
      }

      try {
        const { data, error } = await supabaseClient
          .from('maintenance_events')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;

        setMaintenanceEvents(data || []);
      } catch (error) {
        console.error('Maintenance Data Fetch Error:', error);
      }
    };

    fetchData();
  }, [user, supabaseClient]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Maintenance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Schedule */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Maintenance Schedule</h2>
          {maintenanceEvents.map(event => (
            <div 
              key={event.id} 
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4"
            >
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
              <p className="text-sm text-gray-500">
                Date: {event.date}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
