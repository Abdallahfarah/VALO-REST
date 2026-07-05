import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CashierSidebar } from './CashierSidebar';
import { CashierHeader } from './CashierHeader';
import { ValoAiPanel } from '../../../components/ValoAiPanel';
import { Sparkles } from 'lucide-react';
import { RestaurantIdentityHeader } from '../../../components/layout/RestaurantIdentityHeader';

export const CashierLayout = () => {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <CashierSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-[260px] pl-0 flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <CashierHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
            <Outlet />
          </main>
          {isAiOpen && (
            <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col shadow-2xl shrink-0 animate-in slide-in-from-right duration-200 h-[50vh] lg:h-auto">
              <ValoAiPanel onClose={() => setIsAiOpen(false)} />
            </div>
          )}
        </div>

        {/* Floating Quick Toggle */}
        <button 
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#0B1630] hover:bg-slate-800 text-[#F97316] rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-950/20 hover:scale-105 active:scale-95 transition-all cursor-pointer z-50 border border-slate-700/30"
          title="VALO AI Operations Copilot"
        >
          <Sparkles size={24} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 bg-[#F97316] text-white text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-wider leading-none shadow-sm">
            AI
          </span>
        </button>
      </div>
    </div>
  );
};
