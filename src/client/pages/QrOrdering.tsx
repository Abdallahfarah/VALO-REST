import { useState, useEffect } from 'react';
import { 
  QrCode, Copy, Check, BarChart3, 
  ExternalLink, Printer, Settings, ShoppingBag, Eye 
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { useTenant } from '../context/TenantContext';
import { SettingService } from '../services/ApiService';
import { supabase } from '../../lib/supabase';
import { toast } from '../lib/toast-store';

export const QrOrdering = () => {
  const { tenant } = useTenant();
  const [slug, setSlug] = useState(tenant?.slug || '');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // QR Config State
  const [qrEnabled, setQrEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome! Browse our menu and place your order.');
  const [requireApproval, setRequireApproval] = useState(true);
  const [payAtCounter, setPayAtCounter] = useState(true);
  const [onlinePayment, setOnlinePayment] = useState(false);

  // Tables State
  const [tables, setTables] = useState<any[]>([]);

  const qrMenuUrl = `${window.location.origin}/r/${slug}`;

  // 1. Fetch tables and settings
  useEffect(() => {
    if (!tenant?.id) return;
    setSlug(tenant.slug || '');

    // Fetch tables
    supabase
      .from('tables')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('number', { ascending: true })
      .then(({ data }) => {
        if (data) setTables(data);
      });

    // Fetch QR configs from business_hours inside restaurant_settings
    SettingService.getSettings(tenant.id).then((settings) => {
      const qrConfig = settings.businessHours?.qr_config;
      if (qrConfig) {
        setQrEnabled(qrConfig.enabled !== false);
        setWelcomeMessage(qrConfig.welcome_message || 'Welcome! Browse our menu and place your order.');
        setRequireApproval(qrConfig.require_approval !== false);
        setPayAtCounter(qrConfig.pay_at_counter !== false);
        setOnlinePayment(!!qrConfig.online_payment);
      }
    }).catch(err => {
      console.error('Failed to load settings:', err);
    });
  }, [tenant]);

  // 2. Save settings
  const handleSaveSettings = async () => {
    if (!tenant?.id) return;
    setIsLoading(true);

    try {
      // 1. Fetch current settings first
      const current = await SettingService.getSettings(tenant.id);
      
      // Update business_hours JSON
      const updatedBusinessHours = {
        ...(current.businessHours || {}),
        qr_config: {
          enabled: qrEnabled,
          welcome_message: welcomeMessage,
          require_approval: requireApproval,
          pay_at_counter: payAtCounter,
          online_payment: onlinePayment
        }
      };

      // 2. Update settings in database
      await SettingService.updateSettings(tenant.id, {
        ...current,
        businessHours: updatedBusinessHours
      });

      // 3. Update slug in tenants table if it changed
      if (slug !== tenant.slug) {
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const { error: tenantErr } = await supabase
          .from('tenants')
          .update({ slug: cleanSlug })
          .eq('id', tenant.id);
        
        if (tenantErr) {
          if (tenantErr.code === '23505') {
            throw new Error('This restaurant slug is already taken. Please choose another one.');
          }
          throw tenantErr;
        }
      }

      toast.success('QR Settings Saved', 'Your customer menu configurations have been updated.');
    } catch (err: any) {
      toast.error('Failed to Save', err.message || 'An error occurred while updating settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrMenuUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('Copied to Clipboard', 'Menu URL copied successfully.');
  };

  // 3. Print QR Table Cards Helper
  const handlePrintCards = (selectedTable?: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsToPrint = selectedTable ? [selectedTable] : tables;
    const logoUrl = tenant?.logo || 'https://ui-avatars.com/api/?name=VALO+REST&background=F97316&color=fff';

    const cardsHtml = cardsToPrint.map((table: any) => {
      const url = `${window.location.origin}/r/${slug}/t/${table.number}`;
      const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
      return `
        <div class="card">
          <img class="logo" src="${logoUrl}" alt="Logo" />
          <div class="rest-name">${tenant?.name || 'VALO-REST'}</div>
          <div class="table-num">Table ${table.number}</div>
          <img class="qr" src="${qrImage}" alt="QR Code" />
          <div class="inst">SCAN TO VIEW MENU & ORDER</div>
          <div class="sub-inst">Request Service & Pay from your phone</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Table Cards</title>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 20px; display: flex; flex-wrap: wrap; justify-content: center; background: #f8fafc; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 30px; margin: 15px; width: 280px; text-align: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); page-break-inside: avoid; }
            .logo { height: 44px; width: 44px; object-fit: cover; border-radius: 10px; margin-bottom: 8px; }
            .rest-name { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.05em; }
            .table-num { font-size: 28px; font-weight: 900; color: #0B1630; margin: 15px 0; }
            .qr { width: 200px; height: 200px; margin: 10px auto; display: block; }
            .inst { font-size: 13px; font-weight: 900; color: #F97316; margin-top: 15px; letter-spacing: 0.02em; }
            .sub-inst { font-size: 11px; color: #94A3B8; margin-top: 4px; font-weight: 600; }
            @media print {
              body { background: transparent; padding: 0; }
              .card { border: 1px solid #cbd5e1; box-shadow: none; margin: 20px auto; page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${cardsHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">QR Ordering</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">Manage your restaurant self-service customer QR codes and menu preferences.</p>
        </div>
        <button 
          onClick={() => window.open(qrMenuUrl, '_blank')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
        >
          <Eye size={16} /> Live Customer View <ExternalLink size={14} />
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
            <QrCode size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Total QR Scans</p>
            <h3 className="text-xl font-black text-[#0B1630]">1,284</h3>
            <span className="text-[10px] text-emerald-600 font-bold uppercase">Live Activity</span>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">QR Orders</p>
            <h3 className="text-xl font-black text-[#0B1630]">342</h3>
            <span className="text-[10px] text-emerald-600 font-bold uppercase">+12% this week</span>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">QR Revenue</p>
            <h3 className="text-xl font-black text-[#0B1630]">26.4%</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">of total sales</span>
          </div>
        </Card>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <Printer size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Active Tables</p>
            <h3 className="text-xl font-black text-[#0B1630]">{tables.length}</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Codes generated</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: QR Code Details & Table Generator */}
        <div className="lg:col-span-2 space-y-8">
          {/* General QR Link */}
          <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white space-y-6">
            <h3 className="text-lg font-black text-[#0B1630] flex items-center gap-2">
              <QrCode size={20} className="text-[#F97316]" /> Restaurant QR Link
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={qrMenuUrl} 
                  readOnly 
                  className="w-full h-12 pl-4 pr-12 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-mono text-slate-600 focus:outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1630]"
                >
                  {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
              <button 
                onClick={() => handlePrintCards()}
                className="h-12 px-6 rounded-xl bg-[#0B1630] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#152549] transition-all cursor-pointer"
              >
                <Printer size={16} /> Print All Cards
              </button>
            </div>
          </Card>

          {/* Tables QR Codes List */}
          <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0B1630] flex items-center gap-2">
                <Printer size={20} className="text-[#F97316]" /> Table QR Codes
              </h3>
              <span className="text-xs text-slate-400 font-bold uppercase">{tables.length} Tables Registered</span>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Table</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">QR Code URL</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Preview</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
              </table>
                <div className="max-h-[400px] overflow-y-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      {tables.map((table) => {
                        const tableUrl = `${window.location.origin}/r/${slug}/t/${table.number}`;
                        const qrCodeImg = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(tableUrl)}`;
                        return (
                          <tr key={table.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-[#0B1630]">Table {table.number}</td>
                            <td className="px-6 py-4 text-xs font-mono text-[#64748B] max-w-[200px] truncate">{tableUrl}</td>
                            <td className="px-6 py-4">
                              <img src={qrCodeImg} alt={`Table ${table.number} QR`} className="w-10 h-10 border border-slate-100 rounded bg-white p-0.5" />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handlePrintCards(table)}
                                className="p-2 text-slate-500 hover:text-[#0B1630] rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                                title="Print Card"
                              >
                                <Printer size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Customization Forms */}
          <div className="space-y-8">
            <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white space-y-6">
              <h3 className="text-lg font-black text-[#0B1630] flex items-center gap-2">
                <Settings size={20} className="text-[#F97316]" /> Configuration
              </h3>

              <div className="space-y-4">
                {/* Enable QR Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-50/30">
                  <div>
                    <p className="text-xs font-bold text-[#0B1630]">Enable QR Ordering</p>
                    <p className="text-[10px] text-slate-400">Allow customers to order via QR menu.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={qrEnabled} 
                    onChange={(e) => setQrEnabled(e.target.checked)} 
                    className="w-5 h-5 accent-[#F97316] cursor-pointer"
                  />
                </div>

                {/* Require Approval Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-50/30">
                  <div>
                    <p className="text-xs font-bold text-[#0B1630]">Require POS Approval</p>
                    <p className="text-[10px] text-slate-400">Orders must be verified before going to KDS.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={requireApproval} 
                    onChange={(e) => setRequireApproval(e.target.checked)} 
                    className="w-5 h-5 accent-[#F97316] cursor-pointer"
                  />
                </div>

                {/* Restaurant URL Slug input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Restaurant Slug</label>
                  <input 
                    type="text" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                    placeholder="e.g. royalcafe"
                    className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50/30 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                {/* Welcome message input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Welcome Message</label>
                  <textarea 
                    value={welcomeMessage} 
                    onChange={(e) => setWelcomeMessage(e.target.value)} 
                    rows={3}
                    placeholder="e.g. Welcome! Please select items to place your order."
                    className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50/30 text-xs text-slate-700 focus:outline-none focus:border-[#F97316] resize-none"
                  />
                </div>

                {/* Payment Methods */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Payment Methods</label>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 bg-slate-50/20 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={payAtCounter} 
                        onChange={(e) => setPayAtCounter(e.target.checked)} 
                        className="w-4 h-4 accent-[#F97316]"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#0B1630]">Pay at Counter</p>
                        <p className="text-[9px] text-slate-400">Customers pay cash/card at register.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 bg-slate-50/20 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={onlinePayment} 
                        onChange={(e) => setOnlinePayment(e.target.checked)} 
                        className="w-4 h-4 accent-[#F97316]"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#0B1630]">Online Payment (Card/Mobile)</p>
                        <p className="text-[9px] text-slate-400">Accept digital payments instantly.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="w-full bg-[#F97316] text-white h-12 rounded-xl font-bold text-sm hover:bg-[#ea580c] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  {isLoading ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
  );
};
