import { 
  TrendingUp, 
  FileText, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Calendar, 
  ChevronDown, 
  Coins, 
  CreditCard, 
  Smartphone, 
  ShieldCheck
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
  const { format } = useCurrency();
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  
  // Currency filter state
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<'ALL' | 'ETB' | 'USD'>('ALL');

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

  const { data: receiptsData = [], isLoading: isReceiptsLoading } = useQuery({
    queryKey: ['receipts', tenant?.id],
    queryFn: () => ReceiptService.getReceipts(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const receipts = receiptsData as any[];
  const isReportsLoading = isOrdersLoading || isStaffLoading || isReceiptsLoading;

  // ─── KPIs Calculations ───
  const completedToday = useMemo(() => {
    return orders.filter((o: any) => {
      if (o.status !== 'COMPLETED') return false;
      const dateStr = new Date(o.createdAt).toDateString();
      const todayStr = new Date().toDateString();
      if (dateStr !== todayStr) return false;

      // Filter by selected currency
      if (selectedCurrencyFilter !== 'ALL') {
         const receipt = receipts.find((r: any) => r.order_id === o.id);
         return receipt && receipt.currency === selectedCurrencyFilter;
      }
      return true;
    });
  }, [orders, receipts, selectedCurrencyFilter]);

  const revenueTodayMetrics = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayReceipts = receipts.filter((r: any) => new Date(r.created_at).toDateString() === todayStr);

    const etbRevenue = todayReceipts.filter((r: any) => r.currency === 'ETB' || !r.currency).reduce((acc: number, r: any) => acc + Number(r.original_amount), 0);
    const usdRevenue = todayReceipts.filter((r: any) => r.currency === 'USD').reduce((acc: number, r: any) => acc + Number(r.original_amount), 0);

    const etbCount = todayReceipts.filter((r: any) => r.currency === 'ETB' || !r.currency).length;
    const usdCount = todayReceipts.filter((r: any) => r.currency === 'USD').length;

    const avgEtb = etbCount > 0 ? etbRevenue / etbCount : 0;
    const avgUsd = usdCount > 0 ? usdRevenue / usdCount : 0;

    return {
      etbRevenue,
      usdRevenue,
      avgEtb,
      avgUsd,
      count: todayReceipts.length
    };
  }, [receipts]);

  const formatMultiValue = (etbVal: number, usdVal: number) => {
     if (selectedCurrencyFilter === 'ETB') return CurrencyService.format(etbVal, 'ETB');
     if (selectedCurrencyFilter === 'USD') return CurrencyService.format(usdVal, 'USD');
     return `ETB ${etbVal.toFixed(2)} / $${usdVal.toFixed(2)}`;
  };

  const kpis = [
    { label: 'Revenue Today', value: formatMultiValue(revenueTodayMetrics.etbRevenue, revenueTodayMetrics.usdRevenue), sub: 'Separated by currency', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Orders Today', value: revenueTodayMetrics.count.toString(), sub: 'Transactions today', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Average Order Value', value: formatMultiValue(revenueTodayMetrics.avgEtb, revenueTodayMetrics.avgUsd), sub: 'Per transaction average', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Active Staff', value: staff.length.toString(), sub: 'On shift now', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  // Waitstaff & Cashier Collections
  const employeePerformance = useMemo(() => {
    const employeeMap: Record<string, { name: string, role: string, orders: number, etbRevenue: number, usdRevenue: number }> = {};

    receipts.forEach((r: any) => {
      const waiterId = r.orders?.waiter_id || 'unassigned';
      const waiterName = r.orders?.waiter_name || 'House POS';
      
      if (waiterId) {
        if (!employeeMap[waiterId]) {
          employeeMap[waiterId] = { name: waiterName, role: 'Waiter', orders: 0, etbRevenue: 0, usdRevenue: 0 };
        }
        employeeMap[waiterId].orders += 1;
        if (r.currency === 'USD') {
          employeeMap[waiterId].usdRevenue += Number(r.original_amount);
        } else {
          employeeMap[waiterId].etbRevenue += Number(r.original_amount);
        }
      }

      const cashierId = r.cashier_id;
      if (cashierId) {
         const cashierName = staff.find((s: any) => s.id === cashierId)?.name || 'Cashier';
         if (!employeeMap[cashierId]) {
           employeeMap[cashierId] = { name: cashierName, role: 'Cashier', orders: 0, etbRevenue: 0, usdRevenue: 0 };
         }
         employeeMap[cashierId].orders += 1;
         if (r.currency === 'USD') {
           employeeMap[cashierId].usdRevenue += Number(r.original_amount);
         } else {
           employeeMap[cashierId].etbRevenue += Number(r.original_amount);
         }
      }
    });

    const list = Object.values(employeeMap);

    return {
       waiters: list.filter(e => e.role === 'Waiter').sort((a,b) => (b.etbRevenue + b.usdRevenue * 120) - (a.etbRevenue + a.usdRevenue * 120)),
       cashiers: list.filter(e => e.role === 'Cashier').sort((a,b) => (b.etbRevenue + b.usdRevenue * 120) - (a.etbRevenue + a.usdRevenue * 120))
    };
  }, [receipts, staff]);

  // ─── Dynamic Sales Trend Calculations (7 Days) ───
  const trendPoints = useMemo(() => {
    const salesByDayETB: Record<string, number> = {};
    const salesByDayUSD: Record<string, number> = {};
    const dayLabels: string[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      salesByDayETB[dateStr] = 0;
      salesByDayUSD[dateStr] = 0;
      dayLabels.push(dateStr);
    }

    receipts.forEach((r: any) => {
      const dateStr = new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (salesByDayETB[dateStr] !== undefined) {
        if (r.currency === 'USD') {
          salesByDayUSD[dateStr] += Number(r.original_amount);
        } else {
          salesByDayETB[dateStr] += Number(r.original_amount);
        }
      }
    });

    const etbData = dayLabels.map(label => salesByDayETB[label] || 0);
    const usdData = dayLabels.map(label => salesByDayUSD[label] || 0);
    const maxVal = Math.max(...etbData, ...usdData.map(v => v * 120.0), 1000);

    const etbPoints = dayLabels.map((day, idx) => ({
       x: idx * 16.6,
       y: 35 - ((salesByDayETB[day] || 0) / maxVal) * 30,
       day,
       value: salesByDayETB[day]
    }));

    const usdPoints = dayLabels.map((day, idx) => ({
       x: idx * 16.6,
       y: 35 - (((salesByDayUSD[day] || 0) * 120.0) / maxVal) * 30,
       day,
       value: salesByDayUSD[day]
    }));

    return {
       dayLabels,
       etbPoints,
       usdPoints,
       maxVal
    };
  }, [receipts]);

  const pathDETB = trendPoints.etbPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const pathDUSD = trendPoints.usdPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // ─── Payment Methods Distribution ───
  const paymentBreakdown = useMemo(() => {
    let cashETB = 0;
    let cashUSD = 0;
    let cardETB = 0;
    let cardUSD = 0;
    let mobileETB = 0;
    let mobileUSD = 0;

    receipts.forEach((r: any) => {
      const method = (r.payment_method || 'Cash');
      const amt = Number(r.original_amount);
      const isUSD = r.currency === 'USD';

      if (method === 'Cash') {
         if (isUSD) cashUSD += amt; else cashETB += amt;
      } else if (method === 'Card') {
         if (isUSD) cardUSD += amt; else cardETB += amt;
      } else {
         if (isUSD) mobileUSD += amt; else mobileETB += amt;
      }
    });

    const totalETB = cashETB + cardETB + mobileETB;
    const totalUSD = cashUSD + cardUSD + mobileUSD;

    return {
       cashETB,
       cashUSD,
       cardETB,
       cardUSD,
       mobileETB,
       mobileUSD,
       totalETB,
       totalUSD
    };
  }, [receipts]);

  // Refund Report & Payment Audit List
  const auditReport = useMemo(() => {
     return receipts.map((r: any) => ({
        receiptNumber: r.receipt_number,
        date: new Date(r.created_at).toLocaleDateString() + ' ' + new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waiterName: r.orders?.waiter_name || 'House POS',
        method: r.payment_method,
        currency: r.currency || 'ETB',
        originalAmount: r.original_amount,
        baseAmount: r.base_amount
     })).slice(0, 8);
  }, [receipts]);

  const refundReport = useMemo(() => {
     // Canceled orders with potential simulated refund values
     const canceled = orders.filter((o: any) => o.status === 'CANCELED');
     return canceled.map((o: any) => ({
        orderId: o.id.slice(0, 8),
        date: new Date(o.createdAt).toLocaleDateString(),
        waiterName: o.waiterName || 'Unassigned',
        reason: 'Order Canceled Before Serving',
        amount: Number(o.totalAmount)
     })).slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0B1630] tracking-tight">Financial Reports</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Track your restaurant revenue and grow your business.</p>
        </div>
        <div className="flex items-center gap-3">
           {/* Currency Selector Filter */}
           <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
              <Coins size={16} className="text-[#94A3B8]" />
              <div className="text-left">
                  <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider leading-none mb-1">Currency Filter</p>
                  <select
                    value={selectedCurrencyFilter}
                    onChange={(e: any) => setSelectedCurrencyFilter(e.target.value)}
                    className="text-xs font-black text-[#0B1630] bg-transparent outline-none cursor-pointer"
                  >
                    <option value="ALL">All Currencies</option>
                    <option value="ETB">ETB (Birr)</option>
                    <option value="USD">USD ($)</option>
                  </select>
              </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
              <Calendar size={16} className="text-[#94A3B8]" />
              <div className="text-left">
                  <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider leading-none mb-1">Range</p>
                  <p className="text-xs font-bold text-[#0B1630] leading-none">Last 7 Days</p>
              </div>
              <ChevronDown size={12} className="text-[#94A3B8] ml-2" />
           </div>

           <button 
              onClick={() => {
                if (!SubscriptionService.isFeatureAllowed(tenant?.plan || 'PRO', 'advancedReports')) {
                  setUpgradeModalFeature('Export PDF Report');
                } else {
                  toast.success('Report Export', 'Generating PDF download...');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-[#0B1630] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
               <FileText size={16} className="text-red-500" /> Export PDF
            </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-6 border border-[#E5E7EB] shadow-sm flex items-center gap-4 bg-white rounded-3xl">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border", kpi.bg, kpi.color, `border-${kpi.color.split('-')[1]}-100/30`)}>
              <kpi.icon size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider mb-1 truncate">{kpi.label}</p>
              {isReportsLoading ? (
                <div className="h-8 bg-slate-100 rounded w-20 animate-pulse mt-1" />
              ) : (
                <h3 className="text-xl font-black text-[#0B1630] tracking-tight">{kpi.value}</h3>
              )}
              <div className="flex items-center gap-1.5 mt-1 truncate">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">{kpi.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 p-8 border border-[#E5E7EB] shadow-sm min-h-[400px] flex flex-col bg-white rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="font-black text-[#0B1630] text-sm uppercase tracking-wider">Sales Trend by Currency</h3>
               <p className="text-[10px] text-[#94A3B8] font-bold uppercase mt-0.5">Rolling 7-day transactions comparison</p>
            </div>
            <div className="text-[9px] font-black bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg uppercase tracking-wider">
               Weekly Chart
            </div>
          </div>
          
          <div className="flex-1 relative flex items-end gap-2 px-10 pb-6 border-b border-l border-slate-100 min-h-[220px]">
             {/* Chart Bounds */}
             <div className="absolute left-0 bottom-0 text-[9px] font-black text-[#94A3B8] -translate-x-full pr-2">0</div>
             <div className="absolute left-0 top-0 text-[9px] font-black text-[#94A3B8] -translate-x-full pr-2">{(trendPoints.maxVal / 1000).toFixed(1)}k</div>
             
             {/* SVG Chart */}
             <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0,35 L20,35 L40,35 L60,35 L80,35 L100,35" stroke="#F1F5F9" strokeWidth="0.5" fill="none" />
                  
                  {/* ETB Curve */}
                  {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'ETB') && (
                     <path d={pathDETB} stroke="#F97316" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  )}

                  {/* USD Curve */}
                  {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'USD') && (
                     <path d={pathDUSD} stroke="#6366F1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  )}
             </svg>
             
             {/* Day Labels */}
             {trendPoints.etbPoints.map((p, idx) => (
                <div 
                  key={idx} 
                  className="absolute bottom-[-24px] text-[9px] font-black text-[#94A3B8] -translate-x-1/2"
                  style={{ left: `${idx * 16.6 + 10}%` }}
                >
                  {p.day}
                </div>
             ))}
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 shrink-0">
             {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'ETB') && (
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                   <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">ETB Sales Trend</span>
                </div>
             )}
             {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'USD') && (
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                   <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">USD Sales Trend</span>
                </div>
             )}
          </div>
        </Card>

        {/* Payment Breakdown Pie Card */}
        <Card className="p-8 border border-[#E5E7EB] shadow-sm flex flex-col bg-white rounded-3xl">
           <h3 className="font-black text-[#0B1630] text-sm uppercase tracking-wider mb-6">Payment Method breakdown</h3>
           <div className="flex-1 flex flex-col justify-center gap-6">
              {[
                { label: 'Cash', etb: paymentBreakdown.cashETB, usd: paymentBreakdown.cashUSD, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Card', etb: paymentBreakdown.cardETB, usd: paymentBreakdown.cardUSD, icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Mobile Money', etb: paymentBreakdown.mobileETB, usd: paymentBreakdown.mobileUSD, icon: Smartphone, color: 'text-orange-500', bg: 'bg-orange-50' }
              ].map((p, i) => (
                 <div key={i} className="flex gap-4 items-center bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", p.bg, p.color, `border-${p.color.split('-')[1]}-100/30`)}>
                       <p.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0 font-mono text-[11px] space-y-1">
                       <span className="block text-xs font-black text-[#0B1630] font-sans">{p.label} Collections</span>
                       {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'ETB') && (
                          <div className="flex justify-between">
                             <span className="text-slate-400">ETB Total:</span>
                             <span className="text-[#0B1630] font-bold">{CurrencyService.format(p.etb, 'ETB')}</span>
                          </div>
                       )}
                       {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'USD') && (
                          <div className="flex justify-between">
                             <span className="text-slate-400">USD Total:</span>
                             <span className="text-[#0B1630] font-bold">{CurrencyService.format(p.usd, 'USD')}</span>
                          </div>
                       )}
                    </div>
                 </div>
              ))}
           </div>
        </Card>
      </div>

      {/* Waitstaff & Cashier Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border border-[#E5E7EB] shadow-sm overflow-hidden bg-white rounded-3xl">
            <div className="p-6 pb-4 border-b border-slate-50">
               <h3 className="font-black text-[#0B1630] text-sm uppercase tracking-wider">Waiter Collections Statistics</h3>
            </div>
            <table className="w-full border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Waiter</th>
                     <th className="px-6 py-3 text-center text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Transactions</th>
                     {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'ETB') && (
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">ETB Total</th>
                     )}
                     {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'USD') && (
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">USD Total</th>
                     )}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 font-mono text-xs">
                  {employeePerformance.waiters.map((w, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3 font-sans font-bold text-[#0B1630]">
                           <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">🧑‍🍳</span>
                           <span>{w.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 font-bold">{w.orders}</td>
                        {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'ETB') && (
                           <td className="px-6 py-4 text-right text-[#0B1630] font-black">{CurrencyService.format(w.etbRevenue, 'ETB')}</td>
                        )}
                        {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'USD') && (
                           <td className="px-6 py-4 text-right text-indigo-600 font-black">{CurrencyService.format(w.usdRevenue, 'USD')}</td>
                        )}
                     </tr>
                  ))}
               </tbody>
            </table>
         </Card>

         <Card className="border border-[#E5E7EB] shadow-sm overflow-hidden bg-white rounded-3xl">
            <div className="p-6 pb-4 border-b border-slate-50">
               <h3 className="font-black text-[#0B1630] text-sm uppercase tracking-wider">Cashier Collections Audit</h3>
            </div>
            <table className="w-full border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Cashier</th>
                     <th className="px-6 py-3 text-center text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Settled</th>
                     {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'ETB') && (
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">ETB Total</th>
                     )}
                     {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'USD') && (
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">USD Total</th>
                     )}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 font-mono text-xs">
                  {employeePerformance.cashiers.map((c, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3 font-sans font-bold text-[#0B1630]">
                           <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">💳</span>
                           <span>{c.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 font-bold">{c.orders}</td>
                        {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'ETB') && (
                           <td className="px-6 py-4 text-right text-[#0B1630] font-black">{CurrencyService.format(c.etbRevenue, 'ETB')}</td>
                        )}
                        {(selectedCurrencyFilter === 'ALL' || selectedCurrencyFilter === 'USD') && (
                           <td className="px-6 py-4 text-right text-indigo-600 font-black">{CurrencyService.format(c.usdRevenue, 'USD')}</td>
                        )}
                     </tr>
                  ))}
               </tbody>
            </table>
         </Card>
      </div>

      {/* Payment Audit Report & Refunds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Payment Audit Report */}
         <Card className="lg:col-span-2 border border-[#E5E7EB] shadow-sm overflow-hidden bg-white rounded-3xl">
            <div className="p-6 pb-4 border-b border-slate-50 flex items-center justify-between">
               <h3 className="font-black text-[#0B1630] text-sm uppercase tracking-wider">Payment Audit Log</h3>
               <span className="text-[8px] font-black bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"><ShieldCheck size={10} /> Audited</span>
            </div>
            <table className="w-full border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Receipt No</th>
                     <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Date & Time</th>
                     <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Waiter</th>
                     <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Method</th>
                     <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Paid Amount</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 text-xs">
                  {auditReport.filter(r => selectedCurrencyFilter === 'ALL' || r.currency === selectedCurrencyFilter).map((log, i) => (
                     <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-black text-[#4F46E5]">{log.receiptNumber}</td>
                        <td className="px-6 py-4 font-medium text-slate-500">{log.date}</td>
                        <td className="px-6 py-4 font-bold text-[#0B1630]">{log.waiterName}</td>
                        <td className="px-6 py-4 font-medium text-slate-500">{log.method}</td>
                        <td className="px-6 py-4 text-right font-black text-[#0B1630] font-mono">{CurrencyService.format(Number(log.originalAmount), log.currency)}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </Card>

         {/* Refund Report */}
         <Card className="border border-[#E5E7EB] shadow-sm overflow-hidden bg-white rounded-3xl">
            <div className="p-6 pb-4 border-b border-slate-50">
               <h3 className="font-black text-[#0B1630] text-sm uppercase tracking-wider">Refund & Cancellation Audit</h3>
            </div>
            <table className="w-full border-collapse">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Order ID</th>
                     <th className="px-6 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Details</th>
                     <th className="px-6 py-3 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Amount</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 text-xs">
                  {refundReport.map((ref, i) => (
                     <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-black text-red-500">#{ref.orderId}</td>
                        <td className="px-6 py-4">
                           <span className="font-bold text-[#0B1630] block">{ref.waiterName}</span>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{ref.reason}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-red-600 font-mono">{format(ref.amount)}</td>
                     </tr>
                  ))}
                  {refundReport.length === 0 && (
                     <tr>
                        <td colSpan={3} className="py-8 text-center text-xs text-[#94A3B8] font-bold italic">No refunds or cancellations logged.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </Card>
      </div>

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
export default Reports;
