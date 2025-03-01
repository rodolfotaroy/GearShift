import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Tables } from '../types/supabase';

// Ensure Car type matches Supabase table definition
type Car = Tables['cars']['Row'];

export const CarProfileView = ({ 
  car, 
  onClose 
}: { 
  car: Car, 
  onClose: () => void 
}) => {
  const { supabaseClient, supabaseStorage } = useSupabase();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'maintenance' | 'documents'>('details');
  const [maintenanceHistory, setMaintenanceHistory] = useState<Tables<'maintenance_events'>[]>([]);

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

  const handleImageUpload = async (selectedImage: File) => {
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${car.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabaseStorage
        .from('car-images')
        .upload(fileName, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseStorage
        .from('car-images')
        .getPublicUrl(fileName);

      await supabaseClient
        .from('cars')
        .update({ image_url: publicUrl })
        .eq('id', car.id);

      setEditMode(false);
    } catch (error) {
      console.error('Error updating car:', error);
    }
  };

  return (
    <div className="car-profile-view p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Car Profile</h2>
        <button 
          type="button" 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      <div className="tabs mb-4">
        {['details', 'maintenance', 'documents'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)} 
            className={`mr-2 px-3 py-1 rounded capitalize ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div>
          <h3 className="text-lg font-semibold mb-2">{car.year} {car.make} {car.model}</h3>
          
          {editMode && (
            <div className="mt-2">
              <input 
                type="file" 
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }} 
                className="w-full p-2 border rounded"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Make', value: car.make },
              { label: 'Model', value: car.model },
              { label: 'Year', value: car.year }
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-medium">{label}</p>
                <p>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Maintenance History</h3>
          {maintenanceHistory.length === 0 ? (
            <p className="text-gray-500">No maintenance events recorded.</p>
          ) : (
            maintenanceHistory.map(event => (
              <div 
                key={event.id} 
                className="bg-gray-100 p-2 rounded mb-2"
              >
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-gray-600">{event.date}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Documents</h3>
          <p className="text-gray-500">No documents uploaded yet.</p>
        </div>
      )}
    </div>
  );
};
