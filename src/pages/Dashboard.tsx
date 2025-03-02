import { useState, useEffect } from 'react';
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

interface ExpenseSummary {
  category: string;
  total: number;
}

interface CarExpense {
  carId: string;
  total: number;
}

interface ExpenseQueryResult {
  amount: number | null;
  category: string | null;
  date: string | null;
  car: {
    make: string | null;
    model: string | null;
  } | null;
}

export default function Dashboard() {
  const { supabaseClient } = useSupabase();
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseSummary[]>([]);
  const [carExpenses, setCarExpenses] = useState<CarExpense[]>([]);
  const [carCount, setCarCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch expenses with car details
      const { data: expenses, error } = await supabaseClient
        .from('expenses')
        .select(`
          amount,
          category,
          date,
          car (
            make,
            model
          )
        `) as { 
          data: ExpenseQueryResult[] | null, 
          error: any 
        };

      if (error) throw error;

      if (expenses) {
        // Total expenses
        const total = expenses.reduce((sum: number, expense: ExpenseQueryResult) => 
          sum + (expense.amount || 0), 0);
        setTotalExpenses(total);

        // Expenses by category
        const categoryTotals = expenses.reduce((acc: Record<string, number>, expense: ExpenseQueryResult) => {
          const category = expense.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + (expense.amount || 0);
          return acc;
        }, {});

        setExpensesByCategory(
          Object.entries(categoryTotals).map(([category, total]) => ({
            category,
            total
          }))
        );

        // Expenses by car
        const carTotals = expenses.reduce((acc: Record<string, number>, expense: ExpenseQueryResult) => {
          const carName = expense.car 
            ? `${expense.car.make || 'Unknown'} ${expense.car.model || 'Car'}` 
            : 'Unassigned';
          acc[carName] = (acc[carName] || 0) + (expense.amount || 0);
          return acc;
        }, {});

        setCarExpenses(
          Object.entries(carTotals).map(([carName, total]) => ({
            carId: carName,
            total
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
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <dd className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-dark-text-primary">
              {carCount}
            </dd>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        flex flex-col justify-between hover:shadow-lg dark:hover:shadow-dark-lg 
                        transition-all duration-300 transform hover:-translate-y-1 min-h-[150px]">
          <div>
            <dt className="text-sm font-medium text-neutral-500 dark:text-dark-text-secondary truncate mb-2">
              Expenses by Category
            </dt>
            <div className="h-48">
              <Doughnut data={doughnutData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white dark:bg-dark-background-secondary rounded-xl shadow-md dark:shadow-dark-md p-6 
                        flex flex-col justify-between hover:shadow-lg dark:hover:shadow-dark-lg 
                        transition-all duration-300 transform hover:-translate-y-1 min-h-[150px]">
          <div>
            <dt className="text-sm font-medium text-neutral-500 dark:text-dark-text-secondary truncate mb-2">
              Monthly Expenses
            </dt>
            <div className="h-48">
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
