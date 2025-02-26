import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Car Profiles', href: '/cars' },
  { name: 'Calendar', href: '/calendar' },
  { name: 'Expenses', href: '/expenses' },
  { name: 'Analytics', href: '/analytics' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { signOut, user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Disclosure as="nav" className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-20 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-2xl font-bold tracking-tight">
                      GearShift
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-6">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`${
                            location.pathname === item.href
                              ? 'bg-gray-800 text-white border-b-2 border-indigo-400'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          } px-5 py-6 text-sm font-medium transition-all duration-150 ease-in-out`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center space-x-4">
                    <div className="text-gray-300 text-sm">
                      {user?.email}
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="text-gray-300 hover:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ease-in-out border border-gray-700 hover:border-gray-600"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
                <div className="-mr-2 flex md:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-150 ease-in-out">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-gray-800 text-white border-l-4 border-indigo-400'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    } block px-3 py-4 text-base font-medium transition-all duration-150 ease-in-out`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="px-3 py-4 border-t border-gray-800">
                  <div className="text-gray-300 text-sm mb-2">
                    {user?.email}
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-300 hover:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ease-in-out border border-gray-700 hover:border-gray-600 w-full text-left"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 backdrop-blur-lg bg-opacity-90">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
