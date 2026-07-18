import React from 'react';
import { 
  Mail, 
  Lock, 
  Building2, 
  Zap, 
  ChefHat, 
  Smartphone,
  ChevronDown,
  UserPlus,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  Phone
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuthService } from '../../services/AuthService';
import { GoogleComingSoonModal } from '../../components/GoogleComingSoonModal';
import { cn } from '../../lib/utils';
import { supabase } from '../../../lib/supabase';
import { ValoSaaSBackground } from '../../components/layout/ValoSaaSBackground';

const animationStyles = `
@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(25px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
}

.animate-fade-down {
  animation: fadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-fade-up {
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-slide-in {
  animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-slide-up {
  animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-scale-in {
  animation: scaleIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-float-1 {
  animation: float 6s ease-in-out infinite;
}
.animate-float-2 {
  animation: float 6s ease-in-out infinite;
  animation-delay: 1.5s;
}
.animate-float-3 {
  animation: float 6s ease-in-out infinite;
  animation-delay: 3s;
}
`;

const getPhonePrefix = (country: string) => {
  if (country === 'ET') return '+251';
  return '+252';
};

export const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    restaurantName: '',
    restaurantSlug: '',
    country: 'ET',
    currency: 'ETB',
    fullName: '',
    email: '',
    phoneNumber: '+251',
    password: '',
    confirmPassword: '',
    planName: 'PRO',
    isTrial: false,
  });
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = React.useState(false);

  React.useEffect(() => {
    setFormData({
      restaurantName: '',
      restaurantSlug: '',
      country: 'ET',
      currency: 'ETB',
      fullName: '',
      email: '',
      phoneNumber: '+251',
      password: '',
      confirmPassword: '',
      planName: 'PRO',
      isTrial: false,
    });
    setAgreeToTerms(false);
    setError(null);
    setStep(1);
  }, []);

  // Fetch available subscription plans from database
  const { data: dbPlans = [] } = useQuery({
    queryKey: ['register-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, price')
        .order('price', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const getErrorMessage = (err: any): string => {
    if (!err) return 'An unexpected error occurred. Please try again.';
    console.error('Registration error details:', err);

    if (typeof err === 'string') return err;
    if (err.message) {
      if (err.message === '{}' || err.message === '{"message":"{}"}') {
        return 'Registration server transaction failed. Please check details or contact support.';
      }
      return err.message;
    }
    if (err.error_description) return err.error_description;
    if (err.description) return err.description;
    return 'An unexpected server error occurred. Please try again.';
  };

  const handleRestaurantNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setFormData(prev => ({ ...prev, restaurantName: val, restaurantSlug: slug }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryVal = e.target.value;
    const oldPrefix = getPhonePrefix(formData.country);
    const newPrefix = getPhonePrefix(countryVal);
    const currencyVal = countryVal === 'ET' ? 'ETB' : 'USD';

    let newPhone = newPrefix;
    if (formData.phoneNumber.startsWith(oldPrefix)) {
      const suffix = formData.phoneNumber.slice(oldPrefix.length);
      newPhone = newPrefix + suffix;
    }

    setFormData(prev => ({ 
      ...prev, 
      country: countryVal, 
      currency: currencyVal,
      phoneNumber: newPhone
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = getPhonePrefix(formData.country);
    const val = e.target.value;
    
    if (!val.startsWith(prefix)) {
      setFormData(prev => ({ ...prev, phoneNumber: prefix }));
    } else {
      const suffix = val.slice(prefix.length).replace(/[^\d]/g, '');
      setFormData(prev => ({ ...prev, phoneNumber: prefix + suffix }));
    }
  };

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.restaurantName.trim()) {
        setError('Restaurant name is required');
        return;
      }
    } else if (step === 2) {
      if (!formData.fullName.trim()) {
        setError('Owner name is required');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email address is required');
        return;
      }
      
      const prefix = getPhonePrefix(formData.country);
      if (formData.phoneNumber && formData.phoneNumber !== prefix) {
        const suffix = formData.phoneNumber.slice(prefix.length);
        if (suffix.length !== 9) {
          setError(`Phone number must contain exactly 9 digits after the country code (${prefix} XXXXXXXXX)`);
          return;
        }
      }
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      setIsLoading(false);
      return;
    }

    try {
      const data = await AuthService.register({
        email: formData.email,
        password: formData.password,
        restaurantName: formData.restaurantName,
        fullName: formData.fullName,
        currency: formData.currency,
      });

      if (data.session) {
        // Post-registration: update the subscription plan based on selection & trial config
        try {
          const selectedPlan = formData.planName;
          const isTrial = formData.isTrial;

          let tenantId: string | null = null;
          if (data.user) {
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
          }

          if (tenantId) {
            const { data: planData } = await supabase
              .from('plans')
              .select('id')
              .eq('name', selectedPlan)
              .single();

            if (planData?.id) {
              const statusVal = isTrial ? 'TRIAL' : 'ACTIVE';
              const currentPeriodEnd = isTrial 
                ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

              await supabase
                .from('subscriptions')
                .update({ 
                  plan_id: planData.id,
                  status: statusVal,
                  current_period_end: currentPeriodEnd
                })
                .eq('tenant_id', tenantId);
            }

            // Update phone number on the tenant table if entered
            const prefix = getPhonePrefix(formData.country);
            if (formData.phoneNumber && formData.phoneNumber !== prefix) {
              await supabase
                .from('tenants')
                .update({ phone: formData.phoneNumber })
                .eq('id', tenantId);
            }
          }
        } catch (err) {
          console.error('Failed to update subscription plan:', err);
        }

        navigate('/admin');
      } else {
        setError('Account created. Please check your email to confirm before logging in.');
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanDisplayName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFFFFF]">
      <style>{animationStyles}</style>

      {/* Left Pane - Branding, Headlines & Premium Vertical Feature Cards */}
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
                  Start Your<br />
                  <span className="text-[#F97316]">Restaurant Journey</span>
               </h2>
               <p className="text-[#64748B] text-sm lg:text-base leading-relaxed max-w-md font-medium">
                  Create your workspace and manage POS, Kitchen, Staff, Inventory, Tables and QR Ordering from one intelligent operating system.
               </p>
            </div>

            {/* Feature Cards: horizontal layout on tablet (md), vertical on desktop (lg) */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 lg:gap-6 pt-4">
               {/* Card 1 */}
               <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm animate-float-1 hover:border-[#334155]/60 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-[#F97316]">
                     <Zap size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-white">⚡ Lightning Fast POS</h3>
                     <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Process orders in seconds with real-time synchronization.</p>
                  </div>
               </div>

               {/* Card 2 */}
               <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm animate-float-2 hover:border-[#334155]/60 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-[#10B981]">
                     <ChefHat size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-white">🍳 Smart Kitchen Display</h3>
                     <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Live order updates for every kitchen station.</p>
                  </div>
               </div>

               {/* Card 3 */}
               <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm animate-float-3 hover:border-[#334155]/60 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-[#6366F1]">
                     <Smartphone size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-white">📱 QR Self Ordering</h3>
                     <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Customers scan, order and pay directly from their table.</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Tiny Footer */}
         <div className="hidden lg:block mt-auto relative z-10 pt-8">
            <p className="text-[#64748B] text-[10px] font-bold tracking-wider uppercase">Powered by VALO-RES</p>
         </div>
      </div>

      {/* Right Pane - White Rounded Card Form Container */}
      <div className="flex-1 bg-slate-50 md:bg-transparent flex flex-col justify-center p-4 sm:p-8 md:p-12 lg:p-16 min-h-screen relative overflow-hidden">
         <ValoSaaSBackground type="default" />
         
         {/* Mobile Hero Banner */}
         <div className="relative w-full h-40 overflow-hidden rounded-[20px] mb-6 md:hidden shadow-sm z-10">
            <img 
               src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=70&w=600" 
               alt="Restaurant Interior Mobile"
               className="w-full h-full object-cover"
               loading="eager"
            />
            <div className="absolute inset-0 bg-[#0F172A]/70 mix-blend-multiply" />
            <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
               <h2 className="text-xl font-bold leading-tight">Start Your Restaurant</h2>
               <span className="text-[#F97316] text-xs font-bold">Journey with VALO-REST</span>
            </div>
         </div>

         {/* Form Card */}
         <div className="w-full max-w-lg bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] p-6 sm:p-10 md:p-12 shadow-sm animate-scale-in flex flex-col mx-auto my-auto justify-center relative z-10">
            
            {/* Center Registration Icon */}
            <div className="mb-4 flex justify-center animate-fade-down">
               <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-[#F97316]">
                  <UserPlus size={22} />
               </div>
            </div>

            <div className="mb-6 flex flex-col items-center justify-center">
               <h1 className="text-[32px] sm:text-[40px] font-bold text-[#0F172A] tracking-tight text-center leading-none">Create Your Restaurant</h1>
               <p className="text-[#64748B] font-medium text-xs sm:text-sm text-center mt-2">Create your restaurant workspace in less than a minute.</p>
            </div>

            {/* Step Wizard Progress Indicator */}
            <div className="grid grid-cols-3 gap-2 mb-8 animate-slide-in relative select-none">
               {[
                  { label: 'Restaurant', stepNum: 1 },
                  { label: 'Owner', stepNum: 2 },
                  { label: 'Security', stepNum: 3 }
               ].map((item) => (
                  <div 
                     key={item.stepNum} 
                     className="flex flex-col items-center relative cursor-pointer"
                     onClick={() => {
                        if (item.stepNum < step) setStep(item.stepNum);
                      }}
                  >
                     <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 border-2 z-10",
                        step === item.stepNum ? "border-[#F97316] bg-white text-[#F97316]" : 
                        step > item.stepNum ? "border-[#10B981] bg-[#10B981] text-white" : 
                        "border-[#E5E7EB] bg-white text-[#64748B]"
                     )}>
                        {step > item.stepNum ? <Check size={12} strokeWidth={3} /> : item.stepNum}
                     </div>
                     <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-300",
                        step === item.stepNum ? "text-[#F97316]" : "text-[#64748B]"
                     )}>
                        {item.label}
                     </span>
                  </div>
               ))}
               <div className="absolute top-[14px] left-12 right-12 h-[2px] bg-[#E5E7EB] -z-0" />
            </div>

            <form className="space-y-4 animate-slide-up" onSubmit={handleSubmit} autoComplete="off">
               {error && (
                 <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
                    {error}
                 </div>
               )}

               {/* STEP 1: RESTAURANT INFO */}
               {step === 1 && (
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Restaurant Name</label>
                        <div className="relative">
                           <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                           <input 
                             className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
                             placeholder="Enter restaurant name" 
                             name="restaurantName"
                             value={formData.restaurantName}
                             onChange={(e) => handleRestaurantNameChange(e.target.value)}
                             required
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Country</label>
                           <div className="relative">
                              <select 
                                className="w-full h-12 pl-4 pr-10 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#F97316] transition-all appearance-none cursor-pointer" 
                                name="country"
                                value={formData.country}
                                onChange={handleCountryChange}
                                required
                              >
                                 <option value="ET">🇪🇹 Ethiopia (ET)</option>
                                 <option value="SO">🇸🇴 Somalia (SO)</option>
                                 <option value="SL">🏳️ Somaliland (SL)</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Subscription Plan</label>
                           <div className="relative">
                              <select 
                                className="w-full h-12 pl-4 pr-10 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#F97316] transition-all appearance-none cursor-pointer" 
                                name="planName"
                                value={formData.planName}
                                onChange={handleChange}
                                required
                              >
                                 {dbPlans.length > 0 ? (
                                    dbPlans.map((p: any) => (
                                      <option key={p.id} value={p.name}>
                                        {getPlanDisplayName(p.name)}
                                      </option>
                                    ))
                                 ) : (
                                    <>
                                       <option value="BASIC">Basic</option>
                                       <option value="PRO">Pro</option>
                                       <option value="ENTERPRISE">Enterprise</option>
                                    </>
                                 )}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                           </div>
                        </div>
                     </div>

                     {/* 14-Day Trial Checkbox */}
                     <div className="flex items-center gap-3 pt-2">
                        <button
                           type="button"
                           onClick={() => setFormData(prev => ({ ...prev, isTrial: !prev.isTrial }))}
                           className="flex items-center justify-center shrink-0 w-4 h-4 rounded border transition-all cursor-pointer bg-transparent"
                        >
                           <div className={cn(
                             "w-3 h-3 rounded-sm flex items-center justify-center transition-all",
                             formData.isTrial ? "bg-[#F97316]" : "bg-transparent border-slate-300"
                           )}>
                              {formData.isTrial && <Check size={8} strokeWidth={4} className="text-white" />}
                           </div>
                        </button>
                        <span className="text-[11px] font-bold text-[#64748B] select-none">
                           Start with 14-Day Trial
                        </span>
                     </div>

                     <button 
                       type="button" 
                       onClick={nextStep}
                       className="w-full bg-[#F97316] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#ea580c] transition-all flex items-center justify-center gap-2 mt-4"
                     >
                        Next: Owner Details <ArrowRight size={14} />
                     </button>
                  </div>
               )}

               {/* STEP 2: OWNER INFO */}
               {step === 2 && (
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Owner Full Name</label>
                        <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                           <input 
                             className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
                             placeholder="Enter owner's full name" 
                             name="fullName"
                             value={formData.fullName}
                             onChange={handleChange}
                             required
                          />
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Email Address</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                           <input 
                             className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
                             placeholder="Enter email address" 
                             type="email"
                             name="email"
                             value={formData.email}
                             onChange={handleChange}
                             required
                           />
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Phone Number</label>
                        <div className="relative">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                           <input 
                             className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
                             placeholder="Enter phone number (optional)" 
                             type="tel"
                             name="phoneNumber"
                             value={formData.phoneNumber}
                             onChange={handlePhoneChange}
                           />
                        </div>
                     </div>

                     <div className="flex gap-4 pt-2">
                        <button 
                          type="button" 
                          onClick={prevStep}
                          className="flex-1 bg-white border border-[#E5E7EB] text-[#0F172A] h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                           <ArrowLeft size={14} /> Back
                        </button>
                        <button 
                          type="button" 
                          onClick={nextStep}
                          className="flex-1 bg-[#F97316] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#ea580c] transition-all flex items-center justify-center gap-2"
                        >
                           Next <ArrowRight size={14} />
                        </button>
                     </div>
                  </div>
               )}

               {/* STEP 3: SECURITY INFO */}
               {step === 3 && (
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Password</label>
                        <div className="relative">
                           <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                           <input 
                             className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
                             placeholder="Min. 8 characters" 
                             type="password"
                             name="password"
                             value={formData.password}
                             onChange={handleChange}
                             required
                           />
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Confirm Password</label>
                        <div className="relative">
                           <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                           <input 
                             className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
                             placeholder="Re-enter password" 
                             type="password"
                             name="confirmPassword"
                             value={formData.confirmPassword}
                             onChange={handleChange}
                             required
                           />
                        </div>
                     </div>

                     <div className="flex items-start gap-3 py-2">
                        <button
                           type="button"
                           onClick={() => setAgreeToTerms(!agreeToTerms)}
                           className="mt-0.5 flex items-center justify-center shrink-0 w-4 h-4 rounded border transition-all cursor-pointer bg-transparent"
                        >
                           <div className={cn(
                             "w-3 h-3 rounded-sm flex items-center justify-center transition-all",
                             agreeToTerms ? "bg-[#F97316]" : "bg-transparent border-slate-300"
                           )}>
                              {agreeToTerms && <Check size={8} strokeWidth={4} className="text-white" />}
                           </div>
                        </button>
                        <p className="text-[11px] font-bold text-[#64748B] leading-normal select-none">
                           I agree to the <a href="#" className="text-[#F97316] hover:underline">Terms of Service</a> and <a href="#" className="text-[#F97316] hover:underline">Privacy Policy</a>
                        </p>
                     </div>

                     <div className="flex gap-4">
                        <button 
                          type="button" 
                          onClick={prevStep}
                          className="flex-1 bg-white border border-[#E5E7EB] text-[#0F172A] h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                           <ArrowLeft size={14} /> Back
                        </button>
                        <button 
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-[#F97316] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[#ea580c] transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                           {isLoading ? 'Creating...' : 'Create Restaurant'}
                        </button>
                     </div>
                  </div>
               )}

               <div className="relative py-4 flex flex-col items-center">
                  <div className="absolute top-1/2 w-full h-[1px] bg-slate-100" />
                  <span className="relative z-10 bg-white px-3 text-[9px] font-black text-[#64748B] uppercase tracking-widest">or</span>
               </div>

               <button 
                 type="button" 
                 onClick={() => setIsGoogleModalOpen(true)} 
                 disabled={isLoading}
                 className="w-full bg-white h-12 rounded-xl border border-[#E5E7EB] flex items-center justify-center gap-2.5 text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
               >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" loading="lazy" decoding="async" width={16} height={16} />
                  Continue with Google
               </button>
            </form>

            <div className="text-center mt-8 text-xs font-medium text-[#64748B]">
               Already have an account? <Link to="/login" className="text-[#F97316] font-bold hover:underline ml-1">Sign In →</Link>
            </div>
         </div>
      </div>
      <GoogleComingSoonModal isOpen={isGoogleModalOpen} onClose={() => setIsGoogleModalOpen(false)} />
    </div>
  );
};
