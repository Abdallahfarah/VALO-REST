import { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Eye, 
  TrendingUp,
  Printer,
  X,
  CreditCard,
  DollarSign,
  Smartphone,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { cn } from '../../../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReceiptService, SettingService } from '../../services/ApiService';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../services/CurrencyService';
import { toast } from '../../lib/toast-store';
import { DetailedReceipt } from '../../components/layout/DetailedReceipt';
import { generateRestaurantReportPackage } from '../../lib/restaurant-report-engine';

export const Receipts = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  const refundReceiptMutation = useMutation({
    mutationFn: (receiptId: string) => ReceiptService.refundReceipt(receiptId, user?.id || '', tenant?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setActiveReceiptId(null);
      toast.success('Refund completed', 'Receipt status has been updated to REFUNDED');
    },
    onError: (err: any) => {
      toast.error('Refund failed', err?.message || 'Failed to process refund');
    }
  });



  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');

  // ─── Query receipts ───
  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts', tenant?.id],
    queryFn: () => ReceiptService.getReceipts(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  // Query settings for receipt preferences
  const { data: settings } = useQuery({
    queryKey: ['settings', tenant?.id],
    queryFn: () => SettingService.getSettings(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  // ─── Filter Logic ───
  const filteredReceipts = receipts.filter((rcpt: any) => {
    const matchesSearch = rcpt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rcpt.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = selectedMethod === 'All' || rcpt.paymentMethod === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const activeReceipt = receipts.find((r: any) => r.id === activeReceiptId);

  // ─── Dynamic KPI Calculations ───
  const totalReceipts = receipts.length;
  const totalRevenue = receipts.reduce((acc: number, r: any) => acc + Number(r.totalAmount), 0);
  const averageBill = totalReceipts > 0 ? totalRevenue / totalReceipts : 0;
  
  const kpis = [
    { label: 'Receipts Today', value: totalReceipts.toString(), icon: Receipt, color: 'text-indigo-500 lg:text-indigo-500', bg: 'lg:bg-indigo-50 bg-indigo-500/10', comparison: 'Historical ledger' },
    { label: 'Revenue Today', value: format(totalRevenue), icon: TrendingUp, color: 'text-emerald-500 lg:text-emerald-500', bg: 'lg:bg-emerald-50 bg-emerald-500/10', comparison: 'Real-time sales' },
    { label: 'System Refunds', value: '0', icon: X, color: 'text-orange-500 lg:text-orange-500', bg: 'lg:bg-orange-50 bg-orange-500/10', comparison: 'Void logs' },
    { label: 'Average Bill', value: format(averageBill), icon: CreditCard, color: 'text-blue-500 lg:text-blue-500', bg: 'lg:bg-blue-50 bg-blue-500/10', comparison: 'Check average' },
  ];

  const getMethodIcon = (method: string) => {
    if (method === 'Card') return CreditCard;
    if (method === 'Mobile Money') return Smartphone;
    return DollarSign;
  };

  return (
    <div className="min-h-0 flex flex-col gap-8">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h1 className="text-3xl font-bold lg:text-[#0B1630] text-white">Receipts</h1>
           <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="lg:text-emerald-600 text-emerald-400 text-xs font-bold uppercase tracking-wider">Live</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!tenant?.id) return;
              generateRestaurantReportPackage({
                tenantId: tenant.id,
                tenantName: tenant.name || 'Restaurant',
                currencySymbol: tenant.currencySymbol,
                currencyCode: tenant.currencyCode,
                dateRange: 'ALL',
                formatType: 'PDF'
              });
            }}
            className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            PDF Report
          </button>
          <button
            onClick={() => {
              if (!tenant?.id) return;
              generateRestaurantReportPackage({
                tenantId: tenant.id,
                tenantName: tenant.name || 'Restaurant',
                currencySymbol: tenant.currencySymbol,
                currencyCode: tenant.currencyCode,
                dateRange: 'ALL',
                formatType: 'EXCEL'
              });
            }}
            className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Excel (.xlsx)
          </button>
          <button
            onClick={() => {
              if (!tenant?.id) return;
              generateRestaurantReportPackage({
                tenantId: tenant.id,
                tenantName: tenant.name || 'Restaurant',
                currencySymbol: tenant.currencySymbol,
                currencyCode: tenant.currencyCode,
                dateRange: 'ALL',
                formatType: 'CSV'
              });
            }}
            className="px-3.5 py-2 bg-slate-100 border border-slate-200 text-[#0B1630] hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            CSV
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-6 lg:bg-white bg-[#131A38]/70 backdrop-blur-md lg:backdrop-blur-none lg:border-none border border-[#232B5E]/50 shadow-2xl flex flex-col gap-6">
             <div className="flex items-start justify-between">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", kpi.bg, kpi.color)}>
                   <kpi.icon size={24} />
                </div>
             </div>
             <div>
                <p className="text-[10px] font-bold lg:text-[#94A3B8] text-white/90 uppercase tracking-wider mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-black lg:text-[#0B1630] text-white leading-none mb-2">{kpi.value}</h3>
                <p className="text-[9px] font-medium text-[#94A3B8]">{kpi.comparison}</p>
             </div>
          </Card>
        ))}
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
         {/* Transaction Registry */}
         <Card className="flex-1 lg:bg-white bg-transparent lg:border-none border-none lg:shadow-[0_2px_12px_rgba(0,0,0,0.04)] shadow-none p-0 overflow-hidden flex flex-col">
            <div className="p-6 lg:border-b lg:border-slate-50 border-b border-[#232B5E]/30 flex flex-wrap items-center gap-4 lg:bg-white bg-[#131A38]/70 backdrop-blur-md rounded-xl lg:rounded-none border border-[#232B5E]/50 shadow-2xl lg:shadow-none">
               <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl lg:bg-slate-50/50 bg-[#1E293B] lg:border lg:border-slate-100 border border-[#232B5E]/30 lg:text-slate-800 text-white text-xs focus:outline-none focus:border-[#F97316] placeholder:text-[#94A3B8]" 
                    placeholder="Search receipt number or order ID..." 
                  />
               </div>
               
               <div className="flex items-center gap-3 lg:bg-white bg-[#1E293B] px-4 py-2.5 rounded-xl lg:border lg:border-slate-100 border border-[#232B5E]/30 shadow-sm">
                  <select 
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="text-[10px] font-bold lg:text-[#0B1630] text-white bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="All" className="bg-[#131A38] text-white lg:bg-white lg:text-[#0B1630]">All Methods</option>
                    <option value="Cash" className="bg-[#131A38] text-white lg:bg-white lg:text-[#0B1630]">Cash</option>
                    <option value="Card" className="bg-[#131A38] text-white lg:bg-white lg:text-[#0B1630]">Card</option>
                    <option value="Mobile Money" className="bg-[#131A38] text-white lg:bg-white lg:text-[#0B1630]">Mobile Money</option>
                  </select>
               </div>
            </div>
            <div className="overflow-y-auto flex-1">
               {/* DESKTOP TABLE VIEW */}
               <table className="w-full text-left border-collapse hidden md:table">
                  <thead>
                     <tr className="bg-slate-50/30 sticky top-0 bg-white z-10 border-b border-slate-50">
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Receipt Number</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Waiter</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Payment Method</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredReceipts.map((rcpt: any) => {
                        const IconComponent = getMethodIcon(rcpt.paymentMethod);
                        return (
                          <tr key={rcpt.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                             <td className="px-6 py-4 text-xs font-black text-[#64748B]">{rcpt.receiptNumber}</td>
                             <td className="px-6 py-4 text-xs font-black text-[#4F46E5]">{rcpt.order?.orderNumber || `#${rcpt.orderId.slice(0, 8)}`}</td>
                             <td className="px-6 py-4 text-xs font-medium text-[#64748B]">{rcpt.order?.waiterName || 'Cashier User'}</td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-[#0B1630]">
                                   <IconComponent size={14} className="text-[#94A3B8]" /> {rcpt.paymentMethod}
                                </div>
                             </td>
                             <td className="px-6 py-4 text-xs font-black text-[#0B1630]">{format(Number(rcpt.totalAmount))}</td>
                             <td className="px-6 py-4 text-xs font-medium text-[#94A3B8]">
                                {new Date(rcpt.createdAt).toLocaleDateString()} {new Date(rcpt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </td>
                             <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => setActiveReceiptId(rcpt.id)}
                                  className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center ml-auto group-hover:bg-[#4F46E5] group-hover:text-white transition-all cursor-pointer"
                                >
                                   <Eye size={14} />
                                </button>
                             </td>
                          </tr>
                        );
                     })}

                     {filteredReceipts.length === 0 && (
                       <tr>
                         <td colSpan={7} className="text-center py-12 text-[#94A3B8] font-bold text-xs">No transactions in journal.</td>
                       </tr>
                     )}
                  </tbody>
               </table>

               {/* MOBILE RESPONSIVE CARDS VIEW */}
               <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-transparent">
                  {filteredReceipts.map((rcpt: any) => (
                    <Card 
                      key={rcpt.id} 
                      className="p-4 bg-[#131A38]/70 border border-[#232B5E]/50 shadow-2xl flex flex-col gap-4 text-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{rcpt.receiptNumber}</span>
                        <span className="text-[10px] text-[#94A3B8]">
                          {new Date(rcpt.createdAt).toLocaleDateString()} {new Date(rcpt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-white">Order: {rcpt.order?.orderNumber || `#${rcpt.orderId.slice(0, 8)}`}</h4>
                          <span className="text-[10px] text-[#94A3B8]">Waiter: {rcpt.order?.waiterName || 'Cashier User'}</span>
                        </div>
                        <span className="text-[10px] font-bold text-white flex items-center gap-1.5 bg-[#1E293B] border border-[#232B5E]/30 px-2 py-0.5 rounded">
                          {rcpt.paymentMethod}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-[#232B5E]/20 pt-3">
                        <span className="text-sm font-black text-white">{format(Number(rcpt.totalAmount))}</span>
                        <button 
                          onClick={() => setActiveReceiptId(rcpt.id)}
                          className="bg-[#F97316] text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </Card>
                  ))}
                  {filteredReceipts.length === 0 && (
                    <div className="text-center py-8 text-xs text-[#94A3B8] font-bold col-span-full">
                      No transactions found
                    </div>
                  )}
               </div>
            </div>
         </Card>
      </div>

      {/* ─── DETAIL POPUP DIALOG ─── */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-[#090D1F]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-md p-6 lg:bg-white bg-[#131A38] lg:border-none border border-[#232B5E]/50 shadow-2xl relative flex flex-col gap-4 max-h-[90vh]">
            <button 
              onClick={() => setActiveReceiptId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="text-center pt-2">
              <h3 className="text-lg font-black lg:text-[#0B1630] text-white uppercase tracking-wider">Receipt Preview</h3>
              <p className="text-[10px] font-bold text-[#94A3B8]">Review details and format print output</p>
            </div>

            {/* Width Toggle Selector */}
            <div className="flex justify-center items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Paper Width:</span>
              <button 
                onClick={() => setPaperWidth('58mm')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer",
                  paperWidth === '58mm' ? "bg-[#F97316] text-white shadow-sm" : "bg-transparent text-slate-500 hover:bg-slate-100"
                )}
              >
                58mm
              </button>
              <button 
                onClick={() => setPaperWidth('80mm')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer",
                  paperWidth === '80mm' ? "bg-[#F97316] text-white shadow-sm" : "bg-transparent text-slate-500 hover:bg-slate-100"
                )}
              >
                80mm
              </button>
            </div>

            {/* Receipt Content Wrapper */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] border border-slate-100 rounded-2xl bg-white p-2">
              <div className="print-receipt-container">
                <DetailedReceipt 
                  receipt={activeReceipt}
                  order={activeReceipt.order}
                  tenant={tenant}
                  settings={settings}
                  paperWidth={paperWidth}
                />
              </div>
            </div>

            {activeReceipt.status === 'REFUNDED' && (
              <div className="text-center py-2 text-xs font-extrabold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl uppercase tracking-wider">
                ⚠️ Voided / Refunded
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100 mt-auto">
              <button 
                onClick={() => { window.print(); }}
                className="flex-1 h-11 bg-[#F97316] hover:bg-[#ea580c] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/10"
              >
                <Printer size={14} /> Print Receipt
              </button>
              {activeReceipt.status !== 'REFUNDED' && (
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to void and refund this receipt? This action is permanent and will be logged.')) {
                      refundReceiptMutation.mutate(activeReceipt.id);
                    }
                  }}
                  disabled={refundReceiptMutation.isPending}
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer"
                >
                  {refundReceiptMutation.isPending ? 'Refunding...' : 'Void / Refund'}
                </button>
              )}
              <button 
                onClick={() => setActiveReceiptId(null)}
                className="flex-1 h-11 bg-[#0B1630] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Receipts;
