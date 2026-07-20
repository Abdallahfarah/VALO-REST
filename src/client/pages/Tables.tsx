import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Plus, 
  Search, 
  Armchair, 
  Trash2, 
  Edit2,
  LayoutGrid,
  X,
  Clock,
  Check,
  Users,
  UserCheck,
  ChevronDown,
  Receipt
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableService, StaffService, OrderService, ActivityLogService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../lib/toast-store';
import { tableSchema } from '../lib/validations';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';


// ─── Status Config ───
const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  AVAILABLE:  { bg: 'bg-emerald-50',  text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Available' },
  OCCUPIED:   { bg: 'bg-orange-50',   text: 'text-orange-600',  dot: 'bg-orange-500',  label: 'Occupied' },
  CLEANING:   { bg: 'bg-blue-50',     text: 'text-blue-600',    dot: 'bg-blue-500',    label: 'Cleaning' },
  RESERVED:   { bg: 'bg-amber-50',    text: 'text-amber-600',   dot: 'bg-amber-500',   label: 'Reserved' },
};

// ─── Table Row Component ───
const TableRow = memo(({ table, waiters, onEdit, onDelete, onAssignWaiter, onUpdateGuestCount }: any) => {
  const status = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE;

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      {/* Table Number */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm",
            table.status === 'OCCUPIED' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-[#0B1630]'
          )}>
            {table.number}
          </div>
          <div>
            <span className="text-sm font-bold text-[#0B1630]">Table {table.number}</span>
            <p className="text-[10px] text-[#94A3B8] font-medium">{table.capacity} seats</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span className={cn(
          "inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider",
          status.bg, status.text
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </td>

      {/* Assigned Waiter */}
      <td className="px-6 py-4">
        <div className="relative inline-block">
          <select
            value={table.waiterId || ''}
            onChange={(e) => onAssignWaiter(table.id, e.target.value || null)}
            className={cn(
              "appearance-none pr-7 pl-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-orange-200",
              table.waiterId
                ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                : "bg-slate-50 text-[#94A3B8] border-slate-100"
            )}
          >
            <option value="">Unassigned</option>
            {waiters.map((w: any) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]" />
        </div>
      </td>

      {/* Guest Count */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[#94A3B8]" />
          <input
            type="number"
            min="0"
            max={table.capacity}
            value={table.guestCount || 0}
            onChange={(e) => onUpdateGuestCount(table.id, Math.min(Number(e.target.value), table.capacity))}
            className="w-14 h-8 text-center text-xs font-bold text-[#0B1630] bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:border-[#F97316]"
          />
          <span className="text-[10px] text-[#94A3B8] font-medium">/ {table.capacity}</span>
        </div>
      </td>

      {/* Active Orders */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5">
          <Receipt size={14} className="text-[#94A3B8]" />
          <span className="text-xs font-bold text-[#0B1630]">{table.activeOrders ?? 0}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(table)}
            className="p-2 rounded-lg text-[#64748B] hover:bg-white hover:text-[#0B1630] border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => {
              if (confirm(`Are you sure you want to delete Table ${table.number}?`)) {
                onDelete(table.id);
              }
            }}
            className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});




export const Tables = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  // ─── Modal States ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  // ─── Form States ───
  const [form, setForm] = useState({
    number: '',
    capacity: '4',
    status: 'AVAILABLE'
  });

  // ─── Queries ───
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', tenant?.id],
    queryFn: () => TableService.getTables(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff', tenant?.id],
    queryFn: () => StaffService.getStaff(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const { data: activeOrders = [] } = useQuery({
    queryKey: ['orders', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
    select: (data: any[]) => data.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'),
  });

  // Waiters only (for the assignment dropdown)
  const waiters = useMemo(() => 
    staff.filter((s: any) => s.role === 'WAITER' || s.role === 'ADMIN'),
    [staff]
  );

  // Enrich tables with active order count
  const enrichedTables = useMemo(() => {
    return tables.map((t: any) => {
      const orderCount = activeOrders.filter((o: any) => o.tableId === t.id).length;
      return { ...t, activeOrders: orderCount };
    });
  }, [tables, activeOrders]);

  // ─── Realtime Subscriptions ───
  useEffect(() => {
    if (!tenant?.id) return;
    
    const channel = supabase
      .channel('tables-admin-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tables', tenant.id] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', tenant.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, queryClient]);

  // ─── Mutations ───
  const createTableMutation = useMutation({
    mutationFn: (newTable: any) => TableService.createTable(newTable),
    onSuccess: (data) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'CREATE_TABLE',
        entity: 'TABLE',
        entityId: data?.id,
        details: `Created table number: ${data?.number || form.number} with capacity ${data?.capacity || form.capacity}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tables', tenant?.id] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Table added', 'Table added successfully!');
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => TableService.updateTable(id, data),
    onSuccess: (_data, variables) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'UPDATE_TABLE',
        entity: 'TABLE',
        entityId: variables.id,
        details: `Updated table number: ${variables.data.number || ''} ${variables.data.waiterId ? 'waiter assigned' : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tables', tenant?.id] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Table updated', 'Table updated successfully!');
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: (id: string) => TableService.deleteTable(id),
    onSuccess: (_data, id) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'DELETE_TABLE',
        entity: 'TABLE',
        entityId: id,
        details: `Deleted table ID: ${id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tables', tenant?.id] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Table deleted', 'Table deleted successfully!');
    },
  });

  // ─── Inline Waiter Assignment ───
  const handleAssignWaiter = useCallback((tableId: string, waiterId: string | null) => {
    updateTableMutation.mutate({ id: tableId, data: { waiterId: waiterId || null } });
  }, [updateTableMutation]);

  // ─── Inline Guest Count Update ───
  const handleUpdateGuestCount = useCallback((tableId: string, count: number) => {
    updateTableMutation.mutate({ id: tableId, data: { guestCount: count } });
  }, [updateTableMutation]);

  if (isLoading) return <PageLoader label="Loading tables floor plan..." />;

  // ─── Filter Logic ───
  const filteredTables = enrichedTables.filter((t: any) => 
    t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.waiter?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Form Helpers ───
  const resetForm = () => {
    setForm({
      number: '',
      capacity: '4',
      status: 'AVAILABLE'
    });
    setSelectedTable(null);
  };

  const handleOpenEdit = (table: any) => {
    setSelectedTable(table);
    setForm({
      number: table.number,
      capacity: String(table.capacity),
      status: table.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = tableSchema.safeParse({
      number: form.number,
      capacity: form.capacity,
      status: form.status
    });

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Validation error';
      toast.warning('Invalid Table Form', errorMsg);
      return;
    }

    const payload = {
      tenantId: tenant?.id,
      number: form.number,
      capacity: Number(form.capacity),
      status: form.status
    };

    if (selectedTable) {
      updateTableMutation.mutate({ id: selectedTable.id, data: payload });
    } else {
      createTableMutation.mutate(payload);
    }
  };

  // ─── Stats ───
  const occupiedCount = tables.filter((t: any) => t.status === 'OCCUPIED').length;
  const cleaningCount = tables.filter((t: any) => t.status === 'CLEANING').length;
  const availableCount = tables.filter((t: any) => t.status === 'AVAILABLE').length;
  const assignedCount = tables.filter((t: any) => t.waiterId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Tables Management</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Manage your floor plan, assign waiters, and track active tables.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#F97316] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#ea580c] transition-colors shadow-lg shadow-[#F97316]/20 cursor-pointer"
        >
          <Plus size={16} /> Add Table
        </button>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <LayoutGrid size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Total</p>
            <h3 className="text-xl font-black text-[#0B1630]">{tables.length}</h3>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Check size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Available</p>
            <h3 className="text-xl font-black text-[#0B1630]">{availableCount}</h3>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Armchair size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Occupied</p>
            <h3 className="text-xl font-black text-[#0B1630]">{occupiedCount}</h3>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Cleaning</p>
            <h3 className="text-xl font-black text-[#0B1630]">{cleaningCount}</h3>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Assigned</p>
            <h3 className="text-xl font-black text-[#0B1630]">{assignedCount}</h3>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" 
                placeholder="Search tables or waiters..." 
              />
           </div>
        </div>
        
        <table className="w-full text-left border-collapse">
           <thead>
              <tr className="bg-slate-50/50">
                 <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Table</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Assigned Waiter</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Guests</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Active Orders</th>
                 <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
              {filteredTables.map((table: any) => (
                <TableRow
                  key={table.id}
                  table={table}
                  waiters={waiters}
                  onEdit={handleOpenEdit}
                  onDelete={(id: string) => deleteTableMutation.mutate(id)}
                  onAssignWaiter={handleAssignWaiter}
                  onUpdateGuestCount={handleUpdateGuestCount}
                />
              ))}

              {filteredTables.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 bg-white">
                    <EmptyState
                      title="No tables found"
                      description="Configure your restaurant floor plan and capacity."
                      actionLabel="Add Table"
                      onAction={() => { resetForm(); setIsModalOpen(true); }}
                    />
                  </td>
                </tr>
              )}
           </tbody>
        </table>
      </div>

      {/* ─── ADD/EDIT TABLE MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1630]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 border-none shadow-2xl relative bg-white flex flex-col gap-6">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div>
              <h3 className="text-2xl font-black text-[#0B1630]">{selectedTable ? 'Edit Dining Table' : 'Add Dining Table'}</h3>
              <p className="text-sm text-[#64748B] font-medium">Configure table layout and seating capacity</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Table Number / Label</label>
                <input 
                  type="text"
                  required
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
                  placeholder="e.g. 12 or Patio-3"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Guest Seating Capacity</label>
                <input 
                  type="number"
                  required
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
                  placeholder="e.g. 4"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Initial Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F97316]"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="CLEANING">CLEANING</option>
                  <option value="RESERVED">RESERVED</option>
                </select>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                {selectedTable ? (
                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete Table ${selectedTable.number}?`)) {
                        deleteTableMutation.mutate(selectedTable.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-500 font-bold text-sm transition-all cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                ) : <div />}
                
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={createTableMutation.isPending || updateTableMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm shadow-lg shadow-orange-500/20 cursor-pointer"
                  >
                    {selectedTable ? 'Save Changes' : 'Add Table'}
                  </button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Tables;
