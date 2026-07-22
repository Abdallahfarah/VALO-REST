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
import { AuthLayout, FeatureCardItem } from '../../components/layout/AuthLayout';

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin',
  SUPER_ADMIN: '/platform/overview',
  WAITER: '/waiter',
  KITCHEN_STAFF: '/kds',
  CASHIER: '/cashier',
};

const getRoleRoute = (role?: string | null) =>
  (role && ROLE_ROUTES[role]) || '/admin';

const featureCards: FeatureCardItem[] = [
  {
    icon: Zap,
    title: '⚡ Lightning Fast POS',
    description: 'Real-time orders and instant checkout payments.',
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
    <AuthLayout
      variant="restaurant"
      headline={<>Smarter Restaurants<br /><span className="text-[#F97316]">Better Business</span></>}
      subheadline="Manage POS, Kitchen, Staff, Inventory and QR Ordering from one intelligent platform."
      featureCards={featureCards}
      title="Welcome Back"
      subtitle="Sign in to continue to your workspace"
      footerText="© 2026 Dhadhan HUB. All rights reserved."
    >
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
          className="w-full bg-[#F97316] text-white h-12 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[#ea580c] transition-all active:scale-[0.98] mt-2 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center mt-8 text-xs font-medium text-[#64748B]">
        Need a restaurant workspace? <Link to="/register" className="text-[#F97316] font-bold hover:underline ml-1">Create Restaurant →</Link>
      </div>
    </AuthLayout>
  );
};
