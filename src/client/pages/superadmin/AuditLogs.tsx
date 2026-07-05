import { ShieldCheck, Search, Filter, Download, Info, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Card } from '../../components/ui/card';

const auditEntries = [
  { time: '11:37:18 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: 'f7e9e2a4-b', user: 'VALO Platform Owner', role: 'OPS' },
  { time: '11:37:12 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: '725c9e24-b', user: 'VALO Platform Owner', role: 'OPS' },
  { time: '03:29:39 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: 'f7e9e2a4-b', user: 'VALO Platform Owner', role: 'OPS' },
  { time: '03:29:25 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: '725c9e24-b', user: 'VALO Platform Owner', role: 'OPS' },
  { time: '03:29:14 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: '7259a2a4-b', user: 'VALO Platform Owner', role: 'OPS' },
  { time: '03:29:08 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: 'f7e9e2a4-b', user: 'VALO Platform Owner', role: 'OPS' },
];

export const AuditLogs = () => {
  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Global Trace Registry</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Immutable chronological ledger of platform orchestration</p>
        </div>
        <span className="text-xs font-bold text-[#0B1630] bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-wider">Indices: 6 • Standard</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500"><ShieldCheck size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total Indices</p>
              <h3 className="text-3xl font-bold text-[#0B1630]">6</h3>
              <p className="text-xs text-[#94A3B8] font-medium mt-1">Global trace indices.</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Integrity Check</p>
              <h3 className="text-3xl font-bold text-[#0B1630]">100%</h3>
              <p className="text-xs text-emerald-500 font-bold mt-1">Verified</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><Clock size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Trace Mode</p>
              <h3 className="text-xl font-bold text-[#0B1630] mt-1">—</h3>
              <p className="text-xs text-emerald-500 font-bold mt-1">Optimal</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316]"><FileText size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Retention Cycle</p>
              <h3 className="text-3xl font-bold text-[#0B1630]">365d</h3>
              <p className="text-xs text-[#94A3B8] font-medium mt-1">Data retention window</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#E5E7EB] text-sm bg-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]" placeholder="Search trace indices..." />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors">
            <Filter size={14} /> Filters <span className="bg-[#0B1630] text-white text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center ml-1">7</span>
          </button>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-colors">
          <Download size={16} /> Export Ledger
        </button>
      </div>

      {/* Audit Table */}
      <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Execution Time ↕</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Protocol Action</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Entity Segment</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Orchestrator</th>
                <th className="text-right px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((entry, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                      <div>
                        <p className="font-bold text-sm text-[#0B1630]">{entry.time}</p>
                        <p className="text-xs text-[#94A3B8]">{entry.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="font-bold text-sm text-[#0B1630]">{entry.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#64748B]">{entry.entity}</span>
                    <span className="ml-2 bg-slate-100 text-[#64748B] text-xs font-mono px-2 py-0.5 rounded">{entry.segment}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0B1630] flex items-center justify-center text-white text-xs font-bold">VP</div>
                      <div>
                        <p className="font-semibold text-sm text-[#0B1630]">{entry.user}</p>
                        <p className="text-xs text-[#94A3B8]">{entry.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-[#94A3B8] hover:bg-slate-50 transition-colors ml-auto"><Info size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
