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
import { UpgradePlaceholder } from '../../components/UpgradeDialog';

export const Payments = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const queryClient = useQueryClient();


  const [selectedMethod, setSelectedMethod] = useState('Cash');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

  const settleOrderMutation = useMutation({
    mutationFn: (paymentData: any) => OrderService.settleOrder(selectedOrderId || '', paymentData),
    onSuccess: (_data, variables) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'SETTLE_ORDER',
        entity: 'ORDER',
        entityId: selectedOrderId || '',
        details: `Settled order with total ${selectedOrder?.totalAmount} using ${variables.method}`,
      });
      setSelectedOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Payment collected', 'Order has been settled successfully');
    },
    onError: (error: any) => {
      toast.error('Payment failed', error?.message || 'Please try again.');
    }
  });

  const pendingOrders = orders.filter((o: any) => o.status === 'READY' || o.status === 'SERVED');
  const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED');
  const selectedOrder = orders.find((o: any) => o.id === selectedOrderId);

  const handleSettle = () => {
    if (!selectedOrderId) {
      toast.warning('No selection', 'Please select an order first');
      return;
    }
    settleOrderMutation.mutate({
      method: selectedMethod,
      amount: selectedOrder?.totalAmount,
      tenantId: tenant?.id
    });
  };

  const kpis = [
    { label: 'Pending Payments', value: pendingOrders.length.toString(), sub: 'Awaiting checkout', icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Completed Today', value: completedOrders.length.toString(), sub: 'Success', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Revenue Today', value: format(completedOrders.reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0)), sub: 'Total collected', icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Average Bill', value: format(completedOrders.length > 0 ? completedOrders.reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0) / completedOrders.length : 0), sub: 'Per order average', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-8">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <h1 className="text-3xl font-bold text-[#0B1630]">Payments</h1>
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

      <div className="flex-1 flex gap-8 min-h-0">
         {/* Awaiting Payment Registry */}
         <Card className="flex-1 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-0 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
               <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black text-[#0B1630] uppercase tracking-wider">Awaiting Payment</h3>
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center">{pendingOrders.length}</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                     <input className="w-64 h-10 pl-10 pr-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" placeholder="Search order or customer..." />
                  </div>
                  <button className="p-2.5 rounded-xl border border-slate-100 text-[#94A3B8] hover:bg-slate-50"><Filter size={16} /></button>
               </div>
            </div>
            <div className="overflow-y-auto flex-1">
               <table className="w-full text-left border-collapse">
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
                     {pendingOrders.map((order: any) => (
                        <tr 
                          key={order.id} 
                          onClick={() => setSelectedOrderId(order.id)}
                          className={cn(
                            "hover:bg-slate-50 transition-colors group cursor-pointer",
                            selectedOrderId === order.id && "bg-indigo-50/50 border-l-4 border-l-indigo-500"
                          )}
                        >
                           <td className="px-6 py-4 text-xs font-black text-[#4F46E5]">#{order.id.slice(0, 8)}</td>
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
                     ))}
                  </tbody>
               </table>
            </div>
         </Card>

         {/* Settlement Panel */}
         <Card className="w-[450px] border-none shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black text-[#0B1630]">Order Summary</h3>
               <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-3 py-1 rounded-full uppercase">Select Order</span>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-10 pb-10 border-b border-slate-50">
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                     <Users size={14} />
                     <span className="text-[10px] font-bold uppercase">Customer</span>
                  </div>
                  <span className="text-xs font-bold text-[#0B1630]">{selectedOrder ? (selectedOrder.waiterName || 'Unassigned') : 'N/A'}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                     <Receipt size={14} />
                     <span className="text-[10px] font-bold uppercase">Table</span>
                  </div>
                  <span className="text-xs font-bold text-[#0B1630]">{selectedOrder ? `Table ${selectedOrder.table?.number}` : 'N/A'}</span>
               </div>
               <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                     <Clock size={14} />
                     <span className="text-[10px] font-bold uppercase">Time</span>
                  </div>
                  <span className="text-xs font-bold text-[#0B1630]">{selectedOrder ? new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
               </div>
            </div>

            <div className="space-y-4 mb-10 border-b border-slate-100 pb-6">
               <h4 className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest mb-4">Ordered Items</h4>
               {selectedOrder ? (
                 <>
                  <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto mb-6">
                     {selectedOrder.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 text-xs">
                           <div className="flex items-center gap-3">
                              <span className="font-bold text-[#0B1630] bg-slate-50 px-1.5 py-0.5 rounded">{item.quantity}x</span>
                              <span className="text-[#64748B] font-semibold">{item.menuItem?.name || 'Item'}</span>
                           </div>
                           <span className="font-bold text-[#0B1630]">{format(Number(item.price))}</span>
                        </div>
                     ))}
                  </div>
                  <div className="space-y-2 pt-2 text-xs font-medium text-[#64748B]">
                     <div className="flex justify-between"><span>SUBTOTAL</span><span className="text-[#0B1630]">{format(selectedOrder.totalAmount / 1.15)}</span></div>
                     <div className="flex justify-between"><span>TAX (15%)</span><span className="text-[#0B1630]">{format(selectedOrder.totalAmount - (selectedOrder.totalAmount / 1.15))}</span></div>
                     <div className="flex justify-between text-sm font-black text-[#0B1630] pt-2 border-t border-dashed border-slate-200"><span>TOTAL BILL</span><span>{format(Number(selectedOrder.totalAmount))}</span></div>
                  </div>
                 </>
               ) : (
                  <p className="text-xs text-[#94A3B8] italic font-medium">Select an order from the left to view summary</p>
               )}
            </div>

            <div className="mb-10">
               <h4 className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest mb-6">Select Payment Method</h4>
               <div className="grid grid-cols-2 gap-4">
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
                          ? "bg-[#F5F3FF] border-[#4F46E5] shadow-[0_4px_12_rgba(79,70,229,0.1)]" 
                          : "border-slate-100 hover:border-[#4F46E5]/40"
                      )}
                    >
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center",
                         selectedMethod === method.id ? "bg-[#4F46E5] text-white" : "bg-slate-50 text-[#94A3B8]"
                       )}>
                          <method.icon size={20} />
                       </div>
                       <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-bold", selectedMethod === method.id ? "text-[#0B1630]" : "text-[#64748B]")}>{method.id}</span>
                          <div className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center",
                            selectedMethod === method.id ? "border-[#4F46E5] bg-[#4F46E5]" : "border-slate-300"
                          )}>
                             {selectedMethod === method.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-3 mt-auto">
               <button 
                 onClick={handleSettle}
                 disabled={!selectedOrderId || settleOrderMutation.isPending}
                 className={cn(
                    "w-full bg-[#F97316] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]",
                    (!selectedOrderId || settleOrderMutation.isPending) && "opacity-50 cursor-not-allowed shadow-none"
                 )}
               >
                  {settleOrderMutation.isPending ? 'PROCESSING...' : <>{selectedOrder ? `Collect ${format(Number(selectedOrder.totalAmount))}` : 'Collect Payment'} <ChevronRight size={18} strokeWidth={3} /></>}
               </button>
               <div className="grid grid-cols-2 gap-3">
                  <button className="bg-white text-[#0B1630] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]">
                     <Printer size={16} /> Print Receipt
                  </button>
                  <button className="bg-slate-100 text-[#64748B] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-[0.98]">
                     Cancel
                  </button>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
};
