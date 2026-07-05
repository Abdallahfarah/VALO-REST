import React, { useEffect } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { toast } from '../lib/toast-store';

interface UpgradeDialogProps {
  feature: string;
  requiredPlan: 'Professional' | 'Enterprise';
  onClose: () => void;
}

export const UpgradeDialog: React.FC<UpgradeDialogProps> = ({ feature, requiredPlan, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <ShieldAlert size={24} />
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <h3 className="text-lg font-black text-[#0B1630] uppercase tracking-wide leading-tight">
            Upgrade Required
          </h3>
          <p className="text-sm text-[#64748B] font-medium leading-relaxed">
            The feature <strong className="text-[#0B1630]">{feature}</strong> is not available on your current plan. To unlock this capability, you will need to upgrade to the <strong className="text-orange-500">{requiredPlan}</strong> tier.
          </p>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest leading-none">
            {requiredPlan} Plan Benefits
          </p>
          <ul className="space-y-2">
            {requiredPlan === 'Professional' ? (
              <>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Check size={14} className="text-emerald-500" /> Unlimited staff accounts
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Check size={14} className="text-emerald-500" /> Up to 3 branches
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Check size={14} className="text-emerald-500" /> Cashier dashboard & receipt control
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Check size={14} className="text-emerald-500" /> Internal messaging & branding settings
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Check size={14} className="text-emerald-500" /> Unlimited branches & restaurants
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Check size={14} className="text-emerald-500" /> Advanced custom API access
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Check size={14} className="text-emerald-500" /> White-label branding controls
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Check size={14} className="text-emerald-500" /> Dedicated platform support
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <button 
            onClick={() => {
              toast.info('Contact Admin', 'Please ask your platform administrator to adjust your subscription.');
              onClose();
            }}
            className="w-full bg-[#0B1630] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            Upgrade Subscription
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-[#0B1630] font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Upgrade Placeholder Component for message panels, cashier pages etc.
interface UpgradePlaceholderProps {
  feature: string;
  requiredPlan: 'Professional' | 'Enterprise';
}

export const UpgradePlaceholder: React.FC<UpgradePlaceholderProps> = ({ feature, requiredPlan }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50 min-h-[300px] h-full w-full rounded-3xl border border-dashed border-slate-200">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-[#0B1630] uppercase tracking-wide">Feature Unavailable</h3>
          <p className="text-sm text-[#64748B] font-medium leading-relaxed">
            The feature <strong className="text-[#0B1630]">{feature}</strong> is locked on your subscription tier. Upgrade your workspace to <strong className="text-orange-500">{requiredPlan}</strong> to get access.
          </p>
        </div>
        <button 
          onClick={() => toast.info('Upgrade Subscription', 'Contact your platform administrator to change plans.')}
          className="bg-[#0B1630] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-md inline-block"
        >
          Request Upgrade
        </button>
      </div>
    </div>
  );
};
