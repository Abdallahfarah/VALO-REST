import { useState } from 'react';
import { Store, Globe, ArrowRight, Loader2, Zap, ChefHat, Smartphone } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast-store';
import valoLogo from '../../../../Docs/valo-logo.webp';

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
      
      // 3. Force page reload to let AuthContext and TenantContext fetch newly created tenant data
      window.location.href = '/admin';
    } catch (err: any) {
      toast.error('Onboarding Failed', err.message || 'Could not provision your workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFFFFF]">
      {/* Left Pane - Branding, Headlines & Feature Cards */}
      <div className="hidden md:flex w-full md:w-[40%] bg-[#0F172A] relative overflow-hidden flex-col p-8 lg:p-16 text-white shrink-0 justify-between md:min-h-screen">
         {/* Background Image Overlay with deep navy overlay */}
         <div className="absolute inset-0 opacity-20 select-none pointer-events-none">
            <img 
               src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=75&w=1200&fm=webp" 
               alt="Restaurant Interior"
               className="w-full h-full object-cover"
               loading="lazy"
               decoding="async"
               width={1200}
               height={800}
            />
            <div className="absolute inset-0 bg-[#0F172A]/70 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent" />
         </div>

         <div className="relative z-10 my-auto space-y-8 lg:space-y-12">
            <div className="space-y-4 animate-fade-up">
               <h2 className="text-3xl lg:text-5xl font-bold leading-tight tracking-tight">
                  Welcome to<br />
                  <span className="text-[#F97316]">Dhadhan HUB</span>
               </h2>
               <p className="text-[#64748B] text-sm lg:text-base leading-relaxed max-w-md font-medium">
                  Set up your operational brand and currency to launch your restaurant workspace.
               </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 lg:gap-6 pt-4">
               <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-[#F97316]">
                     <Zap size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-white">⚡ Instant Provisioning</h3>
                     <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Workspace ready in seconds.</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-[#10B981]">
                     <ChefHat size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-white">🍳 Full Operations Suite</h3>
                     <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">POS, Kitchen, Staff & Reports.</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-[#6366F1]">
                     <Smartphone size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-white">📱 Multi-Device Ready</h3>
                     <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Desktop, Tablet & Mobile POS.</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="hidden lg:block mt-auto relative z-10 pt-8">
            <p className="text-[#64748B] text-[10px] font-bold tracking-wider uppercase">Powered by Dhadhan HUB</p>
         </div>
      </div>

      {/* Right Pane - White Rounded Card Form Container */}
      <div className="flex-1 bg-slate-50 md:bg-[#FFFFFF] flex flex-col justify-center p-4 sm:p-8 md:p-12 lg:p-16 min-h-screen relative">
         <div className="w-full max-w-lg bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] p-6 sm:p-10 md:p-12 shadow-sm animate-scale-in flex flex-col mx-auto my-auto justify-center">
            
            {/* Center Logo */}
            <div className="mb-6 flex justify-center animate-fade-down">
               <img 
                  src={valoLogo} 
                  alt="Dhadhan HUB Logo" 
                  className="h-10 w-auto object-contain"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width={50}
                  height={40}
                  onError={(e) => {
                     e.currentTarget.style.display = 'none';
                  }}
               />
            </div>

            <div className="mb-8 flex flex-col items-center justify-center">
               <h1 className="text-[32px] sm:text-[40px] font-bold text-[#0F172A] tracking-tight text-center leading-none">Setup Workspace</h1>
               <p className="text-[#64748B] font-medium text-xs sm:text-sm text-center mt-2">Enter your restaurant details to complete setup</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Restaurant Name</label>
                  <div className="relative">
                     <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                     <input 
                       className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
                       placeholder="e.g. VALO Enterprise Cafe" 
                       type="text"
                       value={restaurantName}
                       onChange={(e) => setRestaurantName(e.target.value)}
                       required
                       disabled={loading}
                     />
                  </div>
               </div>

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

               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-[#F97316] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[#ea580c] transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
               >
                  {loading ? (
                    <>
                       <Loader2 size={16} className="animate-spin" />
                       Provisioning Workspace...
                    </>
                  ) : (
                    <>
                       Complete Workspace Setup <ArrowRight size={14} />
                    </>
                  )}
               </button>

               <button
                 type="button"
                 onClick={signOut}
                 disabled={loading}
                 className="w-full bg-white border border-[#E5E7EB] text-[#0F172A] h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer mt-2"
               >
                 Sign Out
               </button>
            </form>
         </div>
      </div>
    </div>
  );
};
