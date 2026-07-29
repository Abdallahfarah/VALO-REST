// Live Supabase ApiService
// Queries the PostgreSQL database via the Supabase JS client.

import { supabase } from '../../lib/supabase';
import { CURRENCY_CONFIGS } from './CurrencyService';
import { getEmojiForIconId } from '../lib/icon-library';
import { formatDisplayName } from '../lib/utils';

// ─── Helper: map snake_case DB rows to camelCase frontend shapes ───
const mapCategory = (row: any) => ({
  id: row.id,
  name: row.name,
  sortOrder: row.sort_order ?? 0,
});

const mapMenuItem = (row: any) => ({
  id: row.id,
  categoryId: row.category_id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  icon: getEmojiForIconId(row.icon),
  iconId: row.icon || 'burger',
  isAvailable: row.is_available ?? true,
  category: row.categories ? { id: row.categories.id, name: row.categories.name } : null,
  preparationStation: row.preparation_station || 'Chef',
});

const mapTable = (row: any) => ({
  id: row.id,
  number: row.number,
  name: row.name || null,
  capacity: row.capacity ?? 4,
  floor: row.floor || null,
  isActive: row.is_active ?? true,
  qrStatus: row.qr_status ?? 'ACTIVE',
  status: row.status ?? 'AVAILABLE',
  waiterId: row.waiter_id,
  guestCount: row.guest_count ?? 0,
  waiter: row.users ? { id: row.users.id, name: formatDisplayName(row.users.first_name, row.users.last_name), email: row.users.email } : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapOrderItem = (row: any) => ({
  id: row.id,
  menuItem: { 
    name: row.menu_items?.name || 'Item',
    preparationStation: row.menu_items?.preparation_station || 'Chef'
  },
  quantity: row.quantity,
  unitPrice: Number(row.unit_price),
  price: Number(row.price),
  status: row.status || 'PENDING',
});

export const formatOrderNumber = (num: number | string | null | undefined) => {
  if (num === null || num === undefined) return '';
  const parsed = typeof num === 'string' ? parseInt(num, 10) : num;
  if (isNaN(parsed)) return String(num);
  return `ORDER-${String(parsed).padStart(4, '0')}`;
};

const mapOrder = (row: any) => ({
  id: row.id,
  orderNumber: formatOrderNumber(row.order_number),
  status: row.status,
  waiterId: row.waiter_id,
  tableId: row.table_id,
  customerName: row.customer_name,
  totalAmount: Number(row.total_amount),
  createdAt: row.created_at,
  updatedAt: row.updated_at || row.created_at,
  table: row.tables ? { number: row.tables.number } : { number: 'N/A' },
  waiterName: row.users ? formatDisplayName(row.users.first_name, row.users.last_name) : 'Unassigned',
  items: (row.order_items || []).map(mapOrderItem),
  cancellationReason: row.cancellation_reason,
  cancelledBy: row.cancelled_by,
  cancelledAt: row.cancelled_at,
});

const mapUser = (row: any) => ({
  id: row.id,
  name: formatDisplayName(row.first_name, row.last_name),
  email: row.email,
  role: row.role,
  section: row.preparation_station || '',
  preparationStation: row.preparation_station || null,
  status: row.is_active ? 'Active' : 'Inactive',
});

// ─── OrderService ───
export const OrderService = {
  async getOrders(tenantId: string, status?: string) {
    let query = supabase
      .from('orders')
      .select('*, tables(number), users(*), order_items(*, menu_items(name, preparation_station))')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapOrder);
  },

  async createQrOrder(payload: {
    tenantId: string;
    tableId?: string | null;
    tableNumber?: string | null;
    customerName: string;
    items: Array<{ id: string; name?: string; price: number; quantity: number; preparationStation?: string }>;
    paymentMethod?: string;
  }) {
    // 1. Attempt Edge Function call first
    try {
      const { data, error } = await supabase.functions.invoke('create-qr-order', {
        body: payload,
      });

      if (!error && data && data.success && data.order) {
        return data.order;
      }
      if (error && data?.error) {
        throw new Error(data.error);
      }
    } catch (edgeErr: any) {
      if (edgeErr.message && !edgeErr.message.includes('FunctionsFetchError') && !edgeErr.message.includes('Failed to send')) {
        throw edgeErr;
      }
    }

    // 2. Fallback to SECURITY DEFINER Database RPC
    const { data: rpcData, error: rpcErr } = await supabase.rpc('create_qr_order_func', {
      p_tenant_id: payload.tenantId,
      p_table_id: payload.tableId || null,
      p_customer_name: payload.customerName,
      p_items: payload.items
    });

    if (rpcErr) throw rpcErr;
    return rpcData;
  },

  async createOrder(payload: any) {
    // 1. Parallelize initial lookups for active order and waiter assignment (if waiterId is missing)
    const [activeOrdersRes, waiterIdRes] = await Promise.all([
      payload.tableId ? supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', payload.tenantId)
        .eq('table_id', payload.tableId)
        .not('status', 'in', '("COMPLETED","CANCELED")')
        .limit(1) : Promise.resolve({ data: null, error: null }),
      (!payload.waiterId && payload.tableId) ? supabase
        .from('tables')
        .select('waiter_id')
        .eq('tenant_id', payload.tenantId)
        .eq('id', payload.tableId)
        .maybeSingle() : Promise.resolve({ data: null, error: null })
    ]);

    if (activeOrdersRes.error) throw activeOrdersRes.error;
    if (waiterIdRes.error) throw waiterIdRes.error;

    const activeOrder = activeOrdersRes.data && activeOrdersRes.data.length > 0 ? activeOrdersRes.data[0] : null;
    const waiterId = payload.waiterId || waiterIdRes.data?.waiter_id || null;

    let orderId = '';
    let newOrderNumber = 1;

    if (!activeOrder) {
      // Get highest order number for this tenant
      const { data: latestOrder } = await supabase
        .from('orders')
        .select('order_number')
        .eq('tenant_id', payload.tenantId)
        .order('order_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (latestOrder && latestOrder.order_number) {
        newOrderNumber = Number(latestOrder.order_number) + 1;
      }
    }

    if (activeOrder) {
      orderId = activeOrder.id;
      const newTotal = Number(activeOrder.total_amount) + Number(payload.totalAmount);

      const orderItems = payload.items.map((item: any) => ({
        order_id: orderId,
        menu_item_id: item.menuItemId || item.id,
        quantity: item.quantity,
        unit_price: Number(item.price),
        price: Number(item.price) * item.quantity,
        status: 'PENDING',
      }));

      // Update order total, insert new items, and make sure table is occupied ALL in parallel
      const [orderUpdate, itemsInsert, tableUpdate] = await Promise.all([
        supabase
          .from('orders')
          .update({
            total_amount: newTotal,
            status: 'PENDING',
            updated_at: new Date().toISOString()
          })
          .eq('tenant_id', payload.tenantId)
          .eq('id', orderId),
        supabase.from('order_items').insert(orderItems),
        payload.tableId ? supabase.from('tables').update({ status: 'OCCUPIED' }).eq('tenant_id', payload.tenantId).eq('id', payload.tableId) : Promise.resolve({ error: null })
      ]);

      if (orderUpdate.error) throw orderUpdate.error;
      if (itemsInsert.error) throw itemsInsert.error;
      if (tableUpdate.error) throw tableUpdate.error;

    } else {
      // Insert new order first to obtain orderId
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: payload.tenantId,
          table_id: payload.tableId,
          waiter_id: waiterId || null,
          customer_name: payload.customerName || null,
          status: 'PENDING',
          total_amount: payload.totalAmount,
          order_number: newOrderNumber,
        })
        .select('*')
        .single();

      if (orderError) throw orderError;
      orderId = order.id;

      const orderItems = payload.items.map((item: any) => ({
        order_id: orderId,
        menu_item_id: item.menuItemId || item.id,
        quantity: item.quantity,
        unit_price: Number(item.price),
        price: Number(item.price) * item.quantity,
        status: 'PENDING',
      }));

      // Insert items and make table occupied in parallel
      const [itemsInsert, tableUpdate] = await Promise.all([
        supabase.from('order_items').insert(orderItems),
        payload.tableId ? supabase.from('tables').update({ status: 'OCCUPIED' }).eq('tenant_id', payload.tenantId).eq('id', payload.tableId) : Promise.resolve({ error: null })
      ]);

      if (itemsInsert.error) throw itemsInsert.error;
      if (tableUpdate.error) throw tableUpdate.error;
    }

    // 2. Asynchronously run telemetry tasks (logs & KDS notifications) in the background
    (async () => {
      try {
        const isNewOrder = !activeOrder;
        const actionType = isNewOrder ? 'ORDER_CREATED' : 'ORDER_MODIFIED';

        // Insert audit log
        await supabase.from('activity_logs').insert({
          user_id: waiterId || null,
          action: actionType,
          entity_type: 'order',
          entity_id: orderId,
          timestamp: new Date().toISOString(),
        });

        // Group items by preparation station for notifications using metadata provided by frontend payload
        const stationMap: Record<string, string[]> = {};
        payload.items.forEach((item: any) => {
          const station = item.preparationStation || 'Chef';
          if (!stationMap[station]) stationMap[station] = [];
          stationMap[station].push(item.name || 'Item');
        });

        const tableNumber = payload.tableNumber || '?';

        // Send notifications to KDS preparation stations
        for (const [station, names] of Object.entries(stationMap)) {
          let title = 'New Kitchen Items';
          if (station === 'Chef') title = 'New Chef Items';
          else if (station === 'Barista') title = 'New Drinks';
          else if (station === 'Kitchen Staff') title = 'New Side Items';

          await supabase.from('notifications').insert({
            tenant_id: payload.tenantId,
            role: 'KITCHEN_STAFF',
            title,
            message: `${isNewOrder ? 'New order' : 'Additional items'} for Table ${tableNumber}: ${names.join(', ')}.`,
            is_read: false
          });
        }
      } catch (e) {
        console.warn('[createOrder] Background telemetry failed:', e);
      }
    })();

    // 3. Fetch and return complete order in 1 final fast roundtrip
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, tables(number), users(*), order_items(*, menu_items(name, preparation_station))')
      .eq('id', orderId)
      .single();

    return fullOrder ? mapOrder(fullOrder) : { id: orderId };
  },

  async updateOrderStatus(orderId: string, status: string) {
    const { data: orderData } = await supabase
      .from('orders')
      .select('table_id')
      .eq('id', orderId)
      .single();

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*, tables(number), users(*), order_items(*, menu_items(name, preparation_station))')
      .single();

    if (error) throw error;

    // Propagate status to order items
    if (status === 'PREPARING') {
      await supabase
        .from('order_items')
        .update({ status: 'PREPARING' })
        .eq('order_id', orderId)
        .eq('status', 'PENDING');
    } else if (status === 'READY') {
      await supabase
        .from('order_items')
        .update({ status: 'READY' })
        .eq('order_id', orderId)
        .eq('status', 'PREPARING');
    }

    // Keep table status in sync
    if (orderData?.table_id) {
      if (status === 'COMPLETED' || status === 'CANCELED') {
        await supabase
          .from('tables')
          .update({ status: 'AVAILABLE' })
          .eq('id', orderData.table_id);
      } else if (status === 'PREPARING') {
        await supabase
          .from('tables')
          .update({ status: 'PREPARING' })
          .eq('id', orderData.table_id);
      } else if (status === 'READY') {
        await supabase
          .from('tables')
          .update({ status: 'READY' })
          .eq('id', orderData.table_id);
      }
    }

    return data ? mapOrder(data) : null;
  },

  async updateStationItemsStatus(
    orderId: string,
    station: string,
    nextStatus: string,
    clientData?: {
      targetItemIds: string[];
      projectedOrderStatus: string;
    }
  ) {
    const now = new Date().toISOString();

    let targetItemIds: string[];
    let projectedOrderStatus: string;

    if (clientData && clientData.targetItemIds.length > 0) {
      targetItemIds = clientData.targetItemIds;
      projectedOrderStatus = clientData.projectedOrderStatus;
    } else {
      const { data: items, error: fetchErr } = await supabase
        .from('order_items')
        .select('id, status, menu_items(preparation_station)')
        .eq('order_id', orderId);
      if (fetchErr) throw fetchErr;

      const sourceStatus = nextStatus === 'PREPARING' ? 'PENDING' : 'PREPARING';
      const stationItems = (items || []).filter((item: any) => {
        const itemStation = item.menu_items?.preparation_station || 'Chef';
        return itemStation === station;
      });
      targetItemIds = stationItems
        .filter((item: any) => item.status === sourceStatus)
        .map((item: any) => item.id);

      const projected = (items || []).map((item: any) => ({
        status: targetItemIds.includes(item.id) ? nextStatus : item.status,
      }));
      const allDone = projected.every(
        (i: any) => i.status === 'READY' || i.status === 'CANCELED'
      );
      const anyPreparing = projected.some((i: any) => i.status === 'PREPARING');
      projectedOrderStatus =
        allDone && projected.length > 0 ? 'READY' : anyPreparing ? 'PREPARING' : 'PENDING';
    }

    if (targetItemIds.length === 0) return null;

    // CRITICAL PATH: only this one call blocks the caller
    const { error: updateErr } = await supabase
      .from('order_items')
      .update({ status: nextStatus })
      .in('id', targetItemIds);

    if (updateErr) throw updateErr;

    // BACKGROUND: fire-and-forget order/table/notification updates
    void (async () => {
      try {
        let tableStatus = 'OCCUPIED';
        if (projectedOrderStatus === 'PREPARING') tableStatus = 'PREPARING';
        else if (projectedOrderStatus === 'READY') tableStatus = 'READY';

        const { data: orderData } = await supabase
          .from('orders')
          .select('status, table_id, waiter_id, tenant_id, tables(number)')
          .eq('id', orderId)
          .single();

        if (!orderData || orderData.status === 'COMPLETED' || orderData.status === 'CANCELED') return;

        await Promise.all([
          supabase
            .from('orders')
            .update({ status: projectedOrderStatus, updated_at: now })
            .eq('id', orderId),
          orderData.table_id
            ? supabase
                .from('tables')
                .update({ status: tableStatus })
                .eq('id', orderData.table_id)
            : Promise.resolve(),
        ]);

        if (nextStatus === 'READY' && orderData.tenant_id) {
          const tableNumber = (orderData as any).tables?.number || '?';
          await supabase.from('notifications').insert({
            tenant_id: orderData.tenant_id,
            user_id: orderData.waiter_id || null,
            role: 'WAITER',
            title: 'Items Ready',
            message: `${station} items are ready for Table ${tableNumber}.`,
            is_read: false,
          });
        }
      } catch (e) {
        console.warn('[updateStationItemsStatus] Background sync failed silently:', e);
      }
    })();

    return true;
  },

  async cancelOrder(params: {
    orderId: string;
    reason: string;
    cancelledBy: string;   // user id of KDS employee
    tenantId: string;
    cancelledByName?: string;
    tableNumber?: string | number;
  }) {
    const { orderId, reason, cancelledBy, tenantId, cancelledByName, tableNumber } = params;

    // 1. Fetch current order to verify it is still cancellable
    const { data: currentOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('status, table_id')
      .eq('id', orderId)
      .single();

    if (fetchErr) throw fetchErr;

    const cancellableStatuses = ['PENDING', 'PREPARING'];
    if (!cancellableStatuses.includes(currentOrder?.status)) {
      throw new Error(`Order cannot be cancelled in status: ${currentOrder?.status}`);
    }

    const now = new Date().toISOString();

    // 2. Set order status to CANCELED + record who cancelled and why
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'CANCELED',
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: now,
        updated_at: now,
      })
      .eq('id', orderId)
      .select('*, tables(number), users(*), order_items(*, menu_items(name, preparation_station))')
      .single();

    if (error) throw error;

    // 3. Cancel all active order items (PENDING / PREPARING → CANCELED)
    await supabase
      .from('order_items')
      .update({ status: 'CANCELED' })
      .eq('order_id', orderId)
      .in('status', ['PENDING', 'PREPARING']);

    // 4. Free the table
    if (currentOrder?.table_id) {
      await supabase
        .from('tables')
        .update({ status: 'AVAILABLE' })
        .eq('id', currentOrder.table_id);
    }

    // 5. Audit log – reuse existing ActivityLogService pattern
    try {
      await supabase.from('activity_logs').insert({
        user_id: cancelledBy,
        action: 'ORDER_CANCELED',
        entity_type: 'order',
        entity_id: orderId,
        timestamp: now,
      });
    } catch {
      console.warn('[cancelOrder] Audit log failed silently');
    }

    // 6. Notify WAITER and ADMIN roles
    try {
      const friendlyNum = formatOrderNumber(data?.order_number);
      const orderLabel = friendlyNum || `Order #${orderId.slice(0, 8).toUpperCase()}`;
      const table = tableNumber ? `Table ${tableNumber}` : 'Unknown table';
      const title = `${orderLabel} Cancelled by Kitchen`;
      const message = `${table} — Reason: ${reason} — Cancelled by: ${cancelledByName || 'Kitchen Staff'}`;

      await supabase.from('notifications').insert([
        { tenant_id: tenantId, user_id: data?.waiter_id || null, role: 'WAITER', title, message, is_read: false },
        { tenant_id: tenantId, user_id: null, role: 'ADMIN',  title, message, is_read: false },
      ]);
    } catch {
      console.warn('[cancelOrder] Notification failed silently');
    }

    return data ? mapOrder(data) : null;
  },

  async settleOrder(orderId: string, paymentData: any) {
    const now = new Date().toISOString();

    // 1. Fetch current order details
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, tables(number)')
      .eq('id', orderId)
      .single();

    if (fetchErr) throw fetchErr;

    // 2. Fetch order items to calculate base subtotal
    const { data: items } = await supabase
      .from('order_items')
      .select('price')
      .eq('order_id', orderId);

    const subtotal = (items || []).reduce((acc: number, item: any) => acc + Number(item.price), 0);

    // 3. Fetch tax settings
    const { data: settings } = await supabase
      .from('restaurant_settings')
      .select('tax_rate')
      .eq('tenant_id', paymentData.tenantId)
      .single();

    const taxRate = Number(settings?.tax_rate ?? 15.00);
    const discountRate = Number(paymentData.discountRate || 0);
    const serviceChargeRate = Number(paymentData.serviceChargeRate || 0);

    const discountAmount = subtotal * (discountRate / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * (taxRate / 100);
    const serviceChargeAmount = subtotalAfterDiscount * (serviceChargeRate / 100);
    const finalTotalAmount = subtotalAfterDiscount + taxAmount + serviceChargeAmount;

    // Fetch tenant currency config
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('currency_code, currency_symbol')
      .eq('id', paymentData.tenantId)
      .single();

    const currencyCode = tenantData?.currency_code || 'ETB';
    const currencySymbol = tenantData?.currency_symbol || 'ETB';

    // Generate unique receipt number
    const receiptNumber = 'REC-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const serviceChargeNote = serviceChargeRate > 0 ? `Service Charge: ${serviceChargeRate}% (${serviceChargeAmount.toFixed(2)}). ` : '';
    const finalNotes = (serviceChargeNote + (paymentData.notes || '')).trim() || null;

    // 4. Insert receipt
    const { error: receiptErr } = await supabase
      .from('receipts')
      .insert({
        tenant_id: paymentData.tenantId,
        order_id: orderId,
        cashier_id: paymentData.cashierId || null,
        receipt_number: receiptNumber,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        discount_amount: discountAmount.toFixed(2),
        total_amount: finalTotalAmount.toFixed(2),
        payment_method: paymentData.method || 'Cash',
        payment_status: 'PAID',
        amount_received: Number(paymentData.amountReceived ?? finalTotalAmount),
        change_amount: Number(paymentData.changeAmount ?? 0),
        notes: finalNotes,
        currency: currencyCode,
        currency_symbol: currencySymbol,
        exchange_rate: 1.0,
        original_amount: finalTotalAmount.toFixed(2),
        base_amount: finalTotalAmount.toFixed(2)
      });

    if (receiptErr) throw receiptErr;

    // 5. Update order to COMPLETED
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'COMPLETED', 
        total_amount: finalTotalAmount.toFixed(2),
        updated_at: now 
      })
      .eq('id', orderId)
      .select('*, tables(number), users(*), order_items(*, menu_items(name, preparation_station))')
      .single();

    if (error) throw error;

    // 5b. Update all order items status to READY
    await supabase
      .from('order_items')
      .update({ status: 'READY' })
      .eq('order_id', orderId);

    // 6. Release the table
    if (data?.table_id) {
      await supabase
        .from('tables')
        .update({ status: 'AVAILABLE' })
        .eq('id', data.table_id);
    }

    // 7. Smart Notifications
    try {
      const notificationRows = [
        {
          tenant_id: paymentData.tenantId,
          role: 'CASHIER',
          title: 'Payment Completed',
          message: `Payment of ${currencySymbol} ${finalTotalAmount.toFixed(2)} completed for Order ${formatOrderNumber(data?.order_number)} (Table ${order?.tables?.number || '?'}).`,
          is_read: false
        },
        {
          tenant_id: paymentData.tenantId,
          user_id: order.waiter_id || null,
          role: 'WAITER',
          title: 'Table Closed',
          message: `Table ${order.tables?.number || '?'} is now closed. Order ${formatOrderNumber(data?.order_number)} payment completed.`,
          is_read: false
        },
        {
          tenant_id: paymentData.tenantId,
          role: 'ADMIN',
          title: 'Payment Completed',
          message: `Revenue of ${currencySymbol} ${finalTotalAmount.toFixed(2)} recorded from Order ${formatOrderNumber(data?.order_number)} (Table ${order?.tables?.number || '?'}).`,
          is_read: false
        }
      ];

      if (discountRate >= 20 || discountAmount >= 50) {
        notificationRows.push({
          tenant_id: paymentData.tenantId,
          role: 'ADMIN',
          title: 'Large Discount Applied',
          message: `Discount of ${discountRate}% (${currencySymbol} ${discountAmount.toFixed(2)}) applied to Order ${formatOrderNumber(data?.order_number)}.`,
          is_read: false
        });
      }

      if (finalTotalAmount >= 150) {
        notificationRows.push({
          tenant_id: paymentData.tenantId,
          role: 'ADMIN',
          title: 'Large Transaction Completed',
          message: `High value transaction of ${currencySymbol} ${finalTotalAmount.toFixed(2)} completed for Order ${formatOrderNumber(data?.order_number)}.`,
          is_read: false
        });
      }

      // Check Daily Revenue Target ($1,000)
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      const { data: todayReceipts } = await supabase
        .from('receipts')
        .select('total_amount')
        .eq('tenant_id', paymentData.tenantId)
        .gte('created_at', startOfDay.toISOString());

      const todayTotal = (todayReceipts || []).reduce((acc: number, r: any) => acc + Number(r.total_amount), 0) + finalTotalAmount;
      const previousTotal = todayTotal - finalTotalAmount;
      const target = 1000;
      if (previousTotal < target && todayTotal >= target) {
        notificationRows.push({
          tenant_id: paymentData.tenantId,
          role: 'ADMIN',
          title: 'Daily Revenue Target Achieved',
          message: `Congratulations! Today's total revenue has reached ${currencySymbol} ${todayTotal.toFixed(2)}, crossing the target of ${currencySymbol} ${target.toFixed(2)}.`,
          is_read: false
        });
      }

      await supabase.from('notifications').insert(notificationRows);
    } catch (e) {
      console.warn('[settleOrder] Notification failed silently', e);
    }

    // 8. Audit log
    try {
      await supabase.from('activity_logs').insert({
        user_id: paymentData.cashierId || null,
        action: 'ORDER_PAID',
        entity_type: 'order',
        entity_id: orderId,
        timestamp: now,
      });
    } catch {
      console.warn('[settleOrder] Audit log failed silently');
    }

    return data ? mapOrder(data) : null;
  },
};

// ─── MenuService ───
export const MenuService = {
  async getCategories(tenantId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapCategory);
  },

  async getMenuItems(tenantId: string, categoryId?: string, onlyAvailable = false) {
    let query = supabase
      .from('menu_items')
      .select('*, categories(id, name)')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (onlyAvailable) {
      query = query.eq('is_available', true);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapMenuItem);
  },

  async getMenu(tenantId: string, onlyAvailable = false) {
    const categories = await this.getCategories(tenantId);
    const items = await this.getMenuItems(tenantId, undefined, onlyAvailable);
    return { categories, items };
  },

  async createMenuItem(item: any) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        tenant_id: item.tenantId,
        category_id: item.categoryId || null,
        name: item.name,
        description: item.description || null,
        price: item.price,
        icon: item.icon || '🍔',
        is_available: item.isAvailable ?? true,
        preparation_station: item.preparationStation || 'Chef'
      })
      .select('*, categories(id, name)')
      .single();

    if (error) throw error;
    return mapMenuItem(data);
  },

  async updateMenuItem(itemId: string, item: any) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({
        category_id: item.categoryId || null,
        name: item.name,
        description: item.description || null,
        price: item.price,
        icon: item.icon || '🍔',
        is_available: item.isAvailable,
        preparation_station: item.preparationStation || 'Chef',
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select('*, categories(id, name)')
      .single();

    if (error) throw error;
    return mapMenuItem(data);
  },

  async deleteMenuItem(itemId: string) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  },

  async createCategory(category: any) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        tenant_id: category.tenantId,
        name: category.name,
        sort_order: category.sortOrder || 0
      })
      .select('*')
      .single();

    if (error) throw error;
    return mapCategory(data);
  },

  async updateCategory(categoryId: string, category: any) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: category.name,
        sort_order: category.sortOrder,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select('*')
      .single();

    if (error) throw error;
    return mapCategory(data);
  },

  async deleteCategory(categoryId: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
    return true;
  }
};

// ─── TableService ───
export const TableService = {
  async getTables(tenantId: string) {
    const { data, error } = await supabase
      .from('tables')
      .select('*, users(*)')
      .eq('tenant_id', tenantId)
      .order('number', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapTable);
  },

  async createTable(table: any) {
    const { data, error } = await supabase
      .from('tables')
      .insert({
        tenant_id: table.tenantId,
        number: table.number,
        name: table.name || null,
        capacity: table.capacity,
        floor: table.floor || null,
        is_active: table.isActive ?? true,
        qr_status: table.qrStatus ?? 'ACTIVE',
        status: table.status || 'AVAILABLE',
        waiter_id: table.waiterId || null,
        guest_count: table.guestCount ?? 0,
      })
      .select('*, users(*)')
      .single();

    if (error) throw error;
    return mapTable(data);
  },

  async updateTable(tableId: string, table: any) {
    const updateData: any = {};
    if (table.number !== undefined) updateData.number = table.number;
    if (table.name !== undefined) updateData.name = table.name || null;
    if (table.capacity !== undefined) updateData.capacity = table.capacity;
    if (table.floor !== undefined) updateData.floor = table.floor || null;
    if (table.isActive !== undefined) updateData.is_active = table.isActive;
    if (table.qrStatus !== undefined) updateData.qr_status = table.qrStatus;
    if (table.status !== undefined) updateData.status = table.status;
    if (table.waiterId !== undefined) updateData.waiter_id = table.waiterId;
    if (table.guestCount !== undefined) updateData.guest_count = table.guestCount;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tables')
      .update(updateData)
      .eq('id', tableId)
      .select('*, users(*)')
      .single();

    if (error) throw error;

    if (table.waiterId && data) {
      try {
        await supabase.from('notifications').insert({
          tenant_id: data.tenant_id,
          user_id: table.waiterId,
          role: 'WAITER',
          title: 'New Table Assigned',
          message: `Table ${data.number} has been assigned to you.`,
          is_read: false
        });
      } catch (e) {
        console.warn('Failed to generate waiter assignment notification:', e);
      }
    }

    return mapTable(data);
  },

  async deleteTable(tableId: string) {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId);

    if (error) throw error;
    return true;
  }
};

// ─── StaffService ───
export const StaffService = {
  async getStaff(tenantId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return (data || []).map(mapUser);
  },
};

// ─── TenantService ───
export const TenantService = {
  async getTenantBySlug(slug: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      logo: data.logo,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      isActive: data.is_active,
      phone: data.phone,
      email: data.email,
      address: data.address,
    };
  },
};

// ─── SettingService ───
const mapRestaurantSettings = (row: any) => ({
  id: row.id,
  tenantId: row.tenant_id,
  currency: row.currency || 'USD',
  timezone: row.timezone || 'UTC',
  taxRate: Number(row.tax_rate ?? 15.00),
  receiptFooter: row.receipt_footer || 'Thank you for dining with us!',
  logoUrl: row.logo_url,
  primaryColor: row.primary_color || '#F97316',
  secondaryColor: row.secondary_color || '#0B1630',
  businessHours: row.business_hours || {
    mon_fri: '08:00 AM - 10:00 PM',
    sat_sun: '09:00 AM - 11:00 PM'
  },
  tableAssignmentMode: row.table_assignment_mode || 'OPEN',
  receiptHeaderName: row.receipt_header_name,
  receiptAddressLocation: row.receipt_address_location,
  receiptHeaderPhone: row.receipt_header_phone,
  businessRegNumber: row.business_reg_number,
  receiptPaymentInfo: row.receipt_payment_info,
});

export const SettingService = {
  async getSettings(tenantId: string) {
    const { data: rsData, error: rsErr } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (rsErr) throw rsErr;

    // Fetch currency from tenants table (single source of truth)
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('currency_code')
      .eq('id', tenantId)
      .single();

    const currencyCode = tenantData?.currency_code || 'ETB';

    return mapRestaurantSettings({
      ...rsData,
      currency: currencyCode // Merge it into currency field for backward compatibility
    });
  },

  async updateSettings(tenantId: string, settings: any) {
    // 1. Update the tenants table with currency
    const symbol = CURRENCY_CONFIGS[settings.currency.toUpperCase()]?.symbol || settings.currency;
    const { error: tenantErr } = await supabase
      .from('tenants')
      .update({
        currency_code: settings.currency,
        currency_symbol: symbol,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    if (tenantErr) throw tenantErr;

    // 2. Update the restaurant_settings table (without currency column)
    const { data, error } = await supabase
      .from('restaurant_settings')
      .update({
        timezone: settings.timezone,
        tax_rate: settings.taxRate,
        receipt_footer: settings.receiptFooter,
        logo_url: settings.logoUrl,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        business_hours: settings.businessHours,
        table_assignment_mode: settings.tableAssignmentMode || 'OPEN',
        receipt_header_name: settings.receiptHeaderName,
        receipt_address_location: settings.receiptAddressLocation,
        receipt_header_phone: settings.receiptHeaderPhone,
        business_reg_number: settings.businessRegNumber,
        receipt_payment_info: settings.receiptPaymentInfo,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) throw error;
    return {
      ...mapRestaurantSettings(data),
      currency: settings.currency
    };
  },

  async updateTenantProfile(tenantId: string, profile: any) {
    const { data, error } = await supabase
      .from('tenants')
      .update({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        logo: profile.logo,
        primary_color: profile.primaryColor,
        secondary_color: profile.secondaryColor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select('*')
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      logo: data.logo,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      isActive: data.is_active,
      phone: data.phone,
      email: data.email,
      address: data.address,
    };
  }
};

// ─── ReceiptService ───
const mapReceipt = (row: any) => ({
  id: row.id,
  tenantId: row.tenant_id,
  orderId: row.order_id,
  receiptNumber: row.receipt_number,
  subtotal: Number(row.subtotal),
  taxAmount: Number(row.tax_amount),
  discountAmount: Number(row.discount_amount || 0),
  totalAmount: Number(row.total_amount),
  paymentMethod: row.payment_method,
  status: row.payment_status,
  createdAt: row.created_at,
  currency: row.currency || 'ETB',
  cashierName: row.cashier ? formatDisplayName(row.cashier.first_name, row.cashier.last_name) : 'Unknown',
  amountReceived: Number(row.amount_received || row.total_amount),
  changeAmount: Number(row.change_amount || 0),
  notes: row.notes || null,
  order: row.orders ? {
    id: row.orders.id,
    orderNumber: formatOrderNumber(row.orders.order_number),
    tableNumber: row.orders.tables?.number,
    customerName: row.orders.customer_name || 'Walk-in',
    waiterName: row.orders.users ? formatDisplayName(row.orders.users.first_name, row.orders.users.last_name) : 'Unknown',
    items: (row.orders.order_items || []).map(mapOrderItem)
  } : null
});

export const ReceiptService = {
  async getReceipts(tenantId: string) {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, orders(*, tables(number), users(*), order_items(*, menu_items(name, preparation_station))), cashier:users(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapReceipt);
  },

  async refundReceipt(receiptId: string, cashierId: string, tenantId: string) {
    const { data: receipt, error: fetchErr } = await supabase
      .from('receipts')
      .select('*, orders(*)')
      .eq('id', receiptId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!receipt) throw new Error('Receipt not found');

    const now = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('receipts')
      .update({ payment_status: 'REFUNDED' })
      .eq('id', receiptId);

    if (updateErr) throw updateErr;

    try {
      await supabase.from('notifications').insert({
        tenant_id: tenantId,
        role: 'ADMIN',
        title: 'Refund Processed',
        message: `A refund of ${receipt.currency || 'ETB'} ${Number(receipt.total_amount).toFixed(2)} was processed for Receipt ${receipt.receipt_number}.`,
        is_read: false
      });
    } catch (e) {
      console.warn('[refundReceipt] Notification failed silently', e);
    }

    try {
      await supabase.from('activity_logs').insert({
        user_id: cashierId || null,
        action: 'ORDER_REFUNDED',
        entity_type: 'order',
        entity_id: receipt.order_id,
        timestamp: now,
      });
    } catch (e) {
      console.warn('[refundReceipt] Audit log failed silently', e);
    }
  }
};

// ─── SuperAdminService ───
export const SuperAdminService = {
  async getOverviewStats() {
    // 1. Total Tenants & Active Tenants
    const { data: tenants, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, is_active, name');
    
    if (tenantErr) throw tenantErr;
    const tenantCount = tenants?.length || 0;
    const activeTenantCount = (tenants || []).filter((t: any) => t.is_active).length;

    // 2. Global Registered Staff & Users
    const { count: userCount, error: userErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (userErr) throw userErr;

    // 3. Global Customers Count (from orders table)
    const { data: customerOrders } = await supabase
      .from('orders')
      .select('customer_name')
      .not('customer_name', 'is', null);

    const customerCount = new Set((customerOrders || []).map((o: any) => o.customer_name).filter(Boolean)).size;

    // 4. Subscriptions & Plan Revenue
    const { data: subs, error: subsErr } = await supabase
      .from('subscriptions')
      .select('*, plans(*)');

    if (subsErr) throw subsErr;

    const activeSubsCount = (subs || []).filter((s: any) => s.status === 'ACTIVE' || s.status === 'TRIAL').length;
    const expiredSubsCount = (subs || []).filter((s: any) => s.status === 'EXPIRED' || s.status === 'SUSPENDED').length;
    const subscriptionRev = (subs || [])
      .filter((s: any) => s.status === 'ACTIVE')
      .reduce((acc: number, s: any) => acc + Number(s.plans?.price || 0), 0);

    // 5. Live Orders Telemetry (Orders Today & This Month)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count: ordersTodayCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday);

    const { count: ordersMonthCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // 6. Live Receipts & Gross Platform GMV Revenue
    const { data: receipts, error: receiptsErr } = await supabase
      .from('receipts')
      .select('total_amount, payment_status, created_at');

    if (receiptsErr) console.warn('[SuperAdminService] Receipts query warning:', receiptsErr);

    const totalGmv = (receipts || [])
      .filter((r: any) => r.payment_status !== 'REFUNDED')
      .reduce((acc: number, r: any) => acc + Number(r.total_amount || 0), 0);

    // Platform revenue = Subscription revenue + 15% platform cut of GMV
    const platformRevenue = subscriptionRev + totalGmv * 0.15;

    // 7. Pending Unsettled Orders Amount
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .neq('status', 'COMPLETED')
      .neq('status', 'CANCELED');

    const pendingPayments = (pendingOrders || []).reduce((acc: number, o: any) => acc + Number(o.total_amount || 0), 0);

    return {
      tenantCount,
      activeTenantCount,
      userCount: userCount || 0,
      customerCount: customerCount || 0,
      ordersTodayCount: ordersTodayCount || 0,
      ordersMonthCount: ordersMonthCount || 0,
      activeSubsCount,
      expiredSubsCount,
      subscriptionRev,
      totalGmv,
      platformRevenue,
      pendingPayments
    };
  },

  async getTopRestaurants() {
    const { data: tenants, error: tErr } = await supabase
      .from('tenants')
      .select('id, name, slug, logo, is_active');

    if (tErr) throw tErr;

    const { data: receipts } = await supabase
      .from('receipts')
      .select('tenant_id, total_amount, payment_status');

    const { data: orders } = await supabase
      .from('orders')
      .select('tenant_id');

    return (tenants || []).map((t: any) => {
      const tenantReceipts = (receipts || []).filter((r: any) => r.tenant_id === t.id && r.payment_status !== 'REFUNDED');
      const tenantOrders = (orders || []).filter((o: any) => o.tenant_id === t.id);
      const grossRevenue = tenantReceipts.reduce((acc: number, r: any) => acc + Number(r.total_amount || 0), 0);

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        logo: t.logo,
        isActive: t.is_active,
        ordersCount: tenantOrders.length,
        grossRevenue,
        platformCut: grossRevenue * 0.15
      };
    }).sort((a: any, b: any) => b.grossRevenue - a.grossRevenue);
  },

  async getPlatformAnalytics(filters: {
    tenantId?: string;
    dateRange?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (filters.dateRange === 'TODAY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (filters.dateRange === 'YESTERDAY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (filters.dateRange === 'THIS_WEEK' || filters.dateRange === 'LAST_7_DAYS') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (filters.dateRange === 'LAST_30_DAYS') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (filters.dateRange === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
    } else if (filters.dateRange === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (filters.dateRange === 'THIS_YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
    } else if (filters.dateRange === 'CUSTOM' && (filters.startDate || filters.endDate)) {
      if (filters.startDate) startDate = new Date(filters.startDate);
      if (filters.endDate) endDate = new Date(filters.endDate);
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { data: tenantsRaw },
      { data: usersRaw },
      { data: ordersRaw },
      { data: receiptsRaw },
      { data: subsRaw }
    ] = await Promise.all([
      supabase.from('tenants').select('id, name, slug, logo, is_active, created_at'),
      supabase.from('users').select('id, tenant_id, first_name, last_name, role, preparation_station, is_active, created_at'),
      supabase.from('orders').select('id, tenant_id, status, total_amount, order_number, created_at'),
      supabase.from('receipts').select('*, tenants(name, slug), orders(order_number, table_number, customer_name, waiter_id), cashier:users!receipts_cashier_id_fkey(first_name, last_name, email)').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('id, tenant_id, status, plan_id, created_at, plans(name, price)')
    ]);

    const tenantFilterId = filters.tenantId && filters.tenantId !== 'ALL' ? filters.tenantId : null;

    const tenants = (tenantsRaw || []).filter(t => !tenantFilterId || t.id === tenantFilterId);
    const tenantIds = new Set(tenants.map(t => t.id));

    const users = (usersRaw || []).filter(u => !tenantFilterId || (u.tenant_id && tenantIds.has(u.tenant_id)));
    const allOrders = (ordersRaw || []).filter(o => !tenantFilterId || (o.tenant_id && tenantIds.has(o.tenant_id)));
    const allReceipts = (receiptsRaw || []).filter(r => !tenantFilterId || (r.tenant_id && tenantIds.has(r.tenant_id)));
    const allSubs = (subsRaw || []).filter(s => !tenantFilterId || (s.tenant_id && tenantIds.has(s.tenant_id)));

    const inDateRange = (isoStr: string | null | undefined) => {
      if (!isoStr) return false;
      const d = new Date(isoStr);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    const rangeOrders = startDate || endDate ? allOrders.filter(o => inDateRange(o.created_at)) : allOrders;
    const rangeReceipts = startDate || endDate ? allReceipts.filter(r => inDateRange(r.created_at)) : allReceipts;

    const totalRestaurants = tenants.length;
    const activeRestaurants = tenants.filter(t => t.is_active).length;
    const inactiveRestaurants = tenants.filter(t => !t.is_active).length;
    
    const trialTenantIds = new Set(
      allSubs.filter(s => s.status === 'TRIAL').map(s => s.tenant_id)
    );
    const trialRestaurants = tenants.filter(t => 
      trialTenantIds.has(t.id) || 
      (t.created_at && (now.getTime() - new Date(t.created_at).getTime() < 14 * 24 * 60 * 60 * 1000))
    ).length;

    const totalOrders = rangeOrders.length;
    const ordersToday = allOrders.filter(o => o.created_at && o.created_at >= startOfToday).length;
    const ordersThisMonth = allOrders.filter(o => o.created_at && o.created_at >= startOfMonth).length;

    const validReceipts = rangeReceipts.filter(r => r.payment_status !== 'REFUNDED');
    const totalRevenue = validReceipts.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    const platformShareCut = totalRevenue * 0.15;
    const avgOrderValue = validReceipts.length > 0 ? totalRevenue / validReceipts.length : 0;

    const todayReceipts = allReceipts.filter(r => r.payment_status !== 'REFUNDED' && r.created_at && r.created_at >= startOfToday);
    const revenueToday = todayReceipts.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

    const monthReceipts = allReceipts.filter(r => r.payment_status !== 'REFUNDED' && r.created_at && r.created_at >= startOfMonth);
    const revenueThisMonth = monthReceipts.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

    const totalUsers = users.length;
    let totalAdmins = 0;
    let totalWaiters = 0;
    let totalCashiers = 0;
    let totalKitchenStaff = 0;
    let totalBaristas = 0;

    users.forEach(u => {
      const roleUpper = (u.role || '').toUpperCase();
      if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
        totalAdmins++;
      } else if (roleUpper === 'WAITER') {
        totalWaiters++;
      } else if (roleUpper === 'CASHIER') {
        totalCashiers++;
      } else if (roleUpper === 'KITCHEN_STAFF') {
        if (u.preparation_station && ['Bar', 'Coffee', 'Beverages'].includes(u.preparation_station)) {
          totalBaristas++;
        } else {
          totalKitchenStaff++;
        }
      }
    });

    const tenantMetricsMap = new Map<string, { id: string; name: string; slug: string; logo: string | null; isActive: boolean; ordersCount: number; grossRevenue: number; platformCut: number; createdAt: string }>();

    tenants.forEach(t => {
      tenantMetricsMap.set(t.id, {
        id: t.id,
        name: t.name || 'Unnamed Node',
        slug: t.slug || t.id.slice(0, 8),
        logo: t.logo || null,
        isActive: !!t.is_active,
        ordersCount: 0,
        grossRevenue: 0,
        platformCut: 0,
        createdAt: t.created_at || new Date().toISOString()
      });
    });

    rangeOrders.forEach(o => {
      if (o.tenant_id && tenantMetricsMap.has(o.tenant_id)) {
        tenantMetricsMap.get(o.tenant_id)!.ordersCount++;
      }
    });

    validReceipts.forEach(r => {
      if (r.tenant_id && tenantMetricsMap.has(r.tenant_id)) {
        const item = tenantMetricsMap.get(r.tenant_id)!;
        item.grossRevenue += Number(r.total_amount || 0);
        item.platformCut = item.grossRevenue * 0.15;
      }
    });

    const tenantList = Array.from(tenantMetricsMap.values());

    const topByRevenue = [...tenantList].sort((a, b) => b.grossRevenue - a.grossRevenue);
    const topByOrders = [...tenantList].sort((a, b) => b.ordersCount - a.ordersCount);
    const lowestActivity = [...tenantList].sort((a, b) => a.ordersCount - b.ordersCount);
    const newestRestaurants = [...tenantList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const timeBucketsMap = new Map<string, { label: string; date: string; amount: number; count: number }>();
    const bucketCount = 7;
    const bucketSpan = startDate && endDate ? (endDate.getTime() - startDate.getTime()) / bucketCount : 7 * 24 * 60 * 60 * 1000 / bucketCount;
    const baseTime = startDate ? startDate.getTime() : now.getTime() - 7 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < bucketCount; i++) {
      const bucketDate = new Date(baseTime + i * bucketSpan);
      const key = bucketDate.toISOString().slice(0, 10);
      const label = bucketDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      timeBucketsMap.set(key, { label, date: key, amount: 0, count: 0 });
    }

    validReceipts.forEach(r => {
      if (!r.created_at) return;
      const key = new Date(r.created_at).toISOString().slice(0, 10);
      if (timeBucketsMap.has(key)) {
        const b = timeBucketsMap.get(key)!;
        b.amount += Number(r.total_amount || 0);
      }
    });

    rangeOrders.forEach(o => {
      if (!o.created_at) return;
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      if (timeBucketsMap.has(key)) {
        const b = timeBucketsMap.get(key)!;
        b.count++;
      }
    });

    const timeBuckets = Array.from(timeBucketsMap.values());
    const revenueOverTime = timeBuckets.map(b => ({ label: b.label, date: b.date, amount: b.amount }));
    const ordersOverTime = timeBuckets.map(b => ({ label: b.label, date: b.date, count: b.count }));

    const restaurantGrowth = newestRestaurants.slice(0, 7).map(t => ({
      label: new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      date: t.createdAt,
      count: 1
    }));

    const roleDistribution = [
      { role: 'Waiters', count: totalWaiters, color: '#3B82F6' },
      { role: 'Cashiers', count: totalCashiers, color: '#10B981' },
      { role: 'Kitchen Staff', count: totalKitchenStaff, color: '#F59E0B' },
      { role: 'Baristas', count: totalBaristas, color: '#8B5CF6' },
      { role: 'Restaurant Admins', count: totalAdmins, color: '#EC4899' },
    ];

    const transactions = (rangeReceipts || []).map((r: any) => ({
      id: r.id,
      receiptNumber: r.receipt_number,
      tenantId: r.tenant_id,
      restaurantName: r.tenants?.name || 'Unknown Restaurant',
      orderNumber: r.orders?.order_number ? formatOrderNumber(r.orders.order_number) : 'N/A',
      tableNumber: r.orders?.table_number ? `Table ${r.orders.table_number}` : 'N/A',
      customerName: r.orders?.customer_name || 'Walk-in',
      cashierName: r.cashier ? formatDisplayName(r.cashier.first_name, r.cashier.last_name) : 'Staff',
      paymentMethod: r.payment_method,
      totalAmount: Number(r.total_amount),
      status: r.payment_status || 'PAID',
      createdAt: r.created_at
    }));

    return {
      summary: {
        totalRestaurants,
        activeRestaurants,
        inactiveRestaurants,
        trialRestaurants,
        totalOrders,
        ordersToday,
        ordersThisMonth,
        totalRevenue,
        revenueToday,
        revenueThisMonth,
        platformShareCut,
        avgOrderValue,
        totalUsers,
        totalAdmins,
        totalWaiters,
        totalCashiers,
        totalKitchenStaff,
        totalBaristas,
      },
      leaderboards: {
        topByRevenue,
        topByOrders,
        lowestActivity,
        newestRestaurants,
      },
      charts: {
        revenueOverTime,
        ordersOverTime,
        restaurantGrowth,
        roleDistribution,
      },
      transactions
    };
  },

  async getPlatformReports(filters: {
    tenantId?: string;
    dateRange?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    plan?: string;
  }) {
    let receiptsQuery = supabase
      .from('receipts')
      .select('*, tenants(name, slug), orders(order_number, table_number, customer_name, waiter_id), cashier:users!receipts_cashier_id_fkey(first_name, last_name, email)')
      .order('created_at', { ascending: false });

    if (filters.tenantId && filters.tenantId !== 'ALL') {
      receiptsQuery = receiptsQuery.eq('tenant_id', filters.tenantId);
    }

    if (filters.dateRange) {
      const now = new Date();
      let start: Date | null = null;
      if (filters.dateRange === 'TODAY') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (filters.dateRange === 'YESTERDAY') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      } else if (filters.dateRange === 'THIS_WEEK' || filters.dateRange === 'LAST_7_DAYS') {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === 'THIS_MONTH') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (filters.dateRange === 'THIS_YEAR') {
        start = new Date(now.getFullYear(), 0, 1);
      }

      if (start) {
        receiptsQuery = receiptsQuery.gte('created_at', start.toISOString());
      }
    }

    const { data: receipts, error } = await receiptsQuery;
    if (error) throw error;

    return (receipts || []).map((r: any) => ({
      id: r.id,
      receiptNumber: r.receipt_number,
      tenantId: r.tenant_id,
      restaurantName: r.tenants?.name || 'Unknown Restaurant',
      orderNumber: r.orders?.order_number || 'N/A',
      tableNumber: r.orders?.table_number ? `Table ${r.orders.table_number}` : 'N/A',
      customerName: r.orders?.customer_name || 'Walk-in',
      cashierName: r.cashier ? formatDisplayName(r.cashier.first_name, r.cashier.last_name) : 'Staff',
      paymentMethod: r.payment_method,
      totalAmount: Number(r.total_amount),
      status: r.payment_status || 'PAID',
      createdAt: r.created_at
    }));
  },

  async getTenantsList() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*, subscriptions(*, plans(*)), restaurant_settings(*)')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateTenantDetails(
    tenantId: string, 
    tenantData: { name: string; email: string; phone: string; address: string; logo: string | null; primary_color: string | null; secondary_color: string | null }, 
    settingsData: { timezone: string; currency: string; primary_color: string | null; secondary_color: string | null }
  ) {
    const symbol = CURRENCY_CONFIGS[settingsData.currency.toUpperCase()]?.symbol || settingsData.currency;
    const { error: tenantErr } = await supabase
      .from('tenants')
      .update({
        name: tenantData.name,
        email: tenantData.email,
        phone: tenantData.phone,
        address: tenantData.address,
        logo: tenantData.logo,
        primary_color: tenantData.primary_color,
        secondary_color: tenantData.secondary_color,
        currency_code: settingsData.currency,
        currency_symbol: symbol,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    if (tenantErr) throw tenantErr;

    const { error: settingsErr } = await supabase
      .from('restaurant_settings')
      .update({
        timezone: settingsData.timezone,
        primary_color: settingsData.primary_color,
        secondary_color: settingsData.secondary_color,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);

    if (settingsErr) throw settingsErr;
    return true;
  },

  async getTenantStaff(tenantId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('first_name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapUser);
  },

  async createTenantStaff(email: string, password: string, fullName: string, role: string, tenantId: string, preparationStation?: string) {
    const { data, error } = await supabase.functions.invoke('create-staff-user', {
      body: { email, password, role, tenantId, fullName, preparationStation }
    });

    if (error) {
      let msg = error.message || 'Failed to create staff member.';
      if (error.context && typeof error.context.clone === 'function') {
        try {
          const body = await error.context.clone().json();
          if (body && body.error) {
            msg = body.error;
          }
        } catch (_) {
          try {
            const txt = await error.context.clone().text();
            if (txt) msg = txt;
          } catch (__) {}
        }
      }

      console.log("Raw Edge Function error message:", msg);

      if (msg.includes('already exists') || msg.includes('EmailExists') || msg.includes('registered') || msg.includes('already registered') || msg.includes('already been registered')) {
        throw new Error('Email already exists.');
      }
      if (msg.includes('weak') || msg.includes('password') || msg.includes('should be at least') || msg.includes('too short')) {
        throw new Error('Password is too weak.');
      }
      if (msg.includes('invalid email') || msg.includes('email is invalid') || msg.includes('email address is invalid') || msg.includes('invalid format')) {
        throw new Error('Invalid email address.');
      }
      throw new Error(msg);
    }

    if (data && data.error) {
      const msg = data.error;
      if (msg.includes('already exists') || msg.includes('EmailExists') || msg.includes('registered') || msg.includes('already registered') || msg.includes('already been registered')) {
        throw new Error('Email already exists.');
      }
      if (msg.includes('weak') || msg.includes('password') || msg.includes('should be at least')) {
        throw new Error('Password is too weak.');
      }
      if (msg.includes('invalid email') || msg.includes('email is invalid') || msg.includes('email address is invalid') || msg.includes('invalid format')) {
        throw new Error('Invalid email address.');
      }
      throw new Error(msg);
    }

    // Notify ADMIN about staff provisioned
    try {
      await supabase.from('notifications').insert({
        tenant_id: tenantId,
        role: 'ADMIN',
        title: 'New Staff Provisioned',
        message: `Staff member ${fullName} (${role}) has been created successfully.`,
        is_read: false
      });
    } catch (e) {
      console.warn('Failed to generate staff provisioned notification:', e);
    }

    return data;
  },

  async toggleUserActive(userId: string, isActive: boolean) {
    const { error } = await supabase.rpc('superadmin_toggle_user_active', {
      p_user_id: userId,
      p_is_active: isActive
    });

    if (error) throw error;
    return true;
  },

  async resetUserPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });

    if (error) throw error;
    return true;
  },

  async updateStaffPassword(targetUserId: string, newPassword: string, tenantId: string) {
    const { data, error } = await supabase.functions.invoke('update-staff-password', {
      body: { targetUserId, newPassword, tenantId }
    });

    if (error) {
      let msg = error.message || 'Failed to update password.';
      if (error.context && typeof error.context.clone === 'function') {
        try {
          const body = await error.context.clone().json();
          if (body && body.error) msg = body.error;
        } catch (_) {}
      }
      throw new Error(msg);
    }

    if (data && data.error) throw new Error(data.error);
    return true;
  },

  async updateSubscription(tenantId: string, planName: string, currentPeriodEnd: string) {
    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('id')
      .eq('name', planName)
      .single();

    if (planErr) throw planErr;

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('tenant_id', tenantId)
      .single();

    if (existingSub) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          status: 'ACTIVE',
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenantId,
          plan_id: plan.id,
          status: 'ACTIVE',
          current_period_start: new Date().toISOString(),
          current_period_end: currentPeriodEnd
        });

      if (error) throw error;
    }

    try {
      await supabase.from('notifications').insert({
        tenant_id: tenantId,
        role: 'ADMIN',
        title: 'Subscription Updated',
        message: `Your subscription has been updated to the ${planName} plan.`,
        is_read: false
      });
    } catch (e) {
      console.warn('Failed to notify tenant of subscription update:', e);
    }

    return true;
  },

  async toggleTenantActive(tenantId: string, isActive: boolean) {
    const { error } = await supabase
      .from('tenants')
      .update({ is_active: isActive })
      .eq('id', tenantId);

    if (error) throw error;

    const { error: subErr } = await supabase
      .from('subscriptions')
      .update({ status: isActive ? 'ACTIVE' : 'SUSPENDED' })
      .eq('tenant_id', tenantId);

    if (subErr) {
      console.warn('Failed to update subscription status alongside tenant active status:', subErr);
    }
    try {
      await supabase.from('notifications').insert({
        tenant_id: tenantId,
        role: 'ADMIN',
        title: isActive ? 'Restaurant Activated' : 'Restaurant Suspended',
        message: `Your restaurant node has been ${isActive ? 'activated' : 'suspended'} by the platform administrator.`,
        is_read: false
      });
    } catch (e) {
      console.warn('Failed to notify tenant of activation status:', e);
    }

    return true;
  },

  async deleteTenant(tenantId: string) {
    const { error } = await supabase.rpc('superadmin_delete_tenant', {
      p_tenant_id: tenantId
    });

    if (error) throw error;
    return true;
  },

  async getTenantActivityLogs(tenantId: string) {
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId);

    if (!users || users.length === 0) return [];

    const userIds = users.map((u: any) => u.id);

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, users(first_name, last_name, email)')
      .in('user_id', userIds)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// ─── NotificationService ───
export const NotificationService = {
  async getNotifications(tenantId: string, userId?: string, role?: string) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId && role) {
      query = query.or(`user_id.eq.${userId},role.eq.${role},and(user_id.is.null,role.is.null)`);
    } else if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((n: any) => {
      // Derive the type from title/message since notifications table lacks a type column
      let derivedType = 'SYSTEM';
      const titleLower = n.title?.toLowerCase() || '';
      const messageLower = n.message?.toLowerCase() || '';
      if (titleLower.includes('order') || messageLower.includes('order')) {
        derivedType = 'ORDER_READY';
      } else if (titleLower.includes('waiter') || titleLower.includes('service') || messageLower.includes('waiter')) {
        derivedType = 'TABLE_REQUEST';
      } else if (titleLower.includes('bill') || titleLower.includes('invoice') || messageLower.includes('bill')) {
        derivedType = 'SYSTEM';
      }
      return {
        id: n.id,
        tenantId: n.tenant_id,
        orderId: n.order_id || null,
        userId: n.user_id,
        role: n.role,
        type: derivedType,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        createdAt: n.created_at,
      };
    });
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
    return true;
  },

  async markAllAsRead(tenantId: string, userId: string, role?: string) {
    let q = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .eq('is_read', false);

    if (userId && role) {
      q = q.or(`user_id.eq.${userId},role.eq.${role},and(user_id.is.null,role.is.null)`);
    } else if (userId) {
      q = q.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { error } = await q;
    if (error) throw error;
    return true;
  },

  async createNotification(notification: any) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        tenant_id: notification.tenantId,
        user_id: notification.userId || null,
        role: notification.role || null,
        title: notification.title,
        message: notification.message,
        is_read: false,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }
};



// ─── ActivityLogService ───
export const ActivityLogService = {
  async log(params: {
    tenantId: string;
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
  }) {
    try {
      await supabase.from('activity_logs').insert({
        tenant_id: params.tenantId,
        user_id: params.userId,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId || null,
        details: params.details || null,
      });
    } catch {
      // Activity logging should never break the app
      console.warn('[ActivityLog] Failed to write log entry');
    }
  },

  async getLogs(tenantId: string, limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, users(first_name, last_name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((log: any) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entity_id,
      details: log.details,
      userName: log.users ? formatDisplayName(log.users.first_name, log.users.last_name) : 'System',
      createdAt: log.created_at,
    }));
  }
};

// ─── SystemHealthService ───
export const SystemHealthService = {
  async getHealthMetrics() {
    const start = performance.now();
    const { data, error } = await supabase.rpc('get_system_health_metrics');
    const latency = performance.now() - start;

    if (error) throw error;
    return {
      ...data,
      latency_ms: latency,
    };
  },

  async getRecentAuditEvents(limit = 10) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, users(first_name, last_name, role)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((log: any) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      userName: log.users ? formatDisplayName(log.users.first_name, log.users.last_name) : 'System',
      role: log.users?.role || 'SYSTEM',
      createdAt: log.created_at,
    }));
  }
};

// ─── KdsService ───
export const KdsService = {
  async getKdsMetrics(tenantId: string) {
    // 1. Get active orders
    const { data: activeOrders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, status, created_at, order_items(id, status, menu_items(preparation_station))')
      .eq('tenant_id', tenantId)
      .in('status', ['PENDING', 'PREPARING']);

    if (ordersErr) throw ordersErr;

    let totalActiveOrders = activeOrders?.length || 0;
    let delayedOrders = 0;
    let totalPrepTimeMs = 0;
    let completedOrdersCount = 0; // Ideally from past 24h, but calculating from active
    
    const stationWorkload: Record<string, number> = {};
    const now = Date.now();

    (activeOrders || []).forEach(order => {
      const createdTime = new Date(order.created_at).getTime();
      const elapsedMs = now - createdTime;
      
      // Consider delayed if > 20 mins (1200000 ms)
      if (elapsedMs > 1200000) delayedOrders++;

      if (order.status === 'PREPARING') {
        totalPrepTimeMs += elapsedMs;
        completedOrdersCount++;
      }

      // Count items per station
      order.order_items?.forEach((item: any) => {
        if (item.status !== 'READY') {
          const station = item.menu_items?.preparation_station || 'Chef';
          stationWorkload[station] = (stationWorkload[station] || 0) + 1;
        }
      });
    });

    const avgPrepTimeMins = completedOrdersCount > 0 
      ? Math.floor((totalPrepTimeMs / completedOrdersCount) / 60000) 
      : 0;

    return {
      totalActiveOrders,
      delayedOrders,
      avgPrepTimeMins,
      stationWorkload
    };
  }
};
