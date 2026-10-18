import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { Order, PaymentMethod } from '../../types/index.ts';
import * as api from '../../lib/api.ts';
import {
  Search,
  CreditCard,
  QrCode,
  Banknote,
  Split,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';

export const BillingTerminal: React.FC = () => {
  const { orders, currentUser, settings, openThermalReceipt } = useApp();

  const [searchToken, setSearchToken] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'UNPAID' | 'PAID' | 'ALL'>('UNPAID');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [upiRef, setUpiRef] = useState<string>('');
  const [cardAuth, setCardAuth] = useState<string>('');
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitUpiAmount, setSplitUpiAmount] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Success state for invoice
  const [paidInvoiceModal, setPaidInvoiceModal] = useState<{
    invoiceNumber: string;
    tokenNumber: string;
    amount: number;
    paymentMethod: string;
    receiptText: string;
  } | null>(null);

  // Cancellation / Refund modal state
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filterTab === 'UNPAID' && (o.paymentStatus !== 'UNPAID' || o.status === 'CANCELLED')) return false;
      if (filterTab === 'PAID' && o.paymentStatus !== 'PAID') return false;

      if (searchToken.trim() !== '') {
        const query = searchToken.trim().toLowerCase();
        const matchToken = o.tokenNumber.toLowerCase().includes(query);
        const matchId = o.id.toLowerCase().includes(query);
        return matchToken || matchId;
      }
      return true;
    });
  }, [orders, filterTab, searchToken]);

  // Selected Order
  const selectedOrder = useMemo(() => {
    if (selectedOrderId) {
      return orders.find(o => o.id === selectedOrderId) || null;
    }
    // Default to first unpaid order if available
    const firstUnpaid = orders.find(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED');
    return firstUnpaid || null;
  }, [orders, selectedOrderId]);

  // Auto set cash tendered to exact amount when selected
  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setCashTendered('');
    setPaymentError(null);
    setUpiRef('');
    setCardAuth('');
    setSplitCashAmount('');
    setSplitUpiAmount('');
  };

  // Change Calculation for Cash
  const finalAmount = selectedOrder?.finalAmount ?? 0;
  const tenderedNum = Number(cashTendered) || 0;
  const changeReturned = tenderedNum > finalAmount ? Math.round((tenderedNum - finalAmount) * 100) / 100 : 0;

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      let splits = undefined;
      let transactionReference = undefined;

      if (paymentMethod === 'CASH') {
        if (tenderedNum > 0 && tenderedNum < finalAmount) {
          throw new Error(`Tendered cash (₹${tenderedNum}) is less than total amount (₹${finalAmount})`);
        }
      } else if (paymentMethod === 'UPI') {
        transactionReference = upiRef.trim() || `UPI/${Math.random().toString().slice(2, 14)}`;
      } else if (paymentMethod === 'CARD') {
        transactionReference = cardAuth.trim() || `CARD/AUTH-${Math.random().toString().slice(2, 8)}`;
      } else if (paymentMethod === 'SPLIT') {
        const cVal = Number(splitCashAmount) || 0;
        const uVal = Number(splitUpiAmount) || 0;
        if (Math.abs(cVal + uVal - finalAmount) > 0.05) {
          throw new Error(`Split sum (₹${cVal + uVal}) does not equal total amount (₹${finalAmount})`);
        }
        splits = [
          { method: 'CASH' as const, amount: cVal },
          { method: 'UPI' as const, amount: uVal, reference: upiRef || 'UPI/SPLIT' },
        ];
      }

      const res = await api.processOrderPayment(selectedOrder.id, {
        amount: finalAmount,
        method: paymentMethod,
        splits,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        tenderedAmount: paymentMethod === 'CASH' && tenderedNum > 0 ? tenderedNum : undefined,
        transactionReference,
      });

      setPaidInvoiceModal({
        invoiceNumber: res.invoice.invoiceNumber,
        tokenNumber: res.order.tokenNumber,
        amount: res.invoice.totalAmount,
        paymentMethod: res.invoice.paymentMethod,
        receiptText: res.printJob.payload,
      });

      // Clear selection
      setSelectedOrderId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment submission failed';
      setPaymentError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      await api.refundOrCancelOrder(selectedOrder.id, {
        userId: currentUser.id,
        userName: currentUser.name,
        reason: cancelReason.trim() || 'Cashier counter cancellation',
      });
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedOrderId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed';
      setPaymentError(msg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
            Cashier Billing Terminal
          </h1>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
            <span>Cashier: {currentUser.name}</span>
            <span aria-hidden="true">·</span>
            <span>Billing Counter 1</span>
            <span aria-hidden="true">·</span>
            <span>Automatic GST Tax Invoicing (80mm)</span>
          </div>
        </div>

        {/* Token Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            placeholder="Search by Token (e.g. T-001 or 1)..."
            className="w-full bg-white border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm font-mono"
          />
          {searchToken && (
            <button
              onClick={() => setSearchToken('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {paymentError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{paymentError}</span>
          <button onClick={() => setPaymentError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Column (Unpaid Queue), Right Column (Order Invoice & Payment) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Left Column: Order Queue (4 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 shadow-xs p-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900">Orders Queue</h2>
              <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.2 rounded font-mono font-semibold">
                {filteredOrders.length}
              </span>
            </div>

            {/* Segmented Filter */}
            <div className="flex items-center p-0.5 bg-stone-100 rounded text-xs">
              <button
                onClick={() => setFilterTab('UNPAID')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterTab === 'UNPAID' ? 'bg-white font-semibold shadow-xs text-stone-900' : 'text-stone-500'
                }`}
              >
                Unpaid
              </button>
              <button
                onClick={() => setFilterTab('PAID')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterTab === 'PAID' ? 'bg-white font-semibold shadow-xs text-stone-900' : 'text-stone-500'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setFilterTab('ALL')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterTab === 'ALL' ? 'bg-white font-semibold shadow-xs text-stone-900' : 'text-stone-500'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* List of Orders */}
          <div className="divide-y divide-stone-100 max-h-[560px] overflow-y-auto mt-2">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <FileText className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="text-xs">No orders found.</p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isSelected = selectedOrder?.id === order.id;
                const isPaid = order.paymentStatus === 'PAID';
                const isCancelled = order.status === 'CANCELLED';

                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`p-3 cursor-pointer rounded-lg transition-all my-1 ${
                      isSelected
                        ? 'bg-amber-50/80 border border-amber-300 ring-1 ring-amber-300'
                        : 'hover:bg-stone-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold font-mono text-stone-900">
                          {order.tokenNumber}
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <span className="text-sm font-bold font-mono text-stone-900 tabular-nums">
                        ₹{order.finalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-xs text-stone-500">
                      <span className="truncate max-w-[200px]">
                        {order.items.map(i => i.productName).join(', ')}
                      </span>

                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCancelled
                            ? 'bg-stone-200 text-stone-600'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {isPaid ? 'PAID' : isCancelled ? 'CANCELLED' : 'UNPAID'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Order Checkout & Payment Processing (7 cols) */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-5">
              {/* Header of selected order */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-stone-900 text-amber-400 rounded-lg font-mono font-black text-xl">
                    {selectedOrder.tokenNumber}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-stone-900">
                      Order Details #{selectedOrder.id.slice(-6)}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>Taken by {selectedOrder.createdByName}</span>
                      <span aria-hidden="true">·</span>
                      <span>Kitchen Status: <strong>{selectedOrder.status}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedOrder.paymentStatus !== 'PAID' && selectedOrder.status !== 'CANCELLED' && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="text-xs text-stone-400 hover:text-red-600 px-2.5 py-1 rounded border border-stone-200 hover:border-red-300 transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Itemized Breakdown
                </div>
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5 text-right">Qty/Weight</th>
                        <th className="p-2.5 text-right">Rate</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800 font-mono tabular-nums">
                      {selectedOrder.items.map(item => {
                        const isWeight = item.unit === 'kg';
                        const qtyStr = isWeight
                          ? item.quantity < 1
                            ? `${Math.round(item.quantity * 1000)}g`
                            : `${item.quantity}kg`
                          : `${item.quantity} ${item.unit}`;

                        return (
                          <tr key={item.id} className="hover:bg-stone-50">
                            <td className="p-2.5 font-sans">
                              <span className="font-medium text-stone-900">{item.productName}</span>
                              {item.specialInstructions && (
                                <p className="text-[10px] text-amber-700 font-sans mt-0.5">
                                  {item.specialInstructions}
                                </p>
                              )}
                            </td>
                            <td className="p-2.5 text-right">{qtyStr}</td>
                            <td className="p-2.5 text-right">₹{item.unitPrice}</td>
                            <td className="p-2.5 text-right font-bold">₹{item.totalPrice.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal, Tax, Final Amount */}
                <div className="mt-3 p-3 bg-stone-50 rounded-lg space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal</span>
                    <span className="font-mono tabular-nums text-stone-900">₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST (2.5%)</span>
                    <span className="font-mono tabular-nums text-stone-900">₹{(selectedOrder.totalTax / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (2.5%)</span>
                    <span className="font-mono tabular-nums text-stone-900">₹{(selectedOrder.totalTax / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Net Amount Due</span>
                    <span className="font-mono tabular-nums text-amber-800 text-lg">
                      ₹{selectedOrder.finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Section (if UNPAID) */}
              {selectedOrder.paymentStatus === 'UNPAID' && selectedOrder.status !== 'CANCELLED' ? (
                <div className="pt-2 border-t border-stone-200">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                    Select Payment Method
                  </div>

                  {/* Payment Method Switcher Tabs */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { id: 'CASH', label: 'Cash', icon: Banknote },
                      { id: 'UPI', label: 'UPI QR', icon: QrCode },
                      { id: 'CARD', label: 'Card', icon: CreditCard },
                      { id: 'SPLIT', label: 'Split', icon: Split },
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isSel = paymentMethod === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPaymentMethod(tab.id as PaymentMethod)}
                          className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            isSel
                              ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-600 shadow-xs'
                              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* CASH Mode: Tendered & Change calculator */}
                  {paymentMethod === 'CASH' && (
                    <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">
                          Quick Cash Denomination Buttons:
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {[
                            { label: 'Exact', val: finalAmount },
                            { label: '₹100', val: 100 },
                            { label: '₹200', val: 200 },
                            { label: '₹500', val: 500 },
                            { label: '₹1000', val: 1000 },
                            { label: '₹2000', val: 2000 },
                          ].map(d => (
                            <button
                              key={d.label}
                              type="button"
                              onClick={() => setCashTendered(String(d.val))}
                              className="py-1.5 bg-white border border-stone-200 hover:border-amber-500 rounded text-xs font-mono font-medium text-stone-800 transition-colors shadow-2xs"
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-xs font-medium text-stone-600 block mb-1">
                            Amount Tendered (₹):
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            placeholder={String(finalAmount)}
                            className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-stone-600 block mb-1">
                            Change to Return:
                          </label>
                          <div className="bg-stone-200/80 rounded px-3 py-2 text-sm font-mono font-black text-emerald-800">
                            ₹{changeReturned.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Mode: Dynamic QR Code simulation */}
                  {paymentMethod === 'UPI' && (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-white border border-stone-300 rounded-lg p-2 flex flex-col items-center justify-center shadow-xs shrink-0">
                          <QrCode className="w-16 h-16 text-stone-800" />
                          <span className="text-[9px] text-stone-400 font-mono mt-0.5">BHIM UPI</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-stone-900">Scan to Pay via Any UPI App</p>
                          <p className="text-stone-500 font-mono text-[11px]">VPA: mithaiflow@okhdfcbank</p>
                          <p className="text-stone-500 font-mono text-[11px]">Ref Token: {selectedOrder.tokenNumber}</p>
                          <p className="text-xs font-bold text-amber-800 font-mono">Amount: ₹{finalAmount.toFixed(2)}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-stone-600 block mb-1">
                          UPI UTR / Reference ID (Optional):
                        </label>
                        <input
                          type="text"
                          value={upiRef}
                          onChange={(e) => setUpiRef(e.target.value)}
                          placeholder="e.g. 429104829102 or leave blank for auto"
                          className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* CARD Mode */}
                  {paymentMethod === 'CARD' && (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                      <p className="text-xs text-stone-600">
                        Swipe or tap customer card on EDC POS Terminal for <strong>₹{finalAmount.toFixed(2)}</strong>.
                      </p>
                      <div>
                        <label className="text-xs font-medium text-stone-600 block mb-1">
                          Card Approval Code / Last 4 Digits:
                        </label>
                        <input
                          type="text"
                          value={cardAuth}
                          onChange={(e) => setCardAuth(e.target.value)}
                          placeholder="e.g. AUTH-4829 or Card 4402"
                          className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* SPLIT Mode */}
                  {paymentMethod === 'SPLIT' && (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                      <p className="text-xs text-stone-600">
                        Split payment between Cash and UPI. Total must equal <strong>₹{finalAmount.toFixed(2)}</strong>.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-stone-600 block mb-1">Cash Part (₹):</label>
                          <input
                            type="number"
                            value={splitCashAmount}
                            onChange={(e) => setSplitCashAmount(e.target.value)}
                            placeholder="e.g. 200"
                            className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-stone-600 block mb-1">UPI Part (₹):</label>
                          <input
                            type="number"
                            value={splitUpiAmount}
                            onChange={(e) => setSplitUpiAmount(e.target.value)}
                            placeholder={String(Math.max(0, finalAmount - (Number(splitCashAmount) || 0)))}
                            className="w-full bg-white border border-stone-300 rounded px-3 py-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complete Payment Button */}
                  <button
                    onClick={handleProcessPayment}
                    disabled={isProcessing}
                    className="w-full mt-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <span>Recording Payment &amp; Printing Invoice...</span>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" />
                        <span>COLLECT ₹{finalAmount.toFixed(2)} &amp; PRINT TAX INVOICE</span>
                      </>
                    )}
                  </button>
                </div>
              ) : selectedOrder.paymentStatus === 'PAID' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold">Paid in Full</p>
                      <p className="text-[11px] text-emerald-700 font-mono">Invoice #{selectedOrder.invoiceId || 'INV-COMPLETED'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Lookup invoice or print job
                      openThermalReceipt({
                        title: `Tax Invoice - ${selectedOrder.tokenNumber}`,
                        text: `TAX INVOICE\nToken: ${selectedOrder.tokenNumber}\nAmount: ₹${selectedOrder.finalAmount.toFixed(2)}\nStatus: PAID`,
                        paperWidth: '80mm',
                        tokenNumber: selectedOrder.tokenNumber,
                        jobType: 'TAX_INVOICE',
                      });
                    }}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View / Reprint Invoice</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 text-xs text-center">
                  This order was cancelled or refunded.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 p-16 text-center text-stone-400">
              <FileText className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-600">No Order Selected</p>
              <p className="text-xs text-stone-400 mt-1">Select any unpaid token from the left queue to begin billing.</p>
            </div>
          )}
        </div>
      </div>

      {/* PAID INVOICE CONFIRMATION POPUP */}
      {paidInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-stone-200">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <p className="text-xs uppercase tracking-wider font-semibold text-stone-400">
              Payment Successfully Recorded
            </p>
            <h3 className="text-xl font-black text-stone-900 font-mono mt-1">
              Invoice #{paidInvoiceModal.invoiceNumber}
            </h3>

            <div className="my-3 py-2 px-4 bg-stone-50 rounded-lg border border-stone-200 inline-block font-mono text-xs text-stone-700">
              Token: <strong>{paidInvoiceModal.tokenNumber}</strong> · Amount: <strong>₹{paidInvoiceModal.amount.toFixed(2)}</strong> ({paidInvoiceModal.paymentMethod})
            </div>

            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Tax invoice has been automatically dispatched to the billing counter thermal printer (80mm).
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  openThermalReceipt({
                    title: `Tax Invoice - ${paidInvoiceModal.invoiceNumber}`,
                    text: paidInvoiceModal.receiptText,
                    paperWidth: '80mm',
                    tokenNumber: paidInvoiceModal.tokenNumber,
                    jobType: 'TAX_INVOICE',
                  });
                }}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-stone-600" />
                <span>View Thermal Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setPaidInvoiceModal(null)}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL / REFUND MODAL */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">
              Cancel Order {selectedOrder.tokenNumber}?
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              This will update the order status and record an immutable cancellation entry in the audit log.
            </p>

            <div className="mt-3">
              <label className="text-xs font-medium text-stone-700 block mb-1">
                Reason for Cancellation:
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer changed mind, incorrect item..."
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 border border-stone-300 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
