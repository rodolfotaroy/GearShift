import { Button } from '../components';
import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { MaintenanceSchedule, ServiceHistory, Car, SERVICE_TYPES } from '../types';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';

interface MaintenanceViewProps {
    car?: Car | null;
}

export default function MaintenanceView({ car }: MaintenanceViewProps) {
    const { supabaseClient } = useSupabase();
    const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
    const [history, setHistory] = useState<ServiceHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddSchedule, setShowAddSchedule] = useState(false);
    const [showAddService, setShowAddService] = useState(false);
    const [newSchedule, setNewSchedule] = useState<{
        car_id?: number;
        service_type: string;
        due_date: string;
        mileage_due?: number | null;
        description: string;
    }>({
        car_id: 0,
        service_type: '',
        due_date: '',
        mileage_due: null,
        description: ''
    });
    const [newService, setNewService] = useState<ServiceHistory>({
        car_id: car?.id || 0,
        service_type: SERVICE_TYPES[0],
        service_date: DateTime.now().toISODate() || '',
        mileage: car?.mileage || 0,
        cost: 0,
        description: ''
    });
    const [cars, setCars] = useState<{
        id: number;
        make: string;
        model: string;
        plate_number: string;
    }[]>([]);

    useEffect(() => {
        if (!car) {
            setLoading(false);
            return;
        }

        async function fetchData() {
            try {
                await fetchCars();
                await fetchSchedules();
                await fetchServiceHistory();
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [car]);

    async function fetchCars() {
        try {
            const { data } = await supabaseClient
                .from('cars')
                .select('*');

            if (data) setCars(data);
        } catch {
            console.error('Error fetching cars');
        }
    }

    async function fetchSchedules() {
        if (!car) return;

        try {
            const { data, error } = await supabaseClient
                .from('maintenance_events')
                .select('*')
                .eq('car_id', car.id)
                .order('date', { ascending: true });

            if (error) {
                console.error('Error fetching maintenance events:', error);
                return;
            }

            if (data) setSchedules(data);
        } catch (error) {
            console.error('Error in fetchSchedules:', error);
        }
    }

    async function fetchServiceHistory() {
        if (!car) return;

        const { data } = await supabaseClient
            .from('service_history')
            .select('*')
            .eq('car_id', car.id);

        if (data) setHistory(data);
    }

    async function addMaintenanceSchedule() {
        const scheduleToAdd = {
            ...newSchedule,
            car_id: newSchedule.car_id || 0
        };

        try {
            const { data, error } = await supabaseClient
                .from('maintenance_events')
                .insert({
                    car_id: scheduleToAdd.car_id,
                    title: scheduleToAdd.service_type,
                    description: scheduleToAdd.description || '',
                    date: DateTime.fromISO(scheduleToAdd.due_date).toISO(),
                    completed: false
                })
                .select();

            if (error) {
                console.error('Error adding maintenance schedule:', error);
                return;
            }

            if (data) {
                setSchedules([...schedules, ...data]);
                setShowAddSchedule(false);
                setNewSchedule({
                    car_id: 0,
                    service_type: '',
                    due_date: '',
                    mileage_due: null,
                    description: ''
                });
            }
        } catch (error) {
            console.error('Error in addMaintenanceSchedule:', error);
        }
    }

    async function addServiceHistory() {
        if (!car) return;

        const serviceToAdd = {
            ...newService,
            car_id: car.id || 0
        };

        const { data } = await supabaseClient
            .from('service_history')
            .insert(serviceToAdd)
            .select();

        if (data) {
            setHistory([...history, data[0]]);
            setShowAddService(false);
            setNewService({
                car_id: car.id || 0,
                service_type: SERVICE_TYPES[0],
                service_date: DateTime.now().toISODate() || '',
                mileage: car.mileage || 0,
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
                    .from('maintenance_events')
                    .update({ status: 'Completed' })
                    .eq('id', relatedSchedule.id);
            }
        }
    }

    if (loading || !car) {
        return (
            <div className="flex items-center justify-center h-64">
                <div>Loading... or No Car Selected</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Maintenance Schedule Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Maintenance Schedule</h3>
                    <Button
                        type="button"
                        onClick={() => setShowAddSchedule(true)}
                        variant="default"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Schedule
                    </Button>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {schedules.filter(s => s.status !== 'Completed').map((schedule) => (
                            <li key={schedule.id}>
                                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            {DateTime.fromISO(schedule.date) < DateTime.now() ? (
                                                <XCircleIcon className="h-6 w-6 text-red-500" />
                                            ) : (
                                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {schedule.title}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Due: {DateTime.fromISO(schedule.date).toFormat('yyyy/MM/dd')}
                                                {schedule.mileage_due && ` or at ${schedule.mileage_due.toLocaleString()} km`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Service History Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Service History</h3>
                    <Button
                        type="button"
                        onClick={() => setShowAddService(true)}
                        variant="default"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Service
                    </Button>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {history.map((service) => (
                            <li key={service.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium text-indigo-600">
                                            {service.service_type}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {DateTime.fromISO(service.service_date).toFormat('yyyy/MM/dd')}
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <div className="text-sm text-gray-500">
                                                {service.description}
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            {service.mileage && `${service.mileage.toLocaleString()} km`}
                                            {service.cost && ` • ¥${service.cost.toLocaleString()}`}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Add Schedule Modal */}
            {showAddSchedule && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Maintenance Schedule</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Car</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newSchedule.car_id || 0}
                                    onChange={(e) => setNewSchedule({ 
                                        ...newSchedule, 
                                        car_id: e.target.value ? parseInt(e.target.value) : 0 
                                    })}
                                >
                                    <option value="0">Select a car</option>
                                    {cars.map((car) => (
                                        <option key={car.id} value={car.id}>
                                            {car.make} {car.model} ({car.plate_number})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newSchedule.service_type}
                                    onChange={(e) => setNewSchedule({ ...newSchedule, service_type: e.target.value as typeof SERVICE_TYPES[number] })}
                                >
                                    <option value="">Select a service type</option>
                                    {SERVICE_TYPES.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newSchedule.due_date}
                                    onChange={(e) => setNewSchedule({ ...newSchedule, due_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mileage Due</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newSchedule.mileage_due || ''}
                                    onChange={(e) => setNewSchedule({ 
                                        ...newSchedule, 
                                        mileage_due: e.target.value ? parseInt(e.target.value) : 0 
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newSchedule.description}
                                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button
                                type="button"
                                onClick={() => setShowAddSchedule(false)}
                                variant="default"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={addMaintenanceSchedule}
                                variant="default"
                            >
                                Add Schedule
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Service Modal */}
            {showAddService && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Service History</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newService.service_type}
                                    onChange={(e) => setNewService({ ...newService, service_type: e.target.value as typeof SERVICE_TYPES[number] })}
                                >
                                    <option value="">Select a service type</option>
                                    {SERVICE_TYPES.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Service Date</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newService.service_date}
                                    onChange={(e) => setNewService({ ...newService, service_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mileage</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newService.mileage || ''}
                                    onChange={(e) => setNewService({ 
                                        ...newService, 
                                        mileage: e.target.value ? parseInt(e.target.value) : 0 
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cost (¥)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newService.cost || ''}
                                    onChange={(e) => setNewService({ 
                                        ...newService, 
                                        cost: e.target.value ? parseInt(e.target.value) : 0 
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newService.description}
                                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button
                                type="button"
                                onClick={() => setShowAddService(false)}
                                variant="default"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={addServiceHistory}
                                variant="default"
                            >
                                Add Service
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
