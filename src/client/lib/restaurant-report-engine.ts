import { ReceiptService, OrderService } from '../services/ApiService';
import { exportToPdf, exportToExcel, exportToCsv } from './export-utils';
import { toast } from './toast-store';

export type DateRangeType = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL' | 'CUSTOM';

export interface GenerateRestaurantReportOptions {
  tenantId: string;
  tenantName: string;
  currencySymbol?: string;
  currencyCode?: string;
  dateRange?: DateRangeType;
  customStartDate?: string;
  customEndDate?: string;
  formatType: 'PDF' | 'EXCEL' | 'CSV';
}

const filterByDateRange = (itemDate: Date, range: DateRangeType, customStartDate?: string, customEndDate?: string) => {
  const itemTime = itemDate.getTime();
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  
  if (range === 'TODAY') {
    return itemTime >= startOfToday.getTime();
  }
  if (range === 'YESTERDAY') {
    return itemTime >= startOfYesterday.getTime() && itemTime < startOfToday.getTime();
  }
  if (range === 'WEEK') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return itemTime >= oneWeekAgo.getTime();
  }
  if (range === 'MONTH') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return itemTime >= thirtyDaysAgo.getTime();
  }
  if (range === 'CUSTOM') {
    const start = customStartDate ? new Date(customStartDate) : new Date(0);
    start.setHours(0,0,0,0);
    const end = customEndDate ? new Date(customEndDate) : new Date();
    end.setHours(23,59,59,999);
    return itemTime >= start.getTime() && itemTime <= end.getTime();
  }
  return true;
};

export const generateRestaurantReportPackage = async ({
  tenantId,
  tenantName,
  currencySymbol,
  currencyCode,
  dateRange = 'ALL',
  customStartDate,
  customEndDate,
  formatType
}: GenerateRestaurantReportOptions) => {
  try {
    toast.success('Generating Report', `Compiling financial operations report for ${tenantName}...`);

    // 1. Fetch live receipts & orders for target tenant
    const receipts = await ReceiptService.getReceipts(tenantId);
    const orders = await OrderService.getOrders(tenantId);

    // 2. Filter by date range
    const filteredReceipts = receipts.filter((r: any) => 
      filterByDateRange(new Date(r.createdAt), dateRange, customStartDate, customEndDate)
    );

    // 3. Compute exact summary metrics matching Reports.tsx 1-to-1
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRevenue = receipts
      .filter((r: any) => {
        const itemTime = new Date(r.createdAt).getTime();
        return itemTime >= startOfToday.getTime() && r.status !== 'REFUNDED';
      })
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);

    const pendingPayments = orders
      .filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELED')
      .reduce((sum, o: any) => sum + Number(o.totalAmount), 0);

    const completedPaymentsCount = filteredReceipts
      .filter((r: any) => r.status !== 'REFUNDED')
      .length;

    const refundedAmount = filteredReceipts
      .filter((r: any) => r.status === 'REFUNDED')
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);

    const grossRevenue = filteredReceipts.reduce((sum, r: any) => sum + Number(r.totalAmount), 0);
    const netRevenue = grossRevenue - refundedAmount;

    // 4. Format headers and rows matching Reports.tsx 1-to-1
    const symbol = currencySymbol || currencyCode || 'ETB';
    const headers = ['Time', 'Receipt No.', 'Order No.', 'Table', 'Customer', 'Waiter', 'Cashier', 'Method', 'Amount', 'Status'];

    const rows = filteredReceipts.map((r: any) => [
      new Date(r.createdAt).toLocaleString(),
      r.receiptNumber,
      r.order?.orderNumber || '',
      r.order?.tableNumber ? `Table ${r.order.tableNumber}` : 'N/A',
      r.order?.customerName || 'Walk-in',
      r.order?.waiterName || '',
      r.cashierName,
      r.paymentMethod,
      r.totalAmount,
      r.status || 'PAID'
    ]);

    const options = {
      title: 'Financial Operations Report',
      subtitle: 'Real-time payment journal auditing & sales records',
      restaurantName: tenantName,
      dateRange: dateRange,
      headers,
      rows,
      summaryMetrics: [
        { label: 'Net Revenue', value: `${symbol} ${netRevenue.toFixed(2)}` },
        { label: 'Today Revenue', value: `${symbol} ${todayRevenue.toFixed(2)}` },
        { label: 'Pending Payments', value: `${symbol} ${pendingPayments.toFixed(2)}` },
        { label: 'Completed Receipts', value: completedPaymentsCount },
        { label: 'Refunded Amount', value: `${symbol} ${refundedAmount.toFixed(2)}` },
      ],
      filename: `financial_report_${tenantName.toLowerCase().replace(/\s+/g, '_')}_${dateRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`
    };

    if (formatType === 'PDF') {
      exportToPdf(options);
    } else if (formatType === 'EXCEL') {
      exportToExcel(options);
    } else if (formatType === 'CSV') {
      exportToCsv(options);
    }

    toast.success('Report Exported', `${tenantName} report package downloaded as ${formatType}.`);
  } catch (error: any) {
    console.error('[generateRestaurantReportPackage] Export failed:', error);
    toast.error('Export Failed', error.message || 'Could not compile restaurant report.');
  }
};
