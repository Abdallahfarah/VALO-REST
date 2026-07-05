import { 
  Plus, 
  ShoppingCart, 
  Armchair, 
  Receipt, 
  MessageSquare, 
  Clock,
  TrendingUp,
  LayoutGrid,
  ChefHat,
  ChevronRight
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { OrderService, TableService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useCurrency } from '../../services/CurrencyService';

export const WaiterDashboard = () => {
  const { tenant } = useTenant();
  const { format } = useCurrency();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables', tenant?.id],
    queryFn: () => TableService.getTables(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const occupiedCount = tables.filter((t: any) => t.status === 'OCCUPIED').length;

  const kpis = [
    { label: 'My Active Orders', value: orders.filter((o: any) => o.status !== 'COMPLETED').length.toString(), sub: 'Currently ongoing', icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-indigo-50', trend: 'up' },
    { label: 'Orders Today', value: orders.length.toString(), sub: 'Total processed', icon: Receipt, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: 'up' },
    { label: 'Sales Today', value: format(orders.reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0)), sub: 'From your orders', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50', trend: 'up' },
    { label: 'Tables Occupied', value: `${occupiedCount}/${tables.length}`, sub: 'Live status', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', trend: 'up' },
  ];
  return (
    <div className="space-y-8 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Waiter Dashboard</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Good evening, <span className="text-[#F97316]">Alex!</span> Let's take great care of our guests today.</p>
        </div>
        <button className="bg-[#F97316] text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98]">
          <Plus size={20} strokeWidth={3} /> New Order
          <ChevronRight size={14} className="ml-1 opacity-50" />
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>
                  <kpi.icon size={24} />
                </div>
                {/* Micro-sparkline mock */}
                <svg className="w-16 h-8 text-indigo-500 overflow-visible" viewBox="0 0 100 40">
                   <path d="M0,35 Q20,10 40,30 T80,10 T100,5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
             </div>
             <div>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-3xl font-black text-[#0B1630]">{kpi.value}</h3>
                </div>
                <p className="text-xs font-bold text-[#0B1630] mt-1">{kpi.label}</p>
                <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider">{kpi.sub}</p>
             </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* Left Side: Center Actions */}
         <div className="xl:col-span-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* POS Quick Access */}
               <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 overflow-hidden relative group cursor-pointer h-full">
                  <div className="z-10 relative flex flex-col h-full justify-between">
                     <div>
                        <h3 className="text-2xl font-black text-[#0B1630] mb-2 leading-tight">Start a New Order</h3>
                        <p className="text-sm text-[#94A3B8] font-medium max-w-[200px] mb-6">Select items, add to cart and send to kitchen</p>
                        <button className="bg-white px-6 py-2.5 rounded-xl text-sm font-bold text-[#0B1630] shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                           Open POS
                        </button>
                     </div>
                     
                     <div className="mt-8">
                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-4 flex items-center gap-2">
                           Popular Items <span className="text-[#F97316] normal-case cursor-pointer hover:underline ml-auto">View all</span>
                        </p>
                        <div className="flex items-center gap-3">
                           {['🍕', '🍔', '🍟', '🥗', '🍋'].map((emoji, i) => (
                             <div key={i} className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl relative">
                                {emoji}
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#F97316] rounded-full flex items-center justify-center text-white p-0.5 border-2 border-white">
                                   <Plus size={8} strokeWidth={4} />
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  {/* Decorative element */}
                  <div className="absolute right-[-20px] top-6 w-48 h-48 bg-[#0B1630] rounded-3xl rotate-12 flex items-center justify-center opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                     <ShoppingCart size={120} className="text-[#0B1630]" />
                  </div>
               </Card>

               {/* Table Overview */}
               <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">Table Overview</h3>
                     <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider cursor-pointer hover:underline">View all</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                     {[
                        { id: 'T1', seats: 4, time: '12:45 PM', status: 'occupied' },
                        { id: 'T2', seats: 2, time: '12:50 PM', status: 'occupied' },
                        { id: 'T3', seats: 6, time: '1:00 PM', status: 'occupied' },
                        { id: 'T4', seats: 2, time: 'Available', status: 'available' },
                        { id: 'T5', seats: 4, time: '1:10 PM', status: 'occupied' },
                        { id: 'T6', seats: 2, time: 'Available', status: 'available' },
                        { id: 'T7', seats: 4, time: 'Available', status: 'available' },
                        { id: 'T8', seats: 6, time: '1:20 PM', status: 'occupied' },
                     ].map((table) => (
                        <div key={table.id} className={cn(
                           "p-2 rounded-xl border flex flex-col items-center justify-center aspect-square transition-all cursor-pointer",
                           table.status === 'occupied' 
                              ? "bg-slate-50 border-slate-100" 
                              : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100"
                        )}>
                           <Armchair size={14} className={table.status === 'occupied' ? "text-indigo-400" : "text-emerald-500"} />
                           <span className="text-xs font-black text-[#0B1630] mt-1">{table.id}</span>
                           <span className="text-[8px] font-bold text-[#94A3B8] uppercase">{table.seats} Seats</span>
                        </div>
                     ))}
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-4">
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-[10px] font-bold text-[#64748B] uppercase">Occupied</span></div>
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-[#64748B] uppercase">Available</span></div>
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[10px] font-bold text-[#64748B] uppercase">Cleaning</span></div>
                  </div>
               </Card>
            </div>

            {/* Recently Active Orders */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider">My Active Orders</h3>
                  <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider cursor-pointer hover:underline">View all</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                     { id: 'LOG-000029', table: 'T1', items: 4, time: '12:45 PM', status: 'Preparing' },
                     { id: 'LOG-000028', table: 'T3', items: 5, time: '1:00 PM', status: 'In Progress' },
                     { id: 'LOG-000026', table: 'T5', items: 3, time: '1:10 PM', status: 'Served' },
                     { id: 'LOG-000023', table: 'T8', items: 4, time: '1:20 PM', status: 'Preparing' },
                  ].map((order) => (
                     <Card key={order.id} className="p-4 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-4 group hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><ShoppingCart size={16} /></div>
                              <span className="text-xs font-black text-[#0B1630]">#{order.id}</span>
                           </div>
                           <span className="text-[10px] font-bold text-[#94A3B8]">{order.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="text-[10px] font-bold text-[#64748B]">Table {order.table} • {order.items} Items</div>
                           <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                              order.status === 'Preparing' ? "bg-indigo-50 text-indigo-600" :
                              order.status === 'In Progress' ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                           )}>{order.status}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                           <div className="flex -space-x-2">
                              {[1, 2, 3].map(i => (
                                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px]">🥗</div>
                              ))}
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[8px] font-bold text-[#94A3B8]">+1</div>
                           </div>
                           <button className="text-[10px] font-bold text-[#F97316] uppercase flex items-center gap-1 group-hover:gap-2 transition-all">Details <ChevronRight size={10} /></button>
                        </div>
                     </Card>
                  ))}
               </div>
            </div>
         </div>

         {/* Right Side: Secondary Info */}
         <div className="xl:col-span-4 space-y-8">
            {/* Quick Actions */}
            <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
               <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider mb-6">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-4">
                  {[
                     { label: 'New Order', icon: Plus, sub: 'Create new order', bg: 'bg-indigo-50', color: 'text-indigo-500' },
                     { label: 'Tables', icon: LayoutGrid, sub: 'View all tables', bg: 'bg-emerald-50', color: 'text-emerald-500' },
                     { label: 'My Orders', icon: Receipt, sub: 'View my active', bg: 'bg-orange-50', color: 'text-orange-500' },
                     { label: 'KDS', icon: ChefHat, sub: 'Kitchen Display', bg: 'bg-red-50', color: 'text-red-500' },
                  ].map((action, i) => (
                     <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-3 cursor-pointer hover:border-[#F97316] transition-all">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", action.bg, action.color)}>
                           <action.icon size={20} />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-[#0B1630]">{action.label}</p>
                           <p className="text-[8px] font-medium text-[#94A3B8]">{action.sub}</p>
                        </div>
                     </div>
                  ))}
               </div>
               {/* Team Chat Action */}
               <div className="mt-8 p-4 rounded-2xl bg-indigo-50 flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                     <div className="relative">
                        <MessageSquare className="text-indigo-500" size={24} />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-indigo-50">2</span>
                     </div>
                     <div>
                        <p className="text-xs font-bold text-indigo-700">Messages</p>
                        <p className="text-[9px] font-medium text-indigo-400">Team messages</p>
                     </div>
                  </div>
                  <ChevronRight size={18} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
               </div>
            </Card>

            {/* Today's Summary Chart Mock */}
            <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
               <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider mb-8">Today's Summary</h3>
               <div className="grid grid-cols-3 gap-2 mb-8">
                  <div>
                     <p className="text-[10px] font-bold text-[#0B1630]">24</p>
                     <p className="text-[8px] text-[#94A3B8] font-medium uppercase">Orders Taken</p>
                     <p className="text-[8px] text-emerald-500 font-bold mt-1">↑ 8 vs yesterday</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-[#0B1630]">{format(1250)}</p>
                     <p className="text-[8px] text-[#94A3B8] font-medium uppercase">Sales Generated</p>
                     <p className="text-[8px] text-emerald-500 font-bold mt-1">↑ 12% vs yesterday</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-[#0B1630]">98%</p>
                     <p className="text-[8px] text-[#94A3B8] font-medium uppercase">Satisfaction</p>
                     <p className="text-[8px] text-emerald-500 font-bold mt-1">↑ 3% vs yesterday</p>
                  </div>
               </div>
               <div className="flex-1 min-h-[120px] relative">
                  {/* Decorative chart lines */}
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 60">
                     <path d="M0,50 Q10,40 20,45 T40,30 T60,50 T80,20 T100,40" fill="none" stroke="#4F46E5" strokeWidth="2" />
                     <path d="M0,50 Q10,40 20,45 T40,30 T60,50 T80,20 T100,40 L100,60 L0,60 Z" fill="url(#gradient)" opacity="0.1" />
                     <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                           <stop offset="0%" stopColor="#4F46E5" />
                           <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                        </linearGradient>
                     </defs>
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] font-bold text-slate-300">
                     <span>12 AM</span>
                     <span>6 AM</span>
                     <span>12 PM</span>
                     <span>6 PM</span>
                     <span>12 AM</span>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
};
