import React, { useState } from 'react';
import {
  X,
  Store,
  Receipt,
  Scale,
  CreditCard,
  Percent,
  Split,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ProductOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductOverviewModal: React.FC<ProductOverviewModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'weights' | 'billing' | 'receipts'>('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 border-b border-stone-800 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block" />
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                Product &amp; Architecture Overview
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full font-mono">
                v2.4 Production Spec
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Sheetal Gajak Kulfi POS &amp; Billing System</span>
            </h2>
            <p className="text-xs text-stone-400 mt-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-stone-400" />
              <span>Opposite High Court, Shivaji Nagar, Indore, Madhya Pradesh 452003</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            title="Close Overview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-stone-200 bg-stone-100 px-5 pt-2 gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'architecture', label: '1. Store Architecture & RBAC', icon: Layers },
            { id: 'weights', label: '2. Multi-Pack Weight Model', icon: Scale },
            { id: 'billing', label: '3. GST & Cashier Terminal', icon: CreditCard },
            { id: 'receipts', label: '4. Dual Thermal Print Queue', icon: Printer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border-t border-x ${
                  isActive
                    ? 'bg-white text-stone-900 border-stone-300 -mb-px font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 border-transparent hover:bg-stone-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800 text-xs sm:text-sm">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                <h3 className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Purpose &amp; High-Velocity Retail Workflow</span>
                </h3>
                <p className="text-stone-700 text-xs leading-relaxed">
                  Engineered specifically for the high-volume sweet shop rush at <strong>Sheetal Gajak Kulfi</strong> in Indore.
                  The system isolates order taking from payment collection to prevent queue bottlenecks, guaranteeing instant token generation
                  at the counter and fast settlement at the cashier desk.
                </p>
              </div>

              {/* 3 Steps Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center mb-3">
                    1
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs mb-1">Order POS Counter</h4>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Counter clerk weighs Gajak/Kulfi, selects pack counts (e.g. 2 packs × 500g), and taps <strong>Confirm Order</strong>.
                    Instantly prints a compact 2-inch token slip.
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center mb-3">
                    2
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs mb-1">Queue &amp; Handover</h4>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Customer receives Token # (e.g. #A-012). Kitchen and packing team prepare exact pack counts without seeing sensitive prices or tax calculations.
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mb-3">
                    3
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs mb-1">Cashier Billing POS</h4>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Cashier selects token, enters optional discount (% or ₹), records 1-tap payment (Cash, UPI, Card, Split), and prints the 3-inch Tax Invoice.
                  </p>
                </div>
              </div>

              {/* RBAC Roles Summary */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-stone-100 px-4 py-2.5 font-bold text-xs text-stone-700 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-stone-500" />
                  <span>Role-Based Access Control (RBAC) Architecture</span>
                </div>
                <div className="divide-y divide-stone-100 text-xs">
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] mr-2">
                        Order POS Staff
                      </span>
                      <span className="text-stone-600">Restricted strictly to the Order POS terminal. Cannot see billing revenue, discounts, or tax splits.</span>
                    </div>
                  </div>
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] mr-2">
                        Cashier / Biller
                      </span>
                      <span className="text-stone-600">Full billing access to collect payments, apply discounts, issue 3-inch invoices, and switch to Order POS when needed.</span>
                    </div>
                  </div>
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] mr-2">
                        Store Admin
                      </span>
                      <span className="text-stone-600">Complete administrative command: live audit logs, daily sales analytics, printer queue monitoring, and settings.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-PACK WEIGHT MODEL */}
          {activeTab === 'weights' && (
            <div className="space-y-6">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-700" />
                  <span>The Problem It Solves: Packaging Discrepancy Prevention</span>
                </h3>
                <p className="text-stone-700 text-xs leading-relaxed">
                  In sweet shops, when a customer asks for <em>"two boxes of 500g Gajak"</em>, traditional POS systems incorrectly merge them into <em>"1 kg"</em>.
                  As a result, the packaging staff packs a single 1kg tin or cardboard box instead of two distinct 500g gift boxes.
                </p>
              </div>

              {/* Visual Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2">
                  <div className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                    <span>❌ Traditional Defective Approach</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Customer wants: 2 packs of 500g.<br />
                    System saves: Weight = 1.0 kg (Pack count = 1).<br />
                    <strong>Result:</strong> Packer packs 1 big 1kg box. Customer complains and packing must be redone.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✓ Sheetal Gajak Multi-Pack Architecture</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Customer wants: 2 packs of 500g.<br />
                    System maintains: <strong>Pack Count = 2, Unit Weight = 500g</strong>.<br />
                    Display: <code>2 Packs × 500g each</code>.<br />
                    <strong>Result:</strong> Kitchen packs two exact 500g boxes with correct label and sticker.
                  </p>
                </div>
              </div>

              {/* Calculation Rules */}
              <div className="p-4 bg-stone-900 text-stone-100 rounded-xl font-mono text-xs space-y-2">
                <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  Internal Cart Calculation Formula
                </div>
                <div className="text-stone-300">
                  unitPricePerKg = ₹500 (inclusive of GST)
                </div>
                <div className="text-stone-300">
                  packWeightKg = 0.5 kg (500g)
                </div>
                <div className="text-stone-300">
                  packCount = 2
                </div>
                <div className="text-emerald-400 pt-1 border-t border-stone-800">
                  lineTotal = packCount × (packWeightKg × unitPricePerKg) = 2 × (0.5 × 500) = ₹500.00
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BILLING & GST */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                <h3 className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-700" />
                  <span>GST Inclusive Pricing (Breakdown ONLY in Cashier Bill)</span>
                </h3>
                <p className="text-stone-700 text-xs leading-relaxed">
                  All menu rates are 100% inclusive of 5% Goods and Services Tax (GST).
                  Customers see simple, rounded prices without confusing tax additions at the counter.
                  Only when the Cashier issues the 3-inch invoice does the system reverse-calculate the exact 2.5% CGST + 2.5% SGST breakdown.
                </p>
              </div>

              {/* Reverse Tax Math Card */}
              <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-600">
                  Reverse GST Calculation Standard (5% GST Rate)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Gross / Net Paid</span>
                    <span className="font-mono font-bold text-sm text-stone-900">₹1,050.00</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Taxable Value (Net / 1.05)</span>
                    <span className="font-mono font-bold text-sm text-stone-900">₹1,000.00</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">CGST @ 2.5%</span>
                    <span className="font-mono font-bold text-sm text-amber-700">₹25.00</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">SGST @ 2.5%</span>
                    <span className="font-mono font-bold text-sm text-amber-700">₹25.00</span>
                  </div>
                </div>
              </div>

              {/* Simplified Payment Modes & Split Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-stone-200 rounded-xl bg-white space-y-2">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-stone-700" />
                    <span>Streamlined One-Tap Payment Modes</span>
                  </h4>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Removed redundant card numbers, CVVs, and QR scanners. Cashier simply taps <strong>Cash</strong>, <strong>UPI</strong> (soundbox scan), or <strong>Card</strong> (EDC swipe).
                  </p>
                </div>

                <div className="p-4 border border-stone-200 rounded-xl bg-white space-y-2">
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <Split className="w-4 h-4 text-stone-700" />
                    <span>Auto-Filling Split Payment Columns</span>
                  </h4>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    When customer pays partly in Cash and partly via UPI, typing the cash amount automatically calculates and auto-fills the remaining balance in the UPI column.
                  </p>
                </div>
              </div>

              {/* Discount Engine */}
              <div className="p-4 border border-stone-200 rounded-xl bg-white space-y-2">
                <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-stone-700" />
                  <span>Dual Discount Engine (Percent % or Direct Amount ₹)</span>
                </h4>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Cashiers can enter a percentage discount (e.g. 5% or 10%) or a flat rupee deduction (e.g. ₹50).
                  The net payable is updated immediately and GST is reverse-calculated on the discounted total.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: THERMAL PRINT QUEUE */}
          {activeTab === 'receipts' && (
            <div className="space-y-6">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                <h3 className="font-bold text-stone-900 text-sm mb-1 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-700" />
                  <span>Dual Thermal Printer Architecture (Sequential Spooling Queue)</span>
                </h3>
                <p className="text-stone-700 text-xs leading-relaxed">
                  The counter hardware consists of two dedicated thermal printers connected over USB/Network.
                  Both receipts are spooled in an asynchronous FIFO queue so they print one after another without paper collision.
                </p>
              </div>

              {/* Side by side comparison of both slips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 2-inch Slip */}
                <div className="p-4 rounded-xl border border-stone-300 bg-stone-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-3">
                      <span className="font-bold text-stone-900 text-xs">2-Inch (5.08mm / 58mm) Slip</span>
                      <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">Kitchen / Handover</span>
                    </div>
                    <ul className="space-y-2 text-xs text-stone-600">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Large Token Number:</strong> Dominant <code>#A-042</code> for customer calling.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Pack Breakdown:</strong> Clear pack counts (e.g. <code>2 Packs × 500g</code>).</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Short &amp; Fast:</strong> No price, no tax, no total. Conserves thermal paper.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 p-2.5 bg-white border border-dashed border-stone-300 rounded font-mono text-[10px] text-stone-700">
                    <div className="text-center font-bold">SHEETAL GAJAK KULFI</div>
                    <div className="text-center text-[9px] text-stone-500">INDORE</div>
                    <div className="text-center font-black text-sm my-1">TOKEN: #A-024</div>
                    <div className="border-t border-stone-200 pt-1">
                      [ ] 1. SHAHI TIL GAJAK (2 Packs × 500g)
                    </div>
                  </div>
                </div>

                {/* 3-inch Cashier Bill */}
                <div className="p-4 rounded-xl border border-stone-300 bg-stone-50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-3">
                      <span className="font-bold text-stone-900 text-xs">3-Inch (80mm / 48 cols) Bill</span>
                      <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">Cashier Tax Invoice</span>
                    </div>
                    <ul className="space-y-2 text-xs text-stone-600">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Whole Order Details:</strong> Complete itemized table with HSN codes &amp; rates.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>5% Inclusive GST:</strong> Taxable value + CGST 2.5% + SGST 2.5%.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Discounts &amp; Tender:</strong> Net amount, discount applied, and mode of payment.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 p-2.5 bg-white border border-dashed border-stone-300 rounded font-mono text-[10px] text-stone-700">
                    <div className="text-center font-bold">SHEETAL GAJAK KULFI</div>
                    <div className="text-center text-[9px] text-stone-500">Opp. High Court, Shivaji Nagar, Indore</div>
                    <div className="text-center font-bold my-0.5">TAX INVOICE - 3 INCH</div>
                    <div className="border-t border-stone-200 pt-0.5 flex justify-between">
                      <span>Gross Total:</span>
                      <span>₹500.00</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Taxable Goods:</span>
                      <span>₹476.19</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>CGST (2.5%) + SGST (2.5%):</span>
                      <span>₹23.81</span>
                    </div>
                    <div className="border-t border-stone-200 pt-0.5 flex justify-between font-bold">
                      <span>NET AMOUNT PAID:</span>
                      <span>₹500.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-stone-500 hidden sm:block">
            Sheetal Gajak Kulfi · Indore POS &amp; Billing Terminal System
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
