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

const kpis = [
  { label: 'Total Orders (KDS Finished)', value: '124', trend: '+ 12.5%', icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-50', comparison: 'vs Jun 13 - Jun 19, 2026' },
  { label: 'Completed Orders', value: '118', trend: '+ 10.8%', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', comparison: 'vs Jun 13 - Jun 19, 2026' },
  { label: 'Cancelled Orders', value: '6', trend: '↑ 4.3%', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', comparison: 'vs Jun 13 - Jun 19, 2026' },
  { label: 'Avg. Preparation Time', value: '18m 24s', trend: '↓ 6.2%', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', comparison: 'vs Jun 13 - Jun 19, 2026' },
];

const finishedOrders = [
  { id: 'LOG-000029', table: 'T5', waiter: 'Ahmed', items: 2, finishedAt: 'Jun 26, 2026 12:45 PM', prepTime: '14m 32s', status: 'Done', total: 'ETB 1,250' },
  { id: 'LOG-000028', table: 'T3', waiter: 'Sara', items: 3, finishedAt: 'Jun 26, 2026 12:30 PM', prepTime: '18m 10s', status: 'Done', total: 'ETB 980' },
  { id: 'LOG-000027', table: 'T8', waiter: 'Mohamed', items: 4, finishedAt: 'Jun 26, 2026 12:20 PM', prepTime: '21m 45s', status: 'Done', total: 'ETB 670' },
  { id: 'LOG-000026', table: 'T2', waiter: 'Ahmed', items: 2, finishedAt: 'Jun 26, 2026 11:58 AM', prepTime: '12m 05s', status: 'Done', total: 'ETB 1,150' },
  { id: 'LOG-000025', table: 'T1', waiter: 'Sara', items: 3, finishedAt: 'Jun 26, 2026 11:45 AM', prepTime: '16m 25s', status: 'Done', total: 'ETB 860' },
  { id: 'LOG-000024', table: 'T6', waiter: 'Mohamed', items: 2, finishedAt: 'Jun 26, 2026 11:20 AM', prepTime: '10m 15s', status: 'Done', total: 'ETB 450' },
  { id: 'LOG-000023', table: 'T4', waiter: 'Ahmed', items: 3, finishedAt: 'Jun 26, 2026 11:10 AM', prepTime: '23m 40s', status: 'Done', total: 'ETB 1,320' },
  { id: 'LOG-000022', table: 'T7', waiter: 'Sara', items: 2, finishedAt: 'Jun 26, 2026 10:55 AM', prepTime: '11m 30s', status: 'Done', total: 'ETB 930' },
];

export const KDSReports = () => {
  return (
    <div className="space-y-8 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-[#0B1630]">Reports</h1>
           <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest text-[#0B1630] hover:bg-slate-50 transition-all uppercase shadow-sm">
           <Download size={14} /> Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
         <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50">
            <Calendar size={16} className="text-[#94A3B8]" />
            <span className="text-xs font-bold text-[#0B1630]">Jun 20, 2026 - Jun 26, 2026</span>
            <ChevronDown size={14} className="text-[#94A3B8]" />
         </div>
         <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50">
            <span className="text-xs font-medium text-[#94A3B8]">Compare to:</span>
            <span className="text-xs font-bold text-[#0B1630]">Jun 13, 2026 - Jun 19, 2026</span>
            <ChevronDown size={14} className="text-[#94A3B8]" />
         </div>
         <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50">
            <span className="text-xs font-bold text-[#0B1630]">All Tables</span>
            <ChevronDown size={14} className="text-[#94A3B8]" />
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-6">
             <div className="flex items-start justify-between">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", kpi.bg, kpi.color)}>
                   <kpi.icon size={24} />
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                      <TrendingUp size={12} /> {kpi.trend}
                   </div>
                </div>
             </div>
             <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black text-[#0B1630] leading-none mb-2">{kpi.value}</h3>
                <p className="text-[10px] font-medium text-[#94A3B8]">{kpi.comparison}</p>
             </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* Finished Orders Table */}
         <Card className="xl:col-span-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-0 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white">
               <div>
                  <h3 className="text-sm font-black text-[#0B1630] uppercase tracking-wider">KDS Finished Orders</h3>
                  <p className="text-[11px] text-[#94A3B8] font-medium mt-1">Orders that are finished in kitchen and marked as ready.</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                     <input className="w-56 h-10 pl-10 pr-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" placeholder="Search order ID..." />
                  </div>
                  <button className="p-2.5 rounded-xl border border-slate-100 text-[#94A3B8] hover:bg-slate-50"><Filter size={16} /></button>
               </div>
            </div>
            <div className="overflow-x-auto flex-1">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/30">
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
                  <tbody className="divide-y divide-slate-50">
                     {finishedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-8 py-4 text-xs font-black text-[#4F46E5] hover:underline cursor-pointer">#{order.id}</td>
                           <td className="px-8 py-4 text-xs font-bold text-[#0B1630]">{order.table}</td>
                           <td className="px-8 py-4 text-xs font-medium text-[#64748B]">{order.waiter}</td>
                           <td className="px-8 py-4 text-xs font-bold text-[#0B1630] text-center">{order.items}</td>
                           <td className="px-8 py-4 text-xs font-medium text-[#64748B]">{order.finishedAt}</td>
                           <td className="px-8 py-4 text-xs font-bold text-[#0B1630]">{order.prepTime}</td>
                           <td className="px-8 py-4">
                              <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Done</span>
                           </td>
                           <td className="px-8 py-4 text-xs font-black text-[#0B1630]">{order.total}</td>
                           <td className="px-8 py-4 text-right">
                              <button className="p-2 rounded-lg text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-all"><Eye size={14} /></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-white text-xs font-medium text-[#94A3B8]">
               <span>Showing 1 to 8 of 124 orders</span>
               <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"><ChevronLeft size={16} /></button>
                  <div className="flex items-center gap-1">
                     <button className="w-8 h-8 rounded-xl bg-[#0B1630] text-white font-bold">1</button>
                     <button className="w-8 h-8 rounded-xl hover:bg-slate-50">2</button>
                     <button className="w-8 h-8 rounded-xl hover:bg-slate-50">3</button>
                     <span className="px-1">...</span>
                     <button className="w-8 h-8 rounded-xl hover:bg-slate-50">16</button>
                  </div>
                  <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"><ChevronRight size={16} /></button>
               </div>
            </div>
         </Card>

         {/* Sidebar: Status Overview and Prep Stats */}
         <div className="xl:col-span-4 space-y-8">
            <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
               <h3 className="text-sm font-black text-[#0B1630] uppercase tracking-wider mb-8">Order Status Overview</h3>
               <div className="flex items-center justify-center relative py-6">
                  {/* Mock Donut Chart */}
                  <svg className="w-48 h-48 -rotate-90">
                     <circle cx="96" cy="96" r="80" fill="transparent" stroke="#E5E7EB" strokeWidth="16" />
                     <circle cx="96" cy="96" r="80" fill="transparent" stroke="#22C55E" strokeWidth="16" strokeDasharray="502" strokeDashoffset="25" />
                     <circle cx="96" cy="96" r="80" fill="transparent" stroke="#F97316" strokeWidth="16" strokeDasharray="502" strokeDashoffset="480" />
                     <circle cx="96" cy="96" r="80" fill="transparent" stroke="#EF4444" strokeWidth="16" strokeDasharray="502" strokeDashoffset="495" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-4xl font-black text-[#0B1630]">124</span>
                     <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Total Orders</span>
                  </div>
               </div>
               <div className="mt-8 space-y-3">
                  {[
                    { label: 'Completed (KDS Finished)', value: '118 (95.2%)', color: 'bg-emerald-500' },
                    { label: 'Preparing', value: '4 (3.2%)', color: 'bg-orange-500' },
                    { label: 'Cancelled', value: '2 (1.6%)', color: 'bg-red-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", item.color)} />
                          <span className="text-[11px] font-medium text-[#64748B]">{item.label}</span>
                       </div>
                       <span className="text-[11px] font-black text-[#0B1630]">{item.value}</span>
                    </div>
                  ))}
               </div>
            </Card>

            <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
               <h3 className="text-sm font-black text-[#0B1630] uppercase tracking-wider mb-8">Preparation Time Summary</h3>
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-[#64748B]">Average Time</span>
                     <span className="text-sm font-black text-orange-500">18m 24s</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-[#64748B]">Fastest Order</span>
                     <span className="text-sm font-black text-emerald-500">7m 30s</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-[#64748B]">Slowest Order</span>
                     <span className="text-sm font-black text-red-500">42m 10s</span>
                  </div>
               </div>
            </Card>

            <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
               <h3 className="text-sm font-black text-[#0B1630] uppercase tracking-wider mb-8">Peak Hours (Completed Orders)</h3>
               <div className="h-48 flex items-baseline justify-between gap-1">
                  {[20, 35, 15, 10, 45, 60, 85, 95, 82, 78, 65, 56, 40, 32, 18, 8, 3].map((val, i) => (
                    <div key={i} className="flex-1 bg-slate-100 rounded-t-sm group relative cursor-pointer hover:bg-indigo-100 transition-colors" style={{ height: `${val}%` }}>
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0B1630] text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                          {val} orders
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
         </div>
      </div>
    </div>
  );
};
