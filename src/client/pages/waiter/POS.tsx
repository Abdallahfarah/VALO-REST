import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Users, 
  PauseCircle, 
  Send,
  Armchair
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService, OrderService, TableService, ActivityLogService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast-store';
import { useCurrency } from '../../services/CurrencyService';
import { useParams } from 'react-router-dom';

export const WaiterPOS = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const queryClient = useQueryClient();
  const { tableId } = useParams<{ tableId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [cart, setCart] = useState<any[]>([]);

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

  // Mutation for placing order
  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => OrderService.createOrder(orderData),
    onSuccess: (data) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'CREATE_ORDER',
        entity: 'ORDER',
        entityId: data?.id,
        details: `Placed waiter order with total ${total.toFixed(2)}`,
      });
      setCart([]);
      setSelectedTable('');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed', 'Order placed successfully!');
    },
    onError: (err: any) => {
      toast.error('Placement failed', err?.message || 'Failed to place order. Please try again.');
    }
  });

  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, seat: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
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
    if (cart.length === 0) {
      toast.warning('Cart Empty', 'Cart is empty');
      return;
    }

    const tableObj = tables.find((t: any) => t.id === selectedTable);
    const resolvedWaiterId = tableObj?.waiterId || user?.id || null;

    createOrderMutation.mutate({
      tenantId: tenant?.id,
      tableId: selectedTable,
      waiterId: resolvedWaiterId,
      items: cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: total,
      type: 'DINE_IN'
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  return (
    <div className="h-auto lg:h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-8">
      {/* Category Sidebar */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-56 w-full shrink-0 pb-2 lg:pb-0 whitespace-nowrap lg:whitespace-normal pr-2">
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

      {/* Product Grid */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-[#0B1630]">{selectedCategory ? categories.find((c:any) => c.id === selectedCategory)?.name : 'All Items'}</h2>
              <span className="text-xs font-bold text-[#94A3B8]">{products.length} ITEMS</span>
           </div>
           <div className="relative w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
             <input className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" placeholder="Search menu items..." />
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4">
          {products.map((product: any) => (
            <Card key={product.id} onClick={() => handleAddToCart(product)} className="p-0 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform text-left">
               <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500 relative">
                  {product.icon || '🍔'}
                  <div className="absolute inset-0 bg-[#0B1630]/0 group-hover:bg-[#0B1630]/5 transition-colors" />
               </div>
               <div className="p-4 flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-[#0B1630] line-clamp-1">{product.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                     <span className="text-sm font-black text-[#0B1630]">{format(Number(product.price))}</span>
                     <div className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors">
                        <Plus size={16} strokeWidth={3} />
                     </div>
                  </div>
               </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart / Order Panel */}
      <Card className="w-full lg:w-[380px] shrink-0 border-none shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Current Order</h3>
           <span className="text-[10px] font-black text-[#F97316] tracking-widest uppercase">DINE_IN</span>
        </div>

        <div className="p-6 space-y-4 border-b border-slate-50 bg-slate-50/50">
           <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
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
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {cart.map((item, i) => (
              <div key={i} className="flex gap-4">
                 <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-1">
                    {item.seat}
                 </div>
                 <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl">
                    {item.icon || '🍔'}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                       <h5 className="text-xs font-bold text-[#0B1630] truncate">{item.name}</h5>
                       <span className="text-xs font-black text-[#0B1630]">{format(Number(item.price) * item.quantity)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <button onClick={() => handleRemoveFromCart(item.id)} className="text-[#94A3B8] hover:text-[#EF4444]"><Trash2 size={12} /></button>
                          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 px-1 py-0.5">
                             <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-[#F97316]"><Minus size={10} /></button>
                             <span className="text-[10px] font-black px-2">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-[#F97316]"><Plus size={10} /></button>
                          </div>
                       </div>
                       <span className="text-[10px] font-medium text-[#94A3B8]">{format(Number(item.price))}</span>
                    </div>
                 </div>
              </div>
           ))}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6">
           <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-[#94A3B8]">
                 <span>SUBTOTAL</span>
                 <span>{format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-[#94A3B8]">
                 <span>TAX (15%)</span>
                 <span>{format(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-[#0B1630] pt-2">
                 <span>GRAND TOTAL</span>
                 <span>{format(total)}</span>
              </div>
           </div>

           <div className="space-y-3">
              <button 
                onClick={handlePlaceOrder}
                disabled={createOrderMutation.isPending}
                className={cn(
                   "w-full bg-[#F97316] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]",
                   createOrderMutation.isPending && "opacity-50 cursor-not-allowed"
                )}
              >
                 {createOrderMutation.isPending ? 'PLACING...' : <><Send size={18} strokeWidth={3} /> PLACE ORDER</>}
              </button>
              <button className="w-full bg-white text-[#0B1630] py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]">
                 <PauseCircle size={18} strokeWidth={3} /> HOLD ORDER
              </button>
           </div>
           
           <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Ready to Order</span>
           </div>
        </div>
      </Card>
    </div>
  );
};
