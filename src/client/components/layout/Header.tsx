import { Search, Menu, Download } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { NotificationBell } from '../NotificationBell';
import { UserProfileHeaderSection } from './UserProfileHeaderSection';

export interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { tenant } = useTenant();

  const handleManualInstall = () => {
    localStorage.removeItem('dhadhan_install_dismissed');
    window.dispatchEvent(new Event('beforeinstallprompt'));
  };

  return (
    <header className="h-[76px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-xl text-[#64748B] hover:text-[#0B1630] hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
        >
          <Menu size={22} />
        </button>
        
        {/* Restaurant Identity Card */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-50/50 text-[#F97316] flex items-center justify-center text-xl shrink-0 font-bold border border-orange-100/30">
            {tenant?.logo ? (
              <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-cover rounded-xl" loading="lazy" decoding="async" width={40} height={40} />
            ) : (
              '🍽️'
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-[#0B1630] truncate">{tenant?.name || 'DHADHAN HQ'}</span>
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100/50 shrink-0">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            {tenant?.id && (
              <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider mt-0.5 truncate">
                RESTAURANT ID: <span className="font-mono text-[#64748B]">{tenant.id.slice(0, 8).toUpperCase()}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Install App Quick Action */}
        <button 
          onClick={handleManualInstall}
          title="Install Dhadhan Hub App"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200/60 font-black text-xs transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Download size={14} strokeWidth={2.5} />
          <span>Install App</span>
        </button>

        <button className="text-[#64748B] hover:text-[#0B1630] hover:bg-slate-50 p-2 rounded-xl transition-all">
          <Search className="w-5 h-5" />
        </button>

        <NotificationBell />
        
        <div className="h-8 w-[1px] bg-[#E5E7EB] hidden sm:block" />

        <UserProfileHeaderSection />
      </div>
    </header>
  );
};
