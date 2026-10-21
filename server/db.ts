import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  Category,
  Product,
  Order,
  Payment,
  Invoice,
  PrintJob,
  PrinterConfig,
  ShopSettings,
  AuditLog,
  User,
  OrderStatus,
  PaymentStatus,
  DashboardMetrics,
} from '../src/types/index.ts';
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_PRINTERS,
  DEMO_SETTINGS,
  DEMO_USERS,
  generateDemoOrders,
} from '../src/demo/demoData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  orders: Order[];
  payments: Payment[];
  invoices: Invoice[];
  printJobs: PrintJob[];
  printers: PrinterConfig[];
  settings: ShopSettings;
  auditLogs: AuditLog[];
  users: User[];
  counters: {
    lastTokenNumber: number;
    lastTokenDate: string;
    lastInvoiceNumber: number;
  };
}

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_pos',
    name: 'Order POS Staff',
    email: 'pos@gmail.com',
    password: 'pos@123',
    role: 'order_pos',
    pin: '1234',
  },
  {
    id: 'usr_cashier',
    name: 'Cashier & Biller',
    email: 'cashier@gmail.com',
    password: 'cashier@123',
    role: 'cashier',
    pin: '4321',
  },
  {
    id: 'usr_admin',
    name: 'Admin Manager',
    email: 'admin@gmail.com',
    password: 'admin@123',
    role: 'admin',
    pin: '9999',
  },
];


const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Sheetal Gajak Kulfi',
  tagline: 'Famous Indore Gajak, Rabdi Kulfi & Traditional Sweets',
  address: 'Opposite High Court, Shivaji Nagar',
  city: 'Indore',
  state: 'Madhya Pradesh',
  pincode: '452003',
  phone: '+91 98260 54321',
  gstin: '23AAAAA0000A1Z5',
  fssaiNumber: '11418850000342',
  tokenPrefix: 'T-',
  businessDayCutoffHour: 4,
  kitchenDelayThresholdMinutes: 10,
  currencySymbol: '₹',
  taxConfig: {
    cgstRate: 2.5,
    sgstRate: 2.5,
  },
  footerMessage: 'Thank you for choosing Sheetal Gajak Kulfi! Visit Again.',
};

const DEFAULT_CATEGORIES: Category[] = DEMO_CATEGORIES;

const DEFAULT_PRODUCTS: Product[] = DEMO_PRODUCTS;

const DEFAULT_PRINTERS: PrinterConfig[] = [
  {
    id: 'prn_customer_token',
    name: 'Customer Waiting Token Printer (2-Inch / 50.8mm)',
    targetRole: 'CUSTOMER_TOKEN',
    paperWidth: '58mm',
    interfaceType: 'SIMULATOR',
    isConnected: true,
    autoPrint: true,
  },
  {
    id: 'prn_kitchen_kds',
    name: 'Order POS Dispatch Slip Printer (2-Inch / 50.8mm)',
    targetRole: 'KITCHEN_TICKET',
    paperWidth: '58mm',
    interfaceType: 'SIMULATOR',
    isConnected: true,
    autoPrint: true,
  },
  {
    id: 'prn_billing_invoice',
    name: 'Billing Cashier Invoice Printer (80mm)',
    targetRole: 'BILLING_INVOICE',
    paperWidth: '80mm',
    interfaceType: 'SIMULATOR',
    isConnected: true,
    autoPrint: true,
  },
];

export class Database {
  private data: DatabaseSchema;
  private subscribers: Set<(event: { type: string; payload: unknown }) => void> = new Set();

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private getBusinessDate(date: Date = new Date()): string {
    const d = new Date(date);
    // If current hour is before cutoff hour (e.g. 4am), it counts as previous business day
    if (d.getHours() < (this.data?.settings?.businessDayCutoffHour ?? 4)) {
      d.setDate(d.getDate() - 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure categories & products always have latest Sheetal Gajak catalog
        parsed.categories = DEFAULT_CATEGORIES;
        parsed.products = DEFAULT_PRODUCTS;
        return parsed;
      } catch (err) {
        console.error('Failed to parse database.json, initializing defaults:', err);
      }
    }

    const todayDate = this.getBusinessDate();
    const initial: DatabaseSchema = {
      categories: DEFAULT_CATEGORIES,
      products: DEFAULT_PRODUCTS,
      orders: [],
      payments: [],
      invoices: [],
      printJobs: [],
      printers: DEFAULT_PRINTERS,
      settings: DEFAULT_SETTINGS,
      auditLogs: [
        {
          id: `aud_${Date.now()}_init`,
          timestamp: new Date().toISOString(),
          userId: 'usr_admin',
          userName: 'System Init',
          action: 'SYSTEM_BOOTSTRAP',
          entityType: 'SETTINGS',
          entityId: 'system',
          details: 'MithaiFlow initialized with default sweet shop catalog and thermal printers',
        },
      ],
      users: DEFAULT_USERS,
      counters: {
        lastTokenNumber: 0,
        lastTokenDate: todayDate,
        lastInvoiceNumber: 100,
      },
    };

    this.saveDatabaseImmediate(initial);
    return initial;
  }

  private saveDatabaseImmediate(data: DatabaseSchema) {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  public save() {
    this.saveDatabaseImmediate(this.data);
  }

  public subscribe(fn: (event: { type: string; payload: unknown }) => void) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  public broadcast(type: string, payload: unknown) {
    for (const sub of this.subscribers) {
      try {
        sub({ type, payload });
      } catch (err) {
        console.error('Error broadcasting event:', err);
      }
    }
  }

  public logAudit(userId: string, userName: string, action: string, entityType: AuditLog['entityType'], entityId: string, details: string) {
    const entry: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
    };
    this.data.auditLogs.unshift(entry);
    // Keep max 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs.pop();
    }
    this.broadcast('AUDIT_LOG_ADDED', entry);
    this.save();
    return entry;
  }

  /**
   * Atomic sequence generation for daily Token (e.g. T-001)
   */
  public generateNextToken(): { tokenNumber: string; businessDate: string } {
    const today = this.getBusinessDate();
    if (this.data.counters.lastTokenDate !== today) {
      this.data.counters.lastTokenDate = today;
      this.data.counters.lastTokenNumber = 0;
    }
    this.data.counters.lastTokenNumber += 1;
    const prefix = this.data.settings.tokenPrefix || 'T-';
    const numStr = String(this.data.counters.lastTokenNumber).padStart(3, '0');
    const token = `${prefix}${numStr}`;
    this.save();
    return { tokenNumber: token, businessDate: today };
  }

  public generateNextInvoiceNumber(): string {
    this.data.counters.lastInvoiceNumber += 1;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const seq = String(this.data.counters.lastInvoiceNumber).padStart(4, '0');
    this.save();
    return `INV-${dateStr}-${seq}`;
  }

  // --- Products & Categories ---
  public getCategories(): Category[] {
    return this.data.categories;
  }

  public getProducts(): Product[] {
    return this.data.products;
  }

  public saveProduct(product: Partial<Product> & { name: string; pricePerUnit: number; unit: Product['unit'] }): Product {
    if (product.id) {
      const idx = this.data.products.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        this.data.products[idx] = { ...this.data.products[idx], ...product };
        this.save();
        this.broadcast('PRODUCT_UPDATED', this.data.products[idx]);
        return this.data.products[idx];
      }
    }
    const newProd: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sku: product.sku || `SKU-${Date.now().toString().slice(-4)}`,
      name: product.name,
      hindiName: product.hindiName,
      categoryId: product.categoryId || 'traditional',
      unit: product.unit,
      pricePerUnit: Number(product.pricePerUnit),
      taxRatePercent: product.taxRatePercent ?? 5,
      isActive: product.isActive ?? true,
      requiresKitchen: product.requiresKitchen ?? false,
      imageUrl: product.imageUrl,
      description: product.description,
      popularItem: product.popularItem ?? false,
      standardWeights: product.unit === 'kg' ? [0.1, 0.25, 0.5, 1.0] : undefined,
      standardCounts: product.unit === 'piece' ? [1, 2, 4, 8, 12] : undefined,
    };
    this.data.products.push(newProd);
    this.save();
    this.broadcast('PRODUCT_CREATED', newProd);
    return newProd;
  }

  // --- Orders ---
  public getOrders(filters?: { status?: OrderStatus; paymentStatus?: PaymentStatus; date?: string }): Order[] {
    return this.data.orders.filter(order => {
      if (filters?.status && order.status !== filters.status) return false;
      if (filters?.paymentStatus && order.paymentStatus !== filters.paymentStatus) return false;
      if (filters?.date && order.businessDate !== filters.date) return false;
      return true;
    });
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id || o.tokenNumber.toLowerCase() === id.toLowerCase());
  }

  public createOrder(orderData: {
    items: Array<{
      productId: string;
      quantity: number;
      packWeightKg?: number;
      packCount?: number;
      specialInstructions?: string;
    }>;
    notes?: string;
    userId: string;
    userName: string;
    counterId?: string;
  }): Order {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const { tokenNumber, businessDate } = this.generateNextToken();
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    let subtotal = 0;
    let hasKitchenItems = false;

    const validatedItems = orderData.items.map((raw, idx) => {
      const prod = this.data.products.find(p => p.id === raw.productId);
      if (!prod) throw new Error(`Product not found: ${raw.productId}`);
      if (!prod.isActive) throw new Error(`Product is not active: ${prod.name}`);
      if (raw.quantity <= 0) throw new Error(`Quantity must be positive for ${prod.name}`);

      const packCount = raw.packCount && raw.packCount > 0 ? Number(raw.packCount) : 1;
      const packWeightKg = raw.packWeightKg ? Number(raw.packWeightKg) : undefined;
      const qty = packWeightKg ? Math.round(packWeightKg * packCount * 1000) / 1000 : Number(raw.quantity);

      // All items are inclusive of GST in POS
      const lineTotal = packWeightKg
        ? Math.round(packCount * (packWeightKg * prod.pricePerUnit) * 100) / 100
        : Math.round(qty * prod.pricePerUnit * 100) / 100;

      subtotal += lineTotal;

      if (prod.requiresKitchen) {
        hasKitchenItems = true;
      }

      return {
        id: `item_${orderId}_${idx + 1}`,
        productId: prod.id,
        productName: prod.name,
        hindiName: prod.hindiName,
        unit: prod.unit,
        hsnCode: prod.hsnCode || '2106909',
        packWeightKg,
        packCount,
        quantity: qty,
        unitPrice: prod.pricePerUnit,
        taxRatePercent: prod.taxRatePercent || 5,
        taxAmount: 0, // GST calculated exclusively on cashier bill
        discountAmount: 0,
        totalPrice: lineTotal,
        specialInstructions: raw.specialInstructions?.trim() || undefined,
      };
    });

    const finalAmount = Math.round(subtotal * 100) / 100;

    const newOrder: Order = {
      id: orderId,
      tokenNumber,
      businessDate,
      counterId: orderData.counterId || 'POS-1',
      createdByUserId: orderData.userId,
      createdByName: orderData.userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'RECEIVED',
      statusHistory: [
        {
          status: 'RECEIVED',
          updatedBy: orderData.userName,
          timestamp: new Date().toISOString(),
          note: 'Order taken at POS',
        },
      ],
      items: validatedItems,
      subtotal: finalAmount,
      totalTax: 0, // Inclusive GST, broken down on cashier bill
      totalDiscount: 0,
      finalAmount,
      paymentStatus: 'UNPAID',
      notes: orderData.notes,
      isKitchenRequired: hasKitchenItems,
    };

    this.data.orders.unshift(newOrder);
    this.save();

    this.logAudit(
      orderData.userId,
      orderData.userName,
      'ORDER_CREATED',
      'ORDER',
      newOrder.id,
      `Token ${tokenNumber} created with ${validatedItems.length} items. Amount: ₹${finalAmount}`
    );

    this.broadcast('ORDER_CREATED', newOrder);
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus, updatedBy: string, note?: string): Order {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status,
      updatedBy,
      timestamp: new Date().toISOString(),
      note,
    });

    if (status === 'READY') {
      order.preparedAt = new Date().toISOString();
    } else if (status === 'COMPLETED') {
      order.completedAt = new Date().toISOString();
    }

    this.save();
    this.logAudit(
      'user',
      updatedBy,
      'STATUS_UPDATED',
      'ORDER',
      order.id,
      `Order ${order.tokenNumber} status changed from ${previousStatus} to ${status}`
    );

    this.broadcast('ORDER_STATUS_UPDATED', order);
    return order;
  }

  // --- Payments & Invoices ---
  public processPayment(params: {
    orderId: string;
    amount: number;
    method: Payment['method'];
    splits?: Payment['splits'];
    cashierId: string;
    cashierName: string;
    tenderedAmount?: number;
    transactionReference?: string;
    discountAmount?: number;
  }): { payment: Payment; invoice: Invoice; order: Order } {
    const order = this.data.orders.find(o => o.id === params.orderId);
    if (!order) throw new Error('Order not found');
    if (order.paymentStatus === 'PAID') {
      throw new Error('Order has already been paid');
    }
    if (order.status === 'CANCELLED') {
      throw new Error('Cannot pay for a cancelled order');
    }

    const discountAmount = params.discountAmount && params.discountAmount > 0
      ? Math.round(Number(params.discountAmount) * 100) / 100
      : 0;

    const netPayable = Math.max(0, Math.round((order.subtotal - discountAmount) * 100) / 100);

    if (params.amount < netPayable) {
      throw new Error(`Payment amount (₹${params.amount}) is less than net payable (₹${netPayable})`);
    }

    let change = 0;
    if (params.method === 'CASH' && params.tenderedAmount && params.tenderedAmount > params.amount) {
      change = Math.round((params.tenderedAmount - params.amount) * 100) / 100;
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const payment: Payment = {
      id: paymentId,
      orderId: order.id,
      tokenNumber: order.tokenNumber,
      amount: params.amount,
      method: params.method,
      splits: params.splits,
      status: 'SUCCESS',
      cashierId: params.cashierId,
      cashierName: params.cashierName,
      timestamp: new Date().toISOString(),
      tenderedAmount: params.tenderedAmount,
      changeReturned: change,
      transactionReference: params.transactionReference,
    };
    this.data.payments.unshift(payment);

    // Generate Invoice with 5% Inclusive GST Breakdown:
    // Taxable Goods = Net Payable / 1.05
    // Total Tax = Net Payable - Taxable Goods
    // CGST = Total Tax / 2, SGST = Total Tax / 2
    const invoiceNumber = this.generateNextInvoiceNumber();
    const taxableGoods = Math.round((netPayable / 1.05) * 100) / 100;
    const totalGst = Math.round((netPayable - taxableGoods) * 100) / 100;
    const cgstAmt = Math.round((totalGst / 2) * 100) / 100;
    const sgstAmt = Math.round((totalGst - cgstAmt) * 100) / 100;

    const invoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      invoiceNumber,
      orderId: order.id,
      tokenNumber: order.tokenNumber,
      businessDate: order.businessDate,
      timestamp: new Date().toISOString(),
      items: order.items,
      subtotal: taxableGoods,
      cgstAmount: cgstAmt,
      sgstAmount: sgstAmt,
      totalTax: totalGst,
      discountAmount,
      totalAmount: netPayable,
      paymentMethod: params.method,
      paymentReference: params.transactionReference,
      cashierName: params.cashierName,
    };
    this.data.invoices.unshift(invoice);

    // Update order
    order.totalDiscount = discountAmount;
    order.finalAmount = netPayable;
    order.paymentStatus = 'PAID';
    order.paymentId = payment.id;
    order.invoiceId = invoice.id;
    order.updatedAt = new Date().toISOString();
    if (order.status === 'READY') {
      order.status = 'COMPLETED';
      order.completedAt = new Date().toISOString();
    }

    this.save();

    this.logAudit(
      params.cashierId,
      params.cashierName,
      'PAYMENT_COLLECTED',
      'PAYMENT',
      payment.id,
      `Payment of ₹${params.amount} via ${params.method} for Token ${order.tokenNumber}. Invoice #${invoiceNumber}`
    );

    this.broadcast('PAYMENT_PROCESSED', { payment, invoice, order });
    return { payment, invoice, order };
  }

  // --- Refunds & Cancellations ---
  public cancelOrRefundOrder(orderId: string, userId: string, userName: string, reason: string): Order {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const prevStatus = order.status;
    const prevPay = order.paymentStatus;

    order.status = 'CANCELLED';
    if (order.paymentStatus === 'PAID') {
      order.paymentStatus = 'REFUNDED';
    }
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status: 'CANCELLED',
      updatedBy: userName,
      timestamp: new Date().toISOString(),
      note: `Cancelled/Refunded: ${reason}`,
    });

    this.save();

    this.logAudit(
      userId,
      userName,
      'ORDER_CANCELLED',
      'ORDER',
      order.id,
      `Order ${order.tokenNumber} cancelled/refunded. PrevStatus: ${prevStatus}, PrevPay: ${prevPay}. Reason: ${reason}`
    );

    this.broadcast('ORDER_CANCELLED', order);
    return order;
  }

  // --- Print Jobs ---
  public getPrintJobs(limit: number = 50): PrintJob[] {
    return this.data.printJobs.slice(0, limit);
  }

  public getPrinters(): PrinterConfig[] {
    return this.data.printers;
  }

  public updatePrinter(id: string, updates: Partial<PrinterConfig>): PrinterConfig {
    const p = this.data.printers.find(pr => pr.id === id);
    if (!p) throw new Error('Printer not found');
    Object.assign(p, updates);
    this.save();
    this.broadcast('PRINTER_UPDATED', p);
    return p;
  }

  public enqueuePrintJob(job: {
    jobType: PrintJob['jobType'];
    orderId: string;
    tokenNumber: string;
    printerRole: PrinterConfig['targetRole'];
    payload: string;
    rawEscPosHex?: string;
  }): PrintJob {
    const printer = this.data.printers.find(p => p.targetRole === job.printerRole) || this.data.printers[0];
    const newJob: PrintJob = {
      id: `PJ-${Date.now().toString().slice(-6)}`,
      jobType: job.jobType,
      orderId: job.orderId,
      tokenNumber: job.tokenNumber,
      printerId: printer.id,
      printerName: printer.name,
      paperWidth: printer.paperWidth,
      status: printer.isConnected ? 'PRINTED' : 'FAILED',
      createdAt: new Date().toISOString(),
      printedAt: printer.isConnected ? new Date().toISOString() : undefined,
      retryCount: 0,
      reprintCount: 0,
      payload: job.payload,
      rawEscPosHex: job.rawEscPosHex,
      lastError: printer.isConnected ? undefined : 'Printer is offline or disconnected',
    };

    this.data.printJobs.unshift(newJob);
    if (this.data.printJobs.length > 200) {
      this.data.printJobs.pop();
    }
    this.save();
    this.broadcast('PRINT_JOB_CREATED', newJob);
    return newJob;
  }

  public retryPrintJob(jobId: string): PrintJob {
    const job = this.data.printJobs.find(j => j.id === jobId);
    if (!job) throw new Error('Print job not found');

    const printer = this.data.printers.find(p => p.id === job.printerId);
    job.retryCount += 1;
    if (printer?.isConnected) {
      job.status = 'PRINTED';
      job.printedAt = new Date().toISOString();
      job.lastError = undefined;
    } else {
      job.status = 'FAILED';
      job.lastError = 'Printer still unavailable on retry';
    }
    this.save();
    this.broadcast('PRINT_JOB_UPDATED', job);
    return job;
  }

  public logReprint(jobId: string, requestedBy: string): PrintJob {
    const job = this.data.printJobs.find(j => j.id === jobId);
    if (!job) throw new Error('Print job not found');
    job.reprintCount += 1;
    job.printedAt = new Date().toISOString();
    job.status = 'PRINTED';
    this.save();

    this.logAudit(
      'user',
      requestedBy,
      'REPRINT_REQUESTED',
      'PRINTER',
      job.id,
      `Reprinted ${job.jobType} for Token ${job.tokenNumber} (Count: ${job.reprintCount})`
    );

    this.broadcast('PRINT_JOB_UPDATED', job);
    return job;
  }

  // --- Settings ---
  public getSettings(): ShopSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<ShopSettings>, updatedBy: string): ShopSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    this.logAudit('user', updatedBy, 'SETTINGS_UPDATED', 'SETTINGS', 'global', 'Shop settings updated');
    this.broadcast('SETTINGS_UPDATED', this.data.settings);
    return this.data.settings;
  }

  public getAuditLogs(limit: number = 100): AuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  // --- Analytics & KPIs ---
  public getAnalytics(dateFilter?: string): DashboardMetrics {
    const today = dateFilter || this.getBusinessDate();
    const todayOrders = this.data.orders.filter(o => o.businessDate === today);

    const ordersToday = todayOrders.length;
    const unpaidOrders = todayOrders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED').length;
    const preparingOrders = todayOrders.filter(o => o.status === 'PREPARING').length;
    const readyOrders = todayOrders.filter(o => o.status === 'READY').length;
    const paidOrders = todayOrders.filter(o => o.paymentStatus === 'PAID').length;
    const cancelledOrders = todayOrders.filter(o => o.status === 'CANCELLED').length;

    // Paid Sales strictly excludes unpaid and cancelled
    const totalSalesToday = todayOrders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    const unpaidSalesToday = todayOrders
      .filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    // Calculate Average Preparation and Waiting Time
    let totalPrepMinutes = 0;
    let prepCount = 0;
    let totalWaitMinutes = 0;
    let waitCount = 0;

    for (const o of todayOrders) {
      const created = new Date(o.createdAt).getTime();
      if (o.preparedAt) {
        const prep = new Date(o.preparedAt).getTime();
        totalPrepMinutes += Math.max(1, (prep - created) / (1000 * 60));
        prepCount += 1;
      }
      if (o.completedAt) {
        const comp = new Date(o.completedAt).getTime();
        totalWaitMinutes += Math.max(1, (comp - created) / (1000 * 60));
        waitCount += 1;
      }
    }

    const avgPreparationTimeMinutes = prepCount > 0 ? Math.round((totalPrepMinutes / prepCount) * 10) / 10 : 6.5;
    const avgWaitTimeMinutes = waitCount > 0 ? Math.round((totalWaitMinutes / waitCount) * 10) / 10 : 8.2;

    // Hourly Sales distribution
    const hourlyMap: Record<string, { sales: number; orders: number }> = {};
    for (let h = 8; h <= 22; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      hourlyMap[label] = { sales: 0, orders: 0 };
    }

    for (const o of todayOrders) {
      if (o.paymentStatus === 'PAID') {
        const hour = new Date(o.createdAt).getHours();
        const label = `${hour.toString().padStart(2, '0')}:00`;
        if (hourlyMap[label]) {
          hourlyMap[label].sales += o.finalAmount;
          hourlyMap[label].orders += 1;
        }
      }
    }

    const hourlySales = Object.entries(hourlyMap).map(([hour, val]) => ({
      hour,
      sales: Math.round(val.sales),
      orders: val.orders,
    }));

    // Payment method breakdown
    const todayPayments = this.data.payments.filter(p => {
      const order = this.data.orders.find(o => o.id === p.orderId);
      return order && order.businessDate === today && p.status === 'SUCCESS';
    });

    const paymentMap: Record<string, { amount: number; count: number }> = {
      CASH: { amount: 0, count: 0 },
      UPI: { amount: 0, count: 0 },
      CARD: { amount: 0, count: 0 },
      SPLIT: { amount: 0, count: 0 },
    };

    for (const p of todayPayments) {
      if (paymentMap[p.method]) {
        paymentMap[p.method].amount += p.amount;
        paymentMap[p.method].count += 1;
      }
    }

    const paymentBreakdown = Object.entries(paymentMap).map(([method, val]) => ({
      method,
      amount: Math.round(val.amount),
      count: val.count,
    }));

    // Top products
    const productStats: Record<string, { name: string; quantity: number; revenue: number; unit: Product['unit'] }> = {};
    for (const o of todayOrders) {
      if (o.paymentStatus === 'PAID') {
        for (const item of o.items) {
          if (!productStats[item.productId]) {
            productStats[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0,
              unit: item.unit,
            };
          }
          productStats[item.productId].quantity += item.quantity;
          productStats[item.productId].revenue += item.totalPrice;
        }
      }
    }

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => {
        let qtyFormatted = `${p.quantity}`;
        if (p.unit === 'kg') {
          qtyFormatted = p.quantity >= 1 ? `${p.quantity.toFixed(1)} kg` : `${Math.round(p.quantity * 1000)} g`;
        } else if (p.unit === 'piece') {
          qtyFormatted = `${p.quantity} pcs`;
        }
        return {
          name: p.name,
          quantityFormatted: qtyFormatted,
          revenue: Math.round(p.revenue),
          unit: p.unit,
        };
      });

    // Category Performance
    const categoryStats: Record<string, { revenue: number; count: number }> = {};
    for (const cat of this.data.categories) {
      categoryStats[cat.name] = { revenue: 0, count: 0 };
    }

    for (const o of todayOrders) {
      if (o.paymentStatus === 'PAID') {
        for (const item of o.items) {
          const prod = this.data.products.find(p => p.id === item.productId);
          const cat = this.data.categories.find(c => c.id === prod?.categoryId);
          const catName = cat ? cat.name : 'Other';
          if (!categoryStats[catName]) {
            categoryStats[catName] = { revenue: 0, count: 0 };
          }
          categoryStats[catName].revenue += item.totalPrice;
          categoryStats[catName].count += 1;
        }
      }
    }

    const categoryPerformance = Object.entries(categoryStats)
      .map(([category, val]) => ({
        category,
        revenue: Math.round(val.revenue),
        count: val.count,
      }))
      .filter(c => c.count > 0 || c.revenue > 0);

    return {
      ordersToday,
      unpaidOrders,
      preparingOrders,
      readyOrders,
      paidOrders,
      cancelledOrders,
      totalSalesToday: Math.round(totalSalesToday),
      unpaidSalesToday: Math.round(unpaidSalesToday),
      avgPreparationTimeMinutes,
      avgWaitTimeMinutes,
      hourlySales,
      paymentBreakdown,
      topProducts,
      categoryPerformance,
    };
  }

  // --- Date-Wise Day-End Sales Report (Net / Cash / UPI / Card / GST) ---
  public getDayEndSalesReport(filterDate?: string) {
    const dateMap: Record<string, {
      totalBills: number;
      netAmount: number;
      grossAmount: number;
      discountAmount: number;
      cashAmount: number;
      upiAmount: number;
      cardAmount: number;
    }> = {};

    for (const order of this.data.orders) {
      if (order.paymentStatus === 'PAID') {
        const d = order.businessDate || order.createdAt.slice(0, 10);
        if (filterDate && d !== filterDate) continue;

        if (!dateMap[d]) {
          dateMap[d] = {
            totalBills: 0,
            netAmount: 0,
            grossAmount: 0,
            discountAmount: 0,
            cashAmount: 0,
            upiAmount: 0,
            cardAmount: 0,
          };
        }

        dateMap[d].totalBills += 1;
        dateMap[d].netAmount += order.finalAmount;
        dateMap[d].grossAmount += order.subtotal;
        dateMap[d].discountAmount += (order.totalDiscount || 0);

        const payment = this.data.payments.find(p => p.orderId === order.id && p.status === 'SUCCESS');
        if (payment) {
          if (payment.method === 'CASH') {
            dateMap[d].cashAmount += payment.amount;
          } else if (payment.method === 'UPI') {
            dateMap[d].upiAmount += payment.amount;
          } else if (payment.method === 'CARD') {
            dateMap[d].cardAmount += payment.amount;
          } else if (payment.method === 'SPLIT' && payment.splits) {
            for (const sp of payment.splits) {
              if (sp.method === 'CASH') dateMap[d].cashAmount += sp.amount;
              else if (sp.method === 'UPI') dateMap[d].upiAmount += sp.amount;
              else if (sp.method === 'CARD') dateMap[d].cardAmount += sp.amount;
            }
          }
        } else {
          dateMap[d].cashAmount += order.finalAmount;
        }
      }
    }

    const summaries = Object.entries(dateMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, val]) => {
        const net = Math.round(val.netAmount * 100) / 100;
        const taxable = Math.round((net / 1.05) * 100) / 100;
        const totalTax = Math.round((net - taxable) * 100) / 100;
        const cgst = Math.round((totalTax / 2) * 100) / 100;
        const sgst = Math.round((totalTax - cgst) * 100) / 100;

        return {
          date,
          totalBills: val.totalBills,
          netAmount: net,
          grossAmount: Math.round(val.grossAmount * 100) / 100,
          discountAmount: Math.round(val.discountAmount * 100) / 100,
          cashAmount: Math.round(val.cashAmount * 100) / 100,
          upiAmount: Math.round(val.upiAmount * 100) / 100,
          cardAmount: Math.round(val.cardAmount * 100) / 100,
          taxableAmount: taxable,
          cgstAmount: cgst,
          sgstAmount: sgst,
          totalTax,
        };
      });

    const totals = summaries.reduce(
      (acc, cur) => ({
        totalBills: acc.totalBills + cur.totalBills,
        netAmount: Math.round((acc.netAmount + cur.netAmount) * 100) / 100,
        grossAmount: Math.round((acc.grossAmount + cur.grossAmount) * 100) / 100,
        discountAmount: Math.round((acc.discountAmount + cur.discountAmount) * 100) / 100,
        cashAmount: Math.round((acc.cashAmount + cur.cashAmount) * 100) / 100,
        upiAmount: Math.round((acc.upiAmount + cur.upiAmount) * 100) / 100,
        cardAmount: Math.round((acc.cardAmount + cur.cardAmount) * 100) / 100,
        taxableAmount: Math.round((acc.taxableAmount + cur.taxableAmount) * 100) / 100,
        cgstAmount: Math.round((acc.cgstAmount + cur.cgstAmount) * 100) / 100,
        sgstAmount: Math.round((acc.sgstAmount + cur.sgstAmount) * 100) / 100,
        totalTax: Math.round((acc.totalTax + cur.totalTax) * 100) / 100,
      }),
      {
        totalBills: 0,
        netAmount: 0,
        grossAmount: 0,
        discountAmount: 0,
        cashAmount: 0,
        upiAmount: 0,
        cardAmount: 0,
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        totalTax: 0,
      }
    );

    return { summaries, totals };
  }

  // --- Seed Realistic Initial Transactions for Instant Immersion ---
  public resetToRichDemoData() {
    const demo = generateDemoOrders();
    const today = this.getBusinessDate();

    this.data.categories = DEMO_CATEGORIES;
    this.data.products = DEMO_PRODUCTS;
    this.data.printers = DEMO_PRINTERS;
    this.data.settings = DEMO_SETTINGS;
    this.data.users = DEMO_USERS;
    this.data.orders = demo.orders;
    this.data.payments = demo.payments;
    this.data.invoices = demo.invoices;
    this.data.printJobs = demo.printJobs;
    this.data.auditLogs = demo.auditLogs;
    this.data.counters = {
      lastTokenNumber: 8,
      lastTokenDate: today,
      lastInvoiceNumber: 104,
    };

    this.save();
    this.broadcast('DATABASE_RESET', { message: 'Demo data loaded successfully' });
  }

  public seedSampleOrdersIfEmpty() {
    if (this.data.orders.length === 0) {
      this.resetToRichDemoData();
    }
  }
}

export const db = new Database();
db.seedSampleOrdersIfEmpty();

