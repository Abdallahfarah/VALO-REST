import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { AuthService } from '../services/AuthService';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  impersonatedTenantId: string | null;
  setImpersonatedTenantId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedTenantId, setImpersonatedTenantIdState] = useState<string | null>(
    sessionStorage.getItem('valo_impersonated_tenant_id')
  );
  
  const queryClient = useQueryClient();

  const setImpersonatedTenantId = (id: string | null) => {
    if (id) {
      sessionStorage.setItem('valo_impersonated_tenant_id', id);
    } else {
      sessionStorage.removeItem('valo_impersonated_tenant_id');
    }
    setImpersonatedTenantIdState(id);
  };

  const [dbRole, setDbRole] = useState<string | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchDbRole = async (uid: string) => {
      try {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', uid)
          .maybeSingle();
        if (data?.role) {
          setDbRole(data.role);
        }
      } catch (err) {
        console.error('Error fetching db role:', err);
      }
    };

    if (user) {
      fetchDbRole(user.id);
    } else {
      setDbRole(null);
    }
  }, [user]);

  const signOut = async () => {
    try {
      // 1. Stop realtime subscriptions gracefully
      await supabase.removeAllChannels();
    } catch (e) {
      console.error('Failed to remove channels:', e);
    }

    try {
      // 2. Close the active Supabase session
      await AuthService.logout();
    } catch (e) {
      console.error('Supabase signOut failed:', e);
    }

    // 3. Clear TanStack Query cache
    try {
      queryClient.clear();
    } catch (e) {
      console.error('Failed to clear query cache:', e);
    }

    // 4. Remove local/session storage values created by the application
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.startsWith('valo-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.startsWith('valo-') || key.startsWith('valo_')) {
        sessionStorage.removeItem(key);
      }
    });

    // 5. Clear React Context authentication state
    setUser(null);
    setSession(null);
    setImpersonatedTenantIdState(null);
    setDbRole(null);

    // 6. Redirect user to /login and refresh authentication state
    window.location.href = '/login';
  };

  const role = impersonatedTenantId ? 'ADMIN' : (dbRole || user?.user_metadata?.role || null);

  const value = {
    user,
    session,
    role,
    loading,
    signOut,
    impersonatedTenantId,
    setImpersonatedTenantId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
