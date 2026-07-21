import { useState } from 'react';
import { Store, Globe, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast-store';

export const Onboarding = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const plan = 'PRO';
  const [loading, setLoading] = useState(false);

  const { signOut } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) {
      toast.warning('Input Required', 'Please enter your restaurant name.');
      return;
    }

    setLoading(true);
    try {
      // 1. Invoke the onboard_new_restaurant database RPC function
      const { data: tenantId, error: rpcErr } = await supabase.rpc('onboard_new_restaurant', {
        p_restaurant_name: restaurantName,
        p_currency_code: currency,
        p_plan_name: plan
      });

      if (rpcErr) throw rpcErr;
      if (!tenantId) throw new Error('Failed to create restaurant workspace.');

      // 2. Set the ADMIN role in the Supabase Auth user metadata
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { role: 'ADMIN' }
      });
      if (metaErr) console.warn('Failed to update auth role metadata:', metaErr.message);

      toast.success('Workspace Created', 'Welcome to Dhadhan HUB! Loading dashboard...');
      
      // 3. Force page reload to let AuthContext and TenantContext fetch the newly created tenant data
      window.location.href = '/admin';
    } catch (err: any) {
      toast.error('Onboarding Failed', err.message || 'Could not provision your workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative z-10 p-8 md:p-10">
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-[#F97316]">
            <Store size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0B1630]">Create Restaurant Workspace</h1>
            <p className="text-sm text-[#64748B] mt-1">Set up your brand and operational settings to get started</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Restaurant Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Restaurant Name</label>
            <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <input
                type="text"
                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] font-semibold text-[#0B1630] transition-all"
                placeholder="e.g. VALO Bistro"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Currency selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Workspace Currency</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <select
                className="w-full h-14 pl-12 pr-10 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630] transition-all appearance-none cursor-pointer"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                disabled={loading}
              >
                <option value="ETB">🇪🇹 Ethiopian Birr (ETB)</option>
                <option value="USD">🇺🇸 US Dollar (USD)</option>
              </select>
            </div>
          </div>


          {/* Buttons */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-[#F97316] text-white font-bold text-sm hover:bg-[#EA580C] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Provisioning Workspace...
                </>
              ) : (
                <>
                  Create Workspace
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={signOut}
              disabled={loading}
              className="w-full h-14 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
