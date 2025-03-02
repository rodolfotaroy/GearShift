/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createContext, useContext, useMemo, useState } from 'react';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Check your environment variables.');
}

// Singleton Supabase client
let singletonSupabaseClient: SupabaseClient<Database> | null = null;

// Create a single, memoized Supabase client
const createSupabaseClient = () => {
  if (!singletonSupabaseClient) {
    console.log('Initializing Supabase Client');
    singletonSupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true
      }
    });
  }
  return singletonSupabaseClient;
};

// Create context with explicit typing
const SupabaseContext = createContext<{
  supabaseClient: SupabaseClient<Database>;
} | null>(null);

// Custom hook for Supabase access with enhanced type safety
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return {
    supabaseClient: context.supabaseClient,
    supabaseAuth: context.supabaseClient.auth,
    supabaseStorage: context.supabaseClient.storage
  };
};

// Provider component to wrap the app
export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  // Use useMemo to ensure only one client is created
  const supabase = useMemo(() => ({
    supabaseClient: createSupabaseClient()
  }), []);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};
