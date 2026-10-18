export type UserRole = 'admin' | 'pos_staff' | 'kitchen_staff' | 'cashier' | 'manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
}

export type UnitType = 'kg' | 'piece' | 'box' | 'portion';

export interface Category {
  id: string;
  name: string;
  description: string;
  iconName: string;
  displayOrder: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  hindiName?: string;
  categoryId: string;
  unit: UnitType;
  pricePerUnit: number; // In INR (₹)
  taxRatePercent: number; // Standard 5% GST for sweets/food
  isActive: boolean;
  requiresKitchen: boolean;
  imageUrl?: string;
  description?: string;
  popularItem?: boolean;
  standardWeights?: number[]; // in kg, e.g. [0.1, 0.25, 0.5, 1.0]
  standardCounts?: number[]; // e.g. [1, 2, 4, 6, 12]
}

export type OrderStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'SPLIT';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  hindiName?: string;
  unit: UnitType;
  quantity: number; // e.g., 0.25 for 250g, or 4 for 4 pieces
  unitPrice: number;
  taxRatePercent: number;
  taxAmount: number;
  discountAmount: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  tokenNumber: string; // e.g. 'T-001'
  businessDate: string; // 'YYYY-MM-DD'
  counterId: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string; // ISO string
  updatedAt: string;
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    updatedBy: string;
    timestamp: string;
    note?: string;
  }>;
  items: OrderItem[];
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  invoiceId?: string;
  notes?: string;
  isKitchenRequired: boolean;
  preparedAt?: string;
  completedAt?: string;
}

export interface PaymentSplit {
  method: 'CASH' | 'UPI' | 'CARD';
  amount: number;
  reference?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  tokenNumber: string;
  amount: number;
  method: PaymentMethod;
  splits?: PaymentSplit[];
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  cashierId: string;
  cashierName: string;
  timestamp: string;
  tenderedAmount?: number;
  changeReturned?: number;
  transactionReference?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. 'INV-20261016-0001'
  orderId: string;
  tokenNumber: string;
  businessDate: string;
  timestamp: string;
  items: OrderItem[];
  subtotal: number;
  cgstAmount: number; // 2.5%
  sgstAmount: number; // 2.5%
  totalTax: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  cashierName: string;
}

export type PrintJobType = 'CUSTOMER_TOKEN' | 'KITCHEN_TICKET' | 'TAX_INVOICE';
export type PrintJobStatus = 'QUEUED' | 'PRINTING' | 'PRINTED' | 'FAILED';

export interface PrintJob {
  id: string;
  jobType: PrintJobType;
  orderId: string;
  tokenNumber: string;
  printerId: string;
  printerName: string;
  paperWidth: '58mm' | '80mm';
  status: PrintJobStatus;
  createdAt: string;
  printedAt?: string;
  retryCount: number;
  lastError?: string;
  reprintCount: number;
  payload: string; // Rendered text or ESC/POS formatted representation
  rawEscPosHex?: string;
}

export interface PrinterConfig {
  id: string;
  name: string;
  targetRole: 'CUSTOMER_TOKEN' | 'KITCHEN_TICKET' | 'BILLING_INVOICE';
  paperWidth: '58mm' | '80mm';
  interfaceType: 'NETWORK' | 'USB' | 'SIMULATOR';
  ipAddress?: string;
  port?: number;
  isConnected: boolean;
  autoPrint: boolean;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  gstin: string;
  fssaiNumber: string;
  tokenPrefix: string;
  businessDayCutoffHour: number; // 4am
  kitchenDelayThresholdMinutes: number; // 10 minutes
  currencySymbol: string;
  taxConfig: {
    cgstRate: number;
    sgstRate: number;
  };
  footerMessage: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'ORDER' | 'PAYMENT' | 'INVOICE' | 'PRODUCT' | 'SETTINGS' | 'PRINTER' | 'REFUND';
  entityId: string;
  details: string;
}

export interface DashboardMetrics {
  ordersToday: number;
  unpaidOrders: number;
  preparingOrders: number;
  readyOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  totalSalesToday: number;
  unpaidSalesToday: number;
  avgPreparationTimeMinutes: number;
  avgWaitTimeMinutes: number;
  hourlySales: Array<{ hour: string; sales: number; orders: number }>;
  paymentBreakdown: Array<{ method: string; amount: number; count: number }>;
  topProducts: Array<{ name: string; quantityFormatted: string; revenue: number; unit: UnitType }>;
  categoryPerformance: Array<{ category: string; revenue: number; count: number }>;
}

export const SCHEMA_VERSION = '2.4.0';

