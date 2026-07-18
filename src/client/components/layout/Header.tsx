import { useState, useEffect } from 'react';
import { Search, Bell, MessageSquare, ChevronDown, Menu } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../../lib/supabase';
import { MessagingService } from '../../services/ApiService';
import { NotificationCenterDrawer } from '../NotificationCenterDrawer';
import { MessagingCenterDrawer } from '../MessagingCenterDrawer';
import { UserProfileHeaderSection } from './UserProfileHeaderSection';

export interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, role } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);

  const fullName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
    : user?.email || 'User';

  const avatarChar = fullName.trim().charAt(0).toUpperCase();

  // Queries for unread counts
  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unread-notifications-count', tenant?.id, user?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let q = supabase
        .from('notifications')
        .select('id, user_id, is_read')
        .eq('tenant_id', tenant.id)
        .eq('is_read', false);
      if (user?.id) {
        q = q.or(`user_id.eq.${user.id},user_id.is.null`);
      }
      const { data } = await q;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', tenant?.id, user?.id],
    queryFn: () => MessagingService.getConversations(tenant?.id || '', user?.id || ''),
    enabled: !!tenant?.id && !!user?.id,
  });

  const totalUnreadMessages = conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);

  // Real-time subscription in Header
  useEffect(() => {
    if (!tenant?.id) return;
    const nChannel = supabase
      .channel('notifications-realtime-header')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
        }
      )
      .subscribe();

    const mChannel = supabase
      .channel('messages-realtime-header')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(nChannel);
      supabase.removeChannel(mChannel);
    };
  }, [tenant?.id, queryClient]);

  return (
    <header className="h-[76px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 shrink-0">
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
              <span className="font-black text-sm text-[#0B1630] truncate">{tenant?.name || 'VALO HQ'}</span>
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

      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <button className="text-[#64748B] hover:text-[#0B1630] hover:bg-slate-50 p-2 rounded-xl transition-all">
          <Search className="w-5 h-5" />
        </button>

        <button 
          onClick={() => {
            setIsMessagesOpen(!isMessagesOpen);
            setIsNotificationsOpen(false);
          }}
          className="text-[#64748B] hover:text-[#0B1630] hover:bg-slate-50 p-2 rounded-xl transition-all relative cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
          {totalUnreadMessages > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 bg-[#EF4444] text-white text-[8px] font-black rounded-full flex items-center justify-center">
              {totalUnreadMessages}
            </span>
          )}
        </button>

        <button 
          onClick={() => {
            setIsNotificationsOpen(!isNotificationsOpen);
            setIsMessagesOpen(false);
          }}
          className="text-[#64748B] hover:text-[#0B1630] hover:bg-slate-50 p-2 rounded-xl transition-all relative cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications.length > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 bg-[#EF4444] text-white text-[8px] font-black rounded-full flex items-center justify-center">
              {unreadNotifications.length}
            </span>
          )}
        </button>
        
        <div className="h-8 w-[1px] bg-[#E5E7EB] hidden sm:block" />

        <UserProfileHeaderSection />
      </div>

      {isNotificationsOpen && (
        <NotificationCenterDrawer 
          tenantId={tenant?.id || ''} 
          userId={user?.id || ''} 
          onClose={() => setIsNotificationsOpen(false)} 
        />
      )}

      {isMessagesOpen && (
        <MessagingCenterDrawer 
          tenantId={tenant?.id || ''} 
          userId={user?.id || ''} 
          role={role || ''}
          onClose={() => setIsMessagesOpen(false)} 
        />
      )}
    </header>
  );
};
