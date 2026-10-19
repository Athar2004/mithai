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
  Percent,
  Check,
  Smartphone,
} from 'lucide-react';

export const BillingTerminal: React.FC = () => {
  const { orders, currentUser, settings, openThermalReceipt } = useApp();

  const [searchToken, setSearchToken] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'UNPAID' | 'PAID' | 'ALL'>('UNPAID');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Discount States (Percent % or Direct Amount ₹)
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountInput, setDiscountInput] = useState<string>('');

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
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
    const firstUnpaid = orders.find(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED');
    return firstUnpaid || null;
  }, [orders, selectedOrderId]);

  // Gross Amount (Inclusive of GST)
  const grossSubtotal = selectedOrder?.subtotal ?? selectedOrder?.finalAmount ?? 0;

  // Discount Calculation
  const discountValue = Number(discountInput) || 0;
  const discountAmount = useMemo(() => {
    if (discountValue <= 0 || !selectedOrder) return 0;
    if (discountType === 'PERCENT') {
      const pct = Math.min(100, Math.max(0, discountValue));
      return Math.round((grossSubtotal * (pct / 100)) * 100) / 100;
    } else {
      return Math.min(grossSubtotal, Math.round(discountValue * 100) / 100);
    }
  }, [discountValue, discountType, grossSubtotal, selectedOrder]);

  // Net Payable Amount
  const netPayable = useMemo(() => {
    if (!selectedOrder) return 0;
    return Math.max(0, Math.round((grossSubtotal - discountAmount) * 100) / 100);
  }, [grossSubtotal, discountAmount, selectedOrder]);

  // Reverse 5% Inclusive GST Calculation (GST ONLY IN CASHIER BILL)
  const taxableGoods = Math.round((netPayable / 1.05) * 100) / 100;
  const totalGst = Math.round((netPayable - taxableGoods) * 100) / 100;
  const cgstAmt = Math.round((totalGst / 2) * 100) / 100;
  const sgstAmt = Math.round((totalGst - cgstAmt) * 100) / 100;

  // Change Calculation for Cash
  const tenderedNum = Number(cashTendered) || 0;
  const changeReturned = (paymentMethod === 'CASH' && tenderedNum > netPayable)
    ? Math.round((tenderedNum - netPayable) * 100) / 100
    : 0;

  // Auto set cash tendered to exact amount when selected
  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setCashTendered('');
    setPaymentError(null);
    setDiscountInput('');
    setDiscountType('PERCENT');
    setSplitCashAmount('');
    setSplitUpiAmount('');
  };

  // Split payment auto-calculating columns:
  // When user types in Cash, UPI auto-fills with remaining balance
  const handleSplitCashChange = (val: string) => {
    setSplitCashAmount(val);
    if (val === '') {
      setSplitUpiAmount(String(netPayable));
    } else {
      const num = Number(val) || 0;
      const rem = Math.max(0, Math.round((netPayable - num) * 100) / 100);
      setSplitUpiAmount(String(rem));
    }
  };

  // When user types in UPI, Cash auto-fills with remaining balance
  const handleSplitUpiChange = (val: string) => {
    setSplitUpiAmount(val);
    if (val === '') {
      setSplitCashAmount(String(netPayable));
    } else {
      const num = Number(val) || 0;
      const rem = Math.max(0, Math.round((netPayable - num) * 100) / 100);
      setSplitCashAmount(String(rem));
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      let splits = undefined;
      let transactionReference = undefined;

      if (paymentMethod === 'CASH') {
        if (tenderedNum > 0 && tenderedNum < netPayable) {
          throw new Error(`Tendered cash (₹${tenderedNum}) is less than net payable (₹${netPayable})`);
        }
        transactionReference = tenderedNum > 0
          ? `Tendered: ₹${tenderedNum.toFixed(2)}, Change: ₹${changeReturned.toFixed(2)}`
          : 'Exact Cash';
      } else if (paymentMethod === 'UPI') {
        transactionReference = 'UPI Store Standee Scan';
      } else if (paymentMethod === 'CARD') {
        transactionReference = 'EDC Card Terminal POS';
      } else if (paymentMethod === 'SPLIT') {
        const cVal = Number(splitCashAmount) || 0;
        const uVal = Number(splitUpiAmount) || 0;
        if (Math.abs(cVal + uVal - netPayable) > 0.05) {
          throw new Error(`Split sum (₹${cVal + uVal}) does not equal net amount (₹${netPayable})`);
        }
        splits = [
          { method: 'CASH' as const, amount: cVal },
          { method: 'UPI' as const, amount: uVal },
        ];
        transactionReference = `Cash ₹${cVal.toFixed(2)} + UPI ₹${uVal.toFixed(2)}`;
      }

      const res = await api.processOrderPayment(selectedOrder.id, {
        amount: netPayable,
        discountAmount,
        method: paymentMethod,
        splits,
        cashierId: currentUser?.id || 'usr_cashier',
        cashierName: currentUser?.name || 'Cashier Counter',
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
        userId: currentUser?.id || 'usr_cashier',
        userName: currentUser?.name || 'Cashier',
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
            <span>Cashier: {currentUser?.name || 'Cashier'}</span>

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
                      <span>Order Status: <strong>{selectedOrder.status}</strong></span>
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
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-right">Packing / Qty</th>
                        <th className="p-2.5 text-right">Rate</th>
                        <th className="p-2.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800 font-mono tabular-nums">
                      {selectedOrder.items.map(item => {
                        let qtyStr = `${item.quantity} ${item.unit}`;
                        let packNote = '';

                        if (item.packCount && item.packCount > 1 && item.packWeightKg) {
                          const wtStr = item.packWeightKg < 1 ? `${Math.round(item.packWeightKg * 1000)}g` : `${item.packWeightKg}kg`;
                          qtyStr = `${item.packCount} Pk`;
                          packNote = `${item.packCount} Packs × ${wtStr} each`;
                        } else if (item.packWeightKg) {
                          const wtStr = item.packWeightKg < 1 ? `${Math.round(item.packWeightKg * 1000)}g` : `${item.packWeightKg}kg`;
                          qtyStr = `1 Pk`;
                          packNote = `${wtStr} pack`;
                        } else if (item.packCount && item.packCount > 1) {
                          qtyStr = `${item.packCount} Pcs`;
                        }

                        return (
                          <tr key={item.id} className="hover:bg-stone-50">
                            <td className="p-2.5 font-sans">
                              <span className="font-semibold text-stone-900">{item.productName}</span>
                              {item.hindiName && (
                                <span className="text-[11px] text-stone-400 block font-normal">
                                  {item.hindiName}
                                </span>
                              )}
                              {packNote && (
                                <span className="text-[10px] text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 inline-block font-mono mt-0.5">
                                  {packNote}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-medium">{qtyStr}</td>
                            <td className="p-2.5 text-right text-stone-600">₹{item.unitPrice}</td>
                            <td className="p-2.5 text-right font-bold text-stone-900">₹{item.totalPrice.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Discount Option - Percent (%) or Direct Amount (₹) Entry */}
                <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-amber-700" />
                      <span>Discount Option:</span>
                    </span>
                    {discountAmount > 0 && (
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        -₹{discountAmount.toFixed(2)} Discount Applied
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mode Toggle Button */}
                    <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-white shrink-0 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setDiscountType('PERCENT')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          discountType === 'PERCENT'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Percent (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('FLAT')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          discountType === 'FLAT'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Direct Amount (₹)
                      </button>
                    </div>

                    {/* Discount Input Field */}
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'PERCENT' ? 100 : grossSubtotal}
                        step={discountType === 'PERCENT' ? 1 : 10}
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        placeholder={discountType === 'PERCENT' ? 'Enter % (e.g. 5 or 10)' : 'Enter Flat Amount (e.g. 50)'}
                        className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>

                    {discountInput && (
                      <button
                        type="button"
                        onClick={() => setDiscountInput('')}
                        className="text-stone-400 hover:text-stone-700 p-1 text-xs cursor-pointer"
                        title="Clear discount"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-stone-500 font-medium">Presets:</span>
                    {[
                      { type: 'PERCENT' as const, val: 5, label: '5%' },
                      { type: 'PERCENT' as const, val: 10, label: '10%' },
                      { type: 'FLAT' as const, val: 20, label: '₹20' },
                      { type: 'FLAT' as const, val: 50, label: '₹50' },
                      { type: 'FLAT' as const, val: 100, label: '₹100' },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          setDiscountType(btn.type);
                          setDiscountInput(String(btn.val));
                        }}
                        className="px-2 py-0.5 bg-white border border-stone-200 hover:border-amber-400 text-stone-700 rounded text-[11px] font-mono transition-colors shadow-2xs cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtotal, Discount, Net Amount, and 5% Inclusive GST Breakdown */}
                <div className="mt-3 p-3.5 bg-stone-50 rounded-xl space-y-2 text-xs border border-stone-200">
                  <div className="flex justify-between text-stone-600">
                    <span>Gross Order Total (Incl. of GST)</span>
                    <span className="font-mono tabular-nums text-stone-900 font-semibold">₹{grossSubtotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount ({discountType === 'PERCENT' ? `${discountValue}%` : `Flat ₹${discountValue}`})</span>
                      <span className="font-mono tabular-nums font-bold">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                    <span>Net Amount Due</span>
                    <span className="font-mono tabular-nums text-amber-800 text-xl font-black">
                      ₹{netPayable.toFixed(2)}
                    </span>
                  </div>

                  {/* Inclusive 5% GST Breakdown (GST ONLY IN CASHIER BILL) */}
                  <div className="pt-2 border-t border-stone-200 space-y-1 text-[11px] text-stone-600 font-mono">
                    <div className="flex justify-between font-sans text-stone-700 font-bold text-xs pb-0.5">
                      <span>GST Breakdown (Inclusive 5% Rate):</span>
                      <span className="text-[10px] bg-stone-200/90 text-stone-700 px-1.5 py-0.2 rounded font-mono">Printed on 3" Bill</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxable Value of Goods:</span>
                      <span>₹{taxableGoods.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST (Central Tax @ 2.5%):</span>
                      <span>₹{cgstAmt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (State Tax @ 2.5%):</span>
                      <span>₹{sgstAmt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-800 pt-0.5 border-t border-stone-200">
                      <span>Total GST Amount (5.0%):</span>
                      <span>₹{totalGst.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section (if UNPAID) */}
              {selectedOrder.paymentStatus === 'UNPAID' && selectedOrder.status !== 'CANCELLED' ? (
                <div className="pt-2 border-t border-stone-200">
                  <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                    Mode of Payment (Select How Customer Paid)
                  </div>

                  {/* Payment Method Switcher Tabs */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { id: 'CASH', label: 'Cash', icon: Banknote },
                      { id: 'UPI', label: 'UPI', icon: Smartphone },
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
                          className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
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
                          Quick Cash Denominations:
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {[
                            { label: 'Exact', val: netPayable },
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
                              className="py-1.5 bg-white border border-stone-200 hover:border-amber-500 rounded text-xs font-mono font-medium text-stone-800 transition-colors shadow-2xs cursor-pointer"
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
                            placeholder={String(netPayable)}
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

                  {/* UPI Mode: Streamlined mode recording (No QR or VPA clutter) */}
                  {paymentMethod === 'UPI' && (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900 text-xs">Payment via UPI Transfer / Soundbox Scan</p>
                          <p className="text-stone-500 text-[11px]">
                            Customer scanned UPI standee or paid via soundbox. Net amount: <strong className="text-stone-900 font-mono">₹{netPayable.toFixed(2)}</strong>
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-400 font-sans border-t border-stone-200 pt-2">
                        Mode of payment will be recorded as <strong>UPI</strong> on the 3-inch Cashier Tax Bill.
                      </p>
                    </div>
                  )}

                  {/* CARD Mode: Streamlined mode recording (No card digits or auth code) */}
                  {paymentMethod === 'CARD' && (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900 text-xs">Payment via EDC Card POS Terminal</p>
                          <p className="text-stone-500 text-[11px]">
                            Card swiped or tapped on EDC machine for <strong className="text-stone-900 font-mono">₹{netPayable.toFixed(2)}</strong>.
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-400 font-sans border-t border-stone-200 pt-2">
                        Mode of payment will be recorded as <strong>CARD</strong> on the 3-inch Cashier Tax Bill.
                      </p>
                    </div>
                  )}

                  {/* SPLIT Mode: Auto-calculating remainder columns */}
                  {paymentMethod === 'SPLIT' && (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <p className="text-stone-600">
                          Split payment across Cash and UPI. Total: <strong className="text-stone-900 font-mono">₹{netPayable.toFixed(2)}</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const half = Math.round((netPayable / 2) * 100) / 100;
                            setSplitCashAmount(String(half));
                            setSplitUpiAmount(String(Math.round((netPayable - half) * 100) / 100));
                          }}
                          className="px-2 py-0.5 bg-white border border-stone-300 hover:border-amber-500 rounded text-[11px] font-semibold text-amber-900 transition-colors cursor-pointer shadow-2xs"
                        >
                          50 / 50 Split
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-stone-700 block mb-1">
                            Cash Part (₹):
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={netPayable}
                            step="1"
                            value={splitCashAmount}
                            onChange={(e) => handleSplitCashChange(e.target.value)}
                            placeholder="e.g. 200"
                            className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="text-[10px] text-stone-400 mt-0.5 block">Auto-calculates UPI column</span>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-stone-700 block mb-1">
                            UPI Part (₹):
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={netPayable}
                            step="1"
                            value={splitUpiAmount}
                            onChange={(e) => handleSplitUpiChange(e.target.value)}
                            placeholder="e.g. 300"
                            className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="text-[10px] text-stone-400 mt-0.5 block">Auto-calculates Cash column</span>
                        </div>
                      </div>

                      {/* Split Validation Indicator */}
                      {(() => {
                        const cVal = Number(splitCashAmount) || 0;
                        const uVal = Number(splitUpiAmount) || 0;
                        const sum = Math.round((cVal + uVal) * 100) / 100;
                        const diff = Math.round((netPayable - sum) * 100) / 100;
                        const isMatch = Math.abs(diff) < 0.05;

                        return (
                          <div className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between border ${
                            isMatch ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            <span>Split Sum: ₹{sum.toFixed(2)} / ₹{netPayable.toFixed(2)}</span>
                            <span className="font-bold">{isMatch ? '✓ Exact Match' : `Balance Remaining: ₹${diff.toFixed(2)}`}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Complete Payment Button */}
                  <button
                    onClick={handleProcessPayment}
                    disabled={isProcessing}
                    className="w-full mt-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {isProcessing ? (
                      <span>Recording Payment &amp; Printing Invoice...</span>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" />
                        <span>COLLECT ₹{netPayable.toFixed(2)} &amp; PRINT 3-INCH CASHIER BILL</span>
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
                    onClick={async () => {
                      let billText = '';
                      try {
                        const jobs = await api.fetchPrintJobs(50);
                        const match = jobs.find(j => j.orderId === selectedOrder.id && j.jobType === 'TAX_INVOICE');
                        if (match?.payload) {
                          billText = match.payload;
                        }
                      } catch {
                        // fallback
                      }
                      if (!billText) {
                        // Fallback 48-column generator
                        const now = new Date(selectedOrder.createdAt);
                        const dateFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                        const timeFormatted = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                        const taxable = Math.round((selectedOrder.finalAmount / 1.05) * 100) / 100;
                        const tax = Math.round((selectedOrder.finalAmount - taxable) * 100) / 100;
                        const halfTax = Math.round((tax / 2) * 100) / 100;

                        billText = [
                          '================================================',
                          '              SHEETAL GAJAK KULFI               ',
                          '       Opposite High Court, Shivaji Nagar       ',
                          '        Indore, Madhya Pradesh - 452003         ',
                          '         Phone: 0731-2524890 / 9826012345       ',
                          '    GSTIN: 23AABCS1429K1Z5 | FSSAI: 11421850000123',
                          '================================================',
                          '       TAX INVOICE / CASHIER BILL (3-INCH)      ',
                          '================================================',
                          `Invoice No : ${selectedOrder.invoiceId || 'INV-COMPLETED'}        Token : #${selectedOrder.tokenNumber}`,
                          `Date       : ${dateFormatted}            Time  : ${timeFormatted}`,
                          `Cashier    : ${selectedOrder.createdByName || 'Cashier Counter'}   Counter: ${selectedOrder.counterId || 'POS-1'}`,
                          'Sale Type  : Retail Counter Sale    Status : PAID IN FULL',
                          '------------------------------------------------',
                          '#  ITEM DESCRIPTION        QTY     RATE   AMOUNT(Rs)',
                          '------------------------------------------------',
                          ...selectedOrder.items.map((it, idx) => {
                            const sn = String(idx + 1).padStart(2, '0') + ' ';
                            const name = it.productName.slice(0, 19).padEnd(20);
                            const qtyStr = (it.packCount && it.packWeightKg ? `${it.packCount} Pk` : `${it.quantity}`).slice(0, 5).padStart(6);
                            const rate = it.unitPrice.toFixed(2).slice(0, 8).padStart(9);
                            const amt = it.totalPrice.toFixed(2).slice(0, 9).padStart(10);
                            const packNote = it.packCount && it.packWeightKg
                              ? `\n   [${it.packCount} Packs x ${it.packWeightKg < 1 ? `${Math.round(it.packWeightKg * 1000)}g` : `${it.packWeightKg}kg`} each]`
                              : '';
                            return `${sn}${name}${qtyStr}${rate}${amt}${packNote}`;
                          }),
                          '------------------------------------------------',
                          `Gross Order Total (Incl. GST):        Rs. ${selectedOrder.subtotal.toFixed(2).padStart(8)}`,
                          selectedOrder.totalDiscount > 0 ? `Discount Deducted:                   -Rs. ${selectedOrder.totalDiscount.toFixed(2).padStart(8)}` : '',
                          '================================================',
                          `NET AMOUNT DUE & PAID:               Rs. ${selectedOrder.finalAmount.toFixed(2).padStart(8)}`,
                          '================================================',
                          '---------------- GST SUMMARY (5.0%) ------------',
                          'Rate       Taxable Value    CGST(2.5%)    SGST(2.5%)',
                          `5% GST        Rs. ${taxable.toFixed(2).padStart(8)}     Rs. ${halfTax.toFixed(2).padStart(5)}     Rs. ${(tax - halfTax).toFixed(2).padStart(5)}`,
                          '------------------------------------------------',
                          `Total GST Included in Price:         Rs. ${tax.toFixed(2).padStart(8)}`,
                          '------------------------------------------------',
                          'PAYMENT SETTLEMENT:',
                          'Mode of Payment   : PAID IN FULL (COUNTER SETTLED)',
                          'Settlement Status : SUCCESS (VERIFIED)',
                          '================================================',
                          '   * Freshly crafted daily with pure Desi Ghee *  ',
                          '  * Goods once sold cannot be returned/exchanged *',
                          '',
                          '        Thank you for choosing Sheetal Gajak!   ',
                          '          Pure Indore Heritage Since 1984       ',
                          '        Opp. High Court, Shivaji Nagar, Indore  ',
                          '================================================',
                        ].filter(Boolean).join('\n');
                      }

                      openThermalReceipt({
                        title: `Tax Invoice - #${selectedOrder.tokenNumber}`,
                        text: billText,
                        paperWidth: '80mm',
                        tokenNumber: selectedOrder.tokenNumber,
                        jobType: 'TAX_INVOICE',
                      });
                    }}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View / Print 3-Inch Bill</span>
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

      {/* PAID INVOICE CONFIRMATION POPUP WITH EMBEDDED RECEIPT PREVIEW */}
      {paidInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 text-center shadow-2xl border border-stone-200 my-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <p className="text-xs uppercase tracking-widest font-bold text-emerald-800">
              Payment Confirmed &amp; Bill Generated
            </p>
            <h3 className="text-xl font-black text-stone-900 font-mono mt-0.5">
              Invoice #{paidInvoiceModal.invoiceNumber}
            </h3>

            <div className="my-2.5 py-1.5 px-3 bg-stone-100 rounded-lg border border-stone-200 inline-flex items-center gap-2 font-mono text-xs text-stone-700">
              <span>Token: <strong>#{paidInvoiceModal.tokenNumber}</strong></span>
              <span>·</span>
              <span>Amount: <strong className="text-emerald-800">₹{paidInvoiceModal.amount.toFixed(2)}</strong></span>
              <span>·</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-stone-300 text-[10px] font-bold text-stone-800">
                {paidInvoiceModal.paymentMethod}
              </span>
            </div>

            {/* Embedded Mini Thermal Preview */}
            <div className="my-3 text-left bg-stone-50 border border-stone-200 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[10.5px] leading-tight text-stone-800 select-text scrollbar-none shadow-inner">
              <pre className="whitespace-pre font-mono">
                {paidInvoiceModal.receiptText}
              </pre>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  openThermalReceipt({
                    title: `Tax Invoice - #${paidInvoiceModal.tokenNumber}`,
                    text: paidInvoiceModal.receiptText,
                    paperWidth: '80mm',
                    tokenNumber: paidInvoiceModal.tokenNumber,
                    jobType: 'TAX_INVOICE',
                  });
                }}
                className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Open &amp; Print 3-Inch Bill</span>
              </button>

              <button
                type="button"
                onClick={() => setPaidInvoiceModal(null)}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-stone-300"
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
