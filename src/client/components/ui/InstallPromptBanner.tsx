import React, { useState, useEffect } from 'react';
import { Smartphone, Check, X, Download, Share } from 'lucide-react';

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA or native app)
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(checkStandalone);
    if (checkStandalone) return;

    // Check if user previously dismissed prompt within 7 days
    const dismissedTime = localStorage.getItem('dhadhan_install_dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIOSDevice && isSafari && !checkStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
      return;
    }

    // Listen for BeforeInstallPromptEvent on Chrome/Edge/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log('[PWA] Dhadhan Hub was installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('dhadhan_install_dismissed', Date.now().toString());
    setShowPrompt(false);
    setShowIOSGuide(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* ─── MAIN INSTALL PROMPT MODAL / BANNER ─── */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-[9990] animate-slide-up">
        <div className="bg-[#0B1630] border border-slate-700/60 rounded-3xl p-5 sm:p-6 text-white shadow-2xl backdrop-blur-xl relative flex flex-col gap-4">
          {/* Close button */}
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
            title="Maybe Later"
          >
            <X size={18} />
          </button>

          {/* Header Section */}
          <div className="flex items-center gap-3 pr-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#ea580c] p-2.5 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <Smartphone className="w-full h-full text-white" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white leading-tight flex items-center gap-2">
                📱 Install Dhadhan Hub
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Install Dhadhan Hub for the best experience.
              </p>
            </div>
          </div>

          {/* Benefits Checklist */}
          <div className="bg-slate-900/70 rounded-2xl p-3.5 border border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-black uppercase text-[#F97316] tracking-widest block mb-1">
              Benefits:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium text-slate-200">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
                <span>Works like a native app</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
                <span>Faster startup</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
                <span>Full-screen mode</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
                <span>Automatic updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
                <span>Offline support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
                <span>One-click access</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-3 px-4 bg-[#F97316] hover:bg-[#ea580c] text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] cursor-pointer"
            >
              <Download size={16} /> Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      {/* ─── iOS SAFARI INSTRUCTION MODAL ─── */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[9999] bg-[#0B1630]/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-[#0B1630] space-y-5 shadow-2xl relative animate-scale-in">
            <button 
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0 font-bold text-xl">
                📱
              </div>
              <div>
                <h4 className="font-black text-base text-[#0B1630]">Install on iPhone / iPad</h4>
                <p className="text-xs text-slate-500 font-medium">Follow 2 quick steps in Safari</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F97316] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <p className="mt-0.5">Tap the <span className="font-bold text-[#0B1630] flex inline-items-center gap-1"><Share size={13} className="inline text-blue-500" /> Share</span> button at the bottom of Safari.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F97316] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <p className="mt-0.5">Scroll down and tap <span className="font-bold text-[#0B1630]">"Add to Home Screen"</span>.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3.5 bg-[#0B1630] text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-900 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
