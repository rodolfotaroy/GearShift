import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { CarProfileView } from '../components/CarProfileView';
import { Car, Tables } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';

const CURRENT_YEAR = new Date().getFullYear();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PLATE_NUMBER_REGEX = /^[A-Z0-9]{1,8}$/;
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export function CarProfiles() {
  const { supabaseClient, supabaseStorage } = useSupabase();
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
  const [newCar, setNewCar] = useState<Tables<'cars'>['Insert']>({
    id: undefined,
    make: '',
    model: '',
    year: CURRENT_YEAR,
    plate_number: '',
    vin: '',
    mileage: undefined,
    user_id: user?.id || '',
    image_url: undefined,
    created_at: new Date().toISOString()
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

  const validateCarData = (): { field: string; message: string }[] => {
    const errors: { field: string; message: string }[] = [];

    if (!newCar.make) {
      errors.push({ field: 'make', message: 'Make is required' });
    }

    if (!newCar.model) {
      errors.push({ field: 'model', message: 'Model is required' });
    }

    if (!newCar.year || newCar.year < 1900 || newCar.year > CURRENT_YEAR) {
      errors.push({ field: 'year', message: 'Invalid year' });
    }

    if (newCar.plate_number && !PLATE_NUMBER_REGEX.test(newCar.plate_number)) {
      errors.push({ field: 'plate_number', message: 'Invalid plate number' });
    }

    if (newCar.vin && !VIN_REGEX.test(newCar.vin)) {
      errors.push({ field: 'vin', message: 'Invalid VIN' });
    }

    return errors;
  };

  const handleAddCar = async () => {
    const errors = validateCarData();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabaseStorage
          .from('car_images')
          .upload(fileName, selectedImage);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          return;
        }

        const { data: urlData } = supabaseStorage
          .from('car_images')
          .getPublicUrl(fileName);

        imageUrl = urlData?.publicUrl;
      }

      const carToInsert: Tables<'cars'>['Insert'] = {
        ...newCar,
        image_url: imageUrl,
        user_id: user?.id || '',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('cars')
        .insert(carToInsert)
        .select()
        .single();

      if (error) {
        console.error('Error adding car:', error);
        return;
      }

      setCars(prev => [data, ...prev]);
      setIsAddingCar(false);
      setSelectedImage(null);
      setNewCar({
        id: undefined,
        make: '',
        model: '',
        year: CURRENT_YEAR,
        plate_number: '',
        vin: '',
        mileage: undefined,
        user_id: user?.id || '',
        image_url: undefined,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const handleUpdateCar = async () => {
    if (!selectedCar) return;

    const errors = validateCarData();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      let imageUrl = selectedCar.image_url;
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabaseStorage
          .from('car_images')
          .upload(fileName, selectedImage);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          return;
        }

        const { data: urlData } = supabaseStorage
          .from('car_images')
          .getPublicUrl(fileName);

        imageUrl = urlData?.publicUrl;
      }

      const carToUpdate: Tables<'cars'>['Update'] = {
        ...selectedCar,
        ...newCar,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseClient
        .from('cars')
        .update(carToUpdate)
        .eq('id', selectedCar.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating car:', error);
        return;
      }

      setCars(prev => prev.map(car => car.id === data.id ? data : car));
      setIsEditingCar(false);
      setSelectedCar(null);
      setSelectedImage(null);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const handleDeleteCar = async (carId: number) => {
    try {
      const { error } = await supabaseClient
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) {
        console.error('Error deleting car:', error);
        return;
      }

      setCars(prev => prev.filter(car => car.id !== carId));
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    setSelectedImage(file);
  };

  const renderCarForm = () => {
    return (
      <div className="car-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
              Make
            </label>
            <input
              type="text"
              id="make"
              value={newCar.make}
              onChange={(e) => setNewCar(prev => ({ ...prev, make: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter car make"
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Model
            </label>
            <input
              type="text"
              id="model"
              value={newCar.model}
              onChange={(e) => setNewCar(prev => ({ ...prev, model: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter car model"
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              type="number"
              id="year"
              value={newCar.year}
              onChange={(e) => setNewCar(prev => ({ ...prev, year: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              min={1900}
              max={CURRENT_YEAR}
            />
          </div>
          <div>
            <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700">
              Plate Number
            </label>
            <input
              type="text"
              id="plate_number"
              value={newCar.plate_number}
              onChange={(e) => setNewCar(prev => ({ ...prev, plate_number: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter plate number"
            />
          </div>
          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
              VIN
            </label>
            <input
              type="text"
              id="vin"
              value={newCar.vin}
              onChange={(e) => setNewCar(prev => ({ ...prev, vin: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter VIN"
            />
          </div>
          <div>
            <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
              Mileage
            </label>
            <input
              type="number"
              id="mileage"
              value={newCar.mileage}
              onChange={(e) => setNewCar(prev => ({ ...prev, mileage: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter mileage"
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Car Image
          </label>
          <input
            type="file"
            id="image"
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleImageUpload}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-indigo-100"
          />
          {selectedImage && (
            <p className="mt-2 text-sm text-gray-500">
              Selected file: {selectedImage.name}
            </p>
          )}
        </div>
        {validationErrors.length > 0 && (
          <div className="mt-4 text-red-600">
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
              setValidationErrors([]);
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={isEditingCar ? handleUpdateCar : handleAddCar}
            className="btn btn-primary"
          >
            {isEditingCar ? 'Update Car' : 'Add Car'}
          </button>
        </div>
      </div>
    );
  };

  const renderCarList = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map(car => (
          <CarProfileView
            key={car.id}
            car={car}
            onEdit={() => {
              setSelectedCar(car);
              setNewCar(car);
              setIsEditingCar(true);
            }}
            onDelete={() => handleDeleteCar(car.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Cars</h1>
        {!isAddingCar && (
          <button
            onClick={() => {
              setIsAddingCar(true);
              setSelectedCar(null);
            }}
            className="btn btn-primary"
          >
            Add New Car
          </button>
        )}
      </div>

      {(isAddingCar || isEditingCar) && renderCarForm()}
      {!(isAddingCar || isEditingCar) && renderCarList()}
    </div>
  );
}
