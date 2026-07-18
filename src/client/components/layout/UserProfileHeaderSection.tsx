import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  Store, 
  Settings, 
  Bell, 
  HelpCircle, 
  LogOut, 
  Receipt, 
  ChefHat 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const UserProfileHeaderSection = () => {
  const { user, role, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fullName = user?.user_metadata?.full_name 
    || (user?.user_metadata?.first_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
      : user?.email?.split('@')[0] || 'User');
  const email = user?.email || '';
  const displayRole = role === 'KITCHEN_STAFF' ? 'KITCHEN' : (role || '');
  const avatarChar = fullName.trim().charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getMenuItems = () => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return [
          { label: 'Restaurant Profile', icon: Store, to: '/admin/settings' },
          { label: 'Account Settings', icon: Settings, to: '/admin/settings' },
          { label: 'Notification Preferences', icon: Bell, to: '/admin/settings' },
          { label: 'Help & Support', icon: HelpCircle, to: '/admin/settings' },
        ];
      case 'WAITER':
        return [
          { label: 'Notifications', icon: Bell, to: '/waiter/notifications' },
          { label: 'Help', icon: HelpCircle, to: '/waiter/messages' },
        ];
      case 'CASHIER':
        return [
          { label: 'My Transactions', icon: Receipt, to: '/cashier/receipts' },
          { label: 'Notifications', icon: Bell, to: '/cashier/payments' },
          { label: 'Help', icon: HelpCircle, to: '/cashier/messages' },
        ];
      case 'KITCHEN_STAFF':
        return [
          { label: 'Kitchen Status', icon: ChefHat, to: '/kds' },
          { label: 'Notifications', icon: Bell, to: '/kds' },
          { label: 'Help', icon: HelpCircle, to: '/kds/messages' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="relative select-none shrink-0" ref={dropdownRef}>
      {/* Header Profile Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-2 rounded-xl transition-all cursor-pointer text-left focus:outline-none"
      >
        <div className="w-9 h-9 rounded-xl bg-[#0B1630] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
          {avatarChar}
        </div>
        <div className="hidden sm:flex flex-col text-left min-w-0">
          <span className="text-xs font-bold text-[#0B1630] truncate max-w-[120px] leading-tight">{fullName}</span>
          <span className="text-[10px] text-[#64748B] font-medium truncate max-w-[150px] leading-none mt-0.5">{email}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[8px] font-black tracking-wider uppercase border border-slate-200/50 mt-1 w-fit">
            {displayRole}
          </span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
      </button>

      {/* Profile Dropdown Menu Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header block with user details */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1630] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {avatarChar}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-[#0B1630] truncate leading-tight">{fullName}</span>
              <span className="text-[10px] text-[#64748B] font-semibold truncate mt-0.5 leading-none">{email}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[8px] font-black tracking-wider uppercase border border-slate-200/50 mt-1.5 w-fit">
                {displayRole}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1.5 space-y-0.5">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0B1630] hover:bg-slate-50 transition-all cursor-pointer"
              >
                <item.icon className="w-4 h-4 text-[#94A3B8]" />
                {item.label}
              </Link>
            ))}

            {menuItems.length > 0 && <div className="h-[1px] bg-slate-100 my-1 mx-1.5" />}

            {/* Logout Trigger */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (signOut) signOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50/50 transition-all cursor-pointer text-left focus:outline-none"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
