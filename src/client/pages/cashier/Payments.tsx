import { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  X,
  Download
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService, ActivityLogService, StaffService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency, CurrencyService } from '../../services/CurrencyService';
import { supabase } from '../../../lib/supabase';
import { toast } from '../../lib/toast-store';

export const Payments = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'checkout' | 'history'>('checkout');

  // Checkout states
  const [selectedMethod, setSelectedMethod] = useState('Cash');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('ETB');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // History filter states
  const [historySearch, setHistorySearch] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterEmployee, setFilterEmployee] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  // Selected receipt modal in history
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('cashier-orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
          queryClient.invalidateQueries({ queryKey: ['receipts', tenant.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, queryClient]);

  useEffect(() => {
    if (tenant?.currencyCode) {
      setSelectedCurrency(tenant.currencyCode);
    }
  }, [tenant]);

  // Queries
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: receipts = [], isLoading: isReceiptsLoading } = useQuery({
    queryKey: ['receipts', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('receipts')
        .select('*, orders(waiter_name, waiter_id, table:tables(number))')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff', tenant?.id],
    queryFn: () => StaffService.getStaff(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const settleOrderMutation = useMutation({
    mutationFn: (paymentData: any) => OrderService.settleOrder(selectedOrderId || '', paymentData),
    onSuccess: async () => {
      const { data: recData } = await supabase
        .from('receipts')
        .select('*, orders(waiter_name, waiter_id, table:tables(number))')
        .eq('order_id', selectedOrderId)
        .single();

      setSelectedReceipt(recData);
      setIsReceiptModalOpen(true);

      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'SETTLE_ORDER',
        entity: 'ORDER',
        entityId: selectedOrderId || '',
        details: `Settled order with total ${selectedOrder?.totalAmount} using ${selectedMethod} in ${selectedCurrency}`,
      });

      setSelectedOrderId(null);
      setAmountReceived('');
      setPaymentNotes('');
      
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Payment collected', 'Order has been settled successfully');
    },
    onError: (error: any) => {
      toast.error('Payment failed', error?.message || 'Please try again.');
    }
  });

  const pendingOrders = orders.filter((o: any) => o.status === 'READY' || o.status === 'SERVED' || o.status === 'AWAITING_PAYMENT');
  const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED');
  const selectedOrder = orders.find((o: any) => o.id === selectedOrderId);

  // Conversion calculations
  const USD_TO_ETB_RATE = 120.00;
  const tenantBase = tenant?.currencyCode || 'ETB';

  const orderTotal = selectedOrder ? Number(selectedOrder.totalAmount) : 0;

  const totalInSelectedCurrency = useMemo(() => {
    if (!selectedOrder) return 0;
    if (tenantBase === 'ETB') {
      return selectedCurrency === 'USD' ? orderTotal / USD_TO_ETB_RATE : orderTotal;
    } else {
      return selectedCurrency === 'ETB' ? orderTotal * USD_TO_ETB_RATE : orderTotal;
    }
  }, [selectedOrder, selectedCurrency, orderTotal, tenantBase]);

  const selectedCurrencySymbol = selectedCurrency === 'USD' ? '$' : 'ETB';

  const calculatedChange = selectedMethod === 'Cash' && Number(amountReceived) >= totalInSelectedCurrency
    ? Number(amountReceived) - totalInSelectedCurrency
    : 0;

  const handleSettle = () => {
    if (!selectedOrderId) {
      toast.warning('No selection', 'Please select an order first');
      return;
    }
    const amtReceived = selectedMethod === 'Cash' ? Number(amountReceived) : totalInSelectedCurrency;
    if (selectedMethod === 'Cash' && amtReceived < totalInSelectedCurrency) {
      toast.warning('Invalid Amount', 'Amount received cannot be less than total.');
      return;
    }
    const change = selectedMethod === 'Cash' ? Math.max(0, amtReceived - totalInSelectedCurrency) : 0;
    
    const rate = tenantBase === 'ETB' 
      ? (selectedCurrency === 'USD' ? USD_TO_ETB_RATE : 1.0)
      : (selectedCurrency === 'ETB' ? 1 / USD_TO_ETB_RATE : 1.0);

    settleOrderMutation.mutate({
      method: selectedMethod,
      tenantId: tenant?.id,
      cashierId: user?.id,
      amountReceived: amtReceived,
      changeAmount: change,
      notes: paymentNotes,
      currency: selectedCurrency,
      currencySymbol: selectedCurrencySymbol,
      exchangeRate: rate,
      originalAmount: totalInSelectedCurrency,
      baseAmount: orderTotal
    });
  };

  // Filter payment history
  const filteredHistory = useMemo(() => {
    return receipts.filter((rec: any) => {
      if (historySearch && !rec.receipt_number.toLowerCase().includes(historySearch.toLowerCase())) {
        return false;
      }
      if (filterCurrency !== 'ALL' && rec.currency !== filterCurrency) {
        return false;
      }
      if (filterMethod !== 'ALL' && rec.payment_method !== filterMethod) {
        return false;
      }
      if (filterEmployee !== 'ALL') {
        const matchesCashier = rec.cashier_id === filterEmployee;
        const matchesWaiter = rec.orders?.waiter_id === filterEmployee;
        if (!matchesCashier && !matchesWaiter) return false;
      }
      if (filterDate) {
        const recDateStr = new Date(rec.created_at).toISOString().split('T')[0];
        if (recDateStr !== filterDate) return false;
      }
      return true;
    });
  }, [receipts, historySearch, filterCurrency, filterMethod, filterEmployee, filterDate]);

  const handleDownloadReceipt = () => {
    if (!selectedReceipt) return;
    const formatReceiptVal = (amount: number) => CurrencyService.format(amount, selectedReceipt.currency);

    const content = `
=========================================
          ${tenant?.name || 'VALO BISTRO'}
=========================================
Receipt No:     ${selectedReceipt.receipt_number}
Date:           ${new Date(selectedReceipt.created_at).toLocaleString()}
Table:          Table ${selectedReceipt.orders?.table?.number || 'N/A'}
Waiter:         ${selectedReceipt.orders?.waiter_name || 'Waiter'}
-----------------------------------------
Subtotal:       ${formatReceiptVal(Number(selectedReceipt.subtotal))}
Tax (15%):      ${formatReceiptVal(Number(selectedReceipt.tax_amount))}
Grand Total:    ${formatReceiptVal(Number(selectedReceipt.total_amount))}
-----------------------------------------
Payment Currency: ${selectedReceipt.currency}
Payment Method: ${selectedReceipt.payment_method}
Amount Tendered:${formatReceiptVal(Number(selectedReceipt.amount_received))}
Change:         ${formatReceiptVal(Number(selectedReceipt.change_amount))}
Notes:          ${selectedReceipt.notes || 'None'}
-----------------------------------------
      Thank you for dining with us!
=========================================
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${selectedReceipt.receipt_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStaffName = (staffId: string) => {
    const st = staffList.find((s: any) => s.id === staffId);
    return st ? st.name : 'Collector';
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
      {/* Upper header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <h1 className="text-3xl font-black text-[#0B1630] tracking-tight">Payments Registry</h1>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-600 text-xs font-black uppercase tracking-widest">Live</span>
           </div>
        </div>
      </div>

      {/* Tab selection */}
      <div className="flex gap-6 border-b border-slate-100 pb-px shrink-0">
        <button
          onClick={() => setActiveTab('checkout')}
          className={cn(
            "pb-3 text-xs font-black uppercase tracking-widest border-b-2 px-1 transition-all cursor-pointer",
            activeTab === 'checkout'
              ? "border-[#F97316] text-[#0B1630]"
              : "border-transparent text-slate-400 hover:text-[#0B1630]"
          )}
        >
          Collect Payments ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "pb-3 text-xs font-black uppercase tracking-widest border-b-2 px-1 transition-all cursor-pointer",
            activeTab === 'history'
              ? "border-[#F97316] text-[#0B1630]"
              : "border-transparent text-slate-400 hover:text-[#0B1630]"
          )}
        >
          Payment History ({receipts.length})
        </button>
      </div>

      {activeTab === 'checkout' ? (
        <div className="flex-1 flex gap-8 min-h-0">
           {/* Awaiting Payment Registry */}
           <Card className="flex-1 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-0 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                 <div className="flex items-center gap-4">
                    <h3 className="text-xs font-black text-[#0B1630] uppercase tracking-wider">Awaiting Payment</h3>
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center">{pendingOrders.length}</span>
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
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {pendingOrders.map((order: any) => (
                          <tr 
                            key={order.id} 
                            onClick={() => setSelectedOrderId(order.id)}
                            className={cn(
                              "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                              selectedOrderId === order.id && "bg-indigo-50/40 border-l-4 border-l-indigo-500"
                            )}
                          >
                             <td className="px-6 py-4 text-xs font-black text-[#4F46E5]">#{order.id.slice(0, 8)}</td>
                             <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">T{order.table?.number || '?'}</td>
                             <td className="px-6 py-4 text-xs font-medium text-[#64748B]">{order.waiterName || 'Unassigned'}</td>
                             <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">{order.customerName || 'Guest'}</td>
                             <td className="px-6 py-4">
                                <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-orange-50 text-orange-600">
                                  {order.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-xs font-black text-[#0B1630]">{format(Number(order.totalAmount))}</td>
                             <td className="px-6 py-4 text-right">
                                <div className="w-8 h-8 rounded-lg bg-[#0B1630] text-white flex items-center justify-center ml-auto">
                                   <ChevronRight size={16} />
                                </div>
                             </td>
                          </tr>
                       ))}
                       {pendingOrders.length === 0 && (
                          <tr>
                             <td colSpan={7} className="py-8 text-center text-xs text-[#94A3B8] font-bold italic">No tables currently awaiting checkout.</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </Card>

           {/* Settlement Panel */}
           <Card className="w-[450px] border-none shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col p-8 overflow-y-auto bg-white">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-base font-black text-[#0B1630]">Collect Payment</h3>
                 <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-3 py-1 rounded-full uppercase">Settle Order</span>
              </div>

              {selectedOrder ? (
                <div className="flex-1 flex flex-col gap-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                         <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Table</span>
                         <span className="text-xs font-black text-[#0B1630]">Table {selectedOrder.table?.number || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                         <span className="text-[9px] font-bold text-[#94A3B8] uppercase">Waiter</span>
                         <span className="text-xs font-black text-[#0B1630]">{selectedOrder.waiterName || 'Unassigned'}</span>
                      </div>
                   </div>

                   {/* Currency Selector */}
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[#0B1630]">Payment Currency</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                         <button
                           type="button"
                           onClick={() => {
                             setSelectedCurrency('ETB');
                             setAmountReceived('');
                           }}
                           className={cn(
                             "flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer",
                             selectedCurrency === 'ETB' ? "bg-white text-[#0B1630] shadow-sm" : "text-[#64748B] hover:text-[#0B1630]"
                           )}
                         >
                           ETB (Birr)
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             setSelectedCurrency('USD');
                             setAmountReceived('');
                           }}
                           className={cn(
                             "flex-1 py-2 rounded-lg text-xs font-black transition-all cursor-pointer",
                             selectedCurrency === 'USD' ? "bg-white text-[#0B1630] shadow-sm" : "text-[#64748B] hover:text-[#0B1630]"
                           )}
                         >
                           USD ($)
                         </button>
                      </div>
                   </div>

                   {/* Payment Method */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-[#0B1630]">Payment Method</label>
                      <div className="grid grid-cols-3 gap-3">
                         {[
                           { id: 'Cash', icon: DollarSign },
                           { id: 'Card', icon: CreditCard },
                           { id: 'Mobile Money', icon: Smartphone }
                         ].map((method) => (
                           <div 
                             key={method.id}
                             onClick={() => {
                               setSelectedMethod(method.id);
                               if (method.id !== 'Cash') setAmountReceived('');
                             }}
                             className={cn(
                               "p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 items-center text-center",
                               selectedMethod === method.id 
                                 ? "bg-indigo-50 border-[#4F46E5]" 
                                 : "border-slate-100 hover:border-[#4F46E5]/40"
                             )}
                           >
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center",
                                selectedMethod === method.id ? "bg-[#4F46E5] text-white" : "bg-slate-50 text-[#94A3B8]"
                              )}>
                                 <method.icon size={16} />
                              </div>
                              <span className="text-[9px] font-bold text-[#0B1630]">{method.id}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Pricing Totals Box */}
                   <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-center space-y-1">
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Total amount due</span>
                      <h2 className="text-3xl font-black text-indigo-900">{formatInSelectedCurrency(totalInSelectedCurrency)}</h2>
                      {selectedCurrency === 'USD' && (
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block">
                           Rate: 1 USD = 120.00 ETB
                        </span>
                      )}
                   </div>

                   {/* Cash inputs */}
                   {selectedMethod === 'Cash' && (
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-[#0B1630]">Amount Received ({selectedCurrency})</label>
                            <div className="relative">
                               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">
                                  {selectedCurrencySymbol}
                               </div>
                               <input 
                                  type="number"
                                  required
                                  value={amountReceived}
                                  onChange={(e) => setAmountReceived(e.target.value)}
                                  className="w-full h-11 pl-12 pr-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] focus:outline-none focus:border-[#F97316]"
                                  placeholder="e.g. 10"
                               />
                            </div>
                         </div>
                         
                         {calculatedChange > 0 && (
                            <div className="flex justify-between items-center bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100 text-xs font-bold">
                               <span>Change Back</span>
                               <span className="text-sm font-black">{formatInSelectedCurrency(calculatedChange)}</span>
                            </div>
                         )}
                      </div>
                   )}

                   {/* Payment Notes */}
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[#0B1630]">Payment Notes (Optional)</label>
                      <textarea 
                         value={paymentNotes}
                         onChange={(e) => setPaymentNotes(e.target.value)}
                         className="w-full min-h-[60px] px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                         placeholder="Add checkout comments, customer codes..."
                      />
                   </div>

                   <div className="flex gap-4 mt-auto">
                      <button 
                        onClick={handleSettle}
                        disabled={settleOrderMutation.isPending || (selectedMethod === 'Cash' && Number(amountReceived) < totalInSelectedCurrency)}
                        className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                         {settleOrderMutation.isPending ? 'PROCESSING...' : 'Collect payment'}
                      </button>
                      <button 
                        onClick={() => setSelectedOrderId(null)}
                        className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50"
                      >
                         Cancel
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 text-3xl mb-4">💳</div>
                   <p className="text-xs text-[#94A3B8] font-bold">Select a table order from the registry to checkout.</p>
                </div>
              )}
           </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
           {/* Filters panel */}
           <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white shrink-0 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-[#0B1630]">Search Receipt</label>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                    <input 
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                      placeholder="e.g. REC-5X7..."
                    />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-[#0B1630]">Currency</label>
                 <select
                   value={filterCurrency}
                   onChange={(e) => setFilterCurrency(e.target.value)}
                   className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                 >
                    <option value="ALL">All Currencies</option>
                    <option value="ETB">ETB (Birr)</option>
                    <option value="USD">USD ($)</option>
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-[#0B1630]">Method</label>
                 <select
                   value={filterMethod}
                   onChange={(e) => setFilterMethod(e.target.value)}
                   className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                 >
                    <option value="ALL">All Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Mobile Money">Mobile Money</option>
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-[#0B1630]">Employee</label>
                 <select
                   value={filterEmployee}
                   onChange={(e) => setFilterEmployee(e.target.value)}
                   className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                 >
                    <option value="ALL">All Employees</option>
                    {staffList.map((st: any) => (
                       <option key={st.id} value={st.id}>{st.name} ({st.role})</option>
                    ))}
                 </select>
              </div>

              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-[#0B1630]">Date</label>
                 <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                    <input 
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full h-10 px-3 pr-10 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                    />
                 </div>
              </div>
           </Card>

           {/* Payment History List */}
           <Card className="flex-1 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-0 overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50/30 sticky top-0 bg-white z-10 border-b border-slate-50">
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Receipt No</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Table</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Collector</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Waiter</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Method</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Currency</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Amount Paid</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredHistory.map((rec: any) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-4 text-xs font-black text-[#0B1630]">{rec.receipt_number}</td>
                             <td className="px-6 py-4 text-xs font-medium text-[#64748B]">{new Date(rec.created_at).toLocaleDateString()} {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                             <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">T{rec.orders?.table?.number || 'N/A'}</td>
                             <td className="px-6 py-4 text-xs font-bold text-slate-700">{getStaffName(rec.cashier_id)}</td>
                             <td className="px-6 py-4 text-xs font-medium text-[#64748B]">{rec.orders?.waiter_name || 'Unassigned'}</td>
                             <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">{rec.payment_method}</td>
                             <td className="px-6 py-4">
                                <span className={cn(
                                  "text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider",
                                  rec.currency === 'USD' ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-orange-50 border-orange-100 text-[#F97316]"
                                )}>
                                   {rec.currency || 'ETB'}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-xs font-black text-[#0B1630] font-mono">{CurrencyService.format(Number(rec.original_amount ?? rec.total_amount), rec.currency || 'ETB')}</td>
                             <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => {
                                     setSelectedReceipt(rec);
                                     setIsReceiptModalOpen(true);
                                  }}
                                  className="h-8 px-3 rounded-lg border border-slate-200 text-[#0B1630] hover:bg-slate-50 font-bold text-[10px] uppercase tracking-wider"
                                >
                                   Details
                                </button>
                             </td>
                          </tr>
                       ))}
                       {filteredHistory.length === 0 && (
                          <tr>
                             <td colSpan={9} className="py-8 text-center text-xs text-[#94A3B8] font-bold italic">No matching payment history records found.</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      )}

      {/* --- MODAL: OFFICIAL RECEIPT PREVIEW --- */}
      {isReceiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-[#0B1630]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 border-none shadow-2xl relative bg-white flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
             <div className="text-center pb-4 border-b border-dashed border-slate-200 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                   <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-[#0B1630] uppercase tracking-wider">{tenant?.name || 'VALO BISTRO'}</h3>
                <p className="text-xs text-[#94A3B8] font-bold mt-1">Transaction Success Receipt</p>
             </div>
             
             <div className="space-y-4 text-xs font-semibold text-[#64748B]">
                <div className="flex justify-between">
                   <span>Receipt No: {selectedReceipt.receipt_number}</span>
                   <span>Table {selectedReceipt.orders?.table?.number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                   <span>Waiter: {selectedReceipt.orders?.waiter_name || 'Waiter'}</span>
                   <span>Collector: {getStaffName(selectedReceipt.cashier_id)}</span>
                </div>
                <div className="flex justify-between bg-indigo-50/50 px-2.5 py-1 rounded text-indigo-700 font-bold text-[10px] uppercase tracking-wide">
                   <span>Currency</span>
                   <span>{selectedReceipt.currency} ({selectedReceipt.currency_symbol})</span>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-b border-slate-100 py-2">
                   <div className="flex justify-between"><span>Subtotal</span><span className="text-[#0B1630]">{CurrencyService.format(Number(selectedReceipt.subtotal), selectedReceipt.currency)}</span></div>
                   <div className="flex justify-between"><span>Tax (15%)</span><span className="text-[#0B1630]">{CurrencyService.format(Number(selectedReceipt.tax_amount), selectedReceipt.currency)}</span></div>
                   <div className="flex justify-between text-base font-black text-[#0B1630] pt-2 border-t border-dashed border-slate-200"><span>Grand Total</span><span>{CurrencyService.format(Number(selectedReceipt.total_amount), selectedReceipt.currency)}</span></div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-[11px]">
                   <div className="flex justify-between"><span>Payment Method</span><span className="text-[#0B1630] font-bold">{selectedReceipt.payment_method}</span></div>
                   <div className="flex justify-between"><span>Amount Received</span><span className="text-[#0B1630] font-bold">{CurrencyService.format(Number(selectedReceipt.amount_received), selectedReceipt.currency)}</span></div>
                   <div className="flex justify-between"><span>Change Given</span><span className="text-[#0B1630] font-bold">{CurrencyService.format(Number(selectedReceipt.change_amount), selectedReceipt.currency)}</span></div>
                   {selectedReceipt.notes && (
                      <div className="pt-2 border-t border-slate-200/50 mt-1">
                         <span className="block text-[#94A3B8] font-bold uppercase text-[9px]">Notes</span>
                         <p className="text-[#0B1630] mt-0.5 leading-relaxed font-normal">{selectedReceipt.notes}</p>
                      </div>
                   )}
                </div>
             </div>

             <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => window.print()}
                     className="py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                   >
                      <Printer size={15} /> Print
                   </button>
                   <button 
                     onClick={handleDownloadReceipt}
                     className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-50"
                   >
                      <Download size={15} /> Download
                   </button>
                </div>
                <button 
                  onClick={() => {
                     setIsReceiptModalOpen(false);
                     setSelectedReceipt(null);
                  }}
                  className="py-3.5 rounded-xl bg-[#0B1630] hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest text-center shadow-lg"
                >
                   Close View
                </button>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default Payments;
