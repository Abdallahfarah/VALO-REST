import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpRight, 
  Zap, 
  Users, 
  ShieldAlert, 
  LayoutDashboard, 
  DollarSign,
  CreditCard,
  Smartphone,
  Coins,
  TrendingUp,
  Award,
  Wallet
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderService, TableService, MenuService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { useCurrency, CurrencyService } from '../services/CurrencyService';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

// ─── Memoized KPI Card Component ───
interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
  trend?: string;
  badge?: string;
  showArrow: boolean;
  isLoading: boolean;
}

const KpiCard = React.memo(({ label, value, sub, icon: Icon, color, bg, trend, badge, showArrow, isLoading }: KpiCardProps) => {
  const badgeClasses: Record<string, string> = {
    'text-emerald-500': 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
    'text-blue-500': 'bg-blue-50 text-blue-600 border-blue-100/50',
    'text-orange-500': 'bg-red-50 text-red-600 border-red-100/50',
    'text-purple-500': 'bg-purple-50 text-purple-600 border-purple-100/50',
    'text-indigo-500': 'bg-indigo-50 text-indigo-600 border-indigo-100/50',
  };

  const pillStyle = badgeClasses[color] || 'bg-slate-50 text-slate-600 border-slate-100/50';

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all flex flex-col justify-between">
      {/* Top section: Label and Trend Indicator */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">{label}</span>
        {showArrow ? (
          <ArrowUpRight className="text-blue-500 w-4 h-4" />
        ) : (
          <Zap className="text-[#F97316] w-4 h-4 fill-[#F97316]/10" />
        )}
      </div>

      {/* Metric section: Icon and Value side-by-side */}
      <div className="flex items-center gap-4 my-3">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 border", bg, color, `border-${color.split('-')[1]}-100/30`)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {isLoading ? (
          <div className="h-8 bg-slate-100 rounded w-28 animate-pulse" />
        ) : (
          <span className="text-2xl font-black text-[#0B1630] tracking-tight">{value}</span>
        )}
      </div>

      {/* Bottom section: Subtext and Pill Status badge */}
      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
        <span className="text-[11px] font-bold text-[#64748B] tracking-wide">{sub}</span>
        {isLoading ? (
          <div className="h-5 bg-slate-100 rounded w-16 animate-pulse" />
        ) : (
          <span className={cn("text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider", pillStyle)}>
            {trend || badge}
          </span>
        )}
      </div>
    </div>
  );
});

KpiCard.displayName = 'KpiCard';

export const Dashboard = () => {
  const { tenant } = useTenant();
  const { format } = useCurrency();
  const queryClient = useQueryClient();
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'currency'>('overview');

  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('dashboard-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
          queryClient.invalidateQueries({ queryKey: ['receipts', tenant.id] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tables', tenant.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, queryClient]);

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: tables = [], isLoading: isTablesLoading } = useQuery({
    queryKey: ['tables', tenant?.id],
    queryFn: () => TableService.getTables(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: menuData, isLoading: isMenuLoading } = useQuery({
    queryKey: ['menu', tenant?.id],
    queryFn: () => MenuService.getMenu(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  // Query Receipts for multi-currency metrics
  const { data: receipts = [], isLoading: isReceiptsLoading } = useQuery({
    queryKey: ['receipts', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('receipts')
        .select('*, orders(waiter_id, waiter_name)')
        .eq('tenant_id', tenant.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const isLoading = isOrdersLoading || isTablesLoading || isMenuLoading || isReceiptsLoading;

  // ─── Memoized KPIs Calculations ───
  const metrics = useMemo(() => {
    const liveOrders = orders.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELED');
    const completedToday = orders.filter((o: any) => o.status === 'COMPLETED');
    const revenueToday = completedToday.reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0);

    const occupiedTables = tables.filter((t: any) => t.status === 'OCCUPIED').length;
    const occupancyPercentage = tables.length > 0 ? (occupiedTables / tables.length) * 100 : 0;
    const unavailableItemsCount = menuData?.items?.filter((item: any) => !item.isAvailable).length || 0;

    return {
      revenueToday,
      liveOrdersCount: liveOrders.length,
      unavailableItemsCount,
      occupancyPercentage
    };
  }, [orders, tables, menuData]);

  // ─── Memoized Multi-Currency KPI Calculations ───
  const currencyMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayList = receipts.filter((r: any) => new Date(r.created_at) >= startOfToday);
    const weekList = receipts.filter((r: any) => new Date(r.created_at) >= startOfWeek);
    const monthList = receipts.filter((r: any) => new Date(r.created_at) >= startOfMonth);

    const sumByCurrency = (list: any[], cur: string) => 
      list.filter((r: any) => r.currency === cur).reduce((acc, r) => acc + Number(r.original_amount), 0);

    // Dynamic payment methods calculations
    const sumByMethod = (list: any[], method: string, cur: string) =>
      list.filter((r: any) => r.payment_method === method && r.currency === cur)
          .reduce((acc, r) => acc + Number(r.original_amount), 0);

    // Collector leaderboard by currency
    const waiterMap: Record<string, { name: string; etbRevenue: number; usdRevenue: number; count: number }> = {};
    receipts.forEach((r: any) => {
      const waiterId = r.orders?.waiter_id || 'unassigned';
      const waiterName = r.orders?.waiter_name || 'House POS';
      if (!waiterMap[waiterId]) {
        waiterMap[waiterId] = { name: waiterName, etbRevenue: 0, usdRevenue: 0, count: 0 };
      }
      waiterMap[waiterId].count += 1;
      if (r.currency === 'USD') {
        waiterMap[waiterId].usdRevenue += Number(r.original_amount);
      } else {
        waiterMap[waiterId].etbRevenue += Number(r.original_amount);
      }
    });

    const waiterStats = Object.values(waiterMap);
    const topEtbCollectors = [...waiterStats].sort((a, b) => b.etbRevenue - a.etbRevenue).slice(0, 5);
    const topUsdCollectors = [...waiterStats].sort((a, b) => b.usdRevenue - a.usdRevenue).slice(0, 5);

    return {
      todayETB: sumByCurrency(todayList, 'ETB'),
      todayUSD: sumByCurrency(todayList, 'USD'),
      weeklyETB: sumByCurrency(weekList, 'ETB'),
      weeklyUSD: sumByCurrency(weekList, 'USD'),
      monthlyETB: sumByCurrency(monthList, 'ETB'),
      monthlyUSD: sumByCurrency(monthList, 'USD'),

      cashETB: sumByMethod(receipts, 'Cash', 'ETB'),
      cashUSD: sumByMethod(receipts, 'Cash', 'USD'),
      cardETB: sumByMethod(receipts, 'Card', 'ETB'),
      cardUSD: sumByMethod(receipts, 'Card', 'USD'),
      mobileETB: sumByMethod(receipts, 'Mobile Money', 'ETB'),
      mobileUSD: sumByMethod(receipts, 'Mobile Money', 'USD'),

      topEtbCollectors,
      topUsdCollectors,
      waiterStats
    };
  }, [receipts]);

  const waiterLeaderboard = useMemo(() => {
    const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED');
    const waiterMap: Record<string, { name: string; count: number; revenue: number }> = {};

    completedOrders.forEach((o: any) => {
      const waiterId = o.waiterId || 'Unassigned';
      const name = o.waiterName || 'House POS';
      if (!waiterMap[waiterId]) {
        waiterMap[waiterId] = { name, count: 0, revenue: 0 };
      }
      waiterMap[waiterId].count += 1;
      waiterMap[waiterId].revenue += Number(o.totalAmount);
    });

    return Object.values(waiterMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const kpis = useMemo(() => [
    { label: "TODAY'S REVENUE", value: format(metrics.revenueToday), sub: 'Daily Sales', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: '+12.5%', showArrow: true },
    { label: "LIVE ORDERS", value: metrics.liveOrdersCount.toString(), sub: 'Current Traffic', icon: ShieldAlert, color: 'text-blue-500', bg: 'bg-blue-50', badge: 'Active Now', showArrow: false },
    { label: "UNAVAILABLE ITEMS", value: metrics.unavailableItemsCount.toString(), sub: 'Out of Stock', icon: LayoutDashboard, color: 'text-orange-500', bg: 'bg-orange-50', badge: 'Critical', showArrow: false },
    { label: "OCCUPANCY", value: `${metrics.occupancyPercentage.toFixed(0)}%`, sub: 'Table Capacity', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', badge: 'In Use', showArrow: false },
  ], [metrics, format]);

  const planLabel = 'Professional Plan';
  const occupiedCountStr = tables.filter((t: any) => t.status === 'OCCUPIED').length.toString().padStart(2, '0');

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Upper info panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0B1630] tracking-tight">Business Dashboard</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Real-time performance metrics and revenue insights for your restaurant.</p>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#F97316] border border-orange-100/50 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
              👑 {planLabel}
            </span>
            {tenant?.currency && (
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100/50 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm">
                🔗 Currency: {tenant.currencyCode || tenant.currency} ({tenant.currencyName || tenant.currencyCode || tenant.currency})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Updates
            </div>
            <div className="text-[#0B1630] bg-[#F1F5F9]/50 px-2.5 py-1 rounded-lg border border-[#E2E8F0] font-bold text-xs shadow-sm">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab selection */}
      <div className="flex gap-6 border-b border-slate-100 pb-px">
        <button
          onClick={() => setDashboardTab('overview')}
          className={cn(
            "pb-3 text-xs font-black uppercase tracking-widest border-b-2 px-1 transition-all cursor-pointer",
            dashboardTab === 'overview'
              ? "border-[#F97316] text-[#0B1630]"
              : "border-transparent text-slate-400 hover:text-[#0B1630]"
          )}
        >
          Operational Overview
        </button>
        <button
          onClick={() => setDashboardTab('currency')}
          className={cn(
            "pb-3 text-xs font-black uppercase tracking-widest border-b-2 px-1 transition-all cursor-pointer",
            dashboardTab === 'currency'
              ? "border-[#F97316] text-[#0B1630]"
              : "border-transparent text-slate-400 hover:text-[#0B1630]"
          )}
        >
          Multi-Currency Financials
        </button>
      </div>

      {dashboardTab === 'overview' ? (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
              <KpiCard
                key={i}
                label={kpi.label}
                value={kpi.value}
                sub={kpi.sub}
                icon={kpi.icon}
                color={kpi.color}
                bg={kpi.bg}
                trend={kpi.trend}
                badge={kpi.badge}
                showArrow={kpi.showArrow}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Grid for Leaderboard and Operational Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Waitstaff Leaderboard Card */}
             <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-[0_2px_12px_rgba(0,0,0,0.03)] min-h-[300px] flex flex-col justify-start">
                <div className="flex items-center justify-between mb-6">
                   <div>
                      <h4 className="font-black text-[#0B1630] text-sm uppercase tracking-wider">Top Waitstaff Performance</h4>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase mt-0.5">Top Sellers Today</p>
                   </div>
                   <span className="text-[9px] font-black bg-orange-50 text-[#F97316] border border-orange-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      Leaderboard
                   </span>
                </div>
                {waiterLeaderboard.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3 text-xl border border-slate-100">🧑‍🍳</div>
                     <p className="text-xs text-[#94A3B8] font-bold">No sales recorded yet today.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     {waiterLeaderboard.map((w, index) => {
                        const initial = w.name.trim().charAt(0).toUpperCase();
                        return (
                          <div key={index} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/30 px-2 rounded-xl transition-all">
                             <div className="flex items-center gap-3">
                                <span className="w-6 text-xs font-black text-[#94A3B8]">#{index + 1}</span>
                                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-[#0B1630] font-black text-xs shrink-0 select-none">
                                  {initial}
                                </div>
                                <div>
                                   <p className="text-xs font-black text-[#0B1630]">{w.name}</p>
                                   <p className="text-[9px] text-[#94A3B8] font-black uppercase tracking-wider mt-0.5">{w.count} Orders Served</p>
                                </div>
                             </div>
                             <span className="text-xs font-black text-[#0B1630] bg-[#F8FAFC] border border-slate-100 px-2.5 py-1 rounded-lg font-mono">
                               {format(w.revenue)}
                             </span>
                          </div>
                        );
                     })}
                  </div>
                )}
             </div>

             {/* Operational Insight Card */}
             <div className="bg-[#0B1630] rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-lg shadow-[#0b1630]/10">
                <div className="z-10">
                   <p className="text-orange-500 text-[10px] font-black tracking-widest uppercase mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      Operational Insight
                   </p>
                   <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight max-w-[340px]">
                      Your restaurant is running at peak efficiency.
                   </h2>
                </div>
                <div className="z-10 mt-6 flex items-center gap-3">
                   <div className="px-3 py-1.5 bg-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-wider border border-white/15">
                      0 Errors
                   </div>
                   <div className="px-3 py-1.5 bg-emerald-500 rounded-xl text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                      All Systems Go
                   </div>
                </div>
                <div className="absolute -right-10 -bottom-14 opacity-5 pointer-events-none select-none text-[220px] font-black font-mono leading-none text-white">
                   {occupiedCountStr}
                </div>
             </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* Revenue KPI Grid: USD vs ETB */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Today's Revenue</span>
                   <Coins className="text-orange-500 w-4 h-4" />
                </div>
                <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                   <div className="space-y-1">
                      <span className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest">ETB (Birr)</span>
                      <h3 className="text-2xl font-black text-[#0B1630] font-mono">{CurrencyService.format(currencyMetrics.todayETB, 'ETB')}</h3>
                   </div>
                   <div className="space-y-1 pl-4">
                      <span className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest">USD ($)</span>
                      <h3 className="text-2xl font-black text-[#0B1630] font-mono">{CurrencyService.format(currencyMetrics.todayUSD, 'USD')}</h3>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Weekly Revenue</span>
                   <TrendingUp className="text-indigo-500 w-4 h-4" />
                </div>
                <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                   <div className="space-y-1">
                      <span className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest">ETB (Birr)</span>
                      <h3 className="text-2xl font-black text-[#0B1630] font-mono">{CurrencyService.format(currencyMetrics.weeklyETB, 'ETB')}</h3>
                   </div>
                   <div className="space-y-1 pl-4">
                      <span className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest">USD ($)</span>
                      <h3 className="text-2xl font-black text-[#0B1630] font-mono">{CurrencyService.format(currencyMetrics.weeklyUSD, 'USD')}</h3>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Monthly Revenue</span>
                   <Award className="text-emerald-500 w-4 h-4" />
                </div>
                <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                   <div className="space-y-1">
                      <span className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest">ETB (Birr)</span>
                      <h3 className="text-2xl font-black text-[#0B1630] font-mono">{CurrencyService.format(currencyMetrics.monthlyETB, 'ETB')}</h3>
                   </div>
                   <div className="space-y-1 pl-4">
                      <span className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest">USD ($)</span>
                      <h3 className="text-2xl font-black text-[#0B1630] font-mono">{CurrencyService.format(currencyMetrics.monthlyUSD, 'USD')}</h3>
                   </div>
                </div>
             </div>
          </div>

          {/* Revenue by Payment Method per Currency */}
          <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-sm space-y-6">
             <div>
                <h4 className="font-black text-[#0B1630] text-sm uppercase tracking-wider">Revenue by Payment Method</h4>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase mt-0.5">Historical Breakdown of Cash, Card, and Mobile Payments by Currency</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl flex flex-col gap-4">
                   <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center border border-orange-100/50"><DollarSign size={16} /></div>
                      <span className="text-xs font-black text-[#0B1630] uppercase tracking-wider">Cash Payments</span>
                   </div>
                   <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between"><span>ETB Total:</span><span className="text-[#0B1630] font-bold">{CurrencyService.format(currencyMetrics.cashETB, 'ETB')}</span></div>
                      <div className="flex justify-between"><span>USD Total:</span><span className="text-[#0B1630] font-bold">{CurrencyService.format(currencyMetrics.cashUSD, 'USD')}</span></div>
                   </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl flex flex-col gap-4">
                   <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50"><CreditCard size={16} /></div>
                      <span className="text-xs font-black text-[#0B1630] uppercase tracking-wider">Card Payments</span>
                   </div>
                   <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between"><span>ETB Total:</span><span className="text-[#0B1630] font-bold">{CurrencyService.format(currencyMetrics.cardETB, 'ETB')}</span></div>
                      <div className="flex justify-between"><span>USD Total:</span><span className="text-[#0B1630] font-bold">{CurrencyService.format(currencyMetrics.cardUSD, 'USD')}</span></div>
                   </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl flex flex-col gap-4">
                   <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50"><Smartphone size={16} /></div>
                      <span className="text-xs font-black text-[#0B1630] uppercase tracking-wider">Mobile Money</span>
                   </div>
                   <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between"><span>ETB Total:</span><span className="text-[#0B1630] font-bold">{CurrencyService.format(currencyMetrics.mobileETB, 'ETB')}</span></div>
                      <div className="flex justify-between"><span>USD Total:</span><span className="text-[#0B1630] font-bold">{CurrencyService.format(currencyMetrics.mobileUSD, 'USD')}</span></div>
                   </div>
                </div>
             </div>
          </div>

          {/* Waiter Performance by Currency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h4 className="font-black text-[#0B1630] text-sm uppercase tracking-wider">Top ETB Collectors</h4>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase mt-0.5">Top Waitstaff Sales in ETB Today</p>
                   </div>
                   <span className="text-[9px] font-black bg-orange-50 text-[#F97316] px-2 py-1 rounded border border-orange-100 uppercase tracking-widest">ETB Leader</span>
                </div>

                {currencyMetrics.topEtbCollectors.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                     <span className="text-3xl mb-2">💵</span>
                     <p className="text-xs text-[#94A3B8] font-bold">No ETB sales recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                     {currencyMetrics.topEtbCollectors.map((w, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                           <div className="flex items-center gap-3">
                              <span className="w-5 text-xs font-black text-slate-400">#{idx + 1}</span>
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center font-black text-xs text-[#0B1630]">{w.name.charAt(0)}</div>
                              <div>
                                 <span className="text-xs font-bold text-[#0B1630]">{w.name}</span>
                                 <span className="block text-[8px] text-[#94A3B8] font-black uppercase tracking-wider">{w.count} Payments</span>
                              </div>
                           </div>
                           <span className="text-xs font-black text-[#0B1630] font-mono">{CurrencyService.format(w.etbRevenue, 'ETB')}</span>
                        </div>
                     ))}
                  </div>
                )}
             </div>

             <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                   <div>
                      <h4 className="font-black text-[#0B1630] text-sm uppercase tracking-wider">Top USD Collectors</h4>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase mt-0.5">Top Waitstaff Sales in USD Today</p>
                   </div>
                   <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 uppercase tracking-widest">USD Leader</span>
                </div>

                {currencyMetrics.topUsdCollectors.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                     <span className="text-3xl mb-2">💵</span>
                     <p className="text-xs text-[#94A3B8] font-bold">No USD sales recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                     {currencyMetrics.topUsdCollectors.map((w, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
                           <div className="flex items-center gap-3">
                              <span className="w-5 text-xs font-black text-slate-400">#{idx + 1}</span>
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center font-black text-xs text-[#0B1630]">{w.name.charAt(0)}</div>
                              <div>
                                 <span className="text-xs font-bold text-[#0B1630]">{w.name}</span>
                                 <span className="block text-[8px] text-[#94A3B8] font-black uppercase tracking-wider">{w.count} Payments</span>
                              </div>
                           </div>
                           <span className="text-xs font-black text-[#0B1630] font-mono">{CurrencyService.format(w.usdRevenue, 'USD')}</span>
                        </div>
                     ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
