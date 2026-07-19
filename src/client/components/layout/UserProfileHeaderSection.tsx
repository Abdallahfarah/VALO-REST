import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const fullName = user?.user_metadata?.full_name 
    || (user?.user_metadata?.first_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
      : user?.email?.split('@')[0] || 'User');
  const email = user?.email || '';
  const displayRole = role === 'KITCHEN_STAFF' ? 'KITCHEN' : (role || '');
  const avatarChar = fullName.trim().charAt(0).toUpperCase();

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 256;
      const margin = 16;
      // Position directly below trigger, aligned to the right edge
      let left = rect.right - menuWidth + window.scrollX;
      
      // Keep it within screen bounds
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - margin;
      }
      if (left < margin) {
        left = margin;
      }

      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      updateCoords();
      
      // Trigger transition in the next frames
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });

      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);

      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
      };
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200); // Wait for transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) || 
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
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

  const getRoleBadgeClasses = () => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'lg:bg-[#282764] bg-[#282764] text-white';
      case 'WAITER':
        return 'lg:bg-[#3A36A0]/10 lg:text-[#3A36A0] bg-[#F97316]/20 text-[#F97316]';
      case 'CASHIER':
        return 'lg:bg-[#F97316]/10 lg:text-[#F97316] bg-[#F97316]/20 text-[#F97316]';
      case 'KITCHEN_STAFF':
        return 'lg:bg-[#10B981]/10 lg:text-[#10B981] bg-[#10B981]/20 text-[#10B981]';
      default:
        return 'lg:bg-slate-100 bg-slate-800 text-slate-400';
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="relative select-none shrink-0">
      {/* Header Profile Trigger Button */}
      <button 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 lg:hover:bg-slate-50 hover:bg-[#131A38]/30 p-1.5 pr-2.5 rounded-xl transition-all cursor-pointer text-left focus:outline-none"
      >
        <div className="w-9 h-9 rounded-xl bg-[#0B1630] lg:bg-[#0B1630] bg-[#1E295D] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
          {avatarChar}
        </div>
        <div className="hidden sm:flex flex-col text-left min-w-0">
          <span className="text-xs font-bold lg:text-[#0B1630] text-white truncate max-w-[120px] leading-tight">{fullName}</span>
          <span className="text-[10px] lg:text-[#64748B] text-[#94A3B8] font-medium truncate max-w-[150px] leading-none mt-0.5">{email}</span>
          <span className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border border-transparent mt-1 w-fit",
            getRoleBadgeClasses()
          )}>
            {displayRole}
          </span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
      </button>

      {/* Render Dropdown using Portal for highest z-index layering */}
      {shouldRender && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            zIndex: 999999
          }}
          className={cn(
            "w-64 bg-white border border-[#E2E8F0] rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.02)] py-2 transition-all duration-200 ease-out transform origin-top-right",
            isAnimating 
              ? "opacity-100 scale-100 translate-y-0" 
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          )}
        >
          {/* Header section with user details */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1630] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {avatarChar}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-[#282764] truncate leading-tight">{fullName}</span>
              <span className="text-[10px] text-[#64748B] font-semibold truncate mt-0.5 leading-none">{email}</span>
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border border-transparent mt-1.5 w-fit",
                getRoleBadgeClasses()
              )}>
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
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#282764] hover:bg-[#3A36A0]/5 transition-all duration-200 cursor-pointer group"
              >
                <item.icon className="w-4 h-4 text-[#94A3B8] group-hover:text-[#F97316] transition-colors" />
                {item.label}
              </Link>
            ))}

            {menuItems.length > 0 && <div className="h-[1px] bg-slate-100 my-1.5 mx-2" />}

            {/* Logout Trigger */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (signOut) signOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer text-left focus:outline-none group"
            >
              <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" />
              Logout
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
