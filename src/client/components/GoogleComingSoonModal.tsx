import React, { useEffect, useState, useRef } from 'react';
import { 
  X, 
  Mail, 
  Coins, 
  TrendingUp, 
  Award, 
  Clock, 
  Lock, 
  ChevronsRight, 
  Shield, 
  Link as LinkIcon, 
  Play,
  Trophy,
  Sparkles
} from 'lucide-react';
import { toast } from '../lib/toast-store';

interface GoogleComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Stage {
  name: string;
  icon: string;
  milestone: number;
  perTap: number;
  description: string;
}

const STAGES: Stage[] = [
  { name: 'Food Cart', icon: '🍽️', milestone: 100, perTap: 10, description: 'A street-side food stand.' },
  { name: 'Small Café', icon: '☕', milestone: 300, perTap: 20, description: 'Neighborhood coffee & pastry shop.' },
  { name: 'Restaurant', icon: '🍕', milestone: 700, perTap: 45, description: 'Full casual dining experience.' },
  { name: 'Premium Restaurant', icon: '🏨', milestone: 1200, perTap: 90, description: 'Fine-dining top culinary site.' },
  { name: 'Franchise', icon: '🌍', milestone: 2000, perTap: 175, description: 'Multi-location national brand.' },
  { name: 'VALO Enterprise', icon: '🚀', milestone: 999999, perTap: 350, description: 'Leading global digital food empire.' }
];

interface FloatingCoin {
  id: number;
  x: number;
  y: number;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
}

export const GoogleComingSoonModal: React.FC<GoogleComingSoonModalProps> = ({ isOpen, onClose }) => {
  const [coins, setCoins] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);

  const nextId = useRef(0);

  // Audio synthesis using Web Audio API
  const playSound = (type: 'tap' | 'upgrade' | 'achievement') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'upgrade') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, ctx.currentTime);
        osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'achievement') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn('Audio synthesis not supported or blocked:', e);
    }
  };

  // Reset state when game modal opens
  useEffect(() => {
    if (isOpen) {
      setCoins(0);
      setStageIndex(0);
      setTimeLeft(30);
      setFloatingCoins([]);
      setConfetti([]);
      setAchievements([]);
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || stageIndex === STAGES.length - 1 || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, stageIndex, timeLeft]);

  if (!isOpen) return null;

  const currentStage = STAGES[stageIndex];
  const isMaxStage = stageIndex === STAGES.length - 1;
  const isGameOver = timeLeft === 0 || isMaxStage;
  const targetCoins = currentStage.milestone;

  // Add Achievement
  const unlockAchievement = (name: string) => {
    if (!achievements.includes(name)) {
      setAchievements(prev => [...prev, name]);
      playSound('achievement');
      toast.success('🏆 Achievement Unlocked', name);
    }
  };

  // Handle Tap
  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isGameOver) return;

    playSound('tap');
    const reward = currentStage.perTap;
    const newCoins = coins + reward;
    setCoins(newCoins);

    // Floating coin text coords
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const coinId = nextId.current++;

    setFloatingCoins(prev => [...prev, { id: coinId, x, y }]);
    setTimeout(() => {
      setFloatingCoins(prev => prev.filter(c => c.id !== coinId));
    }, 800);

    // Achievement: First Sale
    if (coins === 0) {
      unlockAchievement('First Sale');
    }

    // Check for level upgrades
    let targetIndex = stageIndex;
    while (targetIndex < STAGES.length - 1 && newCoins >= STAGES[targetIndex].milestone) {
      targetIndex++;
    }

    if (targetIndex > stageIndex) {
      setStageIndex(targetIndex);
      playSound('upgrade');

      // Confetti burst
      const colors = ['#F97316', '#3B82F6', '#10B981', '#FBBF24', '#EC4899'];
      const pieces = Array.from({ length: 45 }).map(() => ({
        id: nextId.current++,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.4
      }));
      setConfetti(pieces);
      setTimeout(() => setConfetti([]), 2500);

      if (targetIndex === 1) unlockAchievement('Coffee Master');
      if (targetIndex === 2) unlockAchievement('Pizza Champion');
      if (targetIndex === 4) unlockAchievement('Revenue Booster');
      if (targetIndex === 5) unlockAchievement('Enterprise Owner');
    }
  };

  // Progress calculations
  const previousMilestone = stageIndex === 0 ? 0 : STAGES[stageIndex - 1].milestone;
  const stageTotalCoinsNeeded = targetCoins - previousMilestone;
  const coinsEarnedInCurrentStage = coins - previousMilestone;
  const progressPercent = isMaxStage 
    ? 100 
    : Math.min(100, Math.max(0, (coinsEarnedInCurrentStage / stageTotalCoinsNeeded) * 100));

  // Current milestone label
  const nextUpgradeLabel = isMaxStage ? 'Max Level' : `${coinsEarnedInCurrentStage} / ${stageTotalCoinsNeeded}`;

  // Achievements preview text
  const currentAchievementInfo = achievements.length === 0 
    ? { title: 'First Sale', desc: 'Make your first revenue!', progress: '0 / 1' }
    : achievements.length < STAGES.length - 1
    ? { title: 'Expanding Empire', desc: 'Keep upgrading to unlock next reward.', progress: `${achievements.length} / 5` }
    : { title: 'Enterprise Legend', desc: 'Completed all upgrades!', progress: '5 / 5' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Styles for CSS Keyframes */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, -50%) translateY(0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-90px) scale(0.7); opacity: 0; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(480px) rotate(360deg); opacity: 0; }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.6; }
          100% { transform: scale(0.95); opacity: 0.2; }
        }
        .animate-float-up {
          animation: floatUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .animate-confetti {
          animation: confettiFall 2.2s linear forwards;
        }
        .pulse-glow-ring {
          animation: pulseRing 3s infinite ease-in-out;
        }
      `}</style>

      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0B1630]/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Confetti canvas simulation inside modal bounds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {confetti.map(p => (
          <div
            key={p.id}
            className="absolute top-1/4 animate-confetti w-2 h-2 rounded-sm"
            style={{
              left: `${p.x}%`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Modal Container */}
      <div className="bg-[#0f1b35] w-full max-w-5xl rounded-[32px] border border-[#213565] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* LEFT PANEL: Google Sign-In promo details */}
        <div className="w-full md:w-[35%] bg-[#081023] p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-12 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            {/* Tag badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-500/10 text-[#F97316]">
              ✦ Coming Soon
            </span>

            {/* Typography title */}
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                Google Sign-In
              </h2>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-[#F97316] bg-clip-text text-transparent">
                Coming Soon
              </h3>
            </div>

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              We're preparing a secure and seamless Google authentication experience for you. While we're cooking something awesome, enjoy a quick game!
            </p>

            {/* Bullet features list */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Shield size={12} className="text-emerald-400" />
                </div>
                <span>One-click secure login</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                  <img src="https://www.google.com/favicon.ico" className="w-3.5 h-3.5" alt="Google" />
                </div>
                <span>Google Workspace support</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                <div className="w-5 h-5 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
                  <LinkIcon size={12} className="text-purple-400" />
                </div>
                <span>Automatic account linking</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold">
                <div className="w-5 h-5 rounded-md bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Shield size={12} className="text-teal-400" />
                </div>
                <span>Enterprise-grade security</span>
              </div>
            </div>
          </div>

          {/* Glowing Google Circle at Bottom */}
          <div className="mt-8 flex flex-col items-center justify-center relative z-10">
            <div className="w-24 h-24 rounded-full bg-[#0d162d] border border-slate-800 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border border-orange-500/30 pulse-glow-ring pointer-events-none" />
              <img src="https://www.google.com/favicon.ico" className="w-10 h-10" alt="Google" />
            </div>
            <span className="mt-2 text-[9px] font-black uppercase tracking-widest text-[#F97316]">
              Coming Soon
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Restaurant Tycoon Game */}
        <div className="w-full md:w-[65%] p-6 md:p-8 flex flex-col justify-between relative bg-[#0f1b35]">
          
          {/* Header Row */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍳</span>
              <h1 className="text-sm font-black text-white uppercase tracking-widest">
                VALO Restaurant Tycoon
              </h1>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition-all cursor-pointer border border-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          {!isGameOver ? (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {/* Coins card */}
                <div className="bg-[#152345] border border-[#213565] rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Coins size={20} className="animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Coins</span>
                    <span className="text-md font-black text-white">{coins}</span>
                  </div>
                </div>

                {/* Per tap card */}
                <div className="bg-[#152345] border border-[#213565] rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Per Tap</span>
                    <span className="text-md font-black text-white">+{currentStage.perTap}</span>
                  </div>
                </div>

                {/* Level card */}
                <div className="bg-[#152345] border border-[#213565] rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Award size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Level</span>
                    <span className="text-xs font-black text-white truncate w-24 block mt-0.5">{currentStage.name}</span>
                  </div>
                </div>

                {/* Progress bar card */}
                <div className="bg-[#152345] border border-[#213565] rounded-2xl p-3.5">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    <span>Next Upgrade</span>
                    <span>{nextUpgradeLabel}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-[#F97316] rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Visual Restaurant Evolution Gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-6">
                {/* Active Card */}
                <div className="bg-gradient-to-b from-[#1a2d58] to-[#122042] border-2 border-orange-500/40 rounded-3xl p-5 text-center flex flex-col items-center justify-center relative overflow-hidden h-44 shadow-lg shadow-orange-500/5">
                  <div className="absolute top-0 right-0 p-3 text-orange-400/10 pointer-events-none">
                    <Sparkles size={64} />
                  </div>
                  <span className="text-5xl mb-2 animate-bounce">{currentStage.icon}</span>
                  <h3 className="text-sm font-black text-white mt-1">{currentStage.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-snug">{currentStage.description}</p>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex justify-center text-slate-600">
                  <ChevronsRight size={24} className="animate-pulse" />
                </div>

                {/* Locked Future upgrade card */}
                <div className="bg-[#111e3b] border border-[#1c2e5a] rounded-3xl p-5 text-center flex flex-col items-center justify-center h-44 relative opacity-60">
                  <div className="absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center z-10 backdrop-blur-[1px]">
                    <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 shadow-md">
                      <Lock size={16} />
                    </div>
                  </div>
                  <span className="text-4xl mb-2 grayscale">
                    {stageIndex + 1 < STAGES.length ? STAGES[stageIndex + 1].icon : '👑'}
                  </span>
                  <h3 className="text-xs font-black text-slate-400 mt-1">
                    {stageIndex + 1 < STAGES.length ? STAGES[stageIndex + 1].name : 'Future Stage'}
                  </h3>
                  <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                    {stageIndex + 1 < STAGES.length ? `Unlock at $${STAGES[stageIndex].milestone}` : 'MAX LEVEL'}
                  </p>
                </div>
              </div>

              {/* Progress Timeline indicating steps 1 to 6 */}
              <div className="mb-6 bg-[#111e3b] rounded-2xl p-4 border border-[#1c2e5a]">
                <div className="relative flex justify-between items-center w-full">
                  {/* Timeline Horizontal Line background */}
                  <div className="absolute left-2 right-2 top-3.5 h-1 bg-slate-800 z-0 rounded-full" />
                  {/* Filled track line progress */}
                  <div 
                    className="absolute left-2 top-3.5 h-1 bg-gradient-to-r from-orange-400 to-[#F97316] z-0 rounded-full transition-all duration-500"
                    style={{ width: `${(stageIndex / (STAGES.length - 1)) * 100}%` }}
                  />

                  {STAGES.map((s, idx) => {
                    const isUnlocked = idx <= stageIndex;
                    const isActive = idx === stageIndex;
                    return (
                      <div key={idx} className="flex flex-col items-center z-10 relative">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 border ${
                            isActive 
                              ? 'bg-[#F97316] text-white border-[#F97316] scale-110 shadow-lg shadow-orange-500/20' 
                              : isUnlocked 
                              ? 'bg-gradient-to-b from-orange-400 to-orange-600 text-white border-orange-500' 
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider mt-1.5 hidden lg:block ${isActive ? 'text-orange-400' : 'text-slate-500'}`}>
                          {s.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom: Collector button & Achievement row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
                {/* Collect button (left) */}
                <div className="lg:col-span-3">
                  <button
                    onClick={handleTap}
                    className="w-full h-20 rounded-2xl bg-gradient-to-r from-orange-400 to-[#F97316] text-white hover:from-orange-500 hover:to-[#ea580c] transition-all flex flex-col items-center justify-center relative cursor-pointer active:scale-[0.98] select-none shadow-lg shadow-orange-500/20 select-none overflow-hidden"
                  >
                    {/* Floating coin labels */}
                    {floatingCoins.map(fc => (
                      <span
                        key={fc.id}
                        className="absolute text-white font-black text-sm animate-float-up pointer-events-none select-none z-20"
                        style={{ left: fc.x, top: fc.y }}
                      >
                        +{currentStage.perTap}
                      </span>
                    ))}
                    
                    <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                      ⚡ Tap to Collect Revenue
                    </span>
                    <span className="text-[10px] opacity-85 font-medium mt-0.5">
                      Generate revenue and grow your restaurant!
                    </span>
                  </button>
                </div>

                {/* Achievements progress box */}
                <div className="lg:col-span-2 bg-[#152345] border border-[#213565] rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#081023] flex items-center justify-center text-emerald-400 shrink-0">
                    <Trophy size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Achievement</span>
                    <span className="text-xs font-black text-white truncate block mt-0.5">{currentAchievementInfo.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium truncate block mt-0.5">{currentAchievementInfo.desc}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* COMPLETION OR TIME UP SCREEN */
            <div className="text-center flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center text-5xl mb-5 animate-bounce">
                👑
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight">
                {timeLeft === 0 ? "⏱️ Time's Up!" : "🎉 Congratulations!"}
              </h2>
              <p className="text-sm text-orange-400 font-bold mt-1">
                {timeLeft === 0 
                  ? `You reached the ${currentStage.name}!` 
                  : "You built a restaurant empire."
                }
              </p>

              <p className="text-xs text-slate-400 font-semibold leading-relaxed mt-4 max-w-sm">
                {timeLeft === 0
                  ? `You managed to collect $${coins} in 30 seconds. Imagine what you'll build when you use VALO-REST's real inventory management, kitchen queue screens, and POS suite!`
                  : "In less than 30 seconds, you scaled from a Food Cart to a global VALO Enterprise. Imagine what you'll build with the real VALO-REST POS and kitchen workflow suite."
                }
              </p>

              {/* End status box */}
              <div className="w-full bg-[#152345] border border-[#213565] rounded-3xl p-5 mt-6 max-w-sm flex items-center gap-4 text-left">
                <span className="text-4xl">{currentStage.icon}</span>
                <div>
                  <h4 className="font-black text-[10px] text-orange-400 tracking-wider uppercase">Final Result</h4>
                  <h3 className="font-black text-md text-white mt-0.5">{currentStage.name}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Total Coins collected: ${coins}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full space-y-2 mt-6 max-w-sm">
                <button 
                  onClick={onClose}
                  className="w-full h-12 rounded-2xl bg-[#F97316] text-white font-black text-xs uppercase tracking-wider hover:bg-[#EA580C] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  <Mail size={14} />
                  Continue with Email
                </button>

                <button 
                  onClick={onClose}
                  className="w-full h-12 rounded-2xl border border-slate-700 text-slate-400 font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                >
                  Close Game
                </button>
              </div>
            </div>
          )}

          {/* Footer Controls Row */}
          {!isGameOver && (
            <div className="mt-8 border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>🎮 Build your empire. One tap at a time.</span>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                {/* Countdown Timer */}
                <div className="flex items-center gap-2 text-xs font-black text-slate-300">
                  <Clock size={14} className="text-orange-400" />
                  <span>Game ends in: 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                </div>

                {/* Skip game */}
                <button 
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer border border-slate-800"
                >
                  <Play size={12} className="rotate-180 text-orange-400" strokeWidth={3} />
                  Skip Game
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
