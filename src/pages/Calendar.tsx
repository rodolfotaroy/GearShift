import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { DateTime } from 'luxon';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Bars4Icon,
  CalendarIcon,
  FunnelIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { EVENT_TYPES, EVENT_STATUS } from '../constants/calendar';
import EventModal from '../components/calendar/EventModal';
import ListView from '../components/calendar/ListView';
import type { MaintenanceEvent, Car } from '../types/calendar';
import { Switch } from '@headlessui/react';

export default function Calendar() {
  const supabase = useSupabase();
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const [selectedDate, setSelectedDate] = useState<DateTime | null>(null);
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<MaintenanceEvent> | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCarFilter, setSelectedCarFilter] = useState<number | undefined>();
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch cars
      const { data: carsData } = await supabase
        .from('cars')
        .select('id, make, model')
        .order('created_at', { ascending: false });

      if (carsData) {
        setCars(carsData);
      }

      // Fetch events for the current month
      const startOfMonth = currentDate.startOf('month').toISODate();
      const endOfMonth = currentDate.endOf('month').toISODate();

      const { data: eventsData } = await supabase
        .from('maintenance_events')
        .select('*')
        .gte('start_date', startOfMonth)
        .lte('start_date', endOfMonth)
        .order('start_date', { ascending: true });

      if (eventsData) {
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEvent(eventData: Partial<MaintenanceEvent>) {
    try {
      const { data, error } = await supabase
        .from('maintenance_events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      setEvents([...events, data]);
      setIsAddingEvent(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  }

  async function handleUpdateEvent(eventData: Partial<MaintenanceEvent>) {
    if (!selectedEvent?.id) return;

    try {
      const { data, error } = await supabase
        .from('maintenance_events')
        .update(eventData)
        .eq('id', selectedEvent.id)
        .select()
        .single();

      if (error) throw error;

      setEvents(events.map(event => event.id === selectedEvent.id ? data : event));
      setIsEditingEvent(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  }

  async function handleDeleteEvent(eventId: number) {
    try {
      const { error } = await supabase
        .from('maintenance_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }

  async function handleUpdateEventStatus(eventId: number, status: 'completed' | 'cancelled') {
    try {
      const { data, error } = await supabase
        .from('maintenance_events')
        .update({ status })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      setEvents(events.map(event => event.id === eventId ? data : event));
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  }

  function generateCalendarDays() {
    const firstDay = currentDate.startOf('month');
    const lastDay = currentDate.endOf('month');
    const startPadding = firstDay.weekday % 7;
    const totalDays = lastDay.day;

    // Generate padding cells
    const paddingCells = Array.from({ length: startPadding }, (_, i) => (
      <div key={`padding-start-${i}`} className="h-24 bg-gray-50 border border-gray-200" />
    ));

    // Generate day cells
    const dayCells = Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const date = firstDay.set({ day });
      const isToday = date.hasSame(DateTime.now(), 'day');
      const isSelected = selectedDate?.hasSame(date, 'day');
      
      const dayEvents = events
        .filter(event => {
          if (selectedCarFilter && event.car_id !== selectedCarFilter) return false;
          if (selectedTypeFilter && event.event_type !== selectedTypeFilter) return false;
          return DateTime.fromISO(event.start_date).hasSame(date, 'day');
        });

      return (
        <div
          key={`day-${day}`}
          className={`h-24 p-2 border border-gray-200 overflow-y-auto ${
            isToday ? 'bg-blue-50' : 'bg-white'
          } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : ''}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1">
            {dayEvents.map(event => (
              <button
                key={event.id}
                className={`w-full text-left text-xs p-1 rounded truncate ${EVENT_TYPES[event.event_type].color}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setIsEditingEvent(true);
                }}
              >
                {event.title}
              </button>
            ))}
          </div>
        </div>
      );
    });

    return [...paddingCells, ...dayCells];
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance Calendar</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and manage your vehicle maintenance schedule
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
            Filters
          </button>
          <div className="flex items-center space-x-2 border border-gray-300 rounded-md p-1">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <Bars4Icon className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedEvent(null);
              setIsAddingEvent(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Event
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="car-filter" className="block text-sm font-medium text-gray-700">
                Filter by Car
              </label>
              <select
                id="car-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedCarFilter}
                onChange={e => setSelectedCarFilter(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">All Cars</option>
                {cars.map(car => (
                  <option key={car.id} value={car.id}>
                    {car.make} {car.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
                Filter by Type
              </label>
              <select
                id="type-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value || undefined)}
              >
                <option value="">All Types</option>
                {Object.entries(EVENT_TYPES).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <div className="p-4 flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => setCurrentDate(currentDate.minus({ months: 1 }))}
              className="p-2 rounded hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(currentDate.plus({ months: 1 }))}
              className="p-2 rounded hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {currentDate.toFormat('LLLL yyyy')}
          </h2>
          <button
            type="button"
            onClick={() => setCurrentDate(DateTime.now())}
            className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            Today
          </button>
        </div>

        {viewMode === 'calendar' ? (
          <div className="border-t border-gray-200">
            <div className="grid grid-cols-7 gap-px">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-8 px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {generateCalendarDays()}
            </div>
          </div>
        ) : (
          <ListView
            events={events}
            cars={cars}
            onEventClick={(event) => {
              setSelectedEvent(event);
              setIsEditingEvent(true);
            }}
            selectedCarId={selectedCarFilter}
            selectedEventType={selectedTypeFilter}
          />
        )}
      </div>

      {/* Event Modal */}
      {(isAddingEvent || isEditingEvent) && (
        <EventModal
          isOpen={true}
          onClose={() => {
            setIsAddingEvent(false);
            setIsEditingEvent(false);
            setSelectedEvent(null);
          }}
          onSubmit={isAddingEvent ? handleAddEvent : handleUpdateEvent}
          event={selectedEvent || {
            car_id: '',
            title: '',
            description: '',
            event_type: 'maintenance',
            start_date: selectedDate?.toISODate() || DateTime.now().toISODate(),
            status: 'scheduled',
          }}
          setEvent={setSelectedEvent}
          cars={cars}
          mode={isAddingEvent ? 'add' : 'edit'}
        />
      )}

      {/* Event Actions Modal */}
      {selectedEvent && !isEditingEvent && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedEvent.title}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${EVENT_TYPES[selectedEvent.event_type].color}`}>
                  {EVENT_TYPES[selectedEvent.event_type].label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${EVENT_STATUS[selectedEvent.status].color}`}>
                  {EVENT_STATUS[selectedEvent.status].label}
                </span>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Start Date: {DateTime.fromISO(selectedEvent.start_date).toFormat('DDD')}</p>
                {selectedEvent.end_date && (
                  <p>End Date: {DateTime.fromISO(selectedEvent.end_date).toFormat('DDD')}</p>
                )}
                {selectedEvent.description && (
                  <p className="mt-2">{selectedEvent.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedEvent.status === 'scheduled' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateEventStatus(selectedEvent.id, 'completed')}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateEventStatus(selectedEvent.id, 'cancelled')}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      <XMarkIcon className="-ml-1 mr-2 h-5 w-5" />
                      Cancel
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingEvent(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      handleDeleteEvent(selectedEvent.id);
                    }
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
