import { cn } from '../../lib/utils';

interface ValoSaaSBackgroundProps {
  type?: 'admin' | 'waiter' | 'cashier' | 'kds' | 'customer' | 'owner' | 'default';
  className?: string;
}

export const ValoSaaSBackground = ({ type = 'default', className }: ValoSaaSBackgroundProps) => {
  // Renders color-harmonized vector outlines matching the reference design layout
  const renderIllustrations = () => {
    switch (type) {
      case 'admin':
        return (
          <>
            {/* Serving Dome / Cloche - Top Left (Blue Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[12%] left-[4%] w-36 h-36 md:w-60 md:h-60 text-[#3B82F6]/[0.04] pointer-events-none select-none hidden md:block transition-all duration-300">
              <path d="M 10 75 L 90 75 A 2 2 0 0 0 92 73 L 8 73 A 2 2 0 0 0 10 75 Z" />
              <path d="M 18 73 C 18 35, 82 35, 82 73 Z" />
              <circle cx="50" cy="31" r="4" />
            </svg>

            {/* Chef Hat - Top Right (Indigo Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[10%] right-[6%] w-36 h-36 md:w-56 md:h-56 text-[#6366F1]/[0.035] pointer-events-none select-none hidden md:block transition-all duration-300">
              <rect x="32" y="62" width="36" height="10" rx="1" />
              <path d="M 32 62 C 18 50, 30 25, 45 32 C 48 18, 52 18, 55 32 C 70 25, 82 50, 68 62" />
            </svg>

            {/* Restaurant Table - Bottom Left (Green Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[10%] left-[4%] w-36 h-36 md:w-64 md:h-64 text-[#10B981]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <line x1="20" y1="48" x2="80" y2="48" />
              <line x1="50" y1="48" x2="50" y2="78" />
              <line x1="38" y1="78" x2="62" y2="78" />
              {/* Left Chair */}
              <path d="M 12 42 L 22 42 L 24 78 M 12 42 L 12 25 L 22 25" />
              {/* Right Chair */}
              <path d="M 88 42 L 78 42 L 76 78 M 88 42 L 88 25 L 78 25" />
            </svg>

            {/* Layered Phones / QR Code - Bottom Right (Orange Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[8%] right-[4%] w-40 h-40 md:w-68 md:h-68 text-[#F97316]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="20" y="24" width="44" height="66" rx="6" />
              <rect x="35" y="14" width="44" height="66" rx="6" />
              <rect x="40" y="20" width="34" height="42" rx="1" />
              {/* QR markers */}
              <rect x="45" y="25" width="8" height="8" />
              <rect x="47" y="27" width="4" height="4" fill="currentColor" />
              <rect x="61" y="25" width="8" height="8" />
              <rect x="63" y="27" width="4" height="4" fill="currentColor" />
              <rect x="45" y="41" width="8" height="8" />
              <rect x="47" y="43" width="4" height="4" fill="currentColor" />
            </svg>
          </>
        );

      case 'waiter':
        return (
          <>
            {/* Serving Dome / Cloche - Top Left (Blue Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[12%] left-[4%] w-36 h-36 md:w-60 md:h-60 text-[#3B82F6]/[0.04] pointer-events-none select-none hidden md:block transition-all duration-300">
              <path d="M 10 75 L 90 75 A 2 2 0 0 0 92 73 L 8 73 A 2 2 0 0 0 10 75 Z" />
              <path d="M 18 73 C 18 35, 82 35, 82 73 Z" />
              <circle cx="50" cy="31" r="4" />
            </svg>

            {/* Chef Hat - Top Right (Indigo Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[10%] right-[6%] w-36 h-36 md:w-56 md:h-56 text-[#6366F1]/[0.035] pointer-events-none select-none hidden md:block transition-all duration-300">
              <rect x="32" y="62" width="36" height="10" rx="1" />
              <path d="M 32 62 C 18 50, 30 25, 45 32 C 48 18, 52 18, 55 32 C 70 25, 82 50, 68 62" />
            </svg>

            {/* Receipt - Bottom Left (Green/Slate Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[10%] left-[5%] w-36 h-36 md:w-60 md:h-60 text-[#10B981]/[0.035] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <path d="M 30 10 L 70 10 L 70 82 L 66 78 L 62 82 L 58 78 L 54 82 L 50 78 L 46 82 L 42 78 L 38 82 L 34 78 L 30 82 Z" />
              <line x1="38" y1="25" x2="62" y2="25" />
              <line x1="38" y1="35" x2="54" y2="35" />
              <line x1="38" y1="45" x2="62" y2="45" />
              <line x1="38" y1="55" x2="48" y2="55" />
            </svg>

            {/* POS Terminal - Bottom Right (Orange Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[8%] right-[4%] w-40 h-40 md:w-68 md:h-68 text-[#F97316]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="25" y="15" width="50" height="70" rx="8" />
              <rect x="32" y="22" width="36" height="28" rx="2" />
              <circle cx="39" cy="58" r="2" />
              <circle cx="50" cy="58" r="2" />
              <circle cx="61" cy="58" r="2" />
              <circle cx="39" cy="66" r="2" />
              <circle cx="50" cy="66" r="2" />
              <circle cx="61" cy="66" r="2" />
            </svg>
          </>
        );

      case 'cashier':
        return (
          <>
            {/* Receipt - Top Left (Blue Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[12%] left-[4%] w-36 h-36 md:w-56 md:h-56 text-[#3B82F6]/[0.04] pointer-events-none select-none hidden md:block transition-all duration-300">
              <path d="M 30 10 L 70 10 L 70 82 L 66 78 L 62 82 L 58 78 L 54 82 L 50 78 L 46 82 L 42 78 L 38 82 L 34 78 L 30 82 Z" />
              <line x1="38" y1="25" x2="62" y2="25" />
              <line x1="38" y1="35" x2="54" y2="35" />
              <line x1="38" y1="45" x2="62" y2="45" />
            </svg>

            {/* Chef Hat - Top Right (Indigo Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[10%] right-[6%] w-36 h-36 md:w-56 md:h-56 text-[#6366F1]/[0.035] pointer-events-none select-none hidden md:block transition-all duration-300">
              <rect x="32" y="62" width="36" height="10" rx="1" />
              <path d="M 32 62 C 18 50, 30 25, 45 32 C 48 18, 52 18, 55 32 C 70 25, 82 50, 68 62" />
            </svg>

            {/* Restaurant Table - Bottom Left (Green Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[10%] left-[4%] w-36 h-36 md:w-64 md:h-64 text-[#10B981]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <line x1="20" y1="48" x2="80" y2="48" />
              <line x1="50" y1="48" x2="50" y2="78" />
              <line x1="38" y1="78" x2="62" y2="78" />
              <path d="M 12 42 L 22 42 L 24 78 M 12 42 L 12 25 L 22 25" />
              <path d="M 88 42 L 78 42 L 76 78 M 88 42 L 88 25 L 78 25" />
            </svg>

            {/* Payment Terminal - Bottom Right (Orange Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[8%] right-[5%] w-40 h-40 md:w-68 md:h-68 text-[#F97316]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="25" y="10" width="50" height="80" rx="8" />
              <rect x="32" y="18" width="36" height="28" rx="2" />
              <circle cx="39" cy="55" r="2" />
              <circle cx="50" cy="55" r="2" />
              <circle cx="61" cy="55" r="2" />
              <circle cx="39" cy="65" r="2" />
              <circle cx="50" cy="65" r="2" />
              <circle cx="61" cy="65" r="2" />
              <circle cx="39" cy="75" r="2" />
              <circle cx="50" cy="75" r="2" />
              <circle cx="61" cy="75" r="2" />
              <path d="M 38 10 L 38 5 L 42 7 L 46 5 L 50 7 L 54 5 L 58 7 L 62 5 L 62 10" />
            </svg>
          </>
        );

      case 'kds':
        return (
          <>
            {/* Chef Hat - Top Left (Blue Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[12%] left-[4%] w-36 h-36 md:w-56 md:h-56 text-[#3B82F6]/[0.04] pointer-events-none select-none hidden md:block transition-all duration-300">
              <rect x="32" y="62" width="36" height="10" rx="1" />
              <path d="M 32 62 C 18 50, 30 25, 45 32 C 48 18, 52 18, 55 32 C 70 25, 82 50, 68 62" />
            </svg>

            {/* Serving Dome / Cloche - Top Right (Indigo Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[10%] right-[6%] w-36 h-36 md:w-60 md:h-60 text-[#6366F1]/[0.035] pointer-events-none select-none hidden md:block transition-all duration-300">
              <path d="M 10 75 L 90 75 A 2 2 0 0 0 92 73 L 8 73 A 2 2 0 0 0 10 75 Z" />
              <path d="M 18 73 C 18 35, 82 35, 82 73 Z" />
              <circle cx="50" cy="31" r="4" />
            </svg>

            {/* Receipt - Bottom Left (Green Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[10%] left-[5%] w-36 h-36 md:w-60 md:h-60 text-[#10B981]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <path d="M 30 10 L 70 10 L 70 82 L 66 78 L 62 82 L 58 78 L 54 82 L 50 78 L 46 82 L 42 78 L 38 82 L 34 78 L 30 82 Z" />
              <line x1="38" y1="25" x2="62" y2="25" />
              <line x1="38" y1="35" x2="54" y2="35" />
            </svg>

            {/* Kitchen Display - Bottom Right (Orange Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[8%] right-[5%] w-40 h-40 md:w-72 md:h-72 text-[#F97316]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="15" y="20" width="70" height="48" rx="4" />
              <path d="M 45 68 L 40 82 L 60 82 L 55 68" />
              <line x1="38" y1="20" x2="38" y2="68" />
              <line x1="62" y1="20" x2="62" y2="68" />
            </svg>
          </>
        );

      case 'customer':
        return (
          <>
            {/* Serving Dome / Cloche - Top Left (Blue Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[12%] left-[4%] w-36 h-36 md:w-60 md:h-60 text-[#3B82F6]/[0.04] pointer-events-none select-none hidden md:block transition-all duration-300">
              <path d="M 10 75 L 90 75 A 2 2 0 0 0 92 73 L 8 73 A 2 2 0 0 0 10 75 Z" />
              <path d="M 18 73 C 18 35, 82 35, 82 73 Z" />
              <circle cx="50" cy="31" r="4" />
            </svg>

            {/* Chef Hat - Top Right (Indigo Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[10%] right-[6%] w-36 h-36 md:w-56 md:h-56 text-[#6366F1]/[0.035] pointer-events-none select-none hidden md:block transition-all duration-300">
              <rect x="32" y="62" width="36" height="10" rx="1" />
              <path d="M 32 62 C 18 50, 30 25, 45 32 C 48 18, 52 18, 55 32 C 70 25, 82 50, 68 62" />
            </svg>

            {/* Restaurant Table - Bottom Left (Green Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[10%] left-[4%] w-36 h-36 md:w-64 md:h-64 text-[#10B981]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <line x1="20" y1="48" x2="80" y2="48" />
              <line x1="50" y1="48" x2="50" y2="78" />
              <line x1="38" y1="78" x2="62" y2="78" />
              <path d="M 12 42 L 22 42 L 24 78 M 12 42 L 12 25 L 22 25" />
              <path d="M 88 42 L 78 42 L 76 78 M 88 42 L 88 25 L 78 25" />
            </svg>

            {/* Layered Phones / QR Code - Bottom Right (Orange Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[8%] right-[4%] w-40 h-40 md:w-68 md:h-68 text-[#F97316]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="20" y="24" width="44" height="66" rx="6" />
              <rect x="35" y="14" width="44" height="66" rx="6" />
              <rect x="40" y="20" width="34" height="42" rx="1" />
              <rect x="45" y="25" width="8" height="8" />
              <rect x="47" y="27" width="4" height="4" fill="currentColor" />
              <rect x="61" y="25" width="8" height="8" />
              <rect x="63" y="27" width="4" height="4" fill="currentColor" />
              <rect x="45" y="41" width="8" height="8" />
              <rect x="47" y="43" width="4" height="4" fill="currentColor" />
            </svg>
          </>
        );

      case 'owner':
        return (
          <>
            {/* Serving Dome / Cloche - Top Left (Blue Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[12%] left-[4%] w-36 h-36 md:w-60 md:h-60 text-[#3B82F6]/[0.04] pointer-events-none select-none hidden md:block transition-all duration-300">
              <path d="M 10 75 L 90 75 A 2 2 0 0 0 92 73 L 8 73 A 2 2 0 0 0 10 75 Z" />
              <path d="M 18 73 C 18 35, 82 35, 82 73 Z" />
              <circle cx="50" cy="31" r="4" />
            </svg>

            {/* Restaurant Table - Bottom Left (Green Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[10%] left-[4%] w-36 h-36 md:w-64 md:h-64 text-[#10B981]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <line x1="20" y1="48" x2="80" y2="48" />
              <line x1="50" y1="48" x2="50" y2="78" />
              <line x1="38" y1="78" x2="62" y2="78" />
              <path d="M 12 42 L 22 42 L 24 78 M 12 42 L 12 25 L 22 25" />
              <path d="M 88 42 L 78 42 L 76 78 M 88 42 L 88 25 L 78 25" />
            </svg>

            {/* Analytics Outline - Bottom Right (Orange Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[8%] right-[5%] w-40 h-40 md:w-72 md:h-72 text-[#F97316]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <path d="M 15 15 L 15 85 L 85 85" />
              <path d="M 15 75 Q 30 45, 45 60 T 75 25" />
              <circle cx="15" cy="75" r="2" fill="currentColor" />
              <circle cx="34" cy="53" r="2" fill="currentColor" />
              <circle cx="45" cy="60" r="2" fill="currentColor" />
              <circle cx="75" cy="25" r="2" fill="currentColor" />
            </svg>
          </>
        );

      case 'default':
      default:
        return (
          <>
            {/* Serving Dome / Cloche - Top Left (Blue Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[12%] left-[4%] w-36 h-36 md:w-60 md:h-60 text-[#3B82F6]/[0.04] pointer-events-none select-none hidden md:block transition-all duration-300">
              <path d="M 10 75 L 90 75 A 2 2 0 0 0 92 73 L 8 73 A 2 2 0 0 0 10 75 Z" />
              <path d="M 18 73 C 18 35, 82 35, 82 73 Z" />
              <circle cx="50" cy="31" r="4" />
            </svg>

            {/* Chef Hat - Top Right (Indigo Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute top-[10%] right-[6%] w-36 h-36 md:w-56 md:h-56 text-[#6366F1]/[0.035] pointer-events-none select-none hidden md:block transition-all duration-300">
              <rect x="32" y="62" width="36" height="10" rx="1" />
              <path d="M 32 62 C 18 50, 30 25, 45 32 C 48 18, 52 18, 55 32 C 70 25, 82 50, 68 62" />
            </svg>

            {/* Restaurant Table - Bottom Left (Green Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[10%] left-[4%] w-36 h-36 md:w-64 md:h-64 text-[#10B981]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <line x1="20" y1="48" x2="80" y2="48" />
              <line x1="50" y1="48" x2="50" y2="78" />
              <line x1="38" y1="78" x2="62" y2="78" />
              <path d="M 12 42 L 22 42 L 24 78 M 12 42 L 12 25 L 22 25" />
              <path d="M 88 42 L 78 42 L 76 78 M 88 42 L 88 25 L 78 25" />
            </svg>

            {/* Layered Phones / QR Code - Bottom Right (Orange Accent) */}
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="absolute bottom-[8%] right-[4%] w-40 h-40 md:w-68 md:h-68 text-[#F97316]/[0.04] pointer-events-none select-none hidden sm:block transition-all duration-300">
              <rect x="20" y="24" width="44" height="66" rx="6" />
              <rect x="35" y="14" width="44" height="66" rx="6" />
              <rect x="40" y="20" width="34" height="42" rx="1" />
              <rect x="45" y="25" width="8" height="8" />
              <rect x="47" y="27" width="4" height="4" fill="currentColor" />
              <rect x="61" y="25" width="8" height="8" />
              <rect x="63" y="27" width="4" height="4" fill="currentColor" />
              <rect x="45" y="41" width="8" height="8" />
              <rect x="47" y="43" width="4" height="4" fill="currentColor" />
            </svg>
          </>
        );
    }
  };

  return (
    <div className={cn("absolute inset-0 overflow-hidden select-none pointer-events-none z-0", className)}>
      {/* 1. Soft mesh gradients (blurred large circles: 3-4% opacity) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/[0.035] blur-[120px] transition-all duration-500" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-500/[0.03] blur-[120px] transition-all duration-500" />

      {/* 2. Abstract flowing SVG wave lines (Top Section: 3.5% opacity) */}
      <svg viewBox="0 0 1440 300" fill="none" className="absolute top-0 left-0 w-full opacity-[0.035] text-[#6366F1] pointer-events-none">
        <path d="M 0,100 C 300,260 600,40 1000,180 C 1200,240 1350,140 1440,100" stroke="currentColor" strokeWidth="1" />
        <path d="M 0,140 C 400,60 800,240 1100,120 C 1250,60 1380,180 1440,150" stroke="currentColor" strokeWidth="0.8" />
        <path d="M 0,80 C 250,120 500,200 900,100 C 1150,40 1300,120 1440,60" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      {/* 3. Dot grid pattern (Top Right: 2.5% opacity) */}
      <svg className="absolute top-[4%] right-[4%] w-[240px] h-[240px] opacity-[0.025] text-[#64748B] pointer-events-none" fill="currentColor">
        <defs>
          <pattern id="bg-dot-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-dot-pattern)" />
      </svg>

      {/* 4. Large Outline Illustrations */}
      {renderIllustrations()}
    </div>
  );
};
