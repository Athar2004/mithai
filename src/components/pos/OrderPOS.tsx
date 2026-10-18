import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { Product, UnitType, Order } from '../../types/index.ts';
import * as api from '../../lib/api.ts';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Sparkles,
  UtensilsCrossed,
  CheckCircle2,
  X,
  FileText,
  Ticket,
  ChefHat,
  SplitSquareVertical,
  Eye,
  History,
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
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showRecentOrdersModal, setShowRecentOrdersModal] = useState<boolean>(false);

  // Variable-weight selection modal state
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [selectedWeightKg, setSelectedWeightKg] = useState<number>(0.25);
  const [customWeightGrams, setCustomWeightGrams] = useState<string>('');
  const [itemNote, setItemNote] = useState<string>('');

  // Count selection modal state
  const [countModalProduct, setCountModalProduct] = useState<Product | null>(null);
  const [selectedCount, setSelectedCount] = useState<number>(1);

  // Success Modal with Dual Receipts
  const [confirmedOrderData, setConfirmedOrderData] = useState<{
    tokenNumber: string;
    orderId: string;
    amount: number;
    customerReceiptText: string;
    kitchenReceiptText: string;
    isKitchenRequired: boolean;
  } | null>(null);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.hindiName && p.hindiName.includes(searchQuery)) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle clicking on a product card
  const handleProductClick = (product: Product) => {
    if (product.unit === 'kg') {
      setWeightModalProduct(product);
      setSelectedWeightKg(0.25); // Default to 250 grams
      setCustomWeightGrams('');
      setItemNote('');
    } else {
      setCountModalProduct(product);
      setSelectedCount(1);
      setItemNote('');
    }
  };

  const handleConfirmWeight = () => {
    if (!weightModalProduct) return;
    const finalKg = customWeightGrams && Number(customWeightGrams) > 0
      ? Number(customWeightGrams) / 1000
      : selectedWeightKg;

    if (finalKg <= 0) return;
    addToCart(weightModalProduct, finalKg, itemNote);
    setWeightModalProduct(null);
  };

  const handleConfirmCount = () => {
    if (!countModalProduct || selectedCount <= 0) return;
    addToCart(countModalProduct, selectedCount, itemNote);
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
          specialInstructions: item.specialInstructions,
        })),
        notes: orderNotes.trim() || undefined,
        userId: currentUser.id,
        userName: currentUser.name,
        counterId: 'POS-1',
      };

      const result = await api.createOrder(payload);

      setConfirmedOrderData({
        tokenNumber: result.order.tokenNumber,
        orderId: result.order.id,
        amount: result.order.finalAmount,
        customerReceiptText: result.printJobs.customerToken?.payload || '',
        kitchenReceiptText: result.printJobs.kitchenTicket?.payload || '',
        isKitchenRequired: result.order.isKitchenRequired,
      });

      clearCart();
      setOrderNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm order';
      setErrorBanner(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
            Order-Taking Terminal
          </h1>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
            <span>Counter POS-1</span>
            <span aria-hidden="true">·</span>
            <span>Operator: {currentUser.name}</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-medium">Dual-Receipt Active: 1. Customer Slip (58mm) + 2. Kitchen Ticket (80mm)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Recent Orders & Receipts Button */}
          <button
            type="button"
            onClick={() => setShowRecentOrdersModal(true)}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-stone-200 shrink-0"
            title="View recent orders to reprint Customer Slip or Kitchen Ticket"
          >
            <History className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Recent Orders &amp; Receipts</span>
            <span className="sm:hidden">Recent</span>
            {orders.length > 0 && (
              <span className="bg-amber-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                {orders.length}
              </span>
            )}
          </button>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sweets, namkeen, snacks..."
              className="w-full bg-white border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
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
          <button onClick={() => setErrorBanner(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: 2 Columns (Products Left 65%, Cart Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        {/* Left Column: Product Selection */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category Tabs (Segmented Button Bar) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const isWeight = product.unit === 'kg';
              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-lg border border-stone-200 hover:border-amber-400 p-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md active:scale-[0.98] select-none group"
                >
                  <div>
                    {/* Product Image Slot with Fallback */}
                    <div className="w-full aspect-4/3 rounded bg-stone-100 overflow-hidden mb-2 relative">
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
                      {product.requiresKitchen && (
                        <span className="absolute bottom-1 right-1 bg-stone-900/80 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-medium">
                          Kitchen Prep
                        </span>
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
            <div className="bg-white rounded-lg border border-stone-200 p-8 text-center text-stone-500">
              <UtensilsCrossed className="w-8 h-8 mx-auto text-stone-300 mb-2" />
              <p className="text-sm">No items found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary / Cart */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-stone-200 shadow-sm p-4 sticky top-18">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h2 className="text-base font-bold text-stone-900">Current Order</h2>
              <p className="text-xs text-stone-500">{cart.length} line {cart.length === 1 ? 'item' : 'items'}</p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="divide-y divide-stone-100 max-h-[320px] overflow-y-auto py-2">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="text-xs">Your cart is empty.</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Click any sweet or snack on the left to add.</p>
              </div>
            ) : (
              cart.map((item, idx) => {
                const isKg = item.product.unit === 'kg';
                const formattedQty = isKg
                  ? item.quantity < 1
                    ? `${Math.round(item.quantity * 1000)}g`
                    : `${item.quantity.toFixed(2)}kg`
                  : `${item.quantity} ${item.product.unit}`;

                return (
                  <div key={idx} className="py-2.5 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-stone-900 truncate">
                          {item.product.name}
                        </span>
                        {item.product.requiresKitchen && (
                          <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-medium">
                            KOT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5 font-mono tabular-nums">
                        <span>{formattedQty}</span>
                        <span>@ ₹{item.product.pricePerUnit}</span>
                      </div>
                      {item.specialInstructions && (
                        <p className="text-[10px] text-amber-700 bg-amber-50/60 rounded px-1.5 py-0.5 mt-1">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-stone-200 rounded">
                        <button
                          onClick={() => {
                            const step = isKg ? 0.25 : 1;
                            updateCartItemQuantity(idx, Math.max(0, Math.round((item.quantity - step) * 100) / 100));
                          }}
                          className="px-1.5 py-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 text-xs font-mono font-medium text-stone-800">
                          {formattedQty}
                        </span>
                        <button
                          onClick={() => {
                            const step = isKg ? 0.25 : 1;
                            updateCartItemQuantity(idx, Math.round((item.quantity + step) * 100) / 100);
                          }}
                          className="px-1.5 py-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-stone-900 font-mono tabular-nums min-w-[54px] text-right">
                        ₹{item.lineTotal.toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeCartItem(idx)}
                        className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Special Kitchen / Order Note */}
          {cart.length > 0 && (
            <div className="mt-2 pt-2 border-t border-stone-100">
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Kitchen note (e.g. Gift pack, Less sugar)..."
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Totals Breakdown */}
          <div className="mt-3 pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal (Taxable)</span>
              <span className="font-mono tabular-nums text-stone-900">₹{cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5% — CGST 2.5% + SGST 2.5%)</span>
              <span className="font-mono tabular-nums text-stone-900">₹{cartTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-900 pt-1.5 border-t border-stone-200">
              <span>Amount Payable</span>
              <span className="font-mono tabular-nums text-amber-700 text-base">₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Dual Receipt Notice */}
          <div className="mt-3 p-2 bg-amber-50/80 border border-amber-200/90 rounded-lg text-[11px] text-amber-950 flex items-start gap-1.5 leading-snug">
            <SplitSquareVertical className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Dual Receipts:</strong> Generates 1 small <strong>Customer Waiting Slip</strong> (to sit &amp; wait) and 1 detailed <strong>Kitchen KOT</strong> (for chef).
            </span>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmOrder}
            disabled={cart.length === 0 || isSubmitting}
            className={`w-full mt-3 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
              cart.length === 0 || isSubmitting
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white'
            }`}
          >
            {isSubmitting ? (
              <span>Saving Order &amp; Generating Receipts...</span>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>CONFIRM ORDER &amp; PRINT RECEIPTS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* WEIGHT SELECTION DIALOG (For sweets sold by kg) */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">{weightModalProduct.name}</h3>
                <p className="text-xs text-stone-500 font-mono">Rate: ₹{weightModalProduct.pricePerUnit}/kg</p>
              </div>
              <button
                onClick={() => setWeightModalProduct(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Weight Select Buttons */}
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
                      className={`p-2.5 rounded-lg border text-center transition-all ${
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
                  className="w-full text-sm bg-stone-50 border border-stone-300 rounded px-3 py-2 font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-xs font-medium text-stone-500">grams</span>
              </div>
            </div>

            {/* Special Instruction / Packing Note */}
            <div className="mt-3">
              <label className="text-xs font-semibold text-stone-700 mb-1 block">
                Preparation / Packing Instruction:
              </label>
              <input
                type="text"
                placeholder="e.g. Less sweet, pack in tin box..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Live Price Calculator */}
            {(() => {
              const weightKg = customWeightGrams && Number(customWeightGrams) > 0
                ? Number(customWeightGrams) / 1000
                : selectedWeightKg;
              const subtotal = Math.round(weightKg * weightModalProduct.pricePerUnit * 100) / 100;
              const tax = Math.round((subtotal * ((weightModalProduct.taxRatePercent || 5) / 100)) * 100) / 100;
              const total = subtotal + tax;

              return (
                <div className="mt-4 p-3 bg-stone-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-500">Calculated Total: </span>
                    <span className="font-bold text-stone-900 font-mono text-sm">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-stone-500 font-mono">
                    ({weightKg < 1 ? `${Math.round(weightKg * 1000)}g` : `${weightKg}kg`})
                  </span>
                </div>
              );
            })()}

            {/* Add Action */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setWeightModalProduct(null)}
                className="flex-1 py-2 border border-stone-300 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWeight}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNT SELECTION DIALOG (For piece/portion items like Samosa, Lassi, Gulab Jamun) */}
      {countModalProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">{countModalProduct.name}</h3>
                <p className="text-xs text-stone-500 font-mono">Rate: ₹{countModalProduct.pricePerUnit} / {countModalProduct.unit}</p>
              </div>
              <button
                onClick={() => setCountModalProduct(null)}
                className="text-stone-400 hover:text-stone-700"
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
                    className={`py-2 text-xs font-bold rounded border transition-colors font-mono ${
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
                className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-bold font-mono text-stone-900 min-w-[40px] text-center">
                {selectedCount}
              </span>
              <button
                type="button"
                onClick={() => setSelectedCount(selectedCount + 1)}
                className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction */}
            <div className="mt-3">
              <input
                type="text"
                placeholder="Special instruction (e.g. Extra chutney, less ice)..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="mt-4 p-2.5 bg-stone-50 rounded flex justify-between text-xs font-mono">
              <span className="text-stone-500">Total:</span>
              <span className="font-bold text-stone-900">
                ₹{(selectedCount * countModalProduct.pricePerUnit * 1.05).toFixed(2)} (incl. 5% GST)
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCountModalProduct(null)}
                className="flex-1 py-2 border border-stone-300 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCount}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Add {selectedCount} to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMED ORDER DUAL RECEIPT POPUP */}
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

            {/* Instruction Callout */}
            <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SplitSquareVertical className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Two receipts required:</strong> 1 small slip for customer to sit &amp; wait, and 1 kitchen ticket to give to kitchen.
                </span>
              </div>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded shrink-0 font-mono">
                Direct to Cashier for Billing
              </span>
            </div>

            {/* Dual Receipt Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
              {/* Receipt 1: Small Customer Waiting Slip */}
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-stone-600" />
                      1. Small Customer Slip
                    </span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 font-mono px-1.5 py-0.5 rounded font-semibold">
                      58mm Thermal
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mb-2 leading-relaxed">
                    Customer takes this small slip, <strong>sits down</strong>, and <strong>waits for token #{confirmedOrderData.tokenNumber}</strong> to be announced.
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
                        title: `Customer Waiting Slip - Token ${confirmedOrderData.tokenNumber}`,
                        text: confirmedOrderData.customerReceiptText,
                        secondaryText: confirmedOrderData.kitchenReceiptText,
                        paperWidth: '58mm',
                        tokenNumber: confirmedOrderData.tokenNumber,
                        jobType: 'CUSTOMER_TOKEN',
                        initialTab: 'primary',
                      });
                      setTimeout(() => window.print(), 150);
                    }}
                    className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print Customer Slip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openThermalReceipt({
                        title: `Customer Waiting Slip - Token ${confirmedOrderData.tokenNumber}`,
                        text: confirmedOrderData.customerReceiptText,
                        secondaryText: confirmedOrderData.kitchenReceiptText,
                        paperWidth: '58mm',
                        tokenNumber: confirmedOrderData.tokenNumber,
                        jobType: 'CUSTOMER_TOKEN',
                        initialTab: 'primary',
                      });
                    }}
                    className="p-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg text-xs"
                    title="Preview Customer Slip"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Receipt 2: Detailed Kitchen Preparation Slip */}
              <div className="border border-amber-200 rounded-xl p-3 bg-amber-50/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                      2. Kitchen KOT Ticket
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                      80mm / 58mm
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 mb-2 leading-relaxed">
                    Customer gives this <strong>detailed ticket</strong> with items &amp; notes directly to the <strong>kitchen preparation counter</strong>.
                  </p>

                  {/* Micro Preview */}
                  <div className="bg-[#fdfcf7] border border-amber-300/80 rounded p-2 text-[10px] font-mono max-h-36 overflow-y-auto leading-tight text-stone-800 select-text">
                    <pre className="whitespace-pre-wrap">{confirmedOrderData.kitchenReceiptText}</pre>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-amber-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      openThermalReceipt({
                        title: `Kitchen Order Ticket - Token ${confirmedOrderData.tokenNumber}`,
                        text: confirmedOrderData.customerReceiptText,
                        secondaryText: confirmedOrderData.kitchenReceiptText,
                        paperWidth: '80mm',
                        tokenNumber: confirmedOrderData.tokenNumber,
                        jobType: 'KITCHEN_TICKET',
                        initialTab: 'secondary',
                      });
                      setTimeout(() => window.print(), 150);
                    }}
                    className="flex-1 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Kitchen Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openThermalReceipt({
                        title: `Kitchen Order Ticket - Token ${confirmedOrderData.tokenNumber}`,
                        text: confirmedOrderData.customerReceiptText,
                        secondaryText: confirmedOrderData.kitchenReceiptText,
                        paperWidth: '80mm',
                        tokenNumber: confirmedOrderData.tokenNumber,
                        jobType: 'KITCHEN_TICKET',
                        initialTab: 'secondary',
                      });
                    }}
                    className="p-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-lg text-xs"
                    title="Preview Kitchen Ticket"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-2">
              {/* Print Both Option */}
              <button
                type="button"
                onClick={() => {
                  openThermalReceipt({
                    title: `Customer Slip - Token ${confirmedOrderData.tokenNumber}`,
                    secondaryTitle: `Kitchen Ticket - Token ${confirmedOrderData.tokenNumber}`,
                    text: confirmedOrderData.customerReceiptText,
                    secondaryText: confirmedOrderData.kitchenReceiptText,
                    paperWidth: '58mm',
                    secondaryPaperWidth: '80mm',
                    tokenNumber: confirmedOrderData.tokenNumber,
                    jobType: 'DUAL_ORDER_RECEIPTS',
                    initialTab: 'both',
                  });
                  setTimeout(() => window.print(), 150);
                }}
                className="w-full sm:flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <SplitSquareVertical className="w-4 h-4 text-amber-400" />
                <span>Print Both Receipts (Dual Print)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  openThermalReceipt({
                    title: `Customer Slip - Token ${confirmedOrderData.tokenNumber}`,
                    secondaryTitle: `Kitchen Ticket - Token ${confirmedOrderData.tokenNumber}`,
                    text: confirmedOrderData.customerReceiptText,
                    secondaryText: confirmedOrderData.kitchenReceiptText,
                    paperWidth: '58mm',
                    secondaryPaperWidth: '80mm',
                    tokenNumber: confirmedOrderData.tokenNumber,
                    jobType: 'DUAL_ORDER_RECEIPTS',
                    initialTab: 'both',
                  });
                }}
                className="w-full sm:w-auto px-4 py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-stone-500" />
                <span>View Full Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmedOrderData(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Next Customer Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECENT ORDERS & RECEIPTS REPRINT MODAL */}
      {showRecentOrdersModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Recent Orders &amp; Receipts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecentOrdersModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 mt-2 mb-4">
              Reprint the small Customer Waiting Slip, Kitchen Preparation Ticket, or Both for any recent token.
            </p>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No orders taken yet today.
                </div>
              ) : (
                orders.slice(0, 15).map((ord: Order) => {
                  const tokenJob = printJobs.find(
                    (pj) => pj.orderId === ord.id && pj.jobType === 'CUSTOMER_TOKEN'
                  );
                  const kitJob = printJobs.find(
                    (pj) => pj.orderId === ord.id && pj.jobType === 'KITCHEN_TICKET'
                  );

                  const customerText = tokenJob?.payload || `SHREE KRISHNA SWEETS\nCUSTOMER WAITING SLIP\nTOKEN: ${ord.tokenNumber}\nOrder: ${ord.id.slice(0, 10)}\nTotal: INR ${ord.finalAmount.toFixed(2)}\nPlease take a seat and wait for your token to be announced.\nThank you!`;
                  const kitchenText = kitJob?.payload || `*** KITCHEN ORDER TICKET ***\nTOKEN: ${ord.tokenNumber}\nOrder: ${ord.id.slice(0, 10)}\nItems:\n${ord.items.map((i, idx) => `[ ] ${idx + 1}. ${i.productName} - ${i.quantity} ${i.unit}`).join('\n')}\n>>> PREPARE FRESH <<<`;

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
                            ord.status === 'READY' || ord.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'PREPARING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {ord.status}
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
                              title: `Customer Waiting Slip - Token ${ord.tokenNumber}`,
                              text: customerText,
                              secondaryText: kitchenText,
                              paperWidth: '58mm',
                              tokenNumber: ord.tokenNumber,
                              jobType: 'CUSTOMER_TOKEN',
                              initialTab: 'primary',
                            });
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Ticket className="w-3.5 h-3.5 text-stone-600" />
                          <span>Customer Slip (58mm)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            openThermalReceipt({
                              title: `Kitchen Order Ticket - Token ${ord.tokenNumber}`,
                              text: customerText,
                              secondaryText: kitchenText,
                              paperWidth: '80mm',
                              tokenNumber: ord.tokenNumber,
                              jobType: 'KITCHEN_TICKET',
                              initialTab: 'secondary',
                            });
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                          <span>Kitchen Ticket (80mm)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            openThermalReceipt({
                              title: `Customer Slip - Token ${ord.tokenNumber}`,
                              secondaryTitle: `Kitchen Ticket - Token ${ord.tokenNumber}`,
                              text: customerText,
                              secondaryText: kitchenText,
                              paperWidth: '58mm',
                              secondaryPaperWidth: '80mm',
                              tokenNumber: ord.tokenNumber,
                              jobType: 'DUAL_ORDER_RECEIPTS',
                              initialTab: 'both',
                            });
                          }}
                          className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Print Both</span>
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
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
