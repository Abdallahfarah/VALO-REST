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
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-140px)]">
      {/* Category Sidebar */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-[200px] w-full shrink-0 pb-2 lg:pb-0 whitespace-nowrap lg:whitespace-normal">
        {allCategories.map((c: any) => (
          <button
            key={c.id || 'all'}
            onClick={() => setSelectedCategory(c.id)}
            className={cn(
              "text-left px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer inline-block lg:block lg:w-full w-auto",
              selectedCategory === c.id ? "text-[#F97316]" : "text-[#64748B] hover:text-[#0B1630]"
            )}
          >
            <span className={cn("inline-block w-2 h-2 rounded-full mr-2", selectedCategory === c.id ? "bg-[#F97316]" : "bg-[#D1D5DB]")} />
            {c.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#0B1630]">
              {selectedCategory ? categories.find((c: any) => c.id === selectedCategory)?.name || 'Items' : 'All Items'}
            </h2>
            <span className="text-sm text-[#94A3B8] font-medium">{filteredProducts.length} ITEMS</span>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] text-sm bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F97316]"
              placeholder="Search menu items..."
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2">
          {filteredProducts.map((item: any) => (
            <Card key={item.id} className="border border-[#E5E7EB] shadow-none hover:shadow-md transition-shadow bg-white cursor-pointer" onClick={() => addToCart(item)}>
              <div className="h-32 bg-slate-800 rounded-t-2xl flex items-center justify-center">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover rounded-t-2xl" 
                    loading="lazy"
                    decoding="async"
                    width={300}
                    height={128}
                  />
                ) : (
                  <span className="text-slate-500 text-xs">No Image</span>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-[#0B1630] text-sm mb-2 leading-tight min-h-[36px]">{item.name}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B1630]">{format(Number(item.price))}</span>
                  <button className="w-7 h-7 rounded-full border-2 border-[#F97316] flex items-center justify-center text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors cursor-pointer">
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Order Panel */}
      <Card className="w-full lg:w-[340px] shrink-0 flex flex-col border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-[#0B1630]">Current Order</h3>
          <span className="text-xs font-bold text-[#F97316] bg-orange-50 px-2 py-1 rounded uppercase">Dine_In</span>
        </div>
        <div className="p-5 flex gap-3">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="flex-1 h-10 rounded-lg border border-[#E5E7EB] px-3 text-sm bg-white text-[#0B1630] cursor-pointer"
          >
            <option value="">Select Table</option>
            {availableTables.map((t: any) => (
              <option key={t.id} value={t.id}>Table {t.number} ({t.capacity}p)</option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 space-y-3">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0B1630] truncate">{item.name}</p>
                  <p className="text-xs text-[#94A3B8]">{format(Number(item.price))} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-[#94A3B8] hover:bg-slate-50 cursor-pointer">
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-bold text-[#0B1630] w-6 text-center">{item.quantity}</span>
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
            <div className="flex flex-col items-center justify-center text-center py-10">
              <ShoppingCart className="text-slate-300 mb-3" size={48} />
              <p className="font-semibold text-[#0B1630]">Your cart is empty</p>
              <p className="text-sm text-[#94A3B8]">Add items from the menu</p>
            </div>
          )}
        </div>

        {/* Totals & Actions */}
        <div className="p-5 border-t border-slate-100 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-[#94A3B8] font-medium uppercase tracking-wider text-xs">Subtotal</span><span className="font-semibold text-[#0B1630]">{format(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#94A3B8] font-medium uppercase tracking-wider text-xs">Tax (15%)</span><span className="font-semibold text-[#0B1630]">{format(tax)}</span></div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-100"><span>Grand Total</span><span>{format(total)}</span></div>
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || !selectedTable || createOrderMutation.isPending}
            className="w-full bg-[#F97316] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#ea580c] transition-colors shadow-lg shadow-[#F97316]/20 disabled:opacity-50 cursor-pointer"
          >
            {createOrderMutation.isPending ? 'SENDING...' : <><Send size={16} /> PLACE ORDER</>}
          </button>
          <div className="text-center">
            <span className="text-xs font-semibold text-emerald-500 flex items-center justify-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready to Order</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
