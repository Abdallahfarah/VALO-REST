import { supabase } from '../../lib/supabase';
import { z } from 'zod';
import { CURRENCY_CONFIGS } from './CurrencyService';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  restaurantName: z.string().min(2),
  fullName: z.string().min(2),
  currency: z.string().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export const AuthService = {
  async login({ email, password }: LoginData) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async register({ email, password, restaurantName, fullName, currency }: RegisterData) {
    // 1. Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          restaurant_name: restaurantName,
          role: 'ADMIN', // First user is the Admin/Owner
          currency,
        },
      },
    });

    if (error) throw error;

    // 2. Immediately update the currency in tenants
    if (data.user && currency) {
      try {
        let tenantId: string | null = null;
        for (let i = 0; i < 5; i++) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', data.user.id)
            .maybeSingle();
          if (userProfile?.tenant_id) {
            tenantId = userProfile.tenant_id;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (tenantId) {
          const symbol = CURRENCY_CONFIGS[currency.toUpperCase()]?.symbol || currency;
          await supabase
            .from('tenants')
            .update({ 
              currency_code: currency,
              currency_symbol: symbol
            })
            .eq('id', tenantId);
        }
      } catch (err) {
        console.error("Failed to update onboarding currency:", err);
      }
    }

    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    return data;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
};
