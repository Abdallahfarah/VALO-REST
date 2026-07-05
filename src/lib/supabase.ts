import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Custom storage to handle "Remember Me" session persistence safely
const rememberMeStorage = {
  getItem(key: string): string | null {
    const isRemembered = localStorage.getItem('valo_remember_me') === 'true';
    if (isRemembered) {
      return localStorage.getItem(key);
    }
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    const isRemembered = localStorage.getItem('valo_remember_me') === 'true';
    if (isRemembered) {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    localStorage.removeItem('valo_remember_me');
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: rememberMeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
