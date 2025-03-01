import { useState, useEffect } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';

const SERVICE_TYPES = ['Oil Change', 'Tire Rotation', 'Brake Service', 'Engine Tune-up', 'Other'] as const;

interface MaintenanceSchedule {
  id: number;
  car_id: number;
  title: string;
  description?: string;
  date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceHistory {
  id?: number;
  car_id: string;
  service_type: typeof SERVICE_TYPES[number];
  service_date: string;
  mileage: number;
  cost: number;
  description?: string;
}

interface Car {
  id: string;
  year: number;
  make: string;
  model: string;
  user_id?: string;
}

const Maintenance: React.FC = () => {
  const { supabaseClient } = useSupabase();
  const { user, loading: authLoading } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [history, setHistory] = useState<ServiceHistory[]>([]);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSchedule, setNewSchedule] = useState<MaintenanceSchedule>({
    id: 0,
    car_id: selectedCar?.id ? Number(selectedCar.id) : 0,
    title: '',
    description: '',
    date: DateTime.now().plus({ months: 1 }).toISODate(),
    completed: false,
    created_at: DateTime.now().toISODate(),
    updated_at: DateTime.now().toISODate()
  });
  const [newService, setNewService] = useState<ServiceHistory>({
    car_id: '',
    service_type: SERVICE_TYPES[0],
    service_date: DateTime.now().toISODate() || '',
    mileage: 0,
    cost: 0,
    description: ''
  });

  const fetchMaintenanceSchedule = async (carId: string) => {
    if (!carId) {
      console.log('No car ID provided, skipping maintenance schedule fetch');
      return;
    }

    console.log('Fetching maintenance schedule for car:', {
      carId: carId
    });

    try {
      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .select('*')
        .eq('car_id', carId)
        .order('date', { ascending: false });

      console.log('Maintenance Schedule Data:', {
        data: data,
        error: error
      });

      if (error) {
        console.error('Error fetching maintenance schedule:', error);
      }

      // Update state only if no errors
      if (!error) {
        setSchedules(data || []);
      }
    } catch (error) {
      console.error('Error in fetchMaintenanceSchedule:', error);
    }
  };

  const fetchServiceHistory = async (carId: string) => {
    if (!carId) {
      console.log('No car ID provided, skipping service history fetch');
      return;
    }

    console.log('Fetching service history for car:', {
      carId: carId
    });

    try {
      const { data, error } = await supabaseClient
        .from('service_history')
        .select('*')
        .eq('car_id', carId)
        .order('service_date', { ascending: false });

      console.log('Service History Data:', {
        data: data,
        error: error
      });

      if (error) {
        console.error('Error fetching service history:', error);
      }

      // Update state only if no errors
      if (!error) {
        setHistory(data || []);
      }
    } catch (error) {
      console.error('Error in fetchServiceHistory:', error);
    }
  };

  useEffect(() => {
    console.log('Cars state updated:', {
      cars: cars,
      carsLength: cars.length,
      carIds: cars.map(car => car.id),
      selectedCar: selectedCar
    });
  }, [cars, selectedCar]);

  useEffect(() => {
    async function fetchUserAndCars() {
      setLoading(true);
      try {
        if (!user) {
          console.error('No authenticated user found');
          setCars([]);
          setSelectedCar(null);
          return;
        }

        // Fetch cars for the current user
        const { data, error } = await supabaseClient
          .from('cars')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Detailed car fetch error:', {
            code: error.code,
            message: error.message,
            details: error.details
          });
        }

        // Process successful query
        if (data && data.length > 0) {
          setCars(data);
          // Always set the first car if no car is selected or the current selected car is not in the list
          if (!selectedCar || !data.some(car => car.id === selectedCar.id)) {
            setSelectedCar(data[0]);
          }
        } else {
          // No cars found, attempt to create a default car
          try {
            const { data: newCarData, error: newCarError } = await supabaseClient
              .from('cars')
              .insert({
                user_id: user.id,
                make: 'Default Car',
                model: 'First Vehicle',
                year: new Date().getFullYear(),
                plate_number: 'DEFAULT'
              })
              .select();

            if (newCarError) {
              console.error('Error creating default car:', newCarError);
            } else if (newCarData && newCarData.length > 0) {
              setCars(newCarData);
              setSelectedCar(newCarData[0]);
            }
          } catch (createError) {
            console.error('Critical error creating default car:', createError);
          }
        }
      } catch (error) {
        console.error('Catastrophic error in car fetching process:', error);
        setCars([]);
        setSelectedCar(null);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchUserAndCars();
    }
  }, [user, authLoading, supabaseClient]);

  useEffect(() => {
    if (selectedCar) {
      fetchMaintenanceSchedule(selectedCar.id);
      fetchServiceHistory(selectedCar.id);
    }
  }, [selectedCar, supabaseClient]);

  const handleNewScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSchedule(prev => ({
      ...prev,
      [name]: name === 'car_id' ? Number(value) : value
    }));
  };

  async function addMaintenanceSchedule() {
    if (!selectedCar) return;

    const scheduleToAdd: MaintenanceSchedule = {
      id: 0,
      car_id: Number(selectedCar.id), // Convert to number
      title: newSchedule.title || 'Maintenance Event', 
      date: newSchedule.date || DateTime.now().plus({ months: 1 }).toISODate(),
      completed: false,
      created_at: DateTime.now().toISODate(),
      updated_at: DateTime.now().toISODate()
    };

    console.log('Adding maintenance schedule:', {
      selectedCar,
      newSchedule,
      user,
      scheduleToAdd
    });

    // Validate required fields
    if (!selectedCar.id) {
      console.error('No car selected');
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .insert(scheduleToAdd)
        .select('*');

      if (error) {
        console.error('Error adding maintenance schedule:', { 
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          scheduleToAdd 
        });
        return;
      }

      console.log('Maintenance schedule added successfully:', data);

      // Reset form and update local state
      setNewSchedule({
        id: 0,
        car_id: Number(selectedCar.id),
        title: '',
        date: DateTime.now().plus({ months: 1 }).toISODate(),
        completed: false,
        created_at: DateTime.now().toISODate(),
        updated_at: DateTime.now().toISODate()
      });
      setShowAddScheduleModal(false);

      // Refresh maintenance schedules
      if (selectedCar) {
        await fetchMaintenanceSchedule(selectedCar.id);
      }
    } catch (err) {
      console.error('Unexpected error adding maintenance schedule:', err);
    }
  }

  async function addServiceHistory() {
    if (!selectedCar) return;

    const serviceToAdd = {
      ...newService,
      car_id: selectedCar.id,
      user_id: user?.id
    };

    const { data, error } = await supabaseClient
      .from('service_history')
      .insert(serviceToAdd)
      .select();

    if (error) {
      console.error('Error adding service history:', error);
      return;
    }

    if (data) {
      setHistory([...history, data[0]]);
      setShowAddServiceModal(false);
      setNewService({
        car_id: selectedCar.id,
        service_type: SERVICE_TYPES[0],
        service_date: DateTime.now().toISODate() || '',
        mileage: 0,
        cost: 0,
        description: ''
      });

      // Update related maintenance schedule if exists
      const relatedSchedule = schedules.find(
        schedule => 
          schedule.title === serviceToAdd.service_type && 
          schedule.completed === false
      );

      if (relatedSchedule) {
        await supabaseClient
          .from('maintenance_events')
          .update({ completed: true })
          .eq('id', relatedSchedule.id);
      }
    }
  }

  // Enhanced car addition method with comprehensive error handling
  const handleAddCar = async () => {
    if (!user) {
      console.error('Cannot add car: No user authenticated');
      return;
    }

    try {
      let carData;
      const { data, error } = await supabaseClient
        .from('cars')
        .insert({
          user_id: user.id,
          make: 'Default Car',
          model: 'First Car',
          year: new Date().getFullYear()
        })
        .select();

      if (error) {
        console.error('Error adding car:', error);
        
        // Attempt alternative insertion method
        const fallbackInsert = await supabaseClient
          .from('cars')
          .insert({
            make: 'Default Car',
            model: 'First Car',
            year: new Date().getFullYear()
          })
          .select();

        if (fallbackInsert.error) {
          console.error('Fallback car insertion failed:', fallbackInsert.error);
          return;
        }

        carData = fallbackInsert.data;
      } else {
        carData = data;
      }

      if (carData && carData.length > 0) {
        setCars([...cars, carData[0]]);
        setSelectedCar(carData[0]);
      }
    } catch (error) {
      console.error('Unexpected error adding car:', error);
    }
  };

  // Render loading state
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Render no user state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view maintenance information.</p>
      </div>
    );
  }

  // Render no cars state
  if (cars.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 mr-4">Please add a car to track maintenance.</p>
        <Button onClick={handleAddCar}>Add Car</Button>
      </div>
    );
  }

  // Render no selected car state
  if (!selectedCar) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 mr-4">Please select a car to track maintenance.</p>
        <Button onClick={handleAddCar}>Add Car</Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <WrenchScrewdriverIcon className="h-8 w-8 mr-3 text-gray-600" />
          Maintenance
        </h1>

        {/* Car Selection */}
        <div className="mb-6">
          <label htmlFor="car-select" className="block text-sm font-medium text-gray-700">
            Select Car
          </label>
          <select
            id="car-select"
            value={selectedCar?.id || ''}
            onChange={(e) => {
              console.log('Car selection changed:', {
                selectedValue: e.target.value,
                valueType: typeof e.target.value,
                availableCars: cars,
                availableCarIds: cars.map(c => c.id),
                availableCarIdTypes: cars.map(c => typeof c.id)
              });

              // Convert the selected value to the same type as car.id
              const selectedCarId = e.target.value;
              const car = cars.find(c => String(c.id) === String(selectedCarId));
              
              console.log('Car selection result:', {
                selectedCarId,
                foundCar: car
              });
              
              if (car) {
                console.log('Setting selected car:', car);
                setSelectedCar(car);
              } else {
                console.error('No car found for ID:', selectedCarId);
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.year} {car.make} {car.model}
              </option>
            ))}
          </select>
        </div>

        {/* Maintenance Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Maintenance */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <CalendarIcon className="h-6 w-6 mr-2 text-gray-600" />
                Upcoming Maintenance
              </h2>
              <Button 
                onClick={() => setShowAddScheduleModal(true)}
                variant="primary"
                className="p-2 rounded-full"
              >
                <PlusIcon className="h-5 w-5" />
              </Button>
            </div>

            {schedules.length === 0 ? (
              <p className="text-gray-500 text-center">No upcoming maintenance</p>
            ) : (
              <ul className="space-y-2">
                {schedules.map(schedule => (
                  <li 
                    key={schedule.id} 
                    className={`p-3 rounded-md ${
                      schedule.completed === false 
                        ? 'bg-yellow-50 border-l-4 border-yellow-500' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{schedule.title}</p>
                        <p className="text-sm text-gray-600">
                          Due: {DateTime.fromISO(schedule.date).toLocaleString(DateTime.DATE_MED)}
                        </p>
                      </div>
                      <span 
                        className={`px-2 py-1 rounded-full text-xs ${
                          schedule.completed === false 
                            ? 'bg-yellow-200 text-yellow-800' 
                            : 'bg-green-200 text-green-800'
                        }`}
                      >
                        {schedule.completed ? 'Completed' : 'Scheduled'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Service History */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-gray-600" />
                Service History
              </h2>
              <Button 
                onClick={() => setShowAddServiceModal(true)}
              >
                <PlusIcon className="h-5 w-5" />
              </Button>
            </div>

            {history.length === 0 ? (
              <p className="text-gray-500 text-center">No service history</p>
            ) : (
              <ul className="space-y-2">
                {history.map(service => (
                  <li 
                    key={service.id} 
                    className="p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{service.service_type}</p>
                        <p className="text-sm text-gray-600">
                          Date: {DateTime.fromISO(service.service_date).toLocaleString(DateTime.DATE_MED)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Mileage: {service.mileage} miles
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        ${service.cost.toFixed(2)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Add Maintenance Schedule Modal */}
        {showAddScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h2 className="text-2xl font-bold mb-4">Add Maintenance Schedule</h2>
              
              {/* Title Input */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newSchedule.title}
                  onChange={handleNewScheduleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="Enter maintenance event title"
                />
              </div>

              {/* Date Input */}
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={newSchedule.date}
                  onChange={handleNewScheduleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowAddScheduleModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={addMaintenanceSchedule}
                >
                  Add Schedule
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Service History Modal */}
        {showAddServiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-semibold mb-4">Add Service History</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                addServiceHistory();
              }}>
                <div className="mb-4">
                  <label htmlFor="service-type" className="block text-sm font-medium text-gray-700">
                    Service Type
                  </label>
                  <select
                    id="service-type"
                    value={newService.service_type}
                    onChange={(e) => setNewService({
                      ...newService, 
                      service_type: e.target.value as typeof SERVICE_TYPES[number]
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    {SERVICE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="service-date" className="block text-sm font-medium text-gray-700">
                    Service Date
                  </label>
                  <input
                    type="date"
                    id="service-date"
                    value={newService.service_date}
                    onChange={(e) => setNewService({
                      ...newService, 
                      service_date: e.target.value
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
                    Mileage
                  </label>
                  <input
                    type="number"
                    id="mileage"
                    value={newService.mileage}
                    onChange={(e) => setNewService({
                      ...newService, 
                      mileage: parseInt(e.target.value)
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                    Cost
                  </label>
                  <input
                    type="number"
                    id="cost"
                    step="0.01"
                    value={newService.cost}
                    onChange={(e) => setNewService({
                      ...newService, 
                      cost: parseFloat(e.target.value)
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService({
                      ...newService, 
                      description: e.target.value
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button"
                    onClick={() => setShowAddServiceModal(false)}
                    variant="default"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    
                  >
                    Add Service
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Maintenance;
