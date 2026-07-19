import { Bell, ChevronDown, Menu } from 'lucide-react';
import { UserProfileHeaderSection } from '../../../components/layout/UserProfileHeaderSection';

export interface KDSHeaderProps {
  onToggleSidebar?: () => void;
}

export const KDSHeader = ({ onToggleSidebar }: KDSHeaderProps) => {
  return (
    <header className="h-16 bg-[#070913]/80 border-b border-[#232B5E]/20 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-4 lg:gap-6">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-white hover:bg-[#131A38]/50 cursor-pointer"
        >
          <Menu size={22} />
        </button>
        {/* Branch Selector */}
        <div className="bg-[#131A38]/30 border border-[#232B5E]/20 rounded-xl px-4 py-2 flex items-center gap-4 cursor-pointer hover:bg-[#131A38]/50 transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-none">The Green Plate</span>
            <span className="text-[10px] text-[#94A3B8] font-medium leading-none mt-1">Main Branch</span>
          </div>
          <ChevronDown size={14} className="text-[#94A3B8]" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Bell className="w-6 h-6 text-[#94A3B8] cursor-pointer hover:text-white transition-colors" />
          <span className="absolute -top-1 -right-1 bg-[#F97316] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#070913]">2</span>
        </div>
        
        <div className="pl-6 border-l border-[#232B5E]/20">
          <UserProfileHeaderSection />
        </div>
      </div>
    </header>
  );
};
