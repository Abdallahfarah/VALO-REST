import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical,
  Clock,
  ChevronRight,
  X,
  User,
  PenSquare,
  KeyRound,
  PauseCircle,
  PlayCircle,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { cn } from '../../lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StaffService, SuperAdminService } from '../services/ApiService';
import { useTenant } from '../context/TenantContext';
import { SubscriptionService } from '../services/SubscriptionService';
import { UpgradeDialog } from '../components/UpgradeDialog';
import { toast } from '../lib/toast-store';
import { supabase } from '../../lib/supabase';
import { useSessionStore } from '../lib/session-store';

// ─── Memoized StaffRow Component ───
interface StaffRowProps {
  staff: any;
  roleColor: string;
  onMenuOpen: (staff: any, triggerElement: HTMLButtonElement) => void;
}

const StaffRow = React.memo(({ staff, roleColor, onMenuOpen }: StaffRowProps) => {
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
        <span className={cn(
          "text-[10px] font-bold flex items-center gap-1.5",
          staff.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'
        )}>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            staff.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
          )} /> {staff.status}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <button 
          onClick={(e) => onMenuOpen(staff, e.currentTarget)}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0B1630] hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  );
});

StaffRow.displayName = 'StaffRow';

// ─── Floating Context Action Menu ───
interface StaffActionMenuProps {
  staff: any;
  anchorRect: DOMRect;
  onClose: () => void;
  onAction: (action: string, staff: any) => void;
}

const StaffActionMenu = ({ staff, anchorRect, onClose, onAction }: StaffActionMenuProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [coords, setCoords] = useState({ top: 0, left: 0, align: 'right', isUp: false });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const menuWidth = 250;
    const menuHeight = 280;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let leftPos = anchorRect.right + window.scrollX - menuWidth;
    let align = 'right';

    if (leftPos < 0) {
      leftPos = anchorRect.left + window.scrollX;
      align = 'left';
    }

    if (leftPos + menuWidth > viewportWidth) {
      leftPos = Math.max(16, viewportWidth - menuWidth - 16);
    }

    let topPos = anchorRect.bottom + window.scrollY + 8;
    let isUp = false;

    if (anchorRect.bottom + menuHeight > viewportHeight) {
      topPos = anchorRect.top + window.scrollY - menuHeight - 8;
      isUp = true;
    }

    setCoords({ top: topPos, left: leftPos, align, isUp });
  }, [anchorRect, isMobile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[999] flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div 
          className="bg-white rounded-t-[30px] p-6 w-full max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
          
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-[#0B1630] flex items-center justify-center text-white font-bold">
              {staff.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
            </div>
            <div>
              <h4 className="font-bold text-[#0B1630]">{staff.name}</h4>
              <p className="text-xs text-[#94A3B8]">{staff.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => { onAction('view', staff); onClose(); }}
              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B1630]">View Profile</p>
                <p className="text-xs text-[#94A3B8]">View employee information</p>
              </div>
            </button>

            <button 
              onClick={() => { onAction('edit', staff); onClose(); }}
              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <PenSquare size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B1630]">Edit Staff</p>
                <p className="text-xs text-[#94A3B8]">Update employee details</p>
              </div>
            </button>

            <button 
              onClick={() => { onAction('reset-password', staff); onClose(); }}
              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <KeyRound size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B1630]">Reset Password</p>
                <p className="text-xs text-[#94A3B8]">Send password reset link</p>
              </div>
            </button>

            <button 
              onClick={() => { onAction('toggle-active', staff); onClose(); }}
              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
            >
              {staff.status === 'INACTIVE' ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <PlayCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-600">Activate Staff</p>
                    <p className="text-xs text-[#94A3B8]">Restore account access</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <PauseCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-600">Suspend Staff</p>
                    <p className="text-xs text-[#94A3B8]">Temporarily disable access</p>
                  </div>
                </>
              )}
            </button>

            <button 
              onClick={() => { onAction('delete', staff); onClose(); }}
              className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-red-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-red-500">Delete Staff</p>
                <p className="text-xs text-red-400/80">Remove staff permanently</p>
              </div>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      
      <div 
        style={{ top: coords.top, left: coords.left }}
        className="absolute w-[250px] bg-white rounded-[14px] p-2 border border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-[999] animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right focus-within:outline-none"
      >
        {!coords.isUp && (
          <div className={cn(
            "absolute -top-1.5 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45",
            coords.align === 'right' ? 'right-6' : 'left-6'
          )} />
        )}
        {coords.isUp && (
          <div className={cn(
            "absolute -bottom-1.5 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45",
            coords.align === 'right' ? 'right-6' : 'left-6'
          )} />
        )}
        
        <div className="flex flex-col gap-1 relative z-10 bg-white rounded-[12px] overflow-hidden">
          <button 
            onClick={() => { onAction('view', staff); onClose(); }}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <User size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B1630]">View Profile</p>
              <p className="text-[10px] text-[#94A3B8] font-medium">View employee information</p>
            </div>
          </button>

          <button 
            onClick={() => { onAction('edit', staff); onClose(); }}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <PenSquare size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B1630]">Edit Staff</p>
              <p className="text-[10px] text-[#94A3B8] font-medium">Update employee details</p>
            </div>
          </button>

          <button 
            onClick={() => { onAction('reset-password', staff); onClose(); }}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <KeyRound size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B1630]">Reset Password</p>
              <p className="text-[10px] text-[#94A3B8] font-medium">Send password reset link</p>
            </div>
          </button>

          <button 
            onClick={() => { onAction('toggle-active', staff); onClose(); }}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group cursor-pointer"
          >
            {staff.status === 'Inactive' ? (
              <>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <PlayCircle size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600">Activate Staff</p>
                  <p className="text-[10px] text-[#94A3B8] font-medium">Restore account access</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <PauseCircle size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600">Suspend Staff</p>
                  <p className="text-[10px] text-[#94A3B8] font-medium">Temporarily disable access</p>
                </div>
              </>
            )}
          </button>

          <button 
            onClick={() => { onAction('delete', staff); onClose(); }}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 transition-colors text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <Trash2 size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-500">Delete Staff</p>
              <p className="text-[10px] text-red-400/80 font-medium">Remove staff permanently</p>
            </div>
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

// ─── Main Staff Component ───
export const Staff = () => {
  const { tenant } = useTenant();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const tenantId = tenant?.id || '';
  const tenantState = useSessionStore((state) => state.getTenantState(tenantId));
  const updateTenantState = useSessionStore((state) => state.updateTenantState);

  const searchQuery = tenantState.staffSearchQuery;
  const setSearchQuery = (val: string) => updateTenantState(tenantId, { staffSearchQuery: val });

  const [newStaffForm, setNewStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'WAITER',
    preparationStation: ''
  });

  // Action Menu States
  const [activeStaffMenu, setActiveStaffMenu] = useState<{ staff: any; rect: DOMRect } | null>(null);
  const [profileStaff, setProfileStaff] = useState<any>(null);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [suspendStaff, setSuspendStaff] = useState<any>(null);
  const [deleteStaff, setDeleteStaff] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: '', role: 'WAITER', newPassword: '', preparationStation: '' });
  const [showEditPassword, setShowEditPassword] = useState(false);

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
      setNewStaffForm({ fullName: '', email: '', password: '', role: 'WAITER', preparationStation: '' });
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
        tenant.id,
        newStaffForm.role === 'KITCHEN_STAFF' ? (newStaffForm.preparationStation || 'Chef') : undefined
      );
      toast.success('Staff Created', `${newStaffForm.fullName} has been provisioned successfully.`);
      queryClient.invalidateQueries({ queryKey: ['staff', tenant.id] });
      setIsAddingStaff(false);
      setNewStaffForm({ fullName: '', email: '', password: '', role: 'WAITER', preparationStation: '' });
    } catch (err: any) {
      const msg = err.message || '';
      const title = msg.includes('already exists') || msg.includes('exists') ? 'Email Already Exists'
                  : msg.includes('weak') || msg.includes('password') ? 'Password Too Weak'
                  : msg.includes('invalid email') || msg.includes('format') ? 'Invalid Email'
                  : msg.includes('permission') || msg.includes('Unauthorized') ? 'Permission Denied'
                  : msg.includes('station') ? 'Invalid Preparation Station'
                  : msg.includes('Restaurant not found') || msg.includes('tenant') ? 'Restaurant Not Found'
                  : 'Provisioning Failed';
      toast.error(title, msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenuOpen = React.useCallback((staff: any, element: HTMLButtonElement) => {
    setActiveStaffMenu({
      staff,
      rect: element.getBoundingClientRect()
    });
  }, []);

  const handleAction = (action: string, staff: any) => {
    if (action === 'view') {
      setProfileStaff(staff);
    } else if (action === 'edit') {
      setEditStaff(staff);
      setEditForm({ fullName: staff.name, role: staff.role, newPassword: '', preparationStation: staff.preparationStation || 'Chef' });
      setShowEditPassword(false);
    } else if (action === 'reset-password') {
      handleResetPassword(staff.email);
    } else if (action === 'toggle-active') {
      if (staff.status === 'Active') {
        setSuspendStaff(staff);
      } else {
        handleActivateStaff(staff);
      }
    } else if (action === 'delete') {
      setDeleteStaff(staff);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await SuperAdminService.resetUserPassword(email);
      toast.success('Reset Email Sent', `A password reset link has been sent to ${email}.`);
    } catch (err: any) {
      toast.error('Reset Failed', err.message);
    }
  };

  const handleActivateStaff = async (staff: any) => {
    try {
      await SuperAdminService.toggleUserActive(staff.id, true);
      toast.success('Staff Activated', `${staff.name} has been reactivated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['staff', tenant?.id] });
    } catch (err: any) {
      toast.error('Activation Failed', err.message);
    }
  };

  const handleSuspendStaff = async () => {
    if (!suspendStaff) return;
    try {
      await SuperAdminService.toggleUserActive(suspendStaff.id, false);
      toast.success('Staff Suspended', `${suspendStaff.name} is now suspended.`);
      queryClient.invalidateQueries({ queryKey: ['staff', tenant?.id] });
      setSuspendStaff(null);
    } catch (err: any) {
      toast.error('Suspension Failed', err.message);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteStaff) return;
    try {
      toast.error('Deletion Restricted', 'Staff accounts cannot be permanently deleted to preserve historical audit logs and orders history. Please suspend the account instead.');
      setDeleteStaff(null);
    } catch (err: any) {
      toast.error('Deletion Failed', err.message);
    }
  };

  const handleEditStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaff) return;

    // Validate new password length if provided
    if (editForm.newPassword && editForm.newPassword.length < 6) {
      toast.error('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const first = editForm.fullName.split(' ')[0] || '';
      const last = editForm.fullName.split(' ').slice(1).join(' ') || '';
      const { error } = await supabase
        .from('users')
        .update({
          first_name: first,
          last_name: last,
          role: editForm.role,
          preparation_station: editForm.role === 'KITCHEN_STAFF' ? (editForm.preparationStation || 'Chef') : null
        })
        .eq('id', editStaff.id);

      if (error) throw error;

      // Only update password if the admin entered a new one
      if (editForm.newPassword.trim()) {
        await SuperAdminService.updateStaffPassword(editStaff.id, editForm.newPassword, tenant?.id || '');
      }

      toast.success('Staff Updated', `${editForm.fullName} has been updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['staff', tenant?.id] });
      setEditStaff(null);
    } catch (err: any) {
      toast.error('Update Failed', err.message);
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
      staff.role?.toLowerCase().includes(q) ||
      staff.preparationStation?.toLowerCase().includes(q) ||
      staff.status?.toLowerCase().includes(q)
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
                  setNewStaffForm({ fullName: '', email: '', password: '', role: 'WAITER', preparationStation: '' });
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
                  onChange={e => setNewStaffForm(prev => ({ 
                    ...prev, 
                    role: e.target.value,
                    preparationStation: e.target.value === 'KITCHEN_STAFF' ? (prev.preparationStation || 'Chef') : ''
                  }))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316] bg-white cursor-pointer"
                >
                  <option value="WAITER">Waiter</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="KITCHEN_STAFF">Kitchen Staff</option>
                  <option value="ADMIN">Manager (Admin)</option>
                </select>
              </div>

              {newStaffForm.role === 'KITCHEN_STAFF' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#0B1630]">Preparation Station</label>
                  <select 
                    value={newStaffForm.preparationStation || 'Chef'}
                    onChange={e => setNewStaffForm(prev => ({ ...prev, preparationStation: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316] bg-white cursor-pointer"
                    required
                  >
                    <option value="Chef">Chef</option>
                    <option value="Barista">Barista</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                  </select>
                </div>
              )}


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
                      onMenuOpen={handleMenuOpen}
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

      {/* Floating Action Menu Portal */}
      {activeStaffMenu && (
        <StaffActionMenu 
          staff={activeStaffMenu.staff}
          anchorRect={activeStaffMenu.rect}
          onClose={() => setActiveStaffMenu(null)}
          onAction={handleAction}
        />
      )}

      {/* Profile Modal */}
      {profileStaff && (
        <div className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 p-6 flex flex-col items-center">
            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-50 mb-6">
              <h3 className="text-base font-bold text-[#0B1630] uppercase tracking-wider">Employee Profile</h3>
              <button 
                onClick={() => setProfileStaff(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="w-20 h-20 rounded-full bg-[#0B1630] flex items-center justify-center text-white text-2xl font-bold uppercase mb-4 shadow-lg">
              {profileStaff.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
            </div>

            <h4 className="text-lg font-bold text-[#0B1630]">{profileStaff.name}</h4>
            <p className="text-xs text-[#94A3B8] font-medium mt-1">{profileStaff.email}</p>

            <span className={cn(
              "text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider mt-4",
              getRoleColor(profileStaff.role)
            )}>
              {profileStaff.role?.replace('_', ' ')}
            </span>

            <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Status</p>
                <p className={cn(
                  "text-sm font-bold mt-1",
                  profileStaff.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'
                )}>{profileStaff.status}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Section</p>
                <p className="text-sm font-bold text-[#0B1630] mt-1">{profileStaff.section || 'General'}</p>
              </div>
            </div>

            <button 
              onClick={() => setProfileStaff(null)}
              className="w-full h-11 bg-slate-100 text-[#0B1630] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors active:scale-[0.98] mt-6 cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editStaff && (
        <div className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 p-6 flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-50">
              <h3 className="text-base font-bold text-[#0B1630] uppercase tracking-wider">Edit Staff Member</h3>
              <button 
                onClick={() => setEditStaff(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditStaffSubmit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Full Name</label>
                <input 
                  value={editForm.fullName}
                  onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Email Address</label>
                <input 
                  value={editStaff.email}
                  disabled
                  type="email"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-xs focus:outline-none cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">Role</label>
                <select 
                  value={editForm.role}
                  onChange={e => setEditForm(prev => ({ 
                    ...prev, 
                    role: e.target.value,
                    preparationStation: e.target.value === 'KITCHEN_STAFF' ? (prev.preparationStation || 'Chef') : ''
                  }))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316] bg-white cursor-pointer"
                >
                  <option value="WAITER">Waiter</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="KITCHEN_STAFF">Kitchen Staff</option>
                  <option value="ADMIN">Manager (Admin)</option>
                </select>
              </div>

              {editForm.role === 'KITCHEN_STAFF' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#0B1630]">Preparation Station</label>
                  <select 
                    value={editForm.preparationStation || 'Chef'}
                    onChange={e => setEditForm(prev => ({ ...prev, preparationStation: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316] bg-white cursor-pointer"
                    required
                  >
                    <option value="Chef">Chef</option>
                    <option value="Barista">Barista</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                  </select>
                </div>
              )}


              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[#0B1630]">New Password</label>
                <div className="relative">
                  <input 
                    value={editForm.newPassword}
                    onChange={e => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Leave blank to keep current password"
                    autoComplete="new-password"
                    className="w-full h-10 px-3 pr-10 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#F97316]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1630] transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                  >
                    {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-[#94A3B8] font-medium pt-0.5">Leave blank to keep the current password unchanged.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setEditStaff(null)}
                  className="flex-1 h-11 bg-slate-100 text-[#0B1630] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-11 bg-[#F97316] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#ea580c] transition-colors shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendStaff && (
        <div className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <PauseCircle size={36} />
            </div>
            
            <h3 className="text-lg font-black text-[#0B1630]">Suspend Staff?</h3>
            <p className="text-xs text-[#94A3B8] font-medium mt-2 leading-relaxed px-4 text-center">
              This staff member will no longer be able to access the restaurant system until reactivated.
            </p>

            <div className="flex gap-3 w-full mt-6">
              <button 
                type="button"
                onClick={() => setSuspendStaff(null)}
                className="flex-1 h-11 bg-slate-100 text-[#0B1630] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSuspendStaff}
                className="flex-1 h-11 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteStaff && (
        <div className="fixed inset-0 bg-[#0B1630]/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Trash2 size={36} />
            </div>
            
            <h3 className="text-lg font-black text-[#0B1630]">Delete Staff?</h3>
            <p className="text-xs text-[#94A3B8] font-medium mt-2 leading-relaxed px-4 text-center">
              This action cannot be undone.
            </p>

            <div className="flex gap-3 w-full mt-6">
              <button 
                type="button"
                onClick={() => setDeleteStaff(null)}
                className="flex-1 h-11 bg-slate-100 text-[#0B1630] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteStaff}
                className="flex-1 h-11 bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
