import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { DateTime } from 'luxon';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ResponsiveCalendar } from '@nivo/calendar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Car {
  id: number;
  make: string;
  model: string;
}

interface Expense {
  id: number;
  car_id: number;
  category: string;
  amount: number;
  date: string;
}

interface DailyExpense {
  day: string;
  value: number;
}

const CATEGORY_COLORS = {
  'Gas': 'rgba(255, 99, 132, 0.5)',
  'Car Wash': 'rgba(54, 162, 235, 0.5)',
  'Repairs': 'rgba(255, 206, 86, 0.5)',
  'Accessories': 'rgba(75, 192, 192, 0.5)',
  'Insurance': 'rgba(153, 102, 255, 0.5)',
  'Road Tax': 'rgba(255, 159, 64, 0.5)',
  'JAF': 'rgba(199, 199, 199, 0.5)',
  'Other': 'rgba(83, 102, 255, 0.5)',
};

export default function Analytics() {
  const { supabaseClient } = useSupabase();
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<{ [key: string]: number[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCar, timeRange]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCars(), fetchExpenses()]);
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCars() {
    const { data, error } = await supabaseClient
      .from('cars')
      .select('id, make, model')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Error fetching cars: ' + error.message);
    setCars(data || []);
  }

  async function fetchExpenses() {
    const startDate = timeRange === 'month'
      ? DateTime.now().minus({ months: 1 }).toISODate()
      : DateTime.now().minus({ years: 1 }).toISODate();

    let query = supabaseClient
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .order('date', { ascending: true });

    if (selectedCar !== 'all') {
      query = query.eq('car_id', selectedCar);
    }

    const { data, error } = await query;

    if (error) throw new Error('Error fetching expenses: ' + error.message);
    
    setExpenses(data || []);

    // Process daily expenses for calendar chart
    const dailyData = (data || []).reduce((acc: { [key: string]: number }, expense: Expense) => {
      acc[expense.date] = (acc[expense.date] || 0) + expense.amount;
      return acc;
    }, {});

    setDailyExpenses(
      Object.entries(dailyData).map(([day, value]) => ({
        day,
        value: value as number,
      } as DailyExpense))
    );

    // Process category trends
    const categories = [...new Set(data?.map((e: Expense) => e.category))];
    const months = Array.from({ length: timeRange === 'month' ? 4 : 12 }, (_, i) => {
      return DateTime.now().minus({ months: i }).toFormat('LLL yyyy');
    }).reverse();

    const trends: { [key: string]: number[] } = {};
    categories.forEach(category => {
      trends[category] = months.map(month => {
        return (data || [])
          .filter((e: Expense) => 
            e.category === category && 
            DateTime.fromISO(e.date).toFormat('LLL yyyy') === month
          )
          .reduce((sum: number, e: Expense) => sum + e.amount, 0);
      });
    });

    setCategoryTrends(trends);
  }

  const categoryData = {
    labels: Object.keys(CATEGORY_COLORS),
    datasets: [
      {
        data: Object.keys(CATEGORY_COLORS).map(category =>
          expenses
            .filter(e => e.category === category)
            .reduce((sum, e) => sum + e.amount, 0)
        ),
        backgroundColor: Object.values(CATEGORY_COLORS),
      },
    ],
  };

  const trendData = {
    labels: Array.from({ length: timeRange === 'month' ? 4 : 12 }, (_, i) => {
      return DateTime.now().minus({ months: i }).toFormat('LLL yyyy');
    }).reverse(),
    datasets: Object.entries(categoryTrends).map(([category, data]) => ({
      label: category,
      data: data,
      borderColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
      backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
      tension: 0.4,
    })),
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="car-select" className="block text-sm font-medium text-gray-700">
              Select Car
            </label>
            <select
              id="car-select"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={selectedCar}
              onChange={(e) => setSelectedCar(e.target.value === 'all' ? 'all' : e.target.value)}
            >
              <option value="all">All Cars</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="time-range" className="block text-sm font-medium text-gray-700">
              Time Range
            </label>
            <select
              id="time-range"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'month' | 'year')}
            >
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Expense Categories */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h3>
          <div className="h-64">
            <Pie data={categoryData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Category Trends */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Trends</h3>
          <div className="h-64">
            <Line
              data={trendData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Expense Calendar */}
        <div className="bg-white shadow rounded-lg p-4 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Calendar</h3>
          <div className="hidden md:block" style={{ height: '200px' }}>
            <ResponsiveCalendar
              data={dailyExpenses}
              from={timeRange === 'month' 
                ? DateTime.now().minus({ months: 1 }).toISODate()
                : DateTime.now().minus({ years: 1 }).toISODate()
              }
              to={DateTime.now().toISODate()}
              emptyColor="#eeeeee"
              colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              yearSpacing={40}
              monthBorderColor="#ffffff"
              dayBorderWidth={2}
              dayBorderColor="#ffffff"
            />
          </div>
          
          {/* Mobile view */}
          <div className="md:hidden">
            <div className="space-y-4">
              {Object.entries(
                dailyExpenses.reduce((acc: { [key: string]: DailyExpense[] }, expense) => {
                  const month = DateTime.fromISO(expense.day).toFormat('LLLL yyyy');
                  if (!acc[month]) acc[month] = [];
                  acc[month].push(expense);
                  return acc;
                }, {})
              ).map(([month, expenses]) => (
                <div key={month} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{month}</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className="text-xs text-center text-gray-500">
                        {DateTime.local().startOf('week').plus({ days: i }).toFormat('ccc')}
                      </div>
                    ))}
                    {generateCalendarDays(month, expenses)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate calendar days
function generateCalendarDays(month: string, expenses: DailyExpense[]) {
  const firstDay = DateTime.fromFormat(month, 'LLLL yyyy').startOf('month');
  const lastDay = firstDay.endOf('month');
  const startPadding = firstDay.weekday % 7;
  const totalDays = lastDay.day;

  // Create expense lookup
  const expenseLookup = expenses.reduce((acc: { [key: string]: number }, expense) => {
    const day = DateTime.fromISO(expense.day).day;
    acc[day] = expense.value;
    return acc;
  }, {});

  // Get the maximum expense value for color scaling
  const maxExpense = Math.max(...Object.values(expenseLookup));

  // Generate padding cells
  const paddingCells = Array.from({ length: startPadding }, (_, i) => (
    <div key={`padding-start-${i}`} className="h-8" />
  ));

  // Generate day cells
  const dayCells = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const expense = expenseLookup[day] || 0;
    const intensity = maxExpense > 0 ? expense / maxExpense : 0;
    const backgroundColor = expense > 0
      ? `rgba(97, 205, 187, ${Math.max(0.1, intensity)})`
      : 'transparent';

    return (
      <div
        key={`day-${day}`}
        className="h-8 flex items-center justify-center text-xs border rounded"
        style={{ backgroundColor }}
        title={expense > 0 ? `¥${expense.toLocaleString()}` : 'No expenses'}
      >
        {day}
      </div>
    );
  });

  return [...paddingCells, ...dayCells];
}


