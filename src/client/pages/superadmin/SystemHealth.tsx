import { Activity, Database, HardDrive, ChevronRight, ShieldCheck, Server, Key, Users } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { SystemHealthService } from '../../services/ApiService';
import { formatDistanceToNow } from 'date-fns';

export const SystemHealth = () => {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['systemHealthMetrics'],
    queryFn: SystemHealthService.getHealthMetrics,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['systemAuditEvents'],
    queryFn: () => SystemHealthService.getRecentAuditEvents(10),
    refetchInterval: 30000,
  });

  const isHealthy = metrics && metrics.latency_ms < 500;
  
  // Format Storage
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEventStatusColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('delete') || actionLower.includes('fail') || actionLower.includes('remove')) return 'bg-red-500';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Observability Nexus</h1>
          <p className="text-[#94A3B8] mt-1 text-sm font-medium">Real-time cluster health and latency telemetry</p>
        </div>
        {metricsLoading ? (
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Connecting...
          </span>
        ) : isHealthy ? (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
          </span>
        ) : (
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Partial Degradation
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-indigo-400"><Activity size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Active DB Conns</p>
              <h3 className="text-3xl font-bold text-white">
                {metricsLoading ? '...' : metrics?.active_connections ?? 'Unavailable'}
              </h3>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-4 z-10 relative">Stable</p>
          <svg className="absolute bottom-1 right-2 w-20 h-10 opacity-30 text-indigo-400" viewBox="0 0 100 50" fill="none"><path d="M0,30 Q25,10 50,30 T100,20" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-emerald-400"><Database size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">DB Latency</p>
              <h3 className="text-3xl font-bold text-white">
                {metricsLoading ? '...' : metrics?.latency_ms ? `${Math.round(metrics.latency_ms)}ms` : 'Unavailable'}
              </h3>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-4 z-10 relative">
            {metrics?.latency_ms && metrics.latency_ms < 100 ? 'Optimal' : 'Checking'}
          </p>
          <svg className="absolute bottom-1 right-2 w-20 h-10 opacity-30 text-emerald-400" viewBox="0 0 100 50" fill="none"><path d="M0,35 Q25,15 50,25 T100,15" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-[#F97316]"><Server size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Vercel Status</p>
              <h3 className="text-xl font-bold text-white mt-1">Unavailable</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-[#F97316] uppercase tracking-wider mt-4 z-10 relative">No APM Token</p>
          <svg className="absolute bottom-1 right-2 w-20 h-10 opacity-30 text-orange-400" viewBox="0 0 100 50" fill="none"><path d="M0,40 Q25,20 50,35 T100,10" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-blue-400"><Users size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Active Tenants</p>
              <h3 className="text-3xl font-bold text-white">
                {metricsLoading ? '...' : metrics?.active_restaurants ?? 'Unavailable'}
              </h3>
            </div>
          </div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-4 z-10 relative">
            {metrics?.today_new_registrations ? `+${metrics.today_new_registrations} Today` : 'Online'}
          </p>
          <svg className="absolute bottom-1 right-2 w-20 h-10 opacity-30 text-blue-400" viewBox="0 0 100 50" fill="none"><path d="M0,35 Q25,25 50,30 T100,25" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Detection Log -> Platform Audit Log */}
        <Card className="lg:col-span-2 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
          <div className="p-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Key size={18} className="text-[#94A3B8]" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Platform Audit Log</h3>
            </div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
              <Activity size={12} className={eventsLoading ? 'animate-spin' : ''} /> Live Feed
            </span>
          </div>
          <div className="divide-y divide-[#232B5E]/30">
            {eventsLoading ? (
              <div className="px-6 py-8 text-center text-[#94A3B8] text-sm">Loading audit events...</div>
            ) : events && events.length > 0 ? (
              events.map((a: any, i: number) => (
                <div key={i} className="px-6 py-5 flex items-center justify-between hover:bg-[#1E293B]/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", getEventStatusColor(a.action))} />
                    <div>
                      <p className="font-bold text-sm text-white">{a.action} {a.entity}</p>
                      <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                        {a.userName} • {a.role} • {formatDistanceToNow(new Date(a.createdAt))} ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">LOGGED</span>
                    <ChevronRight size={14} className="text-[#94A3B8]" />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-[#94A3B8] text-sm">No recent events found.</div>
            )}
          </div>
        </Card>

        {/* Resource Allocation + Protection */}
        <div className="space-y-6">
          <Card className="border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
            <div className="p-6 pb-4 flex items-center gap-2">
              <HardDrive size={18} className="text-[#94A3B8]" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Platform Resources</h3>
            </div>
            <div className="px-6 pb-6 space-y-5">
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Total Tenants</span>
                  <span className="font-bold text-sm text-white">{metrics?.total_tenants ?? 0}</span>
                </div>
                <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Trial Accounts</span>
                  <span className="font-bold text-sm text-white">{metrics?.trial_accounts ?? 0}</span>
                </div>
                <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: metrics?.total_tenants ? `${(metrics.trial_accounts / metrics.total_tenants) * 100}%` : '0%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Paused Subscriptions</span>
                  <span className="font-bold text-sm text-white">{metrics?.paused_subscriptions ?? 0}</span>
                </div>
                <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: metrics?.total_tenants ? `${(metrics.paused_subscriptions / metrics.total_tenants) * 100}%` : '0%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">DB Storage Used</span>
                  <span className="font-bold text-sm text-white">
                    {metrics ? formatBytes(metrics.storage_usage_bytes) : 'Unavailable'}
                  </span>
                </div>
                <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '10%' }} />
                </div>
              </div>

            </div>
          </Card>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
            <ShieldCheck size={22} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-400 uppercase tracking-wider">Active Protection</p>
              <p className="text-white font-bold text-lg">DB SECURED</p>
            </div>
          </div>

          <Card className="border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
            <button className="w-full p-4 flex items-center justify-between text-sm font-bold text-white hover:bg-[#1E293B]/80 transition-colors rounded-2xl cursor-pointer">
              <span className="uppercase tracking-wider text-xs">Access System Logs</span>
              <ChevronRight size={16} className="text-[#94A3B8]" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
