import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Car } from '../types/supabase';
import { DateTime } from 'luxon';

interface MaintenanceCost {
  id: string;
  car_id: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface MaintenanceCostWithRelations extends MaintenanceCost {
  car?: Car;
}

interface MaintenanceCostTrackerProps {
  car: Car;
}

export function MaintenanceCostTracker({ car }: MaintenanceCostTrackerProps) {
  const { supabaseClient } = useSupabase();
  const { user } = useAuth();
  const [costs, setCosts] = useState<MaintenanceCostWithRelations[]>([]);
  const [newCost, setNewCost] = useState<Partial<MaintenanceCost>>({
    amount: 0,
    date: DateTime.now().toISODate() || '',
    description: '',
  });

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

  const handleAddCost = async () => {
    if (!user) return;

    try {
      const costToInsert: Partial<MaintenanceCost> = {
        ...newCost,
        car_id: car.id.toString(),
        user_id: user.id,
        date: newCost.date || DateTime.now().toISODate() || '',
      };

      const { data, error } = await supabaseClient
        .from('maintenance_costs')
        .insert(costToInsert)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setCosts(prev => [...prev, data]);

      // Reset form
      setNewCost({
        amount: 0,
        date: DateTime.now().toISODate() || '',
        description: '',
      });
    } catch (error) {
      console.error('Error adding maintenance cost:', error);
    }
  };

  const handleDeleteCost = async (costId: string) => {
    try {
      const { error } = await supabaseClient
        .from('maintenance_costs')
        .delete()
        .eq('id', costId);

      if (error) throw error;

      // Remove cost from local state
      setCosts(prev => prev.filter(cost => cost.id !== costId));
    } catch (error) {
      console.error('Error deleting maintenance cost:', error);
    }
  };

  const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  return (
    <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-dark-text-primary">
        Maintenance Costs for {car.make} {car.model}
      </h2>

      {/* Total Costs */}
      <div className="mb-4">
        <h3 className="text-lg font-medium">Total Costs</h3>
        <p className="text-2xl font-bold text-green-600">
          ¥{totalCost.toLocaleString()}
        </p>
      </div>

      {/* Add Cost Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 dark:text-dark-text-primary mb-2">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={newCost.amount}
            onChange={(e) => setNewCost(prev => ({ ...prev, amount: Number(e.target.value) }))}
            className="input-field"
            placeholder="Enter cost"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-neutral-700 dark:text-dark-text-primary mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={newCost.date}
            onChange={(e) => setNewCost(prev => ({ ...prev, date: e.target.value }))}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-dark-text-primary mb-2">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={newCost.description}
            onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
            className="input-field"
            placeholder="Optional description"
          />
        </div>
      </div>

      <button 
        onClick={handleAddCost}
        className="btn btn-primary w-full"
        disabled={!newCost.amount}
      >
        Add Maintenance Cost
      </button>

      {/* Cost List */}
      {costs.length === 0 ? (
        <p className="text-center text-neutral-500 dark:text-dark-text-secondary mt-6">
          No maintenance costs recorded
        </p>
      ) : (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-dark-text-primary">
            Cost History
          </h3>
          <div className="divide-y divide-neutral-200 dark:divide-dark-border">
            {costs.map(cost => (
              <div 
                key={cost.id} 
                className="flex justify-between items-center py-3"
              >
                <div>
                  <p className="text-neutral-900 dark:text-dark-text-primary font-medium">
                    ¥{cost.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-dark-text-secondary">
                    {cost.description || 'No description'}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-dark-text-secondary">
                    {DateTime.fromISO(cost.date).toLocaleString(DateTime.DATE_MED)}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteCost(cost.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
