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
  X,
  FileText,
  User,
  DollarSign
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
      <div className="bg-[#070913]/95 border border-[#232B5E]/30 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-950/20 border-b border-[#232B5E]/10 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Cancel Order</h2>
              <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">
                #{order.id?.slice(0, 8).toUpperCase()} · Table {order.table?.number || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-bold text-[#94A3B8]">
            This action cannot be undone. The order will be permanently marked as cancelled and the waiter will be notified.
          </p>

          {/* Order summary */}
          <div className="bg-[#131A38]/30 border border-[#232B5E]/20 rounded-2xl p-4 space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-[#94A3B8]">
              <span>Items</span>
              <span className="text-white">{order.items?.length || 0}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-[#94A3B8]">
              <span>Total</span>
              <span className="text-[#F97316] font-black">${Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-[#94A3B8]">
              <span>Current Status</span>
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                order.status === 'PENDING' ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/20' : 'bg-orange-950/40 text-orange-300 border border-orange-500/20'
              )}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Reason selector */}
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-wider mb-2">
              Cancellation Reason <span className="text-red-400">*</span>
            </p>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => { setSelected(reason); if (reason !== 'Other') setCustom(''); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl border text-xs font-bold transition-all",
                    selected === reason
                      ? "border-red-500/40 bg-red-950/30 text-red-300"
                      : "border-[#232B5E]/20 bg-[#131A38]/10 text-[#94A3B8] hover:border-[#232B5E]/40 hover:bg-[#131A38]/30"
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
                className="mt-3 w-full px-4 py-3 rounded-xl border border-[#232B5E]/20 bg-[#131A38]/10 text-xs text-white focus:outline-none focus:border-red-500/40 placeholder:text-[#94A3B8] resize-none"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 rounded-2xl border border-[#232B5E]/20 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] hover:bg-[#1E293B]/20 transition-all disabled:opacity-50"
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

// ── OrderDetailsDialog ───────────────────────────────────────────────────────
interface OrderDetailsDialogProps {
  order: any;
  onClose: () => void;
  onStatusUpdate: (orderId: string, currentStatus: string) => void;
  onCancel: (order: any) => void;
  isUpdating: boolean;
  activeStation: string;
}

const OrderDetailsDialog = ({ order, onClose, onStatusUpdate, onCancel, isUpdating, activeStation }: OrderDetailsDialogProps) => {
  const stationItems = (order.items || []).filter((item: any) => {
    const itemStation = item.menuItem?.preparationStation || 'Chef';
    return itemStation === activeStation;
  });

  const getStationOrderStatus = () => {
    if (order.status === 'CANCELED') return 'CANCELED';
    if (stationItems.some((i: any) => i.status === 'PREPARING')) return 'PREPARING';
    if (stationItems.every((i: any) => i.status === 'READY' || i.status === 'CANCELED') && stationItems.length > 0) return 'READY';
    return 'PENDING';
  };

  const currentStationStatus = getStationOrderStatus();
  const isCancellable = currentStationStatus === 'PENDING' || currentStationStatus === 'PREPARING';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#070913]/95 border border-[#232B5E]/30 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-[#232B5E]/15 p-6 flex items-start justify-between gap-4 bg-[#131A38]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Order Details ({activeStation})</h2>
              <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">
                #{order.id?.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-slate-800/45 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#131A38]/20 border border-[#232B5E]/10 p-4 rounded-2xl flex items-center gap-3">
              <User size={16} className="text-[#94A3B8]" />
              <div>
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase">Waiter</p>
                <p className="text-xs font-bold text-white">{order.waiterName || 'Unassigned'}</p>
              </div>
            </div>
            <div className="bg-[#131A38]/20 border border-[#232B5E]/10 p-4 rounded-2xl flex items-center gap-3">
              <DollarSign size={16} className="text-[#94A3B8]" />
              <div>
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase">Total Amount</p>
                <p className="text-xs font-black text-[#F97316]">${Number(order.totalAmount || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-white uppercase tracking-wider">{activeStation} Station Items</h3>
            <div className="space-y-2">
              {stationItems?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-[#131A38]/10 border border-[#232B5E]/10 px-4 py-3 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-white">{item.quantity}x {item.menuItem?.name}</p>
                    <p className="text-[9px] font-medium text-[#94A3B8]">Unit Price: ${item.unitPrice?.toFixed(2)}</p>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                    item.status === 'PENDING' ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/20' :
                    item.status === 'PREPARING' ? 'bg-orange-950/40 text-orange-300 border border-orange-500/20' :
                    item.status === 'READY' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20' : 'bg-red-950/40 text-red-300 border border-red-500/20'
                  )}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation Info if cancelled */}
          {order.status === 'CANCELED' && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-red-400 uppercase">Cancellation Details</p>
              <p className="text-xs font-bold text-red-300">Reason: {order.cancellationReason || 'No reason specified'}</p>
              {order.cancelledAt && (
                <p className="text-[10px] font-medium text-red-400">
                  Time: {new Date(order.cancelledAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-[#232B5E]/15 flex items-center justify-between gap-3 bg-[#131A38]/5">
          <span className={cn(
            "text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest",
            currentStationStatus === 'PENDING' ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/20' :
            currentStationStatus === 'PREPARING' ? 'bg-orange-950/40 text-orange-300 border border-orange-500/20' :
            currentStationStatus === 'READY' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20' : 'bg-red-950/40 text-red-300 border border-red-500/20'
          )}>
            Station: {currentStationStatus}
          </span>
          <div className="flex items-center gap-2">
            {isCancellable && (
              <button
                onClick={() => { onClose(); onCancel(order); }}
                disabled={isUpdating}
                className="px-4 py-2.5 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}
            {currentStationStatus !== 'READY' && currentStationStatus !== 'CANCELED' && (
              <button
                onClick={() => { onClose(); onStatusUpdate(order.id, currentStationStatus); }}
                disabled={isUpdating}
                className="px-4 py-2.5 rounded-2xl bg-[#F97316] text-white hover:bg-[#ea580c] text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {currentStationStatus === 'PENDING' ? 'Start Preparing' : 'Mark as Ready'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-[#232B5E]/20 text-[#94A3B8] hover:bg-[#1E293B]/20 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── ViewAllOrdersDialog ──────────────────────────────────────────────────────
interface ViewAllOrdersDialogProps {
  title: string;
  status: string;
  orders: any[];
  onClose: () => void;
  onSelectOrder: (order: any) => void;
  onStatusUpdate: (orderId: string, currentStatus: string) => void;
  onCancel: (order: any) => void;
  isUpdating: boolean;
  activeStation: string;
}

const ViewAllOrdersDialog = ({
  title,
  status,
  orders,
  onClose,
  onSelectOrder,
  onStatusUpdate,
  onCancel,
  isUpdating,
  activeStation
}: ViewAllOrdersDialogProps) => {
  
  const getStationOrderStatus = (order: any) => {
    if (order.status === 'CANCELED') return 'CANCELED';
    const stationItems = (order.items || []).filter((item: any) => {
      const itemStation = item.menuItem?.preparationStation || 'Chef';
      return itemStation === activeStation;
    });
    if (stationItems.some((i: any) => i.status === 'PREPARING')) return 'PREPARING';
    if (stationItems.every((i: any) => i.status === 'READY' || i.status === 'CANCELED') && stationItems.length > 0) return 'READY';
    return 'PENDING';
  };

  const filtered = orders.map((o) => {
    const stationItems = (o.items || []).filter((item: any) => {
      const itemStation = item.menuItem?.preparationStation || 'Chef';
      return itemStation === activeStation;
    });
    return { ...o, stationItems };
  }).filter((o) => o.stationItems.length > 0 && getStationOrderStatus(o) === status);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#070913]/95 border border-[#232B5E]/30 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-[#232B5E]/15 p-6 flex items-start justify-between bg-[#131A38]/10">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">{title} ({filtered.length})</h2>
            <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">Viewing {activeStation} status list</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-slate-800/45 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* List Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Receipt size={40} className="mx-auto text-[#232B5E] mb-3" />
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">No orders in this status</p>
            </div>
          ) : (
            filtered.map((order) => (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="flex items-center justify-between p-4 border border-[#232B5E]/10 bg-[#131A38]/10 rounded-2xl hover:border-orange-500/50 hover:bg-[#F97316]/5 transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-[9px] font-bold text-[#94A3B8]">Table {order.table?.number || 'N/A'}</span>
                  </div>
                  <p className="text-[10px] text-[#94A3B8] font-medium">
                    {order.stationItems?.length || 0} station items · ${Number(order.totalAmount).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {status !== 'READY' && status !== 'CANCELED' && (
                    <button
                      onClick={() => onStatusUpdate(order.id, getStationOrderStatus(order))}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-[9px] font-black uppercase tracking-wider hover:bg-[#F97316] hover:text-white transition-all disabled:opacity-50"
                    >
                      {status === 'PENDING' ? 'Start Preparing' : 'Mark Ready'}
                    </button>
                  )}
                  {(status === 'PENDING' || status === 'PREPARING') && (
                    <button
                      onClick={() => onCancel(order)}
                      disabled={isUpdating}
                      className="p-1.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                  <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-white transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-[#232B5E]/15 bg-[#131A38]/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#F97316] text-white hover:bg-[#ea580c] text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── OrdersMonitor ────────────────────────────────────────────────────────────
export const OrdersMonitor = () => {
  const { tenant } = useTenant();
  const { user, role, preparationStation } = useAuth();
  const queryClient = useQueryClient();

  // Accordion open state for mobile sections
  const [openSection, setOpenSection] = useState<string | null>('NEW ORDERS');
  // Dialog / Modal states
  const [cancelling, setCancelling] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [viewingAllStatus, setViewingAllStatus] = useState<string | null>(null);

  // 1. Determine active station
  const userStation = preparationStation || 'Chef';
  const isKdsUser = role === 'KITCHEN_STAFF';
  const [activeStation, setActiveStation] = useState<string>('Chef');

  useEffect(() => {
    if (isKdsUser && preparationStation) {
      setActiveStation(preparationStation);
    }
  }, [isKdsUser, preparationStation]);

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
      OrderService.updateStationItemsStatus(orderId, activeStation, status),
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

  // Filter orders and map stationItems
  const filteredOrdersForStation = orders.map((order: any) => {
    const stationItems = (order.items || []).filter((item: any) => {
      const itemStation = item.menuItem?.preparationStation || 'Chef';
      return itemStation === activeStation;
    });
    return {
      ...order,
      stationItems,
    };
  }).filter((order: any) => order.stationItems.length > 0);

  const getStationOrderStatus = (order: any) => {
    if (order.status === 'CANCELED') return 'CANCELED';
    const items = order.stationItems || [];
    if (items.some((i: any) => i.status === 'PREPARING')) return 'PREPARING';
    if (items.every((i: any) => i.status === 'READY' || i.status === 'CANCELED') && items.length > 0) return 'READY';
    return 'PENDING';
  };

  const handleStatusUpdate = (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'PENDING') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    
    if (nextStatus) {
      updateStatusMutation.mutate({ orderId, status: nextStatus });
    }
  };

  const isCancellable = (status: string) => status === 'PENDING' || status === 'PREPARING';

  // Average preparation time calculation
  const readyOrders = filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'READY');
  const avgPrepTime = readyOrders.length > 0
    ? Math.round(readyOrders.reduce((acc: number, o: any) => {
        const diff = new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime();
        return acc + (diff / 60000);
      }, 0) / readyOrders.length)
    : 12; // default fallback if no orders prepared yet

  const kpis = [
    { label: 'New Orders', value: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'PENDING').length.toString(), sub: 'Start', icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-50', darkBg: 'bg-indigo-500/10', darkColor: 'text-indigo-400' },
    { label: 'Preparing', value: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'PREPARING').length.toString(), sub: 'In Progress', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', darkBg: 'bg-orange-500/10', darkColor: 'text-orange-400' },
    { label: 'Ready', value: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'READY').length.toString(), sub: 'Finished Cooking', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', darkBg: 'bg-emerald-500/10', darkColor: 'text-emerald-400' },
    { label: 'Canceled', value: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'CANCELED').length.toString(), sub: 'Canceled Orders', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', darkBg: 'bg-red-500/10', darkColor: 'text-red-400' },
  ];

  if (activeStation === 'Chef') {
    kpis.push({
      label: 'Avg Prep Time',
      value: `${avgPrepTime} min`,
      sub: "Today's average",
      icon: Clock,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      darkBg: 'bg-purple-500/10',
      darkColor: 'text-purple-400'
    });
  }

  const columns = [
    {
      title: 'NEW ORDERS',
      status: 'PENDING',
      count: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'PENDING').length,
      color: 'border-indigo-500',
      accentColor: 'text-indigo-400',
      orders: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'PENDING')
    },
    {
      title: 'PREPARING',
      status: 'PREPARING',
      count: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'PREPARING').length,
      color: 'border-orange-500',
      accentColor: 'text-orange-400',
      orders: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'PREPARING')
    },
    {
      title: 'READY',
      status: 'READY',
      count: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'READY').length,
      color: 'border-emerald-500',
      accentColor: 'text-emerald-400',
      orders: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'READY')
    },
    {
      title: 'CANCELED',
      status: 'CANCELED',
      count: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'CANCELED').length,
      color: 'border-red-500',
      accentColor: 'text-red-400',
      orders: filteredOrdersForStation.filter((o: any) => getStationOrderStatus(o) === 'CANCELED')
    },
  ];

  // ── Shared order card content renderer ──────────────────────────────────
  const renderOrderItems = (order: any, col: typeof columns[0]) => {
    const activeItems = (order.stationItems || []).filter((item: any) => 
      col.title === 'NEW ORDERS' ? item.status === 'PENDING' : 
      col.title === 'PREPARING' ? item.status === 'PREPARING' :
      item.status === 'READY'
    );
    const historyItems = (order.stationItems || []).filter((item: any) => 
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
                <div key={idx} className="flex justify-between items-center text-xs font-bold bg-[#F97316]/15 border border-[#F97316]/20 px-2.5 py-1 rounded-lg">
                   <span className="text-orange-100">{item.quantity}x {item.menuItem?.name || 'Item'}</span>
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
                <div key={idx} className="flex justify-between items-center text-xs font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg opacity-60">
                   <span className="text-slate-300">{item.quantity}x {item.menuItem?.name || 'Item'}</span>
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
      <div className="mt-3 px-3 py-2 bg-red-500/10 rounded-xl border border-red-500/20 space-y-1">
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
      {/* ── Page title & station switcher ── */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-4">
        <div className="flex items-center gap-4">
           <h1 className="text-3xl font-bold text-white">
             {activeStation} Dashboard
           </h1>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Station switcher for ADMIN / SUPER_ADMIN */}
        {!isKdsUser && (
          <div className="flex items-center gap-2 bg-[#131A38]/30 p-1.5 rounded-2xl border border-[#232B5E]/20">
            {['Chef', 'Barista', 'Kitchen Staff'].map((station) => (
              <button
                key={station}
                onClick={() => setActiveStation(station)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                  activeStation === station
                    ? "bg-[#F97316] text-white shadow-md shadow-orange-500/20"
                    : "text-[#94A3B8] hover:text-white"
                )}
              >
                {station}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── KPI Row — Desktop (lg+) ── */}
      <div className={cn(
        "hidden lg:grid gap-6 shrink-0",
        activeStation === 'Chef' ? "grid-cols-5" : "grid-cols-4"
      )}>
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-4 bg-[#0C0F24]/65 border border-[#232B5E]/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center gap-4">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", kpi.darkBg, kpi.darkColor)}>
                <kpi.icon size={24} />
             </div>
             <div>
               <h3 className="text-2xl font-black text-white leading-none mb-1">{kpi.value}</h3>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/95 uppercase tracking-wider">{kpi.label}</span>
                  <span className="text-[9px] text-[#94A3B8] font-medium leading-none">{kpi.sub}</span>
               </div>
             </div>
          </Card>
        ))}
      </div>

      {/* ── KPI Row — Mobile/Tablet (below lg) ── */}
      <div className={cn(
        "lg:hidden grid gap-3 shrink-0",
        activeStation === 'Chef' ? "grid-cols-3" : "grid-cols-2"
      )}>
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
               <div key={i} className="flex-1 min-w-[300px] flex flex-col bg-[#0C0F24]/50 rounded-3xl overflow-hidden border border-[#232B5E]/30">
                  <div className={cn("p-4 border-b-4 flex items-center justify-between bg-[#131A38]/30", col.color)}>
                     <h3 className="text-[10px] font-black text-white tracking-widest uppercase">{col.title} ({col.count})</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {col.orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-[#232B5E]/60">
                           <Receipt size={36} className="opacity-40 mb-2" />
                           <p className="text-center text-[10px] text-[#94A3B8] font-black uppercase tracking-widest">
                              No orders
                           </p>
                        </div>
                     ) : (
                        col.orders.map((order: any) => (
                           <Card 
                             key={order.id} 
                             onClick={() => setSelectedOrder(order)}
                             className="p-4 bg-[#141935]/65 border border-[#232B5E]/20 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:border-[#F97316]/50 hover:shadow-[0_4px_25px_rgba(249,115,22,0.1)] group transition-all duration-300 cursor-pointer"
                           >
                              <div className="flex items-center justify-between mb-4">
                                 <span className="text-xs font-black text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                                 <span className="text-[10px] text-[#94A3B8] font-bold">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-[#94A3B8] mb-2">
                                 <span>Table {order.table?.number || 'N/A'} • {order.stationItems?.length || 0} Items</span>
                                 <span className="text-[#F97316] font-black">${Number(order.totalAmount).toFixed(2)}</span>
                              </div>
                              <div className="text-[10px] font-bold text-indigo-400 mb-4">
                                 🧑‍🍳 {order.waiterName || 'Unassigned'}
                              </div>
                               {/* Grouped Items List */}
                               <div className="space-y-3 mb-4">
                                 {renderOrderItems(order, col)}
                               </div>

                              {/* Cancelled info */}
                              {col.title === 'CANCELED' && renderCancelledInfo(order)}

                              <div className="flex items-center justify-between pt-4 border-t border-[#232B5E]/20 gap-2" onClick={(e) => e.stopPropagation()}>
                                 {/* Progress action */}
                                 {col.title !== 'READY' && col.title !== 'CANCELED' ? (
                                    <button 
                                      onClick={() => handleStatusUpdate(order.id, getStationOrderStatus(order))}
                                      disabled={updateStatusMutation.isPending}
                                      className="flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#F97316] bg-[#F97316]/10 border border-[#F97316]/30 hover:bg-[#F97316] hover:text-white transition-colors disabled:opacity-50"
                                    >
                                       {col.title === 'NEW ORDERS' ? 'Start Preparing' : 'Mark as Ready'}
                                    </button>
                                  ) : col.title === 'READY' ? (
                                    <div className="flex items-center justify-center gap-1.5 flex-1 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                       <CheckCircle2 size={12} /> Ready to Serve
                                    </div>
                                  ) : null}

                                 {/* Cancel button — only for PENDING / PREPARING */}
                                 {isCancellable(getStationOrderStatus(order)) && (
                                   <button
                                     onClick={() => setCancelling(order)}
                                     disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                                     className="py-1.5 px-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/5 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                     title="Cancel order"
                                   >
                                     <XCircle size={14} />
                                   </button>
                                 )}

                                 <button 
                                   onClick={() => setSelectedOrder(order)}
                                   className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/40 transition-all"
                                 >
                                    <ChevronRight size={14} />
                                 </button>
                              </div>
                           </Card>
                        ))
                     )}
                     <button 
                       onClick={() => setViewingAllStatus(col.status)}
                       className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest hover:text-white transition-colors"
                     >
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
                        onClick={() => setSelectedOrder(order)}
                        className="bg-[#0E1537]/80 border border-[#232B5E]/40 rounded-xl p-4 space-y-3 cursor-pointer"
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
                          <span className="text-[#94A3B8]">Table {order.table?.number || 'N/A'} • {order.stationItems?.length || 0} Items</span>
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
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {col.title !== 'READY' && col.title !== 'CANCELED' ? (
                            <button
                              onClick={() => handleStatusUpdate(order.id, getStationOrderStatus(order))}
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
                          {isCancellable(getStationOrderStatus(order)) && (
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

                  <button 
                    onClick={() => setViewingAllStatus(col.status)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black text-[#94A3B8] uppercase tracking-widest hover:text-white transition-colors"
                  >
                    View all orders <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Tip Bar ── */}
      <div className="bg-[#0C0F24]/50 backdrop-blur-md border-t border-[#232B5E]/20 p-4 px-8 flex items-center justify-between shrink-0 rounded-2xl lg:rounded-none">
         <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
               <Lightbulb size={18} />
            </div>
            <p className="text-xs font-medium text-[#94A3B8]">
               <span className="font-bold text-white uppercase text-[10px] mr-2">TIP</span>
               Focus on orders by priority and preparation time to improve kitchen efficiency.
            </p>
         </div>
         <div className="flex items-center gap-4 text-[#94A3B8] text-xs font-mono font-bold">
            <div className="flex items-center gap-2">
             <Clock size={14} /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </div>
             <div className="border-l border-[#232B5E]/20 pl-4 h-4" />
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

      {/* ── Order Details Dialog ── */}
      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onCancel={setCancelling}
          isUpdating={updateStatusMutation.isPending || cancelMutation.isPending}
          activeStation={activeStation}
        />
      )}

      {/* ── View All Orders Dialog ── */}
      {viewingAllStatus && (
        <ViewAllOrdersDialog
          title={columns.find((c) => c.status === viewingAllStatus)?.title || 'Orders'}
          status={viewingAllStatus}
          orders={orders}
          onClose={() => setViewingAllStatus(null)}
          onSelectOrder={(order) => { setSelectedOrder(order); setViewingAllStatus(null); }}
          onStatusUpdate={handleStatusUpdate}
          onCancel={(order) => { setCancelling(order); setViewingAllStatus(null); }}
          isUpdating={updateStatusMutation.isPending || cancelMutation.isPending}
          activeStation={activeStation}
        />
      )}
    </div>
  );
};
