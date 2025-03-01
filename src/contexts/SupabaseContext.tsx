/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createContext, useContext, useMemo } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create a single client instance
const createSupabaseClient = () => {
  console.log('Creating Supabase Client');
  return createClient(supabaseUrl, supabaseAnonKey);
};

const SupabaseContext = createContext<SupabaseClient | null>(null);

export const useSupabase = () => {
  const supabaseClient = useContext(SupabaseContext);
  
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized');
  }

  return {
    supabaseClient,
    supabaseAuth: supabaseClient.auth,
    supabaseStorage: supabaseClient.storage
  };
};

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  // Use useMemo to ensure only one client is created
  const supabase = useMemo(() => createSupabaseClient(), []);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};
