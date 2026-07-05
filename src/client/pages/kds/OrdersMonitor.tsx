import { useEffect } from 'react';
import { 
  Receipt, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Lightbulb
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../../lib/supabase';
import { toast } from '../../lib/toast-store';

export const OrdersMonitor = () => {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('kds-orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, queryClient]);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string, status: string }) => 
      OrderService.updateOrderStatus(orderId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated', `Status → ${variables.status}`);
    }
  });

  const handleStatusUpdate = (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'PENDING') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    
    if (nextStatus) {
      updateStatusMutation.mutate({ orderId, status: nextStatus });
    }
  };

  const kpis = [
    { label: 'New Orders', value: orders.filter((o: any) => o.status === 'PENDING').length.toString(), sub: 'Start', icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Preparing', value: orders.filter((o: any) => o.status === 'PREPARING').length.toString(), sub: 'In Progress', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Ready', value: orders.filter((o: any) => o.status === 'READY').length.toString(), sub: 'Finished Cooking', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Canceled', value: orders.filter((o: any) => o.status === 'CANCELED').length.toString(), sub: 'Canceled Orders', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const columns = [
    {
      title: 'NEW ORDERS',
      count: orders.filter((o: any) => o.status === 'PENDING').length,
      color: 'border-indigo-500',
      orders: orders.filter((o: any) => o.status === 'PENDING')
    },
    {
      title: 'PREPARING',
      count: orders.filter((o: any) => o.status === 'PREPARING').length,
      color: 'border-orange-500',
      orders: orders.filter((o: any) => o.status === 'PREPARING')
    },
    {
      title: 'READY',
      count: orders.filter((o: any) => o.status === 'READY').length,
      color: 'border-emerald-500',
      orders: orders.filter((o: any) => o.status === 'READY')
    },
    {
      title: 'CANCELED',
      count: orders.filter((o: any) => o.status === 'CANCELED').length,
      color: 'border-red-500',
      orders: orders.filter((o: any) => o.status === 'CANCELED')
    },
  ];

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-8 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <h1 className="text-3xl font-bold text-[#0B1630]">My Orders</h1>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-4 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", kpi.bg, kpi.color)}>
                <kpi.icon size={24} />
             </div>
             <div>
               <h3 className="text-2xl font-black text-[#0B1630] leading-none mb-1">{kpi.value}</h3>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#0B1630] uppercase tracking-wider">{kpi.label}</span>
                  <span className="text-[9px] text-[#94A3B8] font-medium leading-none">{kpi.sub}</span>
               </div>
             </div>
          </Card>
        ))}
      </div>

       {/* Orchestration Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
         <div className="flex gap-6 h-full min-w-[1200px]">
            {columns.map((col, i) => (
               <div key={i} className="flex-1 min-w-[300px] flex flex-col bg-[#F1F5F9]/50 rounded-3xl overflow-hidden border border-slate-100">
                  <div className={cn("p-4 border-b-4 flex items-center justify-between bg-white/80", col.color)}>
                     <h3 className="text-[10px] font-black text-[#0B1630] tracking-widest uppercase">{col.title} ({col.count})</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {col.orders.map((order: any) => (
                        <Card key={order.id} className="p-4 border-none shadow-[0_4px_12px_rgba(0,0,0,0.03)] group hover:shadow-md transition-all">
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-black text-[#0B1630]">#{order.id.slice(0, 8)}</span>
                              <span className="text-[10px] text-[#94A3B8] font-bold">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                           <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] mb-2">
                              <span>Table {order.table?.number || 'N/A'} • {order.items?.length || 0} Items</span>
                              <span className="text-[#F97316]">${Number(order.totalAmount).toFixed(2)}</span>
                           </div>
                           <div className="text-[10px] font-bold text-indigo-500 mb-4">
                              🧑‍🍳 {order.waiterName || 'Unassigned'}
                           </div>
                           <div className="flex items-center gap-1.5 mb-6">
                              <div className="flex -space-x-1.5">
                                 {order.items?.slice(0, 3).map((item: any, j: number) => (
                                    <div key={j} className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 flex items-center justify-center text-xs shadow-sm" title={item.menuItem?.name}>
                                       🍳
                                    </div>
                                 ))}
                              </div>
                              {order.items?.length > 3 && <span className="text-[10px] font-black text-[#94A3B8] ml-2">+{order.items.length - 3}</span>}
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              {col.title !== 'READY' && col.title !== 'CANCELED' ? (
                                 <button 
                                   onClick={() => handleStatusUpdate(order.id, order.status)}
                                   disabled={updateStatusMutation.isPending}
                                   className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#F97316] hover:bg-orange-50 transition-colors disabled:opacity-50"
                                 >
                                    {col.title === 'NEW ORDERS' ? 'Start Preparing' : 'Mark as Ready'}
                                 </button>
                               ) : col.title === 'READY' ? (
                                 <div className="flex items-center justify-center gap-1.5 w-full text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                    <CheckCircle2 size={12} /> Ready to Serve
                                 </div>
                               ) : null}
                              <button className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-all">
                                 <ChevronRight size={14} />
                              </button>
                           </div>
                        </Card>
                     ))}
                     <button className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest hover:text-[#0B1630] transition-colors">
                        View all orders <ChevronRight size={12} />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Tip Bar */}
      <div className="bg-white border-t border-slate-100 p-4 px-8 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
               <Lightbulb size={18} />
            </div>
            <p className="text-xs font-medium text-[#64748B]">
               <span className="font-bold text-[#0B1630] uppercase text-[10px] mr-2">TIP</span>
               Focus on orders by priority and preparation time to improve kitchen efficiency.
            </p>
         </div>
         <div className="flex items-center gap-4 text-[#94A3B8] text-xs font-mono font-bold">
            <div className="flex items-center gap-2">
             <Clock size={14} /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </div>
             <div className="border-l border-slate-200 pl-4 h-4" />
             <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
         </div>
      </div>
    </div>
  );
};
