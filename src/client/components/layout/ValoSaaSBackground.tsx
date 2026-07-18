import { cn } from '../../lib/utils';

interface ValoSaaSBackgroundProps {
  className?: string;
  type?: string; // Kept for compatibility, but layout matches the reference composition globally
}

export const ValoSaaSBackground = ({ className }: ValoSaaSBackgroundProps) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden select-none pointer-events-none z-0 bg-[#FAFAFE]", className)}>
      {/* 1. Soft mesh gradients (blurred large circles) - Opacity and blur optimized for responsive layouts */}
      <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-[#4F46E5]/[0.07] blur-[70px] md:blur-[110px] transition-all duration-500" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full bg-[#F97316]/[0.05] blur-[70px] md:blur-[110px] transition-all duration-500" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[65vw] h-[65vw] max-w-[700px] max-h-[700px] rounded-full bg-[#F97316]/[0.07] blur-[80px] md:blur-[125px] transition-all duration-500" />

      {/* 2. Abstract flowing SVG wave lines (Top Section) - Clustered wavy lines */}
      <svg viewBox="0 0 1440 220" fill="none" className="absolute top-0 left-0 w-full opacity-[0.04] text-[#4F46E5] pointer-events-none">
        {/* Base ribbon path (always visible) */}
        <path d="M 0 50 C 300 170, 650 30, 1000 110 C 1180 150, 1340 70, 1440 40" stroke="currentColor" strokeWidth="1" />
        
        {/* Layered ribbon lines (density reduced on mobile) */}
        <path d="M 0 60 C 310 160, 660 40, 1010 100 C 1190 140, 1350 80, 1440 50" stroke="currentColor" strokeWidth="1" className="hidden sm:block" />
        <path d="M 0 70 C 320 150, 670 50, 1020 90 C 1200 130, 1360 90, 1440 60" stroke="currentColor" strokeWidth="1" className="hidden md:block" />
        <path d="M 0 80 C 330 140, 680 60, 1030 80 C 1210 120, 1370 100, 1440 70" stroke="currentColor" strokeWidth="1.5" className="hidden lg:block" />
        <path d="M 0 90 C 340 130, 690 70, 1040 70 C 1220 110, 1380 110, 1440 80" stroke="currentColor" strokeWidth="1" className="hidden lg:block" />
      </svg>

      {/* 3. Dot grid pattern (Top Right) - Scaled down on mobile */}
      <svg className="absolute top-0 right-0 w-[200px] h-[200px] md:w-[400px] md:h-[400px] opacity-[0.04] text-[#64748B] pointer-events-none" fill="currentColor">
        <defs>
          <pattern id="bg-dot-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-dot-grid)" />
      </svg>

      {/* 4. Large Outline Restaurant Illustrations (Hidden on Mobile/Tablet to avoid distraction) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
        
        {/* Handheld POS Terminal - Mid-Left (rotated slightly counter-clockwise) */}
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute left-[3%] top-[25%] lg:top-[30%] w-36 h-36 lg:w-48 lg:h-48 text-[#64748B]/20 rotate-[-12deg] transition-all duration-300 hidden lg:block">
          <rect x="22" y="12" width="56" height="76" rx="9" />
          <rect x="29" y="19" width="42" height="24" rx="2.5" />
          {/* Screen details */}
          <line x1="35" y1="25" x2="65" y2="25" />
          <line x1="35" y1="32" x2="52" y2="32" />
          {/* Keypad */}
          <rect x="29" y="50" width="10" height="7" rx="1" />
          <rect x="45" y="50" width="10" height="7" rx="1" />
          <rect x="61" y="50" width="10" height="7" rx="1" />
          <rect x="29" y="62" width="10" height="7" rx="1" />
          <rect x="45" y="62" width="10" height="7" rx="1" />
          <rect x="61" y="62" width="10" height="7" rx="1" />
          <rect x="29" y="74" width="10" height="7" rx="1" />
          <rect x="45" y="74" width="10" height="7" rx="1" />
          <rect x="61" y="74" width="10" height="7" rx="1" />
        </svg>

        {/* Restaurant Table & Chairs - Bottom-Left */}
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute left-[4%] bottom-[12%] lg:bottom-[15%] w-40 h-40 lg:w-56 lg:h-56 text-[#64748B]/20 transition-all duration-300 hidden lg:block">
          <line x1="28" y1="62" x2="72" y2="62" />
          <line x1="50" y1="62" x2="50" y2="80" />
          <line x1="42" y1="80" x2="58" y2="80" />
          {/* Left Chair */}
          <path d="M 20 46 L 20 66 L 30 66" />
          <line x1="22" y1="66" x2="19" y2="82" />
          <line x1="28" y1="66" x2="31" y2="82" />
          {/* Right Chair */}
          <path d="M 80 46 L 80 66 L 70 66" />
          <line x1="78" y1="66" x2="81" y2="82" />
          <line x1="72" y1="66" x2="69" y2="82" />
          {/* Plant on Table */}
          <polygon points="46 62, 54 62, 52 54, 48 54" />
          <path d="M 50 54 Q 45 46, 50 38 Q 55 46, 50 54" />
          <path d="M 50 49 Q 41 44, 43 51" />
          <path d="M 50 49 Q 59 44, 57 51" />
        </svg>

        {/* Serving Cloche - Top-Right */}
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute right-[18%] top-[8%] lg:top-[10%] w-36 h-36 lg:w-48 lg:h-48 text-[#64748B]/20 transition-all duration-300 hidden lg:block">
          <path d="M 18 70 L 14 74 A 2 2 0 0 0 16 76 L 84 76 A 2 2 0 0 0 86 74 L 82 70 Z" />
          <path d="M 23 70 A 27 27 0 0 1 77 70 Z" />
          <path d="M 45 43 A 5 5 0 1 1 55 43" />
        </svg>

        {/* Chef Hat - Mid-Right (below Serving Cloche) */}
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute right-[3%] top-[25%] lg:top-[28%] w-36 h-36 lg:w-48 lg:h-48 text-[#64748B]/20 rotate-[8deg] transition-all duration-300 hidden lg:block">
          <rect x="32" y="65" width="36" height="10" rx="1.5" />
          <line x1="37" y1="70" x2="63" y2="70" />
          <path d="M 32 65 C 20 52, 32 28, 45 35 C 48 20, 52 20, 55 35 C 68 28, 80 52, 68 65" />
        </svg>

        {/* QR Code Stand - Mid-Right (lower) */}
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute right-[4%] bottom-[25%] lg:bottom-[30%] w-36 h-36 lg:w-52 lg:h-52 text-[#64748B]/20 rotate-[10deg] transition-all duration-300 hidden lg:block">
          <rect x="25" y="15" width="50" height="70" rx="6" />
          <path d="M 30 85 L 70 85 L 65 92 L 35 92 Z" />
          {/* QR Code structure */}
          <rect x="34" y="24" width="32" height="32" rx="1" />
          <rect x="38" y="28" width="8" height="8" />
          <rect x="40" y="30" width="4" height="4" />
          <rect x="54" y="28" width="8" height="8" />
          <rect x="56" y="30" width="4" height="4" />
          <rect x="38" y="44" width="8" height="8" />
          <rect x="40" y="46" width="4" height="4" />
          {/* Decorative bits */}
          <rect x="54" y="44" width="4" height="4" />
          <rect x="60" y="50" width="2" height="2" />
        </svg>

        {/* Receipt Scroll - Bottom-Right (near center) */}
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="absolute right-[20%] bottom-[8%] lg:bottom-[10%] w-36 h-36 lg:w-48 lg:h-48 text-[#64748B]/20 transition-all duration-300 hidden lg:block">
          <path d="M 30 20 C 30 12, 70 12, 70 20 C 70 28, 30 28, 30 36" />
          <path d="M 30 36 C 30 45, 34 55, 30 65 C 28 75, 32 85, 30 95 L 35 91 L 40 95 L 45 91 L 50 95 L 55 91 L 60 95 L 65 91 L 70 95" />
          <path d="M 70 20 C 70 28, 74 38, 70 48 C 68 58, 72 68, 70 78 L 70 95" />
          {/* Detail lines inside receipt */}
          <path d="M 38 42 Q 50 40, 62 42" />
          <path d="M 38 54 Q 50 56, 58 54" />
          <path d="M 38 66 Q 50 64, 62 66" />
          <path d="M 38 78 Q 50 80, 54 78" />
        </svg>

      </div>
    </div>
  );
};
