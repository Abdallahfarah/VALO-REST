import { DollarSign, TrendingUp, Download, Users, Zap, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/card';

export const PlatformRevenue = () => {
  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Fiscal Intelligence</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Real-time revenue oscillation and yield telemetry</p>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verifying Streams
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500"><DollarSign size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Platform Revenue</p>
              <h3 className="text-3xl font-bold text-indigo-500">$0.535</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mt-4 z-10 relative">Yield (3%)</p>
          <svg className="absolute bottom-0 right-0 w-24 h-12 opacity-30 text-indigo-400" viewBox="0 0 100 50" fill="none"><path d="M0,40 Q25,25 50,35 T100,20" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><TrendingUp size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Gross Throughput</p>
              <h3 className="text-3xl font-bold text-[#0B1630]">$17.83</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mt-4 z-10 relative">Ecosystem</p>
          <svg className="absolute bottom-0 right-0 w-24 h-12 opacity-30 text-emerald-400" viewBox="0 0 100 50" fill="none"><path d="M0,35 Q25,20 50,30 T100,15" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden relative">
          <div className="flex items-center gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316]"><TrendingUp size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Monthly Growth</p>
              <h3 className="text-3xl font-bold text-emerald-500">+14.2%</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mt-4 z-10 relative">Optimal</p>
          <svg className="absolute bottom-0 right-0 w-24 h-12 opacity-30 text-orange-400" viewBox="0 0 100 50" fill="none"><path d="M0,45 Q25,30 50,25 T100,10" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gross Throughput */}
        <Card className="lg:col-span-2 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="p-6 pb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#64748B]" />
            <h3 className="font-bold text-sm text-[#0B1630] uppercase tracking-wider">Gross Throughput</h3>
          </div>
          <div className="px-6 pb-6 space-y-6">
            <div>
              <div className="flex justify-between mb-2"><span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total Ecosystem Flow</span><span className="font-bold text-[#0B1630]">$17.83</span></div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#0B1630] rounded-full" style={{ width: '100%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between mb-2"><span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Platform Fee (3%)</span><span className="font-bold text-[#0B1630]">$0.53</span></div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }} /></div>
            </div>
            <div>
              <div className="flex justify-between mb-2"><span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Net Client Settlement</span><span className="font-bold text-[#0B1630]">$17.30</span></div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: '97%' }} /></div>
            </div>
            <div className="flex items-center gap-8 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><TrendingUp size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Velocity</p>
                  <p className="font-bold text-[#0B1630]">$42.50/s</p>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-100" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><ShieldCheck size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Integrity</p>
                  <p className="font-bold text-emerald-500">100.0%</p>
                </div>
              </div>
            </div>
            <button className="w-full py-3 border border-slate-200 rounded-xl text-sm font-bold text-[#0B1630] flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors mt-4">
              <Download size={16} /> Export Ledger
            </button>
          </div>
        </Card>

        {/* Yield Allocation + Net Fiscal Yield */}
        <div className="space-y-6">
          <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="p-6 pb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#64748B]" />
              <h3 className="font-bold text-sm text-[#0B1630] uppercase tracking-wider">Yield Allocation</h3>
            </div>
            <div className="px-6 pb-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Users size={14} /></div><span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Subscriptions</span></div>
                <span className="font-bold text-[#0B1630]">72%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: '72%' }} /></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Users size={14} /></div><span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Transactional</span></div>
                <span className="font-bold text-[#0B1630]">18%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: '18%' }} /></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Zap size={14} /></div><span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Network Fees</span></div>
                <span className="font-bold text-[#0B1630]">10%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#F97316] rounded-full" style={{ width: '10%' }} /></div>
            </div>
          </Card>
          <div className="bg-[#0B1630] rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[10px] text-[#94A3B8] uppercase tracking-widest">Net Fiscal Yield</h3>
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
            <h2 className="text-4xl font-bold text-white">$85,420</h2>
            <svg className="absolute bottom-0 right-4 w-20 h-20 opacity-20 text-indigo-400" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="3"/><circle cx="40" cy="40" r="15" stroke="currentColor" strokeWidth="3" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
};
