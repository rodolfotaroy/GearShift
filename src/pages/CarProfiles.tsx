import { Button } from '../components/Button';
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { PencilIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import CarProfileView from '../components/CarProfileView';
import { Button } from '../components/Button';

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  vin: string;
  mileage: number;
  user_id: string;
  image_url: string | null;
  created_at: string;
}

interface ValidationError {
  field: string;
  message: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CURRENT_YEAR = new Date().getFullYear();
const PLATE_NUMBER_REGEX = /^[A-Z0-9]{1,8}$/;

export default function CarProfiles() {
  const { supabaseClient, supabaseStorage } = useSupabase();
  const [cars, setCars] = useState<Car[]>([]);
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isViewingProfile, setIsViewingProfile] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [newCar, setNewCar] = useState({
    make: '',
    model: '',
    year: CURRENT_YEAR,
    plate_number: '',
    vin: '',
    mileage: 0,
    user_id: '',
    image_url: null as string | null,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    fetchCars();
  }, []);

  async function fetchCars() {
    const { data, error } = await supabaseClient
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cars:', error);
    } else {
      setCars(data || []);
    }
  }

  const validateCarData = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!newCar.make.trim()) {
      errors.push({ field: 'make', message: 'Make is required' });
    }
    if (!newCar.model.trim()) {
      errors.push({ field: 'model', message: 'Model is required' });
    }
    if (newCar.year < 1900 || newCar.year > CURRENT_YEAR + 1) {
      errors.push({ field: 'year', message: `Year must be between 1900 and ${CURRENT_YEAR + 1}` });
    }
    if (!PLATE_NUMBER_REGEX.test(newCar.plate_number)) {
      errors.push({ field: 'plate_number', message: 'Invalid plate number format. Use capital letters and numbers only (max 8 characters)' });
    }

    return errors;
  };

  const validateImageFile = (file: File): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (file.size > MAX_FILE_SIZE) {
      errors.push({ field: 'image', message: 'File size must be less than 5MB' });
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push({ field: 'image', message: 'Only JPEG, PNG, and WebP images are allowed' });
    }

    return errors;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: uploadResult, error: uploadError } = await supabaseStorage
        .from('car-documents')
        .upload(`${file.name}`, file);

      if (uploadError) throw uploadError;
      
      if (uploadResult) {
        const { data: publicUrl } = await supabaseStorage
          .from('car-documents')
          .getPublicUrl(uploadResult.path);
          
        if (publicUrl) {
          setNewCar(prev => ({ ...prev, image_url: publicUrl.publicUrl }));
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  async function handleAddCar(e: React.FormEvent) {
    e.preventDefault();
    
    const errors = validateCarData();
    if (selectedImage) {
      errors.push(...validateImageFile(selectedImage));
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const { data: newCarData, error: carError } = await supabaseClient
        .from('cars')
        .insert([{
          make: newCar.make.trim(),
          model: newCar.model.trim(),
          year: newCar.year,
          plate_number: newCar.plate_number.toUpperCase(),
          vin: newCar.vin,
          mileage: newCar.mileage,
          user_id: newCar.user_id,
        }])
        .select()
        .single();

      if (carError) {
        console.error('Error adding car:', carError);
        return;
      }

      console.log('Car added successfully:', newCarData);

      // If there's an image, upload it and update the car record
      if (selectedImage && newCarData) {
        console.log('Uploading image for car:', newCarData.id);
        await handleFileUpload({ target: { files: [selectedImage] } } as unknown as React.ChangeEvent<HTMLInputElement>);
      }

      setIsAddingCar(false);
      setNewCar({
        make: '',
        model: '',
        year: CURRENT_YEAR,
        plate_number: '',
        vin: '',
        mileage: 0,
        user_id: '',
        image_url: null,
      });
      setSelectedImage(null);
      fetchCars();
    } catch (error) {
      console.error('Error in add car process:', error);
    }
  }

  async function handleEditCar(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCar) return;

    const errors = validateCarData();
    if (selectedImage) {
      errors.push(...validateImageFile(selectedImage));
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // If there's a new image, upload it
      if (selectedImage) {
        console.log('Uploading new image for car:', selectedCar.id);
        await handleFileUpload({ target: { files: [selectedImage] } } as unknown as React.ChangeEvent<HTMLInputElement>);
      }

      // Update the car with all fields including the new image URL if present
      const { error } = await supabaseClient
        .from('cars')
        .update({
          make: newCar.make.trim(),
          model: newCar.model.trim(),
          year: newCar.year,
          plate_number: newCar.plate_number.toUpperCase(),
          vin: newCar.vin,
          mileage: newCar.mileage,
          user_id: newCar.user_id,
          ...(newCar.image_url && { image_url: newCar.image_url }),
        })
        .eq('id', selectedCar.id);

      if (error) {
        console.error('Error updating car:', error);
        return;
      }

      setIsEditingCar(false);
      setSelectedCar(null);
      setNewCar({
        make: '',
        model: '',
        year: CURRENT_YEAR,
        plate_number: '',
        vin: '',
        mileage: 0,
        user_id: '',
        image_url: null,
      });
      setSelectedImage(null);
      fetchCars();
    } catch (error) {
      console.error('Error in edit car process:', error);
    }
  }

  async function handleDeleteCar(carId: number) {
    if (!window.confirm('Are you sure you want to delete this car? This will also delete all associated expenses.')) {
      return;
    }

    const { error: expensesError } = await supabaseClient
      .from('expenses')
      .delete()
      .eq('car_id', carId);

    if (expensesError) {
      console.error('Error deleting car expenses:', expensesError);
      return;
    }

    const { error } = await supabaseClient
      .from('cars')
      .delete()
      .eq('id', carId);

    if (error) {
      console.error('Error deleting car:', error);
    } else {
      fetchCars();
    }
  }

  function startEditCar(car: Car) {
    setSelectedCar(car);
    setNewCar({
      make: car.make,
      model: car.model,
      year: car.year,
      plate_number: car.plate_number,
      vin: car.vin,
      mileage: car.mileage,
      user_id: car.user_id,
      image_url: car.image_url,
    });
    setIsEditingCar(true);
  }

  return (
    <div className="w-full max-w-[98%] sm:max-w-[95%] mx-auto px-2 sm:px-4">
      <div className="flex justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Car Profiles</h1>
        <Button
          onClick={() => setIsAddingCar(true)}
          variant="gradient"
          variant="primary"
        >
          Add Car
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {cars.map((car) => (
          <div
            key={car.id}
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
            onClick={() => {
              setSelectedCar(car);
              setIsViewingProfile(true);
            }}
          >
            <div className="relative aspect-[16/9] bg-gray-100">
              {car.image_url ? (
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={car.image_url}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover object-center transform hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <PhotoIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="p-3 sm:p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">{car.make} {car.model}</h2>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                      <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 mr-2 flex-shrink-0" />
                      <span className="truncate">{car.year}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                      <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mr-2 flex-shrink-0" />
                      <span className="truncate">{car.plate_number}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-1 sm:space-x-2 ml-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    onClick={() => startEditCar(car)}
                    variant="gradient"
                    className="p-1 sm:p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 hover:text-indigo-600" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteCar(car.id)}
                    variant="gradient"
                    className="p-1 sm:p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 hover:text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isViewingProfile && selectedCar && (
        <CarProfileView
          car={selectedCar}
          onClose={() => {
            setIsViewingProfile(false);
            setSelectedCar(null);
          }}
          onCarUpdated={() => {
            fetchCars(); // Refresh the car list after update
            setIsViewingProfile(false);
            setSelectedCar(null);
          }}
        />
      )}

      {(isAddingCar || isEditingCar) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {isAddingCar ? 'Add New Car' : 'Edit Car'}
            </h2>
            <form onSubmit={isAddingCar ? handleAddCar : handleEditCar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Make</label>
                <input
                  type="text"
                  value={newCar.make}
                  onChange={(e) => setNewCar({ ...newCar, make: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  value={newCar.model}
                  onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  value={newCar.year}
                  onChange={(e) => setNewCar({ ...newCar, year: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Plate Number</label>
                <input
                  type="text"
                  value={newCar.plate_number}
                  onChange={(e) => setNewCar({ ...newCar, plate_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">VIN</label>
                <input
                  type="text"
                  value={newCar.vin}
                  onChange={(e) => setNewCar({ ...newCar, vin: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mileage</label>
                <input
                  type="number"
                  value={newCar.mileage}
                  onChange={(e) => setNewCar({ ...newCar, mileage: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <input
                  type="text"
                  value={newCar.user_id}
                  onChange={(e) => setNewCar({ ...newCar, user_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Car Image</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              </div>
              {validationErrors.length > 0 && (
                <div className="text-red-600">
                  {validationErrors.map((error, index) => (
                    <p key={index}>{error.message}</p>
                  ))}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={() => {
                    setIsAddingCar(false);
                    setIsEditingCar(false);
                    setSelectedCar(null);
                    setNewCar({
                      make: '',
                      model: '',
                      year: CURRENT_YEAR,
                      plate_number: '',
                      vin: '',
                      mileage: 0,
                      user_id: '',
                      image_url: null,
                    });
                    setSelectedImage(null);
                  }}
                  variant="gradient"
                  variant="primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  variant="primary"
                >
                  {isAddingCar ? 'Add Car' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
