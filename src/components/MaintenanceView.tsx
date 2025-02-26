import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { MaintenanceSchedule, ServiceHistory, Car, SERVICE_TYPES } from '../types';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';

interface MaintenanceViewProps {
    car: Car;
}

export default function MaintenanceView({ car }: MaintenanceViewProps) {
    const supabase = useSupabase();
    const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
    const [history, setHistory] = useState<ServiceHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddSchedule, setShowAddSchedule] = useState(false);
    const [showAddService, setShowAddService] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        service_type: SERVICE_TYPES[0],
        due_date: DateTime.now().plus({ months: 1 }).toISODate(),
        mileage_due: car.mileage ? car.mileage + 5000 : 0,
        description: ''
    });
    const [newService, setNewService] = useState({
        service_type: SERVICE_TYPES[0],
        service_date: DateTime.now().toISODate(),
        mileage: car.mileage || 0,
        cost: 0,
        description: ''
    });
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check authentication status
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) {
                fetchMaintenanceData();
            }
        });
    }, [car.id]);

    async function fetchMaintenanceData() {
        setLoading(true);
        try {
            const [scheduleData, historyData] = await Promise.all([
                supabase
                    .from('maintenance_schedule')
                    .select('*')
                    .eq('car_id', car.id)
                    .order('due_date', { ascending: true }),
                supabase
                    .from('service_history')
                    .select('*')
                    .eq('car_id', car.id)
                    .order('service_date', { ascending: false })
            ]);

            if (scheduleData.error) throw scheduleData.error;
            if (historyData.error) throw historyData.error;

            setSchedules(scheduleData.data || []);
            setHistory(historyData.data || []);
        } catch (error) {
            console.error('Error fetching maintenance data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function addMaintenanceSchedule() {
        try {
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('maintenance_schedule')
                .insert([{
                    car_id: car.id,
                    user_id: user.id,
                    ...newSchedule
                }]);

            if (error) throw error;
            setShowAddSchedule(false);
            fetchMaintenanceData();
        } catch (error) {
            console.error('Error adding maintenance schedule:', error);
        }
    }

    async function addServiceHistory() {
        try {
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('service_history')
                .insert([{
                    car_id: car.id,
                    user_id: user.id,
                    ...newService
                }]);

            if (error) throw error;
            setShowAddService(false);
            fetchMaintenanceData();
        } catch (error) {
            console.error('Error adding service history:', error);
        }
    }

    async function completeMaintenanceItem(schedule: MaintenanceSchedule) {
        try {
            if (!user) throw new Error('User not authenticated');

            await Promise.all([
                // Mark the schedule as completed
                supabase
                    .from('maintenance_schedule')
                    .update({ is_completed: true })
                    .eq('id', schedule.id),
                
                // Add to service history
                supabase
                    .from('service_history')
                    .insert([{
                        car_id: car.id,
                        user_id: user.id,
                        service_type: schedule.service_type,
                        service_date: DateTime.now().toISODate(),
                        mileage: car.mileage,
                        description: schedule.description
                    }])
            ]);

            fetchMaintenanceData();
        } catch (error) {
            console.error('Error completing maintenance item:', error);
        }
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Please sign in to view maintenance information.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Maintenance Schedule Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Maintenance Schedule</h3>
                    <button
                        type="button"
                        onClick={() => setShowAddSchedule(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Schedule
                    </button>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {schedules.filter(s => !s.is_completed).map((schedule) => (
                            <li key={schedule.id}>
                                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            {DateTime.fromISO(schedule.due_date) < DateTime.now() ? (
                                                <XCircleIcon className="h-6 w-6 text-red-500" />
                                            ) : (
                                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {schedule.service_type}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Due: {DateTime.fromISO(schedule.due_date).toFormat('yyyy/MM/dd')}
                                                {schedule.mileage_due && ` or at ${schedule.mileage_due.toLocaleString()} km`}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => completeMaintenanceItem(schedule)}
                                        className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                    >
                                        Complete
                                    </button>
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
                    <button
                        type="button"
                        onClick={() => setShowAddService(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Service
                    </button>
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
                                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newSchedule.service_type}
                                    onChange={(e) => setNewSchedule({ ...newSchedule, service_type: e.target.value })}
                                >
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
                            <button
                                type="button"
                                onClick={() => setShowAddSchedule(false)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={addMaintenanceSchedule}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Add Schedule
                            </button>
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
                                    onChange={(e) => setNewService({ ...newService, service_type: e.target.value })}
                                >
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
                            <button
                                type="button"
                                onClick={() => setShowAddService(false)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={addServiceHistory}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Add Service
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
