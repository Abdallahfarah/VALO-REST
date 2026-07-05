import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Store, 
  ShieldCheck, 
  Database, 
  Zap, 
  HardDrive, 
  BarChart, 
  Server 
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { SuperAdminService } from '../../services/ApiService';

export const Overview = () => {
  // ─── Query Super Admin Stats ───
  const { data: stats } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: () => SuperAdminService.getOverviewStats(),
  });

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Platform Overview</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Real-time SAAS orchestration and platform intelligence.</p>
        </div>
        <div className="text-emerald-500 font-semibold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> v4.2.0-STABLE
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* PLATFORM REVENUE */}
        <Card className="p-6 pb-4 flex flex-col justify-between overflow-hidden relative border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-start justify-between z-10 w-full mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316]">
                <BarChart strokeWidth={2.5} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Platform Revenue</p>
                <h3 className="text-3xl font-bold text-[#0B1630] tracking-tight">
                  ${(stats?.totalRevenue ?? 0).toFixed(2)}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold z-10 w-full mt-auto">
             <span className="text-[#94A3B8]">MRR (Active Plans)</span>
             <span className="flex items-center text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">↑ Live</span>
          </div>
          <svg className="absolute bottom-0 left-0 w-full h-[60px] opacity-20 text-[#F97316] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 L0,80 Q25,90 50,70 T100,50 L100,100 Z" fill="currentColor" />
             <path d="M0,80 Q25,90 50,70 T100,50" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
        </Card>

        {/* ACTIVE SUBSCRIPTIONS */}
        <Card className="p-6 pb-4 flex flex-col justify-between overflow-hidden relative border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-start justify-between z-10 w-full mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                <Users strokeWidth={2.5} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Active Subscriptions</p>
                <h3 className="text-3xl font-bold text-[#0B1630] tracking-tight">
                  {stats?.activeSubsCount ?? 0}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold z-10 w-full mt-auto">
             <span className="text-[#94A3B8]">Current Tenants</span>
             <span className="flex items-center text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest text-[9px]">Valid</span>
          </div>
          <svg className="absolute bottom-0 left-0 w-full h-[60px] opacity-20 text-blue-500 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 L0,70 Q25,60 50,80 T100,60 L100,100 Z" fill="currentColor" />
             <path d="M0,70 Q25,60 50,80 T100,60" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
        </Card>

        {/* ISOLATED TENANTS */}
        <Card className="p-6 pb-4 flex flex-col justify-between overflow-hidden relative border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-start justify-between z-10 w-full mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Store strokeWidth={2.5} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Isolated Tenants</p>
                <h3 className="text-3xl font-bold text-[#0B1630] tracking-tight">
                  {stats?.tenantCount ?? 0}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold z-10 w-full mt-auto">
             <span className="text-[#94A3B8]">Provisioned</span>
             <div className="flex flex-col items-end">
                <span className="text-emerald-500 font-bold text-[10px]">100% Isolated</span>
             </div>
          </div>
           <svg className="absolute bottom-0 left-0 w-full h-[60px] opacity-20 text-emerald-500 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 L0,85 Q25,95 50,75 T100,65 L100,100 Z" fill="currentColor" />
             <path d="M0,85 Q25,95 50,75 T100,65" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
        </Card>

        {/* ACTIVE USERS */}
        <Card className="p-6 pb-4 flex flex-col justify-between overflow-hidden relative border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-start justify-between z-10 w-full mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                <Users strokeWidth={2.5} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Global Users</p>
                <h3 className="text-3xl font-bold text-[#0B1630] tracking-tight">
                  {stats?.userCount ?? 0}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold z-10 w-full mt-auto">
             <span className="text-[#94A3B8]">Total Registered</span>
             <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">Active</span>
          </div>
          <svg className="absolute bottom-0 left-0 w-full h-[60px] opacity-20 text-purple-500 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 L0,70 Q25,85 50,70 T100,50 L100,100 Z" fill="currentColor" />
             <path d="M0,70 Q25,85 50,70 T100,50" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Global Resource Mesh */}
        <Card className="lg:col-span-2 p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                <Database size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#0B1630] leading-tight">Global Resource Mesh</h3>
                <p className="text-sm text-[#64748B] font-medium">Infrastructure performance & resource utilization</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Online</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {/* DB CORE LOAD */}
            <div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <HardDrive size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">DB Core Load</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Stable</span>
                  </div>
                  <div className="text-2xl font-bold text-[#0B1630] mb-3">~22%</div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '22%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* CACHE RATIO */}
            <div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                  <Database size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Redis Cache Hit</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Optimal</span>
                  </div>
                  <div className="text-2xl font-bold text-[#0B1630] mb-3">~99.4%</div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '99.4%' }} />
                  </div>
                </div>
              </div>
            </div>

             {/* API LATENCY */}
             <div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                  <Zap size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">API Latency</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Optimal</span>
                  </div>
                  <div className="text-2xl font-bold text-[#0B1630] mb-3">28ms</div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>
              </div>
            </div>

             {/* SECURE LOGS */}
             <div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Security State</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Encrypted</span>
                  </div>
                  <div className="text-2xl font-bold text-[#0B1630] mb-3">100%</div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Logs Summary */}
        <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col bg-white">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Server size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-[#0B1630] text-sm uppercase tracking-wider leading-none mb-1">Platform Core</h3>
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase">System Cluster</p>
                 </div>
              </div>
           </div>
           
           <div className="space-y-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-[#0B1630]">Supabase Edge Network</span>
                 </div>
                 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Operational</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-[#0B1630]">PostgreSQL Cluster</span>
                 </div>
                 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Operational</span>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};
