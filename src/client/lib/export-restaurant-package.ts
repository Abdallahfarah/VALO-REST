import { supabase } from '../../lib/supabase';
import { exportToPdf, exportToExcel, exportToCsv } from './export-utils';
import { toast } from './toast-store';

export interface TenantExportTarget {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  currency_code?: string;
  currency_symbol?: string;
}

export const exportRestaurantPackage = async (
  tenant: TenantExportTarget,
  formatType: 'PDF' | 'EXCEL' | 'CSV'
) => {
  try {
    toast.success('Compiling Report', `Fetching live data for ${tenant.name}...`);

    const tenantId = tenant.id;
    const currency = tenant.currency_symbol || tenant.currency_code || 'ETB';

    // 1. Query Receipts
    const { data: receipts } = await supabase
      .from('receipts')
      .select('*, orders(order_number, table_number, customer_name), cashier:users!receipts_cashier_id_fkey(first_name, last_name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // 2. Query Orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId);

    // 3. Query Menu Items & Categories
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*, categories(name)')
      .eq('tenant_id', tenantId);

    // 4. Query Tables
    const { data: tables } = await supabase
      .from('tables')
      .select('*')
      .eq('tenant_id', tenantId);

    // 5. Query Staff Users
    const { data: staffUsers } = await supabase
      .from('users')
      .select('id, first_name, last_name, role, email')
      .eq('tenant_id', tenantId);

    // Calculate Summary Metrics
    const validReceipts = (receipts || []).filter((r: any) => r.payment_status !== 'REFUNDED');
    const grossSales = validReceipts.reduce((acc: number, r: any) => acc + Number(r.total_amount || 0), 0);
    const refundedSales = (receipts || [])
      .filter((r: any) => r.payment_status === 'REFUNDED')
      .reduce((acc: number, r: any) => acc + Number(r.total_amount || 0), 0);
    
    const netSales = grossSales - refundedSales;
    const receiptsCount = validReceipts.length;
    const avgTicket = receiptsCount > 0 ? grossSales / receiptsCount : 0;
    const totalOrdersCount = (orders || []).length;
    const activeMenuItemsCount = (menuItems || []).length;
    const totalTablesCount = (tables || []).length;
    const totalStaffCount = (staffUsers || []).length;

    // Prepare Table Rows for Detailed Financial Audit
    const headers = ['Time', 'Receipt No.', 'Order No.', 'Table', 'Customer', 'Cashier', 'Method', `Amount (${currency})`, 'Status'];
    
    const rows = (receipts || []).map((r: any) => [
      new Date(r.created_at).toLocaleString(),
      r.receipt_number || 'N/A',
      r.orders?.order_number || 'N/A',
      r.orders?.table_number ? `Table ${r.orders.table_number}` : 'N/A',
      r.orders?.customer_name || 'Walk-in',
      r.cashier ? `${r.cashier.first_name} ${r.cashier.last_name}` : 'Staff',
      r.payment_method || 'CASH',
      Number(r.total_amount || 0).toFixed(2),
      r.payment_status || 'PAID'
    ]);

    const options = {
      title: `Comprehensive Operations Report — ${tenant.name}`,
      subtitle: `Slug: ${tenant.slug} | Currency: ${currency}`,
      restaurantName: tenant.name,
      dateRange: 'ALL AVAILABLE RECORDS',
      headers,
      rows,
      summaryMetrics: [
        { label: 'Gross Sales', value: `${currency} ${grossSales.toFixed(2)}` },
        { label: 'Net Revenue', value: `${currency} ${netSales.toFixed(2)}` },
        { label: 'Total Orders', value: totalOrdersCount },
        { label: 'Avg Ticket Size', value: `${currency} ${avgTicket.toFixed(2)}` },
        { label: 'Active Menu Items', value: activeMenuItemsCount },
        { label: 'Floor Plan Tables', value: totalTablesCount },
        { label: 'Staff Members', value: totalStaffCount },
      ],
      filename: `report_package_${tenant.slug}_${new Date().toISOString().slice(0, 10)}`
    };

    if (formatType === 'PDF') {
      exportToPdf(options);
    } else if (formatType === 'EXCEL') {
      exportToExcel(options);
    } else if (formatType === 'CSV') {
      exportToCsv(options);
    }

    toast.success('Export Ready', `${tenant.name} reports exported as ${formatType}.`);
  } catch (error: any) {
    console.error('[exportRestaurantPackage] Export error:', error);
    toast.error('Export Failed', error.message || 'Could not compile restaurant report package.');
  }
};
