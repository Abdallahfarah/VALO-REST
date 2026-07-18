import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  Armchair, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Coins
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { TableService, SettingService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

export const WaiterTables = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Warning Modal States
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [targetTable, setTargetTable] = useState<any | null>(null);

  const { data: tables = [], refetch } = useQuery({
    queryKey: ['tables', tenant?.id],
    queryFn: () => TableService.getTables(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings', tenant?.id],
    queryFn: () => SettingService.getSettings(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  // Set up realtime updates for tables
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('waiter-tables-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, refetch]);

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

  const stats = [
    { label: 'Total Tables', value: tables.length.toString(), icon: LayoutGrid, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Available', value: tables.filter((t: any) => t.status === 'AVAILABLE').length.toString(), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Occupied', value: tables.filter((t: any) => t.status === 'OCCUPIED').length.toString(), icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Preparing', value: tables.filter((t: any) => t.status === 'PREPARING').length.toString(), icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Awaiting Pay', value: tables.filter((t: any) => t.status === 'AWAITING_PAYMENT').length.toString(), icon: Coins, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'Available', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'OCCUPIED':
        return { label: 'Occupied', dot: 'bg-orange-500', bg: 'bg-orange-50 text-orange-600 border-orange-100' };
      case 'PREPARING':
        return { label: 'Preparing', dot: 'bg-indigo-500', bg: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
      case 'READY':
        return { label: 'Ready', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'AWAITING_PAYMENT':
        return { label: 'Awaiting Payment', dot: 'bg-purple-500', bg: 'bg-purple-50 text-purple-600 border-purple-100' };
      case 'PAID':
        return { label: 'Paid', dot: 'bg-teal-500', bg: 'bg-teal-50 text-teal-600 border-teal-100' };
      default:
        return { label: status, dot: 'bg-slate-500', bg: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Interactive Floor Plan</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Live Floor Status</span>
             {settings?.tableAssignmentMode === 'ASSIGNED' && (
               <span className="ml-3 bg-violet-100 text-violet-700 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Assigned Mode Active
               </span>
             )}
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
        {tables.map((table: any) => {
          const cfg = getStatusConfig(table.status);
          const isAssignedToSelf = table.waiterId === user?.id;
          const hasAssignment = !!table.waiterId;

          return (
            <Card 
              key={table.id} 
              onClick={() => handleTableClick(table)}
              className={cn(
                "p-4 border shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-md transition-all group relative cursor-pointer",
                settings?.tableAssignmentMode === 'ASSIGNED' && isAssignedToSelf
                  ? "border-[#F97316] ring-2 ring-orange-100 bg-orange-50/10" 
                  : "border-slate-100"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-colors", cfg.bg)}>
                  <Armchair size={20} />
                </div>
                {settings?.tableAssignmentMode === 'ASSIGNED' && hasAssignment && (
                  <span className={cn(
                    "text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider",
                    isAssignedToSelf ? "bg-[#F97316] text-white" : "bg-slate-100 text-slate-500"
                  )}>
                     {isAssignedToSelf ? 'Mine' : 'Assigned'}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#0B1630]">T{table.number}</h3>
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{table.capacity} Seats</span>
                </div>
                <div className={cn(
                  "text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider w-fit mt-3 inline-flex items-center gap-1.5",
                  cfg.bg
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                  {cfg.label}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-[10px] text-[#94A3B8] font-bold">
                     Waiter
                  </div>
                  <div className="text-xs font-black">
                     {isAssignedToSelf ? (
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
          );
        })}
      </div>

      {/* Legend Block */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-6 border-t border-slate-100">
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-[#64748B] uppercase">Available</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /><span className="text-[10px] font-bold text-[#64748B] uppercase">Occupied</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-[10px] font-bold text-[#64748B] uppercase">Preparing</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[10px] font-bold text-[#64748B] uppercase">Ready</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" /><span className="text-[10px] font-bold text-[#64748B] uppercase">Awaiting Payment</span></div>
         <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-teal-500" /><span className="text-[10px] font-bold text-[#64748B] uppercase">Paid</span></div>
      </div>

      {/* --- WARNING MODAL: ASSIGNED TABLE ACCESS --- */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1630]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 border-none shadow-2xl relative bg-white flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0B1630]">Table Assignment Restriction</h3>
              <p className="text-sm text-[#64748B] mt-2">
                This table is assigned to <span className="font-bold text-[#0B1630]">{targetTable?.waiter?.name || 'another waiter'}</span>.
                You are not allowed to access this table.
              </p>
            </div>
            <div className="flex gap-4 w-full pt-4 border-t border-slate-100">
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  setTargetTable(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 uppercase tracking-wider"
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
