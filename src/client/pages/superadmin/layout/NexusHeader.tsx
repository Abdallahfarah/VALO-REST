import { Bell, HelpCircle, ChevronDown, Menu } from 'lucide-react';

export interface NexusHeaderProps {
  onToggleSidebar?: () => void;
}

export const NexusHeader = ({ onToggleSidebar }: NexusHeaderProps) => {
  return (
    <header className="h-[76px] bg-[#090D1F]/80 backdrop-blur-md border-b border-[#232B5E]/30 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer mr-1"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-white font-bold text-sm tracking-wide">Operational</span>
        </div>
        <span className="text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          US-EAST-1 • 99.9% Uptime
        </span>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-[#94A3B8] hover:text-white transition-colors relative">
          <Bell className="w-[22px] h-[22px]" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#F97316] rounded-full border-2 border-[#090D1F] box-content" />
        </button>
        <button className="text-[#94A3B8] hover:text-white transition-colors">
          <HelpCircle className="w-[22px] h-[22px]" />
        </button>
        
        <div className="h-8 w-[1px] bg-[#232B5E]/30" /> {/* Divider */}

        <button className="flex items-center gap-3 hover:bg-[#1E293B]/40 p-1.5 pr-2 rounded-xl transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-500/20">
            VP
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[14px] font-bold text-white leading-none mb-1">DHADHAN Platform Owner</span>
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase">Global Admin</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#94A3B8] ml-2" />
        </button>
      </div>
    </header>
  );
};
