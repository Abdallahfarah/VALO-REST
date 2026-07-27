import { useState } from 'react';
import { 
  TrendingUp, 
  Store, 
  Download, 
  FileSpreadsheet, 
  Receipt,
  Search,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Award,
  UserCheck,
  Coffee,
  ChefHat,
  ShoppingBag
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { SuperAdminService } from '../../services/ApiService';
import { exportToPdf, exportToExcel, exportToCsv } from '../../lib/export-utils';
import { toast } from '../../lib/toast-store';

type DateRangeFilter = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';
type LeaderboardTab = 'TOP_REVENUE' | 'TOP_ORDERS' | 'NEWEST' | 'LOWEST';

export const PlatformReports = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<LeaderboardTab>('TOP_REVENUE');

  // 1. Query Tenants List for Dropdown Filter
  const { data: tenants } = useQuery({
    queryKey: ['superadmin-tenants-list'],
    queryFn: () => SuperAdminService.getTenantsList(),
  });

  // 2. Query Live Platform Analytics Aggregation
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['superadmin-platform-analytics', selectedTenantId, dateRange, customStartDate, customEndDate],
    queryFn: () => SuperAdminService.getPlatformAnalytics({ 
      tenantId: selectedTenantId, 
      dateRange, 
      startDate: dateRange === 'CUSTOM' ? customStartDate : undefined, 
      endDate: dateRange === 'CUSTOM' ? customEndDate : undefined 
    }),
    refetchInterval: 10000,
  });

  const summary = analytics?.summary || {
    totalRestaurants: 0,
    activeRestaurants: 0,
    inactiveRestaurants: 0,
    trialRestaurants: 0,
    totalOrders: 0,
    ordersToday: 0,
    ordersThisMonth: 0,
    totalRevenue: 0,
    revenueToday: 0,
    revenueThisMonth: 0,
    platformShareCut: 0,
    avgOrderValue: 0,
    totalUsers: 0,
    totalAdmins: 0,
    totalWaiters: 0,
    totalCashiers: 0,
    totalKitchenStaff: 0,
    totalBaristas: 0,
  };

  const leaderboards = analytics?.leaderboards || {
    topByRevenue: [],
    topByOrders: [],
    lowestActivity: [],
    newestRestaurants: [],
  };

  const charts = analytics?.charts || {
    revenueOverTime: [],
    ordersOverTime: [],
    restaurantGrowth: [],
    roleDistribution: [],
  };

  const transactions = analytics?.transactions || [];

  // Filter transactions by search query
  const filteredTransactions = transactions.filter((r: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.receiptNumber.toLowerCase().includes(query) ||
      r.restaurantName.toLowerCase().includes(query) ||
      r.orderNumber.toLowerCase().includes(query) ||
      r.customerName.toLowerCase().includes(query) ||
      r.cashierName.toLowerCase().includes(query)
    );
  });

  // Get active leaderboard entries
  const getActiveLeaderboard = () => {
    switch (activeLeaderboardTab) {
      case 'TOP_REVENUE':
        return leaderboards.topByRevenue;
      case 'TOP_ORDERS':
        return leaderboards.topByOrders;
      case 'NEWEST':
        return leaderboards.newestRestaurants;
      case 'LOWEST':
        return leaderboards.lowestActivity;
      default:
        return leaderboards.topByRevenue;
    }
  };

  const activeLeaderboard = getActiveLeaderboard();

  // Export handlers
  const handleExport = (formatType: 'PDF' | 'EXCEL' | 'CSV') => {
    try {
      toast.success('Generating Export', `Exporting platform report records as ${formatType}...`);

      const activeTenantName = tenants?.find((t: any) => t.id === selectedTenantId)?.name || 'All Restaurants';
      const headers = ['Time', 'Restaurant Node', 'Receipt No.', 'Order No.', 'Table', 'Customer', 'Cashier', 'Method', 'Amount (ETB)', 'Status'];
      
      const rows = filteredTransactions.map((r: any) => [
        new Date(r.createdAt).toLocaleString(),
        r.restaurantName,
        r.receiptNumber,
        r.orderNumber,
        r.tableNumber,
        r.customerName,
        r.cashierName,
        r.paymentMethod,
        r.totalAmount.toFixed(2),
        r.status
      ]);

      const options = {
        title: 'Platform-Wide Financial Audit Report',
        subtitle: `Aggregated SaaS Telemetry | Filter: ${activeTenantName}`,
        restaurantName: 'DHADHAN HUB SAAS HQ',
        dateRange: dateRange,
        headers,
        rows,
        summaryMetrics: [
          { label: 'Gross GMV Volume', value: `ETB ${summary.totalRevenue.toFixed(2)}` },
          { label: 'Platform Share (15%)', value: `ETB ${summary.platformShareCut.toFixed(2)}` },
          { label: 'Total Orders', value: summary.totalOrders },
          { label: 'Avg Order Value', value: `ETB ${summary.avgOrderValue.toFixed(2)}` },
        ],
        filename: `platform_report_${selectedTenantId.slice(0, 8)}_${dateRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`
      };

      if (formatType === 'PDF') {
        exportToPdf(options);
      } else if (formatType === 'EXCEL') {
        exportToExcel(options);
      } else if (formatType === 'CSV') {
        exportToCsv(options);
      }
    } catch (err: any) {
      console.error('[PlatformReports] Export failed:', err);
      toast.error('Export Failed', err.message || 'Could not export platform report.');
    }
  };

  // Helper for max values in charts
  const maxRevenue = Math.max(...charts.revenueOverTime.map(c => c.amount), 1);
  const maxOrders = Math.max(...charts.ordersOverTime.map(c => c.count), 1);

  return (
    <div className="space-y-8 max-w-[1600px] pb-12">
      {/* Page Header & Global Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Platform Reports & Analytics</h1>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <p className="text-[#94A3B8] mt-1 text-sm font-medium">Aggregated real-time financial telemetry across all restaurant nodes.</p>
        </div>

        {/* Global Export Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] text-rose-400 hover:bg-[#1E293B]/80 hover:text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-500/20 shadow-sm"
          >
            <Download size={14} /> PDF Report
          </button>
          <button
            onClick={() => handleExport('EXCEL')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] text-emerald-400 hover:bg-[#1E293B]/80 hover:text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-500/20 shadow-sm"
          >
            <FileSpreadsheet size={14} /> Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B]/80 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#232B5E]/50 shadow-sm"
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Restaurant Filter Dropdown */}
          <div className="flex items-center gap-3">
            <Store size={18} className="text-[#94A3B8]" />
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="px-4 py-2.5 bg-[#1E293B] rounded-xl border border-[#232B5E]/30 text-xs font-bold text-white focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="ALL">🌐 All Restaurant Nodes ({tenants?.length || 0})</option>
              {(tenants || []).map((t: any) => (
                <option key={t.id} value={t.id}>
                  🏬 {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#1E293B] p-1.5 rounded-2xl border border-[#232B5E]/30">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
              { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'LAST_MONTH', label: 'Last Month' },
              { id: 'CUSTOM', label: 'Custom Range' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setDateRange(filter.id as DateRangeFilter)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  dateRange === filter.id
                    ? 'bg-[#F97316] text-white shadow-lg shadow-orange-500/20'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#232B5E]/30">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#94A3B8]" />
              <span className="text-xs text-[#94A3B8] font-semibold">Start:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-[#1E293B] border border-[#232B5E]/30 rounded-xl text-xs text-white outline-none focus:border-[#F97316]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#94A3B8]" />
              <span className="text-xs text-[#94A3B8] font-semibold">End:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-[#1E293B] border border-[#232B5E]/30 rounded-xl text-xs text-white outline-none focus:border-[#F97316]"
              />
            </div>
          </div>
        )}
      </Card>

      {/* 1. Primary Financial & Operations KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gross GMV */}
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-[#F97316]">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Gross GMV Volume</p>
              <h3 className="text-2xl font-bold text-white">ETB {summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold mt-4 text-[#94A3B8] pt-3 border-t border-[#232B5E]/30">
            <span>Today: ETB {summary.revenueToday.toFixed(2)}</span>
            <span className="text-emerald-400 font-bold">Month: ETB {summary.revenueThisMonth.toFixed(2)}</span>
          </div>
        </Card>

        {/* Platform Fee Cut (15%) */}
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-emerald-400">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Platform Cut (15%)</p>
              <h3 className="text-2xl font-bold text-emerald-400">ETB {summary.platformShareCut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold mt-4 text-[#94A3B8] pt-3 border-t border-[#232B5E]/30">
            <span>Avg Ticket Size:</span>
            <span className="text-white font-bold">ETB {summary.avgOrderValue.toFixed(2)}</span>
          </div>
        </Card>

        {/* Restaurants Overview */}
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-blue-400">
              <Store size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Restaurants</p>
              <h3 className="text-2xl font-bold text-white">{summary.totalRestaurants}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold mt-4 pt-3 border-t border-[#232B5E]/30">
            <span className="text-emerald-400 font-bold">Active: {summary.activeRestaurants}</span>
            <span className="text-amber-400 font-bold">Trial: {summary.trialRestaurants}</span>
            <span className="text-rose-400 font-bold">Inactive: {summary.inactiveRestaurants}</span>
          </div>
        </Card>

        {/* Orders Overview */}
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-purple-400">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Orders</p>
              <h3 className="text-2xl font-bold text-white">{summary.totalOrders}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold mt-4 text-[#94A3B8] pt-3 border-t border-[#232B5E]/30">
            <span>Today: <strong className="text-white">{summary.ordersToday}</strong></span>
            <span>This Month: <strong className="text-purple-400">{summary.ordersThisMonth}</strong></span>
          </div>
        </Card>
      </div>

      {/* 2. Platform Staff & Role Allocation Metrics */}
      <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-indigo-400" /> Platform Staff & Role Allocation
            </h3>
            <p className="text-[#94A3B8] text-xs font-medium mt-0.5">Real-time user count aggregated across all restaurant nodes.</p>
          </div>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Total Users: {summary.totalUsers}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#1E293B]/50 border border-[#232B5E]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Admins</p>
              <h4 className="text-xl font-bold text-white">{summary.totalAdmins}</h4>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1E293B]/50 border border-[#232B5E]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Waiters</p>
              <h4 className="text-xl font-bold text-white">{summary.totalWaiters}</h4>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1E293B]/50 border border-[#232B5E]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Cashiers</p>
              <h4 className="text-xl font-bold text-white">{summary.totalCashiers}</h4>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1E293B]/50 border border-[#232B5E]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ChefHat size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Kitchen Staff</p>
              <h4 className="text-xl font-bold text-white">{summary.totalKitchenStaff}</h4>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#1E293B]/50 border border-[#232B5E]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Coffee size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Baristas</p>
              <h4 className="text-xl font-bold text-white">{summary.totalBaristas}</h4>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Live Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time Chart */}
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-[#F97316]" /> Revenue Trend (ETB)
              </h3>
              <p className="text-[#94A3B8] text-xs font-medium">Platform gross revenue volume over selected period.</p>
            </div>
            <span className="text-xs font-bold text-[#F97316]">ETB {summary.totalRevenue.toFixed(2)}</span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-48 w-full flex items-end justify-between gap-2 pt-6 pb-2 border-b border-[#232B5E]/30">
            {charts.revenueOverTime.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#94A3B8]">
                No revenue records in this timeframe.
              </div>
            ) : (
              charts.revenueOverTime.map((item, idx) => {
                const heightPct = Math.max(10, Math.round((item.amount / maxRevenue) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all bg-[#1E293B] text-white text-[10px] font-bold py-1 px-2 rounded border border-[#232B5E] pointer-events-none whitespace-nowrap z-20">
                      ETB {item.amount.toFixed(2)}
                    </div>
                    <div className="w-full bg-[#1E293B] rounded-t-lg overflow-hidden flex items-end h-36">
                      <div 
                        style={{ height: `${heightPct}%` }} 
                        className="w-full bg-gradient-to-t from-[#F97316]/40 to-[#F97316] rounded-t-lg transition-all duration-500 group-hover:brightness-125" 
                      />
                    </div>
                    <span className="text-[9px] font-bold text-[#94A3B8] truncate w-full text-center">{item.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Orders Volume Over Time Chart */}
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-purple-400" /> Orders Volume Per Period
              </h3>
              <p className="text-[#94A3B8] text-xs font-medium">Aggregated completed & pending orders count.</p>
            </div>
            <span className="text-xs font-bold text-purple-400">{summary.totalOrders} Orders</span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-48 w-full flex items-end justify-between gap-2 pt-6 pb-2 border-b border-[#232B5E]/30">
            {charts.ordersOverTime.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#94A3B8]">
                No orders recorded in this timeframe.
              </div>
            ) : (
              charts.ordersOverTime.map((item, idx) => {
                const heightPct = Math.max(10, Math.round((item.count / maxOrders) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all bg-[#1E293B] text-white text-[10px] font-bold py-1 px-2 rounded border border-[#232B5E] pointer-events-none whitespace-nowrap z-20">
                      {item.count} orders
                    </div>
                    <div className="w-full bg-[#1E293B] rounded-t-lg overflow-hidden flex items-end h-36">
                      <div 
                        style={{ height: `${heightPct}%` }} 
                        className="w-full bg-gradient-to-t from-purple-500/40 to-purple-500 rounded-t-lg transition-all duration-500 group-hover:brightness-125" 
                      />
                    </div>
                    <span className="text-[9px] font-bold text-[#94A3B8] truncate w-full text-center">{item.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* 4. Restaurant Performance Leaderboards */}
      <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award size={20} className="text-amber-400" /> Restaurant Performance Leaderboards
            </h3>
            <p className="text-[#94A3B8] text-xs font-medium mt-0.5">Real-time rankings based on platform database telemetry.</p>
          </div>

          {/* Leaderboard Tab Controls */}
          <div className="flex flex-wrap items-center gap-1 bg-[#1E293B] p-1.5 rounded-2xl border border-[#232B5E]/30">
            {[
              { id: 'TOP_REVENUE', label: '🏆 Top by Revenue' },
              { id: 'TOP_ORDERS', label: '📦 Top by Orders' },
              { id: 'NEWEST', label: '🆕 Newest Onboarded' },
              { id: 'LOWEST', label: '⚠️ Lowest Activity' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLeaderboardTab(tab.id as LeaderboardTab)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeLeaderboardTab === tab.id
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto rounded-xl border border-[#232B5E]/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232B5E]/30 bg-[#1E293B]/50">
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Rank</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Restaurant Node</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Status</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest text-center">Orders</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest text-right">Gross GMV</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest text-right">Platform Share (15%)</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232B5E]/20">
              {activeLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[#94A3B8]">
                    No restaurant metrics available.
                  </td>
                </tr>
              ) : (
                activeLeaderboard.map((item: any, rank: number) => (
                  <tr key={item.id} className="hover:bg-[#1E293B]/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-amber-400">
                      #{rank + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1E293B] border border-[#232B5E]/50 flex items-center justify-center font-bold text-xs text-[#F97316]">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{item.name}</p>
                          <p className="text-[10px] font-mono text-[#94A3B8]">{item.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-white text-center">
                      {item.ordersCount}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-white text-right">
                      ETB {item.grossRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-400 text-right">
                      ETB {item.platformCut.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#94A3B8]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Live Financial Audit & Transactions Log */}
      <Card className="border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden space-y-4 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Receipt size={20} className="text-blue-400" /> Platform Transaction Registry
            </h3>
            <p className="text-[#94A3B8] text-xs font-medium mt-0.5">Real-time receipts ledger across all restaurant tenants.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipt #, restaurant, order #..."
              className="w-full pl-10 pr-4 py-2 bg-[#1E293B] rounded-xl border border-[#232B5E]/30 text-xs text-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F97316]"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#232B5E]/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232B5E]/30 bg-[#1E293B]/50">
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Time</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Restaurant Node</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Receipt No.</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Order / Table</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Cashier</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Method</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232B5E]/20">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-[#94A3B8] font-medium">
                    Loading live platform transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-[#94A3B8] font-medium">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[#1E293B]/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-white">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-white">
                      {r.restaurantName}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-[#F97316]">
                      #{r.receiptNumber}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#94A3B8]">
                      {r.orderNumber} ({r.tableNumber})
                    </td>
                    <td className="px-6 py-4 text-xs text-white font-medium">
                      {r.cashierName}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#94A3B8]">
                      {r.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-white text-right">
                      ETB {r.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        r.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
