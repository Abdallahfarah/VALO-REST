import { 
  LayoutDashboard, 
  MonitorSmartphone, 
  ChefHat, 
  Armchair, 
  Receipt, 
  MenuSquare,
  UserCog,
  BarChart,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

const navSections = [
  {
    title: 'OPERATIONAL',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'POS', path: '/admin/pos', icon: MonitorSmartphone },
      { name: 'Kitchen Queue', path: '/admin/kitchen', icon: ChefHat },
      { name: 'Tables', path: '/admin/tables', icon: Armchair },
      { name: 'Orders', path: '/admin/orders', icon: Receipt },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Menu', path: '/admin/menu', icon: MenuSquare },
      { name: 'Staff', path: '/admin/staff', icon: UserCog },
      { name: 'Reports', path: '/admin/reports', icon: BarChart },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  }
];

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { signOut } = useAuth();
  const { tenant } = useTenant();

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
        "w-[260px] h-screen bg-[#0B1630] flex flex-col fixed left-0 top-0 overflow-y-auto transition-all duration-300 z-50 lg:translate-x-0 border-r border-[#1A2A52]/20",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 pt-8">
        <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center shadow-md shadow-orange-500/10 shrink-0 select-none">
          <span className="text-white font-extrabold text-lg leading-none tracking-tight">VX</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white font-black text-base leading-tight truncate">{tenant?.name || 'VALO HQ'}</span>
          <span className="text-[#F97316] text-[9px] font-black tracking-widest mt-1 uppercase">RETAIL NODE</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 mt-4 h-full flex flex-col space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <span className="text-[#64748B] text-[10px] font-black px-4 tracking-widest mb-3 block uppercase">
              {section.title}
            </span>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                   key={item.name}
                   to={item.path}
                   end={item.path === '/admin'}
                   className={({ isActive }) =>
                     cn(
                       "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 mt-1 font-medium tracking-wide",
                       isActive 
                         ? "bg-[#1A2A52]/60 text-white shadow-sm border-l-[3px] border-[#F97316] pl-[13px]" 
                         : "text-[#CBD5E1] hover:bg-[#1A2A52]/40 hover:text-white border-l-[3px] border-transparent"
                     )
                   }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon 
                        className={cn("w-[18px] h-[18px] transition-colors", isActive ? "text-[#F97316]" : "text-inherit")} 
                        strokeWidth={2.2}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer minimal */}
      <div className="mt-auto px-6 py-4 border-t border-[#1A2A52]/40">
        <div className="flex items-center justify-between">
          <NavLink to="/admin/settings" className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors text-xs font-semibold tracking-wider">
            <Settings className="w-4 h-4" />
            SETTINGS
          </NavLink>
          <button 
            onClick={signOut}
            className="flex items-center gap-2 text-[#EF4444] hover:text-[#FCA5A5] transition-colors text-xs font-semibold tracking-wider cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            LOGOUT
          </button>
        </div>
      </div>
    </aside>
   </>
  );
};
