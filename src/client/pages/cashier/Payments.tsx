import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Receipt, 
  Search, 
  Filter, 
  ChevronRight, 
  Users, 
  Clock, 
  DollarSign, 
  Smartphone,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService, ActivityLogService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../services/CurrencyService';
import { supabase } from '../../../lib/supabase';
import { toast } from '../../lib/toast-store';

export const Payments = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState('Cash');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [discountRate, setDiscountRate] = useState<number>(0);
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Interactive filters and search states
  const [paymentFilter, setPaymentFilter] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setDiscountRate(0);
    setServiceChargeRate(0);
    setCashReceived('');
  }, [selectedOrderId]);

  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('cashier-orders-channel')
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

  const pendingOrders = orders.filter((o: any) => o.status === 'READY' || o.status === 'SERVED');
  const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED');
  
  // Scoped lists based on active filters
  const displayedOrders = paymentFilter === 'PENDING' ? pendingOrders : completedOrders;

  const filteredDisplayedOrders = displayedOrders.filter((o: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.table?.number && o.table.number.toString().includes(q))
    );
  });

  const selectedOrder = orders.find((o: any) => o.id === selectedOrderId);

  // Auto-calculated billing totals
  const itemsSubtotal = selectedOrder 
    ? (selectedOrder.items || []).reduce((acc: number, item: any) => acc + Number(item.price), 0)
    : 0;

  const calculatedDiscountAmount = itemsSubtotal * (discountRate / 100);
  const subtotalAfterDiscount = itemsSubtotal - calculatedDiscountAmount;
  const taxRate = 15; // default 15% VAT
  const calculatedTaxAmount = subtotalAfterDiscount * (taxRate / 100);
  const calculatedServiceChargeAmount = subtotalAfterDiscount * (serviceChargeRate / 100);
  const finalGrandTotal = subtotalAfterDiscount + calculatedTaxAmount + calculatedServiceChargeAmount;

  const settleOrderMutation = useMutation({
    mutationFn: (paymentData: any) => OrderService.settleOrder(selectedOrderId || '', paymentData),
    onSuccess: (_data, variables) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'SETTLE_ORDER',
        entity: 'ORDER',
        entityId: selectedOrderId || '',
        details: `Settled order with total ${finalGrandTotal.toFixed(2)} using ${variables.method}`,
      });
      setSelectedOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Payment collected', 'Order has been settled successfully');
    },
    onError: (error: any) => {
      toast.error('Payment failed', error?.message || 'Please try again.');
    }
  });

  const handleSettle = () => {
    if (!selectedOrderId) {
      toast.warning('No selection', 'Please select an order first');
      return;
    }
    settleOrderMutation.mutate({
      method: selectedMethod,
      amountReceived: selectedMethod === 'Cash' ? (Number(cashReceived) || finalGrandTotal) : finalGrandTotal,
      changeAmount: selectedMethod === 'Cash' ? Math.max(0, (Number(cashReceived) || finalGrandTotal) - finalGrandTotal) : 0,
      tenantId: tenant?.id,
      cashierId: user?.id,
      discountRate,
      serviceChargeRate,
    });
  };

  const kpis = [
    { id: 'PENDING', label: 'Pending Payments', value: pendingOrders.length.toString(), sub: 'Awaiting checkout', icon: Receipt, color: 'text-indigo-500 lg:text-indigo-500', bg: 'lg:bg-indigo-50 bg-indigo-500/10' },
    { id: 'COMPLETED', label: 'Completed Today', value: completedOrders.length.toString(), sub: 'Success', icon: CheckCircle2, color: 'text-emerald-500 lg:text-emerald-500', bg: 'lg:bg-emerald-50 bg-emerald-500/10' },
    { id: 'REVENUE', label: 'Revenue Today', value: format(completedOrders.reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0)), sub: 'Total collected', icon: DollarSign, color: 'text-orange-500 lg:text-orange-500', bg: 'lg:bg-orange-50 bg-orange-500/10' },
  ];

  return (
    <div className="min-h-0 flex flex-col gap-8">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <h1 className="text-3xl font-bold lg:text-[#0B1630] text-white">Payments</h1>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="lg:text-emerald-600 text-emerald-400 text-xs font-bold uppercase tracking-wider">Live</span>
           </div>
        </div>
      </div>

      {/* KPI Row - Naturally Reflowed to 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        {kpis.map((kpi, i) => (
          <Card 
            key={i} 
            onClick={() => (kpi.id === 'PENDING' || kpi.id === 'COMPLETED') && setPaymentFilter(kpi.id as 'PENDING' | 'COMPLETED')}
            className={cn(
              "p-4 lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border shadow-2xl lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4 transition-all duration-200",
              (kpi.id === 'PENDING' || kpi.id === 'COMPLETED') ? "cursor-pointer hover:border-[#F97316]/50" : "border-transparent",
              (kpi.id === 'PENDING' || kpi.id === 'COMPLETED') && paymentFilter === kpi.id 
                ? "border-[#F97316] bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]" 
                : "border-[#232B5E]/50"
            )}
          >
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", kpi.bg, kpi.color)}>
                <kpi.icon size={24} />
             </div>
             <div>
               <h3 className="text-2xl font-black lg:text-[#0B1630] text-white leading-none mb-1">{kpi.value}</h3>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold lg:text-[#0B1630] text-white/90 uppercase tracking-wider">{kpi.label}</span>
                  <span className="text-[9px] text-[#94A3B8] font-medium leading-none">{kpi.sub}</span>
               </div>
             </div>
          </Card>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
         {/* Awaiting Payment Registry */}
         <Card className="flex-1 lg:bg-white bg-transparent lg:border-none border-none lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] shadow-none p-0 overflow-hidden flex flex-col">
            <div className="p-6 lg:border-b lg:border-slate-50 border-b border-[#232B5E]/30 flex flex-wrap items-center justify-between lg:bg-white bg-[#131A38]/70 backdrop-blur-md rounded-xl lg:rounded-none border border-[#232B5E]/50 shadow-2xl lg:shadow-none gap-4">
               <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black lg:text-[#0B1630] text-white uppercase tracking-wider">
                     {paymentFilter === 'PENDING' ? 'Awaiting Payment' : 'Completed Payments'}
                  </h3>
                  <span className="w-6 h-6 rounded-full lg:bg-indigo-50 bg-indigo-500/20 lg:text-indigo-600 text-indigo-400 text-[10px] font-black flex items-center justify-center">
                     {paymentFilter === 'PENDING' ? pendingOrders.length : completedOrders.length}
                  </span>
               </div>
               <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                     <input 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-64 h-10 pl-10 pr-4 rounded-xl lg:bg-slate-50/50 bg-[#1E293B] lg:border lg:border-slate-100 border border-[#232B5E]/30 lg:text-slate-800 text-white text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" 
                       placeholder="Search order or customer..." 
                     />
                  </div>
                  <button className="p-2.5 rounded-xl lg:bg-white bg-[#1E293B] lg:border lg:border-slate-100 border-none lg:text-[#94A3B8] text-[#94A3B8] hover:bg-slate-50"><Filter size={16} /></button>
               </div>
            </div>
            <div className="overflow-y-auto flex-1">
               {/* DESKTOP TABLE VIEW */}
               <table className="w-full text-left border-collapse hidden md:table">
                  <thead>
                     <tr className="bg-slate-50/30 sticky top-0 bg-white z-10 border-b border-slate-50">
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Table</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Waiter</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Time</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredDisplayedOrders.length === 0 ? (
                        <tr>
                           <td colSpan={8} className="text-center py-8 text-xs text-[#94A3B8] font-bold">
                              No payments found
                           </td>
                        </tr>
                     ) : (
                        filteredDisplayedOrders.map((order: any) => (
                           <tr 
                             key={order.id} 
                             onClick={() => setSelectedOrderId(order.id)}
                             className={cn(
                               "hover:bg-white/5 transition-colors group cursor-pointer border-l-4 border-l-transparent",
                               selectedOrderId === order.id && "bg-orange-500/10 border-l-4 border-l-[#F97316] shadow-[inset_4px_0_12px_rgba(249,115,22,0.06)]"
                             )}
                           >
                              <td className="px-6 py-4 text-xs font-black text-[#4F46E5]">{order.orderNumber || `#${order.id.slice(0, 8)}`}</td>
                              <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">T{order.table?.number || '?'}</td>
                              <td className="px-6 py-4 text-xs font-medium text-[#64748B]">{order.waiterName || 'Unassigned'}</td>
                              <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">{order.customerName || 'Guest'}</td>
                              <td className="px-6 py-4">
                                 <span className={cn(
                                   "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-orange-50 text-orange-600"
                                 )}>
                                   {order.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-black text-[#0B1630]">{format(Number(order.totalAmount))}</td>
                              <td className="px-6 py-4 text-xs font-medium text-[#94A3B8]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="px-6 py-4 text-right">
                                 <div className="w-8 h-8 rounded-lg bg-[#0B1630] text-white flex items-center justify-center ml-auto">
                                    <ChevronRight size={16} />
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>

               {/* MOBILE RESPONSIVE CARDS VIEW */}
               <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-transparent">
                  {filteredDisplayedOrders.map((order: any) => (
                    <Card 
                      key={order.id} 
                      onClick={() => setSelectedOrderId(order.id)}
                      className={cn(
                        "p-4 border shadow-2xl flex flex-col gap-4 cursor-pointer transition-all",
                        selectedOrderId === order.id 
                          ? "border-[#F97316] bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)] text-white" 
                          : "border-[#232B5E]/50 bg-white/5 text-white"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-400">{order.orderNumber || `#${order.id.slice(0, 8)}`}</span>
                        <span className="text-[10px] text-[#94A3B8]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-white">Table {order.table?.number || '?'} • {order.customerName || 'Guest'}</h4>
                          <span className="text-[10px] text-[#94A3B8]">Waiter: {order.waiterName || 'Unassigned'}</span>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-orange-50/10 text-orange-400 border border-orange-500/20">
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-[#232B5E]/20 pt-3">
                        <span className="text-sm font-black text-white">{format(Number(order.totalAmount))}</span>
                        <div className="w-8 h-8 rounded-lg bg-[#0B1630] text-white flex items-center justify-center">
                           <ChevronRight size={16} />
                        </div>
                      </div>
                    </Card>
                  ))}
                  {filteredDisplayedOrders.length === 0 && (
                    <div className="text-center py-8 text-xs text-[#94A3B8] font-bold col-span-full">
                      No payments found
                    </div>
                  )}
               </div>
            </div>
         </Card>

         {/* Settlement Panel */}
         <Card className="w-full lg:w-[450px] lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl flex flex-col p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black lg:text-[#0B1630] text-white">{selectedOrder ? `Summary - ${selectedOrder.orderNumber}` : 'Order Summary'}</h3>
               <span className="text-[10px] font-black bg-orange-50/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full uppercase">Select Order</span>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-10 pb-10 lg:border-b lg:border-slate-50 border-b border-[#232B5E]/20 lg:bg-slate-50 bg-[#1E293B]/50 p-4 rounded-xl border border-[#232B5E]/30">
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                     <Users size={14} />
                     <span className="text-[10px] font-bold uppercase">Customer</span>
                  </div>
                  <span className="text-xs font-bold lg:text-[#0B1630] text-white">{selectedOrder ? (selectedOrder.waiterName || 'Unassigned') : 'N/A'}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                     <Receipt size={14} />
                     <span className="text-[10px] font-bold uppercase">Table</span>
                  </div>
                  <span className="text-xs font-bold lg:text-[#0B1630] text-white">{selectedOrder ? `Table ${selectedOrder.table?.number}` : 'N/A'}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                     <Clock size={14} />
                     <span className="text-[10px] font-bold uppercase">Time</span>
                  </div>
                  <span className="text-xs font-bold lg:text-[#0B1630] text-white">{selectedOrder ? new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
               </div>
            </div>             <div className="space-y-4 mb-8 lg:border-b lg:border-slate-100 border-b border-[#232B5E]/20 pb-6">
                <h4 className="text-[10px] font-black lg:text-[#0B1630] text-white uppercase tracking-widest mb-4">Ordered Items</h4>
                {selectedOrder ? (
                  <>
                   <div className="lg:divide-y lg:divide-slate-50 divide-[#232B5E]/20 max-h-48 overflow-y-auto mb-6">
                      {selectedOrder.items?.map((item: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center py-2.5 text-xs">
                            <div className="flex items-center gap-3">
                               <span className="font-bold lg:text-[#0B1630] text-white lg:bg-slate-50 bg-[#1E293B] px-1.5 py-0.5 rounded">{item.quantity}x</span>
                               <span className="lg:text-[#64748B] text-[#94A3B8] font-semibold">{item.menuItem?.name || 'Item'}</span>
                            </div>
                            <span className="font-bold lg:text-[#0B1630] text-white">{format(Number(item.price))}</span>
                         </div>
                      ))}
                   </div>

                   {/* Discount & Service Charge selectors */}
                   <div className="space-y-4 py-4 border-t border-b border-[#232B5E]/10 lg:border-slate-100">
                      <div>
                         <p className="text-[9px] font-bold lg:text-[#64748B] text-[#94A3B8] uppercase tracking-wider mb-2">Discount Policy</p>
                         <div className="flex gap-2">
                            {[0, 10, 15, 20].map((rate) => (
                               <button
                                 key={rate}
                                 onClick={() => setDiscountRate(rate)}
                                 className={cn(
                                   "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                                   discountRate === rate 
                                     ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/15"
                                     : "lg:bg-slate-50 lg:border-slate-100 border-[#232B5E]/30 lg:text-slate-700 text-slate-300"
                                 )}
                               >
                                 {rate === 0 ? 'None' : `${rate}%`}
                               </button>
                            ))}
                         </div>
                      </div>

                      <div>
                         <p className="text-[9px] font-bold lg:text-[#64748B] text-[#94A3B8] uppercase tracking-wider mb-2">Service Charge</p>
                         <div className="flex gap-2">
                            {[0, 5, 10].map((rate) => (
                               <button
                                 key={rate}
                                 onClick={() => setServiceChargeRate(rate)}
                                 className={cn(
                                   "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                                   serviceChargeRate === rate 
                                     ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/15"
                                     : "lg:bg-slate-50 lg:border-slate-100 border-[#232B5E]/30 lg:text-slate-700 text-slate-300"
                                 )}
                               >
                                 {rate === 0 ? 'None' : `${rate}%`}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* Auto-calculated bill breakdown */}
                   <div className="space-y-2 pt-2 text-xs font-medium lg:text-[#64748B] text-[#94A3B8]">
                      <div className="flex justify-between"><span>SUBTOTAL</span><span className="lg:text-[#0B1630] text-white">{format(itemsSubtotal)}</span></div>
                      {discountRate > 0 && (
                         <div className="flex justify-between text-red-500"><span>DISCOUNT ({discountRate}%)</span><span>-{format(calculatedDiscountAmount)}</span></div>
                      )}
                      <div className="flex justify-between"><span>TAX (15%)</span><span className="lg:text-[#0B1630] text-white">{format(calculatedTaxAmount)}</span></div>
                      {serviceChargeRate > 0 && (
                         <div className="flex justify-between text-indigo-400 lg:text-indigo-600"><span>SERVICE CHARGE ({serviceChargeRate}%)</span><span>+{format(calculatedServiceChargeAmount)}</span></div>
                      )}
                      <div className="flex justify-between text-sm font-black lg:text-[#0B1630] text-white pt-2 border-t border-dashed lg:border-slate-200 border-[#232B5E]/30"><span>TOTAL BILL</span><span>{format(finalGrandTotal)}</span></div>
                   </div>
                  </>
                ) : (
                   <p className="text-xs text-[#94A3B8] italic font-medium">Select an order from the left to view summary</p>
                )}
             </div>

             <div className="mb-6">
                <h4 className="text-[10px] font-black lg:text-[#0B1630] text-white uppercase tracking-widest mb-6">Select Payment Method</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                   {[
                     { id: 'Cash', icon: DollarSign },
                     { id: 'Card', icon: CreditCard },
                     { id: 'Split Payment', icon: Filter },
                     { id: 'Mobile Money', icon: Smartphone }
                   ].map((method) => (
                     <div 
                       key={method.id}
                       onClick={() => setSelectedMethod(method.id)}
                       className={cn(
                         "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3",
                         selectedMethod === method.id 
                           ? "bg-[#F5F3FF] border-[#4F46E5] lg:border-[#4F46E5] border-indigo-500 shadow-[0_4px_12_rgba(79,70,229,0.1)]" 
                           : "lg:border-slate-100 border-[#232B5E]/30 hover:border-[#4F46E5]/40"
                       )}
                     >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          selectedMethod === method.id ? "bg-[#4F46E5] text-white" : "lg:bg-slate-50 bg-[#131A38] text-[#94A3B8]"
                        )}>
                           <method.icon size={20} />
                        </div>
                        <div className="flex items-center justify-between">
                           <span className={cn("text-xs font-bold", selectedMethod === method.id ? "lg:text-[#0B1630] text-white" : "lg:text-[#64748B] text-[#94A3B8]")}>{method.id}</span>
                           <div className={cn(
                             "w-4 h-4 rounded-full border flex items-center justify-center",
                             selectedMethod === method.id ? "border-[#4F46E5] bg-[#4F46E5]" : "lg:border-slate-300 border-[#232B5E]/30"
                           )}>
                              {selectedMethod === method.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Cash Received & Change Return calculations */}
                {selectedOrderId && selectedMethod === 'Cash' && (
                   <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl lg:bg-slate-50 bg-[#1E293B]/70 border-[#232B5E]/20">
                      <p className="text-[10px] font-bold lg:text-[#64748B] text-[#94A3B8] uppercase tracking-wider">Cash Register Calculator</p>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <span className="text-[9px] text-[#94A3B8] uppercase block mb-1">Cash Received</span>
                            <input 
                              type="number"
                              value={cashReceived}
                              onChange={(e) => setCashReceived(e.target.value)}
                              placeholder={finalGrandTotal.toFixed(2)}
                              className="w-full h-10 px-3 rounded-xl lg:bg-white bg-[#0E1537] lg:border-slate-200 border-[#232B5E]/40 lg:text-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-bold"
                            />
                         </div>
                         <div>
                            <span className="text-[9px] text-[#94A3B8] uppercase block mb-1">Change to Return</span>
                            <div className="h-10 flex items-center px-3 rounded-xl bg-orange-50 lg:bg-orange-50 bg-orange-500/10 text-orange-500 text-xs font-black">
                               {format(Math.max(0, (Number(cashReceived) || finalGrandTotal) - finalGrandTotal))}
                            </div>
                         </div>
                      </div>
                   </div>
                )}
             </div>

             <div className="space-y-3 mt-auto">
                <button 
                  onClick={handleSettle}
                  disabled={!selectedOrderId || selectedOrder?.status === 'COMPLETED' || settleOrderMutation.isPending || (selectedMethod === 'Cash' && Number(cashReceived) > 0 && Number(cashReceived) < finalGrandTotal)}
                  className={cn(
                     "w-full bg-[#F97316] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]",
                     (!selectedOrderId || selectedOrder?.status === 'COMPLETED' || settleOrderMutation.isPending || (selectedMethod === 'Cash' && Number(cashReceived) > 0 && Number(cashReceived) < finalGrandTotal)) && "opacity-50 cursor-not-allowed shadow-none"
                  )}
                >
                   {settleOrderMutation.isPending ? 'PROCESSING...' : selectedOrder?.status === 'COMPLETED' ? 'PAID & SETTLED' : <>{selectedOrder ? `Collect ${format(finalGrandTotal)}` : 'Collect Payment'} <ChevronRight size={18} strokeWidth={3} /></>}
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button className="lg:bg-white bg-[#1E293B] lg:text-[#0B1630] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 lg:border lg:border-slate-200 border-none hover:bg-slate-50 transition-all active:scale-[0.98]">
                      <Printer size={16} /> Print Receipt
                   </button>
                   <button 
                     onClick={() => setSelectedOrderId(null)}
                     className="lg:bg-slate-100 bg-[#1E293B]/50 lg:text-[#64748B] text-[#94A3B8] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-[0.98]"
                   >
                      Cancel
                   </button>
                </div>
             </div>
          </Card>
       </div>
    </div>
  );
};
