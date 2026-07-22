import React from 'react';
import { cn } from '../../../lib/utils';

export interface DetailedReceiptProps {
  receipt?: any;
  order?: any;
  cart?: any[];
  tenant?: any;
  settings?: any;
  paperWidth?: '58mm' | '80mm';
  type?: 'CUSTOMER' | 'PAYMENT' | 'KITCHEN';
}

// Helper to safely convert any value (Number, String, Object, null, undefined) into a valid string
const getSafeString = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.orderNumber) return getSafeString(val.orderNumber);
    if (val.order_number) return getSafeString(val.order_number);
    if (val.receiptNumber) return getSafeString(val.receiptNumber);
    if (val.receipt_number) return getSafeString(val.receipt_number);
    if (val.id) return getSafeString(val.id);
  }
  return String(val);
};

export const DetailedReceipt: React.FC<DetailedReceiptProps> = ({
  receipt,
  order,
  cart,
  tenant,
  paperWidth = '80mm',
  type
}) => {
  // Resolve receipt type / mode
  let activeType: 'CUSTOMER' | 'PAYMENT' | 'KITCHEN' = type || 'CUSTOMER';
  if (!type) {
    if (receipt) {
      activeType = 'PAYMENT';
    } else {
      activeType = 'CUSTOMER';
    }
  }

  // Format numbers cleanly
  const formatVal = (val: number | string) => {
    const num = Number(val) || 0;
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Determine items list
  let itemsList: any[] = [];
  if (order?.items && order.items.length > 0) {
    itemsList = order.items.map((item: any) => {
      const q = item.quantity || 1;
      const unitP = Number(item.unitPrice || item.unit_price || (item.price ? item.price / q : 0));
      const totalP = Number(item.totalPrice || item.price || unitP * q);
      return {
        name: item.menuItem?.name || item.menuItems?.name || item.name || 'Item',
        quantity: q,
        unitPrice: unitP,
        totalPrice: totalP,
        notes: item.notes || ''
      };
    });
  } else if (order?.order_items && order.order_items.length > 0) {
    itemsList = order.order_items.map((item: any) => {
      const q = item.quantity || 1;
      const unitP = Number(item.unit_price || item.unitPrice || (item.price ? item.price / q : 0));
      const totalP = Number(item.price || item.totalPrice || unitP * q);
      return {
        name: item.menu_items?.name || item.menuItem?.name || item.name || 'Item',
        quantity: q,
        unitPrice: unitP,
        totalPrice: totalP,
        notes: item.notes || ''
      };
    });
  } else if (cart && cart.length > 0) {
    itemsList = cart.map((item: any) => {
      const q = item.quantity || 1;
      const unitP = Number(item.price || 0);
      const totalP = unitP * q;
      return {
        name: item.name || 'Item',
        quantity: q,
        unitPrice: unitP,
        totalPrice: totalP,
        notes: item.notes || ''
      };
    });
  }

  // Dates & Times
  const dateStr = receipt?.createdAt || receipt?.created_at || order?.createdAt || order?.created_at || new Date().toISOString();
  const dateObj = new Date(dateStr);
  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Defensive Order Number extraction
  const rawOrderVal = 
    getSafeString(receipt?.orderNumber) ||
    getSafeString(receipt?.order_number) ||
    getSafeString(order?.orderNumber) || 
    getSafeString(order?.order_number) || 
    (order?.id ? `ORD-${getSafeString(order.id).slice(0, 6).toUpperCase()}` : 'ORD-LOCAL');

  const rawOrderNum = getSafeString(rawOrderVal) || 'ORD-LOCAL';
  const orderNum = rawOrderNum.startsWith('#') ? rawOrderNum : `#${rawOrderNum}`;
  
  const rawTable = order?.tableNumber || order?.table_number || order?.table?.number;
  const tableNum = rawTable ? `T-${rawTable}` : 'Dine In';
  const orderType = order?.type || (rawTable ? 'Dine In' : 'Takeaway');
  
  const waiterName = order?.waiterName || order?.waiter?.name || order?.users?.name || 'Staff';
  const cashierName = receipt?.cashierName || receipt?.cashier?.name || 'Abdallah';
  const receiptNo = getSafeString(receipt?.receiptNumber || receipt?.receipt_number);

  // Subtotals and totals
  let subtotal = Number(receipt?.subtotal || 0);
  let discountAmount = Number(receipt?.discountAmount || receipt?.discount_amount || 0);
  let taxAmount = Number(receipt?.taxAmount || receipt?.tax_amount || 0);
  let finalGrandTotal = Number(receipt?.totalAmount || receipt?.total_amount || 0);

  if (!receipt || (subtotal === 0 && itemsList.length > 0)) {
    subtotal = itemsList.reduce((acc, item) => acc + (item.totalPrice || (item.unitPrice * item.quantity)), 0);
    taxAmount = subtotal * 0.15;
    finalGrandTotal = subtotal - discountAmount + taxAmount;
  }

  const amountReceived = receipt ? Number(receipt.amountReceived || receipt.amount_received || finalGrandTotal) : 0;
  const changeAmount = receipt ? Number(receipt.changeAmount || receipt.change_amount || 0) : 0;
  const paymentMethod = receipt?.paymentMethod || receipt?.payment_method || 'Cash';

  return (
    <div 
      className={cn(
        "bg-white text-black font-mono text-[11px] leading-relaxed mx-auto p-4 border border-gray-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print-receipt-paper select-none",
        paperWidth === '58mm' ? "w-[58mm]" : "w-[80mm]"
      )}
      style={{ boxSizing: 'border-box', backgroundColor: '#ffffff', color: '#000000' }}
    >
      <div className="print-receipt-container text-black">
        {/* --- RESTAURANT HEADER (Pure Restaurant Info) --- */}
        <div className="text-center font-sans space-y-0.5 mb-2">
          <h2 className="text-base font-bold text-black tracking-tight leading-tight">
            {tenant?.name || 'Dhadhan Restaurant'}
          </h2>
          <p className="text-[11px] text-gray-700 font-medium leading-tight">
            {tenant?.address || 'Jigjiga, Somali Region, Ethiopia'}
          </p>
          {tenant?.phone && (
            <p className="text-[11px] text-gray-700 font-medium">
              {tenant.phone}
            </p>
          )}
          {tenant?.email && (
            <p className="text-[11px] text-gray-700 font-medium">
              {tenant.email}
            </p>
          )}
        </div>

        {/* --- VARIATION 1: KITCHEN ORDER --- */}
        {activeType === 'KITCHEN' && (
          <>
            <div className="border-b border-dashed border-gray-400 my-2"></div>
            <div className="text-center font-bold text-xs uppercase tracking-wider text-black py-0.5 font-sans">
              KITCHEN ORDER
            </div>
            <div className="border-b border-dashed border-gray-400 my-2"></div>

            <div className="text-[11px] space-y-1 font-mono text-black">
              <div className="font-bold text-[12px]">
                ORDER {orderNum}
              </div>
              <div className="flex justify-between text-gray-800">
                <span>{formattedDate}</span>
                <span>{formattedTime}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Table: {tableNum}</span>
                <span>{orderType}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Waiter: {waiterName}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 my-2"></div>

            {/* Items for Kitchen Ticket */}
            <div className="space-y-1.5 font-mono text-[11px]">
              {itemsList.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start font-medium text-black">
                  <div className="flex-1 pr-2">
                    <span className="font-bold">{item.name}</span>
                    {item.notes && (
                      <div className="text-[10px] text-gray-600 pl-2 italic">Note: {item.notes}</div>
                    )}
                  </div>
                  <span className="font-bold shrink-0">x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-gray-400 my-2"></div>
            <div className="text-center text-[10px] font-bold tracking-widest text-black py-1">
              *** END OF ORDER ***
            </div>
          </>
        )}

        {/* --- VARIATION 2: PAYMENT RECEIPT --- */}
        {activeType === 'PAYMENT' && (
          <>
            <div className="border-b border-dashed border-gray-400 my-2"></div>
            <div className="text-center font-bold text-xs uppercase tracking-wider text-black py-0.5 font-sans">
              PAYMENT RECEIPT
            </div>
            <div className="border-b border-dashed border-gray-400 my-2"></div>

            <div className="text-[11px] space-y-1 font-mono text-black">
              {receiptNo && (
                <div className="flex justify-between font-bold">
                  <span>RECEIPT NO:</span>
                  <span>#{receiptNo}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>ORDER:</span>
                <span>{orderNum}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Date & Time:</span>
                <span>{formattedDate} {formattedTime}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Table:</span>
                <span>{tableNum}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Waiter:</span>
                <span>{waiterName}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Cashier:</span>
                <span>{cashierName}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 my-2"></div>

            {/* Itemized Table */}
            <div className="grid grid-cols-12 text-[10px] font-bold text-black font-mono uppercase pb-1">
              <span className="col-span-5">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-2 text-right">PRICE</span>
              <span className="col-span-3 text-right">TOTAL</span>
            </div>

            <div className="border-b border-dashed border-gray-400 mb-2"></div>

            {/* Items Map */}
            <div className="space-y-1.5 font-mono text-[11px] text-black">
              {itemsList.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="grid grid-cols-12 items-baseline">
                    <span className="col-span-5 truncate pr-1 font-medium">{item.name}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-2 text-right font-medium">{item.unitPrice.toFixed(2)}</span>
                    <span className="col-span-3 text-right font-semibold">{item.totalPrice.toFixed(2)}</span>
                  </div>
                  {item.notes && (
                    <div className="text-[9px] text-gray-600 pl-2 italic">Note: {item.notes}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-gray-400 my-2"></div>

            {/* Financial Summary */}
            <div className="text-[11px] space-y-1.5 font-mono text-black">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">{formatVal(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Discount</span>
                  <span>- {formatVal(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT (15%)</span>
                <span className="font-medium">{formatVal(taxAmount)}</span>
              </div>

              <div className="border-b border-dashed border-gray-400 my-1"></div>

              <div className="flex justify-between font-bold text-xs text-black pt-0.5">
                <span>TOTAL</span>
                <span>{formatVal(finalGrandTotal)}</span>
              </div>

              <div className="border-b border-dashed border-gray-400 my-1"></div>

              <div className="flex justify-between pt-0.5">
                <span>Payment Method</span>
                <span className="font-bold">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Amount</span>
                <span className="font-medium">{formatVal(amountReceived)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change</span>
                <span className="font-medium">{formatVal(changeAmount)}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 my-2"></div>

            <div className="text-center font-sans space-y-0.5 pt-1">
              <p className="text-[11px] font-bold text-black">Thank you!</p>
              <p className="text-[10px] text-gray-700">We appreciate your visit.</p>
              <p className="text-[10px] text-gray-700">Please come again!</p>
            </div>
          </>
        )}

        {/* --- VARIATION 3: CUSTOMER RECEIPT (Default / Itemized Customer Bill) --- */}
        {activeType === 'CUSTOMER' && (
          <>
            <div className="border-b border-dashed border-gray-400 my-2"></div>

            <div className="text-[11px] space-y-1 font-mono text-black">
              {receiptNo && (
                <div className="flex justify-between font-bold">
                  <span>RECEIPT NO:</span>
                  <span>#{receiptNo}</span>
                </div>
              )}
              <div className="font-bold text-[12px]">
                ORDER {orderNum}
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Date & Time:</span>
                <span>{formattedDate} {formattedTime}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Waiter:</span>
                <span>{waiterName}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Table: {tableNum}</span>
                <span>{orderType}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 my-2"></div>

            {/* Table Headers */}
            <div className="grid grid-cols-12 text-[10px] font-bold text-black font-mono uppercase pb-1">
              <span className="col-span-5">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-2 text-right">PRICE</span>
              <span className="col-span-3 text-right">TOTAL</span>
            </div>

            <div className="border-b border-dashed border-gray-400 mb-2"></div>

            {/* Items Map */}
            <div className="space-y-1.5 font-mono text-[11px] text-black">
              {itemsList.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="grid grid-cols-12 items-baseline">
                    <span className="col-span-5 truncate pr-1 font-medium">{item.name}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-2 text-right font-medium">{item.unitPrice.toFixed(2)}</span>
                    <span className="col-span-3 text-right font-semibold">{item.totalPrice.toFixed(2)}</span>
                  </div>
                  {item.notes && (
                    <div className="text-[9px] text-gray-600 pl-2 italic">Note: {item.notes}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-gray-400 my-2"></div>

            {/* Totals */}
            <div className="text-[11px] space-y-1 font-mono text-black">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">{formatVal(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Discount</span>
                  <span>- {formatVal(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT (15%)</span>
                <span className="font-medium">{formatVal(taxAmount)}</span>
              </div>

              <div className="border-b border-dashed border-gray-400 my-1"></div>

              <div className="flex justify-between font-bold text-xs text-black pt-0.5">
                <span>TOTAL</span>
                <span>{formatVal(finalGrandTotal)}</span>
              </div>

              {receipt && (
                <>
                  <div className="border-b border-dashed border-gray-400 my-1"></div>
                  <div className="flex justify-between pt-0.5">
                    <span>Payment Method</span>
                    <span className="font-bold">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid Amount</span>
                    <span className="font-medium">{formatVal(amountReceived)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change</span>
                    <span className="font-medium">{formatVal(changeAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-b border-dashed border-gray-400 my-2"></div>

            {/* Footer */}
            <div className="text-center font-sans space-y-0.5 pt-1">
              <p className="text-[11px] font-bold text-black">Thank you!</p>
              <p className="text-[10px] text-gray-700">We appreciate your visit.</p>
              <p className="text-[10px] text-gray-700">Please come again!</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
