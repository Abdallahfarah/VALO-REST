import React from 'react';
import { 
  Mail, 
  Lock, 
  Building2, 
  Zap, 
  ShieldCheck, 
  ChevronDown,
  UserPlus,
  User,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/AuthService';
import { GoogleComingSoonModal } from '../../components/GoogleComingSoonModal';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    restaurantName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: 'ETB',
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = React.useState(false);

  const getErrorMessage = (err: any): string => {
    if (!err) return 'An unexpected error occurred. Please try again.';
    console.error('Registration technical error details:', err);

    if (typeof err === 'string') return err;
    if (err.message) {
      if (err.message === '{}' || err.message === '{"message":"{}"}') {
        return 'Registration server transaction failed. Please check your credentials or contact support.';
      }
      return err.message;
    }
    if (err.error_description) return err.error_description;
    if (err.description) return err.description;
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (err.error.message) return err.error.message;
    }
    try {
      const str = JSON.stringify(err);
      if (str !== '{}') return str;
    } catch (e) {}
    return 'An unexpected server error occurred. Please try again.';
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

    try {
      const data = await AuthService.register(formData);
      if (data.session) {
        // Auto-confirmed — go straight to dashboard
        navigate('/admin');
      } else {
        // Should not happen with our trigger, but handle gracefully
        setError('Account created — please check your email to confirm before signing in.');
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // @ts-ignore
  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await AuthService.loginWithGoogle();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };


  React.useEffect(() => {
    setFormData({
      restaurantName: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      currency: 'ETB',
    });
    setError(null);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  return (
    <div className="min-h-screen flex">
      {/* Left Pane - Branding & Features */}
      <div className="hidden lg:flex w-[40%] bg-[#0B1630] relative overflow-hidden flex-col p-16 text-white">
         {/* Background Image Overlay */}
         <div className="absolute inset-0 opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000" 
              alt="Restaurant Interior"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1630] via-transparent to-transparent" />
         </div>

         <div className="relative z-10">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-[#F97316] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-black text-2xl">VX</span>
               </div>
               <span className="text-2xl font-black tracking-tight">VALO-<span className="text-[#F97316]">REST</span></span>
            </div>

            <div className="mt-24 space-y-12">
               <h1 className="text-5xl font-black leading-tight max-w-sm">
                  Smart Restaurant Management Platform
               </h1>
               <p className="text-[#94A3B8] text-lg leading-relaxed max-w-md">
                  All-in-one solution to manage your restaurant operations, staff, orders, and customers from anywhere.
               </p>

               <div className="space-y-8 pt-8">
                  <div className="flex items-center gap-6 group">
                     <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                        <Building2 size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg">Multi-Tenant SaaS</h3>
                        <p className="text-[#94A3B8] text-sm mt-1">Manage multiple restaurants with complete isolation.</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                     <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                        <Zap size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg">Lightning Fast POS</h3>
                        <p className="text-[#94A3B8] text-sm mt-1">Streamlined operations for maximum efficiency.</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                     <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                        <ShieldCheck size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg">Secure & Reliable</h3>
                        <p className="text-[#94A3B8] text-sm mt-1">Enterprise-grade security and 99.9% uptime.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="mt-auto relative z-10">
            <p className="text-[#64748B] text-xs">© 2026 VALO-REST. All rights reserved.</p>
         </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex-1 bg-white flex flex-col p-8 md:p-12 relative overflow-y-auto">
         <div className="absolute top-8 right-8 cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-all">
               <Globe size={16} />
               English
               <ChevronDown size={14} className="text-[#94A3B8]" />
            </div>
         </div>

         <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full py-12">
            <div className="mb-10 text-center flex flex-col items-center">
               <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 text-[#F97316]">
                  <UserPlus size={28} />
               </div>
               <h2 className="text-4xl font-black text-[#0B1630] mb-2">Create Account</h2>
               <p className="text-[#94A3B8] font-medium">Get started with your restaurant</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
               {error && (
                 <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
                   {error}
                 </div>
               )}
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Restaurant Name</label>
                  <div className="relative">
                     <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                     <input 
                       className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8] transition-all" 
                       placeholder="Enter your restaurant name" 
                       name="restaurantName"
                       value={formData.restaurantName}
                       onChange={handleChange}
                       autoComplete="off"
                       required
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                     <input 
                       className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8] transition-all" 
                       placeholder="Enter your full name" 
                       name="fullName"
                       value={formData.fullName}
                       onChange={handleChange}
                       autoComplete="off"
                       required
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                     <input 
                       className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8] transition-all" 
                       placeholder="Enter your email" 
                       type="email"
                       name="email"
                       value={formData.email}
                       onChange={handleChange}
                       autoComplete="off"
                       required
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Currency</label>
                  <div className="relative">
                     <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                     <select 
                       className="w-full h-14 pl-12 pr-10 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] font-bold text-[#0B1630] transition-all appearance-none cursor-pointer" 
                       name="currency"
                       value={formData.currency}
                       onChange={handleChange}
                       required
                     >
                        <option value="ETB">🇪🇹 Ethiopian Birr (ETB)</option>
                        <option value="USD">🇺🇸 US Dollar (USD)</option>
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Password</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input 
                          className="w-full h-14 pl-10 pr-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8] transition-all" 
                          placeholder="Password" 
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="new-password"
                          required
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Confirm Password</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input 
                          className="w-full h-14 pl-10 pr-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8] transition-all" 
                          placeholder="Confirm" 
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          autoComplete="new-password"
                          required
                        />
                     </div>
                  </div>
               </div>

               <div className="flex items-start gap-3 py-2">
                  <div className="mt-1">
                     <div className="w-5 h-5 rounded-md border-2 border-orange-500 bg-orange-500 flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-white" />
                     </div>
                  </div>
                  <p className="text-xs font-medium text-[#64748B] leading-relaxed">
                     I agree to the <a href="#" className="text-[#F97316] font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-[#F97316] font-bold hover:underline">Privacy Policy</a>
                  </p>
               </div>

               <button 
                 type="submit"
                 disabled={isLoading}
                 className="w-full bg-[#F97316] text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-[#ea580c] transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
               >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
               </button>

               <div className="relative py-6 flex flex-col items-center">
                  <div className="absolute top-1/2 w-full h-[1px] bg-slate-100" />
                  <span className="relative z-10 bg-white px-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">or</span>
               </div>

               <button 
                  type="button" 
                  onClick={() => setIsGoogleModalOpen(true)} 
                  disabled={isLoading}
                  className="w-full bg-white h-14 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
               >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  Continue with Google
               </button>
            </form>

            <p className="text-center mt-10 text-sm font-medium text-[#94A3B8]">
               Already have an account? <Link to="/login" className="text-[#F97316] font-black hover:underline">Sign In</Link>
            </p>
         </div>
      </div>
      <GoogleComingSoonModal isOpen={isGoogleModalOpen} onClose={() => setIsGoogleModalOpen(false)} />
    </div>
  );
};
