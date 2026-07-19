import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MonitorSmartphone, 
  Armchair, 
  Receipt, 
  MessageSquare, 
  Bell, 
  LogOut, 
  ChevronLeft 
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessagingService } from '../../../services/ApiService';
import { supabase } from '../../../../lib/supabase';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OPERATIONAL',
    items: [
      { name: 'Dashboard', path: '/waiter', icon: LayoutDashboard },
      { name: 'POS', path: '/waiter/pos', icon: MonitorSmartphone },
      { name: 'Tables', path: '/waiter/tables', icon: Armchair },
      { name: 'My Orders', path: '/waiter/orders', icon: Receipt },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { name: 'Messages', path: '/waiter/messages', icon: MessageSquare },
      { name: 'Notifications', path: '/waiter/notifications', icon: Bell },
    ],
  }
];

export interface WaiterSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const WaiterSidebar = ({ isOpen, onClose }: WaiterSidebarProps) => {
  const { signOut, user } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', tenant?.id, user?.id],
    queryFn: () => MessagingService.getConversations(tenant?.id || '', user?.id || ''),
    enabled: !!tenant?.id && !!user?.id,
  });

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

  const totalUnreadMessages = conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);

  // Real-time subscription in WaiterSidebar
  useEffect(() => {
    if (!tenant?.id) return;

    const nChannel = supabase
      .channel('notifications-realtime-waiter-sidebar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
        }
      )
      .subscribe();

    const mChannel = supabase
      .channel('messages-realtime-waiter-sidebar')
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
    <>
      {/* Mobile Sidebar Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[49] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "w-[260px] h-screen bg-[#0B1630] flex flex-col fixed left-0 top-0 overflow-y-auto transition-transform duration-300 z-50 lg:translate-x-0 lg:flex",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F97316] rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">VX</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-none drop-shadow-sm truncate max-w-[150px]">{tenant?.name || 'RESTAURANT'}</span>
              <span className="text-[#F97316] text-[10px] font-bold tracking-wider mt-1 uppercase">RESTAURANT POS</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors lg:hidden cursor-pointer">
            <ChevronLeft size={20} />
          </button>
        </div>

      {/* Navigation */}
      <div className="flex-1 px-4 mt-2 h-full flex flex-col space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <span className="text-[#64748B] text-xs font-semibold px-4 tracking-wider mb-2 block uppercase">
              {section.title}
            </span>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/waiter'}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-colors duration-200 mt-1",
                      isActive 
                        ? "bg-[#1A2A52]/50 text-white shadow-sm border-l-4 border-[#F97316]" 
                        : "text-[#CBD5E1] hover:bg-[#1A2A52] hover:text-white border-l-4 border-transparent"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <item.icon 
                          className={cn("w-[18px] h-[18px]", isActive ? "text-[#F97316]" : "text-inherit")} 
                          strokeWidth={2}
                        />
                        <span className="font-medium tracking-wide">{item.name}</span>
                      </div>
                      {item.name === 'Messages' ? (
                        totalUnreadMessages > 0 ? (
                          <span className="bg-[#4F46E5] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {totalUnreadMessages}
                          </span>
                        ) : null
                      ) : item.name === 'Notifications' ? (
                        unreadNotifications.length > 0 ? (
                          <span className="bg-[#4F46E5] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadNotifications.length}
                          </span>
                        ) : null
                      ) : item.badge ? (
                        <span className="bg-[#4F46E5] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="px-6 py-4 mx-4 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Online</span>
        </div>
        <p className="text-white/60 text-[10px]">You're all set to take orders</p>
      </div>

      {/* Logout */}
      <div className="px-6 py-8 border-t border-[#1A2A52]/40">
        <button 
          onClick={signOut}
          className="flex items-center gap-2 text-[#CBD5E1] hover:text-white transition-colors text-sm font-semibold tracking-wider w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
   </>
  );
};
