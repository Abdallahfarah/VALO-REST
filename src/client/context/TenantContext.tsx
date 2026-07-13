import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../lib/toast-store';

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  ETB: 'Ethiopian Birr',
  EUR: 'Euro',
  GBP: 'British Pound',
  SAR: 'Saudi Riyal',
  AED: 'UAE Dirham',
  KES: 'Kenyan Shilling',
  SOS: 'Somali Shilling'
};

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: string;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  setTenant: (tenant: Tenant | null) => void;
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, impersonatedTenantId, userTenantId, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;

    const loadOrOnboardTenant = async () => {
      if (!user) {
        if (mounted) {
          setTenant(null);
          setLoading(false);
        }
        return;
      }

      try {
        if (mounted) {
          setLoading(true);
          setError(null);
        }

        const tenantId = impersonatedTenantId || userTenantId;

        // If tenant_id is missing, user needs onboarding
        if (!tenantId) {
          if (mounted) {
            setTenant(null);
            setLoading(false);
          }
          return;
        }

        // Setup query promises with timeout to prevent infinite loading screens
        const tenantPromise = supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Workspace loading timed out. Please try again.')), 8000)
        );

        const { data: tenantData, error: tenantErr } = await Promise.race([
          tenantPromise,
          timeoutPromise
        ]);

        if (tenantErr) {
          throw new Error('Failed to retrieve restaurant workspace data: ' + tenantErr.message);
        }

        if (!tenantData) {
          throw new Error('Restaurant workspace not found.');
        }

        // Fetch subscription data with a timeout fallback
        const subscriptionPromise = supabase
          .from('subscriptions')
          .select('*, plans(*)')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        const { data: subData } = await Promise.race([
          subscriptionPromise,
          timeoutPromise
        ]);

        const activePlan = (subData?.plans?.name || 'PRO') as 'BASIC' | 'PRO' | 'ENTERPRISE';
        const subStatus = subData?.status || 'ACTIVE';

        const currencyCode = tenantData.currency_code || 'ETB';
        const currencySymbol = tenantData.currency_symbol || currencyCode;
        const currencyName = CURRENCY_NAMES[currencyCode] || currencyCode;

        if (mounted) {
          setTenant({
            id: tenantData.id,
            name: tenantData.name,
            slug: tenantData.slug,
            logo: tenantData.logo || undefined,
            phone: tenantData.phone || undefined,
            email: tenantData.email || undefined,
            address: tenantData.address || undefined,
            plan: activePlan,
            subscriptionStatus: subStatus,
            currency: currencyCode,
            currencyCode,
            currencySymbol,
            currencyName,
          });
        }
      } catch (err: any) {
        console.error('Failed to load workspace:', err);
        if (mounted) {
          setError(err.message || 'Failed to authenticate restaurant workspace.');
          setTenant(null);
          toast.error('Workspace Load Failed', err.message || 'Database connection error.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOrOnboardTenant();

    // Realtime tenant synchronization channel
    let tenantChannel: any = null;
    const tenantId = impersonatedTenantId || userTenantId;

    if (tenantId) {
      tenantChannel = supabase
        .channel('tenant-realtime-sync')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tenants', filter: `id=eq.${tenantId}` },
          (payload: any) => {
            if (payload.new && mounted) {
              const code = payload.new.currency_code || 'ETB';
              const symbol = payload.new.currency_symbol || code;
              const name = CURRENCY_NAMES[code] || code;
              setTenant(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  name: payload.new.name,
                  slug: payload.new.slug,
                  logo: payload.new.logo || undefined,
                  phone: payload.new.phone || undefined,
                  email: payload.new.email || undefined,
                  address: payload.new.address || undefined,
                  currency: code,
                  currencyCode: code,
                  currencySymbol: symbol,
                  currencyName: name,
                };
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      mounted = false;
      if (tenantChannel) {
        supabase.removeChannel(tenantChannel);
      }
    };
  }, [user, impersonatedTenantId, userTenantId, authLoading]);

  const currencyCode = tenant?.currencyCode || 'ETB';
  const currencySymbol = tenant?.currencySymbol || 'ETB';
  const currencyName = tenant?.currencyName || 'Ethiopian Birr';

  return (
    <TenantContext.Provider value={{ tenant, loading, error, setTenant, currencyCode, currencySymbol, currencyName }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
