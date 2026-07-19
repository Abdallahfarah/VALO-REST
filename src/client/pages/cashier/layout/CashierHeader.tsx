import { Bell, ChevronDown, Menu } from 'lucide-react';
import { UserProfileHeaderSection } from '../../../components/layout/UserProfileHeaderSection';

export interface CashierHeaderProps {
  onToggleSidebar?: () => void;
}

export const CashierHeader = ({ onToggleSidebar }: CashierHeaderProps) => {
  return (
    <header className="h-16 lg:bg-white bg-[#090D1F]/90 lg:border-b lg:border-slate-200 border-b border-[#232B5E]/30 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 backdrop-blur-md lg:backdrop-blur-none shadow-sm">
      <div className="flex items-center gap-4 lg:gap-6">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-white hover:bg-[#131A38]/50 cursor-pointer"
        >
          <Menu size={22} />
        </button>
        {/* Branch Selector */}
        <div className="lg:bg-slate-50 bg-[#131A38]/50 lg:border lg:border-slate-200 border border-[#232B5E]/30 rounded-xl px-4 py-2 flex items-center gap-4 cursor-pointer lg:hover:bg-slate-100 transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-bold lg:text-[#0B1630] text-white leading-none">The Green Plate</span>
            <span className="text-[10px] lg:text-[#94A3B8] text-[#94A3B8] font-medium leading-none mt-1">Main Branch</span>
          </div>
          <ChevronDown size={14} className="text-[#94A3B8]" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Bell className="w-6 h-6 text-[#94A3B8] cursor-pointer group-hover:text-[#0B1630] transition-colors" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">2</span>
        </div>
        
        <div className="pl-6 border-l border-slate-100">
          <UserProfileHeaderSection />
        </div>
      </div>
    </header>
  );
};
