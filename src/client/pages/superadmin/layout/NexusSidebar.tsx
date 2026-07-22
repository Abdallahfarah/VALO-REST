import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Store, CreditCard, UserPlus, 
  LineChart, ClipboardList, Activity,
  Settings, LogOut, Server
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';

const navItems = [
  { name: 'Platform Overview', path: '/platform/overview', icon: LayoutDashboard },
  { name: 'Platform Reports', path: '/platform/reports', icon: LineChart },
  { name: 'Restaurants', path: '/platform/restaurants', icon: Store },
  { name: 'Subscriptions', path: '/platform/subscriptions', icon: CreditCard },
  { name: 'User Provisioning', path: '/platform/provisioning', icon: UserPlus },
  { name: 'Platform Revenue', path: '/platform/revenue', icon: LineChart },
  { name: 'Audit Logs', path: '/platform/audit', icon: ClipboardList },
  { name: 'System Health', path: '/platform/health', icon: Activity },
];

export interface NexusSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const NexusSidebar = ({ isOpen, onClose }: NexusSidebarProps) => {
  const { signOut } = useAuth();
  return (
    <>
      {/* Mobile Sidebar Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[49] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "w-[260px] h-screen bg-[#0B1630] flex flex-col fixed left-0 top-0 overflow-y-auto transition-transform duration-300 z-50 lg:translate-x-0 lg:flex",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Brand Header */}
      <div className="px-6 pt-10 pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#F97316] to-[#ea580c] shadow-lg shadow-[#F97316]/20">
          <Server className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-[19px] tracking-wide leading-none">DHADHAN NEXUS</span>
          <span className="text-[#94A3B8] text-xs mt-1 font-medium tracking-wide">Global Architecture</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 mt-2 space-y-1.5 relative z-10">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm transition-all duration-200 mt-1 border-l-4",
                isActive 
                  ? "bg-[#1A2A52] text-white shadow-sm font-semibold border-[#F97316]" 
                  : "text-[#94A3B8] hover:bg-[#1A2A52]/50 hover:text-white border-transparent font-medium"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={cn("w-[20px] h-[20px]", isActive ? "text-[#F97316]" : "text-inherit")} 
                  strokeWidth={2}
                />
                <span className="font-medium tracking-wide">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer Deploy CTA and settings */}
      <div className="mt-auto p-4 flex flex-col gap-4 relative z-10 bg-gradient-to-t from-[#0B1630] via-[#0B1630] to-transparent pt-10">
        <button className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#F97316]/20 transition-all">
          <Server className="w-[18px] h-[18px]" />
          Deploy Cluster
        </button>
        
        <div className="flex flex-col gap-1 mt-2 mb-2">
           <button className="flex items-center gap-3 px-4 py-2.5 text-[#94A3B8] hover:text-white transition-colors text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/5">
             <Settings className="w-4 h-4" />
             SETTINGS
           </button>
           <button 
             onClick={signOut}
             className="flex items-center gap-3 px-4 py-2.5 text-[#EF4444] hover:text-[#FCA5A5] transition-colors text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/5 w-full text-left"
           >
             <LogOut className="w-4 h-4" />
             LOGOUT
           </button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-[260px] h-[300px] pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/60 via-transparent to-transparent mix-blend-screen" />
    </aside>
   </>
  );
};
