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
  car_id: string;
  title: string;
  description: string;
  event_type: 'maintenance';
  start_date: string;
  status: 'scheduled' | 'pending' | 'completed';
  recurrence_type: 'none';
  mileage_due: number;
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

export default function Maintenance() {
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
    title: '',
    description: '',
    event_type: 'maintenance',
    start_date: DateTime.now().plus({ months: 1 }).toISODate() || '',
    status: 'scheduled',
    recurrence_type: 'none',
    mileage_due: 0
  });
  const [newService, setNewService] = useState<ServiceHistory>({
    car_id: '',
    service_type: SERVICE_TYPES[0],
    service_date: DateTime.now().toISODate() || '',
    mileage: 0,
    cost: 0,
    description: ''
  });

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
    async function fetchMaintenanceData() {
      if (!selectedCar) {
        console.log('No selected car, skipping maintenance data fetch');
        return;
      }

      console.log('Fetching maintenance data for car:', {
        carId: selectedCar.id,
        carDetails: selectedCar
      });

      try {
        const [scheduleData, historyData] = await Promise.all([
          supabaseClient
            .from('maintenance_events')
            .select('*')
            .eq('car_id', selectedCar.id)
            .order('date', { ascending: false }),
          
          supabaseClient
            .from('service_history')
            .select('*')
            .eq('car_id', selectedCar.id)
            .order('service_date', { ascending: false })
        ]);

        console.log('Maintenance Schedule Data:', {
          data: scheduleData.data,
          error: scheduleData.error
        });
        console.log('Service History Data:', {
          data: historyData.data,
          error: historyData.error
        });

        if (scheduleData.error) {
          console.error('Error fetching maintenance schedule:', scheduleData.error);
        }
        if (historyData.error) {
          console.error('Error fetching service history:', historyData.error);
        }

        // Update state only if no errors
        if (!scheduleData.error) {
          setSchedules(
            scheduleData.data || []
          );
        }

        if (!historyData.error) {
          setHistory(
            historyData.data || []
          );
        }
      } catch (error) {
        console.error('Error in fetchMaintenanceData:', error);
      }
    }

    // Trigger maintenance data fetch whenever selectedCar changes
    fetchMaintenanceData();
  }, [selectedCar, supabaseClient]);

  const handleNewScheduleChange = (field: keyof typeof newSchedule, value: string | number) => {
    setNewSchedule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  async function addMaintenanceSchedule() {
    if (!selectedCar) return;

    console.log('Adding maintenance schedule:', {
      selectedCar,
      newSchedule,
      user
    });

    // Validate required fields
    if (!user?.id) {
      console.error('No authenticated user found');
      return;
    }

    if (!selectedCar.id) {
      console.error('No car selected');
      return;
    }

    const scheduleToAdd = {
      user_id: user.id,
      car_id: selectedCar.id,
      title: newSchedule.title || 'Maintenance Event',
      description: newSchedule.description,
      event_type: newSchedule.event_type,
      start_date: newSchedule.start_date,
      status: newSchedule.status,
      recurrence_type: newSchedule.recurrence_type,
    };

    console.log('Formatted Schedule to add:', scheduleToAdd);

    try {
      const { data, error } = await supabaseClient
        .from('maintenance_events')
        .insert(scheduleToAdd)
        .select();

      // Log full error details
      if (error) {
        console.error('Detailed Supabase Error:', {
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message,
          fullError: error
        });

        // Additional debugging for potential type mismatches
        Object.keys(scheduleToAdd).forEach(key => {
          console.log(`Type of ${key}:`, typeof scheduleToAdd[key as keyof typeof scheduleToAdd]);
        });

        return;
      }

      if (data) {
        console.log('Maintenance schedule added:', data);
        setSchedules([...schedules, data[0]]);
        setShowAddScheduleModal(false);
        
        // Reset to default state
        setNewSchedule({
          title: '',
          description: '',
          event_type: 'maintenance',
          start_date: DateTime.now().plus({ months: 1 }).toISODate() || '',
          status: 'scheduled',
          recurrence_type: 'none',
          mileage_due: 0
        });
      }
    } catch (catchError) {
      console.error('Unexpected error adding maintenance schedule:', catchError);
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
          schedule.status !== 'Completed'
      );

      if (relatedSchedule) {
        await supabaseClient
          .from('maintenance_events')
          .update({ status: 'Completed' })
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
                      schedule.status === 'Overdue' 
                        ? 'bg-red-50 border-l-4 border-red-500' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{schedule.title}</p>
                        <p className="text-sm text-gray-600">
                          Due: {DateTime.fromISO(schedule.start_date).toLocaleString(DateTime.DATE_MED)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Mileage: {schedule.mileage_due} miles
                        </p>
                      </div>
                      <span 
                        className={`px-2 py-1 rounded-full text-xs ${
                          schedule.status === 'Overdue' 
                            ? 'bg-red-200 text-red-800' 
                            : schedule.status === 'Completed'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}
                      >
                        {schedule.status}
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
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-semibold mb-4">Add Maintenance Schedule</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                addMaintenanceSchedule();
              }}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newSchedule.title}
                    onChange={(e) => handleNewScheduleChange('title', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newSchedule.description}
                    onChange={(e) => handleNewScheduleChange('description', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    value={newSchedule.start_date}
                    onChange={(e) => handleNewScheduleChange('start_date', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mileage-due" className="block text-sm font-medium text-gray-700">
                    Mileage Due
                  </label>
                  <input
                    type="number"
                    id="mileage-due"
                    value={newSchedule.mileage_due}
                    onChange={(e) => handleNewScheduleChange('mileage_due', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button"
                    onClick={() => setShowAddScheduleModal(false)}
                    variant="default"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    
                  >
                    Add Schedule
                  </Button>
                </div>
              </form>
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
