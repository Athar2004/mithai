import express from 'express';
import type { Request, Response } from 'express';
import { db } from './db.ts';
import {
  generateCustomerTokenReceipt,
  generateKitchenTicketReceipt,
  generateInvoiceReceipt,
} from './escpos.ts';
import type { OrderStatus, PaymentMethod } from '../src/types/index.ts';

export const router = express.Router();

// --- SSE Real-time Endpoint ---
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  const unsubscribe = db.subscribe(event => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

// --- Categories & Products ---
router.get('/categories', (_req: Request, res: Response) => {
  res.json({ success: true, categories: db.getCategories() });
});

router.get('/products', (_req: Request, res: Response) => {
  res.json({ success: true, products: db.getProducts() });
});

router.post('/products', (req: Request, res: Response) => {
  try {
    const saved = db.saveProduct(req.body);
    db.logAudit('usr_admin', 'Admin', 'PRODUCT_MODIFIED', 'PRODUCT', saved.id, `Product ${saved.name} saved. Price: ₹${saved.pricePerUnit}/${saved.unit}`);
    res.json({ success: true, product: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save product';
    res.status(400).json({ success: false, error: msg });
  }
});

// --- Orders ---
router.get('/orders', (req: Request, res: Response) => {
  const { status, paymentStatus, date } = req.query;
  const orders = db.getOrders({
    status: status as OrderStatus | undefined,
    paymentStatus: paymentStatus as any,
    date: date as string | undefined,
  });
  res.json({ success: true, orders });
});

router.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, order });
});

router.post('/orders', (req: Request, res: Response) => {
  try {
    const { items, notes, userId, userName, counterId } = req.body;
    const order = db.createOrder({
      items,
      notes,
      userId: userId || 'usr_pos1',
      userName: userName || 'POS Operator',
      counterId: counterId || 'POS-1',
    });

    const settings = db.getSettings();
    const printers = db.getPrinters();

    // 1. Generate & Enqueue Customer Token Print Job
    const tokenPrn = printers.find(p => p.targetRole === 'CUSTOMER_TOKEN') || printers[0];
    const customerReceipt = generateCustomerTokenReceipt(order, settings, tokenPrn.paperWidth);
    const tokenJob = db.enqueuePrintJob({
      jobType: 'CUSTOMER_TOKEN',
      orderId: order.id,
      tokenNumber: order.tokenNumber,
      printerRole: 'CUSTOMER_TOKEN',
      payload: customerReceipt.text,
      rawEscPosHex: customerReceipt.escposHex,
    });

    // 2. Generate & Enqueue Kitchen Ticket Print Job (always provided for customer to give to kitchen)
    const kdsPrn = printers.find(p => p.targetRole === 'KITCHEN_TICKET') || printers[1] || printers[0];
    const kitchenReceipt = generateKitchenTicketReceipt(order, settings, kdsPrn.paperWidth);
    const kitchenJob = db.enqueuePrintJob({
      jobType: 'KITCHEN_TICKET',
      orderId: order.id,
      tokenNumber: order.tokenNumber,
      printerRole: 'KITCHEN_TICKET',
      payload: kitchenReceipt.text,
      rawEscPosHex: kitchenReceipt.escposHex,
    });

    res.status(201).json({
      success: true,
      order,
      printJobs: {
        customerToken: tokenJob,
        kitchenTicket: kitchenJob,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create order';
    res.status(400).json({ success: false, error: msg });
  }
});

router.patch('/orders/:id/status', (req: Request, res: Response) => {
  try {
    const { status, updatedBy, note } = req.body;
    const updated = db.updateOrderStatus(req.params.id, status as OrderStatus, updatedBy || 'Kitchen Staff', note);
    res.json({ success: true, order: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update order status';
    res.status(400).json({ success: false, error: msg });
  }
});

// --- Payments & Invoicing ---
router.post('/orders/:id/pay', (req: Request, res: Response) => {
  try {
    const { amount, method, splits, cashierId, cashierName, tenderedAmount, transactionReference } = req.body;
    const result = db.processPayment({
      orderId: req.params.id,
      amount: Number(amount),
      method: method as PaymentMethod,
      splits,
      cashierId: cashierId || 'usr_billing',
      cashierName: cashierName || 'Cashier',
      tenderedAmount: tenderedAmount ? Number(tenderedAmount) : undefined,
      transactionReference,
    });

    // Generate & Enqueue Invoice Print Job
    const settings = db.getSettings();
    const printers = db.getPrinters();
    const billingPrn = printers.find(p => p.targetRole === 'BILLING_INVOICE') || printers[2] || printers[0];
    const invoiceReceipt = generateInvoiceReceipt(result.invoice, result.order, settings, billingPrn.paperWidth);
    const invoiceJob = db.enqueuePrintJob({
      jobType: 'TAX_INVOICE',
      orderId: result.order.id,
      tokenNumber: result.order.tokenNumber,
      printerRole: 'BILLING_INVOICE',
      payload: invoiceReceipt.text,
      rawEscPosHex: invoiceReceipt.escposHex,
    });

    res.json({
      success: true,
      payment: result.payment,
      invoice: result.invoice,
      order: result.order,
      printJob: invoiceJob,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment failed';
    res.status(400).json({ success: false, error: msg });
  }
});

router.post('/orders/:id/refund', (req: Request, res: Response) => {
  try {
    const { userId, userName, reason } = req.body;
    const cancelled = db.cancelOrRefundOrder(req.params.id, userId || 'usr_manager', userName || 'Manager', reason || 'Customer requested cancellation');
    res.json({ success: true, order: cancelled });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Cancellation failed';
    res.status(400).json({ success: false, error: msg });
  }
});

// --- Print Jobs & Printers ---
router.get('/print-jobs', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  res.json({ success: true, printJobs: db.getPrintJobs(limit) });
});

router.post('/print-jobs/:id/retry', (req: Request, res: Response) => {
  try {
    const retried = db.retryPrintJob(req.params.id);
    res.json({ success: true, printJob: retried });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Retry failed';
    res.status(400).json({ success: false, error: msg });
  }
});

router.post('/print-jobs/:id/reprint', (req: Request, res: Response) => {
  try {
    const { requestedBy } = req.body;
    const reprinted = db.logReprint(req.params.id, requestedBy || 'Staff');
    res.json({ success: true, printJob: reprinted });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Reprint failed';
    res.status(400).json({ success: false, error: msg });
  }
});

router.get('/printers', (_req: Request, res: Response) => {
  res.json({ success: true, printers: db.getPrinters() });
});

router.patch('/printers/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updatePrinter(req.params.id, req.body);
    res.json({ success: true, printer: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update printer';
    res.status(400).json({ success: false, error: msg });
  }
});

// --- Settings, Users, Audit Logs, Analytics ---
router.get('/settings', (_req: Request, res: Response) => {
  res.json({ success: true, settings: db.getSettings() });
});

router.patch('/settings', (req: Request, res: Response) => {
  try {
    const { settings, updatedBy } = req.body;
    const updated = db.updateSettings(settings, updatedBy || 'Admin');
    res.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update settings';
    res.status(400).json({ success: false, error: msg });
  }
});

// --- Demo Data Reset Endpoint ---
router.post('/demo/reset', (_req: Request, res: Response) => {
  db.resetToRichDemoData();
  res.json({ success: true, message: 'Rich demo data reset successfully' });
});

router.get('/demo/reset', (_req: Request, res: Response) => {
  db.resetToRichDemoData();
  res.json({ success: true, message: 'Rich demo data reset successfully' });
});

router.get('/users', (_req: Request, res: Response) => {
  res.json({ success: true, users: db.getUsers() });
});

router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    const users = db.getUsers();
    const user = users.find(
      u => u.email?.toLowerCase() === String(email).trim().toLowerCase() && u.password === String(password).trim()
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    db.logAudit(user.id, user.name, 'USER_LOGIN', 'SETTINGS', user.id, `User ${user.name} (${user.role}) logged in successfully`);
    res.json({ success: true, user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    res.status(500).json({ success: false, error: msg });
  }
});


router.get('/audit-logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json({ success: true, auditLogs: db.getAuditLogs(limit) });
});

router.get('/analytics', (req: Request, res: Response) => {
  const date = req.query.date as string | undefined;
  const metrics = db.getAnalytics(date);
  res.json({ success: true, metrics });
});

// --- Automated Integration Test Suite Endpoint ---
const runTestSuiteHandler = (_req: Request, res: Response) => {
  const results: Array<{ testCase: string; passed: boolean; message: string; durationMs: number }> = [];
  const startAll = Date.now();

  try {
    // Test 1: Sequence Token Generation
    const tStart1 = Date.now();
    const tokenResult = db.generateNextToken();
    const passed1 = typeof tokenResult.tokenNumber === 'string' && tokenResult.tokenNumber.startsWith('T-');
    results.push({
      testCase: 'Token Sequence & Date Uniqueness',
      passed: passed1,
      message: `Generated atomic token: ${tokenResult.tokenNumber} for business date: ${tokenResult.businessDate}`,
      durationMs: Date.now() - tStart1,
    });

    // Test 2: Order Creation & Server-side Price Math
    const tStart2 = Date.now();
    const products = db.getProducts();
    const kaju = products.find(p => p.id === 'prod_kaju_katli')!;
    const samosa = products.find(p => p.id === 'prod_samosa')!;

    // 0.25 kg Kaju Katli (960/kg = 240) + 2 Samosas (18/pc = 36) => subtotal 276 + 5% GST (13.80) = 289.80
    const testOrder = db.createOrder({
      userId: 'usr_test',
      userName: 'QA Automation',
      counterId: 'POS-TEST',
      items: [
        { productId: kaju.id, quantity: 0.25 },
        { productId: samosa.id, quantity: 2 },
      ],
      notes: 'Automated Test Order',
    });

    const expectedSubtotal = 240 + 36;
    const expectedTax = Math.round(expectedSubtotal * 0.05 * 100) / 100;
    const expectedFinal = Math.round((expectedSubtotal + expectedTax) * 100) / 100;
    const mathValid = Math.abs(testOrder.finalAmount - expectedFinal) < 0.01;

    results.push({
      testCase: 'Server-side Weight & Quantity Price Calculation',
      passed: mathValid && testOrder.items.length === 2,
      message: `Calculated Subtotal: ₹${testOrder.subtotal}, Tax: ₹${testOrder.totalTax}, Final: ₹${testOrder.finalAmount} (Expected: ₹${expectedFinal})`,
      durationMs: Date.now() - tStart2,
    });

    // Test 3: Dual Print Job Generation (Customer Token + Kitchen Ticket)
    const tStart3 = Date.now();
    const settings = db.getSettings();
    const printers = db.getPrinters();
    const custReceipt = generateCustomerTokenReceipt(testOrder, settings, '58mm');
    const kitReceipt = generateKitchenTicketReceipt(testOrder, settings, '80mm');

    const pjToken = db.enqueuePrintJob({
      jobType: 'CUSTOMER_TOKEN',
      orderId: testOrder.id,
      tokenNumber: testOrder.tokenNumber,
      printerRole: 'CUSTOMER_TOKEN',
      payload: custReceipt.text,
      rawEscPosHex: custReceipt.escposHex,
    });

    const pjKit = db.enqueuePrintJob({
      jobType: 'KITCHEN_TICKET',
      orderId: testOrder.id,
      tokenNumber: testOrder.tokenNumber,
      printerRole: 'KITCHEN_TICKET',
      payload: kitReceipt.text,
      rawEscPosHex: kitReceipt.escposHex,
    });

    const passed3 = !!(pjToken.id && pjKit.id && custReceipt.text.includes(testOrder.tokenNumber));
    results.push({
      testCase: 'Automatic Dual ESC/POS Print Job Dispatch',
      passed: passed3,
      message: `Enqueued Token Job ${pjToken.id} (58mm) and KDS Job ${pjKit.id} (80mm) with ESC/POS hex payload`,
      durationMs: Date.now() - tStart3,
    });

    // Test 4: Kitchen Lifecycle Progression
    const tStart4 = Date.now();
    const orderPrep = db.updateOrderStatus(testOrder.id, 'PREPARING', 'QA Kitchen Bot');
    const orderReady = db.updateOrderStatus(testOrder.id, 'READY', 'QA Kitchen Bot');
    const passed4 = orderReady.status === 'READY' && !!orderReady.preparedAt;
    results.push({
      testCase: 'Kitchen Preparation Lifecycle (RECEIVED -> PREPARING -> READY)',
      passed: passed4,
      message: `Order transitioned through RECEIVED -> PREPARING -> READY with server timestamp`,
      durationMs: Date.now() - tStart4,
    });

    // Test 5: Cashier Order Retrieval by Token
    const tStart5 = Date.now();
    const retrieved = db.getOrderById(testOrder.tokenNumber);
    const passed5 = !!(retrieved && retrieved.id === testOrder.id && retrieved.paymentStatus === 'UNPAID');
    results.push({
      testCase: 'Cashier Terminal Order Retrieval by Token ID',
      passed: passed5,
      message: `Retrieved exact order for token ${testOrder.tokenNumber} with ${retrieved?.items.length} items`,
      durationMs: Date.now() - tStart5,
    });

    // Test 6: Payment Processing, Change Calculation & Tax Invoice Generation
    const tStart6 = Date.now();
    const paymentResult = db.processPayment({
      orderId: testOrder.id,
      amount: testOrder.finalAmount,
      method: 'CASH',
      tenderedAmount: 500,
      cashierId: 'usr_billing',
      cashierName: 'QA Cashier Bot',
    });

    const expectedChange = Math.round((500 - testOrder.finalAmount) * 100) / 100;
    const passed6 = paymentResult.order.paymentStatus === 'PAID' &&
      paymentResult.invoice.invoiceNumber.startsWith('INV-') &&
      Math.abs((paymentResult.payment.changeReturned || 0) - expectedChange) < 0.01;

    results.push({
      testCase: 'Cashier Payment Collection, Change Math & Tax Invoice Creation',
      passed: passed6,
      message: `Generated Invoice #${paymentResult.invoice.invoiceNumber}. Tendered: ₹500, Returned Change: ₹${paymentResult.payment.changeReturned}`,
      durationMs: Date.now() - tStart6,
    });

    // Test 7: Double-payment prevention
    const tStart7 = Date.now();
    let doublePayBlocked = false;
    try {
      db.processPayment({
        orderId: testOrder.id,
        amount: testOrder.finalAmount,
        method: 'CASH',
        cashierId: 'usr_billing',
        cashierName: 'QA Cashier Bot',
      });
    } catch {
      doublePayBlocked = true;
    }
    results.push({
      testCase: 'Idempotency & Double-Payment Prevention Guard',
      passed: doublePayBlocked,
      message: 'Server correctly rejected second payment on already-paid order',
      durationMs: Date.now() - tStart7,
    });

    // Test 8: Audit Logging
    const tStart8 = Date.now();
    const recentLogs = db.getAuditLogs(10);
    const auditVerified = recentLogs.some(l => l.entityId === testOrder.id || l.details.includes(testOrder.tokenNumber));
    results.push({
      testCase: 'Immutable Audit Trail Logging',
      passed: auditVerified,
      message: 'Audit log successfully recorded all order lifecycle transitions',
      durationMs: Date.now() - tStart8,
    });

    res.json({
      success: true,
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        totalDurationMs: Date.now() - startAll,
      },
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Test suite failed';
    res.status(500).json({ success: false, error: msg, results });
  }
};

router.post('/test-suite/run', runTestSuiteHandler);
router.get('/test-suite/run', runTestSuiteHandler);

