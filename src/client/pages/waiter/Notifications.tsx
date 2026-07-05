import { useEffect } from 'react';
import { 
  ChefHat, 
  Armchair, 
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Info
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

const typeIcons: Record<string, any> = {
  ORDER_READY: ChefHat,
  TABLE_REQUEST: Armchair,
  MESSAGE: MessageSquare,
  DELAY: AlertCircle,
  SYSTEM: Info,
};

const typeColors: Record<string, { color: string, bg: string }> = {
  ORDER_READY: { color: 'text-emerald-500', bg: 'bg-emerald-50' },
  TABLE_REQUEST: { color: 'text-indigo-500', bg: 'bg-indigo-50' },
  MESSAGE: { color: 'text-orange-500', bg: 'bg-orange-50' },
  DELAY: { color: 'text-red-500', bg: 'bg-red-50' },
  SYSTEM: { color: 'text-blue-500', bg: 'bg-blue-50' },
};

export const Notifications = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', tenant?.id],
    queryFn: () => NotificationService.getNotifications(tenant?.id || '', user?.id),
    enabled: !!tenant?.id,
  });

  // ─── Realtime subscription for new notifications ───
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', tenant.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => NotificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenant?.id] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(tenant?.id || '', user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', tenant?.id] });
    }
  });

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Notifications</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Keep track of your restaurant activity and alerts.</p>
        </div>
        <button 
          onClick={() => markAllReadMutation.mutate()}
          className="text-[10px] font-black text-[#F97316] uppercase tracking-widest hover:underline cursor-pointer"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((notif: any) => {
          const IconComp = typeIcons[notif.type] || Info;
          const colors = typeColors[notif.type] || typeColors.SYSTEM;
          return (
            <Card key={notif.id} className={cn(
              "p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex gap-6 relative group overflow-hidden bg-white",
              !notif.isRead && "border-l-4 border-l-[#F97316]"
            )}>
               <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", colors.bg, colors.color)}>
                  <IconComp size={28} />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                     <h4 className="text-sm font-bold text-[#0B1630]">{notif.title}</h4>
                     <span className="text-[10px] font-bold text-[#94A3B8]">{getTimeAgo(notif.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#64748B] leading-relaxed max-w-[600px]">{notif.message}</p>
                  <div className="mt-4 flex items-center gap-3">
                     {!notif.isRead && (
                       <button 
                         onClick={() => markReadMutation.mutate(notif.id)}
                         className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                       >
                         Mark Read
                       </button>
                     )}
                  </div>
               </div>
               
               {!notif.isRead && (
                  <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-[#F97316]" />
               )}
            </Card>
          );
        })}

        {notifications.length === 0 && (
          <div className="pt-8 flex flex-col items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-[#94A3B8]">
                <CheckCircle2 size={32} />
             </div>
             <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">No notifications yet</p>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="pt-8 flex flex-col items-center gap-4">
           <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-[#94A3B8]">
              <CheckCircle2 size={32} />
           </div>
           <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">End of notifications</p>
        </div>
      )}
    </div>
  );
};
