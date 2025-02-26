import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { DateTime } from 'luxon';
import { EVENT_TYPES, RECURRENCE_TYPES } from '../../constants/calendar';
import type { Car, MaintenanceEvent } from '../../types/calendar';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Partial<MaintenanceEvent>) => Promise<void>;
  event: Partial<MaintenanceEvent>;
  setEvent: (event: Partial<MaintenanceEvent>) => void;
  cars: Car[];
  mode: 'add' | 'edit';
}

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  event,
  setEvent,
  cars,
  mode,
}: EventModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(event);
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="car" className="block text-sm font-medium text-gray-700">
                    Car
                  </label>
                  <select
                    id="car"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={event.car_id}
                    onChange={e => setEvent({ ...event, car_id: Number(e.target.value) })}
                    required
                  >
                    <option value="">Select a car</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.make} {car.model}
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
                    required
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Event Type
                  </label>
                  <select
                    id="type"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={event.event_type}
                    onChange={e => setEvent({ ...event, event_type: e.target.value as any })}
                    required
                  >
                    {Object.entries(EVENT_TYPES).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={event.start_date}
                    onChange={e => setEvent({ ...event, start_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={event.end_date || ''}
                    onChange={e => setEvent({ ...event, end_date: e.target.value })}
                    min={event.start_date}
                  />
                </div>

                <div>
                  <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700">
                    Recurrence
                  </label>
                  <select
                    id="recurrence"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={event.recurrence_type || 'none'}
                    onChange={e => setEvent({ ...event, recurrence_type: e.target.value })}
                  >
                    {Object.entries(RECURRENCE_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {event.recurrence_type && event.recurrence_type !== 'none' && (
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
                        onChange={e => setEvent({ ...event, recurrence_interval: Number(e.target.value) })}
                      />
                    </div>

                    <div>
                      <label htmlFor="recurrence-end" className="block text-sm font-medium text-gray-700">
                        Recurrence End Date
                      </label>
                      <input
                        type="date"
                        id="recurrence-end"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={event.recurrence_end_date || ''}
                        onChange={e => setEvent({ ...event, recurrence_end_date: e.target.value })}
                        min={event.start_date}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="notifications" className="block text-sm font-medium text-gray-700">
                    Notify Before (Days)
                  </label>
                  <select
                    id="notifications"
                    multiple
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={event.notification_days_before || [1, 7]}
                    onChange={e => {
                      const values = Array.from(e.target.selectedOptions, option => Number(option.value));
                      setEvent({ ...event, notification_days_before: values });
                    }}
                  >
                    <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="7">1 week</option>
                    <option value="14">2 weeks</option>
                    <option value="30">1 month</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={event.description || ''}
                    onChange={e => setEvent({ ...event, description: e.target.value })}
                  />
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                  >
                    {mode === 'add' ? 'Add Event' : 'Update Event'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
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
