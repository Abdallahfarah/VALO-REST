import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { CashierSidebar } from './CashierSidebar';
import { CashierHeader } from './CashierHeader';
import { ValoAiPanel } from '../../../components/ValoAiPanel';
import { Sparkles, CreditCard, Receipt, MessageSquare } from 'lucide-react';
import { ValoSaaSBackground } from '../../../components/layout/ValoSaaSBackground';
import { cn } from '../../../lib/utils';

export const CashierLayout = () => {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const bottomNavItems = [
    { name: 'Payments', path: '/cashier', icon: CreditCard },
    { name: 'Receipts', path: '/cashier/receipts', icon: Receipt },
    { name: 'Messages', path: '/cashier/messages', icon: MessageSquare },
    { name: 'AI Copilot', path: '/cashier/ai', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#070913] text-[#F8FAFC] font-sans relative overflow-x-hidden flex flex-col lg:flex-row restaurant-portal">
      <CashierSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-[260px] pl-0 flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <CashierHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          <main className="relative flex-1 p-4 sm:p-8 pb-24 lg:pb-8 overflow-y-auto">
            <ValoSaaSBackground type="cashier" />
            <div className="relative z-10">
              <Outlet />
            </div>
          </main>
          {isAiOpen && (
            <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l lg:border-slate-200 border-[#232B5E]/30 lg:bg-white bg-[#131A38]/95 backdrop-blur-md lg:backdrop-blur-none flex flex-col shadow-2xl shrink-0 animate-in slide-in-from-right duration-200 h-[50vh] lg:h-auto z-10 text-white lg:text-[#0B1630]">
              <ValoAiPanel onClose={() => setIsAiOpen(false)} />
            </div>
          )}
        </div>

        {/* Floating Quick Toggle */}
        <button 
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="fixed bottom-20 lg:bottom-6 right-6 w-14 h-14 bg-[#0B1630] hover:bg-slate-800 text-[#F97316] rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-950/20 hover:scale-105 active:scale-95 transition-all cursor-pointer z-50 border border-slate-700/30"
          title="DHADHAN AI Operations Copilot"
        >
          <Sparkles size={24} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 bg-[#F97316] text-white text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-wider leading-none shadow-sm">
            AI
          </span>
        </button>
      </div>

      {/* --- RESPONSIVE BOTTOM NAVIGATION (Tablet Portrait & Mobile) --- */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#090D1F]/90 backdrop-blur-md border-t border-[#232B5E]/30 flex items-center justify-around px-4 z-40 lg:hidden shadow-lg shadow-black/20">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/cashier'}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-205 py-1 px-3 rounded-xl",
                isActive 
                  ? "text-[#F97316]" 
                  : "text-[#94A3B8] hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
