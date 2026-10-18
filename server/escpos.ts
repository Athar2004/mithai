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
 * Receipt 1: Customer Waiting Token Slip (2-Inch / 50.8mm / 58mm paper)
 * Very short customer slip: mentions token number only, NO item details.
 */
export function generateCustomerTokenReceipt(
  order: Order,
  settings: ShopSettings,
  paperWidth: '58mm' | '80mm' = '58mm'
): { text: string; escposHex: string } {
  // 2-inch printable format (50.8mm = 32 character columns)
  const width = paperWidth === '80mm' ? 48 : 32;
  const lines: string[] = [];

  const shop = (settings.shopName || 'SHEETAL GAJAK KULFI').toUpperCase();
  lines.push(centerText(shop, width));
  lines.push(centerText('Opp. High Court, Shivaji Nagar', width));
  lines.push(centerText('Indore, MP - 452003', width));
  if (settings.phone) lines.push(centerText(`Ph: ${settings.phone}`, width));
  lines.push(doubleDivider(width));
  lines.push(centerText('CUSTOMER WAITING SLIP', width));
  lines.push(centerText('(Keep slip until token call)', width));
  lines.push(divider(width, '-'));
  lines.push('');
  lines.push(centerText('*** TOKEN NUMBER ***', width));
  lines.push(centerText(`>>> ${order.tokenNumber} <<<`, width));
  lines.push('');
  lines.push(divider(width, '-'));
  lines.push(formatLine('Order No:', order.id.slice(0, 10), width));
  lines.push(formatLine('Date:', order.businessDate, width));
  lines.push(formatLine('Time:', new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), width));
  lines.push(formatLine('Counter:', `${order.counterId} (${order.createdByName || 'POS'})`, width));
  lines.push(doubleDivider(width));
  lines.push(centerText('>> PLEASE WAIT FOR TOKEN CALL <<', width));
  lines.push(centerText('Show this token at billing counter', width));
  lines.push(centerText('Thank You! Visit Again.', width));
  lines.push('');

  const fullText = lines.filter(l => l !== undefined).join('\n');
  const escposHex = Buffer.from(fullText, 'utf-8').toString('hex');

  return { text: fullText, escposHex };
}

/**
 * Receipt 2: Order POS Slip / Counter Dispatch Ticket (2-Inch / 50.8mm / 58mm paper)
 * Itemized slip for counter staff to pack and prepare order items.
 */
export function generateKitchenTicketReceipt(
  order: Order,
  settings: ShopSettings,
  paperWidth: '58mm' | '80mm' = '58mm'
): { text: string; escposHex: string } {
  // 2-inch printable format (50.8mm = 32 characters)
  const width = paperWidth === '80mm' ? 48 : 32;
  const lines: string[] = [];

  lines.push(centerText('*** ORDER POS SLIP (2-INCH) ***', width));
  lines.push(centerText((settings.shopName || 'SHEETAL GAJAK KULFI').toUpperCase(), width));
  lines.push(centerText('Opp. High Court, Shivaji Nagar, Indore', width));
  lines.push(doubleDivider(width));
  lines.push(centerText(`*** TOKEN: ${order.tokenNumber} ***`, width));
  lines.push(doubleDivider(width));
  lines.push(formatLine(`Order: ${order.id.slice(0, 10)}`, `Counter: ${order.counterId}`, width));
  lines.push(formatLine(`Time: ${new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, `Date: ${order.businessDate}`, width));
  lines.push(divider(width, '-'));
  lines.push(formatLine('ITEM & PACKING', 'QTY', width));
  lines.push(divider(width, '-'));

  order.items.forEach((item, idx) => {
    const qtyStr = formatQuantity(item.quantity, item.unit);
    lines.push(formatLine(`[ ] ${idx + 1}. ${item.productName.toUpperCase()}`, qtyStr, width));
    if (item.hindiName) {
      lines.push(`       (${item.hindiName})`);
    }
  });

  lines.push(divider(width, '-'));
  lines.push(formatLine('TOTAL ITEMS:', `${order.items.length} items`, width));
  lines.push(formatLine('EST. TOTAL:', `INR ${order.finalAmount.toFixed(2)}`, width));
  lines.push(doubleDivider(width));
  lines.push(centerText('>>> PACK FRESH & HAND OVER <<<', width));
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
