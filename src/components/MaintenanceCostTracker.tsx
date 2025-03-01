import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../components';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { DateTime } from 'luxon';
import { Database } from '../types/database.types';
import { formatCurrency } from '../utils/formatting';

// Use database types for stronger typing
type MaintenanceCost = Database['public']['Tables']['maintenance_costs']['Row'];
type Car = Database['public']['Tables']['cars']['Row'];

const MAINTENANCE_CATEGORIES = [
  'Routine', 
  'Repair', 
  'Upgrade', 
  'Emergency'
] as const;

const MaintenanceCostTracker: React.FC = () => {
  const { supabaseClient } = useSupabase();
  const { user } = useAuth();

  // Consolidated state management
  const [state, setState] = useState<{
    cars: Car[];
    costs: MaintenanceCost[];
    loading: boolean;
    error: string | null;
    newCost: Partial<MaintenanceCost>;
  }>({
    cars: [],
    costs: [],
    loading: true,
    error: null,
    newCost: {
      date: DateTime.now().toISODate(),
      category: 'Routine'
    }
  });

  // Fetch cars and maintenance costs
  const fetchData = async () => {
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

      // Fetch maintenance costs
      const { data: costsData, error: costsError } = await supabaseClient
        .from('maintenance_costs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (costsError) throw costsError;

      setState(prev => ({
        ...prev,
        cars: carsData || [],
        costs: costsData || [],
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Maintenance Cost Fetch Error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  };

  // Trigger data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [user]);

  // Memoized cost summary
  const costSummary = useMemo(() => {
    return {
      total: state.costs.reduce((sum, cost) => sum + cost.amount, 0),
      byCategory: state.costs.reduce((acc, cost) => {
        acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [state.costs]);

  // Add maintenance cost
  const addMaintenanceCost = async () => {
    const { newCost } = state;

    if (!newCost.amount || !newCost.vehicleId) {
      setState(prev => ({ 
        ...prev, 
        error: 'Please fill in all required fields' 
      }));
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('maintenance_costs')
        .insert({
          ...newCost,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        costs: [data, ...prev.costs],
        newCost: {
          date: DateTime.now().toISODate(),
          category: 'Routine'
        },
        error: null
      }));
    } catch (error) {
      console.error('Error adding maintenance cost:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add maintenance cost'
      }));
    }
  };

  // Render loading or error states
  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading maintenance costs...</p>
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
    <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 space-y-4 animate-fade-in-down">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">
          Maintenance Cost Tracker
        </h2>
        <div className="text-lg font-bold text-green-600 dark:text-green-400">
          Total: {formatCurrency(costSummary.total)}
        </div>
      </div>

      {/* Cost Summary by Category */}
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(costSummary.byCategory).map(([category, amount]) => (
          <div 
            key={category} 
            className="bg-gray-100 dark:bg-dark-background-tertiary p-3 rounded-lg"
          >
            <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-secondary">
              {category}
            </h3>
            <p className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
              {formatCurrency(amount)}
            </p>
          </div>
        ))}
      </div>

      {/* Add Maintenance Cost Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          addMaintenanceCost();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Vehicle Selection */}
          <div>
            <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
              Vehicle
            </label>
            <select
              id="vehicleId"
              value={state.newCost.vehicleId || ''}
              onChange={(e) => setState(prev => ({
                ...prev,
                newCost: {
                  ...prev.newCost,
                  vehicleId: Number(e.target.value)
                }
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm dark:bg-dark-background-tertiary dark:text-dark-text-primary"
              required
            >
              <option value="">Select Vehicle</option>
              {state.cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.year} {car.make} {car.model}
                </option>
              ))}
            </select>
          </div>

          {/* Maintenance Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
              Category
            </label>
            <select
              id="category"
              value={state.newCost.category || 'Routine'}
              onChange={(e) => setState(prev => ({
                ...prev,
                newCost: {
                  ...prev.newCost,
                  category: e.target.value as typeof MAINTENANCE_CATEGORIES[number]
                }
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm dark:bg-dark-background-tertiary dark:text-dark-text-primary"
            >
              {MAINTENANCE_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              value={state.newCost.amount || ''}
              onChange={(e) => setState(prev => ({
                ...prev,
                newCost: {
                  ...prev.newCost,
                  amount: Number(e.target.value)
                }
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm dark:bg-dark-background-tertiary dark:text-dark-text-primary"
              placeholder="Enter cost"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={state.newCost.date || ''}
              onChange={(e) => setState(prev => ({
                ...prev,
                newCost: {
                  ...prev.newCost,
                  date: e.target.value
                }
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm dark:bg-dark-background-tertiary dark:text-dark-text-primary"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            variant="primary"
          >
            Add Maintenance Cost
          </Button>
        </div>
      </form>

      {/* Maintenance Costs List */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">
          Recent Maintenance Costs
        </h3>
        {state.costs.map(cost => (
          <div 
            key={cost.id} 
            className="bg-gray-100 dark:bg-dark-background-tertiary p-3 rounded-lg flex justify-between items-center"
          >
            <div>
              <p className="font-medium text-gray-800 dark:text-dark-text-primary">
                {state.cars.find(car => car.id === cost.vehicleId)?.make} {cost.category}
              </p>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                {DateTime.fromISO(cost.date).toLocaleString(DateTime.DATE_FULL)}
              </p>
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(cost.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaintenanceCostTracker;
