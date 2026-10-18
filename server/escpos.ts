import type { Order, Invoice, ShopSettings } from '../src/types/index.ts';

/**
 * ESC/POS thermal formatting utility for 58mm (32 chars) and 80mm (48 chars) thermal printers.
 */

export function formatLine(left: string, right: string, width: number): string {
  const spaceNeeded = width - (left.length + right.length);
  if (spaceNeeded <= 0) {
    return left.slice(0, width - right.length - 1) + ' ' + right;
  }
  return left + ' '.repeat(spaceNeeded) + right;
}

export function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const leftPad = Math.floor((width - text.length) / 2);
  return ' '.repeat(leftPad) + text;
}

export function divider(width: number, char = '-'): string {
  return char.repeat(width);
}

export function doubleDivider(width: number): string {
  return '='.repeat(width);
}

export function formatQuantity(quantity: number, unit: string): string {
  if (unit === 'kg') {
    if (quantity < 1) {
      return `${Math.round(quantity * 1000)}g`;
    }
    return `${quantity.toFixed(quantity % 1 === 0 ? 0 : 2)} kg`;
  }
  if (unit === 'piece') {
    return `${quantity} pc${quantity > 1 ? 's' : ''}`;
  }
  return `${quantity} ${unit}`;
}

/**
 * Receipt 1: Customer Waiting Token (Small 58mm thermal slip)
 * Small receipt containing token no. or order no. that customer takes,
 * sits, and waits for their token number to be announced.
 */
export function generateCustomerTokenReceipt(
  order: Order,
  settings: ShopSettings,
  paperWidth: '58mm' | '80mm' = '58mm'
): { text: string; escposHex: string } {
  const width = paperWidth === '58mm' ? 32 : 48;
  const lines: string[] = [];

  lines.push(centerText((settings.shopName || 'SHREE KRISHNA SWEETS').toUpperCase(), width));
  if (settings.tagline) lines.push(centerText(settings.tagline, width));
  if (settings.phone) lines.push(centerText(`Ph: ${settings.phone}`, width));
  lines.push(doubleDivider(width));
  lines.push(centerText('CUSTOMER WAITING SLIP', width));
  lines.push(centerText('(Keep this slip with you)', width));
  lines.push('');
  lines.push(centerText('*** TOKEN NUMBER ***', width));
  lines.push(centerText(`>>> ${order.tokenNumber} <<<`, width));
  lines.push('');
  lines.push(divider(width, '-'));
  lines.push(formatLine(`Order No:`, order.id.slice(0, 12), width));
  lines.push(formatLine(`Date: ${order.businessDate}`, new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), width));
  lines.push(formatLine(`Counter: ${order.counterId}`, `By: ${order.createdByName}`, width));
  lines.push(divider(width, '-'));
  lines.push(formatLine('ITEM SUMMARY', 'QTY', width));
  lines.push(divider(width, '-'));

  for (const item of order.items) {
    const qtyStr = formatQuantity(item.quantity, item.unit);
    lines.push(formatLine(item.productName.slice(0, width - 10), qtyStr, width));
    if (item.specialInstructions) {
      lines.push(` * Note: ${item.specialInstructions}`);
    }
  }

  lines.push(divider(width, '-'));
  lines.push(formatLine('EST. TOTAL:', `INR ${order.finalAmount.toFixed(2)}`, width));
  lines.push(formatLine('PAYMENT:', 'UNPAID (Pay at Cashier)', width));
  lines.push(doubleDivider(width));
  lines.push('');
  lines.push(centerText('>> PLEASE TAKE A SEAT & RELAX <<', width));
  lines.push(centerText('WAIT FOR YOUR TOKEN NUMBER TO BE', width));
  lines.push(centerText('ANNOUNCED ON DISPLAY / SPEAKER', width));
  lines.push('');
  lines.push(centerText('* Hand 2nd slip (KOT) to Kitchen *', width));
  lines.push(centerText('* Keep this slip to claim order *', width));
  lines.push('');
  lines.push(centerText('Thank You! Visit Again.', width));
  lines.push(centerText(`[QR: ${order.tokenNumber}]`, width));
  lines.push('');

  const fullText = lines.filter(l => l !== undefined).join('\n');
  const escposHex = Buffer.from(fullText, 'utf-8').toString('hex');

  return { text: fullText, escposHex };
}

/**
 * Receipt 2: Detailed Kitchen Order Ticket (KOT / Preparation Ticket - 80mm or 58mm)
 * Kitchen receipt that customer will give to kitchen that includes all details of the order.
 */
export function generateKitchenTicketReceipt(
  order: Order,
  settings: ShopSettings,
  paperWidth: '58mm' | '80mm' = '80mm'
): { text: string; escposHex: string } {
  const width = paperWidth === '58mm' ? 32 : 48;
  const lines: string[] = [];

  lines.push(centerText('*** KITCHEN ORDER TICKET (KOT) ***', width));
  lines.push(centerText((settings.shopName || 'SHREE KRISHNA SWEETS').toUpperCase(), width));
  lines.push(doubleDivider(width));
  lines.push(centerText(`*** TOKEN: ${order.tokenNumber} ***`, width));
  lines.push(doubleDivider(width));
  lines.push(centerText('>> HAND OVER TO KITCHEN COUNTER <<', width));
  lines.push(centerText('(Customer copy to give to kitchen)', width));
  lines.push(divider(width, '-'));
  lines.push(formatLine(`Order ID: ${order.id.slice(0, 12)}`, `Counter: ${order.counterId}`, width));
  lines.push(formatLine(`Time: ${new Date(order.createdAt).toLocaleTimeString('en-IN')}`, `Date: ${order.businessDate}`, width));
  lines.push(divider(width, '-'));
  lines.push(formatLine('ITEM & SPECIFICATIONS', 'EXACT QTY', width));
  lines.push(divider(width, '-'));

  order.items.forEach((item, idx) => {
    const qtyStr = formatQuantity(item.quantity, item.unit);
    lines.push(formatLine(`[ ] ${idx + 1}. ${item.productName.toUpperCase()}`, qtyStr, width));
    if (item.hindiName) {
      lines.push(`       (${item.hindiName})`);
    }
    if (item.specialInstructions) {
      lines.push(`    >>> NOTE: ${item.specialInstructions.toUpperCase()}`);
    }
  });

  lines.push(divider(width, '-'));
  lines.push(formatLine('TOTAL ITEMS:', `${order.items.length} items`, width));
  if (order.notes) {
    lines.push(`KITCHEN NOTE: ${order.notes.toUpperCase()}`);
  }

  lines.push(doubleDivider(width));
  lines.push(centerText('>>> PREPARE FRESH & PACK WITH CARE <<<', width));
  lines.push('');

  const fullText = lines.join('\n');
  const escposHex = Buffer.from(fullText, 'utf-8').toString('hex');

  return { text: fullText, escposHex };
}

/**
 * Receipt 3: Final Tax Invoice (Cashier Terminal)
 */
export function generateInvoiceReceipt(
  invoice: Invoice,
  order: Order,
  settings: ShopSettings,
  paperWidth: '58mm' | '80mm' = '80mm'
): { text: string; escposHex: string } {
  const width = paperWidth === '58mm' ? 32 : 48;
  const lines: string[] = [];

  lines.push(centerText(settings.shopName.toUpperCase(), width));
  lines.push(centerText(settings.address, width));
  lines.push(centerText(`${settings.city}, ${settings.state} - ${settings.pincode}`, width));
  lines.push(centerText(`GSTIN: ${settings.gstin}`, width));
  if (settings.fssaiNumber) {
    lines.push(centerText(`FSSAI Lic: ${settings.fssaiNumber}`, width));
  }
  lines.push(centerText(`Ph: ${settings.phone}`, width));
  lines.push(doubleDivider(width));
  lines.push(centerText('TAX INVOICE', width));
  lines.push(doubleDivider(width));

  lines.push(formatLine(`Invoice: ${invoice.invoiceNumber}`, `Token: ${invoice.tokenNumber}`, width));
  lines.push(formatLine(`Date: ${invoice.businessDate}`, new Date(invoice.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), width));
  lines.push(formatLine(`Cashier: ${invoice.cashierName}`, `Payment: ${invoice.paymentMethod}`, width));
  if (invoice.paymentReference) {
    lines.push(formatLine(`Ref: ${invoice.paymentReference}`, '', width).trimEnd());
  }
  lines.push(divider(width, '-'));

  if (width === 48) {
    lines.push('ITEM NAME            QTY      RATE     AMOUNT');
    lines.push(divider(width, '-'));
    for (const item of invoice.items) {
      const name = item.productName.slice(0, 19).padEnd(20);
      const qty = formatQuantity(item.quantity, item.unit).slice(0, 8).padEnd(9);
      const rate = `₹${item.unitPrice}`.slice(0, 8).padEnd(9);
      const amt = `₹${item.totalPrice.toFixed(2)}`.padStart(10);
      lines.push(`${name}${qty}${rate}${amt}`);
    }
  } else {
    lines.push(formatLine('ITEM', 'QTY / AMT', width));
    lines.push(divider(width, '-'));
    for (const item of invoice.items) {
      lines.push(item.productName);
      const detail = `${formatQuantity(item.quantity, item.unit)} @ ₹${item.unitPrice}`;
      const amt = `₹${item.totalPrice.toFixed(2)}`;
      lines.push(formatLine(`  ${detail}`, amt, width));
    }
  }

  lines.push(divider(width, '-'));
  lines.push(formatLine('Subtotal (Taxable):', `₹${invoice.subtotal.toFixed(2)}`, width));
  if (invoice.discountAmount > 0) {
    lines.push(formatLine('Discount:', `-₹${invoice.discountAmount.toFixed(2)}`, width));
  }
  lines.push(formatLine(`CGST (${settings.taxConfig.cgstRate}%):`, `₹${invoice.cgstAmount.toFixed(2)}`, width));
  lines.push(formatLine(`SGST (${settings.taxConfig.sgstRate}%):`, `₹${invoice.sgstAmount.toFixed(2)}`, width));
  lines.push(doubleDivider(width));
  lines.push(formatLine('TOTAL AMOUNT PAID:', `₹${invoice.totalAmount.toFixed(2)}`, width));
  lines.push(doubleDivider(width));

  lines.push('');
  lines.push(centerText(settings.footerMessage || 'Thank you for your visit!', width));
  lines.push(centerText('Goods once sold cannot be returned.', width));
  lines.push(centerText('MithaiFlow POS System', width));
  lines.push('');

  const fullText = lines.join('\n');
  const escposHex = Buffer.from(fullText, 'utf-8').toString('hex');

  return { text: fullText, escposHex };
}
