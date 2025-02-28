import React, { useState, useMemo, useEffect } from 'react';
import { MaintenanceCost } from '../types';
import { formatCurrency } from '../utils/formatting';
import { supabase } from '../contexts/SupabaseContext';

interface Car {
  id: string;
  make: string;
  model: string;
}

interface MaintenanceCostTrackerProps {
  costs: MaintenanceCost[];
  onAddCost: (cost: MaintenanceCost) => void;
}

const MaintenanceCostTracker: React.FC<MaintenanceCostTrackerProps> = ({ costs, onAddCost }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [newCost, setNewCost] = useState<Partial<MaintenanceCost>>({
    date: new Date(),
    category: 'Routine'
  });

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('id, make, model');

        if (error) {
          console.error('Error fetching cars:', error);
          return;
        }

        if (data) {
          setCars(data);
        }
      } catch (error) {
        console.error('Unexpected error fetching cars:', error);
      }
    };

    fetchCars();
  }, []);

  const costSummary = useMemo(() => {
    return {
      total: costs.reduce((sum, cost) => sum + cost.amount, 0),
      byCategory: costs.reduce((acc, cost) => {
        acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [costs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCost.amount && newCost.vehicleId) {
      onAddCost(newCost as MaintenanceCost);
      setNewCost({ date: new Date(), category: 'Routine' });
    }
  };

  return (
    <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 space-y-4 animate-fade-in-down">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">
          Maintenance Cost Tracker
        </h2>
        <div className="text-lg font-bold text-green-600 dark:text-green-400">
          Total: {formatCurrency(costSummary.total)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-dark-background-tertiary rounded-lg p-4">
          <h3 className="text-md font-medium text-gray-600 dark:text-dark-text-secondary mb-2">
            Costs by Category
          </h3>
          {Object.entries(costSummary.byCategory).map(([category, amount]) => (
            <div key={category} className="flex justify-between py-1">
              <span className="text-gray-700 dark:text-dark-text-primary">{category}</span>
              <span className="font-semibold text-gray-800 dark:text-dark-text-primary">
                {formatCurrency(amount)}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
              Vehicle
            </label>
            <select
              value={newCost.vehicleId || ''}
              onChange={(e) => setNewCost({...newCost, vehicleId: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                         shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 
                         dark:bg-dark-background-tertiary dark:text-dark-text-primary"
              required
            >
              <option value="">Select Vehicle</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
              Amount
            </label>
            <input
              type="number"
              value={newCost.amount || ''}
              onChange={(e) => setNewCost({...newCost, amount: parseFloat(e.target.value)})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                         shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 
                         dark:bg-dark-background-tertiary dark:text-dark-text-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
              Category
            </label>
            <select
              value={newCost.category}
              onChange={(e) => setNewCost({...newCost, category: e.target.value as MaintenanceCost['category']})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                         shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 
                         dark:bg-dark-background-tertiary dark:text-dark-text-primary"
            >
              {['Repair', 'Routine', 'Parts', 'Labor', 'Other'].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-500 dark:bg-blue-600 text-white 
                       py-2 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 
                       transition-colors duration-300 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Add Maintenance Cost
          </button>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceCostTracker;
