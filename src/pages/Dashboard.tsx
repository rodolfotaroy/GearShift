import { Button } from '../components/Button';
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import MaintenanceCostTracker from '../components/MaintenanceCostTracker';
import { MaintenanceCost } from '../types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

type ExpenseSummary = {
  category: string;
  total: number;
};

type CarExpense = {
  carId: string;
  total: number;
};

const Dashboard: React.FC = () => {
  const { supabaseClient } = useSupabase();
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseSummary[]>([]);
  const [carExpenses, setCarExpenses] = useState<CarExpense[]>([]);
  const [carCount, setCarCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [maintenanceCosts, setMaintenanceCosts] = useState<MaintenanceCost[]>([]);

  const handleAddMaintenanceCost = (cost: MaintenanceCost) => {
    setMaintenanceCosts([...maintenanceCosts, { ...cost, id: Date.now().toString() }]);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch expenses with car details
      const { data: expenses } = await supabaseClient
        .from('expenses')
        .select(`
          amount,
          category,
          date,
          cars (
            make,
            model
          )
        `);

      if (expenses) {
        // Total expenses
        const total = expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
        setTotalExpenses(total);

        // Expenses by category
        const categoryTotals = expenses.reduce((acc: { [key: string]: number }, expense: any) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {});

        setExpensesByCategory(
          Object.entries(categoryTotals).map(([category, total]) => ({
            category,
            total: total as number,
          }))
        );

        // Expenses by car
        const carTotals = expenses.reduce((acc: { [key: string]: number }, expense: any) => {
          // Safely access make and model with type assertion
          const carName = expense.cars && 
            (expense.cars as { make: string; model: string }).make && 
            (expense.cars as { make: string; model: string }).model
            ? `${(expense.cars as { make: string; model: string }).make} ${(expense.cars as { make: string; model: string }).model}` 
            : 'Unknown';
          acc[carName] = (acc[carName] || 0) + expense.amount;
          return acc;
        }, {});

        setCarExpenses(
          Object.entries(carTotals).map(([carName, total]) => ({
            carId: carName,
            total: total as number,
          }))
        );
      }

      // Fetch car count
      const { count } = await supabaseClient
        .from('cars')
        .select('*', { count: 'exact' });

      setCarCount(count || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const doughnutData = {
    labels: expensesByCategory.map(ec => ec.category),
    datasets: [{
      data: expensesByCategory.map(ec => ec.total),
      backgroundColor: [
        '#8B9467', '#F7DC6F', '#F2C464', 
        '#E9D8A6', '#C9E4CA', '#8B9467', 
        '#F7DC6F', '#C9CBCF'
      ]
    }]
  };

  const lineData = {
    labels: carExpenses.map((_, index) => `Month ${index + 1}`),
    datasets: [{
      label: 'Expenses',
      data: carExpenses.map(ce => ce.total),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#4b5563', // neutral-600 for light mode
          font: {
            size: 14
          }
        }
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Expenses Card */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        flex flex-col justify-between hover:shadow-lg dark:hover:shadow-dark-lg 
                        transition-all duration-300 transform hover:-translate-y-1 min-h-[150px]">
          <div>
            <dt className="text-sm font-medium text-neutral-500 dark:text-dark-text-secondary truncate mb-2">
              Total Expenses (6 Months)
            </dt>
            <dd className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-dark-text-primary 
                           break-words overflow-hidden text-ellipsis">
              ¥{totalExpenses.toLocaleString()}
            </dd>
          </div>
        </div>

        {/* Car Count Card */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        flex flex-col justify-between hover:shadow-lg dark:hover:shadow-dark-lg 
                        transition-all duration-300 transform hover:-translate-y-1 min-h-[150px]">
          <div>
            <dt className="text-sm font-medium text-neutral-500 dark:text-dark-text-secondary truncate mb-2">
              Total Vehicles
            </dt>
            <dd className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-dark-text-primary 
                           break-words overflow-hidden text-ellipsis">
              {carCount}
            </dd>
          </div>
        </div>

        {/* Upcoming Maintenance Card */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        flex flex-col justify-between hover:shadow-lg dark:hover:shadow-dark-lg 
                        transition-all duration-300 transform hover:-translate-y-1 min-h-[150px]">
          <div>
            <dt className="text-sm font-medium text-neutral-500 dark:text-dark-text-secondary truncate mb-2">
              Average Monthly Expense
            </dt>
            <dd className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-dark-text-primary 
                           break-words overflow-hidden text-ellipsis">
              ¥{(totalExpenses / 6).toLocaleString()}
            </dd>
          </div>
        </div>

        {/* Maintenance Cost Card */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        flex flex-col justify-between hover:shadow-lg dark:hover:shadow-dark-lg 
                        transition-all duration-300 transform hover:-translate-y-1 min-h-[150px]">
          <div>
            <dt className="text-sm font-medium text-neutral-500 dark:text-dark-text-secondary truncate mb-2">
              Total Maintenance Costs
            </dt>
            <dd className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-dark-text-primary 
                           break-words overflow-hidden text-ellipsis">
              ¥{maintenanceCosts.reduce((sum, cost) => sum + cost.amount, 0).toLocaleString()}
            </dd>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Expenses by Category Chart */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        md:col-span-1 lg:col-span-2 h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-dark-text-primary mb-4">
            Expenses by Category
          </h3>
          <div className="flex-grow overflow-hidden">
            <Doughnut 
              data={doughnutData} 
              options={{
                ...chartOptions,
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>

        {/* Maintenance History Chart */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        md:col-span-1 lg:col-span-1 h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-dark-text-primary mb-4">
            Maintenance History
          </h3>
          <div className="flex-grow overflow-hidden">
            <Line 
              data={lineData} 
              options={{
                ...chartOptions,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    ticks: {
                      color: '#94a3b8' // slate-500 for dark mode
                    },
                    grid: {
                      color: '#334155' // slate-700 for dark mode
                    }
                  },
                  y: {
                    ticks: {
                      color: '#94a3b8' // slate-500 for dark mode
                    },
                    grid: {
                      color: '#334155' // slate-700 for dark mode
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Maintenance Cost Tracker */}
        <div className="md:col-span-2 lg:col-span-3">
          <MaintenanceCostTracker 
            costs={maintenanceCosts} 
            onAddCost={handleAddMaintenanceCost} 
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
