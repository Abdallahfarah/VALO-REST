import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { AuthService } from '../services/AuthService';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  preparationStation: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  impersonatedTenantId: string | null;
  setImpersonatedTenantId: (id: string | null) => void;
  userTenantId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [preparationStation, setPreparationStation] = useState<string | null>(null);
  const [userTenantId, setUserTenantId] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [impersonatedTenantId, setImpersonatedTenantIdState] = useState<string | null>(
    sessionStorage.getItem('valo_impersonated_tenant_id')
  );
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const setImpersonatedTenantId = (id: string | null) => {
    if (id) {
      sessionStorage.setItem('valo_impersonated_tenant_id', id);
    } else {
      sessionStorage.removeItem('valo_impersonated_tenant_id');
    }
    setImpersonatedTenantIdState(id);
  };

  useEffect(() => {
    let mounted = true;

    // Combined helper to load session & profile details atomically
    const loadSessionAndProfile = async (activeSession: Session | null) => {
      if (!activeSession) {
        if (mounted) {
          setSession(null);
          setUser(null);
          setDbRole(null);
          setPreparationStation(null);
          setUserTenantId(null);
          setLoadedUserId(null);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setSession(activeSession);
        setUser(activeSession.user);
      }

      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('role, tenant_id, preparation_station')
          .eq('id', activeSession.user.id)
          .maybeSingle();

        if (error) throw error;

        if (mounted) {
          if (profile) {
            setDbRole(profile.role);
            setUserTenantId(profile.tenant_id);
            setPreparationStation(profile.preparation_station);
          }
          setLoadedUserId(activeSession.user.id);
        }
      } catch (err) {
        console.error('Error fetching profile during startup:', err);
        if (mounted) {
          setLoadedUserId(activeSession.user.id);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // 1. Fetch initial session once on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        loadSessionAndProfile(session);
      }
    }).catch(err => {
      console.error('Get initial session failed:', err);
      if (mounted) setLoading(false);
    });

    // 2. Subscribe to auth changes to update state on sign-in/sign-out/refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setSession(null);
        setUser(null);
        setDbRole(null);
        setPreparationStation(null);
        setUserTenantId(null);
        setLoadedUserId(null);
        setLoading(false);
        return;
      }

      // Avoid refetching if session user ID is already loaded and we have profile data
      if (session.user.id === user?.id && dbRole && userTenantId) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
        return;
      }

      loadSessionAndProfile(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user?.id, dbRole, userTenantId]);

  const signOut = async () => {
    try {
      await supabase.removeAllChannels();
    } catch (e) {
      console.error('Failed to remove channels:', e);
    }

    try {
      await AuthService.logout();
    } catch (e) {
      console.error('Supabase signOut failed:', e);
    }

    try {
      queryClient.clear();
    } catch (e) {
      console.error('Failed to clear query cache:', e);
    }

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

    setUser(null);
    setSession(null);
    setImpersonatedTenantIdState(null);
    setDbRole(null);
    setPreparationStation(null);
    setUserTenantId(null);
    setLoadedUserId(null);

    navigate('/login');
  };

  const role = impersonatedTenantId ? 'ADMIN' : (dbRole || user?.user_metadata?.role || null);
  const isAuthLoading = loading || !!(session && loadedUserId !== session.user.id);

  const value = {
    user,
    session,
    role,
    preparationStation,
    loading: isAuthLoading,
    signOut,
    impersonatedTenantId,
    setImpersonatedTenantId,
    userTenantId
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
