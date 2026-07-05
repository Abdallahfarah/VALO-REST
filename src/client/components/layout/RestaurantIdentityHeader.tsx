import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Coins } from 'lucide-react';

export const RestaurantIdentityHeader = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();

  // Do not display if no tenant loaded, or if the user is a super admin
  if (!tenant || user?.role === 'SUPER_ADMIN') {
    return null;
  }

  const planLabels: Record<string, string> = {
    BASIC: 'Basic Plan',
    PRO: 'Professional Plan',
    ENTERPRISE: 'Enterprise Plan'
  };

  const planLabel = planLabels[tenant.plan] || `${tenant.plan} Plan`;

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-8 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm shrink-0">
      {/* Left panel: Logo and identity info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center text-xl shrink-0 font-bold border border-orange-100/50">
          {tenant.logo ? (
            <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            '🍽️'
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black text-[#0B1630] leading-tight">{tenant.name}</h2>
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mt-0.5">
            Restaurant ID: <span className="font-mono text-slate-600">{tenant.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>
      </div>

      {/* Right panel: Plan and currency details */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[10px] sm:text-xs font-bold text-[#64748B]">
        <div className="flex items-center gap-1.5 bg-orange-50/50 text-[#F97316] px-2.5 py-1 rounded-lg border border-orange-100/30">
          <Sparkles size={13} strokeWidth={2.5} />
          <span>{planLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-indigo-50/50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100/30">
          <Coins size={13} strokeWidth={2.5} />
          <span>Currency: {tenant.currencySymbol || tenant.currency} ({tenant.currencyName || tenant.currencyCode || tenant.currency})</span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantIdentityHeader;
