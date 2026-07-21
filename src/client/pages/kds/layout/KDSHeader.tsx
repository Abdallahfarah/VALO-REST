import { Menu, ChevronDown } from 'lucide-react';
import { UserProfileHeaderSection } from '../../../components/layout/UserProfileHeaderSection';
import { NotificationBell } from '../../../components/NotificationBell';

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
          <div className="flex items-center h-6 max-w-[140px] shrink-0 overflow-hidden">
            <img src="/dhadhan-logo.png" alt="Dhadhan Hub" className="h-full object-contain" />
          </div>
          <ChevronDown size={14} className="text-[#94A3B8]" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <NotificationBell />
        
        <div className="pl-6 border-l border-[#232B5E]/20">
          <UserProfileHeaderSection />
        </div>
      </div>
    </header>
  );
};
