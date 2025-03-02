import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { CarProfileView } from '../components/CarProfileView';
import { Car } from '../types/supabase';
import { useAuth } from '../contexts/AuthContext';

const CURRENT_YEAR = new Date().getFullYear();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PLATE_NUMBER_REGEX = /^[A-Z0-9]{1,8}$/;

export function CarProfiles() {
  const { supabaseClient, supabaseStorage } = useSupabase();
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
  const [newCar, setNewCar] = useState<Partial<Car>>({
    make: '',
    model: '',
    year: CURRENT_YEAR,
    plate_number: '',
    vin: '',
    mileage: 0,
    user_id: user?.id,
    image_url: ''
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

    if (!newCar.make?.trim()) {
      errors.push({ field: 'make', message: 'Make is required' });
    }
    if (!newCar.model?.trim()) {
      errors.push({ field: 'model', message: 'Model is required' });
    }
    if ((newCar.year || 0) < 1900 || (newCar.year || 0) > CURRENT_YEAR + 1) {
      errors.push({ field: 'year', message: `Year must be between 1900 and ${CURRENT_YEAR + 1}` });
    }
    if (!PLATE_NUMBER_REGEX.test(newCar.plate_number || '')) {
      errors.push({ field: 'plate_number', message: 'Invalid plate number format. Use capital letters and numbers only (max 8 characters)' });
    }

    return errors;
  };

  const validateImageFile = (file: File): { field: string; message: string }[] => {
    const errors: { field: string; message: string }[] = [];

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
          setNewCar((prev: Partial<Car>) => ({ ...prev, image_url: publicUrl.publicUrl }));
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
          make: newCar.make?.trim() || '',
          model: newCar.model?.trim() || '',
          year: newCar.year || new Date().getFullYear(),
          plate_number: newCar.plate_number?.toUpperCase() || '',
          vin: newCar.vin || '',
          mileage: newCar.mileage || 0,
          user_id: user?.id,
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
        year: new Date().getFullYear(),
        plate_number: '',
        vin: '',
        mileage: 0,
        user_id: user?.id,
        image_url: ''
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

      // Update car details
      const { error: updateError } = await supabaseClient
        .from('cars')
        .update({
          make: newCar.make?.trim() || '',
          model: newCar.model?.trim() || '',
          year: newCar.year || new Date().getFullYear(),
          plate_number: newCar.plate_number?.toUpperCase() || '',
          vin: newCar.vin || '',
          mileage: newCar.mileage || 0,
          image_url: newCar.image_url || selectedCar.image_url
        })
        .eq('id', selectedCar.id);

      if (updateError) {
        console.error('Error updating car:', updateError);
        return;
      }

      setIsEditingCar(false);
      setSelectedCar(null);
      setNewCar({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        plate_number: '',
        vin: '',
        mileage: 0,
        user_id: user?.id,
        image_url: ''
      });
      setSelectedImage(null);
      fetchCars();
    } catch (error) {
      console.error('Error in edit car process:', error);
    }
  }

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

      fetchCars();
    } catch (error) {
      console.error('Error in delete car process:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Cars</h1>
        <button 
          onClick={() => setIsAddingCar(true)} 
          className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition-colors"
        >
          Add New Car
        </button>
      </div>

      {/* Add/Edit Car Modal */}
      {(isAddingCar || isEditingCar) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {isAddingCar ? 'Add New Car' : 'Edit Car'}
            </h2>
            <form onSubmit={isAddingCar ? handleAddCar : handleEditCar} className="space-y-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium mb-1">Make</label>
                <input
                  type="text"
                  id="make"
                  value={newCar.make}
                  onChange={(e) => setNewCar((prev: Partial<Car>) => ({ ...prev, make: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                />
                {validationErrors.find(err => err.field === 'make') && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.find(err => err.field === 'make')?.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="model" className="block text-sm font-medium mb-1">Model</label>
                <input
                  type="text"
                  id="model"
                  value={newCar.model}
                  onChange={(e) => setNewCar((prev: Partial<Car>) => ({ ...prev, model: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                />
                {validationErrors.find(err => err.field === 'model') && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.find(err => err.field === 'model')?.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="year" className="block text-sm font-medium mb-1">Year</label>
                <input
                  type="number"
                  id="year"
                  value={newCar.year}
                  onChange={(e) => setNewCar((prev: Partial<Car>) => ({ ...prev, year: Number(e.target.value) }))}
                  className="w-full p-2 border rounded"
                  min={1900}
                  max={CURRENT_YEAR + 1}
                  required
                />
                {validationErrors.find(err => err.field === 'year') && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.find(err => err.field === 'year')?.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="plate_number" className="block text-sm font-medium mb-1">Plate Number</label>
                <input
                  type="text"
                  id="plate_number"
                  value={newCar.plate_number}
                  onChange={(e) => setNewCar((prev: Partial<Car>) => ({ ...prev, plate_number: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                />
                {validationErrors.find(err => err.field === 'plate_number') && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.find(err => err.field === 'plate_number')?.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="vin" className="block text-sm font-medium mb-1">VIN</label>
                <input
                  type="text"
                  id="vin"
                  value={newCar.vin}
                  onChange={(e) => setNewCar((prev: Partial<Car>) => ({ ...prev, vin: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label htmlFor="mileage" className="block text-sm font-medium mb-1">Mileage</label>
                <input
                  type="number"
                  id="mileage"
                  value={newCar.mileage}
                  onChange={(e) => setNewCar((prev: Partial<Car>) => ({ ...prev, mileage: Number(e.target.value) }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label htmlFor="image" className="block text-sm font-medium mb-1">Car Image</label>
                <input
                  type="file"
                  id="image"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const fileErrors = validateImageFile(file);
                      if (fileErrors.length === 0) {
                        setSelectedImage(file);
                      } else {
                        setValidationErrors(fileErrors);
                      }
                    }
                  }}
                  className="w-full p-2 border rounded"
                />
                {validationErrors.find(err => err.field === 'image') && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.find(err => err.field === 'image')?.message}
                  </p>
                )}
                {selectedImage && (
                  <p className="text-sm text-green-600 mt-1">
                    {selectedImage.name} selected
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
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
                      user_id: user?.id,
                      image_url: ''
                    });
                    setSelectedImage(null);
                    setValidationErrors([]);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition-colors"
                >
                  {isAddingCar ? 'Add Car' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Car List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <CarProfileView
            key={car.id}
            car={car}
            onEdit={() => {
              setIsEditingCar(true);
              setSelectedCar(car);
              setNewCar(car);
            }}
            onDelete={() => handleDeleteCar(car.id)}
          />
        ))}
      </div>
    </div>
  );
}
