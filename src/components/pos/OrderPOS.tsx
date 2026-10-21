import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { Product, Order } from '../../types/index.ts';
import * as api from '../../lib/api.ts';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  UtensilsCrossed,
  CheckCircle2,
  X,
  Ticket,
  Eye,
  History,
  ShoppingCart,
  Receipt,
  ArrowRight,
  Loader2,
  Play,
  Check,
  ListOrdered,
  Info,
  Package,
} from 'lucide-react';

export const OrderPOS: React.FC = () => {
  const {
    categories,
    products,
    orders,
    printJobs,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    currentUser,
    openThermalReceipt,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showRecentOrdersModal, setShowRecentOrdersModal] = useState<boolean>(false);
  const [showOverviewModal, setShowOverviewModal] = useState<boolean>(false);

  // Order Summary Popup State (Toggle on side for mobile & POS)
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState<boolean>(false);

  // Variable-weight selection modal state with Multi-Pack Counter
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [selectedWeightKg, setSelectedWeightKg] = useState<number>(0.25);
  const [selectedPackCount, setSelectedPackCount] = useState<number>(1);
  const [customWeightGrams, setCustomWeightGrams] = useState<string>('');

  // Count selection modal state
  const [countModalProduct, setCountModalProduct] = useState<Product | null>(null);
  const [selectedCount, setSelectedCount] = useState<number>(1);

  const [confirmedOrderData, setConfirmedOrderData] = useState<{
    tokenNumber: string;
    orderId: string;
    amount: number;
    customerReceiptText: string;
    counterReceiptText: string;
  } | null>(null);

  // Sequential Thermal Print Queue State
  const [queueState, setQueueState] = useState<{
    isRunning: boolean;
    job1Status: 'waiting' | 'printing' | 'completed';
    job2Status: 'waiting' | 'printing' | 'completed';
    activeMessage: string;
    completed: boolean;
  }>({
    isRunning: false,
    job1Status: 'waiting',
    job2Status: 'waiting',
    activeMessage: 'Ready to print both 2-inch slips sequentially in queue',
    completed: false,
  });

  const runSequentialPrintQueue = async (customerText: string, counterText: string, tokenNo: string) => {
    try {
      setQueueState({
        isRunning: true,
        job1Status: 'printing',
        job2Status: 'waiting',
        activeMessage: `Printing Job 1 of 2: Customer Token Slip (50.8mm / 2-inch) - Token #${tokenNo}...`,
        completed: false,
      });

      // Preview/Send Job 1
      openThermalReceipt({
        title: `Customer Token Slip (2-Inch / 50.8mm) - Token ${tokenNo}`,
        secondaryTitle: `Order POS Dispatch Slip (2-Inch / 50.8mm)`,
        text: customerText,
        secondaryText: counterText,
        paperWidth: '58mm',
        secondaryPaperWidth: '58mm',
        tokenNumber: tokenNo,
        jobType: 'CUSTOMER_TOKEN',
        initialTab: 'primary',
      });

      // Sequential delay for printer cut & feed
      await new Promise((resolve) => setTimeout(resolve, 1400));

      setQueueState({
        isRunning: true,
        job1Status: 'completed',
        job2Status: 'printing',
        activeMessage: `Printing Job 2 of 2: Order POS Slip (50.8mm / 2-inch) - Token #${tokenNo}...`,
        completed: false,
      });

      // Preview/Send Job 2
      openThermalReceipt({
        title: `Customer Token Slip (2-Inch / 50.8mm) - Token ${tokenNo}`,
        secondaryTitle: `Order POS Dispatch Slip (2-Inch / 50.8mm)`,
        text: customerText,
        secondaryText: counterText,
        paperWidth: '58mm',
        secondaryPaperWidth: '58mm',
        tokenNumber: tokenNo,
        jobType: 'COUNTER_RECEIPT',
        initialTab: 'secondary',
      });

      await new Promise((resolve) => setTimeout(resolve, 1400));

      setQueueState({
        isRunning: false,
        job1Status: 'completed',
        job2Status: 'completed',
        activeMessage: `Queue Finished! Both 2-inch (50.8mm) receipts printed one after the other.`,
        completed: true,
      });
    } catch {
      setQueueState(prev => ({
        ...prev,
        isRunning: false,
        activeMessage: 'Print queue encountered an interruption.',
      }));
    }
  };

  // Filter products by category and search (Supports name, Hindi, barcode, alias, sku, HSN)
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter(p => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        query === '' ||
        p.name.toLowerCase().includes(query) ||
        (p.hindiName && p.hindiName.includes(query)) ||
        p.sku.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        (p.alias && p.alias.toLowerCase().includes(query)) ||
        (p.hsnCode && p.hsnCode.includes(query));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle clicking on a product card
  const handleProductClick = (product: Product) => {
    if (product.unit === 'kg') {
      setWeightModalProduct(product);
      setSelectedWeightKg(0.25); // Default to 250 grams
      setSelectedPackCount(1);
      setCustomWeightGrams('');
    } else {
      setCountModalProduct(product);
      setSelectedCount(1);
    }
  };

  const handleConfirmWeight = () => {
    if (!weightModalProduct) return;
    const finalKg = customWeightGrams && Number(customWeightGrams) > 0
      ? Number(customWeightGrams) / 1000
      : selectedWeightKg;

    if (finalKg <= 0) return;
    addToCart(weightModalProduct, {
      packWeightKg: finalKg,
      packCount: selectedPackCount,
      quantity: Math.round(finalKg * selectedPackCount * 1000) / 1000,
    });
    setWeightModalProduct(null);
    setSelectedPackCount(1);
  };

  const handleConfirmCount = () => {
    if (!countModalProduct || selectedCount <= 0) return;
    addToCart(countModalProduct, {
      packCount: selectedCount,
      quantity: selectedCount,
    });
    setCountModalProduct(null);
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorBanner(null);

    try {
      const payload = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          packWeightKg: item.packWeightKg,
          packCount: item.packCount,
        })),
        userId: currentUser?.id || 'usr_pos',
        userName: currentUser?.name || 'Order POS Staff',
        counterId: 'POS-1',
      };

      const result = await api.createOrder(payload);

      setConfirmedOrderData({
        tokenNumber: result.order.tokenNumber,
        orderId: result.order.id,
        amount: result.order.finalAmount,
        customerReceiptText: result.printJobs.customerToken?.payload || '',
        counterReceiptText: result.printJobs.kitchenTicket?.payload || '',
      });

      clearCart();
      setIsOrderSummaryOpen(false); // Close popup upon confirmation
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm order';
      setErrorBanner(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 relative">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
            Order-Taking POS Terminal
          </h1>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
            <span>Counter POS-1</span>
            <span aria-hidden="true">·</span>
            <span>Operator: {currentUser?.name || 'Order POS'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-800 font-medium">2-Inch (50.8mm) Slips: Short Token Slip &amp; Order POS Slip (Sequential Queue)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Product Overview Button */}
          <button
            type="button"
            onClick={() => setShowOverviewModal(true)}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="View Sheetal Gajak Kulfi product overview & architecture"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Product Overview</span>
            <span className="sm:hidden">Overview</span>
          </button>

          {/* Recent Orders & Receipts Button */}
          <button
            type="button"
            onClick={() => setShowRecentOrdersModal(true)}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-stone-200 shrink-0 cursor-pointer"
            title="View recent orders to reprint Customer Slip or Receipt"
          >
            <History className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Recent Orders &amp; Receipts</span>
            <span className="sm:hidden">Orders</span>
            {orders.length > 0 && (
              <span className="bg-amber-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                {orders.length}
              </span>
            )}
          </button>

          {/* Order Summary Trigger Button in Header */}
          <button
            type="button"
            onClick={() => setIsOrderSummaryOpen(true)}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shrink-0 cursor-pointer"
            title="Open Order Summary Popup"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Order Summary</span>
            {cart.length > 0 ? (
              <span className="bg-stone-950 text-amber-300 text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">
                {cart.length} · ₹{cartTotal.toFixed(0)}
              </span>
            ) : (
              <span className="bg-amber-700/80 text-amber-100 text-[10px] font-mono px-1.5 py-0.2 rounded">
                0
              </span>
            )}
          </button>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sweets, namkeen..."
              className="w-full bg-white border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {errorBanner && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Full-Width Product Showcase (No cramped grid; Summary is in popup!) */}
      <div className="mt-5 space-y-4">
        {/* Category Tabs (Segmented Button Bar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.filter(cat => cat.id !== 'all').map(cat => {
            const count = products.filter(p => p.categoryId === cat.id && p.isActive).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat.id ? 'bg-amber-900/60 text-amber-200' : 'bg-stone-100 text-stone-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredProducts.map(product => {
            const isWeight = product.unit === 'kg';
            const cartQty = cart
              .filter(ci => ci.product.id === product.id)
              .reduce((sum, ci) => sum + ci.quantity, 0);

            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-xl border border-stone-200 hover:border-amber-400 p-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md active:scale-[0.98] select-none group relative"
              >
                {/* Active in cart indicator badge */}
                {cartQty > 0 && (
                  <span className="absolute top-2 right-2 z-10 bg-amber-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {isWeight
                      ? cartQty < 1
                        ? `${Math.round(cartQty * 1000)}g`
                        : `${cartQty.toFixed(2)}kg`
                      : `${cartQty} pcs`}
                  </span>
                )}

                <div>
                  {/* Product Image Slot with Fallback */}
                  <div className="w-full aspect-4/3 rounded-lg bg-stone-100 overflow-hidden mb-2 relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400">
                        <UtensilsCrossed className="w-6 h-6 mb-1 text-stone-300" />
                        <span className="text-[10px] text-stone-400">Pure Mithai</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-xs font-semibold text-stone-900 line-clamp-1 group-hover:text-amber-700">
                    {product.name}
                  </h3>
                  {product.hindiName && (
                    <p className="text-[11px] text-stone-400 font-normal">{product.hindiName}</p>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900 font-mono tabular-nums">
                      ₹{product.pricePerUnit}
                    </span>
                    <span className="text-[11px] text-stone-500">/{product.unit}</span>
                  </div>
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                    {isWeight ? 'Weight' : 'Count'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-500">
            <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <p className="text-sm">No items found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FLOATING SIDE TOGGLE FOR ORDER SUMMARY (Visible on mobile & desktop POS) */}
      {/* ========================================================================= */}
      {/* 1. Edge Tab Toggle on the right side */}
      <button
        type="button"
        onClick={() => setIsOrderSummaryOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-stone-900 hover:bg-stone-800 text-white py-4 px-2.5 rounded-l-xl shadow-2xl flex flex-col items-center gap-2 transition-transform hover:-translate-x-1 cursor-pointer border-t border-b border-l border-amber-500/30 group"
        title="Open Order Summary Popup"
        aria-label="Open Order Summary Popup"
      >
        <ShoppingCart className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="text-[11px] font-bold font-mono bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded-full shadow-xs">
          {cart.length}
        </span>
        <span className="text-[10px] font-semibold tracking-wider uppercase [writing-mode:vertical-rl] rotate-180 text-stone-300 group-hover:text-white">
          Order Summary
        </span>
      </button>

      {/* 2. Floating Action Button on Bottom-Right for easy thumb tapping on Mobile/POS */}
      <button
        type="button"
        onClick={() => setIsOrderSummaryOpen(true)}
        className="fixed right-4 bottom-5 z-40 bg-amber-600 hover:bg-amber-500 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl border border-amber-400/40 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 cursor-pointer sm:hidden"
        title="Open Order Summary"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-stone-950 text-amber-400 font-bold font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-amber-600">
              {cart.length}
            </span>
          )}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold leading-tight">Order Summary</span>
          <span className="text-[11px] font-mono text-amber-100 font-semibold leading-tight">
            {cart.length > 0 ? `₹${cartTotal.toFixed(2)}` : 'Cart empty'}
          </span>
        </div>
      </button>

      {/* ========================================================================= */}
      {/* ORDER SUMMARY POPUP MODAL (SLIDE-OVER FROM SIDE - NEVER AT THE LAST/BOTTOM) */}
      {/* ========================================================================= */}
      {isOrderSummaryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsOrderSummaryOpen(false)}
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-over popup drawer */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-stone-200 animate-in slide-in-from-right duration-200">
            {/* Popup Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 leading-tight">Current Order Summary</h2>
                  <p className="text-xs text-stone-500 font-mono">
                    {cart.length} line {cart.length === 1 ? 'item' : 'items'} in cart
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOrderSummaryOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                  title="Close Summary Popup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cart Item List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-stone-100">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-stone-400">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                  <p className="text-sm font-medium text-stone-600">Your cart is currently empty</p>
                  <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                    Click any sweet or namkeen item from the menu to select weight or count and add to your order.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOrderSummaryOpen(false)}
                    className="mt-5 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Browse Sweets &amp; Snacks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const isKg = item.product.unit === 'kg';
                  const packCount = item.packCount || 1;
                  const packWeightStr = item.packWeightKg
                    ? item.packWeightKg < 1
                      ? `${Math.round(item.packWeightKg * 1000)}g`
                      : `${item.packWeightKg}kg`
                    : null;

                  return (
                    <div key={idx} className="py-3 flex items-start justify-between gap-3 border-b border-stone-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-stone-900 truncate">
                            {item.product.name}
                          </span>
                        </div>
                        {item.product.hindiName && (
                          <div className="text-[11px] text-stone-400">{item.product.hindiName}</div>
                        )}
                        <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-1.5 mt-0.5 font-mono tabular-nums">
                          {packWeightStr ? (
                            <span className="text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {packCount} Pack{packCount > 1 ? 's' : ''} × {packWeightStr}
                            </span>
                          ) : (
                            <span className="text-stone-700 font-medium">
                              {packCount} {item.product.unit}{packCount > 1 ? 's' : ''}
                            </span>
                          )}
                          <span>·</span>
                          <span>@ ₹{item.product.pricePerUnit}/{item.product.unit} (Incl. GST)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Stepper modifies Pack Count directly (Weight stays fixed!) */}
                        <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                          <button
                            onClick={() => {
                              updateCartItemQuantity(idx, packCount - 1);
                            }}
                            className="px-2 py-1 text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer"
                            title="Decrease pack count"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-stone-800 min-w-[36px] text-center" title="Pack quantity">
                            {packCount}
                          </span>
                          <button
                            onClick={() => {
                              updateCartItemQuantity(idx, packCount + 1);
                            }}
                            className="px-2 py-1 text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer"
                            title="Increase pack count (same weight)"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <span className="text-xs font-bold text-stone-900 font-mono tabular-nums min-w-[56px] text-right">
                          ₹{item.lineTotal.toFixed(2)}
                        </span>

                        {/* Remove */}
                        <button
                          onClick={() => removeCartItem(idx)}
                          className="text-stone-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Popup Footer: Totals Breakdown & Action Buttons */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
                <div className="space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between items-center text-sm font-bold text-stone-900 pt-1">
                    <span>Total Order Amount (Incl. of GST)</span>
                    <span className="font-mono tabular-nums text-amber-800 text-lg">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5 border-t border-stone-100">
                    <span>* All items inclusive of 5% GST</span>
                    <span className="text-stone-500">GST breakdown printed on Cashier Bill</span>
                  </div>
                </div>

                {/* Primary Confirmation Action */}
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 active:bg-black text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Ticket className="w-4 h-4 text-amber-400" />
                      <span>Confirm Order &amp; Generate Token Slip</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOrderSummaryOpen(false)}
                  className="w-full py-2 border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Continue Adding Sweets &amp; Snacks
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VARIABLE WEIGHT SELECTION DIALOG (No special instructions) */}
      {/* ========================================================================= */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">{weightModalProduct.name}</h3>
                <p className="text-xs text-stone-500 font-mono">Rate: ₹{weightModalProduct.pricePerUnit} / kg</p>
              </div>
              <button
                onClick={() => setWeightModalProduct(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Standard Weight Buttons */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-stone-700 mb-2 block">
                Select Standard Weight:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '100g', kg: 0.1 },
                  { label: '250g', kg: 0.25 },
                  { label: '500g', kg: 0.5 },
                  { label: '1 kg', kg: 1.0 },
                ].map(opt => {
                  const isSelected = !customWeightGrams && selectedWeightKg === opt.kg;
                  const price = Math.round(opt.kg * weightModalProduct.pricePerUnit);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setSelectedWeightKg(opt.kg);
                        setCustomWeightGrams('');
                      }}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-600'
                          : 'border-stone-200 hover:border-stone-400 text-stone-700 bg-white'
                      }`}
                    >
                      <div className="text-xs">{opt.label}</div>
                      <div className="text-[11px] text-stone-500 font-mono mt-0.5">₹{price}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Weight in Grams */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-stone-700 mb-1 block">
                Or Enter Custom Grams:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  step="10"
                  placeholder="e.g. 350"
                  value={customWeightGrams}
                  onChange={(e) => setCustomWeightGrams(e.target.value)}
                  className="w-full text-sm bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-xs font-medium text-stone-500">grams</span>
              </div>
            </div>

            {/* Multi-Pack Counter (Customer needs same weight 2 pack -> keep weight, increase quantity/pack count) */}
            <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-700" />
                  <span>Number of Packs (Same Weight):</span>
                </label>
                <span className="text-[11px] text-amber-900 font-bold">
                  {selectedPackCount} Pack{selectedPackCount > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Stepper */}
                <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPackCount(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 text-stone-700 hover:bg-stone-100 font-bold text-sm cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-mono font-bold text-stone-900 min-w-[36px] text-center">
                    {selectedPackCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPackCount(prev => prev + 1)}
                    className="px-3 py-1.5 text-stone-700 hover:bg-stone-100 font-bold text-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedPackCount(num)}
                      className={`px-2.5 py-1 text-xs rounded-md font-mono font-semibold transition-colors cursor-pointer border ${
                        selectedPackCount === num
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400'
                      }`}
                    >
                      {num} {num === 1 ? 'Pack' : 'Pks'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Price Calculator (GST Inclusive) */}
            {(() => {
              const weightKg = customWeightGrams && Number(customWeightGrams) > 0
                ? Number(customWeightGrams) / 1000
                : selectedWeightKg;
              const packPrice = Math.round(weightKg * weightModalProduct.pricePerUnit * 100) / 100;
              const totalAmount = Math.round(selectedPackCount * packPrice * 100) / 100;
              const wtLabel = weightKg < 1 ? `${Math.round(weightKg * 1000)}g` : `${weightKg}kg`;

              return (
                <div className="mt-4 p-3 bg-stone-50 rounded-xl space-y-1 text-xs border border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600">Selected Packing:</span>
                    <span className="font-bold text-stone-900 font-mono">
                      {selectedPackCount} Pack{selectedPackCount > 1 ? 's' : ''} × {wtLabel} each
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-500 font-mono text-[11px]">
                    <span>Rate per pack:</span>
                    <span>₹{packPrice.toFixed(2)} / pack</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                    <span>Total Amount (Incl. GST):</span>
                    <span className="font-mono text-amber-800 text-base">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Add Action */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setWeightModalProduct(null)}
                className="flex-1 py-2 border border-stone-300 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWeight}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COUNT SELECTION DIALOG (No special instructions) */}
      {/* ========================================================================= */}
      {countModalProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">{countModalProduct.name}</h3>
                <p className="text-xs text-stone-500 font-mono">Rate: ₹{countModalProduct.pricePerUnit} / {countModalProduct.unit}</p>
              </div>
              <button
                onClick={() => setCountModalProduct(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Count Buttons */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-stone-700 mb-2 block">
                Select Quantity:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 4, 6, 12].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedCount(num)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-colors font-mono cursor-pointer ${
                      selectedCount === num
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Stepper Count */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setSelectedCount(Math.max(1, selectedCount - 1))}
                className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-bold font-mono text-stone-900 min-w-[40px] text-center">
                {selectedCount}
              </span>
              <button
                type="button"
                onClick={() => setSelectedCount(selectedCount + 1)}
                className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 p-2.5 bg-stone-50 rounded-xl flex justify-between text-xs font-mono border border-stone-200">
              <span className="text-stone-500">Total Price:</span>
              <span className="font-bold text-stone-900">
                ₹{(selectedCount * countModalProduct.pricePerUnit * 1.05).toFixed(2)} (incl. 5% GST)
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCountModalProduct(null)}
                className="flex-1 py-2 border border-stone-300 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCount}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Add {selectedCount} to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMED ORDER DUAL RECEIPT POPUP */}
      {/* ========================================================================= */}
      {confirmedOrderData && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Order Saved &amp; Ready for Printing
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Order: {confirmedOrderData.orderId.slice(0, 10)} · Total: <span className="font-semibold text-stone-900">₹{confirmedOrderData.amount.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* Big Token Badge */}
              <div className="py-1.5 px-4 bg-stone-900 text-amber-400 rounded-xl text-right shadow-inner shrink-0">
                <span className="text-[10px] text-stone-400 block font-mono uppercase tracking-wider">Customer Token</span>
                <span className="text-2xl font-extrabold tracking-tight font-mono">{confirmedOrderData.tokenNumber}</span>
              </div>
            </div>

            {/* Sequential Thermal Print Queue Component */}
            <div className="mt-3.5 p-3.5 bg-stone-900 text-white rounded-xl border border-stone-800 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-stone-100">
                    Sequential Thermal Print Queue (2-Inch / 50.8mm)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 font-semibold">
                  Queue: 2 Jobs (One After One)
                </span>
              </div>

              {/* Steps status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
                <div className={`p-2.5 rounded-lg border text-xs transition-colors ${
                  queueState.job1Status === 'completed'
                    ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
                    : queueState.job1Status === 'printing'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 animate-pulse'
                    : 'bg-stone-800/60 border-stone-700 text-stone-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      {queueState.job1Status === 'completed' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : queueState.job1Status === 'printing' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-stone-700 flex items-center justify-center text-[10px] font-mono">1</span>
                      )}
                      1. Customer Token Slip
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-stone-800 px-1.5 py-0.5 rounded">2-Inch (50.8mm)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">Very short · Token #{confirmedOrderData.tokenNumber} only (no items)</p>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs transition-colors ${
                  queueState.job2Status === 'completed'
                    ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
                    : queueState.job2Status === 'printing'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 animate-pulse'
                    : 'bg-stone-800/60 border-stone-700 text-stone-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      {queueState.job2Status === 'completed' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : queueState.job2Status === 'printing' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-stone-700 flex items-center justify-center text-[10px] font-mono">2</span>
                      )}
                      2. Order POS Dispatch Slip
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-stone-800 px-1.5 py-0.5 rounded">2-Inch (50.8mm)</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">Itemized packing ticket for order counter</p>
                </div>
              </div>

              {/* Queue status feedback & Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-stone-300 pt-1">
                <span className="text-[11px] font-mono text-amber-400 leading-snug">
                  {queueState.activeMessage}
                </span>

                <button
                  type="button"
                  disabled={queueState.isRunning}
                  onClick={() => runSequentialPrintQueue(confirmedOrderData.customerReceiptText, confirmedOrderData.counterReceiptText, confirmedOrderData.tokenNumber)}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0 ${
                    queueState.completed
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                  }`}
                >
                  {queueState.isRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Printing Queue...</span>
                    </>
                  ) : queueState.completed ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Reprint in Queue</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Print Both in Queue (One After One)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dual Receipt Preview Cards (2-Inch / 50.8mm) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5">
              {/* Receipt 1: Small Customer Waiting Slip */}
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-stone-600" />
                      1. Customer Token Slip
                    </span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 font-mono px-1.5 py-0.5 rounded font-semibold">
                      2-Inch (50.8mm)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mb-2 leading-relaxed">
                    Customer takes this short slip with Token <strong>#{confirmedOrderData.tokenNumber}</strong>. (No item details included)
                  </p>

                  {/* Micro Preview */}
                  <div className="bg-[#fdfcf7] border border-stone-300 rounded p-2 text-[10px] font-mono max-h-36 overflow-y-auto leading-tight text-stone-800 select-text">
                    <pre className="whitespace-pre-wrap">{confirmedOrderData.customerReceiptText}</pre>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      openThermalReceipt({
                        title: `Customer Token Slip (2-Inch) - Token ${confirmedOrderData.tokenNumber}`,
                        text: confirmedOrderData.customerReceiptText,
                        secondaryText: confirmedOrderData.counterReceiptText,
                        paperWidth: '58mm',
                        tokenNumber: confirmedOrderData.tokenNumber,
                        jobType: 'CUSTOMER_TOKEN',
                        initialTab: 'primary',
                      });
                      setTimeout(() => window.print(), 150);
                    }}
                    className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print Slip #1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openThermalReceipt({
                        title: `Customer Token Slip (2-Inch) - Token ${confirmedOrderData.tokenNumber}`,
                        text: confirmedOrderData.customerReceiptText,
                        secondaryText: confirmedOrderData.counterReceiptText,
                        paperWidth: '58mm',
                        tokenNumber: confirmedOrderData.tokenNumber,
                        jobType: 'CUSTOMER_TOKEN',
                        initialTab: 'primary',
                      });
                    }}
                    className="p-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg text-xs cursor-pointer"
                    title="Preview Customer Slip"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Receipt 2: Itemized Order POS Slip */}
              <div className="border border-amber-200 rounded-xl p-3 bg-amber-50/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-amber-700" />
                      2. Order POS Dispatch Slip
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                      2-Inch (50.8mm)
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 mb-2 leading-relaxed">
                    Counter packing slip with item breakdown, weights, counts, and packaging details.
                  </p>

                  {/* Micro Preview */}
                  <div className="bg-[#fdfcf7] border border-amber-300/80 rounded p-2 text-[10px] font-mono max-h-36 overflow-y-auto leading-tight text-stone-800 select-text">
                    <pre className="whitespace-pre-wrap">{confirmedOrderData.counterReceiptText}</pre>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-amber-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      openThermalReceipt({
                        title: `Order POS Slip (2-Inch) - Token ${confirmedOrderData.tokenNumber}`,
                        text: confirmedOrderData.customerReceiptText,
                        secondaryText: confirmedOrderData.counterReceiptText,
                        paperWidth: '58mm',
                        tokenNumber: confirmedOrderData.tokenNumber,
                        jobType: 'COUNTER_RECEIPT',
                        initialTab: 'secondary',
                      });
                      setTimeout(() => window.print(), 150);
                    }}
                    className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip #2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openThermalReceipt({
                        title: `Order POS Slip (2-Inch) - Token ${confirmedOrderData.tokenNumber}`,
                        text: confirmedOrderData.customerReceiptText,
                        secondaryText: confirmedOrderData.counterReceiptText,
                        paperWidth: '58mm',
                        tokenNumber: confirmedOrderData.tokenNumber,
                        jobType: 'COUNTER_RECEIPT',
                        initialTab: 'secondary',
                      });
                    }}
                    className="p-2 border border-amber-300 hover:bg-amber-100 text-amber-800 rounded-lg text-xs cursor-pointer"
                    title="Preview Order Slip"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmedOrderData(null)}
                className="py-2.5 px-6 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Close &amp; Next Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECENT ORDERS & RECEIPTS REPRINT MODAL (For Order POS role) */}
      {/* ========================================================================= */}
      {showRecentOrdersModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base font-bold text-stone-900">Recent POS Orders &amp; Receipts</h3>
                <p className="text-xs text-stone-500 font-mono">
                  {orders.length} orders recorded · Sheetal Gajak Kulfi · 2-Inch (50.8mm) Queue Printing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecentOrdersModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 mt-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  No orders taken yet today.
                </div>
              ) : (
                orders.slice(0, 15).map((ord: Order) => {
                  const tokenJob = printJobs.find(
                    (pj) => pj.orderId === ord.id && pj.jobType === 'CUSTOMER_TOKEN'
                  );
                  const kitJob = printJobs.find(
                    (pj) => pj.orderId === ord.id && (pj.jobType === 'KITCHEN_TICKET' || pj.jobType === 'COUNTER_RECEIPT')
                  );

                  const customerText = tokenJob?.payload || `SHEETAL GAJAK KULFI\nOpp. High Court, Shivaji Nagar\nIndore - 452003\n================================\n     CUSTOMER WAITING SLIP\n--------------------------------\n      *** TOKEN NUMBER ***\n           >>> ${ord.tokenNumber} <<<         \n--------------------------------\nOrder: ${ord.id.slice(0, 10)}\nDate: ${ord.businessDate}\nCounter: POS-1\n================================\n>> PLEASE WAIT FOR TOKEN CALL <<\nShow this token at billing counter\nThank You! Visit Again.\n`;
                  const counterText = kitJob?.payload || `*** ORDER POS SLIP (2-INCH) ***\nSHEETAL GAJAK KULFI\nOpp. High Court, Shivaji Nagar\n================================\n*** TOKEN: ${ord.tokenNumber} ***\n================================\nOrder: ${ord.id.slice(0, 10)}\nItems:\n${ord.items.map((i, idx) => `${idx + 1}. ${i.productName} - ${i.quantity} ${i.unit} (INR ${i.totalPrice})`).join('\n')}\nTotal: INR ${ord.finalAmount.toFixed(2)}`;

                  return (
                    <div
                      key={ord.id}
                      className="p-3 bg-stone-50 border border-stone-200 rounded-xl hover:border-stone-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-stone-900 text-amber-400 font-mono font-bold text-xs rounded-md">
                            TOKEN {ord.tokenNumber}
                          </span>
                          <span className="text-xs font-mono text-stone-500">
                            {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-stone-900 font-mono">
                          ₹{ord.finalAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="py-2 text-xs text-stone-600 line-clamp-1">
                        {ord.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
                      </div>

                      {/* Print Options for this order */}
                      <div className="pt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            openThermalReceipt({
                              title: `Customer Token Slip (2-Inch) - Token ${ord.tokenNumber}`,
                              text: customerText,
                              secondaryText: counterText,
                              paperWidth: '58mm',
                              tokenNumber: ord.tokenNumber,
                              jobType: 'CUSTOMER_TOKEN',
                              initialTab: 'primary',
                            });
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5 text-stone-600" />
                          <span>Customer Slip (2")</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            openThermalReceipt({
                              title: `Order POS Slip (2-Inch) - Token ${ord.tokenNumber}`,
                              text: customerText,
                              secondaryText: counterText,
                              paperWidth: '58mm',
                              tokenNumber: ord.tokenNumber,
                              jobType: 'COUNTER_RECEIPT',
                              initialTab: 'secondary',
                            });
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-amber-700" />
                          <span>Order POS Slip (2")</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => runSequentialPrintQueue(customerText, counterText, ord.tokenNumber)}
                          className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ml-auto cursor-pointer"
                          title="Print Customer Slip then Order Slip sequentially in a queue"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
                          <span>Print in Queue</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 text-right">
              <button
                type="button"
                onClick={() => setShowRecentOrdersModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WHOLE PRODUCT OVERVIEW MODAL */}
      {/* ========================================================================= */}
      {showOverviewModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-stone-900">Sheetal Gajak Kulfi POS</h3>
                  <span className="text-[11px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                    Indore Counter System
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Opposite High Court, Shivaji Nagar, Indore, Madhya Pradesh - 452003
                </p>
              </div>
              <button
                onClick={() => setShowOverviewModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-stone-700 max-h-[68vh] overflow-y-auto pr-1">
              {/* Architecture 2-Station Workflow */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">1</span>
                  Two-Station Counter Workflow
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-stone-600">
                  <div className="bg-white p-3 rounded-lg border border-stone-200">
                    <p className="font-semibold text-stone-900 mb-1">Counter 1: Order POS Terminal</p>
                    <p className="text-[11px] leading-relaxed">
                      Fast item selection, weight pack steppers, token generation, and sequential printing of dual 2-inch slips.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-stone-200">
                    <p className="font-semibold text-stone-900 mb-1">Counter 2: Cashier Billing Terminal</p>
                    <p className="text-[11px] leading-relaxed">
                      Token lookup, dual discounts (% &amp; ₹), 1-tap payment modes, auto-filling split tender, and 3-inch Cashier Tax Bill.
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi-Pack Weight Modeling */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                <h4 className="font-bold text-stone-900 text-sm mb-1.5 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-700" />
                  Multi-Pack Weight Handling (Customer Order Packs)
                </h4>
                <p className="leading-relaxed text-stone-600">
                  When a customer requests <strong>multiple packs of the same weight</strong> (e.g., two 500g gift boxes of Gajak), the system does <strong>not</strong> double the weight to 1000g. Instead, it increments the pack count to <strong>2 Packs × 500g</strong>. This ensures packing staff package two separate 500g boxes rather than a single bulk 1kg pack.
                </p>
              </div>

              {/* GST Inclusive Policy */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-900 text-sm mb-1.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs">%</span>
                  GST-Inclusive Pricing &amp; Cashier Breakdown
                </h4>
                <ul className="space-y-1.5 text-stone-600 list-disc list-inside">
                  <li><strong>All POS items are GST Inclusive:</strong> Shelf prices include tax. POS cart and 2-inch slips omit tax lines to keep counter operations speedy.</li>
                  <li><strong>GST ONLY in Cashier Bill:</strong> 5% GST is reverse-calculated exclusively on the 3-inch Cashier Tax Invoice (Taxable Value = Total / 1.05, split into 2.5% CGST + 2.5% SGST).</li>
                </ul>
              </div>

              {/* Cashier Billing Features */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-900 text-sm mb-2">Cashier Settlement Engine</h4>
                <div className="space-y-2 text-stone-600">
                  <div>
                    <span className="font-semibold text-stone-800">1-Tap Payment Recording:</span> Instant recording via Cash, UPI, Card, or Split without requiring card numbers or QR code scans.
                  </div>
                  <div>
                    <span className="font-semibold text-stone-800">Auto-Balancing Split Payment:</span> When customer splits payment across Cash and UPI, entering the cash amount automatically calculates and fills the remaining balance in the UPI column.
                  </div>
                  <div>
                    <span className="font-semibold text-stone-800">Dual Discount Engine:</span> Instant toggle between Percentage (%) and Flat Rupee Amount (₹) with real-time recalculation of GST taxable value.
                  </div>
                </div>
              </div>

              {/* Thermal Printer Slips Specifications */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-stone-700" />
                  Thermal Printer Slip Sizes &amp; Specifications
                </h4>
                <div className="space-y-2 text-stone-600 font-mono text-[11px]">
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="font-bold text-stone-900 font-sans">1. Customer Waiting Slip (2-Inch / 50.8mm / 58mm Paper):</span>
                    <p className="font-sans text-stone-500 mt-0.5">Very short slip. Contains only Shop Name, Token Number (#TK-XXX), Date/Time, and instructions. NO item details.</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="font-bold text-stone-900 font-sans">2. Order POS Slip / Counter Ticket (2-Inch / 50.8mm / 58mm Paper):</span>
                    <p className="font-sans text-stone-500 mt-0.5">Itemized packing slip for counter staff with pack quantities, units, and token number. Printed consecutively in a queue with the customer slip.</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="font-bold text-stone-900 font-sans">3. Cashier Tax Invoice (3-Inch / 80mm / 48 Chars Paper):</span>
                    <p className="font-sans text-stone-500 mt-0.5">Full commercial receipt with complete itemization, pack breakdown, discount, 5% inclusive GST table (Taxable + CGST 2.5% + SGST 2.5%), payment mode, and shop GSTIN.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOverviewModal(false)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Got It, Back to POS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
