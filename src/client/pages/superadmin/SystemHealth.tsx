import { Activity, Database, Zap, HardDrive, ChevronRight, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';

const anomalies = [
  { title: 'LATENCY SPIKE DETECTED', source: 'CLUSTER BH-09', time: '02M AGO', status: 'MITIGATED', statusColor: 'emerald', dotColor: 'bg-red-500' },
  { title: 'DB CONN STABILIZED', source: 'NEON PROCTOR-X', time: '14M AGO', status: 'RESOLVED', statusColor: 'emerald', dotColor: 'bg-emerald-500' },
  { title: 'MEMORY PURGE EXECUTED', source: 'SYSTEM CORE', time: '01H AGO', status: 'COMPLETE', statusColor: 'emerald', dotColor: 'bg-orange-500' },
  { title: 'API GATEWAY CALIBRATED', source: 'GLOBAL GATEWAY', time: '03H AGO', status: 'ACTIVE', statusColor: 'emerald', dotColor: 'bg-emerald-500' },
];

const resources = [
  { name: 'COMPUTE ALLOC', value: 65, color: 'bg-blue-500' },
  { name: 'STORAGE PERSIST', value: 42, color: 'bg-orange-500' },
  { name: 'NETWORK LOAD', value: 12, color: 'bg-emerald-500' },
  { name: 'SYSTEM ENTROPY', value: 18, color: 'bg-blue-500' },
];

export const SystemHealth = () => {
  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Observability Nexus</h1>
          <p className="text-[#94A3B8] mt-1 text-sm font-medium">Real-time cluster health and latency telemetry</p>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> System Nominal
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-indigo-400"><Activity size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">DB Resonance</p>
              <h3 className="text-3xl font-bold text-white">98%</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-4 z-10 relative">Stable</p>
          <svg className="absolute bottom-1 right-2 w-20 h-10 opacity-30 text-indigo-400" viewBox="0 0 100 50" fill="none"><path d="M0,30 Q25,10 50,30 T100,20" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-emerald-400"><Database size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Cache Sync</p>
              <h3 className="text-3xl font-bold text-white">14ms</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-4 z-10 relative">Optimal</p>
          <svg className="absolute bottom-1 right-2 w-20 h-10 opacity-30 text-emerald-400" viewBox="0 0 100 50" fill="none"><path d="M0,35 Q25,15 50,25 T100,15" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-[#F97316]"><Zap size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">API Thru-Put</p>
              <h3 className="text-3xl font-bold text-white">4.2k</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-[#F97316] uppercase tracking-wider mt-4 z-10 relative">Req/s</p>
          <svg className="absolute bottom-1 right-2 w-20 h-10 opacity-30 text-orange-400" viewBox="0 0 100 50" fill="none"><path d="M0,40 Q25,20 50,35 T100,10" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-blue-400"><HardDrive size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Memory Load</p>
              <h3 className="text-3xl font-bold text-white">24%</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-4 z-10 relative">Efficient</p>
          <svg className="absolute bottom-1 right-2 w-20 h-10 opacity-30 text-blue-400" viewBox="0 0 100 50" fill="none"><path d="M0,35 Q25,25 50,30 T100,25" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Detection Log */}
        <Card className="lg:col-span-2 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
          <div className="p-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#94A3B8]" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Anomaly Detection Log</h3>
            </div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
              <Activity size={12} /> Pulse Sweep
            </span>
          </div>
          <div className="divide-y divide-[#232B5E]/30">
            {anomalies.map((a, i) => (
              <div key={i} className="px-6 py-5 flex items-center justify-between hover:bg-[#1E293B]/40 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", a.dotColor)} />
                  <div>
                    <p className="font-bold text-sm text-white">{a.title}</p>
                    <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{a.source} • {a.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">{a.status}</span>
                  <ChevronRight size={14} className="text-[#94A3B8]" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resource Allocation + Protection */}
        <div className="space-y-6">
          <Card className="border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
            <div className="p-6 pb-4 flex items-center gap-2">
              <HardDrive size={18} className="text-[#94A3B8]" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Resource Allocation</h3>
            </div>
            <div className="px-6 pb-6 space-y-5">
              {resources.map((r) => (
                <div key={r.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">{r.name}</span>
                    <span className="font-bold text-sm text-white">{r.value}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", r.color)} style={{ width: `${r.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
            <ShieldCheck size={22} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-400 uppercase tracking-wider">Active Protection</p>
              <p className="text-white font-bold text-lg">THREAT SECURED</p>
            </div>
          </div>

          <Card className="border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
            <button className="w-full p-4 flex items-center justify-between text-sm font-bold text-white hover:bg-[#1E293B]/80 transition-colors rounded-2xl">
              <span className="uppercase tracking-wider text-xs">Access System Logs</span>
              <ChevronRight size={16} className="text-[#94A3B8]" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
