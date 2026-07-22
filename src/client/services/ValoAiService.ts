import { supabase } from '../../lib/supabase';

export interface AiResponse {
  message: string;
  type: 'text' | 'card' | 'insight';
  data?: any; // Structured data for rendering custom components/calculations
}

export const ValoAiService = {
  /**
   * Main entry point to process a cashier prompt with strict restaurant isolation.
   */
  async processMessage(query: string, tenantId: string): Promise<AiResponse> {
    const q = query.toLowerCase().trim();

    if (!tenantId) {
      return {
        message: 'No active restaurant workspace context detected. Please ensure you are logged into a valid restaurant account.',
        type: 'text'
      };
    }

    // ─── 0. SECURITY GUARD: REJECT CROSS-TENANT & PLATFORM-WIDE QUERIES ───
    const forbiddenKeywords = [
      'other restaurant', 'another restaurant', 'all restaurants', 
      'entire platform', 'platform revenue', 'platform earned', 
      'which restaurant earned', 'how many restaurants exist', 
      'show another restaurant', 'top restaurant', 'platform stats',
      'other tenant', 'another tenant'
    ];

    if (forbiddenKeywords.some(keyword => q.includes(keyword))) {
      return {
        message: '🔒 **Access Restricted**: This information is outside the Cashier role\'s permissions. I can only access and assist with operational records from your current restaurant workspace.',
        type: 'text'
      };
    }

    try {
      // Fetch tenant info & currency formatting
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('name, currency_code, currency_symbol')
        .eq('id', tenantId)
        .maybeSingle();

      const currency = tenantData?.currency_symbol || tenantData?.currency_code || 'ETB';
      const restaurantName = tenantData?.name || 'this restaurant';

      // Timestamps for date filtering
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // ─── 1. PAYMENT METHOD BREAKDOWN (CASH, CARD, MOBILE) ───
      if (q.includes('cash') || q.includes('card') || q.includes('mobile') || q.includes('payment method')) {
        const { data: receipts } = await supabase
          .from('receipts')
          .select('payment_method, total_amount, payment_status, created_at')
          .eq('tenant_id', tenantId)
          .gte('created_at', startOfToday.toISOString());

        const validReceipts = (receipts || []).filter((r: any) => r.payment_status !== 'REFUNDED');
        const cashTotal = validReceipts.filter((r: any) => r.payment_method === 'Cash').reduce((acc: number, r: any) => acc + Number(r.total_amount), 0);
        const cardTotal = validReceipts.filter((r: any) => r.payment_method === 'Card' || r.payment_method === 'CREDIT_CARD').reduce((acc: number, r: any) => acc + Number(r.total_amount), 0);
        const mobileTotal = validReceipts.filter((r: any) => r.payment_method === 'Mobile Money').reduce((acc: number, r: any) => acc + Number(r.total_amount), 0);
        const bankTotal = validReceipts.filter((r: any) => r.payment_method === 'Bank Transfer').reduce((acc: number, r: any) => acc + Number(r.total_amount), 0);

        return {
          message: `### Payment Methods Breakdown — Today (${restaurantName})\n` +
            `- **Cash Payments**: ${currency} ${cashTotal.toFixed(2)}\n` +
            `- **Card Payments**: ${currency} ${cardTotal.toFixed(2)}\n` +
            `- **Mobile Money**: ${currency} ${mobileTotal.toFixed(2)}\n` +
            `- **Bank Transfer**: ${currency} ${bankTotal.toFixed(2)}\n\n` +
            `*Total Receipts Settled Today*: **${validReceipts.length}**`,
          type: 'text'
        };
      }

      // ─── 2. TOP SELLING MENU ITEMS ───
      if (q.includes('top') || q.includes('most sold') || q.includes('menu item') || q.includes('popular')) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('quantity, price, menu_items(name)')
          .eq('tenant_id', tenantId);

        const itemMap: Record<string, { name: string; qty: number; total: number }> = {};
        (orderItems || []).forEach((item: any) => {
          const name = item.menu_items?.name || 'Item';
          if (!itemMap[name]) itemMap[name] = { name, qty: 0, total: 0 };
          itemMap[name].qty += item.quantity || 1;
          itemMap[name].total += (item.quantity || 1) * Number(item.price || 0);
        });

        const topList = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

        if (topList.length === 0) {
          return {
            message: `No item sales recorded yet for **${restaurantName}**.`,
            type: 'text'
          };
        }

        const lines = topList.map((item, idx) => `${idx + 1}. **${item.name}** — ${item.qty} sold (${currency} ${item.total.toFixed(2)})`).join('\n');
        return {
          message: `### Top Selling Menu Items (${restaurantName})\n${lines}`,
          type: 'text'
        };
      }

      // ─── 3. WAITER / STAFF PERFORMANCE ───
      if (q.includes('waiter') || q.includes('staff') || q.includes('server')) {
        const { data: orders } = await supabase
          .from('orders')
          .select('waiter_id, total_amount, status, created_at, waiter:users!orders_waiter_id_fkey(first_name, last_name)')
          .eq('tenant_id', tenantId)
          .gte('created_at', startOfToday.toISOString());

        const waiterMap: Record<string, { name: string; count: number; sales: number }> = {};
        (orders || []).forEach((o: any) => {
          const name = o.waiter ? `${o.waiter.first_name} ${o.waiter.last_name}` : 'Staff';
          if (!waiterMap[name]) waiterMap[name] = { name, count: 0, sales: 0 };
          waiterMap[name].count += 1;
          if (o.status === 'COMPLETED') waiterMap[name].sales += Number(o.total_amount || 0);
        });

        const topWaiters = Object.values(waiterMap).sort((a, b) => b.count - a.count);

        if (topWaiters.length === 0) {
          return {
            message: `No order activity logged for waiters today at **${restaurantName}**.`,
            type: 'text'
          };
        }

        const lines = topWaiters.map((w, idx) => `${idx + 1}. **${w.name}** — ${w.count} orders handled (${currency} ${w.sales.toFixed(2)} completed)`).join('\n');
        return {
          message: `### Waiter Performance Leaderboard — Today (${restaurantName})\n${lines}`,
          type: 'text'
        };
      }

      // ─── 4. TAX COLLECTED TODAY ───
      if (q.includes('tax') || q.includes('vat')) {
        const { data: receipts } = await supabase
          .from('receipts')
          .select('tax_amount, total_amount, payment_status')
          .eq('tenant_id', tenantId)
          .gte('created_at', startOfToday.toISOString());

        const validReceipts = (receipts || []).filter((r: any) => r.payment_status !== 'REFUNDED');
        const taxTotal = validReceipts.reduce((acc: number, r: any) => acc + Number(r.tax_amount || 0), 0);
        const totalSales = validReceipts.reduce((acc: number, r: any) => acc + Number(r.total_amount || 0), 0);

        return {
          message: `### Tax Telemetry — Today (${restaurantName})\n` +
            `- **Total Tax Collected (15% VAT)**: **${currency} ${taxTotal.toFixed(2)}**\n` +
            `- **Gross Receipts Subject to Tax**: ${currency} ${totalSales.toFixed(2)}`,
          type: 'text'
        };
      }

      // ─── 5. CUSTOMERS LIST & COUNT ───
      if (q.includes('customer') || q.includes('guest') || q.includes('diner')) {
        const { data: orders } = await supabase
          .from('orders')
          .select('customer_name, table_number, created_at, status')
          .eq('tenant_id', tenantId)
          .gte('created_at', startOfToday.toISOString());

        const customers = Array.from(new Set((orders || []).map((o: any) => o.customer_name).filter(Boolean)));

        return {
          message: `### Today's Customer Activity (${restaurantName})\n` +
            `- **Unique Customers Logged**: **${customers.length}**\n` +
            `- **Total Table Checks Opened**: ${(orders || []).length}\n\n` +
            (customers.length > 0 ? `*Recent Diners*: ${customers.join(', ')}` : '*No customer names specified on walk-in checks.*'),
          type: 'text'
        };
      }

      // ─── 6. UNPAID & PENDING ORDERS QUEUE ───
      if (q.includes('unpaid') || q.includes('pending') || q.includes('open order')) {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, order_number, table_number, total_amount, status, created_at')
          .eq('tenant_id', tenantId)
          .neq('status', 'COMPLETED')
          .neq('status', 'CANCELED');

        const unpaid = orders || [];
        if (unpaid.length === 0) {
          return {
            message: `Great news! There are **no unpaid active orders** currently open for **${restaurantName}**. All orders are settled.`,
            type: 'text'
          };
        }

        return {
          message: `Found **${unpaid.length}** open/unpaid orders for **${restaurantName}**:`,
          type: 'card',
          data: {
            title: `Unpaid Orders Queue (${restaurantName})`,
            ordersList: unpaid.map((o: any) => ({
              id: o.order_number || `#${o.id.slice(0, 8)}`,
              status: o.status,
              total: Number(o.total_amount),
              table: o.table_number ? `Table ${o.table_number}` : 'N/A'
            }))
          }
        };
      }

      // ─── 7. RESTAURANT REVENUE & SALES STATS ───
      if (q.includes('revenue') || q.includes('sales') || q.includes('earned') || q.includes('today')) {
        const { data: receipts } = await supabase
          .from('receipts')
          .select('total_amount, payment_status')
          .eq('tenant_id', tenantId)
          .gte('created_at', startOfToday.toISOString());

        const { data: orders } = await supabase
          .from('orders')
          .select('status, total_amount')
          .eq('tenant_id', tenantId)
          .gte('created_at', startOfToday.toISOString());

        const validReceipts = (receipts || []).filter((r: any) => r.payment_status !== 'REFUNDED');
        const todayTotalSales = validReceipts.reduce((acc: number, r: any) => acc + Number(r.total_amount), 0);
        const compCount = (orders || []).filter((o: any) => o.status === 'COMPLETED').length;
        const pendCount = (orders || []).filter((o: any) => ['PENDING', 'PREPARING', 'READY'].includes(o.status)).length;

        return {
          message: `Here is today's real-time operational dashboard summary for **${restaurantName}**:`,
          type: 'insight',
          data: {
            revenue: todayTotalSales,
            completedOrders: compCount,
            pendingOrders: pendCount,
            activeTables: Array.from(new Set((orders || []).filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELED').map((o: any) => o.table_number))).length
          }
        };
      }

      // ─── 8. BILL SPLITS & CALCULATOR ───
      if (q.includes('split') || q.includes('divide')) {
        const tableMatch = q.match(/table\s+(\d+)/);
        const splitMatch = q.match(/(?:by|between|into)\s+(\d+)/) || q.match(/(\d+)\s+people/);
        
        if (tableMatch) {
          const tableNo = tableMatch[1];
          const divisor = splitMatch ? parseInt(splitMatch[1], 10) : 2;

          const { data: activeOrder } = await supabase
            .from('orders')
            .select('*, items:order_items(*, menuItem:menu_items(*))')
            .eq('tenant_id', tenantId)
            .eq('table_number', tableNo)
            .neq('status', 'COMPLETED')
            .neq('status', 'CANCELED')
            .maybeSingle();

          if (!activeOrder) {
            return {
              message: `I couldn't find any unpaid active orders for **Table ${tableNo}** at ${restaurantName}.`,
              type: 'text'
            };
          }

          const total = Number(activeOrder.total_amount);
          const splitAmount = total / divisor;
          const tax = total * 0.15;
          const subtotal = total - tax;

          return {
            message: `Here is the bill split breakdown for **Table ${tableNo}** split between **${divisor}** guests:`,
            type: 'card',
            data: {
              title: `Bill Split — Table ${tableNo}`,
              divisor,
              subtotal,
              tax,
              total,
              perPerson: splitAmount,
              details: activeOrder.items?.map((item: any) => ({
                name: item.menuItem?.name || 'Item',
                quantity: item.quantity,
                price: Number(item.price)
              }))
            }
          };
        }
      }

      // Default conversational fallback
      return {
        message: `Hello! I am your **DHADHAN AI Cashier Assistant** for **${restaurantName}**.\n\nI can answer questions using records from this restaurant only:\n- *What are today's total sales?*\n- *Show today's cash vs card payments*\n- *Which menu item sold the most this week?*\n- *List unpaid orders*\n- *Which waiter handled the most orders today?*\n- *How much tax was collected today?*`,
        type: 'text'
      };

    } catch (err: any) {
      return {
        message: `An error occurred while compiling AI operation context: ${err.message || 'database timeout'}. Please try again.`,
        type: 'text'
      };
    }
  }
};
