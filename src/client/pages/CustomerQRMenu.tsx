import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Bell, Receipt, ShoppingCart, ShoppingBag, Plus, Minus, X, Check,
  ChevronDown, Info, Loader2, Sparkles, CreditCard, Landmark
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { NotificationService, MenuService } from '../services/ApiService';
import { toast } from '../lib/toast-store';

export const CustomerQRMenu = () => {
  const { slug, tableNumber } = useParams<{ slug: string; tableNumber?: string }>();
  
  // States
  const [tenant, setTenant] = useState<any>(null);
  const [table, setTable] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Customization States
  const [qrEnabled, setQrEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome! Browse our menu and place your order.');
  const [payAtCounter, setPayAtCounter] = useState(true);
  const [onlinePayment, setOnlinePayment] = useState(false);

  // Cart States
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COUNTER' | 'ONLINE'>('COUNTER');
  const [orderNote, setOrderNote] = useState('');
  const [orderPlaced, setOrderPlaced] = useState<any | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Service States
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);

  // Scroll indicator state
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const handleInteraction = () => {
      setShowScrollIndicator(false);
    };
    window.addEventListener('scroll', handleInteraction, { passive: true });
    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // 1. Load data
  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const loadMenuData = async () => {
      try {
        // Query tenant
        const { data: tenantData, error: tenantErr } = await supabase
          .from('tenants')
          .select('*, restaurant_settings(*)')
          .eq('slug', slug)
          .single();

        if (tenantErr || !tenantData) {
          throw new Error('Restaurant not found.');
        }

        setTenant(tenantData);

        // Extract QR settings
        const settings = tenantData.restaurant_settings?.[0] || {};
        const qrConfig = settings.business_hours?.qr_config;
        if (qrConfig) {
          if (qrConfig.enabled === false) {
            setQrEnabled(false);
            setLoading(false);
            return;
          }
          setWelcomeMessage(qrConfig.welcome_message || 'Welcome! Browse our menu and place your order.');
          setPayAtCounter(qrConfig.pay_at_counter !== false);
          setOnlinePayment(!!qrConfig.online_payment);
        }

        // Query table if number provided
        if (tableNumber) {
          const { data: tableData } = await supabase
            .from('tables')
            .select('*')
            .eq('tenant_id', tenantData.id)
            .eq('number', tableNumber)
            .maybeSingle();
          
          if (tableData) setTable(tableData);
        }

        // Query categories using the shared MenuService
        const catData = await MenuService.getCategories(tenantData.id);

        // Query menu items using the shared MenuService
        const prodData = await MenuService.getMenuItems(tenantData.id, undefined, true);

        if (catData) setCategories(catData);
        if (prodData) setProducts(prodData);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading the menu.');
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, [slug, tableNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Loader2 className="w-10 h-10 text-[#F97316] animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Menu...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
          <X size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#0B1630] mb-2">Menu Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">{error || 'This QR Code URL is invalid or the restaurant could not be found.'}</p>
      </div>
    );
  }

  if (!qrEnabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-[#F97316] flex items-center justify-center mb-6">
          <Info size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#0B1630] mb-2">Ordering Offline</h2>
        <p className="text-sm text-slate-400 max-w-sm">QR Menu self-ordering is currently deactivated for {tenant.name}. Please order directly with our staff.</p>
      </div>
    );
  }

  // Cart operations
  const addToCart = (product: any) => {
    const existing = cart.find(c => c.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success('Added to Cart', `${product.name} added successfully.`);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const q = c.quantity + delta;
        return q > 0 ? { ...c, quantity: q } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((acc, c) => acc + (Number(c.price) * c.quantity), 0);

  // Service Actions
  const handleCallWaiter = async () => {
    if (isCallingWaiter) return;
    setIsCallingWaiter(true);

    try {
      const loc = tableNumber ? `Table ${tableNumber}` : 'QR Menu';
      await NotificationService.createNotification({
        tenantId: tenant.id,
        type: 'CALL_WAITER',
        title: `Waiter Service Needed - ${loc}`,
        message: `Customer at ${loc} has clicked Call Waiter. Please attend promptly.`
      });
      toast.success('Service Requested', 'A waiter has been called to your table.');
    } catch (e) {
      toast.error('Failed to notify staff', 'Please try calling staff directly.');
    } finally {
      setTimeout(() => setIsCallingWaiter(false), 8000);
    }
  };

  const handleRequestBill = async () => {
    if (isRequestingBill) return;
    setIsRequestingBill(true);

    try {
      const loc = tableNumber ? `Table ${tableNumber}` : 'QR Menu';
      await NotificationService.createNotification({
        tenantId: tenant.id,
        type: 'REQUEST_BILL',
        title: `Bill Requested - ${loc}`,
        message: `Customer at ${loc} requested their bill invoice.`
      });
      toast.success('Bill Requested', 'Staff notified. We will bring your bill shortly.');
    } catch (e) {
      toast.error('Failed to notify staff', 'Please request the bill directly.');
    } finally {
      setTimeout(() => setIsRequestingBill(false), 8000);
    }
  };

  // Submit Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      toast.error('Name Required', 'Please enter your name to complete the order.');
      return;
    }
    setIsPlacingOrder(true);

    try {
      // 1. Create order record
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          tenant_id: tenant.id,
          table_id: table?.id || null,
          customer_name: `${customerName.trim()} (QR${tableNumber ? ' Table ' + tableNumber : ''})`,
          status: 'PENDING',
          total_amount: cartTotal
        })
        .select('*')
        .single();

      if (orderErr || !orderData) throw orderErr;

      // 2. Create order items records
      const itemInserts = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: Number(item.price),
        price: Number(item.price) * item.quantity
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemInserts);

      if (itemsErr) throw itemsErr;

      // 3. Post Notification to restaurant staff
      const tableLabel = tableNumber ? `Table ${tableNumber}` : 'QR Mobile';
      await NotificationService.createNotification({
        tenantId: tenant.id,
        type: 'ORDER_PLACED',
        title: `New QR Order - ${tableLabel}`,
        message: `Customer ${customerName.trim()} placed self-order of ${cart.length} items (Total: ${tenant.currency_symbol || 'ETB'} ${cartTotal.toFixed(2)}).`
      });

      setOrderPlaced(orderData);
      setCart([]);
      setIsCartOpen(false);
      toast.success('Order Submitted', 'Your order was sent to the kitchen.');
    } catch (err: any) {
      toast.error('Order Failed', err.message || 'An error occurred while placing your order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.categoryId === selectedCategory)
    : products;

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6">
        <div className="my-auto flex flex-col items-center text-center max-w-sm mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Check size={44} className="stroke-[3]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#0B1630]">Order Received!</h2>
            <p className="text-sm text-slate-400 mt-2">Your order is being sent to the kitchen. Thank you for dining with us!</p>
          </div>

          <Card className="w-full p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white text-left space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Order Details</p>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Order Reference</span>
              <span className="text-[#0B1630] font-black">#{orderPlaced.id.slice(0, 8).toUpperCase()}</span>
            </div>
            {tableNumber && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Table Number</span>
                <span className="text-[#0B1630] font-black">Table {tableNumber}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Estimated Time</span>
              <span className="text-[#F97316] font-black">15 - 20 Mins</span>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-50 pt-2 font-bold text-sm">
              <span className="text-[#0B1630] font-black">Total Paid/Due</span>
              <span className="text-[#0B1630] font-black">{tenant.currency_symbol || 'ETB'} {Number(orderPlaced.total_amount).toFixed(2)}</span>
            </div>
          </Card>

          <button 
            onClick={() => setOrderPlaced(null)}
            className="w-full h-14 rounded-2xl bg-[#0B1630] text-white font-bold text-sm hover:bg-[#152549] transition-all cursor-pointer"
          >
            Order Something Else
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Powered by VALO-REST
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 relative flex flex-col">
      {/* Restaurant Header Banner */}
      <header className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <img 
            src={tenant.logo || 'https://ui-avatars.com/api/?name=VALO+REST&background=F97316&color=fff'} 
            alt="Logo" 
            className="w-10 h-10 object-cover rounded-xl border border-slate-100 shadow-sm"
          />
          <div>
            <h1 className="text-base font-black text-[#0B1630] leading-none">{tenant.name}</h1>
            {tableNumber && (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100/50 px-2 py-0.5 rounded uppercase tracking-wider mt-1.5 w-fit">
                Table {tableNumber}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleCallWaiter}
            disabled={isCallingWaiter}
            className="p-2.5 rounded-xl border border-slate-200 text-[#0B1630] hover:bg-slate-50 flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="Call Waiter"
          >
            <Bell size={18} />
          </button>
          <button 
            onClick={handleRequestBill}
            disabled={isRequestingBill}
            className="p-2.5 rounded-xl border border-slate-200 text-[#0B1630] hover:bg-slate-50 flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="Request Bill"
          >
            <Receipt size={18} />
          </button>
        </div>
      </header>

      {/* Main categories & products listing */}
      <div className="p-4 space-y-6 flex-1 max-w-lg mx-auto w-full">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-[#0B1630] to-[#152549] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10 space-y-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#F97316]">QR SELF-ORDERING</span>
            <h2 className="text-lg font-black leading-tight">Fast Service, Fresh Food</h2>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{welcomeMessage}</p>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer border",
              !selectedCategory 
                ? "bg-[#F97316] text-white border-[#F97316] shadow-md shadow-orange-500/10" 
                : "bg-white text-[#64748B] border-slate-100 hover:bg-slate-50"
            )}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer border",
                selectedCategory === cat.id
                  ? "bg-[#F97316] text-white border-[#F97316] shadow-md shadow-orange-500/10" 
                  : "bg-white text-[#64748B] border-slate-100 hover:bg-slate-50"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="p-4 border-none shadow-[0_2px_12px_rgba(0,0,0,0.03)] bg-white flex items-center justify-between gap-4 rounded-2xl"
            >
              <div className="space-y-1.5 min-w-0">
                <h4 className="text-sm font-bold text-[#0B1630] leading-snug">{product.name}</h4>
                {product.description && (
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2">{product.description}</p>
                )}
                <p className="text-sm font-black text-[#F97316] pt-0.5">{tenant.currency_symbol || 'ETB'} {Number(product.price).toFixed(2)}</p>
              </div>

              <button 
                onClick={() => addToCart(product)}
                className="w-10 h-10 bg-orange-50 text-[#F97316] hover:bg-[#F97316] hover:text-white rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 border border-orange-100/50 cursor-pointer"
              >
                <Plus size={18} />
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-6 z-40 max-w-md mx-auto">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#F97316] text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-between px-6 shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={18} />
              {cart.reduce((acc, c) => acc + c.quantity, 0)} Items
            </span>
            <span>View Cart {tenant.currency_symbol || 'ETB'} {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col max-w-md mx-auto w-full overflow-hidden shadow-2xl animate-slide-up">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-[#0B1630] flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#F97316]" /> Shopping Cart
              </h3>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-[#0B1630] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-50 pb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0B1630] truncate">{item.name}</p>
                    <p className="text-[10px] text-[#F97316] font-bold mt-0.5">{tenant.currency_symbol || 'ETB'} {Number(item.price).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1">
                    <button 
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="p-1 text-slate-500 hover:text-[#0B1630] cursor-pointer"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-black text-[#0B1630] min-w-[16px] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.id, 1)}
                      className="p-1 text-slate-500 hover:text-[#0B1630] cursor-pointer"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Delivery / Form details */}
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#0B1630] uppercase tracking-widest">Your Name</label>
                  <input 
                    type="text" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    placeholder="Enter your name"
                    className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#0B1630] uppercase tracking-widest">Special Instructions / Notes</label>
                  <textarea 
                    value={orderNote} 
                    onChange={(e) => setOrderNote(e.target.value)} 
                    placeholder="e.g. Allergy info, spicy level..."
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs focus:outline-none focus:border-[#F97316] resize-none"
                  />
                </div>

                {/* Payments options */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#0B1630] uppercase tracking-widest">Select Payment Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    {payAtCounter && (
                      <button
                        onClick={() => setPaymentMethod('COUNTER')}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all",
                          paymentMethod === 'COUNTER' 
                            ? "border-[#F97316] bg-orange-50/20 text-[#F97316]" 
                            : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        <Landmark size={18} />
                        <span className="text-[10px] font-bold">Pay at Counter</span>
                      </button>
                    )}
                    {onlinePayment && (
                      <button
                        onClick={() => setPaymentMethod('ONLINE')}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all",
                          paymentMethod === 'ONLINE' 
                            ? "border-[#F97316] bg-orange-50/20 text-[#F97316]" 
                            : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        <CreditCard size={18} />
                        <span className="text-[10px] font-bold">Pay Online</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Total / Submit Action */}
            <div className="p-6 bg-white border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-[#0B1630]">
                <span>Total Amount</span>
                <span className="text-lg font-black text-[#F97316]">{tenant.currency_symbol || 'ETB'} {cartTotal.toFixed(2)}</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cart.length === 0}
                className="w-full bg-[#F97316] text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isPlacingOrder ? 'Sending Order...' : 'Place Order'}
              </button>
            </div>

          </div>
        </div>
      )}

      {showScrollIndicator && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-40 bg-white/95 backdrop-blur-sm border border-slate-100/80 px-4.5 py-2.5 rounded-full shadow-lg pointer-events-none transition-all duration-300">
          <span className="text-[9px] font-black text-[#0B1630] uppercase tracking-widest whitespace-nowrap">Scroll to explore menu</span>
          <ChevronDown size={14} className="text-[#F97316] animate-bounce" />
        </div>
      )}
    </div>
  );
};
