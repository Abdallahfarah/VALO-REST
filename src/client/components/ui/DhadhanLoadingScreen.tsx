import React, { useEffect, useState, useRef } from 'react';
import { cn } from '../../lib/utils';

interface DhadhanLoadingScreenProps {
  label?: string;
  isReady?: boolean;
  onFinished?: () => void;
  className?: string;
}

export const DhadhanLoadingScreen: React.FC<DhadhanLoadingScreenProps> = ({
  label = 'Loading your restaurant workspace...',
  isReady = true,
  onFinished,
  className,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const totalSimulatedDuration = 1800; // 1.8 seconds target loading simulation

    const animate = (now: number) => {
      if (!startTimestamp) startTimestamp = now;
      const elapsed = now - startTimestamp;

      let currentPercent = 0;
      if (elapsed < totalSimulatedDuration) {
        // Smooth logarithmic easing up to 92%
        const ratio = elapsed / totalSimulatedDuration;
        const easedRatio = Math.sin((ratio * Math.PI) / 2);
        currentPercent = Math.min(92, Math.floor(easedRatio * 92));
      } else {
        // If app isn't marked ready yet, hold at 92-95%
        currentPercent = isReady ? 100 : Math.min(96, 92 + Math.floor((elapsed - totalSimulatedDuration) / 200));
      }

      setProgress((prev) => {
        const next = Math.max(prev, currentPercent);
        return next > 100 ? 100 : next;
      });

      if (currentPercent < 100 || !isReady) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isReady]);

  // Handle completion when progress reaches 100%
  useEffect(() => {
    if (progress >= 100 && isReady) {
      const holdTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 300); // 300ms hold at 100%

      const finishTimer = setTimeout(() => {
        setIsDone(true);
        if (onFinished) onFinished();
      }, 800); // 300ms hold + 500ms fade duration

      return () => {
        clearTimeout(holdTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [progress, isReady, onFinished]);

  if (isDone) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070913] text-white selection:bg-orange-500/30 overflow-hidden font-sans transition-opacity duration-500 ease-out p-6 select-none",
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100",
        className
      )}
    >
      {/* ─── CENTRAL WARM SPOTLIGHT AURA ─── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full bg-radial from-orange-500/15 via-orange-950/10 to-transparent blur-3xl" />
      </div>

      {/* ─── FLOATING EMBERS & SPARKLES ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 text-[#F97316] text-[10px] animate-bounce duration-1000 opacity-60">✦</div>
        <div className="absolute top-1/4 right-1/3 text-amber-400 text-xs animate-pulse opacity-40">★</div>
        <div className="absolute bottom-1/3 right-1/4 text-orange-400 text-[8px] animate-ping opacity-30">✦</div>
        <div className="absolute top-1/2 left-1/4 text-[#F97316] text-xs animate-pulse opacity-50">✧</div>
      </div>

      {/* ─── CENTER CONTENT CONTAINER ─── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full my-auto">
        
        {/* ─── CHEF ILLUSTRATION ─── */}
        <div className="relative flex items-center justify-center mb-6">
          <svg viewBox="0 0 320 320" className="w-64 h-64 sm:w-72 sm:h-72 drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]">
            {/* Dark Counter Base */}
            <rect x="40" y="240" width="240" height="8" rx="4" fill="#0F172A" />
            <line x1="40" y1="240" x2="280" y2="240" stroke="#F97316" strokeWidth="1" strokeOpacity="0.4" />

            {/* Plant on Left */}
            <path d="M70 240 L76 215 L94 215 L100 240 Z" fill="#1E293B" />
            <ellipse cx="85" cy="215" rx="12" ry="4" fill="#0F172A" />
            {/* Leaves */}
            <path d="M85 215 Q70 185 60 195 Q80 200 85 215 Z" fill="#22C55E" />
            <path d="M85 215 Q100 180 110 193 Q92 200 85 215 Z" fill="#16A34A" />
            <path d="M85 210 Q85 175 80 177 Q83 195 85 210 Z" fill="#4ADE80" />

            {/* Condiment Bottles on Right */}
            <rect x="220" y="195" width="13" height="45" rx="4" fill="#EF4444" />
            <path d="M224 195 L226.5 185 L229 195 Z" fill="#FCA5A5" />
            <rect x="238" y="190" width="13" height="50" rx="4" fill="#3B82F6" />
            <path d="M242 190 L244.5 180 L247 190 Z" fill="#93C5FD" />

            {/* Frying Pan on Stove */}
            <ellipse cx="160" cy="235" rx="35" ry="10" fill="#0F172A" />
            <rect x="125" y="225" width="70" height="12" rx="4" fill="#1E293B" />
            {/* Cooking Food Pieces in Pan */}
            <circle cx="145" cy="227" r="4" fill="#F97316" className="animate-bounce" />
            <circle cx="160" cy="225" r="5" fill="#EA580C" className="animate-bounce duration-700" />
            <circle cx="172" cy="228" r="4" fill="#F59E0B" className="animate-bounce duration-500" />

            {/* Steam Rising */}
            <g className="opacity-60">
              <path d="M145 215 Q140 200 148 185" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" fill="none" className="animate-pulse" />
              <path d="M160 215 Q168 195 160 180" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" fill="none" className="animate-pulse duration-700" />
              <path d="M175 215 Q170 202 178 188" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" fill="none" className="animate-pulse duration-1000" />
            </g>

            {/* Chef Body / Coat */}
            <path d="M125 150 Q160 140 195 150 L205 235 L115 235 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            {/* Dark Collar */}
            <path d="M140 148 L160 158 L180 148" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
            {/* Coat Buttons */}
            <circle cx="154" cy="175" r="3" fill="#0F172A" />
            <circle cx="154" cy="195" r="3" fill="#0F172A" />
            <circle cx="154" cy="215" r="3" fill="#0F172A" />

            {/* Chef Right Arm holding Spatula */}
            <path d="M120 155 Q100 170 120 190" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" fill="none" />
            <circle cx="120" cy="190" r="7" fill="#FED7AA" />
            {/* Spatula */}
            <rect x="117" y="140" width="5" height="50" rx="2" fill="#1E293B" />
            <rect x="112" y="130" width="15" height="18" rx="2" fill="#334155" />
            <line x1="116" y1="134" x2="116" y2="142" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="119.5" y1="134" x2="119.5" y2="142" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="123" y1="134" x2="123" y2="142" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Chef Left Arm */}
            <path d="M200 155 Q215 175 205 195" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" fill="none" />
            <circle cx="205" cy="195" r="7" fill="#FED7AA" />

            {/* Chef Head & Face */}
            <circle cx="160" cy="120" r="28" fill="#FED7AA" />
            {/* Hair */}
            <path d="M136 108 Q160 95 184 108 Q180 98 160 98 Q140 98 136 108 Z" fill="#0F172A" />
            {/* Happy Eyes */}
            <path d="M148 118 Q152 112 156 118" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M164 118 Q168 112 172 118" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Rosy Cheeks */}
            <circle cx="145" cy="123" r="4" fill="#FCA5A5" opacity="0.6" />
            <circle cx="175" cy="123" r="4" fill="#FCA5A5" opacity="0.6" />
            {/* Big Smile */}
            <path d="M152 126 Q160 136 168 126 Z" fill="#EF4444" />

            {/* Puffy White Chef Hat */}
            <path d="M134 100 C120 95 120 75 136 70 C134 50 155 45 160 55 C170 45 190 50 186 70 C200 75 200 95 186 100 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
            <rect x="135" y="94" width="50" height="12" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          </svg>
        </div>

        {/* ─── BRANDING ─── */}
        <div className="flex flex-col items-center space-y-1 mb-8">
          <div className="text-2xl sm:text-3xl font-black tracking-tight flex items-center leading-none">
            <span className="text-white">Dhadhan</span>
            <span className="text-[#F97316] ml-2">Hub</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-slate-400 tracking-wide">
            Smart Restaurant. Simple Success.
          </span>
        </div>

        {/* ─── PROGRESS BAR ─── */}
        <div className="w-full max-w-xs space-y-4">
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/30 p-0 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#F97316] rounded-full transition-all duration-200 ease-out shadow-[0_0_12px_rgba(249,115,22,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Muted Footer Status */}
          <p className="text-xs font-medium text-slate-400">
            {label || 'Preparing your restaurant workspace...'}
          </p>
        </div>

      </div>
    </div>
  );
};
