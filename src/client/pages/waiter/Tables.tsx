import { useState } from 'react';
import { 
  Users, 
  Search, 
  LayoutGrid, 
  List, 
  MoreVertical,
  ChevronDown,
  Armchair,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { TableService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const WaiterTables = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const { data: tables = [] } = useQuery({
    queryKey: ['tables', tenant?.id],
    queryFn: () => TableService.getTables(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const stats = [
    { label: 'Total Tables', value: tables.length.toString(), icon: LayoutGrid, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Available', value: tables.filter((t: any) => t.status === 'AVAILABLE').length.toString(), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Occupied', value: tables.filter((t: any) => t.status === 'OCCUPIED').length.toString(), icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Reserved', value: '0', icon: Armchair, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Cleaning', value: '0', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Tables</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Live Status</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-4 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">{stat.label}</p>
              <h3 className="text-xl font-black text-[#0B1630]">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
           <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
             <input className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" placeholder="Search tables..." />
           </div>
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] cursor-pointer">
              All Status <ChevronDown size={14} className="text-[#94A3B8]" />
           </div>
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] cursor-pointer">
              All Areas <ChevronDown size={14} className="text-[#94A3B8]" />
           </div>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
           <button 
            onClick={() => setView('grid')}
            className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'grid' ? "bg-white text-[#0B1630] shadow-sm" : "text-[#64748B] hover:text-[#0B1630]")}
           >
             <LayoutGrid size={14} /> Grid View
           </button>
           <button 
            onClick={() => setView('list')}
            className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'list' ? "bg-white text-[#0B1630] shadow-sm" : "text-[#64748B] hover:text-[#0B1630]")}
           >
             <List size={14} /> List View
           </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map((table: any) => (
          <Card 
            key={table.id} 
            onClick={() => navigate(`/waiter/pos/${table.id}`)}
            className="p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow group relative cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-colors", 
                table.status === 'AVAILABLE' ? "bg-emerald-50 text-emerald-500 border-emerald-100" :
                table.status === 'OCCUPIED' ? "bg-orange-50 text-orange-500 border-orange-100" :
                "bg-amber-50 text-amber-500 border-amber-100"
              )}>
                <Armchair size={20} />
              </div>
              <button className="p-1 rounded-lg text-[#94A3B8] opacity-0 group-hover:opacity-100 hover:bg-slate-50 transition-all">
                <MoreVertical size={16} />
              </button>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-[#0B1630]">T{table.number}</h3>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{table.capacity} Seats</span>
              </div>
              <div className={cn(
                "text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider w-fit mt-3",
                table.status === 'AVAILABLE' ? "bg-emerald-50 text-emerald-600" :
                table.status === 'OCCUPIED' ? "bg-orange-50 text-orange-600" :
                "bg-amber-50 text-amber-600"
              )}>
                {table.status}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="text-[10px] text-[#94A3B8] font-bold">
                   Assigned Waiter
                </div>
                <div className="text-xs font-black">
                   {table.waiterId === user?.id ? (
                     <span className="text-[#F97316]">You</span>
                   ) : table.waiter ? (
                     <span className="text-[#64748B]">{table.waiter.name}</span>
                   ) : (
                     <span className="text-slate-400 font-medium">Unassigned</span>
                   )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Legend Block */}
      <div className="flex items-center justify-center gap-8 py-6">
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs font-bold text-[#64748B] uppercase">Available</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /><span className="text-xs font-bold text-[#64748B] uppercase">Occupied</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-xs font-bold text-[#64748B] uppercase">Reserved</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-xs font-bold text-[#64748B] uppercase">Cleaning</span></div>
      </div>
    </div>
  );
};
