import { cn } from '../../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner = ({ size = 'md', className, label }: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "rounded-full border-slate-200 border-t-[#F97316] animate-spin",
          sizeMap[size]
        )}
      />
      {label && (
        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">{label}</p>
      )}
    </div>
  );
};

interface PageLoaderProps {
  label?: string;
}

export const PageLoader = ({ label = 'Loading...' }: PageLoaderProps) => (
  <div className="flex-1 flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" label={label} />
  </div>
);
