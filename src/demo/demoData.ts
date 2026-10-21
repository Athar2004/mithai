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
} from '../types/index.ts';
import { SHEETAL_CATEGORIES, SHEETAL_PRODUCTS } from './sheetalCatalog.ts';

export const DEMO_SETTINGS: ShopSettings = {
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

export const DEMO_USERS: User[] = [
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

// Clean categories without the pseudo 'all' category
export const DEMO_CATEGORIES: Category[] = SHEETAL_CATEGORIES.filter(c => c.id !== 'all');

// Full Sheetal 220+ products parsed directly from official product specifications
export const DEMO_PRODUCTS: Product[] = SHEETAL_PRODUCTS;

export const DEMO_PRINTERS: PrinterConfig[] = [
  {
    id: 'prn_customer_token',
    name: 'Token Counter Thermal Printer (POS-1)',
    targetRole: 'CUSTOMER_TOKEN',
    paperWidth: '58mm',
    interfaceType: 'SIMULATOR',
    isConnected: true,
    autoPrint: true,
  },
  {
    id: 'prn_kitchen_kds',
    name: 'Kitchen Ticket Thermal Printer (KDS Room)',
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

// Helper to generate realistic demo orders across multiple dates (Today, Yesterday, 2 days ago)
export function generateDemoOrders(): {
  orders: Order[];
  payments: Payment[];
  invoices: Invoice[];
  printJobs: PrintJob[];
  auditLogs: AuditLog[];
} {
  const now = new Date();
  const formatYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const todayStr = formatYMD(now);

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatYMD(yesterdayDate);

  const twoDaysAgoDate = new Date(now);
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const twoDaysAgoStr = formatYMD(twoDaysAgoDate);

  const orders: Order[] = [];
  const payments: Payment[] = [];
  const invoices: Invoice[] = [];
  const printJobs: PrintJob[] = [];
  const auditLogs: AuditLog[] = [];

  const minsAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
  const daysAgoTime = (days: number, hoursAgo: number) => {
    const d = new Date(now.getTime() - days * 86400000 - hoursAgo * 3600000);
    return d.toISOString();
  };

  // Helper to compute inclusive tax (5%)
  const calcTax = (gross: number) => {
    const taxable = Math.round((gross / 1.05) * 100) / 100;
    const tax = Math.round((gross - taxable) * 100) / 100;
    const half = Math.round((tax / 2) * 100) / 100;
    return { taxable, totalTax: tax, cgst: half, sgst: Math.round((tax - half) * 100) / 100 };
  };

  // --- TODAY'S ACTIVE ORDERS (Queue for POS & Cashier) ---

  // Order 1: Received at POS, waiting 4 mins in Kitchen, UNPAID at Billing
  const o1: Order = {
    id: 'ord_demo_001',
    tokenNumber: 'T-001',
    businessDate: todayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: minsAgo(4),
    updatedAt: minsAgo(4),
    status: 'RECEIVED',
    statusHistory: [
      { status: 'RECEIVED', updatedBy: 'Order POS Staff', timestamp: minsAgo(4), note: 'Order taken at POS Counter 1' },
    ],
    items: [
      {
        id: 'item_1_1',
        productId: 'prod_gond_gajak_200gm',
        productName: 'GOND GAJAK 200GM',
        hindiName: 'गोंद गजक',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 0.2,
        packCount: 2,
        quantity: 2,
        unitPrice: 140,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 280,
        specialInstructions: 'Freshly sealed packs',
      },
      {
        id: 'item_1_2',
        productId: 'prod_aalu_sev',
        productName: 'Aalu Sev',
        hindiName: 'आलू सेव',
        unit: 'piece',
        hsnCode: '210609',
        packCount: 1,
        quantity: 1,
        unitPrice: 75,
        taxRatePercent: 12,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 75,
      },
    ],
    subtotal: 355,
    totalTax: 0,
    totalDiscount: 0,
    finalAmount: 355,
    paymentStatus: 'UNPAID',
    isKitchenRequired: false,
  };

  // Order 2: In Kitchen Preparing, waiting 8 mins, UNPAID at Billing
  const o2: Order = {
    id: 'ord_demo_002',
    tokenNumber: 'T-002',
    businessDate: todayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: minsAgo(8),
    updatedAt: minsAgo(6),
    status: 'PREPARING',
    statusHistory: [
      { status: 'RECEIVED', updatedBy: 'Order POS Staff', timestamp: minsAgo(8) },
      { status: 'PREPARING', updatedBy: 'Kitchen Chef', timestamp: minsAgo(6), note: 'Fresh packaging underway' },
    ],
    items: [
      {
        id: 'item_2_1',
        productId: 'prod_golden_kachori_200gm',
        productName: 'GOLDEN KACHORI 200GM',
        hindiName: 'गोल्डन कचौरी',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 0.2,
        packCount: 1,
        quantity: 1,
        unitPrice: 140,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 140,
      },
      {
        id: 'item_2_2',
        productId: 'prod_aam_barfi',
        productName: 'Aam barfi',
        hindiName: 'आम बर्फी',
        unit: 'piece',
        hsnCode: '2106909',
        packCount: 1,
        quantity: 1,
        unitPrice: 600,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 600,
        specialInstructions: 'Pack in festive box',
      },
    ],
    subtotal: 740,
    totalTax: 0,
    totalDiscount: 0,
    finalAmount: 740,
    paymentStatus: 'UNPAID',
    notes: 'Customer waiting at sweets counter',
    isKitchenRequired: true,
  };

  // Order 3: READY, waiting at billing counter
  const o3: Order = {
    id: 'ord_demo_003',
    tokenNumber: 'T-003',
    businessDate: todayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: minsAgo(15),
    updatedAt: minsAgo(3),
    status: 'READY',
    preparedAt: minsAgo(3),
    statusHistory: [
      { status: 'RECEIVED', updatedBy: 'Order POS Staff', timestamp: minsAgo(15) },
      { status: 'READY', updatedBy: 'Kitchen Chef', timestamp: minsAgo(3) },
    ],
    items: [
      {
        id: 'item_3_1',
        productId: 'prod_ghever_1000_gm',
        productName: 'Ghever (1000 GM)',
        hindiName: 'घेवर (देसी घी)',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 1,
        packCount: 1,
        quantity: 1,
        unitPrice: 860,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 860,
        specialInstructions: 'Handle with care, sweet rabdi topping',
      },
    ],
    subtotal: 860,
    totalTax: 0,
    totalDiscount: 0,
    finalAmount: 860,
    paymentStatus: 'UNPAID',
    isKitchenRequired: true,
  };

  // --- TODAY'S COMPLETED TRANSACTIONS (Cash, UPI, Card, Split) ---

  // Order 4 (Today): PAID via UPI
  const t4 = calcTax(1400);
  const o4: Order = {
    id: 'ord_demo_004',
    tokenNumber: 'T-004',
    businessDate: todayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: minsAgo(50),
    updatedAt: minsAgo(40),
    status: 'COMPLETED',
    completedAt: minsAgo(40),
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_004',
    invoiceId: 'inv_demo_004',
    statusHistory: [
      { status: 'RECEIVED', updatedBy: 'Order POS Staff', timestamp: minsAgo(50) },
      { status: 'COMPLETED', updatedBy: 'Cashier & Biller', timestamp: minsAgo(40) },
    ],
    items: [
      {
        id: 'item_4_1',
        productId: 'prod_anjeer_chikki_1000_gm',
        productName: 'anjeer chikki (1000 GM)',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 1,
        packCount: 1,
        quantity: 1,
        unitPrice: 1400,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 1400,
      },
    ],
    subtotal: 1400,
    totalTax: t4.totalTax,
    totalDiscount: 0,
    finalAmount: 1400,
    isKitchenRequired: false,
  };

  const pay4: Payment = {
    id: 'pay_demo_004',
    orderId: o4.id,
    tokenNumber: o4.tokenNumber,
    amount: 1400,
    method: 'UPI',
    status: 'SUCCESS',
    cashierId: 'usr_cashier',
    cashierName: 'Cashier & Biller',
    timestamp: minsAgo(40),
    transactionReference: 'UPI/982104829102',
  };

  const inv4: Invoice = {
    id: 'inv_demo_004',
    invoiceNumber: `INV-${todayStr.replace(/-/g, '')}-0101`,
    orderId: o4.id,
    tokenNumber: o4.tokenNumber,
    businessDate: todayStr,
    timestamp: minsAgo(40),
    items: o4.items,
    subtotal: o4.subtotal,
    cgstAmount: t4.cgst,
    sgstAmount: t4.sgst,
    totalTax: t4.totalTax,
    discountAmount: 0,
    totalAmount: 1400,
    paymentMethod: 'UPI',
    paymentReference: 'UPI/982104829102',
    cashierName: 'Cashier & Biller',
  };

  // Order 5 (Today): PAID via CASH
  const t5 = calcTax(700);
  const o5: Order = {
    id: 'ord_demo_005',
    tokenNumber: 'T-005',
    businessDate: todayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: minsAgo(75),
    updatedAt: minsAgo(65),
    status: 'COMPLETED',
    completedAt: minsAgo(65),
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_005',
    invoiceId: 'inv_demo_005',
    statusHistory: [
      { status: 'RECEIVED', updatedBy: 'Order POS Staff', timestamp: minsAgo(75) },
      { status: 'COMPLETED', updatedBy: 'Cashier & Biller', timestamp: minsAgo(65) },
    ],
    items: [
      {
        id: 'item_5_1',
        productId: 'prod_akhrot_doda_kg',
        productName: 'AKHROT DOda kg',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 1,
        packCount: 1,
        quantity: 1,
        unitPrice: 700,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 700,
      },
    ],
    subtotal: 700,
    totalTax: t5.totalTax,
    totalDiscount: 0,
    finalAmount: 700,
    isKitchenRequired: false,
  };

  const pay5: Payment = {
    id: 'pay_demo_005',
    orderId: o5.id,
    tokenNumber: o5.tokenNumber,
    amount: 700,
    method: 'CASH',
    status: 'SUCCESS',
    cashierId: 'usr_cashier',
    cashierName: 'Cashier & Biller',
    timestamp: minsAgo(65),
    tenderedAmount: 1000,
    changeReturned: 300,
  };

  const inv5: Invoice = {
    id: 'inv_demo_005',
    invoiceNumber: `INV-${todayStr.replace(/-/g, '')}-0102`,
    orderId: o5.id,
    tokenNumber: o5.tokenNumber,
    businessDate: todayStr,
    timestamp: minsAgo(65),
    items: o5.items,
    subtotal: o5.subtotal,
    cgstAmount: t5.cgst,
    sgstAmount: t5.sgst,
    totalTax: t5.totalTax,
    discountAmount: 0,
    totalAmount: 700,
    paymentMethod: 'CASH',
    cashierName: 'Cashier & Biller',
  };

  // Order 6 (Today): PAID via CARD
  const t6 = calcTax(1120);
  const o6: Order = {
    id: 'ord_demo_006',
    tokenNumber: 'T-006',
    businessDate: todayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: minsAgo(110),
    updatedAt: minsAgo(100),
    status: 'COMPLETED',
    completedAt: minsAgo(100),
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_006',
    invoiceId: 'inv_demo_006',
    statusHistory: [
      { status: 'RECEIVED', updatedBy: 'Order POS Staff', timestamp: minsAgo(110) },
      { status: 'COMPLETED', updatedBy: 'Cashier & Biller', timestamp: minsAgo(100) },
    ],
    items: [
      {
        id: 'item_6_1',
        productId: 'prod_gol_bangali',
        productName: 'gol bangali',
        unit: 'piece',
        hsnCode: '2106909',
        packCount: 2,
        quantity: 2,
        unitPrice: 560,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 1120,
      },
    ],
    subtotal: 1120,
    totalTax: t6.totalTax,
    totalDiscount: 0,
    finalAmount: 1120,
    isKitchenRequired: false,
  };

  const pay6: Payment = {
    id: 'pay_demo_006',
    orderId: o6.id,
    tokenNumber: o6.tokenNumber,
    amount: 1120,
    method: 'CARD',
    status: 'SUCCESS',
    cashierId: 'usr_cashier',
    cashierName: 'Cashier & Biller',
    timestamp: minsAgo(100),
    transactionReference: 'CARD/AUTH-4109',
  };

  const inv6: Invoice = {
    id: 'inv_demo_006',
    invoiceNumber: `INV-${todayStr.replace(/-/g, '')}-0103`,
    orderId: o6.id,
    tokenNumber: o6.tokenNumber,
    businessDate: todayStr,
    timestamp: minsAgo(100),
    items: o6.items,
    subtotal: o6.subtotal,
    cgstAmount: t6.cgst,
    sgstAmount: t6.sgst,
    totalTax: t6.totalTax,
    discountAmount: 0,
    totalAmount: 1120,
    paymentMethod: 'CARD',
    paymentReference: 'CARD/AUTH-4109',
    cashierName: 'Cashier & Biller',
  };

  // Order 7 (Today): PAID via SPLIT (Cash ₹300 + UPI ₹260)
  const t7 = calcTax(560);
  const o7: Order = {
    id: 'ord_demo_007',
    tokenNumber: 'T-007',
    businessDate: todayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: minsAgo(150),
    updatedAt: minsAgo(140),
    status: 'COMPLETED',
    completedAt: minsAgo(140),
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_007',
    invoiceId: 'inv_demo_007',
    statusHistory: [
      { status: 'RECEIVED', updatedBy: 'Order POS Staff', timestamp: minsAgo(150) },
      { status: 'COMPLETED', updatedBy: 'Cashier & Biller', timestamp: minsAgo(140) },
    ],
    items: [
      {
        id: 'item_7_1',
        productId: 'prod_golden_kachori_400gm',
        productName: 'GOLDEN KACHORI 400GM',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 0.4,
        packCount: 2,
        quantity: 2,
        unitPrice: 280,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 560,
      },
    ],
    subtotal: 560,
    totalTax: t7.totalTax,
    totalDiscount: 0,
    finalAmount: 560,
    isKitchenRequired: false,
  };

  const pay7: Payment = {
    id: 'pay_demo_007',
    orderId: o7.id,
    tokenNumber: o7.tokenNumber,
    amount: 560,
    method: 'SPLIT',
    splits: [
      { method: 'CASH', amount: 300 },
      { method: 'UPI', amount: 260, reference: 'UPI/7721839012' },
    ],
    status: 'SUCCESS',
    cashierId: 'usr_cashier',
    cashierName: 'Cashier & Biller',
    timestamp: minsAgo(140),
  };

  const inv7: Invoice = {
    id: 'inv_demo_007',
    invoiceNumber: `INV-${todayStr.replace(/-/g, '')}-0104`,
    orderId: o7.id,
    tokenNumber: o7.tokenNumber,
    businessDate: todayStr,
    timestamp: minsAgo(140),
    items: o7.items,
    subtotal: o7.subtotal,
    cgstAmount: t7.cgst,
    sgstAmount: t7.sgst,
    totalTax: t7.totalTax,
    discountAmount: 0,
    totalAmount: 560,
    paymentMethod: 'SPLIT',
    cashierName: 'Cashier & Biller',
  };

  // --- YESTERDAY'S TRANSACTIONS (For Date-Wise Day-End Report) ---

  // Order Y1 (Yesterday): Cash ₹1200
  const ty1 = calcTax(1200);
  const oy1: Order = {
    id: 'ord_demo_y01',
    tokenNumber: 'T-042',
    businessDate: yesterdayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: daysAgoTime(1, 6),
    updatedAt: daysAgoTime(1, 6),
    status: 'COMPLETED',
    completedAt: daysAgoTime(1, 6),
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_y01',
    invoiceId: 'inv_demo_y01',
    statusHistory: [{ status: 'COMPLETED', updatedBy: 'Cashier & Biller', timestamp: daysAgoTime(1, 6) }],
    items: [
      {
        id: 'item_y1_1',
        productId: 'prod_white_peda_1000_gm',
        productName: 'white peda (1000 GM)',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 1,
        packCount: 2,
        quantity: 2,
        unitPrice: 600,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 1200,
      },
    ],
    subtotal: 1200,
    totalTax: ty1.totalTax,
    totalDiscount: 0,
    finalAmount: 1200,
    isKitchenRequired: false,
  };

  const payY1: Payment = {
    id: 'pay_demo_y01',
    orderId: oy1.id,
    tokenNumber: oy1.tokenNumber,
    amount: 1200,
    method: 'CASH',
    status: 'SUCCESS',
    cashierId: 'usr_cashier',
    cashierName: 'Cashier & Biller',
    timestamp: daysAgoTime(1, 6),
  };

  const invY1: Invoice = {
    id: 'inv_demo_y01',
    invoiceNumber: `INV-${yesterdayStr.replace(/-/g, '')}-0089`,
    orderId: oy1.id,
    tokenNumber: oy1.tokenNumber,
    businessDate: yesterdayStr,
    timestamp: daysAgoTime(1, 6),
    items: oy1.items,
    subtotal: 1200,
    cgstAmount: ty1.cgst,
    sgstAmount: ty1.sgst,
    totalTax: ty1.totalTax,
    discountAmount: 0,
    totalAmount: 1200,
    paymentMethod: 'CASH',
    cashierName: 'Cashier & Biller',
  };

  // Order Y2 (Yesterday): UPI ₹2100
  const ty2 = calcTax(2100);
  const oy2: Order = {
    id: 'ord_demo_y02',
    tokenNumber: 'T-043',
    businessDate: yesterdayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: daysAgoTime(1, 5),
    updatedAt: daysAgoTime(1, 5),
    status: 'COMPLETED',
    completedAt: daysAgoTime(1, 5),
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_y02',
    invoiceId: 'inv_demo_y02',
    statusHistory: [{ status: 'COMPLETED', updatedBy: 'Cashier & Biller', timestamp: daysAgoTime(1, 5) }],
    items: [
      {
        id: 'item_y2_1',
        productId: 'prod_urad_moong_laddu_1000_gm',
        productName: 'Urad/moong Laddu (1000 GM)',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 1,
        packCount: 3,
        quantity: 3,
        unitPrice: 700,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 2100,
      },
    ],
    subtotal: 2100,
    totalTax: ty2.totalTax,
    totalDiscount: 0,
    finalAmount: 2100,
    isKitchenRequired: false,
  };

  const payY2: Payment = {
    id: 'pay_demo_y02',
    orderId: oy2.id,
    tokenNumber: oy2.tokenNumber,
    amount: 2100,
    method: 'UPI',
    status: 'SUCCESS',
    cashierId: 'usr_cashier',
    cashierName: 'Cashier & Biller',
    timestamp: daysAgoTime(1, 5),
    transactionReference: 'UPI/8841920194',
  };

  const invY2: Invoice = {
    id: 'inv_demo_y02',
    invoiceNumber: `INV-${yesterdayStr.replace(/-/g, '')}-0090`,
    orderId: oy2.id,
    tokenNumber: oy2.tokenNumber,
    businessDate: yesterdayStr,
    timestamp: daysAgoTime(1, 5),
    items: oy2.items,
    subtotal: 2100,
    cgstAmount: ty2.cgst,
    sgstAmount: ty2.sgst,
    totalTax: ty2.totalTax,
    discountAmount: 0,
    totalAmount: 2100,
    paymentMethod: 'UPI',
    paymentReference: 'UPI/8841920194',
    cashierName: 'Cashier & Biller',
  };

  // Order Y3 (Yesterday): Card ₹860
  const ty3 = calcTax(860);
  const oy3: Order = {
    id: 'ord_demo_y03',
    tokenNumber: 'T-044',
    businessDate: yesterdayStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: daysAgoTime(1, 4),
    updatedAt: daysAgoTime(1, 4),
    status: 'COMPLETED',
    completedAt: daysAgoTime(1, 4),
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_y03',
    invoiceId: 'inv_demo_y03',
    statusHistory: [{ status: 'COMPLETED', updatedBy: 'Cashier & Biller', timestamp: daysAgoTime(1, 4) }],
    items: [
      {
        id: 'item_y3_1',
        productId: 'prod_ghever_1000_gm',
        productName: 'Ghever (1000 GM)',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 1,
        packCount: 1,
        quantity: 1,
        unitPrice: 860,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 860,
      },
    ],
    subtotal: 860,
    totalTax: ty3.totalTax,
    totalDiscount: 0,
    finalAmount: 860,
    isKitchenRequired: false,
  };

  const payY3: Payment = {
    id: 'pay_demo_y03',
    orderId: oy3.id,
    tokenNumber: oy3.tokenNumber,
    amount: 860,
    method: 'CARD',
    status: 'SUCCESS',
    cashierId: 'usr_cashier',
    cashierName: 'Cashier & Biller',
    timestamp: daysAgoTime(1, 4),
    transactionReference: 'CARD/AUTH-7712',
  };

  const invY3: Invoice = {
    id: 'inv_demo_y03',
    invoiceNumber: `INV-${yesterdayStr.replace(/-/g, '')}-0091`,
    orderId: oy3.id,
    tokenNumber: oy3.tokenNumber,
    businessDate: yesterdayStr,
    timestamp: daysAgoTime(1, 4),
    items: oy3.items,
    subtotal: 860,
    cgstAmount: ty3.cgst,
    sgstAmount: ty3.sgst,
    totalTax: ty3.totalTax,
    discountAmount: 0,
    totalAmount: 860,
    paymentMethod: 'CARD',
    paymentReference: 'CARD/AUTH-7712',
    cashierName: 'Cashier & Biller',
  };

  // --- 2 DAYS AGO TRANSACTIONS ---
  const t2d1 = calcTax(1680);
  const o2d1: Order = {
    id: 'ord_demo_2d01',
    tokenNumber: 'T-038',
    businessDate: twoDaysAgoStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: daysAgoTime(2, 5),
    updatedAt: daysAgoTime(2, 5),
    status: 'COMPLETED',
    completedAt: daysAgoTime(2, 5),
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_2d01',
    invoiceId: 'inv_demo_2d01',
    statusHistory: [{ status: 'COMPLETED', updatedBy: 'Cashier & Biller', timestamp: daysAgoTime(2, 5) }],
    items: [
      {
        id: 'item_2d1_1',
        productId: 'prod_gond_gajak_200gm',
        productName: 'GOND GAJAK 200GM',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 0.2,
        packCount: 12,
        quantity: 12,
        unitPrice: 140,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 1680,
      },
    ],
    subtotal: 1680,
    totalTax: t2d1.totalTax,
    totalDiscount: 0,
    finalAmount: 1680,
    isKitchenRequired: false,
  };

  const pay2d1: Payment = {
    id: 'pay_demo_2d01',
    orderId: o2d1.id,
    tokenNumber: o2d1.tokenNumber,
    amount: 1680,
    method: 'CASH',
    status: 'SUCCESS',
    cashierId: 'usr_cashier',
    cashierName: 'Cashier & Biller',
    timestamp: daysAgoTime(2, 5),
  };

  const inv2d1: Invoice = {
    id: 'inv_demo_2d01',
    invoiceNumber: `INV-${twoDaysAgoStr.replace(/-/g, '')}-0071`,
    orderId: o2d1.id,
    tokenNumber: o2d1.tokenNumber,
    businessDate: twoDaysAgoStr,
    timestamp: daysAgoTime(2, 5),
    items: o2d1.items,
    subtotal: 1680,
    cgstAmount: t2d1.cgst,
    sgstAmount: t2d1.sgst,
    totalTax: t2d1.totalTax,
    discountAmount: 0,
    totalAmount: 1680,
    paymentMethod: 'CASH',
    cashierName: 'Cashier & Biller',
  };

  const t2d2 = calcTax(2800);
  const o2d2: Order = {
    id: 'ord_demo_2d02',
    tokenNumber: 'T-039',
    businessDate: twoDaysAgoStr,
    counterId: 'POS-1',
    createdByUserId: 'usr_pos',
    createdByName: 'Order POS Staff',
    createdAt: daysAgoTime(2, 3),
    updatedAt: daysAgoTime(2, 3),
    status: 'COMPLETED',
    completedAt: daysAgoTime(2, 3),
    paymentStatus: 'PAID',
    paymentId: 'pay_demo_2d02',
    invoiceId: 'inv_demo_2d02',
    statusHistory: [{ status: 'COMPLETED', updatedBy: 'Cashier & Biller', timestamp: daysAgoTime(2, 3) }],
    items: [
      {
        id: 'item_2d2_1',
        productId: 'prod_anjeer_chikki_1000_gm',
        productName: 'anjeer chikki (1000 GM)',
        unit: 'piece',
        hsnCode: '2106909',
        packWeightKg: 1,
        packCount: 2,
        quantity: 2,
        unitPrice: 1400,
        taxRatePercent: 5,
        taxAmount: 0,
        discountAmount: 0,
        totalPrice: 2800,
      },
    ],
    subtotal: 2800,
    totalTax: t2d2.totalTax,
    totalDiscount: 0,
    finalAmount: 2800,
    isKitchenRequired: false,
  };

  const pay2d2: Payment = {
    id: 'pay_demo_2d02',
    orderId: o2d2.id,
    tokenNumber: o2d2.tokenNumber,
    amount: 2800,
    method: 'UPI',
    status: 'SUCCESS',
    cashierId: 'usr_cashier',
    cashierName: 'Cashier & Biller',
    timestamp: daysAgoTime(2, 3),
    transactionReference: 'UPI/9912048123',
  };

  const inv2d2: Invoice = {
    id: 'inv_demo_2d02',
    invoiceNumber: `INV-${twoDaysAgoStr.replace(/-/g, '')}-0072`,
    orderId: o2d2.id,
    tokenNumber: o2d2.tokenNumber,
    businessDate: twoDaysAgoStr,
    timestamp: daysAgoTime(2, 3),
    items: o2d2.items,
    subtotal: 2800,
    cgstAmount: t2d2.cgst,
    sgstAmount: t2d2.sgst,
    totalTax: t2d2.totalTax,
    discountAmount: 0,
    totalAmount: 2800,
    paymentMethod: 'UPI',
    cashierName: 'Cashier & Biller',
  };

  orders.push(o1, o2, o3, o4, o5, o6, o7, oy1, oy2, oy3, o2d1, o2d2);
  payments.push(pay4, pay5, pay6, pay7, payY1, payY2, payY3, pay2d1, pay2d2);
  invoices.push(inv4, inv5, inv6, inv7, invY1, invY2, invY3, inv2d1, inv2d2);

  // Print jobs for today's active & completed orders
  const pj1: PrintJob = {
    id: 'PJ-00101',
    jobType: 'CUSTOMER_TOKEN',
    orderId: o1.id,
    tokenNumber: o1.tokenNumber,
    printerId: 'prn_customer_token',
    printerName: 'Customer Waiting Token Printer (2-Inch / 50.8mm)',
    paperWidth: '58mm',
    status: 'PRINTED',
    createdAt: minsAgo(4),
    printedAt: minsAgo(4),
    retryCount: 0,
    reprintCount: 0,
    payload: `SHEETAL GAJAK KULFI\nOpp. High Court, Shivaji Nagar\nIndore - 452003\n================================\n     CUSTOMER WAITING SLIP\n--------------------------------\n      *** TOKEN NUMBER ***\n           >>> ${o1.tokenNumber} <<<         \n--------------------------------\nDate: ${todayStr}\nCounter: POS-1\n================================\n>> PLEASE WAIT FOR TOKEN CALL <<\nShow this token at billing counter\nThank You! Visit Again.\n`,
  };

  const pj2: PrintJob = {
    id: 'PJ-00102',
    jobType: 'KITCHEN_TICKET',
    orderId: o2.id,
    tokenNumber: o2.tokenNumber,
    printerId: 'prn_kitchen_kds',
    printerName: 'Order POS Dispatch Slip Printer (2-Inch / 50.8mm)',
    paperWidth: '58mm',
    status: 'PRINTED',
    createdAt: minsAgo(8),
    printedAt: minsAgo(8),
    retryCount: 0,
    reprintCount: 1,
    payload: `*** ORDER POS SLIP (2-INCH) ***\nSHEETAL GAJAK KULFI\nOpp. High Court, Shivaji Nagar\n================================\n*** TOKEN: ${o2.tokenNumber} ***\n================================\nTime: ${new Date(o2.createdAt).toLocaleTimeString('en-IN')}\n\n[ ] GOLDEN KACHORI 200GM: 1 Pk\n[ ] AAM BARFI: 1 Pk\n\n================================\n    PACK FRESH & HAND OVER      `,
  };

  const pj4: PrintJob = {
    id: 'PJ-00104',
    jobType: 'TAX_INVOICE',
    orderId: o4.id,
    tokenNumber: o4.tokenNumber,
    printerId: 'prn_billing_invoice',
    printerName: 'Billing Cashier Invoice Printer (80mm)',
    paperWidth: '80mm',
    status: 'PRINTED',
    createdAt: minsAgo(40),
    printedAt: minsAgo(40),
    retryCount: 0,
    reprintCount: 0,
    payload: `SHEETAL GAJAK KULFI\nOpposite High Court, Shivaji Nagar\nIndore, Madhya Pradesh 452003\n================================\nTAX INVOICE #${inv4.invoiceNumber}\nToken: ${o4.tokenNumber}\nDate: ${todayStr}\nPayment: UPI (Ref: ${inv4.paymentReference})\n\nITEM NAME / HSN         QTY      RATE     AMOUNT\nanjeer chikki (1000 GM) 1 Pk     1400.00  ₹1400.00\nHSN: 2106909\n------------------------------------------------\nCGST (2.5%): ₹33.33\nSGST (2.5%): ₹33.33\nTOTAL PAID: ₹1400.00\n\nThank you for choosing Sheetal Gajak Kulfi!`,
  };

  printJobs.push(pj1, pj2, pj4);

  auditLogs.push(
    {
      id: 'aud_demo_1',
      timestamp: minsAgo(150),
      userId: 'usr_pos',
      userName: 'Order POS Staff',
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: o7.id,
      details: 'Token T-007 created at POS-1. Total: ₹560.00',
    },
    {
      id: 'aud_demo_2',
      timestamp: minsAgo(140),
      userId: 'usr_cashier',
      userName: 'Cashier & Biller',
      action: 'PAYMENT_COLLECTED',
      entityType: 'PAYMENT',
      entityId: pay7.id,
      details: 'Split payment ₹560 (Cash ₹300 + UPI ₹260) collected for Token T-007. Invoice generated.',
    },
    {
      id: 'aud_demo_3',
      timestamp: minsAgo(40),
      userId: 'usr_cashier',
      userName: 'Cashier & Biller',
      action: 'PAYMENT_COLLECTED',
      entityType: 'PAYMENT',
      entityId: pay4.id,
      details: 'UPI payment ₹1400 collected for Token T-004. Invoice generated.',
    }
  );

  return { orders, payments, invoices, printJobs, auditLogs };
}
