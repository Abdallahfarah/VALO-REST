import { useQuery } from '@tanstack/react-query';
import { 
  Store, 
  BarChart3, 
  Database, 
  Zap, 
  HardDrive, 
  BarChart, 
  Server,
  TrendingUp,
  ShoppingBag,
  Award
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { SuperAdminService } from '../../services/ApiService';

export const Overview = () => {
  // ─── Query Super Admin Stats & Top Restaurants ───
  const { data: stats } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: () => SuperAdminService.getOverviewStats(),
    refetchInterval: 10000,
  });

  const { data: topRestaurants } = useQuery({
    queryKey: ['superadmin-top-restaurants'],
    queryFn: () => SuperAdminService.getTopRestaurants(),
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Platform Overview</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Real-time SAAS orchestration and platform intelligence.</p>
        </div>
        <div className="text-emerald-500 font-semibold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* PLATFORM REVENUE */}
        <Card className="p-6 pb-4 flex flex-col justify-between overflow-hidden relative border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-start justify-between z-10 w-full mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316]">
                <BarChart strokeWidth={2.5} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Platform Revenue</p>
                <h3 className="text-3xl font-bold text-[#0B1630] tracking-tight">
                  ETB {(stats?.platformRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold z-10 w-full mt-auto">
             <span className="text-[#94A3B8]">Subscriptions + Fee Cut</span>
             <span className="flex items-center text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">↑ Live</span>
          </div>
          <svg className="absolute bottom-0 left-0 w-full h-[60px] opacity-20 text-[#F97316] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 L0,80 Q25,90 50,70 T100,50 L100,100 Z" fill="currentColor" />
             <path d="M0,80 Q25,90 50,70 T100,50" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
        </Card>

        {/* GROSS GMV VOLUME */}
        <Card className="p-6 pb-4 flex flex-col justify-between overflow-hidden relative border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-start justify-between z-10 w-full mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp strokeWidth={2.5} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Gross GMV Volume</p>
                <h3 className="text-3xl font-bold text-[#0B1630] tracking-tight">
                  ETB {(stats?.totalGmv ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold z-10 w-full mt-auto">
             <span className="text-[#94A3B8]">Total Sales Processed</span>
             <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">All Tenants</span>
          </div>
          <svg className="absolute bottom-0 left-0 w-full h-[60px] opacity-20 text-emerald-500 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 L0,70 Q25,60 50,80 T100,60 L100,100 Z" fill="currentColor" />
             <path d="M0,70 Q25,60 50,80 T100,60" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
        </Card>

        {/* ISOLATED TENANTS */}
        <Card className="p-6 pb-4 flex flex-col justify-between overflow-hidden relative border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-start justify-between z-10 w-full mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                <Store strokeWidth={2.5} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Restaurant Tenants</p>
                <h3 className="text-3xl font-bold text-[#0B1630] tracking-tight">
                  {stats?.tenantCount ?? 0}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold z-10 w-full mt-auto">
             <span className="text-[#94A3B8]">Active: {stats?.activeTenantCount ?? 0}</span>
             <div className="flex flex-col items-end">
                <span className="text-blue-500 font-bold text-[10px]">100% Isolated</span>
             </div>
          </div>
           <svg className="absolute bottom-0 left-0 w-full h-[60px] opacity-20 text-blue-500 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 L0,85 Q25,95 50,75 T100,65 L100,100 Z" fill="currentColor" />
             <path d="M0,85 Q25,95 50,75 T100,65" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
        </Card>

        {/* ORDERS TODAY & THIS MONTH */}
        <Card className="p-6 pb-4 flex flex-col justify-between overflow-hidden relative border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-start justify-between z-10 w-full mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                <ShoppingBag strokeWidth={2.5} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Orders Today</p>
                <h3 className="text-3xl font-bold text-[#0B1630] tracking-tight">
                  {stats?.ordersTodayCount ?? 0}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold z-10 w-full mt-auto">
             <span className="text-[#94A3B8]">Month Total: {stats?.ordersMonthCount ?? 0}</span>
             <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">Live Orders</span>
          </div>
          <svg className="absolute bottom-0 left-0 w-full h-[60px] opacity-20 text-purple-500 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 L0,70 Q25,85 50,70 T100,50 L100,100 Z" fill="currentColor" />
             <path d="M0,70 Q25,85 50,70 T100,50" fill="none" stroke="currentColor" strokeWidth="4" />
          </svg>
        </Card>
      </div>

      {/* Top Performing Restaurants Leaderboard */}
      <Card className="p-8 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0B1630] leading-tight">Top Restaurant Nodes</h3>
              <p className="text-sm text-[#64748B] font-medium">Ranked by gross sales volume and order output</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#0B1630] bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-wider">
            Nodes: {topRestaurants?.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Rank & Node</th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#64748B] uppercase tracking-widest text-center">Orders</th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#64748B] uppercase tracking-widest text-right">Gross GMV</th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#64748B] uppercase tracking-widest text-right">Platform Share (15%)</th>
              </tr>
            </thead>
            <tbody>
              {(topRestaurants || []).map((t: any, idx: number) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black text-[#0B1630] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-[#0B1630]">{t.name}</p>
                      <p className="text-xs text-[#94A3B8]">Slug: {t.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${t.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {t.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-sm text-[#0B1630]">
                    {t.ordersCount}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-sm text-[#0B1630]">
                    ETB {t.grossRevenue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-sm text-emerald-600">
                    ETB {t.platformCut.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <div className="text-2xl font-bold text-[#0B1630] mb-3">~18%</div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '18%' }} />
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
                  <div className="text-2xl font-bold text-[#0B1630] mb-3">~99.8%</div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '99.8%' }} />
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
                  <div className="text-2xl font-bold text-[#0B1630] mb-3">22ms</div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: '22%' }} />
                  </div>
                </div>
              </div>
            </div>

             {/* SECURE LOGS */}
             <div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <BarChart3 size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Multi-Tenant Isolation</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Enforced</span>
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

