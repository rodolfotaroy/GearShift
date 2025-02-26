import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';

interface Car {
  id: number;
  make: string;
  model: string;
  plate_number: string;
}

interface Expense {
  id: number;
  car_id: number;
  category: string;
  amount: number;
  date: string;
  description: string;
  created_at: string;
  cars: {
    make: string;
    model: string;
    plate_number: string;
  };
}

const EXPENSE_CATEGORIES = [
  'Gas',
  'Car Wash',
  'Repair',
  'Accessory',
  'Insurance',
  'Road Tax',
  'JAF',
  'Others',
];

export default function ExpenseTracker() {
  const supabase = useSupabase();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [newExpense, setNewExpense] = useState({
    car_id: 0,
    category: EXPENSE_CATEGORIES[0],
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    fetchExpenses();
    fetchCars();
  }, [selectedCarId, selectedCategory]);

  const fetchExpenses = async () => {
    try {
      const { error } = await supabase
        .from('expenses')
        .select(`
          *,
          cars (
            make,
            model,
            plate_number
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      const { data } = await supabase
        .from('expenses')
        .select(`
          *,
          cars (
            make,
            model,
            plate_number
          )
        `)
        .order('date', { ascending: false });

      if (selectedCarId !== 'all') {
        setExpenses(data.filter((expense) => expense.car_id === selectedCarId));
      } else if (selectedCategory !== 'all') {
        setExpenses(data.filter((expense) => expense.category === selectedCategory));
      } else {
        setExpenses(data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  async function fetchCars() {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cars:', error);
    } else {
      setCars(data || []);
      if (data && data.length > 0 && !isEditingExpense) {
        setNewExpense(prev => ({ ...prev, car_id: data[0].id }));
      }
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select();

    if (error) {
      console.error('Error adding expense:', error);
    } else {
      setIsAddingExpense(false);
      resetForm();
      fetchExpenses();
    }
  }

  async function handleEditExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExpense) return;

    const { error } = await supabase
      .from('expenses')
      .update({
        car_id: newExpense.car_id,
        category: newExpense.category,
        amount: newExpense.amount,
        date: newExpense.date,
        description: newExpense.description,
      })
      .eq('id', selectedExpense.id);

    if (error) {
      console.error('Error updating expense:', error);
    } else {
      setIsEditingExpense(false);
      setSelectedExpense(null);
      resetForm();
      fetchExpenses();
    }
  }

  async function handleDeleteExpense(expenseId: number) {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error('Error deleting expense:', error);
    } else {
      fetchExpenses();
    }
  }

  function startEditExpense(expense: Expense) {
    setSelectedExpense(expense);
    setNewExpense({
      car_id: expense.car_id,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description || '',
    });
    setIsEditingExpense(true);
  }

  function resetForm() {
    setNewExpense({
      car_id: cars[0]?.id || 0,
      category: EXPENSE_CATEGORIES[0],
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Expense Tracker</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and manage your vehicle expenses.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddingExpense(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Car</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={selectedCarId}
              onChange={(e) => setSelectedCarId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">All Cars</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.model} ({car.plate_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Category</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">Total Expenses</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">
              ¥{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Car</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {DateTime.fromISO(expense.date).toFormat('yyyy/MM/dd')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {`${expense.cars.make} ${expense.cars.model}`}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {expense.category}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ¥{expense.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {expense.description}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => startEditExpense(expense)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {(isAddingExpense || isEditingExpense) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isEditingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <form onSubmit={isEditingExpense ? handleEditExpense : handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Car</label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  value={newExpense.car_id}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, car_id: parseInt(e.target.value) })
                  }
                >
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.make} {car.model} ({car.plate_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value })
                  }
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (¥)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: parseInt(e.target.value) })
                  }
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, description: e.target.value })
                  }
                  placeholder="e.g., Regular maintenance service"
                  rows={3}
                />
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                >
                  {isEditingExpense ? 'Save Changes' : 'Add Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingExpense(false);
                    setIsEditingExpense(false);
                    setSelectedExpense(null);
                    resetForm();
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
