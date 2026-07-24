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
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/AuthService';
import { cn } from '../../lib/utils';
import { supabase } from '../../../lib/supabase';
import { AuthLayout, FeatureCardItem } from '../../components/layout/AuthLayout';

const phoneCodes = [
  { code: '+251', country: 'ET' },
  { code: '+252', country: 'SO' },
  { code: '+253', country: 'DJ' },
  { code: '+254', country: 'KE' },
  { code: '+256', country: 'UG' },
  { code: '+211', country: 'SS' },
  { code: '+291', country: 'ER' }
];

const getPhonePrefix = (country: string) => {
  const pc = phoneCodes.find(p => p.country === country);
  return pc ? pc.code : '+252';
};

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
    city: '',
    password: '',
    confirmPassword: '',
    planName: 'PRO',
    isTrial: false,
  });
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFormData({
      restaurantName: '',
      restaurantSlug: '',
      country: 'ET',
      currency: 'ETB',
      fullName: '',
      email: '',
      phoneNumber: '+251',
      city: '',
      password: '',
      confirmPassword: '',
      planName: 'PRO',
      isTrial: false,
    });
    setAgreeToTerms(false);
    setError(null);
    setStep(1);
  }, []);

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

  const handlePhoneCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrefix = e.target.value;
    const pc = phoneCodes.find(p => p.code === newPrefix);
    if (!pc) return;

    const oldPrefix = getPhonePrefix(formData.country);
    const suffix = formData.phoneNumber.slice(oldPrefix.length);
    const currencyVal = pc.country === 'ET' ? 'ETB' : 'USD';

    setFormData(prev => ({ 
      ...prev, 
      country: pc.country, 
      currency: currencyVal,
      phoneNumber: newPrefix + suffix
    }));
  };

  const handlePhoneDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const prefix = getPhonePrefix(formData.country);
    const digits = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, phoneNumber: prefix + digits }));
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
      if (!formData.phoneNumber || formData.phoneNumber === prefix) {
        setError('Phone number is required');
        return;
      }
      const suffix = formData.phoneNumber.slice(prefix.length);
      if (suffix.length !== 9) {
        setError(`Phone number must contain exactly 9 digits after the country code (${prefix} XXXXXXXXX)`);
        return;
      }

      if (!formData.city.trim()) {
        setError('City is required');
        return;
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

            const prefix = getPhonePrefix(formData.country);
            if ((formData.phoneNumber && formData.phoneNumber !== prefix) || formData.city) {
              await supabase
                .from('tenants')
                .update({ 
                  phone: formData.phoneNumber !== prefix ? formData.phoneNumber : null,
                  address: formData.city
                })
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

  return (
    <AuthLayout
      variant="restaurant"
      headline={<>Start Your<br /><span className="text-[#F97316]">Restaurant Journey</span></>}
      subheadline="Create your workspace and manage POS, Kitchen, Staff, Inventory, Tables and QR Ordering from one intelligent operating system."
      featureCards={featureCards}
      title="Create Your Restaurant"
      subtitle="Create your restaurant workspace in less than a minute."
      footerText="Powered by Dhadhan HUB"
      headerBadge={
        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-[#F97316]">
          <UserPlus size={22} />
        </div>
      }
    >
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
              className="w-full bg-[#F97316] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#ea580c] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
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
              <div className="flex rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] h-12 focus-within:border-[#F97316] transition-all overflow-hidden relative">
                <div className="relative flex items-center border-r border-[#E5E7EB] bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <select
                    className="h-full pl-4 pr-8 bg-transparent text-xs font-bold text-[#0F172A] focus:outline-none appearance-none cursor-pointer"
                    value={getPhonePrefix(formData.country)}
                    onChange={handlePhoneCodeChange}
                  >
                    {phoneCodes.map(pc => (
                      <option key={pc.code} value={pc.code}>{pc.code}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 w-4 h-4 text-[#64748B] pointer-events-none" />
                </div>
                <input 
                  className="flex-1 h-full px-4 text-xs focus:outline-none placeholder:text-[#64748B] bg-transparent" 
                  placeholder="Enter phone number" 
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber.slice(getPhonePrefix(formData.country).length)}
                  onChange={handlePhoneDigitsChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">City *</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input 
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
                  placeholder="Enter your city" 
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                type="button" 
                onClick={prevStep}
                className="flex-1 bg-white border border-[#E5E7EB] text-[#0F172A] h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button 
                type="button" 
                onClick={nextStep}
                className="flex-1 bg-[#F97316] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#ea580c] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                className="flex-1 bg-white border border-[#E5E7EB] text-[#0F172A] h-12 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#F97316] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[#ea580c] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Creating...' : 'Create Restaurant'}
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="text-center mt-8 text-xs font-medium text-[#64748B]">
        Already have an account? <Link to="/login" className="text-[#F97316] font-bold hover:underline ml-1">Sign In →</Link>
      </div>
    </AuthLayout>
  );
};
