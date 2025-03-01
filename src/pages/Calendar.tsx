import { Button } from '../components';
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
} from '@heroicons/react/24/outline';
import { EVENT_TYPES } from '../types';
import EventModal from '../components/calendar/EventModal';

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  user_id: string;
  plate_number: string;
}

interface CalendarEvent {
  id: number;
  car_id: number;
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
  const { supabaseClient } = useSupabase();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarFilter, setSelectedCarFilter] = useState<number>();
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>();

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  async function fetchData() {
    try {
      // Fetch cars
      const { data: carsData, error: carsError } = await supabaseClient
        .from('cars')
        .select('*');

      if (carsError) throw carsError;
      setCars(carsData || []);

      // Fetch events for the current month
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const { data: eventsData, error: eventsError } = await supabaseClient
        .from('maintenance_events')
        .select('*')
        .gte('start_date', startOfMonth.toISOString())
        .lte('start_date', endOfMonth.toISOString());

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function handleAddEvent(eventData: Partial<CalendarEvent>) {
    try {
      const { data, error } = await supabaseClient
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

  async function handleDeleteEvent(eventId: number) {
    try {
      const { error } = await supabaseClient
        .from('maintenance_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(e => e.id !== eventId));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }

  function generateCalendarDays() {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const paddingCells = Array.from({ length: startPadding }, (_, i) => (
      <div key={`padding-${i}`} className="bg-gray-50 p-2" />
    ));

    const dayCells = Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      
      const dayEvents = events.filter(event => {
        if (selectedCarFilter && event.car_id !== selectedCarFilter) return false;
        if (selectedTypeFilter && event.event_type !== selectedTypeFilter) return false;
        return new Date(event.start_date).toDateString() === date.toDateString();
      });

      return (
        <div
          key={`day-${day}`}
          className={`p-2 border ${
            isToday ? 'bg-blue-50' : isSelected ? 'bg-gray-100' : ''
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="font-semibold">{day}</div>
          {dayEvents.map(event => (
            <div
              key={event.id}
              className="mt-1 p-1 text-sm bg-blue-100 rounded cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
              }}
            >
              {event.title}
            </div>
          ))}
        </div>
      );
    });

    return [...paddingCells, ...dayCells];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={() => setShowAddEvent(true)}
            variant="primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Event
          </Button>

          <Button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            variant="default"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </Button>

          <Button
            type="button"
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            variant="default"
          >
            {viewMode === 'calendar' ? (
              <>
                <Bars4Icon className="h-5 w-5 mr-2" />
                List View
              </>
            ) : (
              <>
                <CalendarIcon className="h-5 w-5 mr-2" />
                Calendar View
              </>
            )}
          </Button>
        </div>

        <div>
          <Button
            type="button"
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
            className="p-2 rounded hover:bg-gray-100"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <span className="mx-4 text-lg font-semibold">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <Button
            type="button"
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
            className="p-2 rounded hover:bg-gray-100"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="car-filter" className="block text-sm font-medium text-gray-700">
                Filter by Car
              </label>
              <select
                id="car-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedCarFilter}
                onChange={e => setSelectedCarFilter(Number(e.target.value))}
              >
                <option value="">All Cars</option>
                {cars.map(car => (
                  <option key={car.id} value={car.id}>
                    {car.make} {car.model} ({car.year})
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
                onChange={e => setSelectedTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {Object.entries(EVENT_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-7 gap-px">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-semibold bg-gray-50">
                {day}
              </div>
            ))}
            {generateCalendarDays()}
          </div>
        ) : (
          <div className="divide-y">
            {events
              .filter(event => {
                if (selectedCarFilter && event.car_id !== selectedCarFilter) return false;
                if (selectedTypeFilter && event.event_type !== selectedTypeFilter) return false;
                return true;
              })
              .map(event => (
                <div
                  key={event.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showAddEvent && (
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
            event_type: '',
            start_date: new Date().toISOString().slice(0, 16),
            status: 'scheduled'
          }}
          setEvent={setSelectedEvent}
          cars={cars}
          mode="add"
        />
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedEvent.title}</h3>
            
            <div className="text-sm text-gray-500">
              <p>Start Date: {new Date(selectedEvent.start_date).toLocaleString()}</p>
              {selectedEvent.end_date && (
                <p>End Date: {new Date(selectedEvent.end_date).toLocaleString()}</p>
              )}
              {selectedEvent.description && (
                <p className="mt-2">{selectedEvent.description}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                variant="danger"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </Button>
              <Button
                type="button"
                onClick={() => setSelectedEvent(null)}
                variant="default"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
