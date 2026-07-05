import { useToastStore, type ToastType } from '../../lib/toast-store';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

const iconMap: Record<ToastType, any> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styleMap: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: {
    bg: 'bg-white',
    border: 'border-emerald-200',
    icon: 'text-emerald-500',
    bar: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-white',
    border: 'border-red-200',
    icon: 'text-red-500',
    bar: 'bg-red-500',
  },
  info: {
    bg: 'bg-white',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    bar: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-white',
    border: 'border-orange-200',
    icon: 'text-orange-500',
    bar: 'bg-orange-500',
  },
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => {
        const Icon = iconMap[t.type];
        const style = styleMap[t.type];

        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto min-w-[340px] max-w-[420px] rounded-2xl border shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden",
              "animate-[slideIn_0.3s_ease-out]",
              style.bg,
              style.border
            )}
          >
            <div className={cn("h-1 w-full", style.bar)} />
            <div className="p-4 flex items-start gap-3">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", style.icon)}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0B1630]">{t.title}</p>
                {t.message && (
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{t.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
