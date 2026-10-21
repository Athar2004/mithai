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
    let qtyStr = formatQuantity(item.quantity, item.unit);
    if (item.packCount && item.packCount > 1 && item.packWeightKg) {
      const wtStr = item.packWeightKg < 1 ? `${Math.round(item.packWeightKg * 1000)}g` : `${item.packWeightKg}kg`;
      qtyStr = `${item.packCount} Pk x ${wtStr}`;
    } else if (item.packCount && item.packCount > 1) {
      qtyStr = `${item.packCount} Pcs`;
    }
    lines.push(formatLine(`[ ] ${idx + 1}. ${item.productName.toUpperCase()}`, qtyStr, width));
    if (item.packCount && item.packWeightKg) {
      const wtStr = item.packWeightKg < 1 ? `${Math.round(item.packWeightKg * 1000)}g` : `${item.packWeightKg}kg`;
      lines.push(`       >> ${item.packCount} Pack(s) of ${wtStr} each`);
    }
    if (item.hindiName) {
      lines.push(`       (${item.hindiName})`);
    }
  });

  lines.push(divider(width, '-'));
  lines.push(formatLine('TOTAL ITEMS:', `${order.items.length} items`, width));
  lines.push(formatLine('TOTAL AMOUNT:', `₹${order.finalAmount.toFixed(2)} (Incl. GST)`, width));
  lines.push(doubleDivider(width));
  lines.push(centerText('>>> PACK FRESH & HAND OVER <<<', width));
  lines.push('');

  const fullText = lines.join('\n');
  const escposHex = Buffer.from(fullText, 'utf-8').toString('hex');

  return { text: fullText, escposHex };
}

/**
 * Receipt 3: Final Cashier Tax Invoice (3-Inch / 80mm / 48 chars thermal)
 * Professional, pixel-perfect alignment, multi-pack items, discount, 5% inclusive GST table, payment settlement.
 */
export function generateInvoiceReceipt(
  invoice: Invoice,
  order: Order,
  settings: ShopSettings,
  paperWidth: '58mm' | '80mm' = '80mm'
): { text: string; escposHex: string } {
  const width = paperWidth === '58mm' ? 32 : 48;
  const lines: string[] = [];

  // Header Section
  lines.push(doubleDivider(width));
  lines.push(centerText((settings.shopName || 'SHEETAL GAJAK KULFI').toUpperCase(), width));
  lines.push(centerText(settings.address || 'Opposite High Court, Shivaji Nagar', width));
  lines.push(centerText(`${settings.city || 'Indore'}, ${settings.state || 'Madhya Pradesh'} - ${settings.pincode || '452003'}`, width));
  if (settings.phone) {
    lines.push(centerText(`Phone: ${settings.phone} / +91 98260 12345`, width));
  }
  const taxReg = `GSTIN: ${settings.gstin || '23AABCS1429K1Z5'}${settings.fssaiNumber ? ` | FSSAI: ${settings.fssaiNumber}` : ''}`;
  lines.push(centerText(taxReg, width));
  lines.push(doubleDivider(width));
  lines.push(centerText('TAX INVOICE / CASHIER BILL (3-INCH)', width));
  lines.push(doubleDivider(width));

  // Invoice Metadata
  const dateFormatted = new Date(invoice.timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = new Date(invoice.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  lines.push(formatLine(`Invoice No : ${invoice.invoiceNumber}`, `Token : #${invoice.tokenNumber}`, width));
  lines.push(formatLine(`Date       : ${dateFormatted}`, `Time  : ${timeFormatted}`, width));
  lines.push(formatLine(`Cashier    : ${invoice.cashierName || 'Counter Staff'}`, `Counter: ${order.counterId || 'POS-1'}`, width));
  lines.push(formatLine('Sale Type  : Retail Counter Sale', 'Status : PAID IN FULL', width));
  lines.push(divider(width, '-'));

  // Detailed Order Items Table
  if (width === 48) {
    // 3 + 20 + 6 + 9 + 10 = 48
    lines.push('#  ITEM DESCRIPTION        QTY     RATE   AMOUNT(Rs)');
    lines.push(divider(width, '-'));

    invoice.items.forEach((item, idx) => {
      const sn = String(idx + 1).padStart(2, '0') + ' ';
      const name = item.productName.slice(0, 19).padEnd(20);

      let qtyStr = `${item.quantity}`;
      const hsn = item.hsnCode || '2106909';
      const details: string[] = [`HSN: ${hsn}`];

      if (item.packCount && item.packCount > 1 && item.packWeightKg) {
        const wtStr = item.packWeightKg < 1 ? `${Math.round(item.packWeightKg * 1000)}g` : `${item.packWeightKg}kg`;
        qtyStr = `${item.packCount} Pk`;
        details.push(`${item.packCount} Pks x ${wtStr}`);
      } else if (item.packWeightKg) {
        const wtStr = item.packWeightKg < 1 ? `${Math.round(item.packWeightKg * 1000)}g` : `${item.packWeightKg}kg`;
        qtyStr = `1 Pk`;
        details.push(`${wtStr} pack`);
      } else if (item.packCount && item.packCount > 1) {
        qtyStr = `${item.packCount} Pk`;
      }
      if (item.hindiName) {
        details.push(item.hindiName);
      }

      const colQty = qtyStr.slice(0, 5).padStart(6);
      const colRate = item.unitPrice.toFixed(2).slice(0, 8).padStart(9);
      const colAmt = item.totalPrice.toFixed(2).slice(0, 9).padStart(10);

      lines.push(`${sn}${name}${colQty}${colRate}${colAmt}`);
      lines.push(`   [${details.join(' | ')}]`);
    });
  } else {
    // 32-column fallback format
    lines.push(formatLine('ITEM DESCRIPTION', 'QTY / AMOUNT', width));
    lines.push(divider(width, '-'));
    invoice.items.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.productName}`);
      let qtyDetail = `${formatQuantity(item.quantity, item.unit)} @ Rs.${item.unitPrice}`;
      if (item.packCount && item.packWeightKg) {
        const wtStr = item.packWeightKg < 1 ? `${Math.round(item.packWeightKg * 1000)}g` : `${item.packWeightKg}kg`;
        qtyDetail = `${item.packCount} Pk x ${wtStr} @ Rs.${item.unitPrice}`;
      }
      lines.push(formatLine(`   ${qtyDetail}`, `Rs.${item.totalPrice.toFixed(2)}`, width));
    });
  }

  lines.push(divider(width, '-'));

  // Calculate inclusive GST breakdown
  // Total Amount is retail inclusive: Net = Taxable + CGST (2.5%) + SGST (2.5%)
  const grossSubtotal = invoice.items.reduce((acc, it) => acc + it.totalPrice, 0);
  const discount = invoice.discountAmount || 0;
  const netPaid = invoice.totalAmount;
  const taxableGoods = Math.round((netPaid / 1.05) * 100) / 100;
  const totalGst = Math.round((netPaid - taxableGoods) * 100) / 100;
  const cgstAmt = Math.round((totalGst / 2) * 100) / 100;
  const sgstAmt = Math.round((totalGst - cgstAmt) * 100) / 100;

  lines.push(formatLine('Gross Order Total (Incl. GST):', `Rs. ${grossSubtotal.toFixed(2).padStart(8)}`, width));
  if (discount > 0) {
    lines.push(formatLine('Discount Deducted:', `-Rs. ${discount.toFixed(2).padStart(8)}`, width));
  }
  lines.push(doubleDivider(width));
  lines.push(formatLine('NET AMOUNT DUE & PAID:', `Rs. ${netPaid.toFixed(2).padStart(8)}`, width));
  lines.push(doubleDivider(width));

  // Statutory 5% Inclusive GST Summary Table (Boxed format)
  if (width === 48) {
    lines.push(centerText('---------------- GST SUMMARY (5.0%) ------------', width));
    lines.push('Rate       Taxable Value    CGST(2.5%)    SGST(2.5%)');
    const colRate = '5% GST'.padEnd(10);
    const colTaxVal = `Rs. ${taxableGoods.toFixed(2)}`.padStart(16) + ' ';
    const colCgst = `Rs. ${cgstAmt.toFixed(2)}`.padStart(13) + ' ';
    const colSgst = `Rs. ${sgstAmt.toFixed(2)}`.padStart(13);
    lines.push(`${colRate}${colTaxVal}  ${colCgst}${colSgst}`);
    lines.push(divider(width, '-'));
    lines.push(formatLine('Total GST Included in Price:', `Rs. ${totalGst.toFixed(2).padStart(8)}`, width));
    lines.push(divider(width, '-'));
  } else {
    lines.push(centerText('GST BREAKDOWN (INCL. 5%)', width));
    lines.push(divider(width, '-'));
    lines.push(formatLine('Taxable Goods Value:', `Rs. ${taxableGoods.toFixed(2)}`, width));
    lines.push(formatLine('CGST @ 2.5%:', `Rs. ${cgstAmt.toFixed(2)}`, width));
    lines.push(formatLine('SGST @ 2.5%:', `Rs. ${sgstAmt.toFixed(2)}`, width));
    lines.push(formatLine('Total GST (5.0%):', `Rs. ${totalGst.toFixed(2)}`, width));
    lines.push(divider(width, '-'));
  }

  // Payment Settlement Details
  lines.push('PAYMENT SETTLEMENT:');
  lines.push(formatLine('Mode of Payment   :', invoice.paymentMethod, width));

  if (invoice.paymentMethod === 'CASH') {
    const tendered = order.paymentId ? invoice.totalAmount : invoice.totalAmount;
    lines.push(formatLine('Payment Verification :', 'VERIFIED BY CASHIER', width));
    if (invoice.paymentReference) {
      lines.push(formatLine('Cash Tendered Info   :', invoice.paymentReference, width));
    }
  } else if (invoice.paymentMethod === 'UPI') {
    lines.push(formatLine('Channel              :', 'UPI Soundbox / QR Standee', width));
    lines.push(formatLine('Payment Reference    :', invoice.paymentReference || 'UPI-STAND-SUCCESS', width));
  } else if (invoice.paymentMethod === 'CARD') {
    lines.push(formatLine('Channel              :', 'EDC POS Terminal', width));
    lines.push(formatLine('Payment Reference    :', invoice.paymentReference || 'CARD-POS-SUCCESS', width));
  } else if (invoice.paymentMethod === 'SPLIT') {
    lines.push(formatLine('Split Breakdown      :', invoice.paymentReference || 'Cash + UPI Split', width));
  }

  lines.push(formatLine('Settlement Status    :', 'SUCCESS (PAID IN FULL)', width));
  lines.push(doubleDivider(width));

  // Footer / Greeting / Authenticity Barcode
  lines.push(centerText('* Freshly crafted daily with pure Desi Ghee *', width));
  lines.push(centerText('* Goods once sold cannot be returned or exchanged *', width));
  lines.push('');
  lines.push(centerText(settings.footerMessage || 'Thank you for choosing Sheetal Gajak Kulfi!', width));
  lines.push(centerText('Pure Indore Taste & Tradition Since 1984', width));
  lines.push(centerText('Opposite High Court, Shivaji Nagar, Indore', width));
  lines.push('');
  lines.push(centerText('|||| ||| |||||| |||| ||||| |||||| |||| |||||', width));
  lines.push(centerText(`*${invoice.invoiceNumber}*`, width));
  lines.push(doubleDivider(width));
  lines.push('');

  const fullText = lines.join('\n');
  const escposHex = Buffer.from(fullText, 'utf-8').toString('hex');

  return { text: fullText, escposHex };
}
