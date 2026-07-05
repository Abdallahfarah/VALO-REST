import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../../lib/supabase';

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
  const { user, impersonatedTenantId } = useAuth();

  useEffect(() => {
    const loadOrOnboardTenant = async () => {
      if (!user) {
        setTenant(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let tenantId = impersonatedTenantId;

        if (!tenantId) {
          // 1. Fetch user profile from public.users
          const { data: profile, error: profileErr } = await supabase
            .from('users')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single();

          if (profileErr) {
            if (profileErr.code === 'PGRST116') {
              throw new Error('User profile not found. Please register or contact support.');
            }
            throw new Error('Failed to load user profile: ' + profileErr.message);
          }

          tenantId = profile?.tenant_id;
        }

        // 2. If tenant_id is missing, set tenant to null and complete loading (allows onboarding)
        if (!tenantId) {
          setTenant(null);
          setLoading(false);
          return;
        }

        // 3. Load the tenant data
        const { data: tenantData, error: tenantErr } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single();

        if (tenantErr) {
          throw new Error('Failed to retrieve restaurant workspace data: ' + tenantErr.message);
        }

        // 4. Load the subscription data
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*, plans(*)')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        const activePlan = (subData?.plans?.name || 'PRO') as 'BASIC' | 'PRO' | 'ENTERPRISE';
        const subStatus = subData?.status || 'ACTIVE';

        const currencyCode = tenantData.currency_code || 'ETB';
        const currencySymbol = tenantData.currency_symbol || currencyCode;
        const currencyName = CURRENCY_NAMES[currencyCode] || currencyCode;

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
          currency: currencyCode, // Backwards compatibility
          currencyCode,
          currencySymbol,
          currencyName,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to authenticate restaurant workspace.');
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };

    loadOrOnboardTenant();

    // Realtime tenant synchronization channel
    let tenantChannel: any = null;
    if (user) {
      const getActiveTenantId = async () => {
        let tenantId = impersonatedTenantId;
        if (!tenantId) {
          const { data: profile } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .maybeSingle();
          tenantId = profile?.tenant_id;
        }
        if (tenantId) {
          tenantChannel = supabase
            .channel('tenant-realtime-sync')
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'tenants', filter: `id=eq.${tenantId}` },
              (payload: any) => {
                if (payload.new) {
                  setTenant(prev => {
                    if (!prev) return null;
                    const code = payload.new.currency_code || 'ETB';
                    const symbol = payload.new.currency_symbol || code;
                    const name = CURRENCY_NAMES[code] || code;
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
      };
      getActiveTenantId();
    }

    return () => {
      if (tenantChannel) {
        supabase.removeChannel(tenantChannel);
      }
    };
  }, [user, impersonatedTenantId]);

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
