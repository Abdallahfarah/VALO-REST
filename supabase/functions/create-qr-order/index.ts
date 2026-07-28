// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://lyisewdjlkyahtvrgerj.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseServiceKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing service key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const body = await req.json();
    const { tenantId, tableId, tableNumber, customerName, items, paymentMethod } = body;

    // STEP 3: STRICT SERVER-SIDE VALIDATIONS
    // 1. Customer name
    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return new Response(
        JSON.stringify({ error: "Validation failed: Customer name is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Items array
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed: At least one menu item is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Restaurant (Tenant) exists & active
    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: "Validation failed: Missing restaurant tenant ID." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .select("id, name, is_active, currency_symbol")
      .eq("id", tenantId)
      .single();

    if (tenantErr || !tenant) {
      return new Response(
        JSON.stringify({ error: "Validation failed: Restaurant not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tenant.is_active === false) {
      return new Response(
        JSON.stringify({ error: "Validation failed: Restaurant is currently inactive." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Table exists, belongs to restaurant, and active
    let table = null;
    if (tableId) {
      const { data: tableData, error: tableErr } = await supabase
        .from("tables")
        .select("id, number, is_active, waiter_id")
        .eq("id", tableId)
        .eq("tenant_id", tenantId)
        .single();

      if (tableErr || !tableData) {
        return new Response(
          JSON.stringify({ error: "Validation failed: Table not found or does not belong to this restaurant." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (tableData.is_active === false) {
        return new Response(
          JSON.stringify({ error: "Validation failed: Table is currently inactive." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      table = tableData;
    }

    // 5. Menu Items belong to restaurant and active
    const itemIds = items.map((i: any) => i.id || i.menuItemId).filter(Boolean);
    const { data: dbMenuItems, error: menuErr } = await supabase
      .from("menu_items")
      .select("id, name, price, is_available, preparation_station")
      .eq("tenant_id", tenantId)
      .in("id", itemIds);

    if (menuErr || !dbMenuItems || dbMenuItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed: Invalid or unavailable menu items." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dbItemMap = new Map(dbMenuItems.map((m: any) => [m.id, m]));
    let calculatedTotal = 0;
    const validatedOrderItems = [];

    for (const reqItem of items) {
      const targetId = reqItem.id || reqItem.menuItemId;
      const dbItem = dbItemMap.get(targetId);

      if (!dbItem) {
        return new Response(
          JSON.stringify({ error: `Validation failed: Menu item ${reqItem.name || targetId} not found in restaurant menu.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (dbItem.is_available === false) {
        return new Response(
          JSON.stringify({ error: `Validation failed: Menu item "${dbItem.name}" is currently sold out.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const qty = Math.max(1, parseInt(reqItem.quantity) || 1);
      const unitPrice = Number(dbItem.price);
      const itemPrice = unitPrice * qty;
      calculatedTotal += itemPrice;

      validatedOrderItems.push({
        menu_item_id: dbItem.id,
        name: dbItem.name,
        quantity: qty,
        unit_price: unitPrice,
        price: itemPrice,
        preparation_station: dbItem.preparation_station || reqItem.preparationStation || 'Chef',
        status: 'PENDING'
      });
    }

    // Check Active Order on Table (Intelligent Merging)
    let activeOrder = null;
    if (tableId) {
      const { data: activeOrdersRes } = await supabase
        .from("orders")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("table_id", tableId)
        .not("status", "in", '("COMPLETED","CANCELED")')
        .limit(1);

      if (activeOrdersRes && activeOrdersRes.length > 0) {
        activeOrder = activeOrdersRes[0];
      }
    }

    let orderId = "";
    let isNewOrder = false;

    if (activeOrder) {
      orderId = activeOrder.id;
      const newTotal = Number(activeOrder.total_amount) + calculatedTotal;

      const orderItemsToInsert = validatedOrderItems.map(item => ({
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        price: item.price,
        status: 'PENDING'
      }));

      const [orderUpdate, itemsInsert, tableUpdate] = await Promise.all([
        supabase
          .from("orders")
          .update({
            total_amount: newTotal,
            status: "PENDING",
            updated_at: new Date().toISOString()
          })
          .eq("id", orderId),
        supabase.from("order_items").insert(orderItemsToInsert),
        tableId ? supabase.from("tables").update({ status: "OCCUPIED" }).eq("id", tableId) : Promise.resolve({ error: null })
      ]);

      if (orderUpdate.error) throw orderUpdate.error;
      if (itemsInsert.error) throw itemsInsert.error;
      if (tableUpdate.error) throw tableUpdate.error;
    } else {
      isNewOrder = true;

      let newOrderNumber = 1;
      const { data: latestOrder } = await supabase
        .from("orders")
        .select("order_number")
        .eq("tenant_id", tenantId)
        .order("order_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestOrder && latestOrder.order_number) {
        newOrderNumber = Number(latestOrder.order_number) + 1;
      }

      const formattedCustomerName = `${customerName.trim()} (QR${tableNumber ? ' Table ' + tableNumber : ''})`;

      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          tenant_id: tenantId,
          table_id: tableId || null,
          waiter_id: table?.waiter_id || null,
          customer_name: formattedCustomerName,
          status: "PENDING",
          total_amount: calculatedTotal,
          order_number: newOrderNumber,
        })
        .select("*")
        .single();

      if (orderErr || !newOrder) throw orderErr;
      orderId = newOrder.id;

      const orderItemsToInsert = validatedOrderItems.map(item => ({
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        price: item.price,
        status: 'PENDING'
      }));

      const [itemsInsert, tableUpdate] = await Promise.all([
        supabase.from("order_items").insert(orderItemsToInsert),
        tableId ? supabase.from("tables").update({ status: "OCCUPIED" }).eq("id", tableId) : Promise.resolve({ error: null })
      ]);

      if (itemsInsert.error) throw itemsInsert.error;
      if (tableUpdate.error) throw tableUpdate.error;
    }

    // STEP 4: TRIGGER REALTIME NOTIFICATIONS WITH ORDER REFERENCE
    const displayTableLabel = tableNumber || table?.number ? `Table ${tableNumber || table?.number}` : 'QR Mobile';
    const notificationRows = [
      {
        tenant_id: tenantId,
        order_id: orderId,
        role: "ADMIN",
        title: "New QR Order",
        message: `Customer ${customerName.trim()} placed QR order at ${displayTableLabel} (${validatedOrderItems.length} items, ${tenant.currency_symbol || 'ETB'} ${calculatedTotal.toFixed(2)}).`,
        is_read: false
      }
    ];

    if (table?.waiter_id) {
      notificationRows.push({
        tenant_id: tenantId,
        order_id: orderId,
        user_id: table.waiter_id,
        role: "WAITER",
        title: `Table ${table.number} Order Placed`,
        message: `Customer ${customerName.trim()} at Table ${table.number} placed a new QR order.`,
        is_read: false
      });
    } else {
      notificationRows.push({
        tenant_id: tenantId,
        order_id: orderId,
        role: "WAITER",
        title: "New QR Order (Unassigned Table)",
        message: `Customer ${customerName.trim()} placed a QR order at ${displayTableLabel}. Available for pickup.`,
        is_read: false
      });
    }

    await supabase.from("notifications").insert(notificationRows);

    await supabase.from("activity_logs").insert({
      action: isNewOrder ? "QR_ORDER_CREATED" : "QR_ORDER_MODIFIED",
      entity_type: "order",
      entity_id: orderId,
      timestamp: new Date().toISOString(),
    });

    const { data: fullOrder } = await supabase
      .from("orders")
      .select("*, tables(number), users(*), order_items(*, menu_items(name, preparation_station))")
      .eq("id", orderId)
      .single();

    return new Response(
      JSON.stringify({ success: true, order: fullOrder, isNewOrder }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[create-qr-order] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to process QR order." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
