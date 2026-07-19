import { 
  TrendingUp, 
  FileText, 
  ChevronRight,
  Users,
  DollarSign,
  ShoppingCart,
  LayoutGrid,
  Calendar,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { OrderService, StaffService, ReceiptService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { useCurrency, CurrencyService } from '../services/CurrencyService';
import { useState, useMemo } from 'react';
import { SubscriptionService } from '../services/SubscriptionService';
import { UpgradeDialog } from '../components/UpgradeDialog';
import { toast } from '../lib/toast-store';

export const Reports = () => {
  const { tenant } = useTenant();
  const { currency, format } = useCurrency();
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);

  // ─── Queries ───
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: staff = [], isLoading: isStaffLoading } = useQuery({
    queryKey: ['staff', tenant?.id],
    queryFn: () => StaffService.getStaff(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: receipts = [], isLoading: isReceiptsLoading } = useQuery({
    queryKey: ['receipts', tenant?.id],
    queryFn: () => ReceiptService.getReceipts(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const isReportsLoading = isOrdersLoading || isStaffLoading || isReceiptsLoading;

  // ─── KPIs Calculations ───
  const completedToday = orders.filter((o: any) => o.status === 'COMPLETED');
  const revenueToday = completedToday.reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0);
  const avgOrderValue = completedToday.length > 0 ? revenueToday / completedToday.length : 0;

  const kpis = [
    { label: 'Revenue Today', value: format(revenueToday), sub: 'Operational Real-Time', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Orders Today', value: completedToday.length.toString(), sub: 'Operational Real-Time', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Average Order Value', value: format(avgOrderValue), sub: 'Operational Real-Time', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Active Staff', value: staff.length.toString(), sub: 'On shift now', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  // ─── Top Selling Items Calculations ───
  const itemMap: Record<string, { name: string, qty: number, revenue: number }> = {};
  completedToday.forEach((order: any) => {
    order.items?.forEach((item: any) => {
      const name = item.menuItem?.name || 'Unknown';
      if (!itemMap[name]) itemMap[name] = { name, qty: 0, revenue: 0 };
      itemMap[name].qty += item.quantity;
      itemMap[name].revenue += item.quantity * Number(item.price);
    });
  });
  const topItems = Object.values(itemMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ─── Category Performance Calculations ───
  const catMap: Record<string, { name: string, orders: number, revenue: number }> = {};
  completedToday.forEach((order: any) => {
    order.items?.forEach((item: any) => {
      const catName = item.menuItem?.category?.name || 'General';
      if (!catMap[catName]) catMap[catName] = { name: catName, orders: 0, revenue: 0 };
      catMap[catName].orders += 1;
      catMap[catName].revenue += item.quantity * Number(item.price);
    });
  });
  const categoryStats = Object.values(catMap).map(cat => ({
    ...cat,
    pct: revenueToday > 0 ? Math.round((cat.revenue / revenueToday) * 100) : 0
  }));

  const waiterPerformance = useMemo(() => {
    const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED');
    const waiterMap: Record<string, { name: string, count: number, revenue: number }> = {};
    completedOrders.forEach((o: any) => {
      const waiterId = o.waiterId || 'Unassigned';
      const name = o.waiterName || 'House POS';
      if (!waiterMap[waiterId]) waiterMap[waiterId] = { name, count: 0, revenue: 0 };
      waiterMap[waiterId].count += 1;
      waiterMap[waiterId].revenue += Number(o.totalAmount);
    });
    return Object.values(waiterMap).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  // ─── Dynamic Sales Trend Calculations (7 Days) ───
  const salesByDay: Record<string, number> = {};
  const dayLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    salesByDay[dateStr] = 0;
    dayLabels.push(dateStr);
  }

  receipts.forEach((r: any) => {
    const dateStr = new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (salesByDay[dateStr] !== undefined) {
      salesByDay[dateStr] += Number(r.totalAmount);
    }
  });

  const trendData = dayLabels.map(label => salesByDay[label] || 0);
  const trendMax = Math.max(...trendData, 1000);
  const trendPoints = dayLabels.map((day, index) => {
    const x = index * 16.6;
    const y = 35 - ((salesByDay[day] || 0) / trendMax) * 30; // Scaled to height of 40
    return { x, y, day, value: salesByDay[day] };
  });

  const pathD = trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // ─── Payment Methods Distribution ───
  let cashRevenue = 0;
  let cardRevenue = 0;
  let mobileRevenue = 0;
  let etbRevenue = 0;
  let usdRevenue = 0;

  receipts.forEach((r: any) => {
    const method = (r.paymentMethod || 'CASH').toUpperCase();
    const amt = Number(r.totalAmount);
    if (method === 'CASH') cashRevenue += amt;
    else if (method === 'CARD' || method === 'CREDIT_CARD') cardRevenue += amt;
    else mobileRevenue += amt; // Mobile, Mobile money, etc.

    const currency = (r.currency || 'ETB').toUpperCase();
    if (currency === 'USD') usdRevenue += amt;
    else etbRevenue += amt;
  });

  const totalRecRevenue = cashRevenue + cardRevenue + mobileRevenue;

  const pctCash = totalRecRevenue > 0 ? Math.round((cashRevenue / totalRecRevenue) * 100) : 0;
  const pctCard = totalRecRevenue > 0 ? Math.round((cardRevenue / totalRecRevenue) * 100) : 0;
  const pctMobile = totalRecRevenue > 0 ? Math.round((mobileRevenue / totalRecRevenue) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Reports</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Track your restaurant performance and grow your business.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
              <Calendar size={18} className="text-[#94A3B8]" />
              <div className="text-left">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider leading-none mb-1">Range</p>
                  <p className="text-sm font-bold text-[#0B1630] leading-none">Last 7 Days</p>
              </div>
              <ChevronDown size={14} className="text-[#94A3B8] ml-2" />
           </div>
           <button 
              onClick={() => {
                if (!SubscriptionService.isFeatureAllowed(tenant?.plan || 'PRO', 'advancedReports')) {
                  setUpgradeModalFeature('Export PDF Report');
                } else {
                  toast.success('Report Export', 'Generating PDF download...');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
               <FileText size={18} className="text-red-500" /> Export PDF
            </button>
            <button 
              onClick={() => {
                if (!SubscriptionService.isFeatureAllowed(tenant?.plan || 'PRO', 'advancedReports')) {
                  setUpgradeModalFeature('Export Excel Report');
                } else {
                  toast.success('Report Export', 'Generating Excel download...');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
               <LayoutGrid size={18} className="text-emerald-500" /> Export Excel
            </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4 bg-white">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>
              <kpi.icon size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5 truncate">{kpi.label}</p>
              {isReportsLoading ? (
                <div className="h-8 bg-slate-100 rounded w-20 animate-pulse mt-1" />
              ) : (
                <h3 className="text-2xl font-black text-[#0B1630] tracking-tight">{kpi.value}</h3>
              )}
              <div className="flex items-center gap-1.5 mt-1 truncate">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">{kpi.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] min-h-[400px] flex flex-col bg-white">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Sales Trend ({currency})</h3>
            <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Rolling 7-day period</div>
          </div>
          
          <div className="flex-1 relative flex items-end gap-2 px-10 pb-6 border-b border-l border-slate-100 min-h-[220px]">
             {/* Chart Bounds */}
             <div className="absolute left-0 bottom-0 text-[10px] font-bold text-[#94A3B8] -translate-x-full pr-2">0</div>
             <div className="absolute left-0 top-0 text-[10px] font-bold text-[#94A3B8] -translate-x-full pr-2">{(trendMax / 1000).toFixed(1)}k</div>
             
             {/* SVG Chart */}
             <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                 <path d="M0,35 L20,35 L40,35 L60,35 L80,35 L100,35" stroke="#F1F5F9" strokeWidth="0.5" fill="none" />
                 <path d={pathD} stroke="#F97316" strokeWidth="2" fill="none" strokeLinecap="round" />
                 
                 {trendPoints.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="2" fill="#F97316" className="cursor-pointer hover:r-3 transition-all" />
                      <title>{p.day}: {format(p.value)}</title>
                    </g>
                 ))}
             </svg>
             
             {/* Day Labels */}
             {trendPoints.map((p, idx) => (
                <div 
                  key={idx} 
                  className="absolute bottom-[-24px] text-[9px] font-bold text-[#94A3B8] -translate-x-1/2"
                  style={{ left: `${idx * 16.6 + 10}%` }}
                >
                  {p.day}
                </div>
             ))}
          </div>
          <div className="mt-12 flex items-center justify-center gap-6 shrink-0">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#F97316]" />
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Gross Transaction Value</span>
             </div>
          </div>
        </Card>

        {/* Payment Breakdown Pie Chart */}
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col bg-white">
           <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider mb-12">Payment Breakdown</h3>
           <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 rounded-full border-[16px] border-slate-50 flex items-center justify-center mb-8 shadow-sm">
                 <div className="text-center px-4">
                    <p className="text-2xl font-black text-[#0B1630] truncate max-w-[140px]">{format(totalRecRevenue)}</p>
                    <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Sales</p>
                 </div>
                 
                 {/* Visual pie ring segments based on percentages */}
                 <div 
                   className="absolute inset-[-16px] rounded-full border-[16px] border-transparent border-t-emerald-500 transition-all"
                   style={{ transform: `rotate(${pctCash * 3.6}deg)` }}
                 />
                 <div 
                   className="absolute inset-[-16px] rounded-full border-[16px] border-transparent border-r-blue-500 transition-all"
                   style={{ transform: `rotate(${(pctCash + pctCard) * 3.6}deg)` }}
                 />
              </div>
              
              <div className="w-full space-y-3 shrink-0">
                 {[
                   { label: 'Cash', val: format(cashRevenue), pct: `${pctCash}%`, color: 'bg-emerald-500' },
                   { label: 'Card', val: format(cardRevenue), pct: `${pctCard}%`, color: 'bg-blue-500' },
                   { label: 'Mobile Money', val: format(mobileRevenue), pct: `${pctMobile}%`, color: 'bg-orange-500' }
                 ].map((p, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className={cn("w-2 h-2 rounded-full", p.color)} />
                         <span className="text-xs text-[#64748B] font-medium">{p.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-xs font-bold text-[#0B1630]">{p.val}</span>
                         <span className="text-[10px] font-bold text-[#94A3B8] w-8 text-right">{p.pct}</span>
                      </div>
                   </div>
                 ))}
                 
                 {/* Currency Split */}
                 <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs">
                       <span className="text-[#64748B] font-bold">ETB REVENUE</span>
                       <span className="font-extrabold text-[#0B1630]">{CurrencyService.format(etbRevenue, 'ETB')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="text-[#64748B] font-bold">USD REVENUE</span>
                       <span className="font-extrabold text-[#0B1630]">{CurrencyService.format(usdRevenue, 'USD')}</span>
                    </div>
                 </div>
              </div>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Top Selling Items */}
         <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden bg-white">
            <div className="p-6 pb-4 border-b border-slate-50">
               <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Top Selling Items</h3>
            </div>
            <table className="w-full border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-6 py-2 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">#</th>
                     <th className="px-6 py-2 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Item Name</th>
                     <th className="px-6 py-2 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Quantity Sold</th>
                     <th className="px-6 py-2 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Revenue</th>
                    </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                    {topItems.map((item, i) => (
                       <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">{i + 1}</td>
                          <td className="px-6 py-4 flex items-center gap-3">
                             <span className="text-xl">🍽️</span>
                             <span className="text-xs font-bold text-[#0B1630]">{item.name}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-[#0B1630]">{item.qty}</td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-[#0B1630]">{format(item.revenue)}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
              <div className="p-4 border-t border-slate-50 text-center">
                 <button className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest flex items-center gap-1 mx-auto hover:gap-2 transition-all cursor-pointer">
                    View All Items <ChevronRight size={12} />
                 </button>
              </div>
           </Card>

           {/* Category Performance */}
           <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden bg-white relative">
              {!SubscriptionService.isFeatureAllowed(tenant?.plan || 'PRO', 'advancedReports') && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                    <ShieldAlert size={20} />
                  </div>
                  <h4 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Detailed Category Performance</h4>
                  <p className="text-xs text-[#64748B] max-w-xs mt-1 mb-4 leading-relaxed">Unlock advanced reporting metrics and payment analytics by upgrading your plan.</p>
                  <button 
                    type="button"
                    onClick={() => setUpgradeModalFeature('Category Performance Reports')}
                    className="bg-[#0B1630] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Request Upgrade
                  </button>
                </div>
              )}
              <div className="p-6 pb-4 border-b border-slate-50">
                 <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Category Performance</h3>
              </div>
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-6 py-2 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Category</th>
                       <th className="px-6 py-2 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Orders</th>
                       <th className="px-6 py-2 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Revenue</th>
                       <th className="px-6 py-2 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">% of Revenue</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {categoryStats.map((cat, i) => (
                       <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                             <span className="text-xl">📁</span>
                             <span className="text-xs font-bold text-[#0B1630]">{cat.name}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-[#0B1630]">{cat.orders}</td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-[#0B1630]">{format(cat.revenue)}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-3 min-w-[120px]">
                                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cat.pct}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-[#0B1630] shrink-0">{cat.pct}.0%</span>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
             <div className="p-4 border-t border-slate-50 text-center">
                <button className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest flex items-center gap-1 mx-auto hover:gap-2 transition-all cursor-pointer">
                   View All Categories <ChevronRight size={12} />
                </button>
             </div>
          </Card>
       </div>

       {/* Waitstaff Performance Leaderboard */}
       <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden bg-white mt-6">
          <div className="p-6 pb-4 border-b border-slate-50 flex items-center justify-between">
             <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Waitstaff Performance</h3>
             <span className="text-[10px] font-black text-indigo-500 uppercase">Daily Leaderboard</span>
          </div>
          <table className="w-full border-collapse">
             <thead>
                <tr className="bg-slate-50/50">
                   <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Rank</th>
                   <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Waiter Name</th>
                   <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Orders Served</th>
                   <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Sales</th>
                   <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Avg Order Size</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {waiterPerformance.map((w, i) => (
                   <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">#{i + 1}</td>
                      <td className="px-6 py-4 flex items-center gap-3">
                         <span className="text-xl">🧑‍🍳</span>
                         <span className="text-xs font-bold text-[#0B1630]">{w.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-[#0B1630]">{w.count}</td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-[#0B1630]">{format(w.revenue)}</td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-[#0B1630]">{format(w.revenue / (w.count || 1))}</td>
                   </tr>
                ))}
                {waiterPerformance.length === 0 && (
                   <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#94A3B8]">No sales records yet today.</td>
                   </tr>
                )}
             </tbody>
          </table>
       </Card>
       {upgradeModalFeature && (
        <UpgradeDialog 
          feature={upgradeModalFeature}
          requiredPlan="Professional"
          onClose={() => setUpgradeModalFeature(null)}
        />
      )}
    </div>
  );
};
