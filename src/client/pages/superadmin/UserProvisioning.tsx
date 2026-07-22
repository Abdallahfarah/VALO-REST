import { Server, Zap, Globe, ShieldCheck, Copy, ChevronRight, TrendingUp, BarChart } from 'lucide-react';
import { Card } from '../../components/ui/card';

const provisioningNodes = [
  { name: 'US-EAST-CENTRAL-01', tier: 'PRO TIER', status: 'RUNNING', vitality: '98%', color: 'emerald' },
  { name: 'EU-WEST-STRETCH-04', tier: 'ENTERPRISE', status: 'SYNCHRONIZED', vitality: '100%', color: 'emerald' },
  { name: 'AP-SOUTH-NODE-09', tier: 'TRIAL', status: 'PENDING', vitality: '0%', color: 'amber' },
  { name: 'SA-EAST-NODE-03', tier: 'TRIAL', status: 'PENDING', vitality: '0%', color: 'amber' },
];

export const UserProvisioning = () => {
  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Orchestration Center</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Real-time cluster deployment and provisioning pipeline</p>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> PROTOCOL: ACTIVE
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500"><Server size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Active Clusters</p>
              <h3 className="text-3xl font-bold text-[#0B1630]">12</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mt-4">Operational</p>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316]"><Zap size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Provisioning Priority</p>
              <h3 className="text-3xl font-bold text-[#0B1630]">High</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-[#F97316] uppercase tracking-wider mt-4">Master</p>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Globe size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Global Reach</p>
              <h3 className="text-3xl font-bold text-[#0B1630]">4 Zones</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mt-4">Active</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Provisioning */}
        <Card className="lg:col-span-2 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="p-6 pb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#F97316]" />
            <h3 className="font-bold text-sm text-[#0B1630] uppercase tracking-wider">Active Provisioning</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {provisioningNodes.map((node) => (
              <div key={node.name} className="px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500"><Server size={16} /></div>
                  <div>
                    <p className="font-bold text-sm text-[#0B1630]">{node.name}</p>
                    <p className="text-xs font-medium mt-0.5">
                      <span className="text-[#94A3B8] uppercase tracking-wider">{node.tier}</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span className={node.status === 'RUNNING' || node.status === 'SYNCHRONIZED' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>{node.status}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0B1630]">{node.vitality}</p>
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-bold">Vitality</p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${node.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-rose-400" /> Hard-Sync Protocol Active
            </div>
            <button className="bg-[#0B1630] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#1A2A52] transition-colors shadow-sm uppercase tracking-wider">
              <Zap size={14} /> Initialize Deploy
            </button>
          </div>
        </Card>

        {/* Security Protocol + ROI */}
        <div className="space-y-6">
          <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="p-6 pb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" />
              <h3 className="font-bold text-sm text-[#0B1630] uppercase tracking-wider">Security Protocol</h3>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Global API Key</p>
                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
                  <code className="text-xs text-[#0B1630] font-mono">V-NEXUS-***********************</code>
                  <button className="text-[#94A3B8] hover:text-[#0B1630] transition-colors"><Copy size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Isolation</p>
                  <p className="font-bold text-[#0B1630] text-sm">L3 HARD</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Encryption</p>
                  <p className="font-bold text-[#0B1630] text-sm">AES-256</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-[#0B1630] rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 z-10 relative">
              <TrendingUp size={16} className="text-[#F97316]" />
              <h3 className="font-bold text-[10px] text-white uppercase tracking-widest">Deployment ROI</h3>
              <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
            <h2 className="text-4xl font-bold text-white z-10 relative">$14,230</h2>
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mt-2 z-10 relative">Projected Yield</p>
            <svg className="absolute bottom-0 right-0 w-32 h-20 opacity-20 text-indigo-400" viewBox="0 0 100 80" fill="none"><path d="M0,60 Q25,40 50,50 T100,20" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
          </div>
          
          <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <button className="w-full p-4 flex items-center justify-between text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-colors rounded-2xl">
              <span className="flex items-center gap-2 uppercase tracking-wider text-xs"><BarChart size={16} className="text-[#64748B]" /> Aggregate Yield from Active Clusters</span>
              <ChevronRight size={16} className="text-[#94A3B8]" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
