import { useState } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  TrendingUp,
  Receipt,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '../../context/TenantContext';
import { OrderService } from '../../services/ApiService';

export const KDSReports = () => {
  const { tenant } = useTenant();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const totalOrders = orders.length;
  const preparingCount = orders.filter((o: any) => o.status === 'PREPARING').length;
  const completedCount = orders.filter((o: any) => o.status === 'COMPLETED').length;
  const cancelledCount = orders.filter((o: any) => o.status === 'CANCELED').length;
  const readyCount = orders.filter((o: any) => o.status === 'READY').length;

  const totalFinished = readyCount + completedCount;

  const completedPct = totalOrders > 0 ? ((completedCount / totalOrders) * 100).toFixed(1) : '0.0';
  const preparingPct = totalOrders > 0 ? ((preparingCount / totalOrders) * 100).toFixed(1) : '0.0';
  const cancelledPct = totalOrders > 0 ? ((cancelledCount / totalOrders) * 100).toFixed(1) : '0.0';

  const finishedOrders = orders
    .filter((o: any) => o.status === 'READY' || o.status === 'COMPLETED')
    .map((o: any) => {
      let prepMinutes = 0;
      if (o.createdAt) {
        const created = new Date(o.createdAt).getTime();
        const completed = o.updatedAt ? new Date(o.updatedAt).getTime() : new Date().getTime();
        prepMinutes = Math.round(Math.max(0, (completed - created) / 60000));
      }
      return {
        id: o.id?.slice(0, 8).toUpperCase(),
        table: o.table?.number || 'N/A',
        waiter: o.waiterName || 'Unassigned',
        items: o.items?.length || 0,
        finishedAt: o.createdAt ? new Date(o.createdAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A',
        prepTime: `${prepMinutes}m`,
        status: 'Done',
        total: `$${Number(o.totalAmount || 0).toFixed(2)}`,
        raw: o
      };
    });

  // Dynamic date range calculation
  const getDynamicDateRange = () => {
    if (orders.length === 0) {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return `${start.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    const dates = orders.map((o: any) => new Date(o.createdAt).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    return `${minDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} - ${maxDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getCompareDateRange = () => {
    if (orders.length === 0) {
      const start = new Date();
      start.setDate(start.getDate() - 13);
      const end = new Date();
      end.setDate(end.getDate() - 7);
      return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    const dates = orders.map((o: any) => new Date(o.createdAt).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const diff = maxDate.getTime() - minDate.getTime();
    const compStart = new Date(minDate.getTime() - diff - 24 * 60 * 60 * 1000);
    const compEnd = new Date(minDate.getTime() - 24 * 60 * 60 * 1000);
    return `${compStart.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${compEnd.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Pagination helper calculations
  const totalItems = finishedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedOrders = finishedOrders.slice(startIndex, endIndex);

  const avgPrepDuration = finishedOrders.length > 0
    ? Math.round(finishedOrders.reduce((acc, o) => acc + parseInt(o.prepTime), 0) / finishedOrders.length)
    : 0;

  const kpis = [
    { label: 'Total Orders (KDS Finished)', value: totalFinished.toString(), trend: '0%', icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-50', darkBg: 'bg-indigo-500/10', darkColor: 'text-indigo-400', comparison: 'vs previous period' },
    { label: 'Completed Orders', value: completedCount.toString(), trend: '0%', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', darkBg: 'bg-emerald-500/10', darkColor: 'text-emerald-400', comparison: 'vs previous period' },
    { label: 'Cancelled Orders', value: cancelledCount.toString(), trend: '0%', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', darkBg: 'bg-red-500/10', darkColor: 'text-red-400', comparison: 'vs previous period' },
    { label: 'Avg. Preparation Time', value: `${avgPrepDuration}m`, trend: '0%', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', darkBg: 'bg-orange-500/10', darkColor: 'text-orange-400', comparison: 'vs previous period' },
  ];

  const getStrokeOffset = (count: number) => {
    if (totalOrders === 0) return 502;
    return 502 - (502 * count) / totalOrders;
  };

  const getMobileStrokeOffset = (count: number) => {
    if (totalOrders === 0) return 239;
    return 239 - (239 * count) / totalOrders;
  };

  // 24 hourly slots for Peak Hours chart: 12 AM to 11 PM
  const hourlySlots = Array(24).fill(0);
  orders.filter((o: any) => o.status === 'COMPLETED' || o.status === 'READY').forEach((o: any) => {
     if (o.createdAt) {
        const hour = new Date(o.createdAt).getHours();
        if (hour >= 0 && hour < 24) {
           hourlySlots[hour]++;
        }
     }
  });

  const maxHourCount = Math.max(...hourlySlots, 1);
  const peakHoursData = hourlySlots.map((count) => ({
     count,
     percentage: (count / maxHourCount) * 100
  }));

  const completedOrders = orders.filter((o: any) => (o.status === 'COMPLETED' || o.status === 'READY') && o.createdAt);
  let avgPrepTimeStr = '0m 00s';
  let fastestPrepTimeStr = '0m 00s';
  let slowestPrepTimeStr = '0m 00s';
  if (completedOrders.length > 0) {
     const times = completedOrders.map((o: any) => {
        const created = new Date(o.createdAt).getTime();
        const completed = o.updatedAt ? new Date(o.updatedAt).getTime() : new Date().getTime();
        return Math.max(0, (completed - created) / 1000);
     });
     const avgSeconds = times.reduce((a, b) => a + b, 0) / times.length;
     const minSeconds = Math.min(...times);
     const maxSeconds = Math.max(...times);
     
     const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}m ${s}s`;
     };
     
     avgPrepTimeStr = formatDuration(avgSeconds);
     fastestPrepTimeStr = formatDuration(minSeconds);
     slowestPrepTimeStr = formatDuration(maxSeconds);
  }
  return (
    <div className="space-y-8 max-w-[1600px] relative">

      {/* ── Responsive restaurant-themed background artwork (mobile/tablet only) ── */}
      <div className="lg:hidden fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Rolling pin top-right */}
        <svg className="absolute top-16 -right-8 w-56 h-56 opacity-[0.035] text-white rotate-45" viewBox="0 0 80 80" fill="currentColor">
          <rect x="30" y="5" width="20" height="70" rx="10"/>
          <rect x="20" y="12" width="40" height="8" rx="4"/>
          <rect x="20" y="60" width="40" height="8" rx="4"/>
          <rect x="35" y="0" width="10" height="14" rx="5"/>
          <rect x="35" y="66" width="10" height="14" rx="5"/>
        </svg>
        {/* Chef hat bottom-right */}
        <svg className="absolute bottom-32 -right-12 w-72 h-72 opacity-[0.03] text-white" viewBox="0 0 100 100" fill="currentColor">
          <ellipse cx="50" cy="72" rx="30" ry="10"/>
          <path d="M20 72 Q20 40 50 35 Q80 40 80 72 Z"/>
          <ellipse cx="50" cy="36" rx="18" ry="14"/>
          <circle cx="30" cy="32" r="12"/>
          <circle cx="70" cy="32" r="12"/>
        </svg>
        {/* Plate rings top-left */}
        <svg className="absolute -top-8 -left-14 w-52 h-52 opacity-[0.025] text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="50" cy="50" r="45"/>
          <circle cx="50" cy="50" r="35"/>
          <circle cx="50" cy="50" r="20"/>
        </svg>
        {/* Spoon centre-left */}
        <svg className="absolute top-1/2 -left-6 w-32 h-56 opacity-[0.04] text-white -rotate-12" viewBox="0 0 40 100" fill="currentColor">
          <ellipse cx="20" cy="15" rx="12" ry="14"/>
          <rect x="18" y="28" width="4" height="72" rx="2"/>
        </svg>
      </div>

      {/* ── Page Header ── */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-white">Reports</h1>
           <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
        {/* Export button — white on desktop, dark glass on mobile */}
        <button className="flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-[#131A38]/30 border border-[#232B5E]/20 backdrop-blur-md rounded-2xl text-[10px] font-black tracking-widest text-white hover:bg-[#1E293B]/40 transition-all uppercase">
           <Download size={14} /> Export Report
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 lg:gap-4">
         {/* Date range */}
         <div className="flex items-center gap-2 lg:gap-3 bg-[#131A38]/30 backdrop-blur-md px-3 lg:px-4 py-2 lg:py-2.5 rounded-2xl border border-[#232B5E]/20 cursor-pointer hover:bg-[#1E293B]/40 transition-all">
            <Calendar size={14} className="text-[#94A3B8]" />
            <span className="text-[11px] lg:text-xs font-bold text-white">{getDynamicDateRange()}</span>
            <ChevronDown size={13} className="text-[#94A3B8]" />
         </div>
         {/* Compare to — hidden on small mobile, visible from sm+ */}
         <div className="hidden sm:flex items-center gap-2 lg:gap-3 bg-[#131A38]/30 backdrop-blur-md px-3 lg:px-4 py-2 lg:py-2.5 rounded-2xl border border-[#232B5E]/20 cursor-pointer hover:bg-[#1E293B]/40 transition-all">
            <span className="text-[11px] lg:text-xs font-medium text-[#94A3B8]">Compare to:</span>
            <span className="text-[11px] lg:text-xs font-bold text-white">{getCompareDateRange()}</span>
            <ChevronDown size={13} className="text-[#94A3B8]" />
         </div>
         {/* All Tables */}
         <div className="flex items-center gap-2 lg:gap-3 bg-[#131A38]/30 backdrop-blur-md px-3 lg:px-4 py-2 lg:py-2.5 rounded-2xl border border-[#232B5E]/20 cursor-pointer hover:bg-[#1E293B]/40 transition-all">
            <span className="text-[11px] lg:text-xs font-bold text-white">All Tables</span>
            <ChevronDown size={13} className="text-[#94A3B8]" />
         </div>
      </div>

      {/* ── KPI Cards — Desktop (lg+): original grid layout ── */}
      <div className="hidden lg:grid grid-cols-4 gap-6 relative z-10">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-6 bg-[#0C0F24]/65 border border-[#232B5E]/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col gap-6">
             <div className="flex items-start justify-between">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", kpi.darkBg, kpi.darkColor)}>
                   <kpi.icon size={24} />
                </div>
                <div className="flex flex-col items-end">
                   <div className={cn("flex items-center gap-1 font-bold text-xs", kpi.darkColor)}>
                      <TrendingUp size={12} /> {kpi.trend}
                   </div>
                </div>
             </div>
             <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black text-white leading-none mb-2">{kpi.value}</h3>
                <p className="text-[10px] font-medium text-[#94A3B8]">{kpi.comparison}</p>
             </div>
          </Card>
        ))}
      </div>

      {/* ── KPI Cards — Mobile/Tablet (below lg): dark glassmorphic 2-col grid ── */}
      <div className="lg:hidden grid grid-cols-2 gap-3 relative z-10">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-[#131A38]/30 backdrop-blur-md border border-[#232B5E]/20 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", kpi.darkBg, kpi.darkColor)}>
                <kpi.icon size={18} />
              </div>
              <div className={cn("flex items-center gap-1 font-bold text-[10px]", kpi.darkColor)}>
                <TrendingUp size={10} /> {kpi.trend}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1 leading-tight">{kpi.label}</p>
              <h3 className={cn("text-xl font-black leading-none mb-1", kpi.darkColor)}>{kpi.value}</h3>
              <p className="text-[9px] font-medium text-[#94A3B8]">{kpi.comparison}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">

         {/* ── KDS Finished Orders Table ── */}
         <div className="xl:col-span-8">
            {/* Desktop table wrapper */}
            <Card className="hidden lg:flex bg-[#0C0F24]/50 border border-[#232B5E]/20 p-0 overflow-hidden flex-col">
               <div className="p-8 border-b border-[#232B5E]/15 flex items-center justify-between bg-[#131A38]/10">
                  <div>
                     <h3 className="text-sm font-black text-white uppercase tracking-wider">KDS Finished Orders</h3>
                     <p className="text-[11px] text-[#94A3B8] font-medium mt-1">Orders that are finished in kitchen and marked as ready.</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input className="w-56 h-10 pl-10 pr-4 rounded-xl border border-[#232B5E]/20 bg-[#0E1537]/60 text-xs focus:outline-none focus:border-[#F97316]/50 placeholder:text-[#94A3B8] text-white font-bold" placeholder="Search order ID..." />
                     </div>
                     <button className="p-2.5 rounded-xl border border-[#232B5E]/20 text-[#94A3B8] hover:bg-[#1E293B]/40"><Filter size={16} /></button>
                  </div>
               </div>
               <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-[#131A38]/20 border-b border-[#232B5E]/15">
                           <th className="px-8 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Order ID</th>
                           <th className="px-8 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Table</th>
                           <th className="px-8 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Waiter</th>
                           <th className="px-8 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-center">Items</th>
                           <th className="px-8 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">KDS Finished At</th>
                           <th className="px-8 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Prep Time</th>
                           <th className="px-8 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                           <th className="px-8 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total</th>
                           <th className="px-8 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#232B5E]/10 bg-[#070913]/30">
                         {paginatedOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-[#131A38]/15 transition-colors group">
                               <td className="px-8 py-4 text-xs font-black text-indigo-400 hover:underline cursor-pointer">#{order.id}</td>
                               <td className="px-8 py-4 text-xs font-bold text-white">{order.table}</td>
                               <td className="px-8 py-4 text-xs font-medium text-[#94A3B8]">{order.waiter}</td>
                               <td className="px-8 py-4 text-xs font-bold text-white text-center">{order.items}</td>
                               <td className="px-8 py-4 text-xs font-medium text-[#94A3B8]">{order.finishedAt}</td>
                               <td className="px-8 py-4 text-xs font-bold text-white">{order.prepTime}</td>
                               <td className="px-8 py-4">
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Done</span>
                               </td>
                               <td className="px-8 py-4 text-xs font-black text-[#F97316]">{order.total}</td>
                               <td className="px-8 py-4 text-right">
                                  <button className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/45 transition-all"><Eye size={14} /></button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <div className="p-6 border-t border-[#232B5E]/15 flex items-center justify-between bg-[#131A38]/10 text-xs font-medium text-[#94A3B8]">
                   <span>Showing {totalItems > 0 ? startIndex + 1 : 0} to {endIndex} of {totalItems} orders</span>
                   <div className="flex items-center gap-2">
                      <button 
                         onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                         disabled={currentPage === 1}
                         className="p-2 rounded-xl border border-[#232B5E]/20 hover:bg-[#1E293B]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         <ChevronLeft size={16} />
                      </button>
                      <div className="flex items-center gap-1">
                         {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button 
                               key={p} 
                               onClick={() => setCurrentPage(p)}
                               className={cn(
                                 "w-8 h-8 rounded-xl font-bold transition-all",
                                 currentPage === p 
                                   ? "bg-[#F97316] text-white shadow-md shadow-orange-500/20" 
                                   : "hover:bg-[#1E293B]/40 text-[#94A3B8]"
                               )}
                            >
                               {p}
                            </button>
                         ))}
                      </div>
                      <button 
                         onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                         disabled={currentPage === totalPages}
                         className="p-2 rounded-xl border border-[#232B5E]/20 hover:bg-[#1E293B]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         <ChevronRight size={16} />
                      </button>
                   </div>
                </div>
             </Card>

           {/* Mobile table wrapper — dark glassmorphic, horizontally scrollable */}
           <div className="lg:hidden bg-[#131A38]/70 backdrop-blur-md border border-[#232B5E]/50 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
              {/* Mobile table header */}
              <div className="p-4 border-b border-[#232B5E]/40 flex items-center justify-between">
                 <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">KDS Finished Orders</h3>
                    <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5">Marked as ready in kitchen</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="relative">
                       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                       <input className="w-32 h-8 pl-8 pr-3 rounded-xl border border-[#232B5E]/50 bg-[#0E1537]/60 text-[10px] focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8] text-white" placeholder="Search..." />
                    </div>
                    <button className="p-2 rounded-xl border border-[#232B5E]/50 text-[#94A3B8] hover:bg-[#131A38]/50"><Filter size={14} /></button>
                 </div>
              </div>
              {/* Scrollable order list cards */}
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                 {paginatedOrders.map((order) => (
                    <div key={order.id} className="bg-[#0E1537]/80 border border-[#232B5E]/40 rounded-xl p-3 flex items-center justify-between gap-3">
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-black text-indigo-400">#{order.id}</span>
                             <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Done</span>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] font-bold text-[#94A3B8]">
                             <span>Table {order.table}</span>
                             <span>•</span>
                             <span>{order.waiter}</span>
                             <span>•</span>
                             <span>{order.items} items</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[9px] font-medium text-[#94A3B8]">
                             <span>⏱ {order.prepTime}</span>
                             <span className="text-[#F97316] font-black">{order.total}</span>
                          </div>
                       </div>
                       <button className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#131A38]/50 shrink-0">
                          <Eye size={13} />
                       </button>
                    </div>
                 ))}
              </div>
              {/* Mobile pagination */}
              <div className="p-3 border-t border-[#232B5E]/40 flex items-center justify-between text-[10px] font-medium text-[#94A3B8]">
                 <span>Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems}</span>
                 <div className="flex items-center gap-1">
                    <button 
                       onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                       disabled={currentPage === 1}
                       className="p-1.5 rounded-lg border border-[#232B5E]/50 hover:bg-[#131A38]/50 disabled:opacity-50"
                    >
                       <ChevronLeft size={13} />
                    </button>
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((p) => (
                       <button 
                          key={p} 
                          onClick={() => setCurrentPage(p)}
                          className={cn(
                            "w-7 h-7 rounded-lg font-black text-[10px]",
                            currentPage === p ? "bg-[#F97316] text-white" : "hover:bg-[#131A38]/50 text-[#94A3B8]"
                          )}
                       >
                          {p}
                       </button>
                    ))}
                    <button 
                       onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                       disabled={currentPage === totalPages}
                       className="p-1.5 rounded-lg border border-[#232B5E]/50 hover:bg-[#131A38]/50 disabled:opacity-50"
                    >
                       <ChevronRight size={13} />
                    </button>
                 </div>
              </div>
           </div>
         </div>

         {/* ── Sidebar: Status Overview + Prep Stats + Peak Hours ── */}
         <div className="xl:col-span-4 space-y-6 lg:space-y-8">

             {/* Status Overview */}
             {/* Desktop */}
             <Card className="hidden lg:block p-8 bg-[#0C0F24]/50 border border-[#232B5E]/20">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-8">Order Status Overview</h3>
                <div className="flex items-center justify-center relative py-6">
                   <svg className="w-48 h-48 -rotate-90">
                      <circle cx="96" cy="96" r="80" fill="transparent" stroke="#131A38" strokeWidth="16" />
                      <circle cx="96" cy="96" r="80" fill="transparent" stroke="#22C55E" strokeWidth="16" strokeDasharray="502" strokeDashoffset={getStrokeOffset(completedCount)} />
                      <circle cx="96" cy="96" r="80" fill="transparent" stroke="#F97316" strokeWidth="16" strokeDasharray="502" strokeDashoffset={getStrokeOffset(preparingCount)} />
                      <circle cx="96" cy="96" r="80" fill="transparent" stroke="#EF4444" strokeWidth="16" strokeDasharray="502" strokeDashoffset={getStrokeOffset(cancelledCount)} />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white">{totalOrders}</span>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Total Orders</span>
                   </div>
                </div>
                <div className="mt-8 space-y-3">
                   {[
                     { label: 'Completed (KDS Finished)', value: `${completedCount} (${completedPct}%)`, color: 'bg-emerald-500' },
                     { label: 'Preparing', value: `${preparingCount} (${preparingPct}%)`, color: 'bg-orange-500' },
                     { label: 'Cancelled', value: `${cancelledCount} (${cancelledPct}%)`, color: 'bg-red-500' },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className={cn("w-2 h-2 rounded-full", item.color)} />
                           <span className="text-[11px] font-medium text-[#94A3B8]">{item.label}</span>
                        </div>
                        <span className="text-[11px] font-black text-white">{item.value}</span>
                     </div>
                   ))}
                </div>
             </Card>

            {/* Mobile — Status Overview */}
            <div className="lg:hidden bg-[#131A38]/30 border border-[#232B5E]/20 rounded-2xl p-4 shadow-xl shadow-black/10">
               <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4">Order Status Overview</h3>
               <div className="flex items-center gap-4">
                  {/* Compact donut */}
                  <div className="relative shrink-0">
                     <svg className="w-24 h-24 -rotate-90">
                        <circle cx="48" cy="48" r="38" fill="transparent" stroke="#1e2a4a" strokeWidth="10" />
                        <circle cx="48" cy="48" r="38" fill="transparent" stroke="#22C55E" strokeWidth="10" strokeDasharray="239" strokeDashoffset={getMobileStrokeOffset(completedCount)} />
                        <circle cx="48" cy="48" r="38" fill="transparent" stroke="#F97316" strokeWidth="10" strokeDasharray="239" strokeDashoffset={getMobileStrokeOffset(preparingCount)} />
                        <circle cx="48" cy="48" r="38" fill="transparent" stroke="#EF4444" strokeWidth="10" strokeDasharray="239" strokeDashoffset={getMobileStrokeOffset(cancelledCount)} />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-white">{totalOrders}</span>
                        <span className="text-[8px] font-bold text-[#94A3B8] uppercase">Total</span>
                     </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                     {[
                       { label: 'Completed', value: `${completedCount} (${completedPct}%)`, color: 'bg-emerald-500' },
                       { label: 'Preparing', value: `${preparingCount} (${preparingPct}%)`, color: 'bg-orange-500' },
                       { label: 'Cancelled', value: `${cancelledCount} (${cancelledPct}%)`, color: 'bg-red-500' },
                     ].map((item, i) => (
                       <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
                             <span className="text-[10px] font-medium text-[#94A3B8]">{item.label}</span>
                          </div>
                          <span className="text-[10px] font-black text-white">{item.value}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

             {/* Preparation Time Summary */}
             {/* Desktop */}
             <Card className="hidden lg:block p-8 bg-[#0C0F24]/50 border border-[#232B5E]/20">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-8">Preparation Time Summary</h3>
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#94A3B8]">Average Time</span>
                      <span className="text-sm font-black text-orange-400">{avgPrepTimeStr}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#94A3B8]">Fastest Order</span>
                      <span className="text-sm font-black text-emerald-400">{fastestPrepTimeStr}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#94A3B8]">Slowest Order</span>
                      <span className="text-sm font-black text-red-400">{slowestPrepTimeStr}</span>
                   </div>
                </div>
             </Card>

             {/* Mobile — Prep Time Summary */}
             <div className="lg:hidden bg-[#131A38]/30 border border-[#232B5E]/20 rounded-2xl p-4 shadow-xl shadow-black/10">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3">Preparation Time</h3>
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#94A3B8]">Average Time</span>
                      <span className="text-xs font-black text-orange-400">{avgPrepTimeStr}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#94A3B8]">Fastest Order</span>
                      <span className="text-xs font-black text-emerald-400">{fastestPrepTimeStr}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#94A3B8]">Slowest Order</span>
                      <span className="text-xs font-black text-red-400">{slowestPrepTimeStr}</span>
                   </div>
                </div>
             </div>

             {/* Peak Hours */}
             {/* Desktop */}
             <Card className="hidden lg:block p-8 bg-[#0C0F24]/50 border border-[#232B5E]/20 overflow-hidden">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-8">Peak Hours (Completed Orders)</h3>
                <div className="h-48 flex items-baseline justify-between gap-1">
                   {peakHoursData.map((val, i) => (
                     <div key={i} className="flex-1 bg-indigo-500/15 rounded-t-sm group relative cursor-pointer hover:bg-[#F97316]/30 transition-colors" style={{ height: `${val.percentage}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden shadow-md shadow-orange-500/20">
                           {val.count} orders
                        </div>
                     </div>
                   ))}
                </div>
                <div className="flex justify-between mt-4 text-[8px] font-black text-[#94A3B8] uppercase tracking-widest">
                   <span>12 AM</span>
                   <span>4 AM</span>
                   <span>8 AM</span>
                   <span>12 PM</span>
                   <span>4 PM</span>
                   <span>8 PM</span>
                </div>
             </Card>

             {/* Mobile — Peak Hours */}
             <div className="lg:hidden bg-[#131A38]/30 border border-[#232B5E]/20 rounded-2xl p-4 overflow-hidden shadow-xl shadow-black/10">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3">Peak Hours</h3>
                <div className="h-32 flex items-baseline justify-between gap-0.5">
                   {peakHoursData.map((val, i) => (
                     <div
                       key={i}
                       className="flex-1 bg-indigo-500/20 hover:bg-[#F97316]/30 rounded-t-sm transition-colors cursor-pointer"
                       style={{ height: `${val.percentage}%` }}
                     />
                   ))}
                </div>
                <div className="flex justify-between mt-2 text-[7px] font-black text-[#94A3B8] uppercase tracking-widest">
                   <span>12A</span>
                   <span>4A</span>
                   <span>8A</span>
                   <span>12P</span>
                   <span>4P</span>
                   <span>8P</span>
                </div>
             </div>

         </div>
      </div>
    </div>
  );
};
