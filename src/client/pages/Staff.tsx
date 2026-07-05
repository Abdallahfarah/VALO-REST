import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical,
  Clock,
  ChevronRight,
  X
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StaffService, SuperAdminService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { SubscriptionService } from '../services/SubscriptionService';
import { UpgradeDialog } from '../components/UpgradeDialog';
import { toast } from '../lib/toast-store';

// ─── Memoized StaffRow Component ───
interface StaffRowProps {
  staff: any;
  roleColor: string;
}

const StaffRow = React.memo(({ staff, roleColor }: StaffRowProps) => {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#0B1630] flex items-center justify-center text-white text-xs font-bold uppercase">
          {staff.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
        </div>
        <div>
          <p className="text-sm font-bold text-[#0B1630]">{staff.name}</p>
          <p className="text-xs text-[#94A3B8] font-medium">{staff.email}</p>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className={cn(
          "text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider",
          roleColor
        )}>
          {staff.role?.replace('_', ' ')}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2 text-sm text-[#64748B] font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          {staff.section || 'General'}
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {staff.status}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <button className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-colors cursor-pointer">
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  );
});

StaffRow.displayName = 'StaffRow';

export const Staff = () => {
  const { tenant } = useTenant();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStaffForm, setNewStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'WAITER'
  });

  const queryClient = useQueryClient();

  const { data: staffMembers = [], isLoading } = useQuery({
    queryKey: ['staff', tenant?.id],
    queryFn: () => StaffService.getStaff(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'WAITER': return 'bg-blue-50 text-blue-500';
      case 'CASHIER': return 'bg-orange-50 text-orange-500';
      case 'KITCHEN_STAFF': return 'bg-green-50 text-green-500';
      case 'ADMIN': return 'bg-purple-50 text-purple-500';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleAddStaffClick = () => {
    const limit = SubscriptionService.getStaffLimit(tenant?.plan || 'PRO');
    if (staffMembers.length >= limit) {
      setShowUpgradeModal(true);
    } else {
      setNewStaffForm({ fullName: '', email: '', password: '', role: 'WAITER' });
      setIsAddingStaff(true);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;
    setIsSaving(true);
    try {
      await SuperAdminService.createTenantStaff(
        newStaffForm.email,
        newStaffForm.password,
        newStaffForm.fullName,
        newStaffForm.role,
        tenant.id
      );
      toast.success('Staff Created', `${newStaffForm.fullName} has been provisioned successfully.`);
      queryClient.invalidateQueries({ queryKey: ['staff', tenant.id] });
      setIsAddingStaff(false);
      setNewStaffForm({ fullName: '', email: '', password: '', role: 'WAITER' });
    } catch (err: any) {
      toast.error('Provisioning Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStaff = staffMembers.filter((staff: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      staff.name?.toLowerCase().includes(q) || 
      staff.email?.toLowerCase().includes(q) || 
      staff.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {showUpgradeModal && (
        <UpgradeDialog 
          feature="Add Staff Member" 
          requiredPlan="Professional" 
          onClose={() => setShowUpgradeModal(false)} 
        />
      )}

      {isAddingStaff && (
        <div className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 p-6 flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-50">
              <h3 className="text-base font-bold text-[#0B1630] uppercase tracking-wider">Add Staff Member</h3>
              <button 
                onClick={() => {
                  setIsAddingStaff(false);
                  setNewStaffForm({ fullName: '', email: '', password: '', role: 'WAITER' });
                }} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddStaffSubmit} className="mt-4 space-y-4" autoComplete="off">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Full Name</label>
                <input 
                  value={newStaffForm.fullName}
                  onChange={e => setNewStaffForm(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Email Address</label>
                <input 
                  value={newStaffForm.email}
                  onChange={e => setNewStaffForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  type="email"
                  placeholder="e.g. john@restaurant.com"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Password</label>
                <input 
                  value={newStaffForm.password}
                  onChange={e => setNewStaffForm(prev => ({ ...prev, password: e.target.value }))}
                  required
                  type="password"
                  placeholder="At least 6 characters"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Role</label>
                <select 
                  value={newStaffForm.role}
                  onChange={e => setNewStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316] bg-white cursor-pointer"
                >
                  <option value="WAITER">Waiter</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="KITCHEN_STAFF">Kitchen Staff</option>
                  <option value="ADMIN">Manager (Admin)</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full h-11 bg-[#F97316] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#ea580c] transition-colors shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer mt-6"
              >
                {isSaving ? 'Provisioning...' : 'Provision Member'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0B1630]">Staff</h1>
            <p className="text-[#64748B] mt-1 text-sm font-medium">Manage restaurant employees and permissions</p>
          </div>
          <button 
            onClick={handleAddStaffClick}
            className="bg-[#F97316] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#ea580c] transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] cursor-pointer"
          >
            <UserPlus size={18} /> Add Staff Member
          </button>
        </div>

        {/* Filter */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" 
            placeholder="Search staff members..."
          />
        </div>

        {/* Staff Table */}
        <Card className="flex-1 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col bg-white">
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Section</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-slate-100 rounded w-24" />
                          <div className="h-3 bg-slate-100 rounded w-36" />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-5 bg-slate-100 rounded w-16" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 bg-slate-100 rounded w-16" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 bg-slate-100 rounded w-12" />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="h-4 bg-slate-100 rounded w-4 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-xs text-slate-400 font-bold uppercase tracking-wider">No staff members found</td>
                  </tr>
                ) : (
                  filteredStaff.map((staff: any) => (
                    <StaffRow 
                      key={staff.id} 
                      staff={staff} 
                      roleColor={getRoleColor(staff.role)} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-[#94A3B8] font-medium">Showing {filteredStaff.length} of {staffMembers.length} staff members</span>
            <div className="flex items-center gap-2">
               <button className="p-1 rounded bg-slate-100 text-slate-400 cursor-not-allowed"><ChevronRight size={16} className="rotate-180" /></button>
               <button className="w-6 h-6 rounded bg-[#0B1630] text-white text-xs font-bold shadow-sm">1</button>
               <button className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Detail Panel */}
      <div className="w-[340px] shrink-0 space-y-6">
        {/* Team Summary */}
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#0B1630] flex items-center justify-center text-white">
                 <Users size={20} />
              </div>
              <div>
                 <h3 className="font-bold text-[#0B1630] text-sm">Team Summary</h3>
                 <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Workforce at a glance</p>
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-[#64748B] font-medium">Total Staff</span>
                 <span className="text-[#0B1630] font-black">{staffMembers.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-emerald-500 font-bold">Headcount Active</span>
                 <span className="text-emerald-500 font-black">{staffMembers.filter((s: any) => s.status !== 'INACTIVE').length}</span>
              </div>

              <div className="pt-4 space-y-3 border-t border-slate-50">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500" />
                       <span className="text-xs text-[#64748B] font-medium">Waiters</span>
                    </div>
                    <span className="text-xs font-bold text-[#0B1630]">{staffMembers.filter((s: any) => s.role === 'WAITER').length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-xs text-[#64748B] font-medium">Kitchen</span>
                    </div>
                    <span className="text-xs font-bold text-[#0B1630]">{staffMembers.filter((s: any) => s.role === 'KITCHEN_STAFF').length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-orange-500" />
                       <span className="text-xs text-[#64748B] font-medium">Cashiers</span>
                    </div>
                    <span className="text-xs font-bold text-[#0B1630]">{staffMembers.filter((s: any) => s.role === 'CASHIER').length}</span>
                 </div>
              </div>
           </div>
        </Card>

        {/* Operational Load */}
        <div className="bg-[#0B1630] rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-xl shadow-[#0B1630]/20">
           <div className="z-10">
              <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black tracking-[0.2em] uppercase mb-4">
                 <Clock size={16} /> Operational Load
              </div>
              <h2 className="text-6xl font-black text-white">94%</h2>
              <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest mt-2">System performance is optimal</p>
           </div>
           
           <div className="absolute -right-8 -bottom-8 opacity-10">
              <Users size={180} className="text-white" />
           </div>
           
           <div className="z-10 mt-6">
              <div className="h-1.5 w-full bg-[#1A2A52] rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
