import { Button } from './Button';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { EVENT_TYPES } from '../../types';

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null;

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: any) => void;
  event: {
    id?: string;
    car_id: string;
    title: string;
    description: string;
    event_type: string;
    start_date: string;
    end_date?: string;
    status: string;
    recurrence?: RecurrenceType;
    recurrence_interval?: number;
    recurrence_end_date?: string;
    reminder_days?: string[];
  };
  setEvent: (event: any) => void;
  cars: any[];
  mode: 'add' | 'edit';
}

const RECURRENCE_TYPES = {
  none: 'No Recurrence',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly'
} as const;

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  event,
  setEvent,
  cars,
  mode
}: EventModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(event);
  };

  const handleRecurrenceChange = (value: RecurrenceType) => {
    setEvent({ ...event, recurrence: value });
  };

  const handleReminderDaysChange = (days: string[]) => {
    setEvent({ ...event, reminder_days: days });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={onClose}>
        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="car" className="block text-sm font-medium text-gray-700">
                      Car
                    </label>
                    <select
                      id="car"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={event.car_id}
                      onChange={e => setEvent({ ...event, car_id: e.target.value })}
                    >
                      <option value="">Select a car</option>
                      {cars.map(car => (
                        <option key={car.id} value={car.id}>
                          {car.make} {car.model} ({car.year})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Event Type
                    </label>
                    <select
                      id="type"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={event.event_type}
                      onChange={e => setEvent({ ...event, event_type: e.target.value })}
                    >
                      <option value="">Select type</option>
                      {Object.entries(EVENT_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={event.title}
                      onChange={e => setEvent({ ...event, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={event.description}
                      onChange={e => setEvent({ ...event, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      id="start_date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={event.start_date}
                      onChange={e => setEvent({ ...event, start_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700">
                      Recurrence
                    </label>
                    <select
                      id="recurrence"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={event.recurrence || 'none'}
                      onChange={e => handleRecurrenceChange(e.target.value as RecurrenceType)}
                    >
                      {Object.entries(RECURRENCE_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {event.recurrence && event.recurrence !== 'none' && (
                    <>
                      <div>
                        <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
                          Repeat Every
                        </label>
                        <input
                          type="number"
                          id="interval"
                          min="1"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={event.recurrence_interval || 1}
                          onChange={e => setEvent({ ...event, recurrence_interval: parseInt(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                          End Date
                        </label>
                        <input
                          type="date"
                          id="end_date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={event.recurrence_end_date || ''}
                          onChange={e => setEvent({ ...event, recurrence_end_date: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="notifications" className="block text-sm font-medium text-gray-700">
                      Reminders
                    </label>
                    <select
                      id="notifications"
                      multiple
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={event.reminder_days || []}
                      onChange={e => handleReminderDaysChange(Array.from(e.target.selectedOptions, option => option.value))}
                    >
                      <option value="1">1 day before</option>
                      <option value="3">3 days before</option>
                      <option value="7">1 week before</option>
                      <option value="14">2 weeks before</option>
                      <option value="30">1 month before</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    variant="primary"
                  >
                    {mode === 'add' ? 'Create Event' : 'Update Event'}
                  </button>
                  <button
                    type="button"
                    variant="default"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

