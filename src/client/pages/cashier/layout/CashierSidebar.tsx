import { 
  CreditCard, 
  Receipt, 
  LogOut,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export interface CashierSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CashierSidebar = ({ isOpen, onClose }: CashierSidebarProps) => {
  const { signOut } = useAuth();
  const { tenant } = useTenant();

  const navSections: NavSection[] = [
    {
      title: 'OPERATIONAL',
      items: [
        { name: 'Payments', path: '/cashier', icon: CreditCard },
        { name: 'Receipts', path: '/cashier/receipts', icon: Receipt },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { name: 'VALO AI Assistant', path: '/cashier/ai', icon: Sparkles },
      ],
    }
  ];

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
        <div className="flex items-center justify-between px-6 py-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F97316] rounded flex items-center justify-center overflow-hidden p-1 shadow-md shadow-orange-500/10 shrink-0 select-none">
              <img src="/dhadhan-logo.png" alt="Dhadhan Hub" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-none drop-shadow-sm truncate max-w-[150px]">{tenant?.name || 'RESTAURANT'}</span>
              <span className="text-[#F97316] text-[10px] font-bold tracking-wider mt-1 uppercase">RESTAURANT POS</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors lg:hidden cursor-pointer">
            <ChevronLeft size={20} />
          </button>
        </div>

      {/* Navigation */}
      <div className="flex-1 px-4 mt-2 h-full flex flex-col space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <span className="text-[#64748B] text-xs font-semibold px-4 tracking-wider mb-2 block uppercase">
              {section.title}
            </span>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/cashier'}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors duration-200 mt-1",
                      isActive 
                        ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/20" 
                        : "text-[#CBD5E1] hover:bg-[#1A2A52] hover:text-white border-l-4 border-transparent"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <item.icon 
                          className={cn("w-[18px] h-[18px]", isActive ? "text-white" : "text-inherit")} 
                          strokeWidth={2}
                        />
                        <span className="font-bold tracking-wide">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full",
                          isActive ? "bg-white text-[#F97316]" : "bg-[#4F46E5] text-white"
                        )}>
                          {item.badge}
                        </span>
                      )}
                      {item.name === 'VALO AI Assistant' && (
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase",
                          isActive ? "bg-white text-[#F97316]" : "bg-[#F97316] text-white"
                        )}>
                          ENT
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="px-6 py-4 mx-4 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Online</span>
        </div>
        <p className="text-white/60 text-[10px]">You're ready to receive payments</p>
      </div>

      {/* Logout */}
      <div className="px-6 py-8 border-t border-[#1A2A52]/40">
        <button 
          onClick={signOut}
          className="flex items-center gap-2 text-[#CBD5E1] hover:text-white transition-colors text-sm font-semibold tracking-wider w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
   </>
  );
};
