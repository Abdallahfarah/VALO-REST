import React from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Zap, 
  ChefHat, 
  Smartphone
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/AuthService';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import valoLogo from '../../../../Docs/valo-logo.webp';

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin',
  SUPER_ADMIN: '/platform/overview',
  WAITER: '/waiter',
  KITCHEN_STAFF: '/kds',
  CASHIER: '/cashier',
};

const getRoleRoute = (role?: string | null) =>
  (role && ROLE_ROUTES[role]) || '/admin';

const animationStyles = `
@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
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

export const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FFFFFF]">
      <style>{animationStyles}</style>

      {/* Left Pane - Branding & Horizontal/Vertical Feature Cards */}
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
                  Smarter Restaurants<br />
                  <span className="text-[#F97316]">Better Business</span>
               </h2>
               <p className="text-[#64748B] text-sm lg:text-base leading-relaxed max-w-md font-medium">
                  Manage POS, Kitchen, Staff, Inventory and QR Ordering from one intelligent platform.
               </p>
            </div>

            {/* Feature Cards: horizontal layout on tablet (md), vertical on desktop (lg) */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 lg:gap-6 pt-4">
               {/* Card 1 */}
               <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm animate-float-1">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-[#F97316]">
                     <Zap size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-white">⚡ Lightning Fast POS</h3>
                     <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Real-time orders and payments.</p>
                  </div>
               </div>

               {/* Card 2 */}
               <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm animate-float-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-[#10B981]">
                     <ChefHat size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-white">🍳 Kitchen Display</h3>
                     <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Instant kitchen synchronization.</p>
                  </div>
               </div>

               {/* Card 3 */}
               <div className="flex items-center gap-4 p-4 rounded-[20px] bg-[#1E293B]/40 border border-[#334155]/30 backdrop-blur-sm animate-float-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-[#6366F1]">
                     <Smartphone size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm text-white">📱 QR Ordering</h3>
                     <p className="text-[#64748B] text-[11px] mt-0.5 font-medium">Customers scan and order instantly.</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Tiny Footer */}
         <div className="hidden lg:block mt-auto relative z-10 pt-8">
            <p className="text-[#64748B] text-[10px] font-bold tracking-wider uppercase">© 2026 Dhadhan HUB. All rights reserved.</p>
         </div>
      </div>

      {/* Right Pane - White Rounded Card Form Container */}
      <div className="flex-1 bg-slate-50 md:bg-[#FFFFFF] flex flex-col justify-center p-4 sm:p-8 md:p-12 lg:p-16 min-h-screen relative">
         
         {/* Mobile Hero Banner */}
         <div className="relative w-full h-40 overflow-hidden rounded-[20px] mb-6 md:hidden shadow-sm">
            <img 
               src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=70&w=600" 
               alt="Restaurant Interior Mobile"
               className="w-full h-full object-cover"
               loading="eager"
            />
            <div className="absolute inset-0 bg-[#0F172A]/70 mix-blend-multiply" />
            <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
               <h2 className="text-xl font-bold leading-tight">Smarter Restaurants</h2>
               <span className="text-[#F97316] text-xs font-bold">Better Business</span>
            </div>
         </div>

         {/* Form Card */}
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
               <h1 className="text-[32px] sm:text-[40px] md:text-[44px] font-bold text-[#0F172A] tracking-tight text-center leading-none">Welcome Back</h1>
               <p className="text-[#64748B] font-medium text-xs sm:text-sm text-center mt-2">Sign in to continue to your workspace</p>
            </div>

            <form className="space-y-5 animate-slide-up" onSubmit={handleSubmit} autoComplete="on">
               {error && (
                 <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
                    {error}
                 </div>
               )}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                     <input 
                       className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
                       placeholder="Enter your email" 
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       autoComplete="username"
                       required
                     />
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Password</label>
                  <div className="relative">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                     <input 
                       className="w-full h-12 pl-11 pr-11 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#64748B] transition-all" 
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                     >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-1">
                  <button
                     type="button"
                     onClick={() => setRememberMe(!rememberMe)}
                     className="flex items-center gap-2 cursor-pointer group select-none bg-transparent border-0 outline-none p-0"
                  >
                     <div className={cn(
                       "w-4 h-4 rounded border flex items-center justify-center transition-all",
                       rememberMe ? "border-[#F97316] bg-[#F97316]" : "border-slate-300 group-hover:border-[#F97316]"
                     )}>
                        <div className={cn(
                          "w-1.5 h-1.5 bg-white rounded-sm transition-transform",
                          rememberMe ? "scale-100" : "scale-0"
                        )} />
                     </div>
                     <span className="text-[11px] font-bold text-[#64748B]">Remember me</span>
                  </button>
                  <a href="#" className="text-[11px] font-bold text-[#F97316] hover:underline">Forgot Password?</a>
               </div>

               <button 
                 type="submit"
                 disabled={isLoading}
                 className="w-full bg-[#F97316] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[#ea580c] transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
               >
                  {isLoading ? 'Signing In...' : 'Sign In'}
               </button>

             </form>
 
             <div className="text-center mt-8 text-xs font-medium text-[#64748B]">
                Need a restaurant workspace? <Link to="/register" className="text-[#F97316] font-bold hover:underline ml-1">Create Restaurant →</Link>
             </div>
          </div>
       </div>
    </div>
  );
};
