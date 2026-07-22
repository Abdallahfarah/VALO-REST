import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { WaiterSidebar } from './WaiterSidebar';
import { WaiterHeader } from './WaiterHeader';
import { ValoSaaSBackground } from '../../../components/layout/ValoSaaSBackground';
import { LayoutDashboard, MonitorSmartphone, Armchair, Receipt } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { InstallPromptBanner } from '../../../components/ui/InstallPromptBanner';

export const WaiterLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const bottomNavItems = [
    { name: 'Dashboard', path: '/waiter', icon: LayoutDashboard },
    { name: 'POS', path: '/waiter/pos', icon: MonitorSmartphone },
    { name: 'Tables', path: '/waiter/tables', icon: Armchair },
    { name: 'My Orders', path: '/waiter/orders', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-[#070913] text-[#F8FAFC] font-sans relative overflow-x-hidden restaurant-portal">
      <WaiterSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-[260px] pl-0 flex flex-col min-h-screen">
        <WaiterHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="relative flex-1 p-4 sm:p-8 pb-24 lg:pb-8 overflow-y-auto">
          <ValoSaaSBackground type="waiter" />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* --- RESPONSIVE BOTTOM NAVIGATION (Tablet Portrait & Mobile) --- */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#090D1F]/90 backdrop-blur-md border-t border-[#232B5E]/30 flex items-center justify-around px-4 z-40 lg:hidden shadow-lg shadow-black/20">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/waiter'}
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

      <InstallPromptBanner />
    </div>
  );
};
