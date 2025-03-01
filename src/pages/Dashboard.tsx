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
import { MaintenanceCostTracker } from '../components/MaintenanceCostTracker';

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

  interface MaintenanceCostTrackerProps {
    costs: MaintenanceCost[];
    onAddCost: (cost: MaintenanceCost) => void;
  }

  const MaintenanceCostTrackerWrapper: React.FC<MaintenanceCostTrackerProps> = ({ 
    costs, 
    onAddCost 
  }) => {
    return (
      <MaintenanceCostTracker 
        costs={costs}
        onAddCost={onAddCost}
      />
    );
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
          <MaintenanceCostTrackerWrapper 
            costs={[]} 
            onAddCost={() => console.log('Add cost')} 
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Expenses by Category */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-dark-text-primary">
            Expenses by Category
          </h2>
          <div className="h-64">
            <Doughnut 
              data={doughnutData} 
              options={chartOptions} 
            />
          </div>
        </div>

        {/* Expenses by Car */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-dark-text-primary">
            Expenses by Vehicle
          </h2>
          <div className="h-64">
            <Line 
              data={lineData} 
              options={chartOptions} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
