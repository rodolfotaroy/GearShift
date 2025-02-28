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
  XMarkIcon,
  Bars3Icon,
  CreditCardIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import type { ComponentType } from 'react';

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
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50">
      <Disclosure as="nav" className="bg-white shadow-md">
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
                            ? 'border-primary-500 text-neutral-900'
                            : 'border-transparent text-neutral-600 hover:text-neutral-800 hover:border-neutral-300'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap`}
                      >
                        <item.icon className={`h-5 w-5 mr-2 flex-shrink-0 ${
                          location.pathname === item.href 
                            ? 'text-primary-500' 
                            : 'text-neutral-500'
                        }`} />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  <button
                    onClick={() => signOut()}
                    className="bg-neutral-100 p-2 rounded-full text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 transition-colors"
                  >
                    <UserIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className="bg-neutral-100 inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`h-5 w-5 mr-2 flex-shrink-0 ${
                        location.pathname === item.href 
                          ? 'text-primary-500' 
                          : 'text-neutral-500'
                      }`} />
                      {item.name}
                    </div>
                  </Disclosure.Button>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
