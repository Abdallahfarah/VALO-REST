import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Users, 
  Send,
  Armchair,
  DollarSign,
  CreditCard,
  Smartphone,
  Printer,
  X,
  AlertTriangle,
  Download,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService, OrderService, TableService, ActivityLogService, SettingService } from '../../services/ApiService';
import { DetailedReceipt } from '../../components/layout/DetailedReceipt';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { toast } from '../../lib/toast-store';
import { exportReceiptPdf } from '../../lib/export-utils';
import { useCurrency } from '../../services/CurrencyService';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useSessionStore } from '../../lib/session-store';

export const WaiterPOS = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId: string }>();

  const tenantId = tenant?.id || '';
  const tenantState = useSessionStore((state) => state.getTenantState(tenantId));
  const updateTenantState = useSessionStore((state) => state.updateTenantState);

  const selectedCategory = tenantState.waiterSelectedCategory;
  const setSelectedCategory = (val: string | null) => updateTenantState(tenantId, { waiterSelectedCategory: val });

  const selectedTable = tenantState.waiterSelectedTable;
  const setSelectedTable = (val: string) => updateTenantState(tenantId, { waiterSelectedTable: val });

  const cart = tenantState.waiterCart;
  const setCart = (val: any[] | ((prev: any[]) => any[])) => {
    const nextCart = typeof val === 'function' ? val(cart) : val;
    updateTenantState(tenantId, { waiterCart: nextCart });
  };

  // Modals / Warnings / Payment inputs
  const [showAssignWarning, setShowAssignWarning] = useState(false);
  const [warningWaiterName, setWarningWaiterName] = useState('');
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [settledReceipt, setSettledReceipt] = useState<any | null>(null);
  const [settledOrderData, setSettledOrderData] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [activeMobileTab, setActiveMobileTab] = useState<'menu' | 'cart'>('menu');

  useEffect(() => {
    if (tableId) {
      setSelectedTable(tableId);
    }
  }, [tableId]);

  // Data Fetching
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', tenant?.id],
    queryFn: () => MenuService.getCategories(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', tenant?.id, selectedCategory],
    queryFn: () => MenuService.getMenuItems(tenant?.id || '', selectedCategory || undefined),
    enabled: !!tenant?.id,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables', tenant?.id],
    queryFn: () => TableService.getTables(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings', tenant?.id],
    queryFn: () => SettingService.getSettings(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  // Fetch active order for the table
  const { data: activeOrder, refetch: refetchActiveOrder } = useQuery({
    queryKey: ['activeOrder', selectedTable],
    queryFn: async () => {
      if (!selectedTable) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(*))')
        .eq('table_id', selectedTable)
        .not('status', 'in', '("COMPLETED","CANCELED")')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTable
  });

  // Handle Assigned Mode warning
  useEffect(() => {
    if (selectedTable && settings?.tableAssignmentMode === 'ASSIGNED') {
      const currentTableObj = tables.find((t: any) => t.id === selectedTable);
      if (currentTableObj && currentTableObj.waiterId && currentTableObj.waiterId !== user?.id) {
        if (user?.role !== 'ADMIN') {
          setWarningWaiterName(currentTableObj.waiter?.name || 'another waiter');
          setShowAssignWarning(true);
        }
      }
    }
  }, [selectedTable, settings, tables, user]);

  // Sync active order items with local cart state
  useEffect(() => {
    if (selectedTable) {
      if (activeOrder) {
        const mapped = (activeOrder.order_items || []).map((oi: any) => ({
          id: oi.menu_items?.id || oi.menu_item_id,
          name: oi.menu_items?.name || 'Item',
          price: Number(oi.unit_price),
          icon: oi.menu_items?.icon || '🍔',
          quantity: oi.quantity,
          seat: 1,
          sent: true,
          orderItemId: oi.id,
          status: oi.status || 'PENDING',
          preparationStation: oi.menu_items?.preparation_station || 'Chef'
        }));
        setCart(mapped);
      } else {
        setCart([]);
      }
    }
  }, [activeOrder, selectedTable]);

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => OrderService.createOrder(orderData),
    onSuccess: (data) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'CREATE_ORDER',
        entity: 'ORDER',
        entityId: data?.id,
        details: `Placed waiter order items with total amount: ${total.toFixed(2)}`,
      });
      refetchActiveOrder();
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order sent', 'Items sent to kitchen successfully!');
    },
    onError: (err: any) => {
      toast.error('Send failed', err?.message || 'Failed to place order. Please try again.');
    }
  });

  const printBillMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tables')
        .update({ status: 'AWAITING_PAYMENT' })
        .eq('id', selectedTable);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      refetchActiveOrder();
      setIsBillModalOpen(true);
      toast.success('Bill Printed', 'Table status changed to Awaiting Payment.');
    },
    onError: (err: any) => {
       toast.error('Print failed', err?.message || 'Failed to print bill');
    }
  });

  const settleOrderMutation = useMutation({
    mutationFn: (paymentData: any) => OrderService.settleOrder(activeOrder?.id || '', paymentData),
    onSuccess: async () => {
      const { data: recData } = await supabase
        .from('receipts')
        .select('*')
        .eq('order_id', activeOrder?.id)
        .maybeSingle();

      const { data: fullOrder } = await supabase
        .from('orders')
        .select('*, tables(number), users(first_name, last_name, email), order_items(*, menu_items(name, price))')
        .eq('id', activeOrder?.id)
        .maybeSingle();

      setSettledReceipt(recData);
      setSettledOrderData(fullOrder || activeOrder);

      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'SETTLE_ORDER',
        entity: 'ORDER',
        entityId: activeOrder?.id || '',
        details: `Settled order by Waiter with total ${total.toFixed(2)} using ${selectedPaymentMethod}`,
      });
      
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Payment completed', 'Order settled and receipt generated!');
    },
    onError: (err: any) => {
      toast.error('Payment failed', err?.message || 'Failed to settle payment.');
    }
  });

  const handleAddToCart = (product: any) => {
    if (!selectedTable) {
      toast.warning('No Table Selected', 'Please select a table first');
      return;
    }
    setCart(prev => {
      const existingNonSent = prev.find(item => item.id === product.id && !item.sent);
      if (existingNonSent) {
        return prev.map(item => (item.id === product.id && !item.sent) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, seat: 1, sent: false }];
    });
  };

  const handleRemoveFromCart = (productId: string, sent?: boolean) => {
    if (sent) {
      toast.warning('Cannot remove', 'Cannot remove items already sent to the kitchen.');
      return;
    }
    setCart(prev => prev.filter(item => !(item.id === productId && !item.sent)));
  };

  const updateQuantity = (productId: string, delta: number, sent?: boolean) => {
    if (sent) {
      toast.warning('Cannot modify', 'Cannot modify quantity of already sent items.');
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === productId && !item.sent) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handlePlaceOrder = () => {
    if (!selectedTable) {
      toast.warning('No Table', 'Please select a table');
      return;
    }
    const newItems = cart.filter(item => !item.sent);
    if (newItems.length === 0) {
      toast.warning('No New Items', 'There are no new items to send to the kitchen.');
      return;
    }

    const tableObj = tables.find((t: any) => t.id === selectedTable);
    const resolvedWaiterId = tableObj?.waiterId || user?.id || null;

    const newSubtotal = newItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
    const newTotal = newSubtotal * 1.15;

    createOrderMutation.mutate({
      tenantId: tenant?.id,
      tableId: selectedTable,
      tableNumber: tableObj?.number,
      waiterId: resolvedWaiterId,
      items: newItems.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        preparationStation: item.preparationStation || 'Chef'
      })),
      totalAmount: newTotal,
      type: 'DINE_IN'
    });
  };

  const handleSettlePayment = () => {
    const amtReceived = selectedPaymentMethod === 'Cash' ? Number(amountReceived) : total;
    if (selectedPaymentMethod === 'Cash' && amtReceived < total) {
      toast.warning('Invalid Amount', 'Amount received cannot be less than total.');
      return;
    }
    const change = selectedPaymentMethod === 'Cash' ? Math.max(0, amtReceived - total) : 0;
    
    settleOrderMutation.mutate({
      method: selectedPaymentMethod,
      tenantId: tenant?.id,
      cashierId: user?.id,
      amountReceived: amtReceived,
      changeAmount: change,
      notes: paymentNotes
    });
  };

  const handleReceiptDone = () => {
    setCart([]);
    setSelectedTable('');
    setAmountReceived('');
    setPaymentNotes('');
    setSettledReceipt(null);
    setSettledOrderData(null);
    setIsReceiptModalOpen(false);
    navigate('/waiter/tables');
  };

  const handleDownloadReceipt = () => {
    if (!settledReceipt) return;
    try {
      exportReceiptPdf({
        receiptNumber: settledReceipt.receipt_number,
        tableNumber: tables.find((t: any) => t.id === activeOrder?.table_id)?.number || 'N/A',
        waiterName: user?.email ? user.email.split('@')[0] : 'Waiter',
        restaurantName: tenant?.name || 'DHADHAN BISTRO',
        date: new Date(settledReceipt.created_at).toLocaleString(),
        paymentMethod: settledReceipt.payment_method,
        currency: tenant?.currencyCode || 'ETB',
        items: (settledOrderData?.order_items || activeOrder?.order_items || cart).map((item: any) => {
          const q = item.quantity || 1;
          const uP = Number(item.unit_price || item.unitPrice || item.price || 0);
          const tP = Number(item.price || item.totalPrice || uP * q);
          return {
            name: item.menu_items?.name || item.menuItem?.name || item.name || 'Item',
            quantity: q,
            unitPrice: uP,
            totalPrice: tP
          };
        }),
        subtotal: Number(settledReceipt.subtotal),
        taxAmount: Number(settledReceipt.tax_amount),
        totalAmount: Number(settledReceipt.total_amount),
        amountReceived: Number(settledReceipt.amount_received || settledReceipt.total_amount),
        changeAmount: Number(settledReceipt.change_amount || 0)
      });
      toast.success('Receipt Exported', 'Receipt PDF downloaded successfully.');
    } catch (err: any) {
      console.error('[handleDownloadReceipt] Failed to export receipt PDF:', err);
      toast.error('Export Failed', 'Could not generate receipt PDF.');
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const newItems = cart.filter(item => !item.sent);
  const calculatedChange = selectedPaymentMethod === 'Cash' && Number(amountReceived) >= total
    ? Number(amountReceived) - total
    : 0;

  return (
    <div className="h-[calc(100vh-176px)] lg:h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 lg:gap-8 overflow-hidden">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-[#131A38]/50 p-1 rounded-xl border border-[#232B5E]/30 shrink-0 w-full">
        <button
          onClick={() => setActiveMobileTab('menu')}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider",
            activeMobileTab === 'menu' ? "bg-[#F97316] text-white shadow-md" : "text-[#94A3B8]"
          )}
        >
          Menu Grid
        </button>
        <button
          onClick={() => setActiveMobileTab('cart')}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2",
            activeMobileTab === 'cart' ? "bg-[#F97316] text-white shadow-md" : "text-[#94A3B8]"
          )}
        >
          Current Order
          {cart.length > 0 && (
            <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Category Sidebar */}
      <div className={cn("flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-56 w-full shrink-0 pb-2 lg:pb-0 whitespace-nowrap lg:whitespace-normal pr-2", activeMobileTab !== 'menu' && "hidden lg:flex")}>
        <button 
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "text-left px-4 py-3 lg:py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all inline-block lg:block lg:w-full w-auto",
            !selectedCategory ? "bg-orange-50 text-[#F97316] border border-orange-100 shadow-sm" : "text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50"
          )}
        >
          ALL ITEMS
        </button>
        {categories.map((cat: any) => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "text-left px-4 py-3 lg:py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all inline-block lg:block lg:w-full w-auto",
              selectedCategory === cat.id ? "bg-orange-50 text-[#F97316] border border-orange-100 shadow-sm" : "text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid Container (Independently Scrollable on Mobile & Desktop) */}
      <div className={cn("flex-1 min-h-0 flex flex-col gap-4 lg:gap-6 overflow-hidden", activeMobileTab !== 'menu' && "hidden lg:flex")}>
        <div className="flex items-center justify-between shrink-0">
           <div className="flex items-center gap-4">
              <h2 className="text-lg lg:text-xl font-bold text-[#0B1630]">{selectedCategory ? categories.find((c:any) => c.id === selectedCategory)?.name : 'All Items'}</h2>
              <span className="text-xs font-bold text-[#94A3B8]">{products.length} ITEMS</span>
           </div>
           <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input className="w-full h-9 lg:h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs lg:text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" placeholder="Search menu items..." />
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 flex-1 overflow-y-auto pr-1 pb-2 content-start">
          {products.map((product: any) => (
            <Card key={product.id} onClick={() => handleAddToCart(product)} className="p-0 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform text-left flex flex-col">
               <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center text-4xl lg:text-5xl group-hover:scale-110 transition-transform duration-500 relative shrink-0">
                  {product.icon || '🍔'}
                  <div className="absolute inset-0 bg-[#0B1630]/0 group-hover:bg-[#0B1630]/5 transition-colors" />
               </div>
               <div className="p-3 lg:p-4 flex flex-col gap-1 justify-between flex-1">
                  <h4 className="text-xs lg:text-sm font-bold text-[#0B1630] line-clamp-1">{product.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                     <span className="text-xs lg:text-sm font-black text-[#0B1630]">{format(Number(product.price))}</span>
                     <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg border border-slate-100 flex items-center justify-center text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors">
                        <Plus size={14} strokeWidth={3} />
                     </div>
                  </div>
               </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Current Order Card (Permanently Anchored at Bottom on Mobile, Side Panel on Desktop) */}
      <Card className={cn("w-full lg:w-[380px] shrink-0 border-none shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col p-0 overflow-hidden bg-white", activeMobileTab === 'cart' ? "flex-1 min-h-0 flex" : "hidden lg:flex", "lg:h-full")}>
        <div className="p-3 lg:p-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white">
           <h3 className="font-bold text-[#0B1630] text-xs lg:text-sm uppercase tracking-wider">Current Order</h3>
           <span className="text-[10px] font-black text-[#F97316] tracking-widest uppercase">DINE_IN</span>
        </div>

        <div className="px-3 py-2.5 lg:p-6 space-y-3 lg:space-y-4 border-b border-slate-50 bg-slate-50/50 shrink-0">
           <div className="flex items-center gap-3 lg:gap-4">
              <div className="flex-1 flex items-center gap-2 bg-white px-3 py-1.5 lg:py-2 rounded-xl border border-slate-200">
                 <Armchair size={14} className="text-[#94A3B8]" />
                 <select 
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#0B1630] outline-none w-full"
                 >
                    <option value="">Select Table</option>
                    {tables.map((t: any) => (
                       <option key={t.id} value={t.id}>Table {t.number}</option>
                    ))}
                 </select>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 lg:py-2 rounded-xl border border-slate-200">
                 <Users size={14} className="text-[#94A3B8]" />
                 <span className="text-xs font-bold text-[#0B1630]">
                   {(() => {
                     const tableObj = tables.find((t: any) => t.id === selectedTable);
                     return `${tableObj?.guestCount || 0} GUESTS`;
                   })()}
                 </span>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-6 min-h-0">
           {cart.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                 No items added yet. Tap menu items to add.
              </div>
           ) : (
              cart.map((item, i) => (
                <div key={i} className="flex gap-3 lg:gap-4 relative group">
                   <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-indigo-500 text-white text-[9px] lg:text-[10px] font-black flex items-center justify-center shrink-0 mt-1">
                      {item.seat}
                   </div>
                   <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg lg:text-2xl shrink-0">
                      {item.icon || '🍔'}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 lg:mb-1">
                         <div className="flex items-center gap-1.5 min-w-0">
                            <h5 className="text-xs font-bold text-[#0B1630] truncate">{item.name}</h5>
                            {item.sent && (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded shrink-0">
                                 Kitchen
                              </span>
                            )}
                         </div>
                         <span className="text-xs font-black text-[#0B1630]">{format(Number(item.price) * item.quantity)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 lg:gap-3">
                            <button 
                              onClick={() => handleRemoveFromCart(item.id, item.sent)} 
                              className={cn("text-[#94A3B8]", item.sent ? "opacity-30 cursor-not-allowed" : "hover:text-[#EF4444]")}
                            >
                              <Trash2 size={12} />
                            </button>
                            <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 px-1 py-0.5">
                               <button 
                                 onClick={() => updateQuantity(item.id, -1, item.sent)} 
                                 className={cn("p-0.5 lg:p-1", item.sent ? "opacity-30 cursor-not-allowed" : "hover:text-[#F97316]")}
                               >
                                 <Minus size={10} />
                               </button>
                               <span className="text-[10px] font-black px-1.5 lg:px-2">{item.quantity}</span>
                               <button 
                                 onClick={() => updateQuantity(item.id, 1, item.sent)} 
                                 className={cn("p-0.5 lg:p-1", item.sent ? "opacity-30 cursor-not-allowed" : "hover:text-[#F97316]")}
                               >
                                 <Plus size={10} />
                               </button>
                            </div>
                         </div>
                         <span className="text-[10px] font-medium text-[#94A3B8]">{format(Number(item.price))}</span>
                      </div>
                   </div>
                </div>
              ))
           )}
        </div>

        <div className="p-3 lg:p-6 bg-slate-50/50 border-t border-slate-100 space-y-3 lg:space-y-6 shrink-0">
           <div className="space-y-1 lg:space-y-2">
              <div className="flex justify-between text-[11px] lg:text-xs font-medium text-[#94A3B8]">
                 <span>SUBTOTAL</span>
                 <span>{format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] lg:text-xs font-medium text-[#94A3B8]">
                 <span>TAX (15%)</span>
                 <span>{format(tax)}</span>
              </div>
              <div className="flex justify-between text-base lg:text-lg font-black text-[#0B1630] pt-1">
                 <span>GRAND TOTAL</span>
                 <span>{format(total)}</span>
              </div>
           </div>

           <div className="space-y-2 lg:space-y-3">
              {newItems.length > 0 ? (
                <button 
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isPending}
                  className={cn(
                     "w-full bg-[#F97316] text-white py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest flex items-center justify-center gap-2 lg:gap-3 hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]",
                     createOrderMutation.isPending && "opacity-50 cursor-not-allowed"
                  )}
                >
                   {createOrderMutation.isPending ? 'SENDING...' : <><Send size={16} className="lg:w-[18px] lg:h-[18px]" strokeWidth={3} /> SEND TO KITCHEN</>}
                </button>
              ) : activeOrder ? (
                <div className="grid grid-cols-2 gap-2 lg:gap-3">
                  <button 
                    onClick={() => printBillMutation.mutate()}
                    disabled={printBillMutation.isPending}
                    className="bg-white text-[#0B1630] py-2.5 lg:py-4 rounded-xl lg:rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                     <Printer size={16} /> Bill
                  </button>
                  <button 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="bg-emerald-500 text-white py-2.5 lg:py-4 rounded-xl lg:rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                  >
                     <DollarSign size={16} /> Pay
                  </button>
                </div>
              ) : (
                <button 
                  disabled
                  className="w-full bg-slate-100 text-slate-400 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest flex items-center justify-center gap-3 cursor-not-allowed"
                >
                   Add Items to Start
                </button>
              )}
           </div>
           
           <div className="flex items-center justify-center gap-2 hidden lg:flex">
              <div className={cn("w-2 h-2 rounded-full", activeOrder ? "bg-indigo-500 animate-pulse" : "bg-emerald-500")} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", activeOrder ? "text-indigo-600" : "text-emerald-600")}>
                 {activeOrder ? 'Serving Table' : 'Ready to Order'}
              </span>
           </div>
        </div>
      </Card>

      {/* --- MODAL: ASSIGNED MODE WARNING --- */}
      {showAssignWarning && (
        <div className="fixed inset-0 z-50 bg-[#0B1630]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 border-none shadow-2xl relative bg-white flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0B1630]">Table Assignment Restriction</h3>
              <p className="text-sm text-[#64748B] mt-2">
                This table is assigned to <span className="font-bold text-[#0B1630]">{warningWaiterName}</span>.
              </p>
            </div>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => {
                  setSelectedTable('');
                  setShowAssignWarning(false);
                }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all uppercase tracking-wider"
              >
                Go Back
              </button>
              {user?.role === 'ADMIN' && (
                <button 
                  onClick={() => setShowAssignWarning(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  Override
                </button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* --- MODAL: PRINT BILL / INVOICE VIEW --- */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1630]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-none shadow-2xl relative bg-white flex flex-col gap-4">
             <button 
               onClick={() => setIsBillModalOpen(false)}
               className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
             >
                <X size={20} />
             </button>

             <div className="flex items-center justify-between border-b border-slate-100 pb-3 pr-8">
               <h3 className="text-sm font-black text-[#0B1630] uppercase tracking-wider">Print Bill Preview</h3>
               <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button
                   onClick={() => setPaperWidth('58mm')}
                   className={cn(
                     "px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer",
                     paperWidth === '58mm' ? "bg-white text-[#0B1630] shadow-sm" : "text-slate-500"
                   )}
                 >
                   58mm
                 </button>
                 <button
                   onClick={() => setPaperWidth('80mm')}
                   className={cn(
                     "px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer",
                     paperWidth === '80mm' ? "bg-white text-[#0B1630] shadow-sm" : "text-slate-500"
                   )}
                 >
                   80mm
                 </button>
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto max-h-[55vh] border border-slate-100 rounded-xl bg-white p-2">
                <div className="print-receipt-container">
                  <DetailedReceipt 
                    order={{
                      ...activeOrder,
                      tableNumber: tables.find((t: any) => t.id === selectedTable)?.number,
                      items: activeOrder?.items || cart,
                      waiterName: user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : (user?.email ? user.email.split('@')[0] : 'Staff')
                    }}
                    tenant={tenant}
                    settings={settings}
                    paperWidth={paperWidth}
                    type="CUSTOMER"
                  />
                </div>
             </div>

             <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button 
                  onClick={() => {
                     window.print();
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                   <Printer size={16} /> Print Bill
                </button>
                <button 
                  onClick={() => setIsBillModalOpen(false)}
                  className="py-3 px-5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                >
                   Close
                </button>
             </div>
          </Card>
        </div>
      )}

      {/* --- MODAL: COLLECT PAYMENT --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1630]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 border-none shadow-2xl relative bg-white flex flex-col gap-6">
             <button 
               onClick={() => setIsPaymentModalOpen(false)}
               className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
             >
                <X size={20} />
             </button>
             <div>
                <h3 className="text-xl font-black text-[#0B1630]">Collect Payment</h3>
                <p className="text-xs text-[#64748B] font-medium">Settle the table bill by entering transaction details</p>
             </div>

             <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Cash', icon: DollarSign },
                  { id: 'Card', icon: CreditCard },
                  { id: 'Mobile Money', icon: Smartphone }
                ].map(method => (
                  <div 
                    key={method.id}
                    onClick={() => {
                      setSelectedPaymentMethod(method.id);
                      if (method.id !== 'Cash') {
                        setAmountReceived('');
                      }
                    }}
                    className={cn(
                      "p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 items-center text-center",
                      selectedPaymentMethod === method.id 
                        ? "bg-indigo-50 border-indigo-500 shadow-sm" 
                        : "border-slate-100 hover:border-indigo-300"
                    )}
                  >
                     <div className={cn(
                       "w-9 h-9 rounded-xl flex items-center justify-center",
                       selectedPaymentMethod === method.id ? "bg-indigo-500 text-white" : "bg-slate-50 text-[#94A3B8]"
                     )}>
                        <method.icon size={18} />
                     </div>
                     <span className="text-[10px] font-bold text-[#0B1630]">{method.id}</span>
                  </div>
                ))}
             </div>

             <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-center">
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Total amount due</span>
                <h2 className="text-3xl font-black text-indigo-900 mt-1">{format(total)}</h2>
             </div>

             {/* Dynamic Cash Payment fields */}
             {selectedPaymentMethod === 'Cash' && (
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[#0B1630]">Amount Received</label>
                      <div className="relative">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#94A3B8]">
                            {format(0).replace(/[\d.,\s]+/g, '')}
                         </div>
                         <input 
                            type="number"
                            required
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-250 text-sm font-bold text-[#0B1630] focus:outline-none focus:border-[#F97316]"
                            placeholder="e.g. 100"
                         />
                      </div>
                   </div>
                   
                   {calculatedChange > 0 && (
                      <div className="flex justify-between items-center bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100 text-xs font-bold">
                         <span>Change Back</span>
                         <span className="text-sm font-black">{format(calculatedChange)}</span>
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
                   placeholder="Add table references, receipt notes, split payment details..."
                />
             </div>

             <div className="flex gap-4">
                <button 
                  onClick={handleSettlePayment}
                  disabled={settleOrderMutation.isPending || (selectedPaymentMethod === 'Cash' && Number(amountReceived) < total)}
                  className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                   {settleOrderMutation.isPending ? 'Settle...' : 'Confirm Paid'}
                </button>
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50"
                >
                   Cancel
                </button>
             </div>
          </Card>
        </div>
      )}
      {/* --- MODAL: OFFICIAL RECEIPT PREVIEW --- */}
      {isReceiptModalOpen && settledReceipt && (
        <div className="fixed inset-0 z-50 bg-[#0B1630]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-md p-6 border-none shadow-2xl relative bg-white flex flex-col gap-4 max-h-[90vh]">
             <div className="text-center pt-2 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 animate-bounce">
                   <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-[#0B1630] uppercase tracking-wider">Transaction Complete</h3>
                <p className="text-[10px] font-bold text-[#94A3B8]">Order settled successfully</p>
             </div>

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
             <div className="flex-1 overflow-y-auto max-h-[50vh] border border-slate-100 rounded-2xl bg-white p-2">
               <div className="print-receipt-container">
                 <DetailedReceipt 
                   receipt={{
                     receiptNumber: settledReceipt.receipt_number,
                     subtotal: Number(settledReceipt.subtotal),
                     taxAmount: Number(settledReceipt.tax_amount),
                     discountAmount: Number(settledReceipt.discount_amount || 0),
                     totalAmount: Number(settledReceipt.total_amount),
                     paymentMethod: settledReceipt.payment_method,
                     amountReceived: Number(settledReceipt.amount_received),
                     changeAmount: Number(settledReceipt.change_amount),
                     notes: settledReceipt.notes,
                     createdAt: settledReceipt.created_at
                   }}
                    order={{
                      ...(settledOrderData || activeOrder),
                      tableNumber: tables.find((t: any) => t.id === (settledOrderData?.table_id || selectedTable))?.number || settledOrderData?.tables?.number,
                      items: settledOrderData?.order_items || activeOrder?.items || cart,
                      waiterName: user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : (user?.email ? user.email.split('@')[0] : 'Staff')
                    }}
                   tenant={tenant}
                   settings={settings}
                   paperWidth={paperWidth}
                   type="PAYMENT"
                 />
               </div>
             </div>

             <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 mt-auto">
                <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => window.print()}
                     className="py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
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
                  onClick={handleReceiptDone}
                  className="py-3.5 rounded-xl bg-[#0B1630] hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest text-center shadow-lg"
                >
                   Close & Free Table
                </button>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default WaiterPOS;
