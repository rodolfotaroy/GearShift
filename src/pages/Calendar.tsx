import { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
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
import { EVENT_TYPES, EVENT_STATUS, MaintenanceEvent } from '../types';
import EventModal from '../components/calendar/EventModal';

interface CalendarEvent {
  id: string;
  car_id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  status: string;
  recurrence?: string;
  reminder_days?: string[];
}

export default function Calendar() {
  const { supabase } = useSupabase();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cars, setCars] = useState<MaintenanceEvent[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [selectedCarFilter, setSelectedCarFilter] = useState<number | undefined>();
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

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
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data: eventsData } = await supabase
        .from('maintenance_events')
        .select('*')
        .gte('start_date', startOfMonth.toISOString())
        .lte('start_date', endOfMonth.toISOString())
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

  async function handleAddEvent(eventData: Partial<CalendarEvent>) {
    try {
      const { data, error } = await supabase
        .from('maintenance_events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      setEvents([...events, data]);
      setShowAddEvent(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  }

  async function handleUpdateEvent(eventData: Partial<CalendarEvent>) {
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
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // Generate padding cells
    const paddingCells = Array.from({ length: startPadding }, (_, i) => (
      <div key={`padding-start-${i}`} className="h-24 bg-gray-50 border border-gray-200" />
    ));

    // Generate day cells
    const dayCells = Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      
      const dayEvents = events
        .filter(event => {
          if (selectedCarFilter && event.car_id !== selectedCarFilter) return false;
          if (selectedTypeFilter && event.event_type !== selectedTypeFilter) return false;
          return new Date(event.start_date).toDateString() === date.toDateString();
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
              setShowAddEvent(true);
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
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
              className="p-2 rounded hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
              className="p-2 rounded hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            type="button"
            onClick={() => setSelectedDate(new Date())}
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
            }}
            selectedCarId={selectedCarFilter}
            selectedEventType={selectedTypeFilter}
          />
        )}
      </div>

      {/* Event Modal */}
      {(showAddEvent) && (
        <EventModal
          isOpen={true}
          onClose={() => {
            setShowAddEvent(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleAddEvent}
          event={{
            car_id: '',
            title: '',
            description: '',
            event_type: 'maintenance',
            start_date: selectedDate.toISOString(),
            status: 'scheduled',
          }}
          setEvent={setSelectedEvent}
          cars={cars}
          mode={'add'}
        />
      )}

      {/* Event Actions Modal */}
      {selectedEvent && (
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
                <p>Start Date: {new Date(selectedEvent.start_date).toLocaleString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                {selectedEvent.end_date && (
                  <p>End Date: {new Date(selectedEvent.end_date).toLocaleString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
                  onClick={() => {
                    setSelectedEvent(null);
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
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
