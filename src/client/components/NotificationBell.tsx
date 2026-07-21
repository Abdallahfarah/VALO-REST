import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { supabase } from '../../lib/supabase';
import { NotificationCenterDrawer } from './NotificationCenterDrawer';

export const NotificationBell = () => {
  const { user, role } = useAuth();
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Query unread count using role-aware and tenant-aware filters
  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unread-notifications-count', tenant?.id, user?.id, role],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let q = supabase
        .from('notifications')
        .select('id, user_id, role, is_read')
        .eq('tenant_id', tenant.id)
        .eq('is_read', false);
      if (user?.id && role) {
        q = q.or(`user_id.eq.${user.id},role.eq.${role},and(user_id.is.null,role.is.null)`);
      } else if (user?.id) {
        q = q.or(`user_id.eq.${user.id},user_id.is.null`);
      }
      const { data } = await q;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Realtime subscription to invalidate query cache immediately on new events
  useEffect(() => {
    if (!tenant?.id) return;
    const channel = supabase
      .channel('notifications-realtime-bell')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
          queryClient.invalidateQueries({ queryKey: ['notifications', tenant.id, user?.id, role] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, user?.id, role, queryClient]);

  // Click outside to close the dropdown/panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-[#64748B] hover:text-[#0B1630] dark:hover:text-white p-2 rounded-xl transition-all relative cursor-pointer flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {unreadNotifications.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 bg-[#F97316] text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse">
            {unreadNotifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationCenterDrawer 
          tenantId={tenant?.id || ''} 
          userId={user?.id || ''} 
          role={role || ''}
          onClose={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
};
