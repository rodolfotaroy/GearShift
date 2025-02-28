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
  Title,
  BarElement,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { DateTime } from 'luxon';
import MaintenanceCostTracker from '../components/MaintenanceCostTracker';
import { MaintenanceCost } from '../types';
import { formatCurrency } from '../utils/formatting';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
);

type ExpenseSummary = {
  category: string;
  total: number;
};

type MonthlyExpense = {
  month: string;
  total: number;
};

type CarExpense = {
  carName: string;
  total: number;
};

const Dashboard: React.FC = () => {
  const { supabaseClient } = useSupabase();
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseSummary[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [carExpenses, setCarExpenses] = useState<CarExpense[]>([]);
  const [carCount, setCarCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [maintenanceCosts, setMaintenanceCosts] = useState<MaintenanceCost[]>([]);
  const [upcomingMaintenanceCount, setUpcomingMaintenanceCount] = useState<number>(0);
  const [averageMaintenanceCost, setAverageMaintenanceCost] = useState<number>(0);

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

        // Monthly expenses (last 6 months)
        const monthlyData = expenses.reduce((acc: { [key: string]: number }, expense: any) => {
          const month = DateTime.fromISO(expense.date).toFormat('LLL yyyy');
          acc[month] = (acc[month] || 0) + expense.amount;
          return acc;
        }, {});

        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = DateTime.now().minus({ months: i });
          return date.toFormat('LLL yyyy');
        }).reverse();

        setMonthlyExpenses(
          last6Months.map(month => ({
            month,
            total: monthlyData[month] || 0,
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
            carName,
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
    labels: expensesByCategory.map(item => item.category),
    datasets: [
      {
        data: expensesByCategory.map(item => item.total),
        backgroundColor: [
          '#8B9467',
          '#F7DC6F',
          '#F2C464',
          '#E9D8A6',
          '#C9E4CA',
          '#8B9467',
          '#F7DC6F',
          '#C9CBCF',
        ],
      },
    ],
  };

  const lineData = {
    labels: monthlyExpenses.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: monthlyExpenses.map(item => item.total),
        borderColor: '#4B5563',
        backgroundColor: 'rgba(75, 85, 99, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: carExpenses.map(item => item.carName),
    datasets: [
      {
        label: 'Expenses by Car',
        data: carExpenses.map(item => item.total),
        backgroundColor: '#4B5563',
      },
    ],
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
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
              ¥{formatCurrency(totalExpenses)}
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
              Upcoming Maintenance
            </dt>
            <dd className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-dark-text-primary 
                           break-words overflow-hidden text-ellipsis">
              {upcomingMaintenanceCount}
            </dd>
          </div>
        </div>

        {/* Average Maintenance Cost Card */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        flex flex-col justify-between hover:shadow-lg dark:hover:shadow-dark-lg 
                        transition-all duration-300 transform hover:-translate-y-1 min-h-[150px]">
          <div>
            <dt className="text-sm font-medium text-neutral-500 dark:text-dark-text-secondary truncate mb-2">
              Avg. Maintenance Cost
            </dt>
            <dd className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-dark-text-primary 
                           break-words overflow-hidden text-ellipsis">
              ¥{formatCurrency(averageMaintenanceCost)}
            </dd>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Expenses by Category Chart */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        md:col-span-1 lg:col-span-2 min-h-[400px]">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-dark-text-primary mb-4">
            Expenses by Category
          </h3>
          <div className="h-full">
            <Doughnut 
              data={doughnutData} 
              options={{ 
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
                },
                // Dark mode support
                color: '#e2e8f0', // slate-200 for dark mode text
                backgroundColor: [
                  '#8B9467', '#F7DC6F', '#F2C464', 
                  '#E9D8A6', '#C9E4CA', '#8B9467', 
                  '#F7DC6F', '#C9CBCF'
                ]
              }} 
            />
          </div>
        </div>

        {/* Maintenance History Chart */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        md:col-span-1 lg:col-span-1 min-h-[400px]">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-dark-text-primary mb-4">
            Maintenance History
          </h3>
          <div className="h-full">
            <Line 
              data={lineData} 
              options={{ 
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
                },
                // Dark mode support
                color: '#e2e8f0', // slate-200 for dark mode text
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
