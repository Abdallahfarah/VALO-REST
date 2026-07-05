import { Bell, ChevronDown, Menu } from 'lucide-react';

export interface CashierHeaderProps {
  onToggleSidebar?: () => void;
}

export const CashierHeader = ({ onToggleSidebar }: CashierHeaderProps) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 lg:gap-6">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#0B1630] hover:bg-slate-50 cursor-pointer"
        >
          <Menu size={22} />
        </button>
        {/* Branch Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-4 cursor-pointer hover:bg-slate-100 transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#0B1630] leading-none">The Green Plate</span>
            <span className="text-[10px] text-[#94A3B8] font-medium leading-none mt-1">Main Branch</span>
          </div>
          <ChevronDown size={14} className="text-[#94A3B8]" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Bell className="w-6 h-6 text-[#94A3B8] cursor-pointer group-hover:text-[#0B1630] transition-colors" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">2</span>
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-[#0B1630]">Cashier User</span>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Cashier</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B1630] flex items-center justify-center text-white font-black text-lg">
            K
          </div>
          <ChevronDown size={14} className="text-[#94A3B8]" />
        </div>
      </div>
    </header>
  );
};
