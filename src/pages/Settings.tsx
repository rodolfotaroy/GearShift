import { Button } from '../components/Button';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { 
  UserIcon, 
  CogIcon, 
  LockClosedIcon, 
  BellIcon 
} from '@heroicons/react/24/outline';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { supabaseClient } = useSupabase();
  const [profile, setProfile] = React.useState({
    full_name: '',
    email: '',
    avatar_url: ''
  });
  const [notifications, setNotifications] = React.useState({
    email_updates: false,
    push_notifications: false
  });
  const [theme, setTheme] = React.useState(() => {
    // Initialize theme from local storage or default to 'light'
    return localStorage.getItem('app-theme') || 'light';
  });

  React.useEffect(() => {
    fetchUserProfile();
    
    // Apply theme on component mount
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [user]);

  React.useEffect(() => {
    // Persist theme to local storage whenever it changes
    localStorage.setItem('app-theme', theme);
    
    // Apply theme
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  async function fetchUserProfile() {
    if (!user) return;

    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        full_name: data.full_name || '',
        email: user.email || '',
        avatar_url: data.avatar_url || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function updateProfile() {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ 
          full_name: profile.full_name,
          avatar_url: profile.avatar_url 
        })
        .eq('id', user?.id);

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }

  function handleThemeChange(selectedTheme: string) {
    setTheme(selectedTheme);
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <CogIcon className="h-8 w-8 mr-3 text-gray-600" /> 
          Account Settings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <UserIcon className="h-6 w-6 mr-2 text-gray-600" />
              Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={profile.email}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                />
              </div>
              <button
                onClick={updateProfile}
                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
              >
                Update Profile
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BellIcon className="h-6 w-6 mr-2 text-gray-600" />
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Email Updates</span>
                <input
                  type="checkbox"
                  checked={notifications.email_updates}
                  onChange={() => setNotifications({
                    ...notifications, 
                    email_updates: !notifications.email_updates
                  })}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Push Notifications</span>
                <input
                  type="checkbox"
                  checked={notifications.push_notifications}
                  onChange={() => setNotifications({
                    ...notifications, 
                    push_notifications: !notifications.push_notifications
                  })}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Theme Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Theme
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={() => handleThemeChange('light')}
                className={`px-4 py-2 rounded-md ${theme === 'light' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                Light
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <LockClosedIcon className="h-6 w-6 mr-2 text-gray-600" />
              Security
            </h2>
            <button
              onClick={() => {/* Implement password reset logic */}}
              className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition"
            >
              Reset Password
            </button>
            <button
              onClick={signOut}
              className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition mt-4"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
