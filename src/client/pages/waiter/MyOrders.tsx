
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Clock, 
  Users as UsersIcon, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { OrderService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

export const MyOrders = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();

  const { data: allOrders = [] } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  // Filter orders assigned to this waiter
  const waiterOrders = allOrders.filter((o: any) => o.waiterId === user?.id);

  // Compute KPIs dynamically
  const activeOrdersCount = waiterOrders.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELED').length;
  const servedOrdersCount = waiterOrders.filter((o: any) => o.status === 'COMPLETED').length; // served & paid
  const preparingOrdersCount = waiterOrders.filter((o: any) => o.status === 'PREPARING').length;
  const totalSalesToday = waiterOrders
    .filter((o: any) => o.status === 'COMPLETED')
    .reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0);

  const kpis = [
    { label: 'Active Orders', value: activeOrdersCount.toString(), sub: 'Currently in progress', icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Served Orders', value: servedOrdersCount.toString(), sub: 'Completed today', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Preparing', value: preparingOrdersCount.toString(), sub: 'In preparation', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Total Sales', value: `ETB ${totalSalesToday.toFixed(0)}`, sub: 'From your orders today', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">My Orders</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>
                <kpi.icon size={24} />
             </div>
             <div>
               <h3 className="text-2xl font-black text-[#0B1630]">{kpi.value}</h3>
               <div className="text-[10px] font-bold text-[#0B1630] flex flex-col">
                  {kpi.label}
                  <span className="text-[#94A3B8] font-medium normal-case">{kpi.sub}</span>
               </div>
             </div>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Table Filters */}
        <div className="p-6 border-b border-slate-50 flex flex-wrap items-center gap-4 bg-white">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-100 bg-slate-50/50 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" placeholder="Search orders by ID, table or customer..." />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0B1630] cursor-pointer hover:bg-slate-50">
            All Status <ChevronDown size={14} className="text-[#94A3B8]" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0B1630] cursor-pointer hover:bg-slate-50">
            All Tables <ChevronDown size={14} className="text-[#94A3B8]" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0B1630] hover:bg-slate-50">
            <Filter size={14} /> Filters
          </button>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Table</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Guests</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {waiterOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-[#0B1630]">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-[#0B1630]">Table {order.table?.number}</span>
                       <span className="text-[10px] font-medium text-[#94A3B8]">Main Floor</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
                        <UsersIcon size={14} strokeWidth={2.5} /> 2 Guests
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider inline-flex items-center gap-1.5",
                      order.status === 'PREPARING' ? "bg-indigo-50 text-indigo-600" :
                      order.status === 'PENDING' ? "bg-orange-50 text-orange-600" :
                      order.status === 'READY' ? "bg-emerald-50 text-emerald-600" :
                      "bg-blue-50 text-blue-600"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", 
                        order.status === 'PREPARING' ? "bg-indigo-500" :
                        order.status === 'PENDING' ? "bg-orange-500" :
                        order.status === 'READY' ? "bg-emerald-500" : "bg-blue-500"
                      )} />
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                       <div className="flex -space-x-2">
                          {order.items?.slice(0, 3).map((item: any, i: number) => (
                             <div key={i} className="w-8 h-8 rounded-xl border-2 border-white bg-slate-50 flex items-center justify-center text-xs shadow-sm" title={item.menuItem?.name}>
                                🍳
                             </div>
                          ))}
                       </div>
                       {order.items?.length > 3 && (
                          <span className="text-[10px] font-bold text-[#94A3B8] ml-2">+{order.items.length - 3}</span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-[#0B1630]">ETB {Number(order.totalAmount).toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-[#0B1630]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       <span className="text-[10px] font-medium text-[#94A3B8]">Today</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="h-8 px-3 rounded-lg border border-slate-200 text-[10px] font-bold text-[#0B1630] hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm">
                          <Eye size={12} /> View
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-white">
           <span className="text-xs font-medium text-[#94A3B8]">Showing {waiterOrders.length} orders</span>
           <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl border border-slate-200 text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-all">
                 <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                 <button className="w-8 h-8 rounded-xl bg-[#0B1630] text-white text-xs font-bold shadow-lg shadow-slate-900/10">1</button>
              </div>
              <button className="p-2 rounded-xl border border-slate-200 text-[#0B1630] hover:bg-slate-50 transition-all">
                 <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </Card>
    </div>
  );
};
