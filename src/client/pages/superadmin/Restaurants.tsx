import { useState, useEffect, useRef } from 'react';
import { 
  Search, MoreHorizontal, Store, Server, AlertTriangle, ShieldAlert, Network,
  Mail, Phone, MapPin, Calendar, DollarSign, Users, UserPlus,
  Plus, Trash2, Edit2, Activity, CheckCircle2, XCircle, ExternalLink,
  Download, Eye, Settings, X, AlertCircle, RefreshCw
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SuperAdminService } from '../../services/ApiService';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast-store';
import { generateRestaurantReportPackage } from '../../lib/restaurant-report-engine';

const filters = ['ALL', 'ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED'];

export const Restaurants = () => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuTenantId, setOpenMenuTenantId] = useState<string | null>(null);
  
  // Modal states
  const [activePanel, setActivePanel] = useState<'DETAILS' | 'EDIT' | 'STAFF' | 'ADD_STAFF' | 'SUBSCRIPTION' | 'UPGRADE' | 'EXTEND' | 'LOGS' | 'DELETE' | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [exportModalTenant, setExportModalTenant] = useState<any>(null);

  const queryClient = useQueryClient();
  const { setImpersonatedTenantId } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: tenants = [], refetch } = useQuery({
    queryKey: ['superadmin-tenants'],
    queryFn: () => SuperAdminService.getTenantsList(),
  });

  // Handle outside clicks and ESC key to close dropdowns
  useEffect(() => {
    const handleClose = (e: MouseEvent) => {
      if (openMenuTenantId && !(e.target as HTMLElement).closest('.actions-dropdown-container')) {
        setOpenMenuTenantId(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuTenantId(null);
      }
    };
    document.addEventListener('click', handleClose);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClose);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openMenuTenantId]);

  const filteredTenants = tenants.filter((t: any) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    const sub = t.subscriptions?.[0];
    const subStatus = sub?.status || 'NONE';
    const matchesFilter = activeFilter === 'ALL' || subStatus === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const activeCount = tenants.filter((t: any) => t.subscriptions?.[0]?.status === 'ACTIVE').length;
  const trialCount = tenants.filter((t: any) => t.subscriptions?.[0]?.status === 'TRIAL').length;

  // --- MUTATIONS ---
  const toggleTenantMutation = useMutation({
    mutationFn: ({ tenantId, isActive }: { tenantId: string; isActive: boolean }) => 
      SuperAdminService.toggleTenantActive(tenantId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
      toast.success(
        variables.isActive ? 'Restaurant Activated' : 'Restaurant Suspended', 
        `Operation succeeded for tenant.`
      );
    },
    onError: (err: any) => {
      toast.error('Action Failed', err.message || 'Could not update tenant state.');
    }
  });

  // Safe Impersonation trigger
  const handleImpersonate = (tenantId: string, redirectPath: string) => {
    setImpersonatedTenantId(tenantId);
    toast.success('Impersonation Active', 'Successfully switched tenant workspace preview.');
    // Redirect to requested path inside admin context
    window.location.href = redirectPath;
  };

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold lg:text-[#0B1630] text-white">Restaurant Management</h1>
          <p className="text-[#94A3B8] mt-1 text-sm font-medium">High-speed tenant controls and lifecycle management</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="text-xs font-bold text-[#F97316] bg-[#131A38]/70 hover:bg-[#1E293B] px-3.5 py-2 rounded-xl border border-[#232B5E]/50 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-lg transition-all"
        >
          <RefreshCw size={12} className="animate-spin-hover" />
          Refresh Nodes ({tenants.length})
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><Network size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Topology</p>
              <h3 className="text-3xl font-bold lg:text-[#0B1630] text-white">{tenants.length}</h3>
            </div>
          </div>
          <div className="mt-4 h-1 w-12 bg-indigo-500 rounded-full" />
        </Card>
        <Card className="p-6 lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><Server size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Active Nodes</p>
              <h3 className="text-3xl font-bold lg:text-[#0B1630] text-white">{activeCount}</h3>
            </div>
          </div>
          <div className="mt-4 h-1 w-12 bg-emerald-500 rounded-full" />
        </Card>
        <Card className="p-6 lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400"><AlertTriangle size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Trial Mode</p>
              <h3 className="text-3xl font-bold lg:text-[#0B1630] text-white">{trialCount}</h3>
            </div>
          </div>
          <div className="mt-4 h-1 w-12 bg-orange-500 rounded-full" />
        </Card>
        <Card className="p-6 lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"><ShieldAlert size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">System Alerts</p>
              <h3 className="text-3xl font-bold lg:text-[#0B1630] text-white">0</h3>
            </div>
          </div>
          <div className="mt-4 h-1 w-12 bg-red-500 rounded-full" />
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#232B5E]/30 text-xs lg:bg-white bg-[#1E293B] text-white lg:text-[#0B1630] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F97316] transition-all"
              placeholder="Filter by name or slug..."
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                  activeFilter === f
                    ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/20"
                    : "text-[#94A3B8] lg:bg-white bg-[#1E293B]/70 border border-[#232B5E]/30 hover:text-white hover:border-[#F97316]/50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232B5E]/30 lg:border-slate-100 bg-slate-50/20 lg:bg-slate-50/30">
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Node Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Deployed</th>
                <th className="text-right px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232B5E]/20 lg:divide-slate-50">
              {filteredTenants.map((r: any) => {
                const sub = r.subscriptions?.[0];
                const planName = sub?.plans?.name || 'No Plan';
                const status = sub?.status || 'NONE';
                const isMenuOpen = openMenuTenantId === r.id;

                return (
                  <tr key={r.id} className="hover:bg-[#1E293B]/40 lg:hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl lg:bg-slate-100 bg-[#1E293B] border border-[#232B5E]/30 flex items-center justify-center text-[#94A3B8] shrink-0">
                          {r.logo ? (
                            <img 
                              src={r.logo} 
                              alt="Logo" 
                              className="w-full h-full object-cover rounded-xl" 
                              loading="lazy"
                              decoding="async"
                              width={40}
                              height={40}
                            />
                          ) : (
                            <Store size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold lg:text-[#0B1630] text-white text-sm">{r.name}</p>
                          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">/{r.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 w-fit",
                        status === 'ACTIVE' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 lg:text-emerald-600 lg:bg-emerald-50 lg:border-emerald-100" :
                        status === 'TRIAL' ? "text-orange-400 bg-orange-500/10 border-orange-500/20 lg:text-orange-600 lg:bg-orange-50 lg:border-orange-100" :
                        "text-rose-400 bg-rose-500/10 border-rose-500/20 lg:text-slate-600 lg:bg-slate-50 lg:border-slate-100"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full animate-pulse",
                          status === 'ACTIVE' ? "bg-emerald-400" :
                          status === 'TRIAL' ? "bg-orange-400" : "bg-rose-400"
                        )} />
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-indigo-400 lg:text-indigo-600 bg-indigo-500/10 lg:bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-500/20 lg:border-indigo-100">{planName}</span>
                    </td>
                    <td className="px-6 py-5 text-sm lg:text-[#0B1630] text-white/90 font-medium">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right relative actions-dropdown-container">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuTenantId(isMenuOpen ? null : r.id);
                        }}
                        className="w-9 h-9 rounded-xl border border-[#232B5E]/50 lg:border-slate-200 bg-[#1E293B]/70 lg:bg-white flex items-center justify-center text-[#94A3B8] hover:text-white lg:hover:text-[#0B1630] hover:bg-[#1E293B] transition-colors ml-auto cursor-pointer"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* --- DROPDOWN popover --- */}
                      {isMenuOpen && (
                        <div 
                          ref={dropdownRef}
                          className="absolute right-6 mt-2 w-64 bg-[#131A38] lg:bg-white rounded-xl shadow-2xl border border-[#232B5E]/50 lg:border-slate-100 z-50 py-2 text-left animate-in fade-in slide-in-from-top-1 duration-150 text-white lg:text-[#0B1630]"
                        >
                          {/* Restaurant settings */}
                          <div className="px-3 py-1 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Restaurant</div>
                          <button 
                            onClick={() => { setSelectedTenant(r); setActivePanel('DETAILS'); setOpenMenuTenantId(null); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Eye size={13} /> View Details
                          </button>
                          <button 
                            onClick={() => { setSelectedTenant(r); setActivePanel('EDIT'); setOpenMenuTenantId(null); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Edit2 size={13} /> Edit Restaurant
                          </button>
                          <button 
                            onClick={() => { setOpenMenuTenantId(null); handleImpersonate(r.id, '/admin'); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Activity size={13} /> View Dashboard
                          </button>
                          <button 
                            onClick={() => { setOpenMenuTenantId(null); handleImpersonate(r.id, '/admin'); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <ExternalLink size={13} /> Open Restaurant
                          </button>
                          <button 
                            onClick={() => { setOpenMenuTenantId(null); handleImpersonate(r.id, '/admin/settings'); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Settings size={13} /> Manage Settings
                          </button>

                          <div className="border-t border-[#232B5E]/30 lg:border-slate-50 my-1" />

                          {/* Users */}
                          <div className="px-3 py-1 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Users</div>
                          <button 
                            onClick={() => { setSelectedTenant(r); setActivePanel('STAFF'); setOpenMenuTenantId(null); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Users size={13} /> View Staff
                          </button>
                          <button 
                            onClick={() => { setSelectedTenant(r); setActivePanel('ADD_STAFF'); setOpenMenuTenantId(null); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <UserPlus size={13} /> Add Staff Member
                          </button>

                          <div className="border-t border-[#232B5E]/30 lg:border-slate-50 my-1" />

                          {/* Subscriptions */}
                          <div className="px-3 py-1 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Subscription</div>
                          <button 
                            onClick={() => { setSelectedTenant(r); setActivePanel('SUBSCRIPTION'); setOpenMenuTenantId(null); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <DollarSign size={13} /> View Subscription
                          </button>
                          <button 
                            onClick={() => { setSelectedTenant(r); setActivePanel('UPGRADE'); setOpenMenuTenantId(null); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Plus size={13} /> Upgrade / Downgrade Plan
                          </button>
                          <button 
                            onClick={() => { setSelectedTenant(r); setActivePanel('EXTEND'); setOpenMenuTenantId(null); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Calendar size={13} /> Extend Trial
                          </button>
                          <button 
                            onClick={() => { 
                              setOpenMenuTenantId(null); 
                              if (confirm(`Are you sure you want to suspend the subscription for ${r.name}?`)) {
                                SuperAdminService.updateSubscription(r.id, planName, new Date().toISOString())
                                  .then(() => {
                                    toast.success('Subscription Suspended', 'The billing cycle status has been set.');
                                    queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
                                  }).catch((err) => toast.error('Error suspending subscription', err.message));
                              }
                            }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <XCircle size={13} /> Suspend Subscription
                          </button>

                          <div className="border-t border-[#232B5E]/30 lg:border-slate-50 my-1" />

                          {/* Lifecycle Status */}
                          <div className="px-3 py-1 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Status Controls</div>
                          {r.is_active ? (
                            <button 
                              onClick={() => { setOpenMenuTenantId(null); toggleTenantMutation.mutate({ tenantId: r.id, isActive: false }); }}
                              className="w-full px-4 py-2 text-xs font-semibold text-amber-400 lg:text-amber-600 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <XCircle size={13} /> Suspend Restaurant
                            </button>
                          ) : (
                            <button 
                              onClick={() => { setOpenMenuTenantId(null); toggleTenantMutation.mutate({ tenantId: r.id, isActive: true }); }}
                              className="w-full px-4 py-2 text-xs font-semibold text-emerald-400 lg:text-emerald-600 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 size={13} /> Activate Restaurant
                            </button>
                          )}
                          <button 
                            onClick={() => { 
                              setOpenMenuTenantId(null); 
                              if (confirm(`Are you sure you want to archive ${r.name}? This will block active requests but safely preserve all database topology.`)) {
                                toggleTenantMutation.mutate({ tenantId: r.id, isActive: false });
                              }
                            }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Download size={13} /> Archive Restaurant
                          </button>

                          <div className="border-t border-[#232B5E]/30 lg:border-slate-50 my-1" />

                          {/* Logs / Data */}
                          <div className="px-3 py-1 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Data Management</div>
                          <button 
                            onClick={() => { 
                              setOpenMenuTenantId(null);
                              setExportModalTenant(r);
                            }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Download size={13} /> Export Restaurant Data
                          </button>
                          <button 
                            onClick={() => { setSelectedTenant(r); setActivePanel('LOGS'); setOpenMenuTenantId(null); }}
                            className="w-full px-4 py-2 text-xs font-semibold text-slate-200 lg:text-slate-700 hover:bg-[#1E293B] lg:hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Activity size={13} /> View Activity Logs
                          </button>

                          <div className="border-t border-[#232B5E]/30 lg:border-slate-50 my-1" />

                          {/* Danger zone */}
                          <button 
                            onClick={() => { setSelectedTenant(r); setActivePanel('DELETE'); setOpenMenuTenantId(null); }}
                            className="w-full px-4 py-2 text-xs font-bold text-rose-400 lg:text-red-600 hover:bg-rose-500/10 lg:hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} /> Delete Restaurant
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- PANEL MODALS --- */}
      {activePanel && selectedTenant && (
        <ModalWrapper title={getPanelTitle(activePanel, selectedTenant)} onClose={() => { setActivePanel(null); setSelectedTenant(null); }}>
          {activePanel === 'DETAILS' && <DetailsPanel tenant={selectedTenant} />}
          {activePanel === 'EDIT' && <EditPanel tenant={selectedTenant} onClose={() => { setActivePanel(null); refetch(); }} />}
          {activePanel === 'STAFF' && <StaffPanel tenant={selectedTenant} />}
          {activePanel === 'ADD_STAFF' && <AddStaffPanel tenant={selectedTenant} onClose={() => setActivePanel('STAFF')} />}
          {activePanel === 'SUBSCRIPTION' && <SubscriptionPanel tenant={selectedTenant} />}
          {activePanel === 'UPGRADE' && <UpgradePanel tenant={selectedTenant} onClose={() => { setActivePanel(null); refetch(); }} />}
          {activePanel === 'EXTEND' && <ExtendPanel tenant={selectedTenant} onClose={() => { setActivePanel(null); refetch(); }} />}
          {activePanel === 'LOGS' && <LogsPanel tenant={selectedTenant} />}
          {activePanel === 'DELETE' && <DeletePanel tenant={selectedTenant} onClose={() => { setActivePanel(null); refetch(); }} />}
        </ModalWrapper>
      )}

      {/* --- EXPORT FORMAT SELECTION MODAL --- */}
      {exportModalTenant && (
        <ModalWrapper 
          title={`Export Reports Package — ${exportModalTenant.name}`} 
          onClose={() => setExportModalTenant(null)}
        >
          <div className="space-y-6 p-2">
            <p className="text-xs text-[#94A3B8] lg:text-[#64748B] font-medium">
              Select your desired report format to compile live operations data for <strong className="text-white lg:text-[#0B1630]">{exportModalTenant.name}</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PDF BUTTON */}
              <button
                onClick={() => {
                  const target = exportModalTenant;
                  setExportModalTenant(null);
                  generateRestaurantReportPackage({
                    tenantId: target.id,
                    tenantName: target.name,
                    currencyCode: target.currency_code || 'ETB',
                    currencySymbol: target.currency_symbol || 'ETB',
                    dateRange: 'ALL',
                    formatType: 'PDF'
                  });
                }}
                className="p-5 bg-[#1E293B]/80 lg:bg-rose-50 border border-[#232B5E]/50 lg:border-rose-200 hover:bg-[#1E293B] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 lg:bg-white flex items-center justify-center text-rose-400 lg:text-rose-600 shadow-sm group-hover:scale-105 transition-transform border border-rose-500/20">
                  <Download size={24} />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-sm text-white lg:text-[#0B1630]">PDF Report</h4>
                  <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5">Formal Print Package</p>
                </div>
              </button>

              {/* EXCEL BUTTON */}
              <button
                onClick={() => {
                  const target = exportModalTenant;
                  setExportModalTenant(null);
                  generateRestaurantReportPackage({
                    tenantId: target.id,
                    tenantName: target.name,
                    currencyCode: target.currency_code || 'ETB',
                    currencySymbol: target.currency_symbol || 'ETB',
                    dateRange: 'ALL',
                    formatType: 'EXCEL'
                  });
                }}
                className="p-5 bg-[#1E293B]/80 lg:bg-emerald-50 border border-[#232B5E]/50 lg:border-emerald-200 hover:bg-[#1E293B] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 lg:bg-white flex items-center justify-center text-emerald-400 lg:text-emerald-600 shadow-sm group-hover:scale-105 transition-transform border border-emerald-500/20">
                  <Download size={24} />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-sm text-white lg:text-[#0B1630]">Excel (.xlsx)</h4>
                  <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5">Spreadsheet Data</p>
                </div>
              </button>

              {/* CSV BUTTON */}
              <button
                onClick={() => {
                  const target = exportModalTenant;
                  setExportModalTenant(null);
                  generateRestaurantReportPackage({
                    tenantId: target.id,
                    tenantName: target.name,
                    currencyCode: target.currency_code || 'ETB',
                    currencySymbol: target.currency_symbol || 'ETB',
                    dateRange: 'ALL',
                    formatType: 'CSV'
                  });
                }}
                className="p-5 bg-[#1E293B]/80 lg:bg-slate-50 border border-[#232B5E]/50 lg:border-slate-200 hover:bg-[#1E293B] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-500/10 lg:bg-white flex items-center justify-center text-slate-300 lg:text-slate-700 shadow-sm group-hover:scale-105 transition-transform border border-slate-500/20">
                  <Download size={24} />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-sm text-white lg:text-[#0B1630]">CSV Data</h4>
                  <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5">UTF-8 Raw Data</p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#232B5E]/30 lg:border-slate-100">
              <button
                onClick={() => setExportModalTenant(null)}
                className="px-5 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white lg:bg-slate-100 lg:hover:bg-slate-200 lg:text-[#0B1630] font-bold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
};

// Helper titles
const getPanelTitle = (panel: string, tenant: any) => {
  switch (panel) {
    case 'DETAILS': return `${tenant.name} — Workspace Topology`;
    case 'EDIT': return `Modify Restaurant Parameters`;
    case 'STAFF': return `Staff Manifest — ${tenant.name}`;
    case 'ADD_STAFF': return `Provision User Credentials`;
    case 'SUBSCRIPTION': return `Billing Analytics`;
    case 'UPGRADE': return `Adjust Subscription Tier`;
    case 'EXTEND': return `Extend Demo / Trial Period`;
    case 'LOGS': return `Audit Trail — ${tenant.name}`;
    case 'DELETE': return `De-provision Node (Danger Zone)`;
    default: return '';
  }
};

// Modal Wrapper Component with ESC key support
const ModalWrapper = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-[#090D1F]/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
      <div 
        className="bg-[#131A38] border border-[#232B5E]/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#232B5E]/40 flex items-center justify-between bg-[#131A38]">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// 1. Details Panel
const DetailsPanel = ({ tenant }: { tenant: any }) => {
  const settings = tenant.restaurant_settings?.[0] || {};
  const sub = tenant.subscriptions?.[0] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#1E293B] border border-[#232B5E]/40 flex items-center justify-center text-[#94A3B8]">
          {tenant.logo ? <img src={tenant.logo} alt="Logo" className="w-full h-full object-cover rounded-2xl" loading="lazy" decoding="async" width={64} height={64} /> : <Store size={32} />}
        </div>
        <div>
          <h4 className="text-lg font-bold text-white">{tenant.name}</h4>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">UUID: {tenant.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/40 space-y-1">
          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Topology Slug</p>
          <p className="text-sm font-bold text-white font-mono">/{tenant.slug}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/40 space-y-1">
          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Workspace Node Status</p>
          <span className={cn(
            "text-xs font-bold px-2.5 py-0.5 rounded-full border inline-block",
            tenant.is_active ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"
          )}>
            {tenant.is_active ? 'ACTIVE' : 'SUSPENDED'}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/40 space-y-1">
          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Branch Directory</p>
          <p className="text-sm font-bold text-white">Main Headquarters (Primary)</p>
        </div>
        <div className="p-4 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/40 space-y-1">
          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Deployed Date</p>
          <p className="text-sm font-bold text-white">{new Date(tenant.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h5 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#232B5E]/30 pb-1">Communication Contact</h5>
        <div className="space-y-2">
          {tenant.email && <div className="flex items-center gap-2 text-sm text-[#94A3B8]"><Mail size={14} /> <span className="text-white">{tenant.email}</span></div>}
          {tenant.phone && <div className="flex items-center gap-2 text-sm text-[#94A3B8]"><Phone size={14} /> <span className="text-white">{tenant.phone}</span></div>}
          {tenant.address && <div className="flex items-center gap-2 text-sm text-[#94A3B8]"><MapPin size={14} /> <span className="text-white">{tenant.address}</span></div>}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h5 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#232B5E]/30 pb-1">Tenant Settings</h5>
        <div className="grid grid-cols-2 gap-2 text-sm text-[#94A3B8]">
          <div>Timezone: <span className="font-bold text-white">{settings.timezone || 'UTC'}</span></div>
          <div>Currency: <span className="font-bold text-white">{tenant.currency_code || 'ETB'}</span></div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h5 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#232B5E]/30 pb-1">Billing Summary</h5>
        <div className="grid grid-cols-2 gap-2 text-sm text-[#94A3B8]">
          <div>Subscription status: <span className="font-bold text-white">{sub.status || 'UNPAID'}</span></div>
          <div>Expiration Date: <span className="font-bold text-white">{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}</span></div>
        </div>
      </div>
    </div>
  );
};

// 2. Edit Panel
const EditPanel = ({ tenant, onClose }: { tenant: any; onClose: () => void }) => {
  const settings = tenant.restaurant_settings?.[0] || {};
  const [formData, setFormData] = useState({
    name: tenant.name || '',
    email: tenant.email || '',
    phone: tenant.phone || '',
    address: tenant.address || '',
    logo: tenant.logo || '',
    primary_color: tenant.primary_color || '#F97316',
    secondary_color: tenant.secondary_color || '#0B1630',
    timezone: settings.timezone || 'Africa/Addis_Ababa',
    currency: tenant.currency_code || 'ETB'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await SuperAdminService.updateTenantDetails(
        tenant.id,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          logo: formData.logo || null,
          primary_color: formData.primary_color || null,
          secondary_color: formData.secondary_color || null
        },
        {
          timezone: formData.timezone,
          currency: formData.currency,
          primary_color: formData.primary_color || null,
          secondary_color: formData.secondary_color || null
        }
      );
      toast.success('Restaurant Updated', 'Saved parameters directly to Supabase.');
      onClose();
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Restaurant Name</label>
          <input 
            value={formData.name} 
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Logo URL</label>
          <input 
            value={formData.logo} 
            onChange={e => setFormData(prev => ({ ...prev, logo: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Primary Email</label>
          <input 
            type="email"
            value={formData.email} 
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Primary Phone</label>
          <input 
            value={formData.phone} 
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
            autoComplete="off"
          />
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Address</label>
          <input 
            value={formData.address} 
            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Timezone</label>
          <select 
            value={formData.timezone} 
            onChange={e => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
          >
            <option value="UTC">UTC</option>
            <option value="EST">EST</option>
            <option value="PST">PST</option>
            <option value="GMT">GMT</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Currency</label>
          <select 
            value={formData.currency} 
            onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316] font-bold"
            required
          >
            <option value="ETB">🇪🇹 Ethiopian Birr (ETB)</option>
            <option value="USD">🇺🇸 US Dollar (USD)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Primary Color Hex</label>
          <input 
            value={formData.primary_color} 
            onChange={e => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Secondary Color Hex</label>
          <input 
            value={formData.secondary_color} 
            onChange={e => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#232B5E]/30">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[#F97316] hover:bg-[#ea580c] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-orange-500/20"
        >
          {loading ? 'Saving...' : 'Save Parameters'}
        </button>
      </div>
    </form>
  );
};

// 3. Staff Panel
const StaffPanel = ({ tenant }: { tenant: any }) => {
  const queryClient = useQueryClient();
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['tenant-staff', tenant.id],
    queryFn: () => SuperAdminService.getTenantStaff(tenant.id)
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => 
      SuperAdminService.toggleUserActive(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-staff', tenant.id] });
      toast.success('Status updated', 'User state modified.');
    },
    onError: (err: any) => {
      toast.error('Action Failed', err.message);
    }
  });

  const handleResetPassword = async (email: string) => {
    if (confirm(`Send password reset email to ${email}?`)) {
      try {
        await SuperAdminService.resetUserPassword(email);
        toast.success('Reset Email Sent', 'Supabase has dispatched the reset email.');
      } catch (err: any) {
        toast.error('Reset Failed', err.message);
      }
    }
  };

  if (isLoading) return <div className="text-center py-6 text-sm text-[#94A3B8]">Retrieving team directory...</div>;

  return (
    <div className="space-y-4">
      {staff.length === 0 ? (
        <div className="text-center py-6 text-sm text-[#94A3B8]">No staff records found.</div>
      ) : (
        <div className="space-y-2">
          {staff.map((s: any) => (
            <div key={s.id} className="p-4 rounded-xl border border-[#232B5E]/40 bg-[#1E293B]/70 flex items-center justify-between hover:bg-[#1E293B] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F97316]/20 border border-[#F97316]/30 text-[#F97316] flex items-center justify-center font-bold text-xs uppercase">
                  {s.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{s.name}</p>
                  <p className="text-[10px] text-[#94A3B8] font-medium">{s.email}</p>
                  <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-1.5 py-0.5">
                    {s.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleResetPassword(s.email)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white font-bold text-[9px] uppercase tracking-wider cursor-pointer border border-[#232B5E]/40"
                >
                  Reset Pass
                </button>
                {s.status === 'Active' ? (
                  <button 
                    onClick={() => toggleUserActiveMutation.mutate({ userId: s.id, isActive: false })}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                  >
                    Disable
                  </button>
                ) : (
                  <button 
                    onClick={() => toggleUserActiveMutation.mutate({ userId: s.id, isActive: true })}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 4. Add Staff Panel
const AddStaffPanel = ({ tenant, onClose }: { tenant: any; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'WAITER'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: 'WAITER'
    });
    setLoading(false);
    return () => {
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'WAITER'
      });
      setLoading(false);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await SuperAdminService.createTenantStaff(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role,
        tenant.id
      );
      toast.success('Staff Created', 'User registered in DB trigger context.');
      queryClient.invalidateQueries({ queryKey: ['tenant-staff', tenant.id] });
      onClose();
    } catch (err: any) {
      toast.error('Creation Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Full Name</label>
        <input 
          value={formData.fullName} 
          onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
          autoComplete="off"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Email Address</label>
        <input 
          type="email"
          value={formData.email} 
          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
          autoComplete="off"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Password</label>
        <input 
          type="password"
          value={formData.password} 
          onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
          minLength={6}
          autoComplete="new-password"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Role</label>
        <select 
          value={formData.role} 
          onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
          className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
        >
          <option value="ADMIN">ADMIN</option>
          <option value="WAITER">WAITER</option>
          <option value="CASHIER">CASHIER</option>
          <option value="KITCHEN_STAFF">KITCHEN_STAFF</option>
        </select>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#232B5E]/30 gap-2">
        <button 
          type="button" 
          onClick={onClose}
          className="bg-[#1E293B] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#334155] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[#F97316] hover:bg-[#ea580c] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-orange-500/20"
        >
          {loading ? 'Creating...' : 'Provision User'}
        </button>
      </div>
    </form>
  );
};

// 5. Subscription Panel
const SubscriptionPanel = ({ tenant }: { tenant: any }) => {
  const sub = tenant.subscriptions?.[0] || {};
  const plan = sub.plans || {};

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Active Plan</p>
          <h4 className="text-2xl font-black text-white mt-1">{plan.name || 'DEMO TRIAL'}</h4>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Price Rate</p>
          <h4 className="text-2xl font-black text-white mt-1">${plan.price || '0.00'}/mo</h4>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm border-b border-[#232B5E]/30 pb-2">
          <span className="text-[#94A3B8] font-medium">Billing status</span>
          <span className="font-bold text-white uppercase">{sub.status || 'TRIAL'}</span>
        </div>
        <div className="flex justify-between items-center text-sm border-b border-[#232B5E]/30 pb-2">
          <span className="text-[#94A3B8] font-medium">Cycle Start</span>
          <span className="font-bold text-white">{sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-sm border-b border-[#232B5E]/30 pb-2">
          <span className="text-[#94A3B8] font-medium">Next Expiration/Renewal</span>
          <span className="font-bold text-white">{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

// 6. Upgrade Plan Panel
const UpgradePanel = ({ tenant, onClose }: { tenant: any; onClose: () => void }) => {
  const sub = tenant.subscriptions?.[0] || {};
  const [selectedPlan] = useState(sub.plans?.name || 'PRO');
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + Number(days));
      await SuperAdminService.updateSubscription(tenant.id, selectedPlan, expirationDate.toISOString());
      toast.success('Subscription Updated', `Plan has been adjusted to ${selectedPlan}.`);
      onClose();
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Choose Tier</label>
        <select 
          value={selectedPlan} 
          className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none opacity-60 pointer-events-none"
          disabled
        >
          <option value="PRO">PRO ($79.00/mo)</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Duration Days (Add to expiration)</label>
        <input 
          type="number"
          value={days} 
          onChange={e => setDays(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
          required
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-[#232B5E]/30">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[#F97316] hover:bg-[#ea580c] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-orange-500/20"
        >
          {loading ? 'Applying...' : 'Apply Subscription Change'}
        </button>
      </div>
    </form>
  );
};

// 7. Extend Trial Panel
const ExtendPanel = ({ tenant, onClose }: { tenant: any; onClose: () => void }) => {
  const sub = tenant.subscriptions?.[0] || {};
  const [days, setDays] = useState('14');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentExpiry = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
      currentExpiry.setDate(currentExpiry.getDate() + Number(days));
      const planName = sub.plans?.name || 'PRO';
      await SuperAdminService.updateSubscription(tenant.id, planName, currentExpiry.toISOString());
      toast.success('Trial Extended', `Extended by ${days} days.`);
      onClose();
    } catch (err: any) {
      toast.error('Action Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Days to Add</label>
        <input 
          type="number"
          value={days} 
          onChange={e => setDays(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-[#232B5E]/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-[#F97316]"
          required
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-[#232B5E]/30">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[#F97316] hover:bg-[#ea580c] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-orange-500/20"
        >
          {loading ? 'Extending...' : 'Extend Expiry'}
        </button>
      </div>
    </form>
  );
};

// 8. Logs Panel
const LogsPanel = ({ tenant }: { tenant: any }) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['tenant-logs', tenant.id],
    queryFn: () => SuperAdminService.getTenantActivityLogs(tenant.id)
  });

  if (isLoading) return <div className="text-center py-6 text-sm text-[#94A3B8]">Loading audit trail...</div>;

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="text-center py-6 text-sm text-[#94A3B8]">No audit trail recorded.</div>
      ) : (
        <div className="space-y-3 font-mono text-[11px] max-h-[50vh] overflow-y-auto pr-2">
          {logs.map((l: any) => (
            <div key={l.id} className="p-3 bg-[#1E293B]/70 border border-[#232B5E]/40 rounded-xl flex flex-col gap-1">
              <div className="flex justify-between items-center text-[#94A3B8] font-bold">
                <span>{new Date(l.timestamp).toLocaleString()}</span>
                <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">{l.action}</span>
              </div>
              <div className="text-white font-semibold mt-1">
                Actor: {l.users?.first_name} {l.users?.last_name} ({l.users?.email})
              </div>
              <div className="text-[#94A3B8]">
                Entity: <span className="font-semibold text-white">{l.entity_type}</span> [{l.entity_id}]
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 9. Delete Panel
const DeletePanel = ({ tenant, onClose }: { tenant: any; onClose: () => void }) => {
  const [typedName, setTypedName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typedName !== tenant.name) {
      toast.error('Validation Error', 'Restaurant name does not match.');
      return;
    }
    setLoading(true);
    try {
      await SuperAdminService.deleteTenant(tenant.id);
      toast.success('Restaurant Deleted', 'Node and all sub-objects cascade deleted.');
      onClose();
    } catch (err: any) {
      toast.error('Deletion Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleDelete} className="space-y-4">
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
        <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold text-rose-400 text-xs uppercase tracking-wider">Critical Action Warning</h5>
          <p className="text-[11px] text-rose-300 font-medium mt-1 leading-relaxed">
            De-provisioning this node is irreversible. This will purge the restaurant, settings, subscriptions, categories, tables, menu items, and all user accounts associated with this tenant ID.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">
          To proceed, type the exact name of the restaurant: <strong className="text-white font-bold">{tenant.name}</strong>
        </p>
        <input 
          value={typedName} 
          onChange={e => setTypedName(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-rose-500/40 bg-[#1E293B] text-white text-sm focus:outline-none focus:border-rose-500 font-bold"
          required
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-[#232B5E]/30 gap-2">
        <button 
          type="button" 
          onClick={onClose}
          className="bg-[#1E293B] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#334155] transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading || typedName !== tenant.name}
          className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-rose-500/20"
        >
          {loading ? 'De-provisioning...' : 'Yes, Delete Restaurant'}
        </button>
      </div>
    </form>
  );
};
