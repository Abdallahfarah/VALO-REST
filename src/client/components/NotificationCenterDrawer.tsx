import React, { useEffect } from 'react';
import { 
  X, CheckCircle, AlertTriangle, AlertCircle, Info, Settings, 
  ShoppingCart, CreditCard, UserCheck, DollarSign, Globe, Trash2, CheckSquare
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../services/ApiService';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { toast } from '../lib/toast-store';

interface NotificationCenterDrawerProps {
  tenantId: string;
  userId: string;
  onClose: () => void;
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({ tenantId, userId, onClose }) => {
  const queryClient = useQueryClient();

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications', tenantId, userId],
    queryFn: () => NotificationService.getNotifications(tenantId, userId),
    enabled: !!tenantId && !!userId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('notifications-realtime-drawer')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `tenant_id=eq.${tenantId}` },
        () => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, refetch, queryClient]);

  // Mutations
  const readMutation = useMutation({
    mutationFn: (id: string) => NotificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(tenantId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast.success('Marked all as read', 'All notifications have been processed.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast.success('Notification Deleted', 'The entry has been removed.');
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'ERROR': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'ORDER': 
      case 'ORDER_READY': return <ShoppingCart className="w-5 h-5 text-blue-500" />;
      case 'PAYMENT': return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'STAFF': return <UserCheck className="w-5 h-5 text-indigo-500" />;
      case 'SUBSCRIPTION': return <DollarSign className="w-5 h-5 text-orange-500" />;
      case 'PLATFORM': return <Globe className="w-5 h-5 text-purple-500" />;
      case 'TABLE_REQUEST': return <UserCheck className="w-5 h-5 text-indigo-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  // Grouping notifications by date
  const getGroupedNotifications = () => {
    const today: any[] = [];
    const yesterday: any[] = [];
    const earlier: any[] = [];

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    notifications.forEach((n: any) => {
      const date = new Date(n.createdAt);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      
      if (diffTime < oneDay && now.getDate() === date.getDate()) {
        today.push(n);
      } else if (diffTime < 2 * oneDay) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = getGroupedNotifications();

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) {
      readMutation.mutate(n.id);
    }
    // Deep linking / Navigation helper
    if (n.type === 'ORDER' || n.type === 'ORDER_READY') {
      window.location.href = '/admin/orders';
    } else if (n.type === 'PAYMENT') {
      window.location.href = '/admin/payments';
    } else if (n.type === 'STAFF') {
      window.location.href = '/admin/staff';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white/95 backdrop-blur-md shadow-2xl border-l border-slate-100 z-[999] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
        <div>
          <h3 className="text-base font-bold text-[#0B1630] uppercase tracking-wider">Notification Center</h3>
          <p className="text-[10px] text-[#94A3B8] font-bold mt-0.5 uppercase tracking-widest">{notifications.filter((n: any) => !n.isRead).length} UNREAD METRICS</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0b1630] hover:bg-slate-50 transition-colors cursor-pointer">
          <X size={18} />
        </button>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-xs">
          <button 
            onClick={() => readAllMutation.mutate()}
            className="flex items-center gap-1.5 font-bold text-[#F97316] hover:text-[#ea580c] transition-colors cursor-pointer"
          >
            <CheckSquare size={13} /> Mark All Read
          </button>
          <span className="text-[#94A3B8] font-medium">Auto-sync active</span>
        </div>
      )}

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100 shadow-sm">
              <Settings size={28} />
            </div>
            <h4 className="text-sm font-bold text-[#0B1630] uppercase tracking-wider">All caught up!</h4>
            <p className="text-xs text-[#94A3B8] font-medium mt-1">No system alerts or updates currently logged.</p>
          </div>
        ) : (
          <>
            {/* Today */}
            {today.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest border-b border-slate-50 pb-1">Today</h4>
                {today.map((n) => (
                  <NotificationItem key={n.id} n={n} getIcon={getNotificationIcon} onClick={handleNotificationClick} onDelete={deleteMutation.mutate} />
                ))}
              </div>
            )}

            {/* Yesterday */}
            {yesterday.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest border-b border-slate-50 pb-1">Yesterday</h4>
                {yesterday.map((n) => (
                  <NotificationItem key={n.id} n={n} getIcon={getNotificationIcon} onClick={handleNotificationClick} onDelete={deleteMutation.mutate} />
                ))}
              </div>
            )}

            {/* Earlier */}
            {earlier.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest border-b border-slate-50 pb-1">Earlier</h4>
                {earlier.map((n) => (
                  <NotificationItem key={n.id} n={n} getIcon={getNotificationIcon} onClick={handleNotificationClick} onDelete={deleteMutation.mutate} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface NotificationItemProps {
  n: any;
  getIcon: (type: string) => React.ReactNode;
  onClick: (n: any) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ n, getIcon, onClick, onDelete }) => {
  const formattedTime = new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      onClick={() => onClick(n)}
      className={cn(
        "p-4 rounded-2xl border flex gap-4 transition-all relative group cursor-pointer text-left",
        n.isRead 
          ? "bg-white border-slate-100 hover:border-slate-200" 
          : "bg-orange-50/10 border-orange-100/50 hover:border-orange-100 shadow-sm"
      )}
    >
      <div className="shrink-0 mt-0.5">
        {getIcon(n.type)}
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <h5 className="text-xs font-bold text-[#0B1630] leading-snug">{n.title}</h5>
        <p className="text-[11px] text-[#64748B] font-medium mt-1 leading-relaxed">{n.message}</p>
        <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider block mt-2">{formattedTime}</span>
      </div>

      {!n.isRead && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#F97316]" />
      )}

      {/* Delete button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(n.id);
        }}
        className="absolute bottom-4 right-4 p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};
