import { useEffect, useState } from 'react';
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
  BarElement,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { DateTime } from 'luxon';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

export default function Dashboard() {
  const { supabaseClient } = useSupabase();
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseSummary[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
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
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
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
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
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
        backgroundColor: '#4BC0C0',
      },
    ],
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Expenses
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ¥{totalExpenses.toLocaleString()}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Registered Cars
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {carCount}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Average Monthly Expense
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ¥{(totalExpenses / 6).toLocaleString()}
            </dd>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Expense Categories */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h3>
            <div className="h-64">
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trend</h3>
            <div className="h-64">
              <Line data={lineData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Expenses by Car */}
        <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Car</h3>
            <div className="h-64">
              <Bar data={barData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
