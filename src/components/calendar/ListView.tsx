import { Button } from '../components';
import { DateTime } from 'luxon';
import { EVENT_TYPES } from '../../constants/calendar';
import type { MaintenanceEvent, Car } from '../../types/calendar';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface ListViewProps {
  events: MaintenanceEvent[];
  cars: Car[];
  onEventClick: (event: MaintenanceEvent) => void;
  selectedCarId?: number;
  selectedEventType?: string;
}

export default function ListView({
  events,
  cars,
  onEventClick,
  selectedCarId,
  selectedEventType,
}: ListViewProps) {
  // Filter and sort events
  const filteredEvents = events
    .filter(event => {
      if (selectedCarId && event.car_id !== selectedCarId) return false;
      if (selectedEventType && event.event_type !== selectedEventType) return false;
      return true;
    })
    .sort((a, b) => DateTime.fromISO(a.start_date).toMillis() - DateTime.fromISO(b.start_date).toMillis());

  // Group events by month
  const groupedEvents = filteredEvents.reduce((groups: { [key: string]: MaintenanceEvent[] }, event) => {
    const month = DateTime.fromISO(event.start_date).toFormat('LLLL yyyy');
    if (!groups[month]) groups[month] = [];
    groups[month].push(event);
    return groups;
  }, {});

  // Get car details
  const getCar = (carId: number) => cars.find(car => car.id === carId);

  return (
    <div className="divide-y divide-gray-200">
      {Object.entries(groupedEvents).map(([month, monthEvents]) => (
        <div key={month} className="space-y-4 py-4">
          <h3 className="px-4 text-lg font-semibold text-gray-900">{month}</h3>
          <div className="space-y-2">
            {monthEvents.map(event => {
              const car = getCar(event.car_id);
              const eventType = EVENT_TYPES[event.event_type];
              const date = DateTime.fromISO(event.start_date);

              return (
                <button
                  key={event.id}
                  className="w-full px-4 py-3 flex items-center space-x-4 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-2xl font-bold">{date.toFormat('d')}</div>
                    <div className="text-sm text-gray-500">{date.toFormat('ccc')}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventType.color}`}>
                        {eventType.label}
                      </span>
                      {event.recurrence_type !== 'none' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Recurring
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    {car && (
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {car.make} {car.model}
                      </p>
                    )}
                  </div>
                  <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400" />
                </Button>
              );
            })}
          </div>
        </div>
      ))}
      {Object.keys(groupedEvents).length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No events found
        </div>
      )}
    </div>
  );
}


