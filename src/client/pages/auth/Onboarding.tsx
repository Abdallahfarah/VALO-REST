import { useState } from 'react';
import { Store, Globe, ArrowRight, Loader2, Zap, ChefHat, Smartphone } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast-store';
import { AuthLayout, FeatureCardItem } from '../../components/layout/AuthLayout';

const featureCards: FeatureCardItem[] = [
  {
    icon: Zap,
    title: '⚡ Lightning Fast POS',
    description: 'Process orders in seconds with real-time synchronization.',
    iconBgClass: 'bg-orange-500/10 border-orange-500/20',
    iconTextClass: 'text-[#F97316]'
  },
  {
    icon: ChefHat,
    title: '🍳 Smart Kitchen Display',
    description: 'Live order updates for every kitchen station.',
    iconBgClass: 'bg-emerald-500/10 border-emerald-500/20',
    iconTextClass: 'text-[#10B981]'
  },
  {
    icon: Smartphone,
    title: '📱 QR Self Ordering',
    description: 'Customers scan, order and pay directly from their table.',
    iconBgClass: 'bg-indigo-500/10 border-indigo-500/20',
    iconTextClass: 'text-[#6366F1]'
  }
];

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
      const { data: tenantId, error: rpcErr } = await supabase.rpc('onboard_new_restaurant', {
        p_restaurant_name: restaurantName,
        p_currency_code: currency,
        p_plan_name: plan
      });

      if (rpcErr) throw rpcErr;
      if (!tenantId) throw new Error('Failed to create restaurant workspace.');

      const { error: metaErr } = await supabase.auth.updateUser({
        data: { role: 'ADMIN' }
      });
      if (metaErr) console.warn('Failed to update auth role metadata:', metaErr.message);

      toast.success('Workspace Created', 'Welcome to Dhadhan HUB! Loading dashboard...');
      
      window.location.href = '/admin';
    } catch (err: any) {
      toast.error('Onboarding Failed', err.message || 'Could not provision your workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="restaurant"
      headline={<>Setup Your<br /><span className="text-[#F97316]">Restaurant Workspace</span></>}
      subheadline="Set up your brand and operational settings to get started with Dhadhan HUB."
      featureCards={featureCards}
      title="Setup Workspace"
      subtitle="Complete your brand setup to activate your dashboard"
      footerText="Powered by Dhadhan HUB"
      headerBadge={
        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-[#F97316]">
          <Store size={22} />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
        {/* Restaurant Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Restaurant Name</label>
          <div className="relative">
            <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all font-medium"
              placeholder="e.g. VALO Bistro"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Currency selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Workspace Currency</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <select
              className="w-full h-12 pl-11 pr-10 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#F97316] transition-all appearance-none cursor-pointer"
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
            className="w-full h-12 rounded-xl bg-[#F97316] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#ea580c] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Provisioning Workspace...
              </>
            ) : (
              <>
                Create Workspace
                <ArrowRight size={14} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="w-full h-12 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
