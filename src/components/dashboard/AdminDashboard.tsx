import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { Order } from '../../types/index.ts';
import * as api from '../../lib/api.ts';
import type { DayEndSalesSummary, DayEndReportResponse } from '../../lib/api.ts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  IndianRupee,
  UtensilsCrossed,
  ChefHat,
  CreditCard,
  Banknote,
  QrCode,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  X,
  Printer,
  Receipt,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

export const AdminDashboard: React.FC = () => {
  const { analytics, orders, settings, currentUser, openThermalReceipt } = useApp();

  const [activeTab, setActiveTab] = useState<'day_end_report' | 'live_operations'>('day_end_report');

  // Day-End Sales Report State
  const [reportData, setReportData] = useState<DayEndReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(''); // empty = all dates
  const [selectedDatePreset, setSelectedDatePreset] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');

  // Drilldown Modal for date bills
  const [drilldownDate, setDrilldownDate] = useState<string | null>(null);

  const formatYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const loadDayEndReport = useCallback(async (date?: string) => {
    setReportLoading(true);
    try {
      const data = await api.fetchDayEndSalesReport(date || undefined);
      setReportData(data);
    } catch (err) {
      console.error('Failed to load day end sales report:', err);
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDayEndReport(selectedDateFilter);
  }, [loadDayEndReport, selectedDateFilter]);

  const handlePresetChange = (preset: 'all' | 'today' | 'yesterday' | 'custom') => {
    setSelectedDatePreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setSelectedDateFilter('');
    } else if (preset === 'today') {
      setSelectedDateFilter(formatYMD(now));
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      setSelectedDateFilter(formatYMD(y));
    }
  };

  // CSV Export functions
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDayEndCSV = () => {
    if (!reportData || reportData.summaries.length === 0) return;

    const headers = [
      'Date',
      'Total Bills',
      'Net Amount (INR)',
      'Cash Amount (INR)',
      'UPI Amount (INR)',
      'Card Amount (INR)',
      'Taxable Goods (INR)',
      'CGST 2.5% (INR)',
      'SGST 2.5% (INR)',
      'Total Tax 5% (INR)',
      'Discount (INR)',
    ];

    const rows = reportData.summaries.map(s => [
      s.date,
      s.totalBills,
      s.netAmount.toFixed(2),
      s.cashAmount.toFixed(2),
      s.upiAmount.toFixed(2),
      s.cardAmount.toFixed(2),
      s.taxableAmount.toFixed(2),
      s.cgstAmount.toFixed(2),
      s.sgstAmount.toFixed(2),
      s.totalTax.toFixed(2),
      s.discountAmount.toFixed(2),
    ]);

    // Summary row
    const totalsRow = [
      'TOTAL SUMMARY',
      reportData.totals.totalBills,
      reportData.totals.netAmount.toFixed(2),
      reportData.totals.cashAmount.toFixed(2),
      reportData.totals.upiAmount.toFixed(2),
      reportData.totals.cardAmount.toFixed(2),
      reportData.totals.taxableAmount.toFixed(2),
      reportData.totals.cgstAmount.toFixed(2),
      reportData.totals.sgstAmount.toFixed(2),
      reportData.totals.totalTax.toFixed(2),
      reportData.totals.discountAmount.toFixed(2),
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.join(',')), totalsRow.join(',')].join('\n');
    const dateTag = selectedDateFilter || 'All_Dates';
    downloadCSV(`Sheetal_Gajak_Day_End_Sales_${dateTag}.csv`, csvContent);
  };

  const handleExportOrdersCSV = () => {
    const headers = ['Order ID', 'Token', 'Date', 'Time', 'Items Count', 'Subtotal', 'Tax', 'Final Amount', 'Status', 'Payment Status', 'Created By'];
    const rows = orders.map(o => [
      o.id,
      o.tokenNumber,
      o.businessDate,
      new Date(o.createdAt).toLocaleTimeString('en-IN'),
      o.items.length,
      o.subtotal.toFixed(2),
      o.totalTax.toFixed(2),
      o.finalAmount.toFixed(2),
      o.status,
      o.paymentStatus,
      `"${o.createdByName}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`Sheetal_Gajak_Orders_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
  };

  const handleExportProductsCSV = () => {
    if (!analytics) return;
    const headers = ['Product Name', 'Quantity Sold', 'Revenue (INR)', 'Unit'];
    const rows = analytics.topProducts.map(p => [
      `"${p.name}"`,
      p.quantityFormatted,
      p.revenue,
      p.unit,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`Sheetal_Gajak_TopProducts_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
  };

  // Orders matching drilldown date
  const drilldownOrders = useMemo(() => {
    if (!drilldownDate) return [];
    return orders.filter(o => {
      const d = o.businessDate || o.createdAt.slice(0, 10);
      return d === drilldownDate && o.paymentStatus === 'PAID';
    });
  }, [orders, drilldownDate]);

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-stone-500 font-mono">
        Loading analytics &amp; sales reports...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
              Admin Hub &amp; Sales Reports
            </h1>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
              Admin Exclusive
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
            <span className="font-semibold text-stone-700">{settings?.shopName || 'Sheetal Gajak Kulfi'}</span>
            <span aria-hidden="true">·</span>
            <span>Date-Wise Day-End Reconciliation</span>
            <span aria-hidden="true">·</span>
            <span>Live Aggregations</span>
          </div>
        </div>

        {/* Tab switcher: Day-End Report vs Live Operations */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-white border border-stone-200 rounded-lg shadow-2xs text-xs font-semibold">
            <button
              onClick={() => setActiveTab('day_end_report')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'day_end_report'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Day-End Sales Report</span>
            </button>
            <button
              onClick={() => setActiveTab('live_operations')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'live_operations'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live Operations &amp; Velocity</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DAY-END DATE-WISE SALES REPORT (MAIN USER REQUIREMENT) */}
      {/* ============================================================ */}
      {activeTab === 'day_end_report' && (
        <div className="space-y-6">
          {/* Controls Bar: Presets, Date Picker & Export */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-stone-700 mr-1">Date Scope:</span>
              <button
                onClick={() => handlePresetChange('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedDatePreset === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                All Dates
              </button>
              <button
                onClick={() => handlePresetChange('today')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedDatePreset === 'today'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handlePresetChange('yesterday')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedDatePreset === 'yesterday'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                Yesterday
              </button>

              {/* Custom Date Input */}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => {
                    setSelectedDateFilter(e.target.value);
                    setSelectedDatePreset('custom');
                  }}
                  className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
                {selectedDateFilter && (
                  <button
                    onClick={() => handlePresetChange('all')}
                    className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                    title="Clear date filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* CSV Export Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDayEndCSV}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download formatted CSV spreadsheet of day-end sales report"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Day-End Sales CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards: Net Amt, Cash Amt, UPI Amt, Card Amt */}
          {reportData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: NET AMOUNT */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-900">
                    Net Amount (Total Sales)
                  </span>
                  <IndianRupee className="w-4 h-4 text-amber-700" />
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-stone-900 tabular-nums">
                  ₹{reportData.totals.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-stone-600 font-medium mt-1 flex items-center justify-between">
                  <span>{reportData.totals.totalBills} paid bills/tokens</span>
                  {reportData.totals.discountAmount > 0 && (
                    <span className="text-amber-800">
                      Discounts: ₹{reportData.totals.discountAmount.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Card 2: CASH AMOUNT */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-900">
                    Cash Amount (Net Cash)
                  </span>
                  <Banknote className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-emerald-900 tabular-nums">
                  ₹{reportData.totals.cashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">
                  {reportData.totals.netAmount > 0
                    ? `${Math.round((reportData.totals.cashAmount / reportData.totals.netAmount) * 100)}% of total collections`
                    : 'No cash collections'}
                </div>
              </div>

              {/* Card 3: UPI AMOUNT */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-blue-900">
                    UPI Amount (QR / Apps)
                  </span>
                  <QrCode className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-blue-900 tabular-nums">
                  ₹{reportData.totals.upiAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-blue-700 font-medium mt-1">
                  {reportData.totals.netAmount > 0
                    ? `${Math.round((reportData.totals.upiAmount / reportData.totals.netAmount) * 100)}% of total collections`
                    : 'No UPI collections'}
                </div>
              </div>

              {/* Card 4: CARD AMOUNT */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-purple-900">
                    Card Amount (POS Machine)
                  </span>
                  <CreditCard className="w-4 h-4 text-purple-600" />
                </div>
                <div className="mt-2 text-2xl font-black font-mono text-purple-900 tabular-nums">
                  ₹{reportData.totals.cardAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-purple-700 font-medium mt-1">
                  {reportData.totals.netAmount > 0
                    ? `${Math.round((reportData.totals.cardAmount / reportData.totals.netAmount) * 100)}% of total collections`
                    : 'No card collections'}
                </div>
              </div>
            </div>
          )}

          {/* 5% Inclusive GST Statutory Summary Banner */}
          {reportData && (
            <div className="bg-stone-900 text-stone-100 p-4 rounded-xl border border-stone-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  Statutory 5% GST Summary (Retail Inclusive)
                </span>
                <p className="text-xs text-stone-400 mt-0.5">
                  Computed via reverse calculation for statutory accounting &amp; GSTR-1 filing
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
                  <span className="text-stone-400 block text-[10px]">Taxable Goods:</span>
                  <span className="text-white font-bold">
                    ₹{reportData.totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
                  <span className="text-stone-400 block text-[10px]">CGST (2.5%):</span>
                  <span className="text-amber-300 font-bold">
                    ₹{reportData.totals.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
                  <span className="text-stone-400 block text-[10px]">SGST (2.5%):</span>
                  <span className="text-amber-300 font-bold">
                    ₹{reportData.totals.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
                  <span className="text-stone-400 block text-[10px]">Total 5% GST:</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{reportData.totals.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* On-Screen Table: Date-Wise Sales Breakdown */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  Date-Wise Sales Breakdown (On-Screen Table)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Itemized by business day with exact net amount, cash, UPI, card, and tax breakdowns
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-stone-500">
                {reportData?.summaries.length || 0} date records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Business Date</th>
                    <th className="py-3 px-3 text-center">Paid Bills</th>
                    <th className="py-3 px-3 text-right bg-amber-50/60 text-amber-950 font-bold">
                      Net Amt (₹)
                    </th>
                    <th className="py-3 px-3 text-right bg-emerald-50/60 text-emerald-950 font-bold">
                      Cash Amt (₹)
                    </th>
                    <th className="py-3 px-3 text-right bg-blue-50/60 text-blue-950 font-bold">
                      UPI Amt (₹)
                    </th>
                    <th className="py-3 px-3 text-right bg-purple-50/60 text-purple-950 font-bold">
                      Card Amt (₹)
                    </th>
                    <th className="py-3 px-3 text-right text-stone-600">Taxable Goods</th>
                    <th className="py-3 px-3 text-right text-stone-600">CGST (2.5%)</th>
                    <th className="py-3 px-3 text-right text-stone-600">SGST (2.5%)</th>
                    <th className="py-3 px-3 text-right text-stone-600">Total 5% GST</th>
                    <th className="py-3 px-3 text-right text-stone-600">Discount</th>
                    <th className="py-3 px-3.5 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100 font-mono tabular-nums text-stone-800">
                  {reportLoading ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-stone-400">
                        Generating date-wise report...
                      </td>
                    </tr>
                  ) : !reportData || reportData.summaries.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-stone-400">
                        No settled orders found for selected date scope.
                      </td>
                    </tr>
                  ) : (
                    reportData.summaries.map(s => (
                      <tr key={s.date} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3.5 font-sans font-bold text-stone-900 whitespace-nowrap">
                          {s.date}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-stone-700">
                          {s.totalBills}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-950 bg-amber-50/30">
                          ₹{s.netAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                          ₹{s.cashAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-blue-700 bg-blue-50/30">
                          ₹{s.upiAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-purple-700 bg-purple-50/30">
                          ₹{s.cardAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-600">
                          ₹{s.taxableAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-500">
                          ₹{s.cgstAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-500">
                          ₹{s.sgstAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-stone-700">
                          ₹{s.totalTax.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-500">
                          {s.discountAmount > 0 ? `-₹${s.discountAmount.toFixed(2)}` : '₹0.00'}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => setDrilldownDate(s.date)}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold rounded flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                            title={`View all individual bills for ${s.date}`}
                          >
                            <Eye className="w-3 h-3 text-stone-600" />
                            <span>View Bills</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Bottom Totals Row */}
                {reportData && reportData.summaries.length > 0 && (
                  <tfoot className="bg-stone-900 text-white font-mono font-bold text-xs border-t-2 border-stone-800">
                    <tr>
                      <td className="py-3.5 px-3.5 font-sans uppercase tracking-wider text-amber-400">
                        TOTAL SUMMARY
                      </td>
                      <td className="py-3.5 px-3 text-center text-amber-300">
                        {reportData.totals.totalBills}
                      </td>
                      <td className="py-3.5 px-3 text-right text-amber-300 bg-stone-800">
                        ₹{reportData.totals.netAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-emerald-300 bg-stone-800">
                        ₹{reportData.totals.cashAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-blue-300 bg-stone-800">
                        ₹{reportData.totals.upiAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-purple-300 bg-stone-800">
                        ₹{reportData.totals.cardAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-stone-300">
                        ₹{reportData.totals.taxableAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-stone-400">
                        ₹{reportData.totals.cgstAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-stone-400">
                        ₹{reportData.totals.sgstAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-emerald-400">
                        ₹{reportData.totals.totalTax.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-stone-400">
                        {reportData.totals.discountAmount > 0
                          ? `-₹${reportData.totals.discountAmount.toFixed(2)}`
                          : '₹0.00'}
                      </td>
                      <td className="py-3.5 px-3.5 text-center text-stone-400 text-[10px]">
                        —
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: LIVE OPERATIONS & VELOCITY CHARTS */}
      {/* ============================================================ */}
      {activeTab === 'live_operations' && (
        <div className="space-y-6">
          {/* Export Buttons */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleExportOrdersCSV}
              className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export Orders CSV</span>
            </button>
            <button
              onClick={handleExportProductsCSV}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Product Sales</span>
            </button>
          </div>

          {/* Financial & Volume Figures */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Today's Paid Revenue</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-stone-900 tabular-nums">
                ₹{analytics.totalSalesToday.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{analytics.paidOrders} paid invoices collected</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Pending Unpaid Value</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-amber-900 tabular-nums">
                ₹{analytics.unpaidSalesToday.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{analytics.unpaidOrders} customer tokens pending billing</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Total Orders Today</span>
                <UtensilsCrossed className="w-4 h-4 text-stone-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-stone-900 tabular-nums">
                {analytics.ordersToday}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                {analytics.cancelledOrders > 0 ? `${analytics.cancelledOrders} cancelled` : '0 cancellations'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Avg Kitchen Prep Time</span>
                <ChefHat className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-stone-900 tabular-nums">
                {analytics.avgPreparationTimeMinutes}m
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Avg Customer Wait: {analytics.avgWaitTimeMinutes}m
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Today's Hourly Sales Velocity</h3>
                  <p className="text-xs text-stone-500">Collected revenue (₹) by hour of day</p>
                </div>
                <span className="text-xs font-mono font-medium text-stone-500">INR (₹)</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.hourlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="hour" stroke="#78716c" fontSize={11} tickLine={false} />
                    <YAxis stroke="#78716c" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']}
                      contentStyle={{ backgroundColor: '#1c1917', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="sales" fill="#d97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Today's Payment Breakdown</h3>
                <p className="text-xs text-stone-500">Live distribution by payment mode</p>
              </div>

              <div className="h-52 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.paymentBreakdown.filter(p => p.amount > 0)}
                      dataKey="amount"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {analytics.paymentBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Collected']}
                      contentStyle={{ backgroundColor: '#1c1917', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="divide-y divide-stone-100 text-xs">
                {analytics.paymentBreakdown.map((p, idx) => (
                  <div key={p.method} className="py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="font-medium text-stone-700">{p.method}</span>
                    </div>
                    <div className="font-mono text-stone-900 tabular-nums font-bold">
                      ₹{p.amount.toLocaleString('en-IN')} <span className="text-[11px] text-stone-400 font-normal">({p.count} txns)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tables: Top Selling Products and Category Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
              <h3 className="text-sm font-bold text-stone-900 mb-1">Top Selling Sweets &amp; Snacks</h3>
              <p className="text-xs text-stone-500 mb-3">Ranked by revenue contribution</p>

              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 text-right">Volume Sold</th>
                      <th className="p-2.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800 font-mono tabular-nums">
                    {analytics.topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-stone-400">
                          No sales recorded for today yet.
                        </td>
                      </tr>
                    ) : (
                      analytics.topProducts.map((prod, i) => (
                        <tr key={prod.name} className="hover:bg-stone-50">
                          <td className="p-2.5 font-sans font-medium text-stone-900 flex items-center gap-2">
                            <span className="text-[11px] text-stone-400 font-mono">{i + 1}.</span>
                            <span>{prod.name}</span>
                          </td>
                          <td className="p-2.5 text-right font-medium">{prod.quantityFormatted}</td>
                          <td className="p-2.5 text-right font-bold text-amber-900">₹{prod.revenue.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
              <h3 className="text-sm font-bold text-stone-900 mb-1">Category Revenue</h3>
              <p className="text-xs text-stone-500 mb-3">Performance by sweet shop department</p>

              <div className="space-y-3">
                {analytics.categoryPerformance.map(cat => {
                  const maxRev = Math.max(...analytics.categoryPerformance.map(c => c.revenue), 1);
                  const pct = Math.round((cat.revenue / maxRev) * 100);

                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-stone-800">{cat.category}</span>
                        <span className="font-mono font-bold text-stone-900 tabular-nums">
                          ₹{cat.revenue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DRILLDOWN MODAL: INDIVIDUAL BILLS FOR SELECTED DATE */}
      {/* ============================================================ */}
      {drilldownDate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
            {/* Modal Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Day-End Bills for {drilldownDate}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {drilldownOrders.length} paid customer bills &amp; invoices
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrilldownDate(null)}
                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {drilldownOrders.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-sm">
                  No individual orders found for {drilldownDate}.
                </div>
              ) : (
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Token</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Items Summary</th>
                        <th className="py-2.5 px-3 text-right">Final Amt (₹)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono tabular-nums text-stone-800">
                      {drilldownOrders.map(ord => (
                        <tr key={ord.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-bold text-amber-800">
                            {ord.tokenNumber}
                          </td>
                          <td className="py-2.5 px-3 text-stone-500 font-sans">
                            {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-stone-700 max-w-xs truncate">
                            {ord.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-stone-900">
                            ₹{ord.finalAmount.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                              PAID
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                const receiptText = api.buildTaxInvoiceReceiptText(ord, settings);
                                openThermalReceipt({
                                  title: `Tax Invoice ${ord.tokenNumber} (3-Inch)`,
                                  text: receiptText,
                                  paperWidth: '80mm',
                                  tokenNumber: ord.tokenNumber,
                                  jobType: 'TAX_INVOICE',
                                });
                              }}
                              className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[11px] font-sans font-semibold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-amber-400" />
                              <span>Print Bill</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setDrilldownDate(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
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
