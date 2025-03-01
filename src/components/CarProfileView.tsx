import { Button } from './Button';
import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';
import MaintenanceView from './MaintenanceView';
import DocumentView from './DocumentView';
import { Car as CarType } from '../types';

interface Car extends CarType {
  id: number;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  image_url: string | null;
  created_at: string;
  vin: string | null;
  mileage: number | null;
  user_id: string;
}

interface Expense {
  id: number;
  car_id: number;
  category: string;
  amount: number;
  date: string;
  description: string;
  created_at: string;
}

interface CarProfileViewProps {
  car: Car;
  onClose: () => void;
  onCarUpdated: () => void;
}

export default function CarProfileView({ car, onClose, onCarUpdated }: CarProfileViewProps) {
  const { supabaseClient, supabaseStorage } = useSupabase();
  const [activeTab, setActiveTab] = useState<'details' | 'maintenance' | 'documents'>('details');
  const [editMode, setEditMode] = useState(false);
  const [editedCar, setEditedCar] = useState<Car>(car);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState<Record<string, number>>({});
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCarExpenses();
    fetchMaintenanceHistory();
  }, [car.id]);

  async function fetchCarExpenses() {
    const { data, error } = await supabaseClient
      .from('expenses')
      .select('*')
      .eq('car_id', car.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      setExpenses(data || []);
      calculateExpenseStats(data || []);
    }
  }

  async function fetchMaintenanceHistory() {
    setIsLoading(true);
    const { data, error } = await supabaseClient
      .from('maintenance_events')
      .select('*')
      .eq('car_id', car.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching maintenance history:', error);
    } else {
      setMaintenanceHistory(data || []);
    }
    setIsLoading(false);
  }

  function calculateExpenseStats(expenseData: Expense[]) {
    const total = expenseData.reduce((sum, expense) => sum + expense.amount, 0);
    setTotalExpenses(total);

    const byCategory = expenseData.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    setExpensesByCategory(byCategory);
  }

  async function handleUpdateCar() {
    try {
      let imageUrl = car.image_url;

      if (selectedImage) {
        // Upload new image if selected
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${car.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabaseStorage
          .from('car-images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseStorage
          .from('car-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabaseClient
        .from('cars')
        .update({
          ...editedCar,
          image_url: imageUrl
        })
        .eq('id', car.id);

      if (error) throw error;

      setEditMode(false);
      onCarUpdated();
    } catch (error) {
      console.error('Error updating car:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Car Profile
          </h3>
          <Button
            type="button"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <Button
              onClick={() => setActiveTab('details')}
              variant={activeTab === 'details' ? 'primary' : 'default'}
            >
              Details
            </Button>
            <Button
              onClick={() => setActiveTab('maintenance')}
              variant={activeTab === 'maintenance' ? 'primary' : 'default'}
            >
              Maintenance
            </Button>
            <Button
              onClick={() => setActiveTab('documents')}
              variant={activeTab === 'documents' ? 'primary' : 'default'}
            >
              Documents
            </Button>
          </nav>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Car Image and Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="relative pt-[100%]">
                      {car.image_url ? (
                        <img
                          src={car.image_url}
                          alt={`${car.make} ${car.model}`}
                          className="absolute inset-0 w-full h-full object-contain bg-gray-100 rounded-lg"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
                          <PhotoIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {editMode && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Change Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                          className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                        />
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-lg font-semibold mb-2">Car Details</h3>
                    {editMode ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Make</label>
                          <input
                            type="text"
                            value={editedCar.make}
                            onChange={(e) => setEditedCar({ ...editedCar, make: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Model</label>
                          <input
                            type="text"
                            value={editedCar.model}
                            onChange={(e) => setEditedCar({ ...editedCar, model: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Year</label>
                          <input
                            type="number"
                            value={editedCar.year || ''}
                            onChange={(e) => setEditedCar({ ...editedCar, year: parseInt(e.target.value) })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">VIN</label>
                          <input
                            type="text"
                            value={editedCar.vin || ''}
                            onChange={(e) => setEditedCar({ ...editedCar, vin: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Current Mileage (km)</label>
                          <input
                            type="number"
                            value={editedCar.mileage || ''}
                            onChange={(e) => setEditedCar({ ...editedCar, mileage: parseInt(e.target.value) })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Make</dt>
                          <dd className="mt-1 text-sm text-gray-900">{car.make}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Model</dt>
                          <dd className="mt-1 text-sm text-gray-900">{car.model}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Year</dt>
                          <dd className="mt-1 text-sm text-gray-900">{car.year}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">VIN</dt>
                          <dd className="mt-1 text-sm text-gray-900">{car.vin || 'Not specified'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Current Mileage</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {car.mileage ? `${car.mileage.toLocaleString()} km` : 'Not specified'}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>
                </div>
              </div>

              {/* Expense Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Expense Summary</h3>
                <p className="text-xl font-bold text-green-600 mb-4">
                  Total: ¥{totalExpenses.toLocaleString()}
                </p>
                <div className="space-y-2">
                  {Object.entries(expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-gray-600">{category}</span>
                      <span className="font-medium">¥{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Expenses */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Recent Expenses</h3>
                <div className="space-y-2">
                  {expenses.slice(0, 5).map((expense) => (
                    <div
                      key={expense.id}
                      className="bg-gray-50 p-3 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-gray-600">
                          {DateTime.fromISO(expense.date).toFormat('yyyy/MM/dd')}
                        </p>
                        {expense.description && (
                          <p className="text-sm text-gray-600">{expense.description}</p>
                        )}
                      </div>
                      <p className="font-medium">¥{expense.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                {editMode ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setEditedCar(car);
                      }}
                      variant="default"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUpdateCar}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setEditMode(true)}
                    variant="primary"
                  >
                    Edit Details
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView 
              car={car} 
              schedules={maintenanceHistory} 
              loading={isLoading}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentView car={car} />
          )}
        </div>
      </div>
    </div>
  );
}
