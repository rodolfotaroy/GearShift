import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Tables } from '@/types/supabase';
import { DateTime } from 'luxon';

type MaintenanceCostWithRelations = Tables['maintenance_costs']['Row'] & {
  car?: Tables['cars']['Row'];
};

export const MaintenanceCostTracker = ({ 
  car 
}: { 
  car: Tables<'cars'> 
}) => {
  const { supabaseClient } = useSupabase();
  const { user } = useAuth();
  const [costs, setCosts] = useState<MaintenanceCostWithRelations[]>([]);

  useEffect(() => {
    const fetchCosts = async () => {
      if (!user) return;

      const { data, error } = await supabaseClient
        .from('maintenance_costs')
        .select('*')
        .eq('car_id', car.id);

      if (error) {
        console.error('Error fetching maintenance costs:', error);
      } else {
        setCosts(data || []);
      }
    };

    fetchCosts();
  }, [car.id, user, supabaseClient]);

  const handleAddCost = async (cost: Partial<MaintenanceCostWithRelations>) => {
    if (!user) return;

    const parsedCost = {
      ...cost,
      amount: cost.amount ? Number(cost.amount) : 0,
      car_id: cost.car_id ? String(cost.car_id) : undefined
    };

    try {
      const { data, error } = await supabaseClient
        .from('maintenance_costs')
        .insert({
          ...parsedCost,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setCosts(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding maintenance cost:', error);
    }
  };

  const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  return (
    <div className="maintenance-cost-tracker p-4">
      <h2 className="text-xl font-semibold mb-4">Maintenance Costs</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium">Total Costs</h3>
        <p className="text-2xl font-bold text-green-600">
          ¥{totalCost.toLocaleString()}
        </p>
      </div>

      <div className="costs-list">
        <h3 className="text-lg font-medium mb-2">Cost Breakdown</h3>
        {costs.length === 0 ? (
          <p className="text-gray-500">No maintenance costs recorded.</p>
        ) : (
          costs.map(cost => (
            <div 
              key={cost.id} 
              className="bg-gray-100 p-3 rounded-lg mb-2 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{cost.description || 'Unnamed Cost'}</p>
                <p className="text-sm text-gray-600">
                  {DateTime.fromISO(cost.date || '').toFormat('yyyy/MM/dd')}
                </p>
              </div>
              <p className="font-bold text-green-600">
                ¥{(cost.amount || 0).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="add-cost-section mt-4">
        <h3 className="text-lg font-medium mb-2">Add New Cost</h3>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddCost({
              amount: Number(formData.get('amount')),
              description: formData.get('description')?.toString(),
              date: DateTime.now().toISO()
            });
            e.currentTarget.reset();
          }}
          className="space-y-2"
        >
          <input 
            type="number" 
            name="amount" 
            placeholder="Cost Amount" 
            required 
            className="w-full p-2 border rounded"
          />
          <input 
            type="text" 
            name="description" 
            placeholder="Description" 
            className="w-full p-2 border rounded"
          />
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add Cost
          </button>
        </form>
      </div>
    </div>
  );
};
