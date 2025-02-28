/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SupabaseContext = createContext(supabase);

export const useSupabase = () => {
  return useContext(SupabaseContext);
};

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};
