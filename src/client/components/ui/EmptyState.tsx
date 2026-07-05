import { type LucideIcon, Inbox } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-8 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94A3B8] mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-sm font-bold text-[#0B1630] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[#94A3B8] max-w-[280px] leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 bg-[#F97316] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
