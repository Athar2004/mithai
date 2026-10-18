import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { Order, OrderStatus } from '../../types/index.ts';
import * as api from '../../lib/api.ts';
import {
  Clock,
  CheckCircle,
  Play,
  Printer,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChefHat,
  Filter,
} from 'lucide-react';

export const KitchenKDS: React.FC = () => {
  const { orders, currentUser, settings, printJobs, openThermalReceipt } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'RECEIVED' | 'PREPARING' | 'READY'>('all');
  const [sortBy, setSortBy] = useState<'oldest' | 'token'>('oldest');
  const [nowTime, setNowTime] = useState<number>(Date.now());
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Update timer every second for accurate live elapsed badges
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders: only show kitchen required orders and active ones (or recently completed)
  const kitchenOrders = orders.filter(order => {
    // Only orders with kitchen items or active status
    if (order.status === 'CANCELLED') return false;
    if (order.status === 'COMPLETED' && statusFilter !== 'all') return false;

    if (statusFilter === 'all') {
      return order.status === 'RECEIVED' || order.status === 'PREPARING' || order.status === 'READY';
    }
    return order.status === statusFilter;
  });

  // Sort orders
  const sortedOrders = [...kitchenOrders].sort((a, b) => {
    if (sortBy === 'token') {
      return a.tokenNumber.localeCompare(b.tokenNumber);
    }
    // Oldest first (FIFO)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const delayThresholdMinutes = settings?.kitchenDelayThresholdMinutes ?? 10;

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await api.updateOrderStatus(orderId, nextStatus, currentUser.name, `Kitchen KDS updated status to ${nextStatus}`);
    } catch (err) {
      console.error('Failed to update kitchen status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleReprintKOT = async (order: Order) => {
    // Look up the kitchen ticket print job
    const kJob = printJobs.find(j => j.orderId === order.id && j.jobType === 'KITCHEN_TICKET');
    if (kJob) {
      try {
        await api.reprintJob(kJob.id, currentUser.name);
        openThermalReceipt({
          title: `Kitchen Ticket - ${order.tokenNumber}`,
          text: kJob.payload,
          paperWidth: kJob.paperWidth || '80mm',
          tokenNumber: order.tokenNumber,
          jobType: 'KITCHEN_TICKET',
        });
      } catch (err) {
        console.error('Reprint failed:', err);
      }
    }
  };

  const getElapsedMinutes = (createdAt: string) => {
    const diffMs = nowTime - new Date(createdAt).getTime();
    return Math.floor(diffMs / 60000);
  };

  const formatElapsedTime = (createdAt: string) => {
    const diffMs = Math.max(0, nowTime - new Date(createdAt).getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
              Kitchen Display System (KDS)
            </h1>
            <span className="text-xs bg-amber-100 text-amber-900 font-medium px-2 py-0.5 rounded font-mono">
              Live Preparation Queue
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
            <span>Staff: {currentUser.name}</span>
            <span aria-hidden="true">·</span>
            <span>Delay Threshold: &gt;{delayThresholdMinutes} mins</span>
            <span aria-hidden="true">·</span>
            <span>Real-time Auto-Update</span>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center p-1 bg-white border border-stone-200 rounded-lg shadow-xs">
            {(['all', 'RECEIVED', 'PREPARING', 'READY'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab === 'all' ? 'All Active' : tab}
              </button>
            ))}
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center p-1 bg-white border border-stone-200 rounded-lg shadow-xs text-xs">
            <span className="px-2 text-stone-400 font-medium">Sort:</span>
            <button
              onClick={() => setSortBy('oldest')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sortBy === 'oldest' ? 'bg-amber-600 text-white font-medium' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Oldest (FIFO)
            </button>
            <button
              onClick={() => setSortBy('token')}
              className={`px-2.5 py-1 rounded transition-colors ${
                sortBy === 'token' ? 'bg-amber-600 text-white font-medium' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Token #
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {sortedOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-16 text-center my-8">
          <ChefHat className="w-12 h-12 mx-auto text-stone-300 mb-3" />
          <h3 className="text-base font-bold text-stone-700">Kitchen Queue is Clear</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            All sweet orders have been prepared or packed. New orders from POS-1 will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {sortedOrders.map(order => {
            const elapsedMins = getElapsedMinutes(order.createdAt);
            const isCriticalDelay = elapsedMins >= 15;
            const isWarningDelay = elapsedMins >= delayThresholdMinutes && !isCriticalDelay;

            const isReceived = order.status === 'RECEIVED';
            const isPreparing = order.status === 'PREPARING';
            const isReady = order.status === 'READY';

            // Find associated KOT print job to inspect reprints
            const kotJob = printJobs.find(j => j.orderId === order.id && j.jobType === 'KITCHEN_TICKET');

            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between overflow-hidden ${
                  isCriticalDelay
                    ? 'border-red-400 ring-2 ring-red-100'
                    : isWarningDelay
                    ? 'border-amber-400 ring-2 ring-amber-50'
                    : isReady
                    ? 'border-emerald-300'
                    : 'border-stone-200'
                }`}
              >
                {/* Order Card Top Bar */}
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between ${
                    isCriticalDelay
                      ? 'bg-red-50/80 border-red-200'
                      : isWarningDelay
                      ? 'bg-amber-50/80 border-amber-200'
                      : isReady
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black font-mono tracking-tight text-stone-900">
                      {order.tokenNumber}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      #{order.id.slice(-5)}
                    </span>
                  </div>

                  {/* Elapsed Timer with Alert */}
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                    <Clock className={`w-3.5 h-3.5 ${isCriticalDelay ? 'text-red-600 animate-pulse' : isWarningDelay ? 'text-amber-600' : 'text-stone-500'}`} />
                    <span
                      className={`tabular-nums px-2 py-0.5 rounded ${
                        isCriticalDelay
                          ? 'bg-red-600 text-white animate-pulse'
                          : isWarningDelay
                          ? 'bg-amber-500 text-white'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {formatElapsedTime(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Delay Alert Warning banner */}
                {(isCriticalDelay || isWarningDelay) && (
                  <div className={`px-4 py-1 text-[11px] font-semibold flex items-center gap-1.5 ${
                    isCriticalDelay ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isCriticalDelay ? 'CRITICAL DELAY: >15 MINS IN QUEUE' : `DELAY WARNING: >${delayThresholdMinutes} MINS`}</span>
                  </div>
                )}

                {/* Items List */}
                <div className="p-4 flex-1">
                  <div className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider mb-2">
                    Items &amp; Exact Portions
                  </div>
                  <ul className="divide-y divide-stone-100">
                    {order.items.map(item => {
                      const isWeight = item.unit === 'kg';
                      const formattedQty = isWeight
                        ? item.quantity < 1
                          ? `${Math.round(item.quantity * 1000)}g`
                          : `${item.quantity.toFixed(2)} kg`
                        : `${item.quantity} ${item.unit}`;

                      return (
                        <li key={item.id} className="py-2 flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-semibold text-stone-900">
                              {item.productName}
                            </span>
                            {item.hindiName && (
                              <span className="text-xs text-stone-400 ml-1.5">{item.hindiName}</span>
                            )}
                            {item.specialInstructions && (
                              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 mt-1 font-medium">
                                👉 {item.specialInstructions}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-bold font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded shrink-0">
                            {formattedQty}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* General Order Notes */}
                  {order.notes && (
                    <div className="mt-3 p-2 bg-stone-50 border border-stone-200 rounded text-xs text-stone-700">
                      <span className="font-semibold text-stone-900">Kitchen Note:</span> {order.notes}
                    </div>
                  )}
                </div>

                {/* Status Actions Footer */}
                <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2">
                  {/* Reprint KOT Button */}
                  <button
                    onClick={() => handleReprintKOT(order)}
                    className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors text-xs flex items-center gap-1"
                    title="Reprint Kitchen Order Ticket (KOT)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reprint</span>
                    {kotJob && kotJob.reprintCount > 0 && (
                      <span className="text-[10px] bg-stone-300 text-stone-700 px-1 rounded font-mono">
                        {kotJob.reprintCount}
                      </span>
                    )}
                  </button>

                  {/* Lifecycle Progression Buttons */}
                  <div className="flex items-center gap-2">
                    {isReceived && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        disabled={updatingOrderId === order.id}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Preparing</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        disabled={updatingOrderId === order.id}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {isReady && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Ready at Counter</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
