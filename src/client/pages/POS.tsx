import { useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, Send, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService, OrderService, TableService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../services/CurrencyService';
import { toast } from '../lib/toast-store';

import { useSessionStore } from '../lib/session-store';

export const POS = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  const tenantId = tenant?.id || '';
  const tenantState = useSessionStore((state) => state.getTenantState(tenantId));
  const updateTenantState = useSessionStore((state) => state.updateTenantState);

  const selectedCategory = tenantState.posSelectedCategory;
  const setSelectedCategory = (val: string | null) => updateTenantState(tenantId, { posSelectedCategory: val });

  const selectedTable = tenantState.posSelectedTable;
  const setSelectedTable = (val: string) => updateTenantState(tenantId, { posSelectedTable: val });

  const cart = tenantState.posCart;
  const setCart = (val: any[] | ((prev: any[]) => any[])) => {
    const nextCart = typeof val === 'function' ? val(cart) : val;
    updateTenantState(tenantId, { posCart: nextCart });
  };

  const searchQuery = tenantState.posSearchQuery;
  const setSearchQuery = (val: string) => updateTenantState(tenantId, { posSearchQuery: val });
  const [activeMobileTab, setActiveMobileTab] = useState<'menu' | 'cart'>('menu');

  // ─── Data Fetching ───
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

  const availableTables = tables.filter((t: any) => t.status === 'AVAILABLE' || t.status === 'OCCUPIED');

  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => OrderService.createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setCart([]);
      setSelectedTable('');
      toast.success('Order placed', 'Order sent to kitchen successfully');
    },
  });

  // ─── Cart logic ───
  const addToCart = (item: any) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map((c) => {
      if (c.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((c) => c.id !== itemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.15;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handlePlaceOrder = () => {
    if (cart.length === 0 || !selectedTable) return;
    const tableObj = tables.find((t: any) => t.id === selectedTable);
    const resolvedWaiterId = tableObj?.waiterId || user?.id || null;

    createOrderMutation.mutate({
      tenantId: tenant?.id,
      tableId: selectedTable,
      tableNumber: tableObj?.number,
      waiterId: resolvedWaiterId,
      items: cart.map((c) => ({ 
        menuItemId: c.id, 
        quantity: c.quantity, 
        price: c.price,
        name: c.name,
        preparationStation: c.preparationStation || 'Chef'
      })),
      totalAmount: total,
      status: 'PENDING',
    });
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allCategories = [{ id: null, name: 'ALL ITEMS' }, ...categories.map((c: any) => ({ id: c.id, name: c.name.toUpperCase() }))];

  return (
    <div className="h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
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
      <div className={cn("flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-[200px] w-full shrink-0 pb-2 lg:pb-0 whitespace-nowrap lg:whitespace-normal pr-2", activeMobileTab !== 'menu' && "hidden lg:flex")}>
        {allCategories.map((c: any) => (
          <button
            key={c.id || 'all'}
            onClick={() => setSelectedCategory(c.id)}
            className={cn(
              "text-left px-4 py-3 lg:py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all inline-block lg:block lg:w-full w-auto",
              selectedCategory === c.id ? "bg-orange-50 text-[#F97316] border border-orange-100 shadow-sm" : "text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Menu Grid (Independently Scrollable on Mobile & Desktop) */}
      <div className={cn("flex-1 min-h-0 flex flex-col gap-4 lg:gap-6 overflow-hidden", activeMobileTab !== 'menu' && "hidden lg:flex")}>
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg lg:text-xl font-bold text-[#0B1630]">
              {selectedCategory ? categories.find((c: any) => c.id === selectedCategory)?.name || 'Items' : 'All Items'}
            </h2>
            <span className="text-xs font-bold text-[#94A3B8]">{filteredProducts.length} ITEMS</span>
          </div>
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 lg:h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs lg:text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]"
              placeholder="Search menu items..."
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-4 flex-1 overflow-y-auto pr-1 pb-2 content-start">
          {filteredProducts.map((item: any) => (
            <Card key={item.id} onClick={() => addToCart(item)} className="p-0 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform text-left flex flex-col">
              <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center text-4xl lg:text-5xl group-hover:scale-110 transition-transform duration-500 relative shrink-0">
                {item.icon || '🍔'}
                <div className="absolute inset-0 bg-[#0B1630]/0 group-hover:bg-[#0B1630]/5 transition-colors" />
              </div>
              <div className="p-3 lg:p-4 flex flex-col gap-1 justify-between flex-1">
                <h4 className="text-xs lg:text-sm font-bold text-[#0B1630] line-clamp-1">{item.name}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs lg:text-sm font-black text-[#0B1630]">{format(Number(item.price))}</span>
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg border border-slate-100 flex items-center justify-center text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors">
                    <Plus size={14} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Current Order (Anchored at Bottom on Mobile, Side Panel on Desktop) */}
      <Card className={cn("w-full lg:w-[340px] shrink-0 border-none shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col p-0 overflow-hidden bg-white", activeMobileTab === 'cart' ? "flex-1 min-h-0 flex" : "hidden lg:flex", "lg:h-full")}>
        <div className="p-3 lg:p-5 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white">
          <h3 className="font-bold text-[#0B1630] text-xs lg:text-sm uppercase tracking-wider">Current Order</h3>
          <span className="text-[10px] font-black text-[#F97316] tracking-widest uppercase">DINE_IN</span>
        </div>
        <div className="px-3 py-2.5 lg:p-5 border-b border-slate-50 bg-slate-50/50 shrink-0">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full h-10 rounded-lg border border-[#E5E7EB] px-3 text-sm bg-white text-[#0B1630] cursor-pointer"
          >
            <option value="">Select Table</option>
            {availableTables.map((t: any) => (
              <option key={t.id} value={t.id}>Table {t.number} ({t.capacity}p)</option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-3 lg:px-5 space-y-3 min-h-0">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs lg:text-sm font-bold text-[#0B1630] truncate">{item.name}</p>
                  <p className="text-[10px] lg:text-xs text-[#94A3B8]">{format(Number(item.price))} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-[#94A3B8] hover:bg-slate-50 cursor-pointer">
                    <Minus size={12} />
                  </button>
                  <span className="text-xs lg:text-sm font-bold text-[#0B1630] w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-[#94A3B8] hover:bg-slate-50 cursor-pointer">
                    <Plus size={12} />
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-6 lg:py-10">
              <ShoppingCart className="text-slate-300 mb-3" size={36} />
              <p className="font-semibold text-[#0B1630] text-sm">Your cart is empty</p>
              <p className="text-xs text-[#94A3B8]">Add items from the menu</p>
            </div>
          )}
        </div>

        {/* Totals & Actions */}
        <div className="p-3 lg:p-5 border-t border-slate-100 space-y-2 lg:space-y-3 shrink-0 bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] lg:text-xs font-medium text-[#94A3B8]"><span>SUBTOTAL</span><span>{format(subtotal)}</span></div>
            <div className="flex justify-between text-[11px] lg:text-xs font-medium text-[#94A3B8]"><span>TAX (15%)</span><span>{format(tax)}</span></div>
            <div className="flex justify-between text-base lg:text-lg font-black text-[#0B1630] pt-1"><span>GRAND TOTAL</span><span>{format(total)}</span></div>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || !selectedTable || createOrderMutation.isPending}
            className="w-full bg-[#F97316] text-white py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm uppercase tracking-widest flex items-center justify-center gap-2 lg:gap-3 hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
          >
            {createOrderMutation.isPending ? 'SENDING...' : <><Send size={16} /> PLACE ORDER</>}
          </button>
          <div className="text-center hidden lg:block">
            <span className="text-xs font-semibold text-emerald-500 flex items-center justify-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready to Order</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
