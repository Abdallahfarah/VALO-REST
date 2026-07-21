import { supabase } from '../../lib/supabase';

export interface AiResponse {
  message: string;
  type: 'text' | 'card' | 'insight';
  data?: any; // Structured data for rendering custom components/calculations
}

export const ValoAiService = {
  /**
   * Main entry point to process a cashier prompt with real restaurant context.
   */
  async processMessage(query: string, tenantId: string): Promise<AiResponse> {
    const q = query.toLowerCase().trim();

    try {
      // Fetch tenant settings for currency formatting
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('currency_code')
        .eq('id', tenantId)
        .maybeSingle();

      const currency = tenantData?.currency_code || 'ETB';

      // 1. Fetch live orders & receipts for today to feed context calculations
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch active/recent orders
      const { data: orders = [] } = await supabase
        .from('orders')
        .select('*, items:order_items(*, menuItem:menu_items(*))')
        .eq('tenant_id', tenantId)
        .gte('created_at', today.toISOString());

      // Fetch active receipts
      const { data: receipts = [] } = await supabase
        .from('receipts')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', today.toISOString());

      // ─── CASE A: BILL CALCULATIONS & SPLITS ───
      if (q.includes('split') || q.includes('divide')) {
        const tableMatch = q.match(/table\s+(\d+)/);
        const splitMatch = q.match(/(?:by|between|into)\s+(\d+)/) || q.match(/(\d+)\s+people/);
        
        if (tableMatch) {
          const tableNo = tableMatch[1];
          const divisor = splitMatch ? parseInt(splitMatch[1], 10) : 2;

          // Find unpaid order for table
          const activeOrder = orders?.find(
            (o: any) => o.table_number === tableNo && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
          );

          if (!activeOrder) {
            return {
              message: `I couldn't find any unpaid active orders for **Table ${tableNo}**. Please check the active orders list.`,
              type: 'text'
            };
          }

          const total = Number(activeOrder.total_amount);
          const splitAmount = total / divisor;
          const tax = total * 0.15; // 15% VAT
          const subtotal = total - tax;

          return {
            message: `Here is the bill split details for **Table ${tableNo}** split between **${divisor}** guests:`,
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

        // Generic value split (e.g. split 500 by 3)
        const valueMatch = q.match(/(?:split|divide)\s+(\d+)(?:\s+by\s+(\d+))?/);
        if (valueMatch) {
          const totalVal = parseFloat(valueMatch[1]);
          const divisor = valueMatch[2] ? parseInt(valueMatch[2], 10) : 2;
          return {
            message: `Here is the split breakdown for **${currency} ${totalVal}** split by **${divisor}**:`,
            type: 'card',
            data: {
              title: `Quick Calculator Split`,
              divisor,
              total: totalVal,
              perPerson: totalVal / divisor
            }
          };
        }
      }

      // ─── CASE B: VERIFY / CALCULATE TAX AND VAT ───
      if (q.includes('tax') || q.includes('vat') || q.includes('calculate')) {
        const valMatch = q.match(/(?:tax|vat|calculate)\s+(?:for\s+)?(?:etb\s+)?(\d+)/) || q.match(/(\d+)\s+(?:tax|vat)/);
        if (valMatch) {
          const val = parseFloat(valMatch[1]);
          const vatRate = 0.15; // 15% VAT default
          const taxAmount = val * vatRate;
          const totalWithTax = val + taxAmount;

          return {
            message: `VAT calculation breakdown (15% rate) for base amount **${currency} ${val}**:`,
            type: 'card',
            data: {
              title: `VAT Calculation`,
              subtotal: val,
              tax: taxAmount,
              total: totalWithTax
            }
          };
        }
      }

      // ─── CASE C: RESTAURANT REVENUE & STATS INSIGHTS ───
      if (q.includes('revenue') || q.includes('sales') || q.includes('insights') || q.includes('total earned')) {
        const totalSales = receipts?.reduce((acc: number, r: any) => acc + Number(r.total_amount), 0) || 0;
        const compCount = orders?.filter((o: any) => o.status === 'COMPLETED').length || 0;
        const pendCount = orders?.filter((o: any) => ['PENDING', 'PREPARING', 'READY'].includes(o.status)).length || 0;

        return {
          message: `Here is today's real-time operational dashboard summary:`,
          type: 'insight',
          data: {
            revenue: totalSales,
            completedOrders: compCount,
            pendingOrders: pendCount,
            activeTables: Array.from(new Set(orders?.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').map((o: any) => o.table_number))).length
          }
        };
      }

      // ─── CASE D: LOCATE / SEARCH ORDERS ───
      if (q.includes('order') || q.includes('table') || q.includes('find')) {
        // Search by table number
        const tableMatch = q.match(/table\s+(\d+)/);
        if (tableMatch) {
          const tableNo = tableMatch[1];
          const tableOrders = orders?.filter((o: any) => o.table_number === tableNo);

          if (!tableOrders || tableOrders.length === 0) {
            return {
              message: `There are currently no active orders logged for **Table ${tableNo}** today.`,
              type: 'text'
            };
          }

          return {
            message: `Found **${tableOrders.length}** order(s) for **Table ${tableNo}**:`,
            type: 'card',
            data: {
              title: `Orders — Table ${tableNo}`,
              ordersList: tableOrders.map((o: any) => ({
                id: o.id.slice(0, 8),
                status: o.status,
                total: Number(o.total_amount),
                time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }))
            }
          };
        }

        // Unpaid orders count
        if (q.includes('unpaid') || q.includes('pending')) {
          const unpaid = orders?.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED') || [];
          if (unpaid.length === 0) {
            return {
              message: `Great news! There are **no unpaid orders** currently. All orders are settled.`,
              type: 'text'
            };
          }

          return {
            message: `There are **${unpaid.length}** unpaid active orders in the workspace:`,
            type: 'card',
            data: {
              title: `Unpaid Orders Queue`,
              ordersList: unpaid.map((o: any) => ({
                id: o.id.slice(0, 8),
                status: o.status,
                total: Number(o.total_amount),
                table: o.table_number
              }))
            }
          };
        }
      }

      // ─── CASE E: STAFF ASSISTANCE WORKFLOWS ───
      if (q.includes('refund') || q.includes('policy')) {
        return {
          message: `### DHADHAN Refund Procedures\n1. Refunds must be processed within **24 hours** of order completion.\n2. Tap the target receipt in the **Receipts** tab, click **Void / Refund**.\n3. Type a clear reason (e.g. "Wrong item entered") and confirm.\n\n*Note: Deleted or finalized cash drawer audits cannot be refunded without admin approval.*`,
          type: 'text'
        };
      }

      if (q.includes('discount')) {
        return {
          message: `### DHADHAN Discount Guidelines\n- **Staff discount**: 15% off food items (code: \`STAFF15\`).\n- **VIP / Promo discount**: Managed via supervisor keys.\n- Apply the discount factor inside the POS billing screen before clicking the settle checkout button.`,
          type: 'text'
        };
      }

      if (q.includes('payment') || q.includes('cash') || q.includes('card')) {
        return {
          message: `### Settle Checkout Instructions\n- We support **Cash**, **Card** (terminal), and **Mobile Money** payments.\n- Ensure the payment total matches exactly to avoid cash register discrepancies.\n- For overpayments (change due), the change card will calculate how much change is owed.`,
          type: 'text'
        };
      }

      // Default conversational fallback
      return {
        message: `Hello! I am your **DHADHAN AI Operations Assistant**. I can help you verify invoice calculations, split table bills, look up active orders, check today's sales revenue, and explain staff workflows.\n\nTry asking me: \n- *Show today's revenue*\n- *Split Table 3 bill by 2 people*\n- *Calculate VAT for 1200*\n- *How to process a refund?*`,
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
