import { useState } from 'react';
import { 
  TrendingUp, 
  Store, 
  Download, 
  FileSpreadsheet, 
  Receipt,
  Search,
  DollarSign
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { SuperAdminService } from '../../services/ApiService';
import { exportToPdf, exportToExcel, exportToCsv } from '../../lib/export-utils';
import { toast } from '../../lib/toast-store';

type DateRangeFilter = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'ALL';

export const PlatformReports = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('THIS_MONTH');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Query Tenants List for Restaurant Filter Dropdown
  const { data: tenants } = useQuery({
    queryKey: ['superadmin-tenants-list'],
    queryFn: () => SuperAdminService.getTenantsList(),
  });

  // 2. Query Live Platform Reports
  const { data: reportEntries, isLoading } = useQuery({
    queryKey: ['superadmin-platform-reports', selectedTenantId, dateRange],
    queryFn: () => SuperAdminService.getPlatformReports({ tenantId: selectedTenantId, dateRange }),
    refetchInterval: 10000,
  });

  // 3. Filter entries by search query
  const filteredEntries = (reportEntries || []).filter((r: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.receiptNumber.toLowerCase().includes(query) ||
      r.restaurantName.toLowerCase().includes(query) ||
      r.orderNumber.toLowerCase().includes(query) ||
      r.customerName.toLowerCase().includes(query) ||
      r.cashierName.toLowerCase().includes(query)
    );
  });

  // 4. Calculate Live Summary Aggregations
  const totalGrossGmv = filteredEntries
    .filter((r: any) => r.status !== 'REFUNDED')
    .reduce((sum: number, r: any) => sum + Number(r.totalAmount || 0), 0);

  const platformShareCut = totalGrossGmv * 0.15;
  const completedReceiptsCount = filteredEntries.filter((r: any) => r.status !== 'REFUNDED').length;
  const avgTicket = completedReceiptsCount > 0 ? totalGrossGmv / completedReceiptsCount : 0;

  // 5. Handle Exports (PDF, Excel, CSV)
  const handleExport = (formatType: 'PDF' | 'EXCEL' | 'CSV') => {
    try {
      toast.success('Generating Export', `Exporting platform report records as ${formatType}...`);

      const activeTenantName = tenants?.find((t: any) => t.id === selectedTenantId)?.name || 'All Restaurants';
      const headers = ['Time', 'Restaurant Node', 'Receipt No.', 'Order No.', 'Table', 'Customer', 'Cashier', 'Method', 'Amount (ETB)', 'Status'];
      
      const rows = filteredEntries.map((r: any) => [
        new Date(r.createdAt).toLocaleString(),
        r.restaurantName,
        r.receiptNumber,
        r.orderNumber,
        r.tableNumber,
        r.customerName,
        r.cashierName,
        r.paymentMethod,
        r.totalAmount.toFixed(2),
        r.status
      ]);

      const options = {
        title: 'Platform-Wide Financial Audit Report',
        subtitle: `Aggregated Telemetry | Filter: ${activeTenantName}`,
        restaurantName: 'DHADHAN HUB SAAS HQ',
        dateRange: dateRange,
        headers,
        rows,
        summaryMetrics: [
          { label: 'Gross GMV Volume', value: `ETB ${totalGrossGmv.toFixed(2)}` },
          { label: 'Platform Share (15%)', value: `ETB ${platformShareCut.toFixed(2)}` },
          { label: 'Completed Receipts', value: completedReceiptsCount },
          { label: 'Avg Ticket Size', value: `ETB ${avgTicket.toFixed(2)}` },
        ],
        filename: `platform_report_${selectedTenantId.slice(0, 8)}_${dateRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`
      };

      if (formatType === 'PDF') {
        exportToPdf(options);
      } else if (formatType === 'EXCEL') {
        exportToExcel(options);
      } else if (formatType === 'CSV') {
        exportToCsv(options);
      }
    } catch (err: any) {
      console.error('[PlatformReports] Export failed:', err);
      toast.error('Export Failed', err.message || 'Could not export platform report.');
    }
  };

  return (
    <div className="space-y-8 max-w-[1500px]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">Platform Reports & Audit</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Aggregated real-time financial telemetry across all restaurant nodes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-200 shadow-sm"
          >
            <Download size={14} /> PDF Report
          </button>
          <button
            onClick={() => handleExport('EXCEL')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-200 shadow-sm"
          >
            <FileSpreadsheet size={14} /> Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-[#0B1630] hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-sm"
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316]">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Gross GMV Volume</p>
              <h3 className="text-2xl font-bold text-[#0B1630]">ETB {totalGrossGmv.toFixed(2)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Platform Cut (15%)</p>
              <h3 className="text-2xl font-bold text-emerald-600">ETB {platformShareCut.toFixed(2)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Receipt size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Paid Receipts</p>
              <h3 className="text-2xl font-bold text-[#0B1630]">{completedReceiptsCount}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
              <Store size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Avg Ticket Size</p>
              <h3 className="text-2xl font-bold text-[#0B1630]">ETB {avgTicket.toFixed(2)}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Controls Toolbar */}
      <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Restaurant Filter */}
          <div className="flex items-center gap-3">
            <Store size={18} className="text-[#64748B]" />
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-[#0B1630] focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="ALL">🌐 All Restaurant Nodes</option>
              {(tenants || []).map((t: any) => (
                <option key={t.id} value={t.id}>
                  🏬 {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            {(['TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR', 'ALL'] as DateRangeFilter[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  dateRange === range
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#0B1630]'
                }`}
              >
                {range.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt #, restaurant, order #, or cashier..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 rounded-xl border border-slate-200 text-xs text-[#0B1630] focus:outline-none focus:border-[#F97316]"
          />
        </div>
      </Card>

      {/* Live Data Registry Table */}
      <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Restaurant Node</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Receipt No.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Order / Table</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Cashier</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748B] uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-[#64748B] font-medium">
                    Loading live platform reports...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-[#64748B] font-medium">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((r: any) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-[#0B1630]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#0B1630]">
                      {r.restaurantName}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-[#F97316]">
                      #{r.receiptNumber}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#64748B]">
                      {r.orderNumber} ({r.tableNumber})
                    </td>
                    <td className="px-6 py-4 text-xs text-[#0B1630] font-medium">
                      {r.cashierName}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">
                      {r.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#0B1630] text-right">
                      ETB {r.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        r.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
