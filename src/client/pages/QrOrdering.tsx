import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  QrCode, Copy, Check, Printer, Settings, Eye,
  ExternalLink, Plus, Edit2, Trash2, Download,
  ToggleLeft, ToggleRight, X, Search, RefreshCw,
  Package, Layers, Table2, AlertCircle,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { SettingService, TableService, OrderService, ActivityLogService } from '../services/ApiService';
import { supabase } from '../../lib/supabase';
import { toast } from '../lib/toast-store';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'tables' | 'config';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const buildTableUrl = (slug: string, tableNumber: string) =>
  `${window.location.origin}/r/${slug}/t/${tableNumber}`;

const buildQrImageUrl = (tableUrl: string, size = 200) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(tableUrl)}`;

// Download QR as PNG via blob fetch
const downloadQrAsPng = async (tableUrl: string, label: string) => {
  try {
    const imgUrl = buildQrImageUrl(tableUrl, 500);
    const res = await fetch(imgUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${label.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Download Failed', 'Could not download QR PNG.');
  }
};

// Print QR card(s) in a new window
const printQrCards = (
  tables: any[],
  slug: string,
  restaurantName: string,
  logoUrl: string
) => {
  const win = window.open('', '_blank');
  if (!win) return;

  const cardsHtml = tables.map((t) => {
    const url = buildTableUrl(slug, t.number);
    const qr = buildQrImageUrl(url, 300);
    const displayName = t.name ? `${t.number} · ${t.name}` : `Table ${t.number}`;
    return `
      <div class="card">
        <img class="logo" src="${logoUrl}" alt="Logo" onerror="this.style.display='none'" />
        <div class="rest">${restaurantName}</div>
        <div class="tnum">${displayName}</div>
        ${t.floor ? `<div class="floor">${t.floor}</div>` : ''}
        <img class="qr" src="${qr}" alt="QR" />
        <div class="scan">SCAN TO VIEW MENU &amp; ORDER</div>
        <div class="sub">Request service &amp; pay from your phone</div>
      </div>`;
  }).join('');

  win.document.write(`
    <html><head><title>QR Table Cards</title>
    <style>
      body{font-family:sans-serif;margin:0;padding:20px;display:flex;flex-wrap:wrap;justify-content:center;background:#f8fafc;}
      .card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:28px 24px;margin:14px;width:260px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.08);page-break-inside:avoid;}
      .logo{height:48px;width:48px;object-fit:cover;border-radius:12px;margin-bottom:8px;}
      .rest{font-size:11px;font-weight:800;text-transform:uppercase;color:#64748b;letter-spacing:.06em;}
      .tnum{font-size:24px;font-weight:900;color:#0b1630;margin:12px 0 4px;}
      .floor{font-size:11px;color:#94a3b8;font-weight:600;margin-bottom:8px;}
      .qr{width:190px;height:190px;margin:10px auto;display:block;}
      .scan{font-size:12px;font-weight:900;color:#f97316;margin-top:14px;letter-spacing:.02em;}
      .sub{font-size:10px;color:#94a3b8;margin-top:4px;font-weight:600;}
      @media print{body{background:transparent;padding:0}.card{margin:20px auto;page-break-after:always;box-shadow:none;border:1px solid #cbd5e1;}}
    </style></head>
    <body>${cardsHtml}
    <script>window.onload=function(){window.print();setTimeout(function(){window.close()},600);}<\/script>
    </body></html>`);
  win.document.close();
};

// ─── QR View Modal ────────────────────────────────────────────────────────────
const QrViewModal = ({ table, slug, onClose }: { table: any; slug: string; onClose: () => void }) => {
  const url = buildTableUrl(slug, table.number);
  const qrLarge = buildQrImageUrl(url, 350);
  const label = table.name ? `${table.number} · ${table.name}` : `Table ${table.number}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
          <X size={18} />
        </button>
        <div className="w-12 h-12 bg-orange-50 text-[#F97316] rounded-2xl flex items-center justify-center">
          <QrCode size={24} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-black text-[#0B1630]">{label}</h3>
          {table.floor && <p className="text-xs text-slate-400 font-medium mt-0.5">{table.floor}</p>}
        </div>
        <img src={qrLarge} alt={`QR for ${label}`} className="w-56 h-56 rounded-2xl border border-slate-100 p-2 bg-white" />
        <p className="text-[10px] font-mono text-slate-400 break-all text-center max-w-[280px]">{url}</p>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={() => downloadQrAsPng(url, label)}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#0B1630] text-white text-sm font-bold hover:bg-[#152549] transition-all cursor-pointer"
          >
            <Download size={15} /> PNG
          </button>
          <button
            onClick={() => printQrCards([table], slug, '', '')}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-200 text-[#0B1630] text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Table Form Modal ─────────────────────────────────────────────────────────
const TableFormModal = ({
  selected,
  onClose,
  onSave,
  isSaving,
}: {
  selected: any | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}) => {
  const [form, setForm] = useState({
    number: selected?.number ?? '',
    name: selected?.name ?? '',
    capacity: String(selected?.capacity ?? '4'),
    floor: selected?.floor ?? '',
    isActive: selected?.isActive ?? true,
  });

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number.trim()) return toast.warning('Validation', 'Table number is required.');
    const cap = Number(form.capacity);
    if (isNaN(cap) || cap < 1) return toast.warning('Validation', 'Capacity must be at least 1.');
    onSave({
      number: form.number.trim(),
      name: form.name.trim() || null,
      capacity: cap,
      floor: form.floor.trim() || null,
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-orange-50 text-[#F97316] rounded-2xl flex items-center justify-center">
            <Table2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0B1630]">{selected ? 'Edit Table' : 'Add New Table'}</h3>
            <p className="text-xs text-slate-400">Fill in the table details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Table Number *</label>
              <input
                value={form.number}
                onChange={(e) => set('number', e.target.value)}
                placeholder="e.g. 1, A1, VIP-2"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-[#0B1630] focus:outline-none focus:border-[#F97316] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Capacity *</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-[#0B1630] focus:outline-none focus:border-[#F97316] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Table Name <span className="text-slate-400 normal-case font-medium">(optional)</span></label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. VIP Booth, Garden Table, Rooftop A"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-[#0B1630] focus:outline-none focus:border-[#F97316] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Floor / Section <span className="text-slate-400 normal-case font-medium">(optional)</span></label>
            <input
              value={form.floor}
              onChange={(e) => set('floor', e.target.value)}
              placeholder="e.g. Ground Floor, Mezzanine, Outdoor"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-[#0B1630] focus:outline-none focus:border-[#F97316] transition-colors"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <p className="text-sm font-bold text-[#0B1630]">Table Status</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Inactive tables won't accept QR orders</p>
            </div>
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className="cursor-pointer"
            >
              {form.isActive
                ? <ToggleRight size={36} className="text-emerald-500" />
                : <ToggleLeft size={36} className="text-slate-300" />}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl bg-[#F97316] text-white text-sm font-bold hover:bg-[#ea580c] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : selected ? 'Save Changes' : 'Add Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const QrOrdering = () => {
  const { tenant, loading: tenantLoading } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('tables');
  const [search, setSearch] = useState('');

  // QR View Modal
  const [viewTable, setViewTable] = useState<any | null>(null);

  // Table Form Modal
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  // Config State
  const [slug, setSlug] = useState(tenant?.slug || '');
  const [isCopied, setIsCopied] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [qrEnabled, setQrEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome! Browse our menu and place your order.');
  const [requireApproval, setRequireApproval] = useState(true);
  const [payAtCounter, setPayAtCounter] = useState(true);
  const [onlinePayment, setOnlinePayment] = useState(false);

  const qrMenuUrl = `${window.location.origin}/r/${slug}`;

  // ─── Sync tenant slug ─────────────────────────────────────────────────────
  useEffect(() => {
    if (tenant?.slug) setSlug(tenant.slug);
  }, [tenant]);

  // ─── Load Config ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tenant?.id) return;
    SettingService.getSettings(tenant.id).then((settings) => {
      const qrConfig = settings.businessHours?.qr_config;
      if (qrConfig) {
        setQrEnabled(qrConfig.enabled !== false);
        setWelcomeMessage(qrConfig.welcome_message || 'Welcome! Browse our menu and place your order.');
        setRequireApproval(qrConfig.require_approval !== false);
        setPayAtCounter(qrConfig.pay_at_counter !== false);
        setOnlinePayment(!!qrConfig.online_payment);
      }
    }).catch(console.error);
  }, [tenant?.id]);

  // ─── Tables Query ─────────────────────────────────────────────────────────
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', tenant?.id],
    queryFn: () => TableService.getTables(tenant?.id || ''),
    enabled: !!tenant?.id,
  });

  // Active orders (for delete validation)
  const { data: activeOrders = [] } = useQuery({
    queryKey: ['orders-active', tenant?.id],
    queryFn: () => OrderService.getOrders(tenant?.id || ''),
    enabled: !!tenant?.id,
    select: (data: any[]) => data.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'),
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => TableService.createTable({ tenantId: tenant?.id, ...data }),
    onSuccess: (created) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'CREATE_TABLE',
        entity: 'TABLE',
        entityId: created.id,
        details: `Created table ${created.number}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tables', tenant?.id] });
      setFormOpen(false);
      setSelectedTable(null);
      toast.success('Table Created', `Table ${created.number} has been added.`);
    },
    onError: (e: any) => toast.error('Error', e.message || 'Failed to create table.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => TableService.updateTable(id, data),
    onSuccess: (updated) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'UPDATE_TABLE',
        entity: 'TABLE',
        entityId: updated.id,
        details: `Updated table ${updated.number}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tables', tenant?.id] });
      setFormOpen(false);
      setSelectedTable(null);
      toast.success('Table Updated', `Table ${updated.number} has been saved.`);
    },
    onError: (e: any) => toast.error('Error', e.message || 'Failed to update table.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TableService.deleteTable(id),
    onSuccess: (_r, id) => {
      ActivityLogService.log({
        tenantId: tenant?.id || '',
        userId: user?.id || '',
        action: 'DELETE_TABLE',
        entity: 'TABLE',
        entityId: id,
        details: `Deleted table ID: ${id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['tables', tenant?.id] });
      toast.success('Table Deleted', 'The table has been removed.');
    },
    onError: (e: any) => toast.error('Error', e.message || 'Failed to delete table.'),
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSave = useCallback((data: any) => {
    if (selectedTable) {
      updateMutation.mutate({ id: selectedTable.id, data });
    } else {
      createMutation.mutate(data);
    }
  }, [selectedTable, createMutation, updateMutation]);

  const handleDelete = useCallback((table: any) => {
    const hasActiveOrder = activeOrders.some((o: any) => o.tableId === table.id);
    if (hasActiveOrder) {
      toast.warning('Cannot Delete', `Table ${table.number} has active orders. Please complete them first.`);
      return;
    }
    if (!confirm(`Delete Table ${table.number}? This action cannot be undone.`)) return;
    deleteMutation.mutate(table.id);
  }, [activeOrders, deleteMutation]);

  const handleToggleActive = useCallback((table: any) => {
    updateMutation.mutate({ id: table.id, data: { isActive: !table.isActive } });
  }, [updateMutation]);

  const handleRegenerate = useCallback((table: any) => {
    updateMutation.mutate({ id: table.id, data: { qrStatus: 'ACTIVE', updatedAt: new Date().toISOString() } });
    toast.success('QR Regenerated', `QR code for Table ${table.number} has been refreshed.`);
  }, [updateMutation]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrMenuUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('Copied', 'Menu URL copied to clipboard.');
  };

  const handleSaveConfig = async () => {
    if (!tenant?.id) return;
    setConfigSaving(true);
    try {
      const current = await SettingService.getSettings(tenant.id);
      const updatedBusinessHours = {
        ...(current.businessHours || {}),
        qr_config: { enabled: qrEnabled, welcome_message: welcomeMessage, require_approval: requireApproval, pay_at_counter: payAtCounter, online_payment: onlinePayment },
      };
      await SettingService.updateSettings(tenant.id, { ...current, businessHours: updatedBusinessHours });

      if (slug !== tenant.slug) {
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const { error } = await supabase.from('tenants').update({ slug: cleanSlug }).eq('id', tenant.id);
        if (error) {
          if (error.code === '23505') throw new Error('This slug is already taken. Please choose another.');
          throw error;
        }
      }
      toast.success('Configuration Saved', 'QR settings have been updated.');
    } catch (e: any) {
      toast.error('Save Failed', e.message || 'Could not save configuration.');
    } finally {
      setConfigSaving(false);
    }
  };

  // ─── Bulk Actions ─────────────────────────────────────────────────────────
  const handlePrintAll = () => {
    const active = tables.filter((t: any) => t.isActive !== false);
    if (!active.length) return toast.warning('No Tables', 'No active tables to print.');
    const logo = tenant?.logo || '';
    printQrCards(active, slug, tenant?.name || '', logo);
  };

  const handleDownloadAll = async () => {
    const active = tables.filter((t: any) => t.isActive !== false);
    if (!active.length) return toast.warning('No Tables', 'No active tables to download.');
    toast.success('Downloading…', `Downloading ${active.length} QR codes.`);
    for (const t of active) {
      const url = buildTableUrl(slug, t.number);
      const label = t.name ? `${t.number}_${t.name}` : `Table_${t.number}`;
      await downloadQrAsPng(url, label);
      await new Promise((res) => setTimeout(res, 400));
    }
  };

  const handleExportPackage = () => {
    const data = tables.map((t: any) => ({
      tableNumber: t.number,
      tableName: t.name || null,
      floor: t.floor || null,
      capacity: t.capacity,
      isActive: t.isActive,
      qrUrl: buildTableUrl(slug, t.number),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'restaurant'}_qr_package.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Package Exported', 'QR data package downloaded as JSON.');
  };

  // ─── Filtered Tables ──────────────────────────────────────────────────────
  const filteredTables = useMemo(() =>
    tables.filter((t: any) =>
      t.number.toLowerCase().includes(search.toLowerCase()) ||
      (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.floor || '').toLowerCase().includes(search.toLowerCase())
    ),
    [tables, search]
  );

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalActive = tables.filter((t: any) => t.isActive !== false).length;
  const totalInactive = tables.filter((t: any) => t.isActive === false).length;
  const totalWithOrders = activeOrders.reduce((acc: Set<string>, o: any) => {
    if (o.tableId) acc.add(o.tableId);
    return acc;
  }, new Set<string>()).size;

  if (tenantLoading || !tenant) return <PageLoader label="Loading QR Workspace…" />;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1630]">QR Ordering</h1>
          <p className="text-[#64748B] mt-1 text-sm font-medium">
            Manage your restaurant's table QR codes and ordering configuration.
          </p>
        </div>
        <button
          onClick={() => window.open(qrMenuUrl, '_blank')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Eye size={15} /> Live View <ExternalLink size={13} />
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tables', value: tables.length, icon: Table2, color: 'bg-indigo-50 text-indigo-500' },
          { label: 'Active Tables', value: totalActive, icon: ToggleRight, color: 'bg-emerald-50 text-emerald-500' },
          { label: 'Inactive Tables', value: totalInactive, icon: ToggleLeft, color: 'bg-slate-100 text-slate-400' },
          { label: 'Occupied Now', value: totalWithOrders, icon: AlertCircle, color: 'bg-orange-50 text-orange-500' },
        ].map((s) => (
          <Card key={s.label} className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">{s.label}</p>
              <h3 className="text-xl font-black text-[#0B1630]">{s.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {([
          { id: 'tables', label: 'Table QR Management', icon: QrCode },
          { id: 'config', label: 'Configuration', icon: Settings },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              tab === t.id
                ? 'bg-white text-[#0B1630] shadow-sm'
                : 'text-slate-500 hover:text-[#0B1630]'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TABLE QR MANAGEMENT TAB                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'tables' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tables…"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-[#0B1630] focus:outline-none focus:border-[#F97316] transition-colors"
              />
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePrintAll}
                className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Printer size={14} /> Print All
              </button>
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Download size={14} /> Download All
              </button>
              <button
                onClick={handleExportPackage}
                className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-[#0B1630] hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Package size={14} /> Export Package
              </button>
              <button
                onClick={() => { setSelectedTable(null); setFormOpen(true); }}
                className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#F97316] text-white text-sm font-bold hover:bg-[#ea580c] transition-all shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <Plus size={14} /> Add Table
              </button>
            </div>
          </div>

          {/* Tables Grid */}
          {tablesLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm font-bold">Loading tables…</div>
          ) : filteredTables.length === 0 ? (
            <Card className="p-12 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                <QrCode size={28} className="text-slate-300" />
              </div>
              <div>
                <p className="text-base font-black text-[#0B1630]">No tables yet</p>
                <p className="text-sm text-slate-400 mt-1">Add your first table to generate QR codes.</p>
              </div>
              <button
                onClick={() => { setSelectedTable(null); setFormOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F97316] text-white text-sm font-bold hover:bg-[#ea580c] transition-all cursor-pointer"
              >
                <Plus size={14} /> Add First Table
              </button>
            </Card>
          ) : (
            <Card className="border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Table', 'QR Preview', 'Capacity', 'Status', 'Last Updated', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTables.map((t: any) => {
                      const tableUrl = buildTableUrl(slug, t.number);
                      const qrThumb = buildQrImageUrl(tableUrl, 80);
                      const isOccupied = activeOrders.some((o: any) => o.tableId === t.id);
                      return (
                        <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                          {/* Table Info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                                t.isActive !== false ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {t.number}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#0B1630] leading-tight">
                                  {t.name ? `${t.name}` : `Table ${t.number}`}
                                </p>
                                {t.floor && (
                                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                    <Layers size={10} /> {t.floor}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* QR Preview */}
                          <td className="px-5 py-4">
                            <button
                              onClick={() => setViewTable(t)}
                              className="group/qr relative cursor-pointer"
                              title="View QR Code"
                            >
                              <img
                                src={qrThumb}
                                alt={`QR for table ${t.number}`}
                                className="w-12 h-12 rounded-lg border border-slate-100 p-0.5 bg-white group-hover/qr:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/qr:bg-black/10 rounded-lg transition-all flex items-center justify-center">
                                <Eye size={12} className="text-white opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          </td>

                          {/* Capacity */}
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-[#0B1630]">{t.capacity}</span>
                            <span className="text-xs text-slate-400 ml-1">seats</span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1.5">
                              {/* Active / Inactive */}
                              <button
                                onClick={() => handleToggleActive(t)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  t.isActive !== false
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${t.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {t.isActive !== false ? 'Active' : 'Inactive'}
                              </button>

                              {/* Occupied indicator */}
                              {isOccupied && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[9px] font-black uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                  Occupied
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Last Updated */}
                          <td className="px-5 py-4">
                            <span className="text-xs text-slate-500 font-medium">{formatDate(t.updatedAt || t.createdAt)}</span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              {/* View QR */}
                              <button
                                onClick={() => setViewTable(t)}
                                title="View QR Code"
                                className="p-2 rounded-lg text-slate-400 hover:text-[#0B1630] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              >
                                <Eye size={14} />
                              </button>
                              {/* Download PNG */}
                              <button
                                onClick={() => downloadQrAsPng(tableUrl, t.name ? `${t.number}_${t.name}` : `Table_${t.number}`)}
                                title="Download PNG"
                                className="p-2 rounded-lg text-slate-400 hover:text-[#0B1630] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              >
                                <Download size={14} />
                              </button>
                              {/* Print / PDF */}
                              <button
                                onClick={() => printQrCards([t], slug, tenant?.name || '', tenant?.logo || '')}
                                title="Print / Save as PDF"
                                className="p-2 rounded-lg text-slate-400 hover:text-[#0B1630] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              >
                                <Printer size={14} />
                              </button>
                              {/* Regenerate */}
                              <button
                                onClick={() => handleRegenerate(t)}
                                title="Regenerate QR Code"
                                className="p-2 rounded-lg text-slate-400 hover:text-[#0B1630] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              >
                                <RefreshCw size={14} />
                              </button>
                              {/* Edit */}
                              <button
                                onClick={() => { setSelectedTable(t); setFormOpen(true); }}
                                title="Edit Table"
                                className="p-2 rounded-lg text-slate-400 hover:text-[#0B1630] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(t)}
                                title="Delete Table"
                                className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 font-medium">
                  {filteredTables.length} of {tables.length} tables
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Click the QR preview or <Eye size={10} className="inline" /> to view the full QR code
                </span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CONFIGURATION TAB                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Link Card */}
          <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-5">
            <h3 className="text-base font-black text-[#0B1630] flex items-center gap-2">
              <QrCode size={18} className="text-[#F97316]" /> Restaurant QR Menu Link
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={qrMenuUrl}
                  readOnly
                  className="w-full h-12 pl-4 pr-12 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-mono text-slate-600 focus:outline-none"
                />
                <button onClick={copyToClipboard} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1630] cursor-pointer">
                  {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
              <button
                onClick={handlePrintAll}
                className="h-12 px-5 rounded-xl bg-[#0B1630] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#152549] transition-all cursor-pointer"
              >
                <Printer size={15} /> Print All
              </button>
            </div>
          </Card>

          {/* Settings Card */}
          <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-5">
            <h3 className="text-base font-black text-[#0B1630] flex items-center gap-2">
              <Settings size={18} className="text-[#F97316]" /> QR Ordering Settings
            </h3>

            <div className="space-y-3">
              {/* Enable QR */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-[#0B1630]">Enable QR Ordering</p>
                  <p className="text-[10px] text-slate-400">Allow customers to order via QR menu</p>
                </div>
                <button onClick={() => setQrEnabled(!qrEnabled)} className="cursor-pointer">
                  {qrEnabled ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
                </button>
              </div>

              {/* Require Approval */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-[#0B1630]">Require POS Approval</p>
                  <p className="text-[10px] text-slate-400">Orders must be verified before going to KDS</p>
                </div>
                <button onClick={() => setRequireApproval(!requireApproval)} className="cursor-pointer">
                  {requireApproval ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
                </button>
              </div>

              {/* Restaurant Slug */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Restaurant Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. royalcafe"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/30 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#F97316] transition-colors"
                />
              </div>

              {/* Welcome Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Welcome Message</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/30 text-xs text-slate-700 focus:outline-none focus:border-[#F97316] resize-none transition-colors"
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#0B1630] uppercase tracking-widest">Payment Methods</label>
                {[
                  { label: 'Pay at Counter', sub: 'Customers pay cash/card at register', val: payAtCounter, set: setPayAtCounter },
                  { label: 'Online Payment (Card/Mobile)', sub: 'Accept digital payments instantly', val: onlinePayment, set: setOnlinePayment },
                ].map((pm) => (
                  <label key={pm.label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/20 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={pm.val} onChange={(e) => pm.set(e.target.checked)} className="w-4 h-4 accent-[#F97316]" />
                    <div>
                      <p className="text-xs font-bold text-[#0B1630]">{pm.label}</p>
                      <p className="text-[10px] text-slate-400">{pm.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={configSaving}
                className="w-full bg-[#F97316] text-white h-12 rounded-xl font-bold text-sm hover:bg-[#ea580c] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {configSaving ? 'Saving…' : 'Save Configuration'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Modals ── */}
      {viewTable && (
        <QrViewModal
          table={viewTable}
          slug={slug}
          onClose={() => setViewTable(null)}
        />
      )}

      {formOpen && (
        <TableFormModal
          selected={selectedTable}
          onClose={() => { setFormOpen(false); setSelectedTable(null); }}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
