import { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  Users as UsersIcon, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Receipt,
  X,
  Printer,
  Download
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { OrderService, SettingService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../services/CurrencyService';
import { DetailedReceipt, getItemModifiersAndNotes } from '../../components/layout/DetailedReceipt';

export const MyOrders = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');

  const { data: allOrders = [] } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings', tenant?.id],
    queryFn: () => SettingService.getSettings(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  // Set up realtime updates for orders
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('waiter-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, queryClient]);

  // Filter orders assigned to this waiter OR newly placed QR orders
  const waiterOrders = allOrders.filter((o: any) => o.waiterId === user?.id || (o.customerName && o.customerName.includes('(QR')));

  // Filter based on search term
  const searchedOrders = waiterOrders.filter((o: any) => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.table?.number && o.table.number.toString().includes(searchTerm)) ||
    (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Compute KPIs dynamically
  const activeOrdersCount = waiterOrders.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELED').length;
  const servedOrdersCount = waiterOrders.filter((o: any) => o.status === 'COMPLETED').length; // served & paid
  const preparingOrdersCount = waiterOrders.filter((o: any) => o.status === 'PREPARING').length;
  const totalSalesToday = waiterOrders
    .filter((o: any) => o.status === 'COMPLETED')
    .reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0);

  const kpis = [
    { label: 'Active Orders', value: activeOrdersCount.toString(), sub: 'Currently in progress', icon: Receipt, color: 'text-indigo-500 lg:text-indigo-500', bg: 'lg:bg-indigo-50 bg-indigo-500/10' },
    { label: 'Served Orders', value: servedOrdersCount.toString(), sub: 'Completed today', icon: CheckCircle2, color: 'text-emerald-500 lg:text-emerald-500', bg: 'lg:bg-emerald-50 bg-emerald-500/10' },
    { label: 'Preparing', value: preparingOrdersCount.toString(), sub: 'In preparation', icon: Clock, color: 'text-orange-500 lg:text-orange-500', bg: 'lg:bg-orange-50 bg-orange-500/10' },
    { label: 'Total Sales', value: format(totalSalesToday), sub: 'From your orders today', icon: TrendingUp, color: 'text-blue-500 lg:text-blue-500', bg: 'lg:bg-blue-50 bg-blue-500/10' },
  ];

  const handleViewOrder = async (order: any) => {
    setSelectedOrder(order);
    if (order.status === 'COMPLETED') {
      const { data: rec, error } = await supabase
        .from('receipts')
        .select('*, users(*)')
        .eq('order_id', order.id)
        .maybeSingle();
      if (!error && rec) {
        setOrderReceipt(rec);
      } else {
        setOrderReceipt(null);
      }
    } else {
      setOrderReceipt(null);
    }
    setIsDetailsModalOpen(true);
  };

  const handleDownloadReceipt = () => {
    if (!selectedOrder || !orderReceipt) return;
    const itemsText = (selectedOrder.items || []).map((item: any) => {
      const itemName = item.menuItem?.name || 'Item';
      const { modifiers, notes } = getItemModifiersAndNotes(itemName);
      let detailsText = ` - ${item.quantity}x ${itemName} @ ${format(item.unitPrice)} = ${format(item.price)}`;
      if (modifiers.length > 0) {
        detailsText += '\n' + modifiers.map(m => `    • ${m.name} ${m.price > 0 ? `(+${m.price})` : ''}`).join('\n');
      }
      if (notes || item.notes) {
        detailsText += `\n    Note: ${item.notes || notes}`;
      }
      return detailsText;
    }).join('\n');

    const content = `
=========================================
          ${tenant?.name || 'VALO BISTRO'}
=========================================
Receipt No:     ${orderReceipt.receipt_number}
Date:           ${new Date(orderReceipt.created_at).toLocaleString()}
Table:          Table ${selectedOrder.table?.number || 'N/A'}
Waiter:         ${selectedOrder.waiterName || user?.email?.split('@')[0]}
-----------------------------------------
Items:
${itemsText}
-----------------------------------------
Subtotal:       ${format(Number(orderReceipt.subtotal))}
Tax (15%):      ${format(Number(orderReceipt.tax_amount))}
Grand Total:    ${format(Number(orderReceipt.total_amount))}
-----------------------------------------
Payment Method: ${orderReceipt.payment_method}
Amount Tendered:${format(Number(orderReceipt.amount_received ?? orderReceipt.total_amount))}
Change:         ${format(Number(orderReceipt.change_amount ?? 0))}
Notes:          ${orderReceipt.notes || 'None'}
-----------------------------------------
      Thank you for dining with us!
=========================================
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${orderReceipt.receipt_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold lg:text-[#0B1630] text-white">My Orders</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="lg:text-emerald-600 text-emerald-400 text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-4 lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>
                <kpi.icon size={24} />
             </div>
             <div>
               <h3 className="text-2xl font-black lg:text-[#0B1630] text-white">{kpi.value}</h3>
               <div className="text-[10px] font-bold lg:text-[#0B1630] text-white/90 flex flex-col">
                  {kpi.label}
                  <span className="text-[#94A3B8] font-medium normal-case">{kpi.sub}</span>
               </div>
             </div>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="lg:bg-white bg-transparent lg:border-none border-none lg:shadow-[0_4px_20px_rgba(0,0,0,0.03)] shadow-none overflow-hidden">
        {/* Table Filters */}
        <div className="p-6 lg:border-b lg:border-slate-50 border-b border-[#232B5E]/30 flex flex-wrap items-center gap-4 lg:bg-white bg-[#131A38]/70 backdrop-blur-md rounded-xl lg:rounded-none border border-[#232B5E]/50 shadow-2xl lg:shadow-none">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl lg:bg-slate-50/50 bg-[#1E293B] lg:border lg:border-slate-100 border border-[#232B5E]/30 lg:text-slate-800 text-white text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" 
              placeholder="Search orders by ID, table or customer..." 
            />
          </div>
        </div>

        {/* Desktop Table Content */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/20">
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Table</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Guests</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {searchedOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-[#0B1630]">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-[#0B1630]">Table {order.table?.number}</span>
                       <span className="text-[10px] font-medium text-[#94A3B8]">Main Floor</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
                        <UsersIcon size={14} strokeWidth={2.5} /> 2 Guests
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider inline-flex items-center gap-1.5",
                      order.status === 'PREPARING' ? "bg-indigo-50 text-indigo-600" :
                      order.status === 'PENDING' ? "bg-orange-50 text-orange-600" :
                      order.status === 'READY' ? "bg-emerald-50 text-emerald-600" :
                      order.status === 'COMPLETED' ? "bg-teal-50 text-teal-600" :
                      "bg-blue-50 text-blue-600"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", 
                        order.status === 'PREPARING' ? "bg-indigo-500" :
                        order.status === 'PENDING' ? "bg-orange-500" :
                        order.status === 'READY' ? "bg-emerald-500" : 
                        order.status === 'COMPLETED' ? "bg-teal-500" : "bg-blue-500"
                      )} />
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                       <div className="flex -space-x-2">
                          {order.items?.slice(0, 3).map((item: any, i: number) => (
                             <div key={i} className="w-8 h-8 rounded-xl border-2 border-white bg-slate-50 flex items-center justify-center text-xs shadow-sm" title={item.menuItem?.name}>
                                🍳
                             </div>
                          ))}
                       </div>
                       {order.items?.length > 3 && (
                          <span className="text-[10px] font-bold text-[#94A3B8] ml-2">+{order.items.length - 3}</span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-[#0B1630]">{format(Number(order.totalAmount))}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-[#0B1630]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       <span className="text-[10px] font-medium text-[#94A3B8]">Today</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                          onClick={() => handleViewOrder(order)}
                          className="h-8 px-3 rounded-lg border border-slate-200 text-[10px] font-bold text-[#0B1630] hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
                       >
                          <Eye size={12} /> View
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE RESPONSIVE CARDS VIEW --- */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-transparent mt-4 md:mt-0">
          {searchedOrders.map((order: any) => (
            <Card 
              key={order.id} 
              className="p-4 bg-[#131A38]/70 border border-[#232B5E]/50 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">#{order.id.slice(0, 8)}</span>
                <span className="text-[10px] text-[#94A3B8]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Table {order.table?.number}</h4>
                  <span className="text-[9px] text-[#94A3B8] uppercase">Main Floor</span>
                </div>
                <span className={cn(
                  "text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider inline-flex items-center gap-1.5",
                  order.status === 'PREPARING' ? "bg-indigo-50/10 text-indigo-400 border border-indigo-500/20" :
                  order.status === 'PENDING' ? "bg-orange-50/10 text-orange-400 border border-orange-500/20" :
                  order.status === 'READY' ? "bg-emerald-50/10 text-emerald-400 border border-emerald-500/20" :
                  order.status === 'COMPLETED' ? "bg-teal-50/10 text-teal-400 border border-teal-500/20" :
                  "bg-blue-50/10 text-blue-400 border border-blue-500/20"
                )}>
                  {order.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between border-t border-[#232B5E]/20 pt-3">
                <div className="text-[10px] text-[#94A3B8] font-bold">
                  {order.items?.length || 0} Items • {format(Number(order.totalAmount))}
                </div>
                <button 
                  onClick={() => handleViewOrder(order)} 
                  className="bg-[#F97316] text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors"
                >
                  View
                </button>
              </div>
            </Card>
          ))}
          {searchedOrders.length === 0 && (
            <div className="text-center py-8 text-xs text-[#94A3B8] font-bold col-span-full">
              No orders found
            </div>
          )}
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-6 lg:border-t lg:border-slate-50 border-t border-[#232B5E]/30 flex items-center justify-between lg:bg-white bg-[#131A38]/70 backdrop-blur-md rounded-xl lg:rounded-none border border-[#232B5E]/50 shadow-2xl lg:shadow-none mt-4 md:mt-0">
           <span className="text-xs font-medium text-[#94A3B8]">Showing {searchedOrders.length} orders</span>
           <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl lg:bg-white bg-[#1E293B] lg:border lg:border-slate-200 border-none text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-all">
                 <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                 <button className="w-8 h-8 rounded-xl lg:bg-[#0B1630] bg-[#F97316] text-white text-xs font-bold shadow-lg shadow-slate-900/10">1</button>
              </div>
              <button className="p-2 rounded-xl lg:bg-white bg-[#1E293B] lg:border lg:border-slate-200 border-none lg:text-[#0B1630] text-[#94A3B8] hover:bg-slate-50 transition-all">
                 <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </Card>

      {/* --- MODAL: ORDER DETAILS & RECEIPT VIEW --- */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-[#090D1F]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-8 lg:bg-white bg-[#131A38] lg:border-none border border-[#232B5E]/50 shadow-2xl relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
             <button 
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedOrder(null);
                  setOrderReceipt(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
             >
                 <X size={20} />
             </button>
             <div>
                 <h3 className="text-xl font-black lg:text-[#0B1630] text-white">Order Details</h3>
                 <p className="text-xs lg:text-[#64748B] text-[#94A3B8] font-medium">Order ID: #{selectedOrder.id}</p>
             </div>

             <div className="grid grid-cols-2 gap-4 text-xs font-bold lg:text-[#64748B] text-[#94A3B8] lg:bg-slate-50 bg-[#1E293B]/70 p-4 rounded-xl lg:border lg:border-slate-100 border border-[#232B5E]/30">
                <div className="space-y-1">
                   <span>Table</span>
                   <p className="text-sm font-black lg:text-[#0B1630] text-white">Table {selectedOrder.table?.number || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                   <span>Status</span>
                   <p className="text-sm font-black text-indigo-400 lg:text-indigo-600 uppercase">{selectedOrder.status}</p>
                </div>
                <div className="space-y-1">
                   <span>Placed Time</span>
                   <p className="text-sm font-black lg:text-[#0B1630] text-white">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="space-y-1">
                   <span>Assigned Waiter</span>
                   <p className="text-sm font-black lg:text-[#0B1630] text-white">{selectedOrder.waiterName || 'Unassigned'}</p>
                </div>
             </div>

             <div className="space-y-3">
                <h4 className="text-xs font-black lg:text-[#0B1630] text-white uppercase tracking-wider">Itemized Checklist</h4>
                <div className="divide-y lg:divide-slate-100 divide-[#232B5E]/20 lg:border-t lg:border-b lg:border-slate-100 border-t border-b border-[#232B5E]/20 max-h-48 overflow-y-auto">
                   {(selectedOrder.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2.5 text-xs lg:text-[#0B1630] text-white font-bold">
                         <span>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                         <span>{format(item.price)}</span>
                      </div>
                   ))}
                </div>
                <div className="flex justify-between text-sm font-black lg:text-[#0B1630] text-white pt-2">
                   <span>Grand Total</span>
                   <span>{format(Number(selectedOrder.totalAmount))}</span>
                </div>
             </div>

             {/* Receipt section for COMPLETED orders */}
             {selectedOrder.status === 'COMPLETED' && orderReceipt && (
                <div className="space-y-4 lg:border-t border-t border-dashed lg:border-slate-200 border-[#232B5E]/30 pt-4">
                   <h4 className="text-xs font-black lg:text-[#0B1630] text-white uppercase tracking-wider">Official Payment Receipt</h4>
                   
                   {/* Width Toggle Selector */}
                   <div className="flex justify-center items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Paper Width:</span>
                     <button 
                       onClick={() => setPaperWidth('58mm')}
                       className={cn(
                         "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer",
                         paperWidth === '58mm' ? "bg-[#F97316] text-white shadow-sm" : "bg-transparent text-slate-500 hover:bg-slate-100"
                       )}
                     >
                       58mm
                     </button>
                     <button 
                       onClick={() => setPaperWidth('80mm')}
                       className={cn(
                         "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer",
                         paperWidth === '80mm' ? "bg-[#F97316] text-white shadow-sm" : "bg-transparent text-slate-500 hover:bg-slate-100"
                       )}
                     >
                       80mm
                     </button>
                   </div>

                   {/* Receipt Content Wrapper */}
                   <div className="overflow-y-auto max-h-[40vh] border border-slate-100 rounded-2xl bg-white p-2">
                     <div className="print-receipt-container">
                       <DetailedReceipt 
                         receipt={{
                           receiptNumber: orderReceipt.receipt_number,
                           subtotal: Number(orderReceipt.subtotal),
                           taxAmount: Number(orderReceipt.tax_amount),
                           discountAmount: Number(orderReceipt.discount_amount || 0),
                           totalAmount: Number(orderReceipt.total_amount),
                           paymentMethod: orderReceipt.payment_method,
                           amountReceived: Number(orderReceipt.amount_received ?? orderReceipt.total_amount),
                           changeAmount: Number(orderReceipt.change_amount ?? 0),
                           notes: orderReceipt.notes,
                           createdAt: orderReceipt.created_at
                         }}
                         order={selectedOrder}
                         tenant={tenant}
                         settings={settings}
                         paperWidth={paperWidth}
                       />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2 pt-2">
                      <button 
                        onClick={() => window.print()}
                        className="py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                         <Printer size={15} /> Print/Reprint
                      </button>
                      <button 
                        onClick={handleDownloadReceipt}
                        className="py-3 px-4 rounded-xl lg:bg-white bg-[#1E293B] lg:border lg:border-slate-200 border-none lg:text-slate-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-50"
                      >
                         <Download size={15} /> Download
                      </button>
                   </div>
                </div>
             )}

             <button 
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedOrder(null);
                  setOrderReceipt(null);
                }}
                className="py-3.5 rounded-xl lg:bg-[#0B1630] bg-[#1E293B] hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest text-center shadow-lg mt-2"
             >
                Close View
             </button>
          </Card>
        </div>
      )}
    </div>
  );
};
export default MyOrders;
