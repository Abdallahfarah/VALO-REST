import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Users,
  DollarSign,
  ShoppingCart,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Smile,
  CheckCircle,
  Printer,
  ChevronDown
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderService, StaffService, ReceiptService, ActivityLogService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { useCurrency } from '../services/CurrencyService';
import { supabase } from '../../lib/supabase';
import { toast } from '../lib/toast-store';

type DateRangeType = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export const Reports = () => {
  const { tenant } = useTenant();
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  // Filter States
  const [dateRange, setDateRange] = useState<DateRangeType>('TODAY');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');

  // Realtime subscription for live updates
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('admin-live-financials')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receipts', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['receipts', tenant.id] });
          queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
          queryClient.invalidateQueries({ queryKey: ['activity-logs', tenant.id] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
          queryClient.invalidateQueries({ queryKey: ['receipts', tenant.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, queryClient]);

  // Queries
  const { data: receipts = [], isLoading: isReceiptsLoading } = useQuery({
    queryKey: ['receipts', tenant?.id],
    queryFn: () => ReceiptService.getReceipts(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: logs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['activity-logs', tenant?.id],
    queryFn: () => ActivityLogService.getLogs(tenant?.id || '', 50),
    enabled: !!tenant?.id,
  });

  const isLoading = isReceiptsLoading || isOrdersLoading || isLogsLoading;

  // Filter Helper
  const filterByDateRange = (itemDate: Date, range: DateRangeType) => {
    const itemTime = itemDate.getTime();
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    if (range === 'TODAY') {
      return itemTime >= startOfToday.getTime();
    }
    if (range === 'YESTERDAY') {
      return itemTime >= startOfYesterday.getTime() && itemTime < startOfToday.getTime();
    }
    if (range === 'WEEK') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return itemTime >= oneWeekAgo.getTime();
    }
    if (range === 'MONTH') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return itemTime >= thirtyDaysAgo.getTime();
    }
    if (range === 'CUSTOM') {
      const start = customStartDate ? new Date(customStartDate) : new Date(0);
      start.setHours(0,0,0,0);
      const end = customEndDate ? new Date(customEndDate) : new Date();
      end.setHours(23,59,59,999);
      return itemTime >= start.getTime() && itemTime <= end.getTime();
    }
    return true;
  };

  // 1. Dynamic Unique Filters list (for select dropdowns)
  const cashiersList = useMemo(() => {
    const cashiersSet = new Set<string>();
    receipts.forEach((r: any) => {
      if (r.cashierName) cashiersSet.add(r.cashierName);
    });
    return Array.from(cashiersSet);
  }, [receipts]);

  // 2. Filtered Receipts (based on current date range & search & selectors)
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r: any) => filterByDateRange(new Date(r.createdAt), dateRange));
  }, [receipts, dateRange, customStartDate, customEndDate]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => filterByDateRange(new Date(o.createdAt), dateRange));
  }, [orders, dateRange, customStartDate, customEndDate]);

  // 3. Payment Summary metrics
  const summaryMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Today's Revenue (PAID status settled today)
    const todayRevenue = receipts
      .filter((r: any) => {
        const itemTime = new Date(r.createdAt).getTime();
        return itemTime >= startOfToday.getTime() && r.status !== 'REFUNDED';
      })
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);

    // Pending Payments (Uncompleted orders cumulative amount)
    const pendingPayments = orders
      .filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELED')
      .reduce((sum, o: any) => sum + Number(o.totalAmount), 0);

    // Completed Payments (Count of PAID checks in active range)
    const completedPaymentsCount = filteredReceipts
      .filter((r: any) => r.status !== 'REFUNDED')
      .length;

    // Refunded Amount in active range
    const refundedAmount = filteredReceipts
      .filter((r: any) => r.status === 'REFUNDED')
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);

    // Gross Revenue in active range
    const grossRevenue = filteredReceipts.reduce((sum, r: any) => sum + Number(r.totalAmount), 0);

    // Net Revenue in active range
    const netRevenue = grossRevenue - refundedAmount;

    return {
      todayRevenue,
      pendingPayments,
      completedPaymentsCount,
      refundedAmount,
      netRevenue
    };
  }, [receipts, orders, filteredReceipts]);

  // 4. Central Live Payments Registry
  const filteredRegistry = useMemo(() => {
    let result = [...filteredReceipts];

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r: any) => 
        r.receiptNumber.toLowerCase().includes(q) ||
        (r.order?.orderNumber && r.order.orderNumber.toLowerCase().includes(q)) ||
        (r.order?.customerName && r.order.customerName.toLowerCase().includes(q)) ||
        (r.order?.waiterName && r.order.waiterName.toLowerCase().includes(q)) ||
        r.cashierName.toLowerCase().includes(q)
      );
    }

    // Cashier filter
    if (selectedCashier !== 'All') {
      result = result.filter((r: any) => r.cashierName === selectedCashier);
    }

    // Payment Method filter
    if (selectedMethod !== 'All') {
      result = result.filter((r: any) => r.paymentMethod === selectedMethod);
    }

    // Status filter
    if (selectedStatus !== 'All') {
      result = result.filter((r: any) => (r.status || 'PAID') === selectedStatus);
    }

    // Sort order
    result.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (sortBy === 'newest') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      if (sortBy === 'amount-high') return Number(b.totalAmount) - Number(a.totalAmount);
      if (sortBy === 'amount-low') return Number(a.totalAmount) - Number(b.totalAmount);
      return 0;
    });

    return result;
  }, [filteredReceipts, searchQuery, selectedCashier, selectedMethod, selectedStatus, sortBy]);

  // 5. Payment Method Breakdown (derived from active range)
  const paymentMethodStats = useMemo(() => {
    const methods = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Other'];
    // Today's Revenue denominator
    const denominator = summaryMetrics.todayRevenue || 1;

    const statsMap: Record<string, { amount: number; count: number }> = {};
    methods.forEach(m => {
      statsMap[m] = { amount: 0, count: 0 };
    });

    filteredReceipts.forEach((r: any) => {
      if (r.status === 'REFUNDED') return;
      const method = r.paymentMethod || 'Cash';
      const amt = Number(r.totalAmount);
      let key = 'Other';
      if (method === 'Cash') key = 'Cash';
      else if (method === 'Card' || method === 'CREDIT_CARD') key = 'Card';
      else if (method === 'Mobile Money') key = 'Mobile Money';
      else if (method === 'Bank Transfer') key = 'Bank Transfer';

      statsMap[key].amount += amt;
      statsMap[key].count += 1;
    });

    return methods
      .map(m => {
        const data = statsMap[m] || { amount: 0, count: 0 };
        const pct = (data.amount / denominator) * 100;
        return {
          method: m,
          amount: data.amount,
          transactions: data.count,
          percentage: pct
        };
      })
      .filter(item => item.transactions > 0); // Only display methods that have transactions during selected range
  }, [filteredReceipts, summaryMetrics.todayRevenue]);

  // 6. Cashier Leaderboard Performance
  const cashierLeaderboard = useMemo(() => {
    const map: Record<string, {
      name: string;
      processed: number;
      revenue: number;
      refundCount: number;
      lastActivity: Date | null;
    }> = {};

    filteredReceipts.forEach((r: any) => {
      const name = r.cashierName || 'System Cashier';
      if (!map[name]) {
        map[name] = { name, processed: 0, revenue: 0, refundCount: 0, lastActivity: null };
      }

      const amt = Number(r.totalAmount);
      const isRefund = r.status === 'REFUNDED';
      const created = new Date(r.createdAt);

      if (isRefund) {
        map[name].refundCount += 1;
      } else {
        map[name].processed += 1;
        map[name].revenue += amt;
      }

      const currentLast = map[name].lastActivity;
      if (!currentLast || created.getTime() > currentLast.getTime()) {
        map[name].lastActivity = created;
      }
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue); // Sorted by highest revenue collected
  }, [filteredReceipts]);

  // 7. Recent Financial Activity Timeline
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      time: Date;
      user: string;
      action: 'Payment Completed' | 'Refund Issued' | 'Discount Applied' | 'Receipt Reprinted' | 'Order Cancelled' | 'Large Transaction';
      orderNo: string;
    }> = [];

    // Payment Completed, Discount Applied, Large Transaction events from receipts
    filteredReceipts.forEach((r: any) => {
      const time = new Date(r.createdAt);
      const user = r.cashierName || 'Cashier';
      const orderNo = r.order?.orderNumber || `#${r.orderId.slice(0, 8)}`;
      const total = Number(r.totalAmount);
      const discount = Number(r.discountAmount);

      if (r.status === 'REFUNDED') {
        events.push({
          id: `refund-${r.id}`,
          time,
          user,
          action: 'Refund Issued',
          orderNo
        });
      } else {
        events.push({
          id: `pay-${r.id}`,
          time,
          user,
          action: 'Payment Completed',
          orderNo
        });

        if (discount > 0) {
          events.push({
            id: `discount-${r.id}`,
            time: new Date(time.getTime() + 1000), // slightly offset
            user,
            action: 'Discount Applied',
            orderNo
          });
        }

        if (total >= 150) {
          events.push({
            id: `large-${r.id}`,
            time: new Date(time.getTime() + 2000),
            user,
            action: 'Large Transaction',
            orderNo
          });
        }
      }
    });

    // Order Cancelled events
    filteredOrders.forEach((o: any) => {
      if (o.status === 'CANCELED') {
        events.push({
          id: `cancel-${o.id}`,
          time: new Date(o.updatedAt || o.createdAt),
          user: o.waiterName || 'Staff',
          action: 'Order Cancelled',
          orderNo: o.orderNumber || `#${o.id.slice(0, 8)}`
        });
      }
    });

    // Receipt Reprinted events from logs
    logs.forEach((log: any) => {
      if (log.action === 'RECEIPT_PRINTED' || log.action === 'RECEIPT_REPRINTED' || log.action === 'PRINT_RECEIPT') {
        events.push({
          id: `reprint-${log.id}`,
          time: new Date(log.createdAt),
          user: log.userName || 'System',
          action: 'Receipt Reprinted',
          orderNo: log.details || 'Unknown'
        });
      }
    });

    return events.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 15);
  }, [filteredReceipts, filteredOrders, logs]);

  // Export handlers respecting active filters
  const handleExport = (formatType: 'PDF' | 'EXCEL' | 'CSV') => {
    toast.success('Generating export', `Exporting active dashboard records as ${formatType}...`);
    
    setTimeout(() => {
      const headers = ['Time', 'Receipt No.', 'Order No.', 'Table', 'Customer', 'Waiter', 'Cashier', 'Method', 'Amount', 'Status'];
      const rows = filteredRegistry.map((r: any) => [
        new Date(r.createdAt).toLocaleString(),
        r.receiptNumber,
        r.order?.orderNumber || '',
        r.order?.tableNumber ? `Table ${r.order.tableNumber}` : 'N/A',
        r.order?.customerName || 'Walk-in',
        r.order?.waiterName || '',
        r.cashierName,
        r.paymentMethod,
        r.totalAmount,
        r.status || 'PAID'
      ]);

      let content = '';
      let filename = `financial_report_${dateRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;

      if (formatType === 'CSV' || formatType === 'EXCEL') {
        content = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
        filename += formatType === 'CSV' ? '.csv' : '.xlsx';
      } else {
        // PDF Simulation content
        content = `VALO FINANCIAL REPORT\nExport Range: ${dateRange}\nRecords Count: ${rows.length}\nTotal Net Revenue: ${summaryMetrics.netRevenue}\n\n`;
        content += rows.map(r => r.join(' | ')).join('\n');
        filename += '.pdf';
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      
      {/* Header and date range selector toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black lg:text-[#0B1630] text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="text-[#F97316]" /> Financial Operations
          </h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Real-time payment journal auditing, void logs, and cashier performance audits.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center bg-[#131A38]/50 lg:bg-white rounded-2xl p-1 border border-[#232B5E]/30 lg:border-slate-200 shadow-sm">
            {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH'] as DateRangeType[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  dateRange === range 
                    ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/20" 
                    : "text-[#94A3B8] hover:text-[#0B1630] dark:hover:text-white"
                )}
              >
                {range}
              </button>
            ))}
            <button
              onClick={() => setDateRange('CUSTOM')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                dateRange === 'CUSTOM' 
                  ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/20" 
                  : "text-[#94A3B8] hover:text-[#0B1630] dark:hover:text-white"
              )}
            >
              Custom
            </button>
          </div>

          {/* Export Toolbar */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExport('PDF')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#232B5E]/30 lg:border-slate-200 text-xs font-bold lg:text-[#0B1630] text-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <FileText size={16} className="text-red-500" /> PDF
            </button>
            <button 
              onClick={() => handleExport('EXCEL')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#232B5E]/30 lg:border-slate-200 text-xs font-bold lg:text-[#0B1630] text-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={16} className="text-emerald-500" /> Excel
            </button>
            <button 
              onClick={() => handleExport('CSV')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#232B5E]/30 lg:border-slate-200 text-xs font-bold lg:text-[#0B1630] text-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <FileText size={16} className="text-blue-500" /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Picker Fields */}
      {dateRange === 'CUSTOM' && (
        <Card className="p-4 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Start Date</span>
            <input 
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:border-[#F97316]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase">End Date</span>
            <input 
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:border-[#F97316]"
            />
          </div>
        </Card>
      )}

      {/* Payment Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Today's Revenue */}
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">Today's Revenue</span>
            <DollarSign className="text-orange-500 w-4 h-4" />
          </div>
          <div className="my-1">
            <h3 className="text-2xl font-black text-[#0B1630] leading-none tracking-tight">
              {isLoading ? '...' : format(summaryMetrics.todayRevenue)}
            </h3>
          </div>
          <p className="text-[9px] text-[#94A3B8] font-bold">Real-time daily intake</p>
        </Card>

        {/* Pending Payments */}
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">Pending Payments</span>
            <Clock className="text-blue-500 w-4 h-4 animate-pulse" />
          </div>
          <div className="my-1">
            <h3 className="text-2xl font-black text-[#0B1630] leading-none tracking-tight">
              {isLoading ? '...' : format(summaryMetrics.pendingPayments)}
            </h3>
          </div>
          <p className="text-[9px] text-[#94A3B8] font-bold">Unsettled active tables</p>
        </Card>

        {/* Completed Payments */}
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">Completed Payments</span>
            <Receipt className="text-emerald-500 w-4 h-4" />
          </div>
          <div className="my-1">
            <h3 className="text-2xl font-black text-[#0B1630] leading-none tracking-tight">
              {isLoading ? '...' : summaryMetrics.completedPaymentsCount}
            </h3>
          </div>
          <p className="text-[9px] text-[#94A3B8] font-bold">Paid receipt check count</p>
        </Card>

        {/* Refunded Amount */}
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">Refunded Amount</span>
            <AlertTriangle className="text-red-500 w-4 h-4" />
          </div>
          <div className="my-1">
            <h3 className="text-2xl font-black text-red-600 leading-none tracking-tight">
              {isLoading ? '...' : format(summaryMetrics.refundedAmount)}
            </h3>
          </div>
          <p className="text-[9px] text-[#94A3B8] font-bold">Voids and reversed payments</p>
        </Card>

        {/* Net Revenue */}
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">Net Revenue</span>
            <DollarSign className="text-emerald-500 w-4 h-4" />
          </div>
          <div className="my-1">
            <h3 className="text-2xl font-black text-[#0B1630] leading-none tracking-tight">
              {isLoading ? '...' : format(summaryMetrics.netRevenue)}
            </h3>
          </div>
          <p className="text-[9px] text-[#94A3B8] font-bold">GTV minus refunds for period</p>
        </Card>

      </div>

      {/* Main dashboard core panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width): Real-Time Payment Registry */}
        <Card className="lg:col-span-2 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white overflow-hidden flex flex-col min-h-[600px]">
          
          {/* Table Toolbar controls */}
          <div className="p-6 border-b border-slate-50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Payment Registry Ledger</h3>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase mt-0.5">Real-time Postgres auditing journal</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest pl-1">Live Feed</span>
              </div>
            </div>

            {/* Filter controls row */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" 
                  placeholder="Search receipt, cashier, waiter, customer..." 
                />
              </div>

              {/* Cashier filter */}
              <div className="flex items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                <Users size={12} className="text-[#94A3B8] mr-2" />
                <select 
                  value={selectedCashier}
                  onChange={(e) => setSelectedCashier(e.target.value)}
                  className="text-[10px] font-bold text-[#0B1630] bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="All">All Cashiers</option>
                  {cashiersList.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method filter */}
              <div className="flex items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                <DollarSign size={12} className="text-[#94A3B8] mr-2" />
                <select 
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="text-[10px] font-bold text-[#0B1630] bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="All">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Payment Status filter */}
              <div className="flex items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                <Filter size={12} className="text-[#94A3B8] mr-2" />
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-[10px] font-bold text-[#0B1630] bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="PAID">Paid / Completed</option>
                  <option value="REFUNDED">Voided / Refunded</option>
                </select>
              </div>

              {/* Sorting dropdown */}
              <div className="flex items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-medium text-[#94A3B8] mr-2">Sort:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-[10px] font-bold text-[#0B1630] bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount (High to Low)</option>
                  <option value="amount-low">Amount (Low to High)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Payment registry table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100 bg-white">
                  <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Receipt No.</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Order No.</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Table</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Waiter</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Cashier</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRegistry.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all cursor-default">
                    {/* Time */}
                    <td className="px-6 py-4 text-xs font-medium text-[#94A3B8]">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    {/* Receipt No */}
                    <td className="px-6 py-4 text-xs font-black text-[#64748B]">{item.receiptNumber}</td>
                    {/* Order No */}
                    <td className="px-6 py-4 text-xs font-black text-[#4F46E5]">
                      {item.order?.orderNumber || `#${item.orderId.slice(0, 8)}`}
                    </td>
                    {/* Table */}
                    <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">
                      {item.order?.tableNumber ? `Table ${item.order.tableNumber}` : 'N/A'}
                    </td>
                    {/* Customer */}
                    <td className="px-6 py-4 text-xs font-medium text-[#0B1630]">
                      {item.order?.customerName || 'Walk-in'}
                    </td>
                    {/* Waiter */}
                    <td className="px-6 py-4 text-xs font-medium text-[#64748B]">
                      {item.order?.waiterName || 'POS Terminal'}
                    </td>
                    {/* Cashier */}
                    <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">{item.cashierName}</td>
                    {/* Method */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg bg-slate-100 text-[#0B1630] border border-slate-200">
                        {item.paymentMethod}
                      </span>
                    </td>
                    {/* Amount */}
                    <td className="px-6 py-4 text-right text-xs font-black text-[#0B1630]">{format(Number(item.totalAmount))}</td>
                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border",
                        item.status === 'REFUNDED' 
                          ? "bg-red-50 text-red-600 border-red-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {item.status || 'PAID'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRegistry.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-20 text-xs text-[#94A3B8] font-bold">
                      No payment records found matching active criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Column (1/3 width): Sidebar sections */}
        <div className="space-y-6 flex flex-col">
          
          {/* Payment Method Breakdown */}
          <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
            <h3 className="font-bold text-[#0B1630] text-xs uppercase tracking-wider mb-4">Payment Methods Breakdown</h3>
            <div className="space-y-4">
              {paymentMethodStats.map((item, idx) => {
                const colors = ['bg-[#F97316]', 'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-slate-400'];
                const color = colors[idx] || 'bg-slate-400';
                return (
                  <div key={item.method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                        <span className="text-[#64748B] font-medium">{item.method}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#0B1630]">{format(item.amount)}</span>
                        <span className="text-[#94A3B8] text-[10px] w-8 text-right">{item.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                    </div>
                    <p className="text-[9px] text-[#94A3B8] font-bold">{item.transactions} transactions</p>
                  </div>
                );
              })}
              {paymentMethodStats.length === 0 && (
                <div className="text-center py-4 text-xs font-bold text-[#94A3B8]">
                  No transactions recorded in range.
                </div>
              )}
            </div>
          </Card>

          {/* Cashier Performance audits */}
          <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex-1 min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0B1630] text-xs uppercase tracking-wider">Cashier Audits</h3>
              <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded uppercase">Ranked</span>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {cashierLeaderboard.map((c) => (
                <div key={c.name} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center font-black text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#0B1630]">{c.name}</h4>
                      <p className="text-[9px] text-[#94A3B8] font-bold mt-0.5">
                        {c.processed} payments · {c.refundCount} refunds
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#0B1630] block">{format(c.revenue)}</span>
                    <span className="text-[8px] text-[#94A3B8] font-bold">
                      {c.lastActivity ? new Date(c.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
              {cashierLeaderboard.length === 0 && (
                <div className="text-center py-8 text-xs font-bold text-[#94A3B8]">
                  No active cashier records.
                </div>
              )}
            </div>
          </Card>

          {/* Recent Financial Activity Timeline */}
          <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white min-h-[300px]">
            <h3 className="font-bold text-[#0B1630] text-xs uppercase tracking-wider mb-4">Recent Financial Activity</h3>
            
            <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {timelineEvents.map((ev) => {
                let badgeColor = 'bg-slate-100 text-slate-700';
                if (ev.action === 'Payment Completed') badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-100/50';
                else if (ev.action === 'Refund Issued') badgeColor = 'bg-red-50 text-red-600 border-red-100/50';
                else if (ev.action === 'Discount Applied') badgeColor = 'bg-orange-50 text-orange-600 border-orange-100/50';
                else if (ev.action === 'Large Transaction') badgeColor = 'bg-purple-50 text-purple-600 border-purple-100/50';
                else if (ev.action === 'Order Cancelled') badgeColor = 'bg-slate-100 text-slate-600 border-slate-200/50';

                return (
                  <div key={ev.id} className="relative space-y-1">
                    {/* Bullet marker */}
                    <div className="absolute left-[-21px] top-1.5 w-2 h-2 rounded-full bg-slate-300 border-2 border-white" />
                    
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border", badgeColor)}>
                        {ev.action}
                      </span>
                      <span className="text-[#94A3B8] font-bold">
                        {new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-[#0B1630]">
                      Order {ev.orderNo} by <span className="font-black text-slate-800">{ev.user}</span>
                    </p>
                  </div>
                );
              })}
              {timelineEvents.length === 0 && (
                <div className="text-center py-8 text-xs font-bold text-[#94A3B8] border-l-0 pl-0 ml-0">
                  No activity logs in range.
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>

    </div>
  );
};
export default Reports;
