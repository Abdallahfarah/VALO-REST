// Live Supabase ApiService
// Queries the PostgreSQL database via the Supabase JS client.

import { supabase } from '../../lib/supabase';
import { CURRENCY_CONFIGS } from './CurrencyService';
import { getEmojiForIconId } from '../lib/icon-library';

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
  capacity: row.capacity ?? 4,
  status: row.status ?? 'AVAILABLE',
  waiterId: row.waiter_id,
  guestCount: row.guest_count ?? 0,
  waiter: row.users ? { id: row.users.id, name: `${row.users.first_name} ${row.users.last_name}`, email: row.users.email } : null,
});

const mapOrderItem = (row: any) => ({
  id: row.id,
  menuItem: { name: row.menu_items?.name || 'Item' },
  quantity: row.quantity,
  unitPrice: Number(row.unit_price),
  price: Number(row.price),
  status: row.status || 'PENDING',
});

const mapOrder = (row: any) => ({
  id: row.id,
  status: row.status,
  waiterId: row.waiter_id,
  tableId: row.table_id,
  customerName: row.customer_name,
  totalAmount: Number(row.total_amount),
  createdAt: row.created_at,
  table: row.tables ? { number: row.tables.number } : { number: 'N/A' },
  waiterName: row.users ? `${row.users.first_name} ${row.users.last_name}` : 'Unassigned',
  items: (row.order_items || []).map(mapOrderItem),
});

const mapUser = (row: any) => ({
  id: row.id,
  name: `${row.first_name} ${row.last_name}`,
  email: row.email,
  role: row.role,
  section: '',
  status: row.is_active ? 'Active' : 'Inactive',
});

// ─── OrderService ───
export const OrderService = {
  async getOrders(tenantId: string, status?: string) {
    let query = supabase
      .from('orders')
      .select('*, tables(number), users(*), order_items(*, menu_items(name))')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapOrder);
  },

  async createOrder(payload: any) {
    let waiterId = payload.waiterId;
    if (!waiterId && payload.tableId) {
      const { data: tableData } = await supabase
        .from('tables')
        .select('waiter_id')
        .eq('id', payload.tableId)
        .single();
      if (tableData?.waiter_id) {
        waiterId = tableData.waiter_id;
      }
    }

    // Check if there is already an active order for this table
    let activeOrder = null;
    if (payload.tableId) {
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('table_id', payload.tableId)
        .not('status', 'in', '("COMPLETED","CANCELED")')
        .limit(1);
      if (activeOrders && activeOrders.length > 0) {
        activeOrder = activeOrders[0];
      }
    }

    let orderId = '';
    if (activeOrder) {
      orderId = activeOrder.id;
      const newTotal = Number(activeOrder.total_amount) + Number(payload.totalAmount);
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          total_amount: newTotal,
          status: 'PENDING',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      if (orderError) throw orderError;
    } else {
      // Insert the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: payload.tenantId,
          table_id: payload.tableId,
          waiter_id: waiterId || null,
          customer_name: payload.customerName || null,
          status: 'PENDING',
          total_amount: payload.totalAmount,
        })
        .select('*')
        .single();

      if (orderError) throw orderError;
      orderId = order.id;
    }

    // 2. Insert order items
    const orderItems = payload.items.map((item: any) => ({
      order_id: orderId,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: item.price,
      price: item.price * item.quantity,
      status: 'PENDING',
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 3. Update table status to OCCUPIED
    if (payload.tableId) {
      await supabase
        .from('tables')
        .update({ status: 'OCCUPIED' })
        .eq('id', payload.tableId);
    }

    // 4. Fetch and return the complete order
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, tables(number), users(*), order_items(*, menu_items(name))')
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
      .select('*, tables(number), users(*), order_items(*, menu_items(name))')
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

  async settleOrder(orderId: string, paymentData: any) {
    // 1. Fetch current order details
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr) throw fetchErr;

    // 2. Fetch restaurant tax settings to compute subtotal and tax
    const { data: settings } = await supabase
      .from('restaurant_settings')
      .select('tax_rate')
      .eq('tenant_id', paymentData.tenantId)
      .single();

    const taxRate = Number(settings?.tax_rate ?? 15.00);
    const totalAmount = Number(order.total_amount);
    
    // total = subtotal * (1 + taxRate/100)
    // subtotal = total / (1 + taxRate/100)
    const subtotal = totalAmount / (1 + taxRate / 100);
    const taxAmount = totalAmount - subtotal;

    // Generate unique receipt number
    const receiptNumber = 'REC-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // 3. Insert receipt
    const { error: receiptErr } = await supabase
      .from('receipts')
      .insert({
        tenant_id: paymentData.tenantId,
        order_id: orderId,
        cashier_id: paymentData.cashierId || null,
        receipt_number: receiptNumber,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        payment_method: paymentData.method || 'Cash',
        payment_status: 'PAID',
        amount_received: Number(paymentData.amountReceived ?? totalAmount),
        change_amount: Number(paymentData.changeAmount ?? 0),
        notes: paymentData.notes || null
      });

    if (receiptErr) throw receiptErr;

    // 4. Update order to COMPLETED
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('*, tables(number), users(*), order_items(*, menu_items(name))')
      .single();

    if (error) throw error;

    // 4b. Update all order items status to READY
    await supabase
      .from('order_items')
      .update({ status: 'READY' })
      .eq('order_id', orderId);

    // 5. Release the table
    if (data?.table_id) {
      await supabase
        .from('tables')
        .update({ status: 'AVAILABLE' })
        .eq('id', data.table_id);
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
        capacity: table.capacity,
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
    if (table.capacity !== undefined) updateData.capacity = table.capacity;
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
  totalAmount: Number(row.total_amount),
  paymentMethod: row.payment_method,
  status: row.payment_status,
  createdAt: row.created_at,
  order: row.orders ? {
    id: row.orders.id,
    tableNumber: row.orders.tables?.number,
    waiterName: row.orders.users ? `${row.orders.users.first_name} ${row.orders.users.last_name}` : 'Unknown'
  } : null
});

export const ReceiptService = {
  async getReceipts(tenantId: string) {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, orders(*, tables(number), users(*))')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapReceipt);
  }
};

// ─── SuperAdminService ───
export const SuperAdminService = {
  async getOverviewStats() {
    const { count: tenantCount, error: tenantErr } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });
    
    if (tenantErr) throw tenantErr;

    const { count: userCount, error: userErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (userErr) throw userErr;

    const { data: subs, error: subsErr } = await supabase
      .from('subscriptions')
      .select('*, plans(*)');

    if (subsErr) throw subsErr;

    const activeSubsCount = subs.filter((s: any) => s.status === 'ACTIVE' || s.status === 'TRIAL').length;
    const totalRev = subs
      .filter((s: any) => s.status === 'ACTIVE')
      .reduce((acc: number, s: any) => acc + Number(s.plans?.price || 0), 0);

    return {
      tenantCount: tenantCount || 0,
      userCount: userCount || 0,
      activeSubsCount,
      totalRevenue: totalRev
    };
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

  async createTenantStaff(email: string, password: string, fullName: string, role: string, tenantId: string) {
    const { data, error } = await supabase.functions.invoke('create-staff-user', {
      body: { email, password, role, tenantId, fullName }
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
  async getNotifications(tenantId: string, userId?: string) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (userId) {
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

  async markAllAsRead(tenantId: string, userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .or(`user_id.eq.${userId},user_id.is.null`);
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

// ─── MessagingService ───
export const MessagingService = {
  async getConversations(_tenantId: string, userId: string) {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('*, conversations(*, messages(*, users(first_name, last_name)))')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((cp: any) => {
      const conv = cp.conversations;
      const lastMsg = conv?.messages?.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      return {
        id: conv?.id,
        name: conv?.name,
        lastMessage: lastMsg?.content || '',
        lastMessageTime: lastMsg?.created_at,
        lastSenderName: lastMsg?.users
          ? `${lastMsg.users.first_name} ${lastMsg.users.last_name}`
          : 'System',
        unreadCount: (conv?.messages || []).filter((m: any) => {
          if (m.sender_id === userId) return false;
          const payload = m.payload || {};
          const readBy = payload.read_by || [];
          return !readBy.includes(userId);
        }).length,
      };
    });
  },

  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, users(id, first_name, last_name)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderName: m.users ? `${m.users.first_name} ${m.users.last_name}` : 'Unknown',
      content: m.content,
      createdAt: m.created_at,
    }));
  },

  async sendMessage(conversationId: string, senderId: string, content: string, tenantId?: string) {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('tenant_id')
        .eq('id', conversationId)
        .single();
      resolvedTenantId = conv?.tenant_id;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        tenant_id: resolvedTenantId,
        payload: { read_by: [senderId] }
      })
      .select('*, users(id, first_name, last_name)')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      senderName: data.users ? `${data.users.first_name} ${data.users.last_name}` : 'Unknown',
      content: data.content,
      createdAt: data.created_at,
    };
  },

  async markMessagesAsRead(conversationId: string, userId: string) {
    if (!conversationId || !userId) return;

    // Fetch all messages in the conversation sent by other users
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, sender_id, payload')
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);

    if (error || !messages) return;

    // Filter messages that don't have this userId in their read_by list
    const unread = messages.filter((m: any) => {
      const payload = m.payload || {};
      const readBy = payload.read_by || [];
      return !readBy.includes(userId);
    });

    if (unread.length === 0) return;

    // Update each message to include the userId in payload.read_by
    await Promise.all(
      unread.map(async (m: any) => {
        const payload = m.payload || {};
        const readBy = payload.read_by || [];
        const newReadBy = [...new Set([...readBy, userId])];
        await supabase
          .from('messages')
          .update({
            payload: {
              ...payload,
              read_by: newReadBy
            }
          })
          .eq('id', m.id);
      })
    );
  },

  async createConversation(tenantId: string, name: string, participantIds: string[]) {
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ tenant_id: tenantId, name })
      .select('*')
      .single();

    if (convErr) throw convErr;

    const participants = participantIds.map(uid => ({
      conversation_id: conv.id,
      user_id: uid,
    }));

    const { error: partErr } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (partErr) throw partErr;
    return conv;
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
      userName: log.users ? `${log.users.first_name} ${log.users.last_name}` : 'System',
      createdAt: log.created_at,
    }));
  }
};
