import { useState, useEffect } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { useSupabase } from '../contexts/SupabaseContext';
import { Button } from '../components';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';

const SERVICE_TYPES = ['Oil Change', 'Tire Rotation', 'Brake Service', 'Engine Tune-up', 'Other'] as const;

interface MaintenanceSchedule {
  id?: number;
  car_id: number;
  service_type: typeof SERVICE_TYPES[number];
  due_date: string;
  mileage_due: number;
  description?: string;
  status: string;
}

interface ServiceHistory {
  id?: number;
  car_id: number;
  service_type: typeof SERVICE_TYPES[number];
  service_date: string;
  mileage: number;
  cost: number;
  description?: string;
}

export default function Maintenance() {
  const { supabaseClient, supabaseAuth } = useSupabase();
  const [user, setUser] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [history, setHistory] = useState<ServiceHistory[]>([]);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState<MaintenanceSchedule>({
    car_id: 0,
    service_type: SERVICE_TYPES[0],
    due_date: DateTime.now().plus({ months: 1 }).toISODate() || '',
    mileage_due: 0,
    description: '',
    status: 'Pending'
  });
  const [newService, setNewService] = useState<ServiceHistory>({
    car_id: 0,
    service_type: SERVICE_TYPES[0],
    service_date: DateTime.now().toISODate() || '',
    mileage: 0,
    cost: 0,
    description: ''
  });

  useEffect(() => {
    supabaseAuth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchUserCars();
      }
    });
  }, []);

  useEffect(() => {
    if (selectedCar) {
      fetchMaintenanceData();
    }
  }, [selectedCar]);

  async function fetchUserCars() {
    const { data } = await supabaseClient
      .from('cars')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setCars(data);
      if (data.length > 0) {
        setSelectedCar(data[0]);
      }
    }
  }

  async function fetchMaintenanceData() {
    try {
      const [scheduleData, historyData] = await Promise.all([
        supabaseClient
          .from('maintenance_schedule')
          .select('*')
          .eq('car_id', selectedCar.id)
          .order('due_date', { ascending: true }),
        supabaseClient
          .from('service_history')
          .select('*')
          .eq('car_id', selectedCar.id)
          .order('service_date', { ascending: false })
      ]);

      if (scheduleData.data) setSchedules(scheduleData.data);
      if (historyData.data) setHistory(historyData.data);
    } catch {
      console.error('Error fetching maintenance data');
    }
  }

  async function addMaintenanceSchedule() {
    const scheduleToAdd = {
      ...newSchedule,
      car_id: selectedCar.id
    };

    const { data } = await supabaseClient
      .from('maintenance_schedule')
      .insert(scheduleToAdd)
      .select();

    if (data) {
      setSchedules([...schedules, data[0]]);
      setShowAddScheduleModal(false);
      setNewSchedule({
        car_id: selectedCar.id,
        service_type: SERVICE_TYPES[0],
        due_date: DateTime.now().plus({ months: 1 }).toISODate() || '',
        mileage_due: 0,
        description: '',
        status: 'Pending'
      });
    }
  }

  async function addServiceHistory() {
    const serviceToAdd = {
      ...newService,
      car_id: selectedCar.id
    };

    const { data } = await supabaseClient
      .from('service_history')
      .insert(serviceToAdd)
      .select();

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
          schedule.service_type === serviceToAdd.service_type && 
          schedule.status !== 'Completed'
      );

      if (relatedSchedule) {
        await supabaseClient
          .from('maintenance_schedule')
          .update({ status: 'Completed' })
          .eq('id', relatedSchedule.id);
      }
    }
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <WrenchScrewdriverIcon className="h-8 w-8 mr-3 text-gray-600" /> 
          Maintenance Tracking
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
              const car = cars.find(c => c.id === parseInt(e.target.value));
              setSelectedCar(car);
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
                        <p className="font-medium">{schedule.service_type}</p>
                        <p className="text-sm text-gray-600">
                          Due: {DateTime.fromISO(schedule.due_date).toLocaleString(DateTime.DATE_MED)}
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
                  <label htmlFor="service-type" className="block text-sm font-medium text-gray-700">
                    Service Type
                  </label>
                  <select
                    id="service-type"
                    value={newSchedule.service_type}
                    onChange={(e) => setNewSchedule({
                      ...newSchedule, 
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
                  <label htmlFor="due-date" className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="due-date"
                    value={newSchedule.due_date}
                    onChange={(e) => setNewSchedule({
                      ...newSchedule, 
                      due_date: e.target.value
                    })}
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
                    onChange={(e) => setNewSchedule({
                      ...newSchedule, 
                      mileage_due: parseInt(e.target.value)
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
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({
                      ...newSchedule, 
                      description: e.target.value
                    })}
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


