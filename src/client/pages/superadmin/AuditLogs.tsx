import { ShieldCheck, Search, Filter, Download, Info, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { exportToExcel } from '../../lib/export-utils';
import { toast } from '../../lib/toast-store';

const auditEntries = [
  { time: '11:37:18 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: 'f7e9e2a4-b', user: 'DHADHAN Platform Owner', role: 'OPS' },
  { time: '11:37:12 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: '725c9e24-b', user: 'DHADHAN Platform Owner', role: 'OPS' },
  { time: '03:29:39 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: 'f7e9e2a4-b', user: 'DHADHAN Platform Owner', role: 'OPS' },
  { time: '03:29:25 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: '725c9e24-b', user: 'DHADHAN Platform Owner', role: 'OPS' },
  { time: '03:29:14 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: '7259a2a4-b', user: 'DHADHAN Platform Owner', role: 'OPS' },
  { time: '03:29:08 PM', date: '06/15/2026', action: 'RESTAURANT_LIFECYCLE_UPDATE', entity: 'RESTAURANT', segment: 'f7e9e2a4-b', user: 'DHADHAN Platform Owner', role: 'OPS' },
];

export const AuditLogs = () => {
  const handleExportLedger = () => {
    try {
      exportToExcel({
        title: 'Global Audit Trace Ledger',
        subtitle: 'Platform Owner Audit Logs',
        headers: ['Execution Time', 'Date', 'Protocol Action', 'Entity Segment', 'Orchestrator', 'Role'],
        rows: auditEntries.map(e => [
          e.time,
          e.date,
          e.action,
          e.segment,
          e.user,
          e.role
        ]),
        filename: `audit_trace_ledger_${new Date().toISOString().slice(0, 10)}.xlsx`
      });
      toast.success('Ledger Exported', 'Audit trace ledger downloaded as Excel workbook.');
    } catch (err: any) {
      toast.error('Export Failed', err.message || 'Could not export audit ledger.');
    }
  };

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Global Trace Registry</h1>
          <p className="text-[#94A3B8] mt-1 text-sm font-medium">Immutable chronological ledger of platform orchestration</p>
        </div>
        <span className="text-xs font-bold text-white bg-[#1E293B] px-3 py-1.5 rounded-full border border-[#232B5E]/50 uppercase tracking-wider">Indices: 6 • Standard</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-indigo-400"><ShieldCheck size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Indices</p>
              <h3 className="text-3xl font-bold text-white">6</h3>
              <p className="text-xs text-[#94A3B8] font-medium mt-1">Global trace indices.</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-emerald-400"><CheckCircle2 size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Integrity Check</p>
              <h3 className="text-3xl font-bold text-white">100%</h3>
              <p className="text-xs text-emerald-400 font-bold mt-1">Verified</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-blue-400"><Clock size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Trace Mode</p>
              <h3 className="text-xl font-bold text-white mt-1">—</h3>
              <p className="text-xs text-emerald-400 font-bold mt-1">Optimal</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B]/70 border border-[#232B5E]/50 flex items-center justify-center text-[#F97316]"><FileText size={22} /></div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Retention Cycle</p>
              <h3 className="text-3xl font-bold text-white">365d</h3>
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
            <input className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#232B5E]/50 text-sm bg-[#1E293B] text-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]" placeholder="Search trace indices..." />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#232B5E]/50 text-sm font-semibold text-[#94A3B8] hover:bg-[#1E293B] transition-colors">
            <Filter size={14} /> Filters <span className="bg-[#F97316] text-white text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center ml-1">7</span>
          </button>
        </div>
        <button 
          onClick={handleExportLedger}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#232B5E]/50 text-sm font-bold text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
        >
          <Download size={16} /> Export Ledger
        </button>
      </div>

      {/* Audit Table */}
      <Card className="border border-[#232B5E]/50 shadow-2xl bg-[#131A38]/70 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#232B5E]/30">
                <th className="text-left px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Execution Time ↕</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Protocol Action</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Entity Segment</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Orchestrator</th>
                <th className="text-right px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((entry, i) => (
                <tr key={i} className="border-b border-[#232B5E]/30 hover:bg-[#1E293B]/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                      <div>
                        <p className="font-bold text-sm text-white">{entry.time}</p>
                        <p className="text-xs text-[#94A3B8]">{entry.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="font-bold text-sm text-white">{entry.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#94A3B8]">{entry.entity}</span>
                    <span className="ml-2 bg-[#1E293B] text-[#94A3B8] text-xs font-mono px-2 py-0.5 rounded">{entry.segment}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold">VP</div>
                      <div>
                        <p className="font-semibold text-sm text-white">{entry.user}</p>
                        <p className="text-xs text-[#94A3B8]">{entry.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="w-8 h-8 rounded-full border border-[#232B5E]/50 flex items-center justify-center text-[#94A3B8] hover:bg-[#1E293B] hover:text-white transition-colors ml-auto"><Info size={14} /></button>
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
