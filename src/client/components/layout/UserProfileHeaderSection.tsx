import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserProfileHeaderSection = () => {
  const { user, role } = useAuth();

  const fullName = user?.user_metadata?.full_name 
    || (user?.user_metadata?.first_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
      : user?.email?.split('@')[0] || 'User');
  const email = user?.email || '';
  const displayRole = role === 'KITCHEN_STAFF' ? 'KITCHEN' : (role || '');
  const avatarChar = fullName.trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 shrink-0 select-none">
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
      <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] cursor-pointer hover:text-[#0B1630] transition-colors shrink-0" />
    </div>
  );
};
