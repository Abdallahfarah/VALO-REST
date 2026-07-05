import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ChefHat, Receipt, Timer } from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../lib/toast-store';

export const KitchenQueue = () => {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');

  // ─── Realtime ───
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('kitchen-queue-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenant?.id, queryClient]);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      OrderService.updateOrderStatus(orderId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', tenant?.id] });
      toast.success('Ticket updated', `Status changed to ${variables.status}`);
    },
  });

  // Only show kitchen-relevant orders (not COMPLETED/CANCELED)
  const kitchenOrders = orders.filter((o: any) =>
    ['PENDING', 'PREPARING', 'READY'].includes(o.status)
  );

  const filteredTickets = filter === 'ALL'
    ? kitchenOrders
    : kitchenOrders.filter((o: any) => {
        if (filter === 'NEW') return o.status === 'PENDING';
        if (filter === 'IN_PROGRESS') return o.status === 'PREPARING';
        if (filter === 'READY') return o.status === 'READY';
        return true;
      });

  const pendingCount = kitchenOrders.filter((o: any) => o.status === 'PENDING').length;
  const preparingCount = kitchenOrders.filter((o: any) => o.status === 'PREPARING').length;
  const readyCount = kitchenOrders.filter((o: any) => o.status === 'READY').length;

  const handleAction = (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'PENDING') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    if (nextStatus) {
      updateStatusMutation.mutate({ orderId, status: nextStatus });
    }
  };

  const getElapsedMinutes = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const filters = [
    { key: 'ALL', label: 'ALL' },
    { key: 'NEW', label: `NEW ${pendingCount}` },
    { key: 'IN_PROGRESS', label: `IN PROGRESS ${preparingCount}` },
    { key: 'READY', label: `READY ${readyCount}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0B1630]">Kitchen Performance Queue</h1>
        <p className="text-[#64748B] mt-1 text-sm font-medium">Monitor and manage live kitchen operations in real-time.</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-emerald-600">LIVE OPERATIONS</span>
          <span className="text-[#94A3B8] font-medium ml-2">{kitchenOrders.length} ACTIVE TICKETS</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-md font-semibold text-xs cursor-pointer transition-colors",
                filter === f.key ? "text-[#0B1630] bg-slate-100" : "text-[#94A3B8] hover:text-[#0B1630]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map((order: any) => {
          const elapsed = getElapsedMinutes(order.createdAt);
          const statusLabel = order.status === 'PENDING' ? 'New' : order.status === 'PREPARING' ? 'Cooking' : 'Ready';
          const statusColor = order.status === 'READY' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50';

          return (
            <Card key={order.id} className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Order</span>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase", statusColor)}>{statusLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                  <div className={cn("w-1.5 h-1.5 rounded-full", elapsed > 15 ? "bg-red-500" : "bg-[#F97316]")} />
                  <span className="font-bold">{elapsed}m</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-3xl font-bold text-[#0B1630]">#{order.id.slice(0, 6)}</h3>
                <span className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
                  TABLE {order.table?.number || 'N/A'}
                </span>
              </div>
              <ul className="mb-5 mt-3">
                {order.items?.map((item: any, j: number) => (
                  <li key={j} className="text-sm text-[#0B1630] font-medium">
                    • {item.quantity}x {item.menuItem?.name || 'Unknown'}
                  </li>
                ))}
              </ul>
              {order.status !== 'READY' ? (
                <button
                  onClick={() => handleAction(order.id, order.status)}
                  disabled={updateStatusMutation.isPending}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50",
                    order.status === 'PENDING'
                      ? "bg-[#0B1630] text-white hover:bg-[#1A2A52]"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  )}
                >
                  {order.status === 'PENDING' ? <><Clock size={16} /> START PREP</> : <><CheckCircle2 size={16} /> MARK READY</>}
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={16} /> READY FOR PICKUP
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Receipt size={20} /></div>
          <div><p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Tickets</p><h3 className="text-2xl font-bold text-[#0B1630]">{kitchenOrders.length}</h3><p className="text-xs text-[#94A3B8]">Active</p></div>
        </Card>
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316]"><Timer size={20} /></div>
          <div><p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Pending</p><h3 className="text-2xl font-bold text-[#0B1630]">{pendingCount}</h3><p className="text-xs text-[#94A3B8]">New Orders</p></div>
        </Card>
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500"><ChefHat size={20} /></div>
          <div><p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">In Progress</p><h3 className="text-2xl font-bold text-[#0B1630]">{preparingCount}</h3><p className="text-xs text-[#94A3B8]">Cooking</p></div>
        </Card>
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={20} /></div>
          <div><p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Ready</p><h3 className="text-2xl font-bold text-[#0B1630]">{readyCount}</h3><p className="text-xs text-[#94A3B8]">For Pickup</p></div>
        </Card>
      </div>
    </div>
  );
};
