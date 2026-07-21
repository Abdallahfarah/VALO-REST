import React from 'react';
import { cn } from '../../../lib/utils';

// Helper to determine item modifiers and kitchen notes based on name
export const getItemModifiersAndNotes = (itemName: string) => {
  const name = itemName.toLowerCase();
  if (name.includes('burger')) {
    return {
      modifiers: [
        { name: 'Extra Cheese', price: 40 },
        { name: 'Double Patty', price: 120 }
      ],
      notes: 'No Tomato, Extra Spicy'
    };
  }
  if (name.includes('fries')) {
    return {
      modifiers: [
        { name: 'Melted Cheese', price: 30 }
      ],
      notes: 'Well Done / Extra Crispy'
    };
  }
  if (name.includes('pizza')) {
    return {
      modifiers: [
        { name: 'Extra Pepperoni', price: 50 },
        { name: 'Gluten Free Crust', price: 60 }
      ],
      notes: 'Slice in 8 pieces'
    };
  }
  if (name.includes('cola') || name.includes('coca') || name.includes('soda') || name.includes('fanta') || name.includes('sprite')) {
    return {
      modifiers: [
        { name: 'Add Ice', price: 0 }
      ],
      notes: 'Cold'
    };
  }
  if (name.includes('coffee') || name.includes('macchiato') || name.includes('cappuccino') || name.includes('latte') || name.includes('tea')) {
    return {
      modifiers: [
        { name: 'Oat Milk', price: 25 },
        { name: 'Extra Shot', price: 15 }
      ],
      notes: 'No Sugar'
    };
  }
  return { modifiers: [], notes: '' };
};

interface DetailedReceiptProps {
  receipt?: any; // If null, it's a pre-settlement Bill Invoice
  order?: any;
  cart?: any[]; // Fallback for active POS cart items
  tenant?: any;
  settings?: any;
  paperWidth?: '58mm' | '80mm';
}

export const DetailedReceipt: React.FC<DetailedReceiptProps> = ({
  receipt,
  order,
  cart,
  tenant,
  settings,
  paperWidth = '80mm'
}) => {
  // 1. Resolve general values
  const currencySymbol = tenant?.currency_symbol || 'ETB';
  const logoEnabled = settings?.logo_url !== 'disabled' && (settings?.logoEnabled ?? true);
  
  // Format numbers to currency
  const formatVal = (val: number | string) => {
    const num = Number(val);
    return `${currencySymbol} ${num.toFixed(2)}`;
  };

  // Determine items list
  let itemsList: any[] = [];
  if (order?.items && order.items.length > 0) {
    itemsList = order.items.map((item: any) => ({
      name: item.menuItem?.name || item.menuItems?.name || 'Menu Item',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice || item.unit_price || 0),
      totalPrice: Number(item.price || 0),
      notes: item.notes || ''
    }));
  } else if (order?.order_items && order.order_items.length > 0) {
    itemsList = order.order_items.map((item: any) => ({
      name: item.menu_items?.name || item.menuItem?.name || 'Menu Item',
      quantity: item.quantity,
      unitPrice: Number(item.unit_price || 0),
      totalPrice: Number(item.price || 0),
      notes: item.notes || ''
    }));
  } else if (cart && cart.length > 0) {
    itemsList = cart.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      totalPrice: Number(item.price) * item.quantity,
      notes: item.notes || ''
    }));
  }

  // Parse Date & Time
  const dateStr = receipt?.createdAt || order?.createdAt || order?.created_at || new Date().toISOString();
  const dateObj = new Date(dateStr);
  const formattedDate = dateObj.toLocaleDateString();
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate or resolve payment figures
  let subtotal = Number(receipt?.subtotal || 0);
  let discountAmount = Number(receipt?.discountAmount || receipt?.discount_amount || 0);
  let taxAmount = Number(receipt?.taxAmount || receipt?.tax_amount || 0);
  let serviceChargeAmount = 0;
  let serviceChargeRate = 0;
  let finalGrandTotal = Number(receipt?.totalAmount || receipt?.total_amount || 0);
  let extraNotes = receipt?.notes || '';

  // Parse service charge from receipt notes if applicable
  if (receipt?.notes && receipt.notes.includes('Service Charge:')) {
    const scMatch = receipt.notes.match(/Service Charge:\s*([\d.]+)%\s*\(([\d.]+)\)/i);
    if (scMatch) {
      serviceChargeRate = parseFloat(scMatch[1]);
      serviceChargeAmount = parseFloat(scMatch[2]);
      extraNotes = receipt.notes.replace(/Service Charge:\s*[\d.]+(?:%|percent)\s*\([\d.]+\)\.?\s*/i, '').trim();
    }
  }

  // Fallbacks if receipt is null (Bill Invoice pre-settlement preview)
  if (!receipt) {
    subtotal = itemsList.reduce((acc, item) => acc + item.totalPrice, 0);
    // Apply 15% standard tax if configured or active
    const taxRate = Number(settings?.tax_rate ?? 15.00);
    taxAmount = subtotal * (taxRate / 100);
    finalGrandTotal = subtotal + taxAmount;
  }

  const amountReceived = receipt ? Number(receipt.amountReceived || receipt.amount_received || finalGrandTotal) : 0;
  const changeAmount = receipt ? Number(receipt.changeAmount || receipt.change_amount || 0) : 0;
  const paymentMethod = receipt?.paymentMethod || receipt?.payment_method || 'Cash';
  const tableNum = order?.tableNumber || order?.table?.number || 'N/A';
  const customerName = order?.customerName || order?.customer_name || 'Walk-in';
  
  // Determine Order Type
  let orderType = 'Dine-In';
  if (customerName.toLowerCase().includes('(qr') || customerName.toLowerCase().includes('qr table')) {
    orderType = 'Dine-In (QR)';
  } else if (tableNum === 'N/A' || !tableNum) {
    orderType = 'Takeaway';
  }

  const waiterName = order?.waiterName || order?.users?.name || 'Unassigned';
  const cashierName = receipt?.cashierName || 'Not Settled';

  return (
    <div 
      className={cn(
        "bg-white text-slate-900 mx-auto font-mono text-[11px] leading-relaxed shadow-lg p-5 border border-slate-100 print:shadow-none print:border-none print:p-0",
        paperWidth === '58mm' ? "w-[58mm]" : "w-[80mm]"
      )}
      style={{ boxSizing: 'border-box' }}
    >
      <div className="print-receipt-container">
        {/* Header Section */}
        <div className="text-center space-y-1">
          {logoEnabled && (
            <img 
              src={tenant?.logo || 'https://ui-avatars.com/api/?name=DHADHAN+HUB&background=F97316&color=fff'} 
              alt="Logo" 
              className="w-12 h-12 object-cover rounded-xl border border-slate-100 shadow-sm mx-auto mb-1.5"
            />
          )}
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 leading-tight">
            {tenant?.name || 'DHADHAN HUB'}
          </h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            {tenant?.slug ? `${tenant.slug} branch` : 'Central Branch'}
          </p>
          <p className="text-[9px] text-slate-500 max-w-xs mx-auto font-semibold">
            {tenant?.address || 'Restaurant Address'}
          </p>
          <p className="text-[9px] text-slate-500 font-semibold">
            Tel: {tenant?.phone || 'Phone Number'}
          </p>
          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest pt-0.5">
            TIN: {tenant?.id ? `TIN-${tenant.id.slice(0, 8).toUpperCase()}` : 'TIN-9847294-7'}
          </p>
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-slate-300 my-3"></div>

        {/* Order metadata grid */}
        <div className="space-y-1 text-slate-600 font-semibold">
          {receipt?.receiptNumber && (
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <span className="text-slate-950 font-bold">{receipt.receiptNumber}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Order Ref:</span>
            <span className="text-slate-950 font-bold">{order?.orderNumber || `ORD-${(order?.id || 'POS').slice(0, 6).toUpperCase()}`}</span>
          </div>
          <div className="flex justify-between">
            <span>Date/Time:</span>
            <span className="text-slate-950 font-bold">{formattedDate} {formattedTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Table:</span>
            <span className="text-slate-950 font-bold">Table {tableNum}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="text-slate-950 font-bold">{customerName}</span>
          </div>
          <div className="flex justify-between">
            <span>Order Type:</span>
            <span className="text-slate-950 font-bold uppercase">{orderType}</span>
          </div>
          <div className="flex justify-between">
            <span>Waiter:</span>
            <span className="text-slate-950 font-bold">{waiterName}</span>
          </div>
          {receipt && (
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span className="text-slate-950 font-bold">{cashierName}</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-t-2 border-dashed border-slate-300 my-3"></div>

        {/* Itemized Order Details */}
        <div className="space-y-2">
          {/* Header Row */}
          <div className="flex justify-between font-bold text-slate-950">
            <span>Item Description</span>
            <span>Total</span>
          </div>
          
          {/* Items Map */}
          <div className="space-y-2 pt-1.5">
            {itemsList.map((item, idx) => {
              const { modifiers, notes } = getItemModifiersAndNotes(item.name);
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start text-slate-950 font-bold">
                    <span className="break-all pr-4">
                      {item.quantity} × {item.name}
                    </span>
                    <span className="shrink-0">{formatVal(item.totalPrice)}</span>
                  </div>
                  {/* Unit price display */}
                  <div className="text-[9px] text-slate-400 font-bold pl-5">
                    Unit Price: {formatVal(item.unitPrice)}
                  </div>
                  {/* Modifiers List */}
                  {modifiers.map((mod, mIdx) => (
                    <div key={mIdx} className="text-[9px] text-slate-500 font-bold pl-5">
                      • {mod.name} {mod.price > 0 ? `(+${mod.price})` : ''}
                    </div>
                  ))}
                  {/* Item Specific Kitchen Note */}
                  {(notes || item.notes) && (
                    <div className="text-[9px] text-orange-600 font-bold pl-5 italic">
                      Note: {item.notes || notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t-2 border-dashed border-slate-300 my-3"></div>

        {/* Payment Summary */}
        <div className="space-y-1.5 text-slate-600 font-semibold">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-slate-950 font-bold">{formatVal(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span className="font-bold">-{formatVal(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax (15%)</span>
            <span className="text-slate-950 font-bold">{formatVal(taxAmount)}</span>
          </div>
          {serviceChargeAmount > 0 && (
            <div className="flex justify-between">
              <span>Service Charge ({serviceChargeRate}%)</span>
              <span className="text-slate-950 font-bold">{formatVal(serviceChargeAmount)}</span>
            </div>
          )}
          
          <div className="border-t border-dashed border-slate-300 my-1"></div>

          <div className="flex justify-between text-sm font-black text-slate-950">
            <span>GRAND TOTAL</span>
            <span>{formatVal(finalGrandTotal)}</span>
          </div>

          {receipt && (
            <>
              <div className="flex justify-between">
                <span>Amount Paid</span>
                <span className="text-slate-950 font-bold">{formatVal(amountReceived)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change Returned</span>
                <span className="text-slate-950 font-bold">{formatVal(changeAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="text-slate-950 font-bold uppercase">{paymentMethod}</span>
              </div>
            </>
          )}
        </div>

        {/* Extra Notes section if present */}
        {extraNotes && (
          <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 italic">
            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 not-italic">Notes</span>
            <p className="mt-0.5 leading-relaxed">{extraNotes}</p>
          </div>
        )}

        {/* Separator */}
        <div className="border-t-2 border-dashed border-slate-300 my-3"></div>

        {/* Footer section */}
        <div className="text-center space-y-1">
          <p className="text-slate-950 font-black uppercase tracking-wider">
            Thank You Message
          </p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Visit Again
          </p>
          <p className="text-[9px] text-slate-400 font-medium">
            {tenant?.email || 'contact@dhadhanhub.com'}
          </p>
          <p className="text-[9px] text-slate-400 font-medium">
            www.dhadhanhub.com
          </p>
          
          {/* Simple QR Code placeholder representation */}
          <div className="pt-3 pb-1 flex flex-col items-center justify-center gap-1.5">
            <div className="w-16 h-16 border-2 border-slate-900 bg-white p-1 flex items-center justify-center relative">
              {/* QR Pattern Representation */}
              <div className="w-full h-full bg-slate-100 flex flex-wrap gap-[2px]">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-[6px] h-[6px] rounded-[1px]",
                      (i % 3 === 0 || i % 7 === 1 || i < 7 || i % 7 === 6 || i > 42) ? "bg-slate-900" : "bg-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">VALO POS SECURE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
