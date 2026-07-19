import { useEffect, useState } from 'react';
import { 
  Receipt, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Lightbulb,
  ChevronDown,
  AlertTriangle,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { toast } from '../../lib/toast-store';

// ── Cancellation reasons ─────────────────────────────────────────────────────
const CANCELLATION_REASONS = [
  'Out of stock',
  'Ingredient unavailable',
  'Equipment failure',
  'Duplicate order',
  'Kitchen error',
  'Other',
] as const;

// ── CancellationDialog ───────────────────────────────────────────────────────
interface CancellationDialogProps {
  order: any;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isPending: boolean;
}

const CancellationDialog = ({ order, onConfirm, onClose, isPending }: CancellationDialogProps) => {
  const [selected, setSelected] = useState('');
  const [custom, setCustom] = useState('');

  const effectiveReason = selected === 'Other' ? custom.trim() : selected;
  const canSubmit = !!effectiveReason && !isPending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#0B1630] uppercase tracking-wider">Cancel Order</h2>
              <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">
                #{order.id?.slice(0, 8).toUpperCase()} · Table {order.table?.number || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0B1630] hover:bg-red-100 transition-all disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-bold text-[#64748B]">
            This action cannot be undone. The order will be permanently marked as cancelled and the waiter will be notified.
          </p>

          {/* Order summary */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-[#64748B]">
              <span>Items</span>
              <span className="text-[#0B1630]">{order.items?.length || 0}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-[#64748B]">
              <span>Total</span>
              <span className="text-[#F97316]">${Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-[#64748B]">
              <span>Current Status</span>
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                order.status === 'PENDING' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
              )}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Reason selector */}
          <div>
            <p className="text-[10px] font-black text-[#0B1630] uppercase tracking-wider mb-2">
              Cancellation Reason <span className="text-red-500">*</span>
            </p>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => { setSelected(reason); if (reason !== 'Other') setCustom(''); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl border text-xs font-bold transition-all",
                    selected === reason
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-slate-100 bg-slate-50/50 text-[#64748B] hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* Custom reason input */}
            {selected === 'Other' && (
              <textarea
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Describe the reason..."
                rows={2}
                maxLength={200}
                className="mt-3 w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs focus:outline-none focus:border-red-300 placeholder:text-[#94A3B8] resize-none"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-[#64748B] hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={() => onConfirm(effectiveReason)}
            disabled={!canSubmit}
            className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Cancelling…
              </>
            ) : (
              <>
                <XCircle size={14} /> Confirm Cancel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── OrdersMonitor ────────────────────────────────────────────────────────────
export const OrdersMonitor = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Accordion open state for mobile sections
  const [openSection, setOpenSection] = useState<string | null>('NEW ORDERS');
  // Cancellation dialog state
  const [cancelling, setCancelling] = useState<any | null>(null);

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

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      OrderService.cancelOrder({
        orderId,
        reason,
        cancelledBy: user?.id || '',
        tenantId: tenant?.id || '',
        cancelledByName: user ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'Kitchen Staff' : 'Kitchen Staff',
        tableNumber: cancelling?.table?.number,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled', 'The waiter has been notified.');
      setCancelling(null);
    },
    onError: (err: any) => {
      toast.error('Cannot cancel', err?.message || 'Order could not be cancelled.');
      setCancelling(null);
    },
  });

  const handleStatusUpdate = (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'PENDING') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    
    if (nextStatus) {
      updateStatusMutation.mutate({ orderId, status: nextStatus });
    }
  };

  const isCancellable = (status: string) => status === 'PENDING' || status === 'PREPARING';

  const kpis = [
    { label: 'New Orders', value: orders.filter((o: any) => o.status === 'PENDING').length.toString(), sub: 'Start', icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-50', darkBg: 'bg-indigo-500/10', darkColor: 'text-indigo-400' },
    { label: 'Preparing', value: orders.filter((o: any) => o.status === 'PREPARING').length.toString(), sub: 'In Progress', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', darkBg: 'bg-orange-500/10', darkColor: 'text-orange-400' },
    { label: 'Ready', value: orders.filter((o: any) => o.status === 'READY').length.toString(), sub: 'Finished Cooking', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', darkBg: 'bg-emerald-500/10', darkColor: 'text-emerald-400' },
    { label: 'Canceled', value: orders.filter((o: any) => o.status === 'CANCELED').length.toString(), sub: 'Canceled Orders', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', darkBg: 'bg-red-500/10', darkColor: 'text-red-400' },
  ];

  const columns = [
    {
      title: 'NEW ORDERS',
      count: orders.filter((o: any) => o.status === 'PENDING').length,
      color: 'border-indigo-500',
      accentColor: 'text-indigo-400',
      orders: orders.filter((o: any) => o.status === 'PENDING')
    },
    {
      title: 'PREPARING',
      count: orders.filter((o: any) => o.status === 'PREPARING').length,
      color: 'border-orange-500',
      accentColor: 'text-orange-400',
      orders: orders.filter((o: any) => o.status === 'PREPARING')
    },
    {
      title: 'READY',
      count: orders.filter((o: any) => o.status === 'READY').length,
      color: 'border-emerald-500',
      accentColor: 'text-emerald-400',
      orders: orders.filter((o: any) => o.status === 'READY')
    },
    {
      title: 'CANCELED',
      count: orders.filter((o: any) => o.status === 'CANCELED').length,
      color: 'border-red-500',
      accentColor: 'text-red-400',
      orders: orders.filter((o: any) => o.status === 'CANCELED')
    },
  ];

  // ── Shared order card content renderer ──────────────────────────────────
  const renderOrderItems = (order: any, col: typeof columns[0]) => {
    const activeItems = (order.items || []).filter((item: any) => 
      col.title === 'NEW ORDERS' ? item.status === 'PENDING' : 
      col.title === 'PREPARING' ? item.status === 'PREPARING' :
      item.status === 'READY'
    );
    const historyItems = (order.items || []).filter((item: any) => 
      col.title === 'NEW ORDERS' ? item.status !== 'PENDING' : 
      col.title === 'PREPARING' ? item.status !== 'PREPARING' :
      item.status !== 'READY'
    );
    return (
      <>
        {activeItems.length > 0 && (
          <div>
            <span className="text-[8px] font-black text-[#F97316] uppercase tracking-wider block mb-1">
               {col.title === 'NEW ORDERS' ? 'To Prepare (New)' : 'Cooking'}
            </span>
            <div className="space-y-1">
              {activeItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs font-bold text-[#0B1630] lg:bg-orange-50/50 bg-orange-500/10 px-2.5 py-1 rounded-lg">
                   <span className="lg:text-[#0B1630] text-orange-100">{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                   <span className="text-[8px] uppercase font-black text-[#F97316]">Active</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {historyItems.length > 0 && (
          <div className="mt-3">
            <span className="text-[8px] font-black text-[#94A3B8] uppercase tracking-wider block mb-1">
               Previous / History
            </span>
            <div className="space-y-1">
              {historyItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs font-bold text-[#64748B] lg:bg-slate-50 bg-white/5 px-2.5 py-1 rounded-lg opacity-60">
                   <span className="lg:text-[#64748B] text-slate-300">{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                   <span className="text-[8px] uppercase font-black text-[#94A3B8]">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  // ── Cancelled order card info (reason / cancelled by) ──────────────────
  const renderCancelledInfo = (order: any) => {
    if (!order.cancellationReason && !order.cancelledBy) return null;
    return (
      <div className="mt-3 px-3 py-2 bg-red-50 rounded-xl border border-red-100 space-y-1">
        {order.cancellationReason && (
          <p className="text-[10px] font-bold text-red-700">
            <span className="text-[9px] uppercase tracking-wider text-red-400 font-black mr-1">Reason:</span>
            {order.cancellationReason}
          </p>
        )}
        {order.cancelledAt && (
          <p className="text-[9px] text-red-400 font-bold">
            {new Date(order.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    );
  };

  // Mobile version of cancelled info (dark glass)
  const renderCancelledInfoDark = (order: any) => {
    if (!order.cancellationReason && !order.cancelledBy) return null;
    return (
      <div className="mt-2 px-3 py-2 bg-red-500/10 rounded-xl border border-red-500/20 space-y-1">
        {order.cancellationReason && (
          <p className="text-[10px] font-bold text-red-300">
            <span className="text-[9px] uppercase tracking-wider text-red-400 font-black mr-1">Reason:</span>
            {order.cancellationReason}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-8 overflow-hidden">
      {/* ── Page title (shared) ── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <h1 className="text-3xl font-bold lg:text-[#0B1630] text-white">My Orders</h1>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="lg:text-emerald-600 text-emerald-400 text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* ── KPI Row — Desktop (lg+) ── */}
      <div className="hidden lg:grid grid-cols-4 gap-6 shrink-0">
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

      {/* ── KPI Row — Mobile/Tablet (below lg) ── */}
      <div className="lg:hidden grid grid-cols-2 gap-3 shrink-0">
        {kpis.map((kpi, i) => (
          <div key={i} className={cn(
            "bg-[#131A38]/70 backdrop-blur-md border border-[#232B5E]/50 rounded-2xl p-3 flex items-center gap-3",
          )}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", kpi.darkBg, kpi.darkColor)}>
              <kpi.icon size={20} />
            </div>
            <div>
              <h3 className={cn("text-xl font-black leading-none mb-0.5", kpi.darkColor)}>{kpi.value}</h3>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider block">{kpi.label}</span>
              <span className="text-[9px] text-[#94A3B8] font-medium">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP Kanban Board (lg+) ── */}
      <div className="hidden lg:flex flex-1 overflow-x-auto overflow-y-hidden pb-4">
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
                            {/* Grouped Items List */}
                            <div className="space-y-3 mb-4">
                              {renderOrderItems(order, col)}
                            </div>

                           {/* Cancelled info */}
                           {col.title === 'CANCELED' && renderCancelledInfo(order)}

                           <div className="flex items-center justify-between pt-4 border-t border-slate-50 gap-2">
                              {/* Progress action */}
                              {col.title !== 'READY' && col.title !== 'CANCELED' ? (
                                 <button 
                                   onClick={() => handleStatusUpdate(order.id, order.status)}
                                   disabled={updateStatusMutation.isPending}
                                   className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#F97316] hover:bg-orange-50 transition-colors disabled:opacity-50"
                                 >
                                    {col.title === 'NEW ORDERS' ? 'Start Preparing' : 'Mark as Ready'}
                                 </button>
                               ) : col.title === 'READY' ? (
                                 <div className="flex items-center justify-center gap-1.5 flex-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                    <CheckCircle2 size={12} /> Ready to Serve
                                 </div>
                               ) : null}

                              {/* Cancel button — only for PENDING / PREPARING */}
                              {isCancellable(order.status) && (
                                <button
                                  onClick={() => setCancelling(order)}
                                  disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                                  className="py-1.5 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                  title="Cancel order"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}

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

      {/* ── MOBILE/TABLET Stacked Accordion Sections (below lg) ── */}
      <div className="lg:hidden flex-1 overflow-y-auto space-y-3 pb-2">
        {columns.map((col, i) => {
          const isOpen = openSection === col.title;
          return (
            <div key={i} className="bg-[#131A38]/70 backdrop-blur-md border border-[#232B5E]/50 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
              {/* Accordion Header */}
              <button
                className="w-full p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setOpenSection(isOpen ? null : col.title)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-1 h-5 rounded-full", col.color.replace('border-', 'bg-'))} />
                  <span className="text-xs font-black text-white uppercase tracking-widest">{col.title}</span>
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10", col.accentColor)}>
                    {col.count}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={cn("text-[#94A3B8] transition-transform duration-200", isOpen && "rotate-180")}
                />
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="px-3 pb-3 space-y-3">
                  {col.orders.length === 0 ? (
                    <p className="text-center text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest py-4">
                      No orders
                    </p>
                  ) : (
                    col.orders.map((order: any) => (
                      <div
                        key={order.id}
                        className="bg-[#0E1537]/80 border border-[#232B5E]/40 rounded-xl p-4 space-y-3"
                      >
                        {/* Order header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">#{order.id.slice(0, 8)}</span>
                          <span className="text-[10px] text-[#94A3B8] font-bold">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {/* Table / amount / waiter */}
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-[#94A3B8]">Table {order.table?.number || 'N/A'} • {order.items?.length || 0} Items</span>
                          <span className="text-[#F97316]">${Number(order.totalAmount).toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] font-bold text-indigo-400">
                          🧑‍🍳 {order.waiterName || 'Unassigned'}
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          {renderOrderItems(order, col)}
                        </div>

                        {/* Cancelled reason (dark) */}
                        {col.title === 'CANCELED' && renderCancelledInfoDark(order)}

                        {/* Action */}
                        <div className="flex items-center gap-2">
                          {col.title !== 'READY' && col.title !== 'CANCELED' ? (
                            <button
                              onClick={() => handleStatusUpdate(order.id, order.status)}
                              disabled={updateStatusMutation.isPending}
                              className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#F97316] border border-[#F97316]/30 hover:bg-[#F97316]/10 transition-colors disabled:opacity-50 flex items-center justify-between px-4"
                            >
                              <span>{col.title === 'NEW ORDERS' ? 'Start Preparing' : 'Mark as Ready'}</span>
                              <ChevronRight size={14} />
                            </button>
                          ) : col.title === 'READY' ? (
                            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                              <CheckCircle2 size={12} /> Ready to Serve
                            </div>
                          ) : null}

                          {/* Cancel button mobile */}
                          {isCancellable(order.status) && (
                            <button
                              onClick={() => setCancelling(order)}
                              disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                              className="p-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              title="Cancel order"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  <button className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest hover:text-white transition-colors">
                    View all orders <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Tip Bar ── */}
      <div className="lg:bg-white lg:border-t lg:border-slate-100 bg-[#131A38]/70 backdrop-blur-md border-t border-[#232B5E]/30 p-4 px-8 flex items-center justify-between shrink-0 rounded-2xl lg:rounded-none">
         <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 lg:bg-orange-50 bg-orange-500/10 text-orange-500 flex items-center justify-center">
               <Lightbulb size={18} />
            </div>
            <p className="text-xs font-medium lg:text-[#64748B] text-[#94A3B8]">
               <span className="font-bold lg:text-[#0B1630] text-white uppercase text-[10px] mr-2">TIP</span>
               Focus on orders by priority and preparation time to improve kitchen efficiency.
            </p>
         </div>
         <div className="flex items-center gap-4 text-[#94A3B8] text-xs font-mono font-bold">
            <div className="flex items-center gap-2">
             <Clock size={14} /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </div>
             <div className="border-l border-[#232B5E]/30 lg:border-slate-200 pl-4 h-4" />
             <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
         </div>
      </div>

      {/* ── Cancellation Dialog (portal-like, rendered outside kanban scroll) ── */}
      {cancelling && (
        <CancellationDialog
          order={cancelling}
          onConfirm={(reason) => cancelMutation.mutate({ orderId: cancelling.id, reason })}
          onClose={() => setCancelling(null)}
          isPending={cancelMutation.isPending}
        />
      )}
    </div>
  );
};
