import { Button } from '../components';
import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Database } from '../types/database.types';
import { Car, SERVICE_TYPES } from '../types';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';

type MaintenanceEvent = Database['public']['Tables']['maintenance_events']['Row'];

interface ServiceHistoryRow {
    id?: string;
    car_id: string;
    service_type: string;
    service_date: string;
    mileage: number;
    cost: number;
    description?: string;
    user_id?: string;
}

interface MaintenanceViewProps {
    car?: Car | null;
}

export default function MaintenanceView({ car }: MaintenanceViewProps) {
    const { supabaseClient } = useSupabase();
    const [schedules, setSchedules] = useState<MaintenanceEvent[]>([]);
    const [history, setHistory] = useState<ServiceHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddSchedule, setShowAddSchedule] = useState(false);
    const [showAddService, setShowAddService] = useState(false);
    const [newSchedule, setNewSchedule] = useState<{
        event_type: string;
        notes?: string;
        date: string;
    }>({
        event_type: SERVICE_TYPES[0],
        notes: '',
        date: DateTime.now().toISO() || ''
    });
    const [newService, setNewService] = useState<ServiceHistoryRow>({
        car_id: car?.id ? String(car.id) : '',
        service_type: SERVICE_TYPES[0],
        service_date: DateTime.now().toISODate() || '',
        mileage: 0,
        cost: 0,
        description: '',
        user_id: car?.user_id || ''
    });
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    useEffect(() => {
        if (selectedStatus) {
            console.log('Selected status:', selectedStatus);
        }
    }, [selectedStatus]);

    useEffect(() => {
        if (!car) {
            setLoading(false);
            return;
        }

        async function fetchData() {
            try {
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

    useEffect(() => {
        fetchSchedules();
    }, [car]);

    async function fetchServiceHistory() {
        if (!car) return;

        const { data } = await supabaseClient
            .from('service_history')
            .select('*')
            .eq('car_id', car.id);

        if (data) setHistory(data);
    }

    async function addMaintenanceSchedule() {
        if (!car) return;

        const scheduleToAdd = {
            car_id: car.id,
            event_type: newSchedule.event_type,
            notes: newSchedule.notes,
            date: newSchedule.date,
            user_id: car.user_id || ''
        };

        try {
            const { data, error } = await supabaseClient
                .from('maintenance_events')
                .insert(scheduleToAdd)
                .select();

            if (error) {
                console.error('Error adding maintenance schedule:', error);
                return;
            }

            if (data) {
                setSchedules([...schedules, ...data]);
                setShowAddSchedule(false);
                setNewSchedule({
                    event_type: SERVICE_TYPES[0],
                    notes: '',
                    date: DateTime.now().toISO() || ''
                });
            }
        } catch (error) {
            console.error('Error in addMaintenanceSchedule:', error);
        }
    }

    const handleServiceAdd = async () => {
        if (!car) return;

        const serviceToAdd = {
          ...newService,
          car_id: car.id,
          event_type: 'maintenance' as const,
          user_id: car.user_id || ''
        };

        const { data } = await supabaseClient
          .from('service_history')
          .insert(serviceToAdd)
          .select();

        if (data) {
          setHistory([...history, data[0]]);
          setShowAddService(false);
          setNewService({
            car_id: car.id ? String(car.id) : '',
            service_type: SERVICE_TYPES[0],
            service_date: DateTime.now().toISODate() || '',
            mileage: 0,
            cost: 0,
            description: '',
            user_id: car.user_id || ''
          });

          const relatedSchedule = schedules.find(
            schedule => {
              const scheduleEventType = (schedule as any).event_type || 'maintenance';
              return scheduleEventType === serviceToAdd.event_type;
            }
          );

          if (relatedSchedule) {
            await supabaseClient
              .from('maintenance_events')
              .update({ completed: true })
              .eq('id', relatedSchedule.id);
          }
        }
    }

    const filteredSchedules = schedules.filter(schedule => {
        const scheduleDate = DateTime.fromISO(schedule.date);
        const today = DateTime.now();

        const isOverdue = scheduleDate < today && !schedule.completed;
        const isCompleted = schedule.completed;
        const isUpcoming = scheduleDate >= today && !schedule.completed;

        switch (selectedStatus) {
          case 'Overdue':
            return isOverdue;
          case 'Completed':
            return isCompleted;
          case 'Upcoming':
            return isUpcoming;
          default:
            return true;
        }
    });

    if (loading || !car) {
        return (
            <div className="flex items-center justify-center h-64">
                <div>Loading... or No Car Selected</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Maintenance Schedule</h2>
                <Button onClick={() => setShowAddSchedule(true)}>
                    Add Schedule
                </Button>
            </div>

            {showAddSchedule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Add Maintenance Schedule</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            addMaintenanceSchedule();
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Event Type
                                    </label>
                                    <select
                                        className="w-full p-2 border rounded dark:bg-gray-700"
                                        value={newSchedule.event_type}
                                        onChange={(e) => setNewSchedule({
                                            ...newSchedule,
                                            event_type: e.target.value
                                        })}
                                        required
                                    >
                                        <option value="">Select an event type</option>
                                        {SERVICE_TYPES.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={DateTime.fromISO(newSchedule.date).toFormat("yyyy-MM-dd'T'HH:mm")}
                                        onChange={(e) => setNewSchedule({
                                            ...newSchedule,
                                            date: DateTime.fromISO(e.target.value).toISO() || ''
                                        })}
                                        className="w-full p-2 border rounded dark:bg-gray-700"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={newSchedule.notes}
                                        onChange={(e) => setNewSchedule({
                                            ...newSchedule,
                                            notes: e.target.value
                                        })}
                                        className="w-full p-2 border rounded dark:bg-gray-700"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end space-x-2">
                                <Button onClick={() => setShowAddSchedule(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Add Schedule
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {filteredSchedules.map((schedule) => (
                    <div
                        key={schedule.id}
                        className="bg-white dark:bg-gray-800 shadow rounded-lg"
                    >
                        <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    {DateTime.fromISO(schedule.date) < DateTime.now() && !schedule.completed ? (
                                        <XCircleIcon className="h-6 w-6 text-red-500" />
                                    ) : (
                                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                    )}
                                </div>
                                <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {schedule.event_type}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Due: {DateTime.fromISO(schedule.date).toFormat('yyyy/MM/dd')}
                                    </div>
                                    {schedule.notes && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {schedule.notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

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
                                onClick={handleServiceAdd}
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
