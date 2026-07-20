import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { KDSSidebar } from './KDSSidebar';
import { KDSHeader } from './KDSHeader';
import { ValoSaaSBackground } from '../../../components/layout/ValoSaaSBackground';
import { cn } from '../../../lib/utils';
import { Receipt, BarChart2, MessageSquare, MoreHorizontal } from 'lucide-react';

const bottomNavItems = [
  { name: 'My Orders', path: '/kds', icon: Receipt },
  { name: 'Reports',   path: '/kds/reports', icon: BarChart2 },
  { name: 'Messages',  path: '/kds/messages', icon: MessageSquare },
  { name: 'More',      path: '/kds/more', icon: MoreHorizontal },
];

export const KDSLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#070913] text-[#94A3B8] font-sans relative overflow-x-hidden restaurant-portal">
      <KDSSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-[260px] pl-0 flex flex-col min-h-screen">
        <KDSHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="relative flex-1 p-4 sm:p-8 pb-24 lg:pb-8 overflow-y-auto">
          <ValoSaaSBackground type="kds" />

          {/* Responsive restaurant-themed background artwork (mobile/tablet only) */}
          <div className="lg:hidden fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* large faint chef hat */}
            <svg className="absolute -top-10 -right-10 w-80 h-80 opacity-[0.03] text-white" viewBox="0 0 100 100" fill="currentColor">
              <ellipse cx="50" cy="72" rx="30" ry="10"/>
              <path d="M20 72 Q20 40 50 35 Q80 40 80 72 Z"/>
              <ellipse cx="50" cy="36" rx="18" ry="14"/>
              <circle cx="30" cy="32" r="12"/>
              <circle cx="70" cy="32" r="12"/>
            </svg>
            {/* fork & knife bottom-left */}
            <svg className="absolute bottom-20 -left-6 w-48 h-48 opacity-[0.04] text-white rotate-12" viewBox="0 0 60 120" fill="currentColor">
              <rect x="27" y="0" width="6" height="120" rx="3"/>
              <rect x="10" y="0" width="4" height="50" rx="2"/>
              <rect x="46" y="0" width="4" height="50" rx="2"/>
              <path d="M10 50 Q28 60 28 80 L32 80 Q32 60 50 50 L50 0"/>
            </svg>
            {/* plate outline centre-right */}
            <svg className="absolute top-1/2 -right-16 -translate-y-1/2 w-64 h-64 opacity-[0.025] text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="50" cy="50" r="45"/>
              <circle cx="50" cy="50" r="35"/>
              <circle cx="50" cy="50" r="20"/>
            </svg>
            {/* coffee cup top-left */}
            <svg className="absolute top-32 -left-8 w-40 h-40 opacity-[0.04] text-white" viewBox="0 0 80 80" fill="currentColor">
              <rect x="10" y="30" width="40" height="35" rx="4"/>
              <path d="M50 38 Q65 38 65 48 Q65 58 50 58" fill="none" stroke="currentColor" strokeWidth="4"/>
              <rect x="15" y="22" width="30" height="10" rx="3"/>
              <path d="M22 18 Q22 10 28 10 Q28 18 28 18" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M32 16 Q32 8 38 8 Q38 16 38 16" fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>

          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── RESPONSIVE BOTTOM NAVIGATION (Tablet Portrait & Mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#070913]/90 backdrop-blur-md border-t border-[#232B5E]/20 flex items-center justify-around px-4 z-40 lg:hidden shadow-lg shadow-black/20">
        {bottomNavItems.map((item) => {
          const isActive = item.name === 'My Orders' 
            ? (location.pathname === '/kds' || location.pathname === '/kds/')
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={(e) => {
                if (item.name === 'More') {
                  e.preventDefault();
                  setIsSidebarOpen(true);
                }
              }}
              className={
                cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 py-1 px-3 rounded-xl",
                  isActive
                    ? "text-[#F97316]"
                    : "text-[#94A3B8] hover:text-white"
                )
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
