import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useSupabase } from '../contexts/SupabaseContext';
import { CarProfileView } from '../components/CarProfileView';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/supabase';

const CURRENT_YEAR = new Date().getFullYear();

type CarInsertWithoutUserId = Omit<Database['public']['Tables']['cars']['Insert'], 'user_id' | 'id' | 'created_at'> & {
  plate_number?: string;
  vin?: string;
  mileage?: number;
  image_url?: string;
};

const validateCarInput = (car: CarInsertWithoutUserId) => {
  const errors: { field: string; message: string }[] = [];

  if (!car.make || car.make.trim() === '') {
    errors.push({ field: 'make', message: 'Make is required' });
  }

  if (!car.model || car.model.trim() === '') {
    errors.push({ field: 'model', message: 'Model is required' });
  }

  if (!car.year || car.year < 1900 || car.year > CURRENT_YEAR) {
    errors.push({ field: 'year', message: `Year must be between 1900 and ${CURRENT_YEAR}` });
  }

  return errors;
};

export function CarProfiles() {
  const { supabaseClient, supabaseStorage } = useSupabase();
  const { user } = useAuth();

  const [cars, setCars] = useState<Database['public']['Tables']['cars']['Row'][]>([]);
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Database['public']['Tables']['cars']['Row'] | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
  
  const [newCar, setNewCar] = useState<CarInsertWithoutUserId>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plate_number: '',
    vin: '',
    mileage: 0,
    image_url: ''
  });

  useEffect(() => {
    const fetchCars = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabaseClient
          .from('cars')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        setCars(data || []);
      } catch (err) {
        console.error('Error fetching cars:', err);
      }
    };

    fetchCars();
  }, [supabaseClient, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCar(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'mileage' 
        ? (value ? parseInt(value, 10) : 0) 
        : value || ''
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/cars/${fileName}`;

      const { error: uploadError } = await supabaseStorage
        .from('car_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseStorage
        .from('car_images')
        .getPublicUrl(filePath);

      setNewCar(prev => ({
        ...prev,
        image_url: urlData?.publicUrl || ''
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const resetCarForm = () => {
    setNewCar({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      plate_number: '',
      vin: '',
      mileage: 0,
      image_url: ''
    });
    setValidationErrors([]);
  };

  const handleAddCar = async () => {
    if (!user) return;

    const errors = validateCarInput(newCar);

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const carToInsert: Database['public']['Tables']['cars']['Insert'] = {
        user_id: user.id,
        make: newCar.make,
        model: newCar.model,
        year: newCar.year,
        plate_number: newCar.plate_number || '',
        vin: newCar.vin,
        mileage: newCar.mileage,
        image_url: newCar.image_url
      };

      const { data, error } = await supabaseClient
        .from('cars')
        .insert(carToInsert)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setCars(prev => [...prev, data[0]]);
        setIsAddingCar(false);
        resetCarForm();
      }
    } catch (err) {
      console.error('Error adding car:', err);
    }
  };

  const handleEditCar = async () => {
    if (!selectedCar || !user) return;

    const errors = validateCarInput(newCar);

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const carToUpdate: Database['public']['Tables']['cars']['Update'] = {
        id: selectedCar.id,
        user_id: user.id,
        make: newCar.make,
        model: newCar.model,
        year: newCar.year,
        plate_number: newCar.plate_number || '',
        vin: newCar.vin,
        mileage: newCar.mileage,
        image_url: newCar.image_url
      };

      const { data, error } = await supabaseClient
        .from('cars')
        .update(carToUpdate)
        .eq('id', selectedCar.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setCars(prev => 
          prev.map(car => car.id === selectedCar.id ? data[0] : car)
        );
        setIsEditingCar(false);
        setSelectedCar(null);
        resetCarForm();
      }
    } catch (err) {
      console.error('Error updating car:', err);
    }
  };

  const handleDeleteCar = async (carId: number) => {
    try {
      const { error } = await supabaseClient
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) throw error;

      setCars(currentCars => currentCars.filter(car => car.id !== carId));
    } catch (err) {
      console.error('Error deleting car:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          My Cars
        </h1>
        <button 
          type="button"
          onClick={() => {
            setIsAddingCar(true);
            resetCarForm();
          }}
          className="flex items-center bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Car
        </button>
      </div>

      {cars.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="mb-4">You haven't added any cars yet.</p>
          <button 
            type="button"
            onClick={() => {
              setIsAddingCar(true);
              resetCarForm();
            }}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Add Your First Car
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => (
            <CarProfileView 
              key={car.id} 
              car={car}
              onEdit={() => {
                setSelectedCar(car);
                setNewCar({
                  make: car.make,
                  model: car.model,
                  year: car.year,
                  plate_number: car.plate_number || '',
                  vin: car.vin || '',
                  mileage: car.mileage || 0,
                  image_url: car.image_url || ''
                });
                setIsEditingCar(true);
                setValidationErrors([]);
              }}
              onDelete={() => handleDeleteCar(car.id)}
            />
          ))}
        </div>
      )}

      {(isAddingCar || isEditingCar) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {isEditingCar ? 'Edit Car' : 'Add New Car'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Make
                </label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={newCar.make}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  placeholder="Enter car make"
                  required
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={newCar.model}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  placeholder="Enter car model"
                  required
                />
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={newCar.year}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  min={1900}
                  max={CURRENT_YEAR}
                  required
                />
              </div>
              <div>
                <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plate Number
                </label>
                <input
                  type="text"
                  id="plate_number"
                  name="plate_number"
                  value={newCar.plate_number || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  placeholder="Enter plate number"
                />
              </div>
              <div>
                <label htmlFor="vin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  VIN
                </label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={newCar.vin || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  placeholder="Enter VIN"
                />
              </div>
              <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mileage
                </label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={newCar.mileage || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  placeholder="Enter mileage"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Car Image
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-primary-100"
                />
                {newCar.image_url && (
                  <img 
                    src={newCar.image_url} 
                    alt="Car preview" 
                    className="mt-4 w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>
            {validationErrors.length > 0 && (
              <div className="mt-4 text-red-600 dark:text-red-400">
                {validationErrors.map((error, index) => (
                  <p key={index}>{error.message}</p>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingCar(false);
                  setIsEditingCar(false);
                  setSelectedCar(null);
                  resetCarForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={isEditingCar ? handleEditCar : handleAddCar}
                className="btn btn-primary"
              >
                {isEditingCar ? 'Update Car' : 'Add Car'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
