import { cn } from '../../lib/utils';

interface ValoSaaSBackgroundProps {
  type?: 'admin' | 'waiter' | 'cashier' | 'kds' | 'customer' | 'owner' | 'default';
  className?: string;
}

export const ValoSaaSBackground = ({ type = 'default', className }: ValoSaaSBackgroundProps) => {
  // Renders role-specific lightweight SVG outline illustrations
  const renderIllustrations = () => {
    switch (type) {
      case 'admin':
        return (
          <>
            {/* POS Terminal - Bottom Right */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute bottom-[8%] right-[4%] w-40 h-40 md:w-72 md:h-72 text-[#64748B]/20 pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="15" y="15" width="70" height="70" rx="6" />
              <rect x="23" y="23" width="54" height="34" rx="2" />
              {/* Keyboard Grid */}
              <line x1="28" y1="65" x2="38" y2="65" />
              <line x1="45" y1="65" x2="55" y2="65" />
              <line x1="62" y1="65" x2="72" y2="65" />
              <line x1="28" y1="73" x2="38" y2="73" />
              <line x1="45" y1="73" x2="55" y2="73" />
              <line x1="62" y1="73" x2="72" y2="73" />
              {/* Card slot reader */}
              <path d="M 85 30 L 92 30 L 92 50 L 85 50" />
            </svg>

            {/* Restaurant Table - Top Left */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute top-[12%] left-[4%] w-40 h-40 md:w-64 md:h-64 text-[#64748B]/20 pointer-events-none select-none hidden md:block transition-all duration-300">
              <line x1="15" y1="45" x2="85" y2="45" />
              <path d="M 30 45 L 35 78 M 70 45 L 65 78" />
              {/* Left Chair */}
              <path d="M 12 45 C 12 35, 20 35, 20 45" />
              <line x1="16" y1="45" x2="16" y2="60" />
              {/* Right Chair */}
              <path d="M 88 45 C 88 35, 80 35, 80 45" />
              <line x1="84" y1="45" x2="84" y2="60" />
            </svg>
          </>
        );

      case 'waiter':
        return (
          <>
            {/* Serving Tray - Bottom Left */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute bottom-[10%] left-[5%] w-40 h-40 md:w-64 md:h-64 text-[#64748B]/25 pointer-events-none select-none hidden sm:block transition-all duration-300">
              <line x1="10" y1="70" x2="90" y2="70" />
              {/* Cloche dome */}
              <path d="M 20 70 A 30 30 0 0 1 80 70" />
              {/* Handle */}
              <path d="M 46 38 A 4 4 0 1 1 54 38" />
              <path d="M 15 70 L 10 75 L 90 75 L 85 70" />
            </svg>

            {/* Chef Hat - Top Right */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute top-[10%] right-[6%] w-40 h-40 md:w-60 md:h-60 text-[#64748B]/20 pointer-events-none select-none hidden md:block transition-all duration-300">
              {/* Base band */}
              <rect x="30" y="62" width="40" height="12" rx="1" />
              {/* Fluffy folds */}
              <path d="M 30 62 C 15 50, 30 25, 45 32 C 48 18, 52 18, 55 32 C 70 25, 85 50, 70 62" />
            </svg>
          </>
        );

      case 'cashier':
        return (
          <>
            {/* Payment Terminal - Bottom Right */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute bottom-[8%] right-[5%] w-40 h-40 md:w-72 md:h-72 text-[#64748B]/20 pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="25" y="10" width="50" height="80" rx="8" />
              <rect x="32" y="18" width="36" height="28" rx="2" />
              {/* Keypad */}
              <circle cx="39" cy="55" r="2.5" />
              <circle cx="50" cy="55" r="2.5" />
              <circle cx="61" cy="55" r="2.5" />
              <circle cx="39" cy="65" r="2.5" />
              <circle cx="50" cy="65" r="2.5" />
              <circle cx="61" cy="65" r="2.5" />
              <circle cx="39" cy="75" r="2.5" />
              <circle cx="50" cy="75" r="2.5" />
              <circle cx="61" cy="75" r="2.5" />
              {/* Paper receipt coming out from top */}
              <path d="M 38 10 L 38 5 L 42 7 L 46 5 L 50 7 L 54 5 L 58 7 L 62 5 L 62 10" />
            </svg>

            {/* Receipt - Top Left */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute top-[12%] left-[4%] w-40 h-40 md:w-60 md:h-60 text-[#64748B]/20 pointer-events-none select-none hidden md:block transition-all duration-300">
              <path d="M 25 15 L 75 15 L 75 82 L 70 78 L 65 82 L 60 78 L 55 82 L 50 78 L 45 82 L 40 78 L 35 82 L 30 78 L 25 82 Z" />
              {/* Receipt detail lines */}
              <line x1="35" y1="30" x2="65" y2="30" />
              <line x1="35" y1="42" x2="55" y2="42" />
              <line x1="35" y1="54" x2="65" y2="54" />
              <line x1="35" y1="66" x2="48" y2="66" />
            </svg>
          </>
        );

      case 'kds':
        return (
          <>
            {/* Kitchen Display - Bottom Right */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute bottom-[8%] right-[5%] w-40 h-40 md:w-72 md:h-72 text-[#64748B]/20 pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="12" y="20" width="76" height="50" rx="4" />
              <path d="M 45 70 L 40 85 L 60 85 L 55 70" />
              {/* Grid content columns */}
              <line x1="37" y1="20" x2="37" y2="70" />
              <line x1="63" y1="20" x2="63" y2="70" />
              {/* Tasks representation */}
              <rect x="18" y="26" width="14" height="8" rx="1" />
              <rect x="18" y="38" width="14" height="8" rx="1" />
              <rect x="43" y="26" width="14" height="8" rx="1" />
              <rect x="69" y="26" width="14" height="8" rx="1" />
            </svg>

            {/* Chef Hat - Top Left */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute top-[12%] left-[4%] w-40 h-40 md:w-60 md:h-60 text-[#64748B]/20 pointer-events-none select-none hidden md:block transition-all duration-300">
              <rect x="30" y="62" width="40" height="12" rx="1" />
              <path d="M 30 62 C 15 50, 30 25, 45 32 C 48 18, 52 18, 55 32 C 70 25, 85 50, 70 62" />
            </svg>
          </>
        );

      case 'customer':
        return (
          <>
            {/* QR Code - Bottom Right */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute bottom-[6%] right-[4%] w-32 h-32 md:w-60 md:h-60 text-[#64748B]/20 pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="10" y="10" width="80" height="80" rx="6" />
              {/* Markers */}
              <rect x="20" y="20" width="20" height="20" rx="2" />
              <rect x="24" y="24" width="12" height="12" rx="1" />
              <rect x="60" y="20" width="20" height="20" rx="2" />
              <rect x="64" y="24" width="12" height="12" rx="1" />
              <rect x="20" y="60" width="20" height="20" rx="2" />
              <rect x="24" y="64" width="12" height="12" rx="1" />
              {/* Random blocks representation */}
              <rect x="60" y="60" width="8" height="8" rx="1" />
              <rect x="72" y="72" width="8" height="8" rx="1" />
              <rect x="60" y="72" width="6" height="6" rx="1" />
              <rect x="72" y="60" width="6" height="6" rx="1" />
            </svg>

            {/* Serving Tray - Top Left */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute top-[10%] left-[5%] w-32 h-32 md:w-56 md:h-56 text-[#64748B]/20 pointer-events-none select-none hidden md:block transition-all duration-300">
              <line x1="10" y1="70" x2="90" y2="70" />
              <path d="M 20 70 A 30 30 0 0 1 80 70" />
              <path d="M 46 38 A 4 4 0 1 1 54 38" />
            </svg>
          </>
        );

      case 'owner':
        return (
          <>
            {/* Analytics Outline - Bottom Right */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute bottom-[8%] right-[5%] w-40 h-40 md:w-72 md:h-72 text-[#64748B]/25 pointer-events-none select-none hidden sm:block transition-all duration-300">
              <path d="M 15 15 L 15 85 L 85 85" />
              {/* Curved line representing graph */}
              <path d="M 15 75 Q 30 45, 45 60 T 75 25" />
              {/* Dots on graph points */}
              <circle cx="15" cy="75" r="2" fill="currentColor" />
              <circle cx="34" cy="53" r="2" fill="currentColor" />
              <circle cx="45" cy="60" r="2" fill="currentColor" />
              <circle cx="75" cy="25" r="2" fill="currentColor" />
            </svg>

            {/* Serving Tray - Top Left */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute top-[12%] left-[4%] w-40 h-40 md:w-64 md:h-64 text-[#64748B]/20 pointer-events-none select-none hidden md:block transition-all duration-300">
              <line x1="10" y1="70" x2="90" y2="70" />
              <path d="M 20 70 A 30 30 0 0 1 80 70" />
              <path d="M 46 38 A 4 4 0 1 1 54 38" />
            </svg>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("absolute inset-0 overflow-hidden select-none pointer-events-none z-0", className)}>
      {/* 1. Soft mesh gradients (blurred large circles) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] transition-all duration-500" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-500/4 blur-[120px] transition-all duration-500" />

      {/* 2. Abstract flowing SVG wave lines (Top Section) */}
      <svg viewBox="0 0 1440 200" fill="none" className="absolute top-0 left-0 w-full opacity-[0.03] text-[#64748B] pointer-events-none">
        <path d="M 0 60 C 320 180, 720 20, 1080 120 C 1260 170, 1380 90, 1440 60 L 1440 0 L 0 0 Z" fill="currentColor" />
        <path d="M 0 90 C 380 40, 680 180, 1020 90 C 1200 45, 1350 140, 1440 120" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* 3. Dot grid pattern (Top Right) */}
      <svg className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.03] text-[#64748B] pointer-events-none" fill="currentColor">
        <defs>
          <pattern id="bg-dot-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-dot-pattern)" />
      </svg>

      {/* 4. Large Outline Illustrations */}
      {renderIllustrations()}
    </div>
  );
};
