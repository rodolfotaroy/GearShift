import { Link, useLocation } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import {
  HomeIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  DocumentIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  MoonIcon,
  SunIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import type { ComponentType } from 'react';
import { useState, useEffect, useCallback } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Cars', href: '/cars', icon: UserIcon },
  { name: 'Maintenance', href: '/maintenance', icon: WrenchScrewdriverIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Expenses', href: '/expenses', icon: CreditCardIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Documents', href: '/documents', icon: DocumentIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className={`min-h-screen bg-${theme === 'dark' ? 'gray-900' : 'neutral-50'} transition-colors duration-300`}>
      <Disclosure as="nav" className={`bg-${theme === 'dark' ? 'gray-800' : 'white'} shadow-md ${theme === 'dark' ? 'dark:shadow-dark-lg' : ''}`}>
        {({ open }: { open: boolean }) => (
          <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <img
                      className="block lg:hidden h-8 w-auto"
                      src="/logo.png"
                      alt="GearShift"
                    />
                    <img
                      className="hidden lg:block h-8 w-auto"
                      src="/logo.png"
                      alt="GearShift"
                    />
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          location.pathname === item.href
                            ? 'border-primary-500 text-gray-900 dark:text-white font-semibold'
                            : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors duration-200`}
                      >
                        <item.icon className={`h-5 w-5 mr-2 flex-shrink-0 ${
                          location.pathname === item.href 
                            ? 'text-primary-500' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`} />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    {theme === 'dark' ? (
                      <SunIcon className="h-6 w-6 text-yellow-400 hover:text-yellow-300" /> 
                    ) : (
                      <MoonIcon className="h-6 w-6 text-gray-600 hover:text-gray-800" />
                    )}
                  </button>
                  {/* Mobile menu button */}
                  <div className="sm:hidden -mr-2 flex items-center">
                    <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
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
            </div>

            {/* Mobile menu panel */}
            <Disclosure.Panel className="sm:hidden">
              <div className="pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-800 dark:hover:text-white'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${
                        location.pathname === item.href 
                          ? 'text-primary-500' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                      {item.name}
                    </div>
                  </Link>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <main className="py-10">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
          {children}
        </div>
      </main>
    </div>
  );
}
