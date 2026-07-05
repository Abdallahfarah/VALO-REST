import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Receipt,
  X
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../lib/toast-store';
import { useCurrency } from '../services/CurrencyService';

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'NEW ORDER', color: 'orange' },
  PREPARING: { label: 'IN PREPARATION', color: 'blue' },
  READY: { label: 'READY FOR SERVICE', color: 'emerald' },
  COMPLETED: { label: 'COMPLETED', color: 'slate' },
  CANCELED: { label: 'CANCELED', color: 'red' },
};

// ─── Memoized OrderRow Component ───
interface OrderRowProps {
  order: any;
  isSelected: boolean;
  onSelect: (order: any) => void;
  getStatusStyle: (status: string) => any;
  getTimeLabel: (dateStr: string) => string;
  formatPrice: (price: number) => string;
}

const OrderRow = React.memo(({ order, isSelected, onSelect, getStatusStyle, getTimeLabel, formatPrice }: OrderRowProps) => {
  const style = getStatusStyle(order.status);
  return (
    <tr
      onClick={() => onSelect(order)}
      className={cn(
        "hover:bg-slate-50/50 transition-colors cursor-pointer",
        isSelected && "bg-orange-50/30"
      )}
    >
      <td className="px-6 py-4 text-sm font-bold text-[#0B1630]">#{order.id.slice(0, 8).toUpperCase()}</td>
      <td className="px-6 py-4">
        <p className="text-xs font-bold text-[#0B1630]">Table {order.table?.number || 'N/A'}</p>
      </td>
      <td className="px-6 py-4">
        <p className="text-xs font-bold text-[#0B1630]">{order.waiterName || 'Unassigned'}</p>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-bold text-[#64748B]">{order.items?.length || 0} items</span>
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit",
          style.bg
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
          {style.label}
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-bold text-[#0B1630]">{formatPrice(Number(order.totalAmount))}</td>
      <td className="px-6 py-4">
         <p className="text-xs font-bold text-[#0B1630]">{getTimeLabel(order.createdAt)}</p>
         <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider">
           {new Date(order.createdAt).toLocaleDateString()}
         </p>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="p-1.5 rounded-lg border border-slate-200 text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-colors cursor-pointer">
          <MoreHorizontal size={14} />
        </button>
      </td>
    </tr>
  );
});

OrderRow.displayName = 'OrderRow';

export const Orders = () => {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const { format: formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState('All Orders');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Realtime ───
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('admin-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenant?.id, queryClient]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      OrderService.updateOrderStatus(orderId, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', tenant?.id] });
      toast.success('Order updated', `Status changed to ${variables.status}`);
      if (selectedOrder?.id === variables.orderId) {
        setSelectedOrder(data);
      }
    },
  });

  // ─── Filtering ───
  const tabFilters: Record<string, string[]> = {
    'All Orders': [],
    'In Preparation': ['PREPARING'],
    'Ready for Service': ['READY'],
    'Awaiting Payment': ['COMPLETED'],
    'Completed': ['COMPLETED'],
    'Canceled': ['CANCELED'],
    'Pending': ['PENDING'],
  };

  const filteredOrders = orders.filter((o: any) => {
    const tabStatuses = tabFilters[activeTab];
    const matchesTab = !tabStatuses || tabStatuses.length === 0 || tabStatuses.includes(o.status);
    const matchesSearch = searchQuery === '' ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.table?.number?.toString().includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  // Auto-select first order
  useEffect(() => {
    if (filteredOrders.length > 0 && (!selectedOrder || !filteredOrders.find((o: any) => o.id === selectedOrder?.id))) {
      setSelectedOrder(filteredOrders[0]);
    }
  }, [filteredOrders]);

  const tabs = [
    { name: 'All Orders', count: orders.length },
    { name: 'Pending', count: orders.filter((o: any) => o.status === 'PENDING').length },
    { name: 'In Preparation', count: orders.filter((o: any) => o.status === 'PREPARING').length },
    { name: 'Ready for Service', count: orders.filter((o: any) => o.status === 'READY').length },
    { name: 'Completed', count: orders.filter((o: any) => o.status === 'COMPLETED').length },
    { name: 'Canceled', count: orders.filter((o: any) => o.status === 'CANCELED').length },
  ];

  const getStatusStyle = (status: string) => {
    const mapped = statusMap[status] || { label: status, color: 'slate' };
    const colors: Record<string, string> = {
      orange: 'bg-orange-50 text-orange-600',
      blue: 'bg-blue-50 text-blue-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      slate: 'bg-slate-50 text-slate-600',
      red: 'bg-red-50 text-red-600',
    };
    const dotColors: Record<string, string> = {
      orange: 'bg-orange-500',
      blue: 'bg-blue-500',
      emerald: 'bg-emerald-500',
      slate: 'bg-slate-400',
      red: 'bg-red-500',
    };
    return { label: mapped.label, bg: colors[mapped.color] || colors.slate, dot: dotColors[mapped.color] || dotColors.slate };
  };

  const getTimeLabel = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Orders</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Payment settlement and order monitoring workspace</p>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                  activeTab === tab.name 
                    ? "bg-[#0B1630] text-white shadow-sm" 
                    : "text-[#64748B] hover:bg-slate-50"
                )}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md",
                    activeTab === tab.name ? "bg-white/20 text-white" : "bg-slate-100 text-[#94A3B8]"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630]">
              <Calendar size={16} className="text-[#94A3B8]" />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" 
                placeholder="Search by order ID, table..."
              />
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <Card className="flex-1 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col bg-white">
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Waiter</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-12" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-slate-100 rounded w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-12" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-4 bg-slate-100 rounded w-4 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-xs text-slate-400 font-bold uppercase tracking-wider">No orders found</td>
                  </tr>
                ) : (
                  filteredOrders.map((order: any) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      isSelected={selectedOrder?.id === order.id}
                      onSelect={setSelectedOrder}
                      getStatusStyle={getStatusStyle}
                      getTimeLabel={getTimeLabel}
                      formatPrice={formatPrice}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-[#94A3B8] font-medium">Showing {filteredOrders.length} of {orders.length} orders</span>
          </div>
        </Card>
      </div>

      {/* Right Detail Panel */}
      <Card className="w-[380px] shrink-0 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden bg-white">
        {selectedOrder ? (
          <>
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-[#0B1630] text-lg">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mt-0.5",
                    selectedOrder.status === 'PENDING' ? "text-orange-500" :
                    selectedOrder.status === 'PREPARING' ? "text-blue-500 animate-pulse" :
                    selectedOrder.status === 'READY' ? "text-emerald-500" :
                    "text-slate-400"
                  )}>
                    {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                  </p>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-8">
               {/* Basic Info */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#64748B] text-xs font-semibold">
                     <Clock size={14} /> {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-2 text-[#F97316] text-[10px] font-bold uppercase tracking-wider">
                        <Receipt size={12} /> Order Information
                     </div>
                     <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-[#94A3B8] font-medium">Order ID</span>
                           <span className="text-[#0B1630] font-bold">{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-[#94A3B8] font-medium">Table</span>
                           <span className="text-[#0B1630] font-bold">Table {selectedOrder.table?.number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-[#94A3B8] font-medium">Waiter</span>
                           <span className="text-[#0B1630] font-bold">{selectedOrder.waiterName || 'Unassigned'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-[#94A3B8] font-medium">Status</span>
                           <span className="text-[#0B1630] font-bold">{statusMap[selectedOrder.status]?.label || selectedOrder.status}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-[#94A3B8] font-medium">Created</span>
                           <span className="text-[#0B1630] font-bold">{getTimeLabel(selectedOrder.createdAt)}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Ordered Items */}
               <div className="space-y-3">
                  <div className="text-[#0B1630] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#0B1630]" /> Ordered Items
                  </div>
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                       <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#0B1630] w-6">{item.quantity}x</span>
                          <span className="text-sm font-semibold text-[#64748B]">{item.menuItem?.name || 'Unknown Item'}</span>
                       </div>
                       <span className="text-sm font-bold text-[#0B1630]">{formatPrice(Number(item.price * item.quantity))}</span>
                    </div>
                  ))}
               </div>

               {/* Payment Summary */}
               <div className="space-y-3">
                  <div className="text-[#F97316] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" /> Payment Summary
                  </div>
                  <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-[#94A3B8] font-medium">Total</span>
                        <span className="text-[#0B1630] font-bold">{formatPrice(Number(selectedOrder.totalAmount))}</span>
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-[#0B1630] font-bold uppercase text-[10px] tracking-wider">Total Amount</span>
                        <span className="text-2xl font-black text-[#0B1630]">{formatPrice(Number(selectedOrder.totalAmount))}</span>
                     </div>
                  </div>
               </div>

               {/* Settlement Timeline */}
               <div className="space-y-4">
                  <div className="text-[#0B1630] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                     <Clock size={12} className="text-[#64748B]" /> Settlement Timeline
                  </div>
                  <div className="space-y-4 relative pl-4 after:absolute after:left-[7px] after:top-2 after:bottom-2 after:w-[1.5px] after:bg-slate-100">
                     {['PENDING', 'PREPARING', 'READY', 'COMPLETED'].map((step, idx) => {
                       const stepLabels = ['Order Placed', 'Kitchen Prep', 'Ready for Pick-up', 'Completed'];
                       const orderStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];
                       const currentIdx = orderStatuses.indexOf(selectedOrder.status);
                       const isComplete = idx <= currentIdx;
                       return (
                         <div key={step} className={cn("relative flex justify-between items-center", !isComplete && "grayscale opacity-50")}>
                            <div className={cn(
                              "absolute -left-[13px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white z-10",
                              isComplete ? "bg-emerald-500" : "bg-slate-200"
                            )}>
                              {isComplete && <CheckCircle2 size={8} className="text-white" />}
                            </div>
                            <span className="text-xs font-bold text-[#0B1630]">{stepLabels[idx]}</span>
                            <span className="text-[10px] text-[#94A3B8] font-medium uppercase">
                              {isComplete ? (idx === 0 ? getTimeLabel(selectedOrder.createdAt) : 'Done') : '--:--'}
                            </span>
                         </div>
                       );
                     })}
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="p-5 bg-white border-t border-slate-100 space-y-3">
               {selectedOrder.status === 'PENDING' && (
                 <button
                   onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'PREPARING' })}
                   disabled={updateStatusMutation.isPending}
                   className="w-full bg-[#F97316] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                 >
                   <Receipt size={18} /> Start Preparing
                 </button>
               )}
               {selectedOrder.status === 'PREPARING' && (
                 <button
                   onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'READY' })}
                   disabled={updateStatusMutation.isPending}
                   className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                 >
                   <CheckCircle2 size={18} /> Mark as Ready
                 </button>
               )}
               {selectedOrder.status !== 'CANCELED' && selectedOrder.status !== 'COMPLETED' && (
                 <button
                   onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'CANCELED' })}
                   disabled={updateStatusMutation.isPending}
                   className="w-full text-[#64748B] py-3 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
                 >
                   <X size={18} /> Cancel Order
                 </button>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Receipt size={40} className="text-[#E2E8F0] mb-4" />
            <p className="text-sm font-bold text-[#94A3B8]">Select an order to view details</p>
          </div>
        )}
      </Card>
    </div>
  );
};
