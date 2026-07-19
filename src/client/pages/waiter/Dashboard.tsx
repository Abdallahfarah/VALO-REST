import { useState } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  Armchair, 
  Receipt, 
  MessageSquare, 
  Clock,
  TrendingUp,
  LayoutGrid,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { OrderService, TableService, SettingService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../services/CurrencyService';
import { useNavigate } from 'react-router-dom';

export const WaiterDashboard = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();

  // Warning Modal States
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [targetTable, setTargetTable] = useState<any | null>(null);

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

  const { data: settings } = useQuery({
    queryKey: ['settings', tenant?.id],
    queryFn: () => SettingService.getSettings(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const handleTableClick = (table: any) => {
    if (settings?.tableAssignmentMode === 'ASSIGNED') {
      if (table.waiterId && table.waiterId !== user?.id && user?.role !== 'ADMIN') {
        setTargetTable(table);
        setShowWarningModal(true);
        return;
      }
    }
    navigate(`/waiter/pos/${table.id}`);
  };

  const handleOverride = () => {
    if (targetTable) {
      navigate(`/waiter/pos/${targetTable.id}`);
    }
  };

  const myOrders = orders.filter((o: any) => o.waiterId === user?.id);
  const activeOrdersCount = myOrders.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELED').length;
  const totalSalesToday = myOrders
    .filter((o: any) => o.status === 'COMPLETED')
    .reduce((acc: number, o: any) => acc + Number(o.totalAmount), 0);

  const occupiedCount = tables.filter((t: any) => t.status === 'OCCUPIED').length;

  const kpis = [
    { label: 'My Active Orders', value: activeOrdersCount.toString(), sub: 'Currently ongoing', icon: ShoppingCart, color: 'text-indigo-500 lg:text-indigo-500', bg: 'lg:bg-indigo-50 bg-indigo-500/10', trend: 'up' },
    { label: 'My Orders Today', value: myOrders.length.toString(), sub: 'Total processed', icon: Receipt, color: 'text-emerald-500 lg:text-emerald-500', bg: 'lg:bg-emerald-50 bg-emerald-500/10', trend: 'up' },
    { label: 'My Sales Today', value: format(totalSalesToday), sub: 'From completed orders', icon: TrendingUp, color: 'text-orange-500 lg:text-orange-500', bg: 'lg:bg-orange-50 bg-orange-500/10', trend: 'up' },
    { label: 'Tables Occupied', value: `${occupiedCount}/${tables.length}`, sub: 'Live status', icon: Clock, color: 'text-blue-500 lg:text-blue-500', bg: 'lg:bg-blue-50 bg-blue-500/10', trend: 'up' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'text-emerald-500';
      case 'OCCUPIED': return 'text-orange-500';
      case 'PREPARING': return 'text-indigo-455';
      case 'READY': return 'text-amber-500';
      case 'AWAITING_PAYMENT': return 'text-purple-500';
      case 'PAID': return 'text-teal-500';
      default: return 'text-slate-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'lg:bg-emerald-50 lg:border-emerald-100 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20';
      case 'OCCUPIED': return 'lg:bg-orange-50 lg:border-orange-100 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20';
      case 'PREPARING': return 'lg:bg-indigo-50 lg:border-indigo-100 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20';
      case 'READY': return 'lg:bg-amber-50 lg:border-amber-100 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20';
      case 'AWAITING_PAYMENT': return 'lg:bg-purple-50 lg:border-purple-100 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20';
      case 'PAID': return 'lg:bg-teal-50 lg:border-teal-100 bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20';
      default: return 'lg:bg-slate-50 lg:border-slate-100 bg-slate-500/10 border-slate-500/20 hover:bg-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold lg:text-[#0B1630] text-white">Waiter Dashboard</h1>
          <p className="lg:text-[#64748B] text-[#94A3B8] mt-1 text-sm font-medium">Good evening, <span className="text-[#F97316]">{user?.email ? user.email.split('@')[0] : 'Waiter'}!</span> Let's take great care of our guests today.</p>
        </div>
        <button onClick={() => navigate('/waiter/tables')} className="bg-[#F97316] text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#ea580c] transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] w-full sm:w-auto">
          <Plus size={20} strokeWidth={3} /> New Order
          <ChevronRight size={14} className="ml-1 opacity-50" />
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-6 lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>
                  <kpi.icon size={24} />
                </div>
                <svg className="w-16 h-8 text-indigo-500 overflow-visible opacity-80" viewBox="0 0 100 40">
                   <path d="M0,35 Q20,10 40,30 T80,10 T100,5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
             </div>
             <div>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-3xl font-black lg:text-[#0B1630] text-white">{kpi.value}</h3>
                </div>
                <p className="text-xs font-bold lg:text-[#0B1630] text-white/90 mt-1">{kpi.label}</p>
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
               <Card className="lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 overflow-hidden relative group cursor-pointer h-full">
                  <div className="z-10 relative flex flex-col h-full justify-between">
                     <div>
                        <h3 className="text-2xl font-black lg:text-[#0B1630] text-white mb-2 leading-tight">Start a New Order</h3>
                        <p className="text-sm text-[#94A3B8] font-medium max-w-[200px] mb-6">Select items, add to cart and send to kitchen</p>
                        <button onClick={() => navigate('/waiter/tables')} className="lg:bg-white bg-[#1E293B] lg:text-[#0B1630] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm lg:border lg:border-slate-100 border border-[#232B5E]/30 hover:bg-slate-50 lg:hover:bg-slate-50 hover:bg-[#334155] transition-all">
                           Select Table
                        </button>
                     </div>
                     
                     <div className="mt-8">
                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-4 flex items-center gap-2">
                           Popular Categories
                        </p>
                        <div className="flex items-center gap-3">
                           {['🍕', '🍔', '🍟', '🥗', '🍋'].map((emoji, i) => (
                             <div key={i} className="w-12 h-12 rounded-xl lg:bg-slate-50 bg-[#1E293B]/60 lg:border lg:border-slate-100 border border-[#232B5E]/30 flex items-center justify-center text-xl relative">
                                {emoji}
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="absolute right-[-20px] top-6 w-48 h-48 bg-[#0B1630] rounded-3xl rotate-12 flex items-center justify-center opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                     <ShoppingCart size={120} className="text-[#0B1630]" />
                  </div>
               </Card>

               {/* Table Overview */}
               <Card className="lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="font-bold lg:text-[#0B1630] text-white text-sm uppercase tracking-wider">Table Floor Map</h3>
                     <span onClick={() => navigate('/waiter/tables')} className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider cursor-pointer hover:underline">View all</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-1">
                     {tables.slice(0, 12).map((table: any) => (
                        <div 
                           key={table.id} 
                           onClick={() => handleTableClick(table)}
                           className={cn(
                             "p-2 rounded-xl border flex flex-col items-center justify-center aspect-square transition-all cursor-pointer",
                             getStatusBg(table.status),
                             settings?.tableAssignmentMode === 'ASSIGNED' && table.waiterId === user?.id && "ring-2 ring-orange-200 border-[#F97316]"
                           )}
                        >
                           <Armchair size={14} className={getStatusColor(table.status)} />
                           <span className="text-xs font-black lg:text-[#0B1630] text-white mt-1">T{table.number}</span>
                           <span className="text-[8px] font-bold lg:text-[#94A3B8] text-white/50 uppercase">{table.capacity} Seats</span>
                        </div>
                     ))}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:border-t lg:border-slate-50 border-t border-[#232B5E]/30 pt-4">
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[8px] font-bold lg:text-[#64748B] text-[#94A3B8] uppercase">Available</span></div>
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[8px] font-bold lg:text-[#64748B] text-[#94A3B8] uppercase">Occupied</span></div>
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-[8px] font-bold lg:text-[#64748B] text-[#94A3B8] uppercase">Prep</span></div>
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[8px] font-bold lg:text-[#64748B] text-[#94A3B8] uppercase">Ready</span></div>
                  </div>
               </Card>
            </div>

            {/* Recently Active Orders */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="font-bold lg:text-[#0B1630] text-white text-sm uppercase tracking-wider">My Active Orders</h3>
                  <span onClick={() => navigate('/waiter/orders')} className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider cursor-pointer hover:underline">View all</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myOrders.slice(0, 4).map((order: any) => (
                     <Card key={order.id} className="p-4 lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-4 group hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg lg:bg-indigo-50 bg-[#1E295D] text-indigo-500 flex items-center justify-center"><ShoppingCart size={16} /></div>
                              <span className="text-xs font-black lg:text-[#0B1630] text-white">#{order.id.slice(0, 8)}</span>
                           </div>
                           <span className="text-[10px] font-bold text-[#94A3B8]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="text-[10px] font-bold lg:text-[#64748B] text-[#94A3B8]">Table {order.table?.number || 'N/A'} • {order.items?.length || 0} Items</div>
                           <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                              order.status === 'PREPARING' ? "bg-indigo-50 text-indigo-600" :
                              order.status === 'PENDING' ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                           )}>{order.status}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 lg:border-t lg:border-slate-50 border-t border-[#232B5E]/20">
                           <div className="flex -space-x-2">
                              {order.items?.slice(0, 3).map((_: any, i: number) => (
                                 <div key={i} className="w-8 h-8 rounded-full border-2 lg:border-white border-[#131A38] bg-slate-100 lg:bg-slate-100 bg-[#1E293B] flex items-center justify-center text-[10px]">🍳</div>
                              ))}
                              {order.items?.length > 3 && (
                                <div className="w-8 h-8 rounded-full border-2 lg:border-white border-[#131A38] bg-slate-50 lg:bg-slate-50 bg-[#1E293B] flex items-center justify-center text-[8px] font-bold text-[#94A3B8]">+{order.items.length - 3}</div>
                              )}
                           </div>
                           <button onClick={() => navigate(`/waiter/pos/${order.tableId}`)} className="text-[10px] font-bold text-[#F97316] uppercase flex items-center gap-1 group-hover:gap-2 transition-all">Details <ChevronRight size={10} /></button>
                        </div>
                     </Card>
                  ))}
               </div>
            </div>
         </div>

         {/* Right Side: Secondary Info */}
         <div className="xl:col-span-4 space-y-8">
            {/* Quick Actions */}
            <Card className="lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
               <h3 className="font-bold lg:text-[#0B1630] text-white text-sm uppercase tracking-wider mb-6">Quick Actions</h3>
               <div className="grid grid-cols-2 gap-4">
                  {[
                     { label: 'New Order', icon: Plus, sub: 'Create new order', bg: 'lg:bg-indigo-50 bg-indigo-500/10', color: 'text-indigo-500', path: '/waiter/tables' },
                     { label: 'Tables', icon: LayoutGrid, sub: 'View all tables', bg: 'lg:bg-emerald-50 bg-emerald-500/10', color: 'text-emerald-500', path: '/waiter/tables' },
                     { label: 'My Orders', icon: Receipt, sub: 'View my active', bg: 'lg:bg-orange-50 bg-orange-500/10', color: 'text-orange-500', path: '/waiter/orders' },
                     { label: 'Messages', icon: MessageSquare, sub: 'Team messages', bg: 'lg:bg-red-50 bg-red-500/10', color: 'text-red-500', path: '/waiter/messages' },
                  ].map((action, i) => (
                     <div key={i} onClick={() => navigate(action.path)} className="p-4 rounded-2xl lg:bg-white bg-[#1E293B]/45 lg:border lg:border-slate-100 border border-[#232B5E]/30 shadow-sm flex flex-col gap-3 cursor-pointer hover:border-[#F97316] transition-all">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", action.bg, action.color)}>
                           <action.icon size={20} />
                        </div>
                        <div>
                           <p className="text-xs font-bold lg:text-[#0B1630] text-white">{action.label}</p>
                           <p className="text-[8px] font-medium text-[#94A3B8]">{action.sub}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </Card>
         </div>
      </div>

      {/* --- WARNING MODAL --- */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-[#090D1F]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 lg:bg-white bg-[#131A38] lg:border-none border border-[#232B5E]/50 shadow-2xl relative flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full lg:bg-amber-50 bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black lg:text-[#0B1630] text-white">Table Assignment Restriction</h3>
              <p className="text-sm lg:text-[#64748B] text-[#94A3B8] mt-2">
                This table is assigned to <span className="font-bold lg:text-[#0B1630] text-white">{targetTable?.waiter?.name || 'another waiter'}</span>.
                You are not allowed to access this table.
              </p>
            </div>
            <div className="flex gap-4 w-full pt-4 lg:border-t lg:border-slate-100 border-t border-[#232B5E]/20">
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  setTargetTable(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl lg:bg-white bg-[#1E293B] lg:text-slate-500 text-white lg:border lg:border-slate-200 border-none font-bold text-xs hover:bg-slate-50 lg:hover:bg-slate-50 hover:bg-[#334155] uppercase tracking-wider transition-all"
              >
                Go Back
              </button>
              {user?.role === 'ADMIN' && (
                <button 
                  onClick={handleOverride}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  Override & Access
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default WaiterDashboard;
