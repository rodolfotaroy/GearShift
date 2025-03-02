import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Disclosure } from '@headlessui/react';
import {
  HomeIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  DocumentIcon,
  UserIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Cars', href: '/cars', icon: UserIcon },
  { name: 'Maintenance', href: '/maintenance', icon: null },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Expenses', href: '/expenses', icon: null },
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
    <div className={`min-h-screen bg-${theme === 'dark' ? 'dark-background' : 'neutral-50'} transition-colors duration-300`}>
      <Disclosure as="nav" className={`bg-${theme === 'dark' ? 'dark-surface' : 'white'} shadow-md ${theme === 'dark' ? 'dark:shadow-dark-lg' : ''}`}>
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
                            ? 'border-primary-500 text-neutral-900 dark:text-neutral-100'
                            : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-dark-border hover:text-neutral-800 dark:hover:text-neutral-200'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap`}
                      >
                        {item.icon && <item.icon className={`h-5 w-5 mr-2 flex-shrink-0 ${
                          location.pathname === item.href 
                            ? 'text-primary-500' 
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`} />}
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-dark-surface transition-colors"
                  >
                    {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </Disclosure>
      <main className="py-10">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 dark:text-dark-text-primary transition-colors duration-300`}>
          {children}
        </div>
      </main>
    </div>
  );
}
