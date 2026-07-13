import React from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Globe, 
  Building2, 
  Zap, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/AuthService';
import { useAuth } from '../../context/AuthContext';
import { GoogleComingSoonModal } from '../../components/GoogleComingSoonModal';

import { cn } from '../../lib/utils';

import valoLogo from '../../../../Docs/valo-logo.webp';

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin',
  SUPER_ADMIN: '/platform/overview',
  WAITER: '/waiter/tables',
  KITCHEN_STAFF: '/kds',
  CASHIER: '/cashier',
};

const getRoleRoute = (role?: string | null) =>
  (role && ROLE_ROUTES[role]) || '/admin';

export const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const { role: currentRole } = useAuth();

  React.useEffect(() => {
    if (user) navigate(getRoleRoute(currentRole));
  }, [user, currentRole, navigate]);

  const getErrorMessage = (err: any): string => {
    if (!err) return 'An unexpected error occurred. Please try again.';
    console.error('Login technical error details:', err);

    if (typeof err === 'string') return err;
    if (err.message) {
      if (err.message === '{}' || err.message === '{"message":"{}"}') {
        return 'Login server transaction failed. Please check your credentials or contact support.';
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

    // Save rememberMe selection in localStorage so the custom storage provider sees it
    localStorage.setItem('valo_remember_me', rememberMe ? 'true' : 'false');

    try {
      const data = await AuthService.login({ email, password });
      const role = data.user?.user_metadata?.role;
      navigate(getRoleRoute(role));
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // @ts-ignore
  const handleGoogleLogin = async () => {
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

  return (
    <div className="min-h-screen flex">
      {/* Left Pane - Branding & Features */}
      <div className="hidden lg:flex w-[40%] bg-[#0B1630] relative overflow-hidden flex-col p-16 text-white">
         {/* Background Image Overlay */}
         <div className="absolute inset-0 opacity-20">
            <img 
               src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=75&w=1200&fm=webp" 
               alt="Restaurant Interior"
               className="w-full h-full object-cover"
               loading="lazy"
               decoding="async"
               width={1200}
               height={800}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1630] via-transparent to-transparent" />
         </div>

         <div className="relative z-10">
            <div className="space-y-12">
               <h2 className="text-5xl font-black leading-tight max-w-sm">
                  Smart Restaurant Management Platform
               </h2>
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
      <div className="flex-1 bg-white flex flex-col p-8 md:p-16 relative">
         <div className="absolute top-8 right-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 text-sm font-bold text-[#0B1630] cursor-pointer hover:bg-slate-50 transition-all">
               <Globe size={16} />
               English
               <ChevronDown size={14} className="text-[#94A3B8]" />
            </div>
         </div>

         <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
            <div className="mb-8 flex flex-col items-center justify-center">
               {/* Logo above Welcome Back */}
               <div className="inline-flex items-center justify-center bg-[#F8FAFC]/80 backdrop-blur-md border border-[#E2E8F0] rounded-[22px] px-8 py-5 shadow-sm mb-8 select-none">
                  <img 
                     src={valoLogo} 
                     alt="VALO-REST Logo" 
                     className="h-12 w-auto object-contain"
                     loading="eager"
                     fetchPriority="high"
                     decoding="async"
                     width={59}
                     height={48}
                     onError={(e) => {
                        e.currentTarget.style.display = 'none';
                     }}
                  />
               </div>
               <h1 className="text-4xl font-black text-[#0B1630] mb-2 text-center w-full">Welcome Back</h1>
               <p className="text-[#64748B] font-medium text-center w-full">Sign in to your workspace</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit} autoComplete="on">
               {error && (
                 <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
                   {error}
                 </div>
               )}
               <div className="space-y-2">
                  <label className="text-xs font-black text-[#0B1630] uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                     <input 
                       className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8] transition-all" 
                       placeholder="Enter your email" 
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       autoComplete="username"
                       required
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black text-[#0B1630] uppercase tracking-widest">Password</label>
                  <div className="relative">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                     <input 
                       className="w-full h-14 pl-12 pr-12 rounded-2xl border border-slate-100 bg-slate-50/30 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8] transition-all" 
                       placeholder="Enter your password" 
                       type={showPassword ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       autoComplete="current-password"
                       required
                     />
                     <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0B1630] cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                     >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                  </div>
               </div>

                <div className="flex items-center justify-between">
                   <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className="flex items-center gap-2 cursor-pointer group select-none bg-transparent border-0 outline-none p-0"
                   >
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        rememberMe ? "border-[#F97316] bg-[#F97316]/5" : "border-slate-200 group-hover:border-[#F97316]"
                      )}>
                         <div className={cn(
                           "w-2.5 h-2.5 bg-[#F97316] rounded-sm transition-transform",
                           rememberMe ? "scale-100" : "scale-0"
                         )} />
                      </div>
                      <span className="text-xs font-bold text-[#64748B]">Remember me</span>
                   </button>
                   <a href="#" className="text-xs font-bold text-[#F97316] hover:underline">Forgot Password?</a>
                </div>

               <button 
                 type="submit"
                 disabled={isLoading}
                 className="w-full bg-[#F97316] text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-[#ea580c] transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
               >
                  {isLoading ? 'Signing In...' : 'Sign In'}
               </button>

               <div className="relative py-8 flex flex-col items-center">
                  <div className="absolute top-1/2 w-full h-[1px] bg-slate-100" />
                  <span className="relative z-10 bg-white px-4 text-[10px] font-black text-[#64748B] uppercase tracking-widest">or</span>
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

            <p className="text-center mt-12 text-sm font-medium text-[#64748B]">
               Don't have an account? <Link to="/register" className="text-[#F97316] font-black hover:underline">Create Account</Link>
            </p>
         </div>
      </div>
      <GoogleComingSoonModal isOpen={isGoogleModalOpen} onClose={() => setIsGoogleModalOpen(false)} />
    </div>
  );
};
