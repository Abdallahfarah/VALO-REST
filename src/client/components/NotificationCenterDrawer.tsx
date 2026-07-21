import React, { useEffect, useState } from 'react';
import { 
  X, CheckSquare, ShoppingCart, CreditCard, Users, 
  Settings, AlertTriangle, XCircle, Armchair, Sparkles, 
  Info, Trash2, ChefHat, Coffee, Bell, CheckSquare as CheckIcon
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../services/ApiService';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { toast } from '../lib/toast-store';

interface NotificationCenterDrawerProps {
  tenantId: string;
  userId: string;
  role: string;
  onClose: () => void;
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({ 
  tenantId, 
  userId, 
  role, 
  onClose 
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');

  // Query notifications with role parameter
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications', tenantId, userId, role],
    queryFn: () => NotificationService.getNotifications(tenantId, userId, role),
    enabled: !!tenantId && !!userId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel('notifications-realtime-panel')
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
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId, role] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(tenantId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId, role] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast.success('Marked all as read', 'Notifications processed successfully.');
    }
  });

  // Auto mark as read on open
  useEffect(() => {
    const unread = notifications.filter((n: any) => !n.isRead);
    if (unread.length > 0) {
      NotificationService.markAllAsRead(tenantId, userId, role).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId, role] });
        queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      });
    }
  }, [notifications, tenantId, userId, role, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId, role] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast.success('Notification Deleted', 'The alert has been removed.');
    }
  });

  // Tab configurations per role
  const getTabsForRole = (userRole: string) => {
    const roleUpper = userRole?.toUpperCase();
    if (roleUpper === 'ADMIN' || roleUpper === 'OWNER') {
      return ['All', 'Orders', 'Kitchen', 'Payments', 'System'];
    }
    if (roleUpper === 'WAITER') {
      return ['All', 'Orders', 'Tables', 'Kitchen'];
    }
    if (roleUpper === 'CASHIER') {
      return ['All', 'Payments', 'System'];
    }
    if (roleUpper === 'CHEF' || roleUpper === 'BARISTA' || roleUpper === 'KITCHEN_STAFF') {
      return ['All', 'Kitchen', 'Priority'];
    }
    return ['All', 'System'];
  };

  const tabs = getTabsForRole(role);

  // Classification logic for custom tabs
  const getNotificationCategory = (n: any) => {
    const titleLower = n.title?.toLowerCase() || '';
    const messageLower = n.message?.toLowerCase() || '';

    if (titleLower.includes('priority') || titleLower.includes('cancel') || messageLower.includes('cancel') || titleLower.includes('modified') || messageLower.includes('modified')) {
      return 'Priority';
    }
    if (titleLower.includes('payment') || titleLower.includes('bill') || titleLower.includes('receipt') || titleLower.includes('invoice') || messageLower.includes('payment') || messageLower.includes('paid') || messageLower.includes('settle')) {
      return 'Payments';
    }
    if (titleLower.includes('table') || titleLower.includes('seat') || messageLower.includes('table')) {
      return 'Tables';
    }
    if (titleLower.includes('order') || messageLower.includes('order')) {
      return 'Orders';
    }
    if (titleLower.includes('kitchen') || titleLower.includes('prep') || titleLower.includes('dish') || titleLower.includes('food') || titleLower.includes('drink') || titleLower.includes('ready') || messageLower.includes('ready')) {
      return 'Kitchen';
    }
    return 'System';
  };

  const filteredNotifications = notifications.filter((n: any) => {
    if (activeTab === 'All') return true;
    return getNotificationCategory(n) === activeTab;
  });

  const getCategoryIcon = (category: string, title: string) => {
    const titleLower = title?.toLowerCase() || '';
    switch (category) {
      case 'Priority':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'Payments':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'Tables':
        return <Armchair className="w-4 h-4 text-blue-400" />;
      case 'Orders':
        return <ShoppingCart className="w-4 h-4 text-[#F97316]" />;
      case 'Kitchen':
        if (titleLower.includes('drink') || titleLower.includes('coffee') || titleLower.includes('beverage')) {
          return <Coffee className="w-4 h-4 text-amber-500" />;
        }
        return <ChefHat className="w-4 h-4 text-orange-400" />;
      case 'System':
      default:
        if (titleLower.includes('staff') || titleLower.includes('user')) {
          return <Users className="w-4 h-4 text-indigo-400" />;
        }
        if (titleLower.includes('settings')) {
          return <Settings className="w-4 h-4 text-slate-400" />;
        }
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) {
      readMutation.mutate(n.id);
    }
    onClose();

    // Contextual Routing based on User Role & Notification Category
    const category = getNotificationCategory(n);
    const roleUpper = role?.toUpperCase();

    if (roleUpper === 'WAITER') {
      if (category === 'Tables') {
        window.location.href = '/waiter/tables';
      } else {
        window.location.href = '/waiter/orders';
      }
    } else if (roleUpper === 'CASHIER') {
      if (category === 'Payments') {
        window.location.href = '/cashier';
      } else {
        window.location.href = '/cashier/receipts';
      }
    } else if (roleUpper === 'CHEF' || roleUpper === 'BARISTA' || roleUpper === 'KITCHEN_STAFF') {
      window.location.href = '/kds';
    } else if (roleUpper === 'ADMIN' || roleUpper === 'OWNER') {
      if (category === 'Payments') {
        window.location.href = '/admin/payments';
      } else if (category === 'Orders' || category === 'Kitchen') {
        window.location.href = '/admin/orders';
      } else if (category === 'Tables') {
        window.location.href = '/admin/tables';
      } else {
        const titleLower = n.title?.toLowerCase() || '';
        if (titleLower.includes('staff')) {
          window.location.href = '/admin/staff';
        } else if (titleLower.includes('inventory')) {
          window.location.href = '/admin/inventory';
        } else {
          window.location.href = '/admin/settings';
        }
      }
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[998] md:hidden"
        onClick={onClose}
      />

      {/* Redesigned Premium Glassmorphic Dropdown / Panel */}
      <div className={cn(
        // Mobile layout: Full width bottom sheet
        "fixed bottom-0 inset-x-0 w-full h-[75vh] rounded-t-3xl border-t border-[#F97316]/20 bg-[#0B1630]/95 backdrop-blur-md shadow-2xl z-[999] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300",
        // Desktop / Tablet layout: Floating absolute dropdown
        "md:fixed md:bottom-auto md:top-20 md:right-6 md:left-auto md:w-[350px] md:h-auto md:max-h-[520px] md:rounded-2xl md:border md:border-[#F97316]/20 md:shadow-[0_8px_32px_rgba(0,0,0,0.5)] md:animate-in md:slide-in-from-top-4"
      )}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#232B5E]/30 flex items-center justify-between bg-[#131A38]/30">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#F97316]" /> Notifications
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Categories Tab Bar */}
        <div className="px-4 py-2 bg-[#090D1F]/50 border-b border-[#232B5E]/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const count = tab === 'All' 
              ? notifications.length 
              : notifications.filter((n: any) => getNotificationCategory(n) === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === tab 
                    ? "bg-[#F97316] text-white shadow-md shadow-orange-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {tab}
                {count > 0 && (
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded-full",
                    activeTab === tab ? "bg-white text-[#F97316]" : "bg-[#232B5E] text-slate-300"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 md:max-h-[360px]">
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-12 h-12 rounded-full bg-[#131A38]/50 flex items-center justify-center text-slate-500 mb-3 border border-[#232B5E]/30">
                <Bell size={20} />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">All Caught Up</h4>
              <p className="text-[10px] text-slate-400 mt-1">No notifications found in {activeTab}</p>
            </div>
          ) : (
            filteredNotifications.map((n: any) => {
              const category = getNotificationCategory(n);
              const icon = getCategoryIcon(category, n.title);
              return (
                <div 
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "p-3.5 rounded-2xl border flex gap-3 transition-all relative group cursor-pointer text-left",
                    "border-[#232B5E]/30 hover:border-[#F97316]/30",
                    n.isRead 
                      ? "bg-[#131A38]/30" 
                      : "bg-[#F97316]/5 border-[#F97316]/10 shadow-[inset_0_0_12px_rgba(249,115,22,0.02)]"
                  )}
                >
                  {/* Left Category Icon */}
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-[#131A38] border border-[#232B5E]/40 flex items-center justify-center mt-0.5">
                    {icon}
                  </div>

                  {/* Title & Description */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-bold text-white leading-snug truncate">{n.title}</h5>
                      <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap ml-2 shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                  </div>

                  {/* Unread Orange Dot indicator */}
                  {!n.isRead && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
                  )}

                  {/* Compact Swipe/Hover Delete */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(n.id);
                    }}
                    className="absolute bottom-3.5 right-3.5 p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Mark All Read Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-[#232B5E]/30 bg-[#090D1F]/50 flex justify-between items-center text-[10px]">
            <button 
              onClick={() => readAllMutation.mutate()}
              className="flex items-center gap-1.5 font-black text-[#F97316] uppercase tracking-wider hover:text-orange-400 transition-all cursor-pointer"
            >
              <CheckIcon size={12} /> Mark All Read
            </button>
            <span className="text-slate-500 font-bold uppercase tracking-wider">Sync Active</span>
          </div>
        )}
      </div>
    </>
  );
};
