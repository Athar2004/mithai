import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
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
  Legend,
} from 'recharts';

const PIE_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

export const AdminDashboard: React.FC = () => {
  const { analytics, orders, settings, currentUser } = useApp();
  const [dateFilter, setDateFilter] = useState<string>('');

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-stone-500">
        Loading analytics...
      </div>
    );
  }

  // Export functions
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
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
    downloadCSV(`MithaiFlow_Orders_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
  };

  const handleExportProductsCSV = () => {
    const headers = ['Product Name', 'Quantity Sold', 'Revenue (INR)', 'Unit'];
    const rows = analytics.topProducts.map(p => [
      `"${p.name}"`,
      p.quantityFormatted,
      p.revenue,
      p.unit,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`MithaiFlow_TopProducts_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
            Operations &amp; Sales Dashboard
          </h1>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
            <span>{settings?.shopName}</span>
            <span aria-hidden="true">·</span>
            <span>Live Aggregations</span>
            <span aria-hidden="true">·</span>
            <span>Real-time DB Sync</span>
          </div>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportOrdersCSV}
            className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export Orders CSV</span>
          </button>
          <button
            onClick={handleExportProductsCSV}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Product Sales</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row 1: Financial & Volume Figures */}
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

      {/* Live Operational Status Strip */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-stone-600">Kitchen Preparing:</span>
            <span className="font-bold font-mono text-stone-900">{analytics.preparingOrders}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-stone-600">Ready at Counter:</span>
            <span className="font-bold font-mono text-stone-900">{analytics.readyOrders}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-stone-600">Unpaid at Billing:</span>
            <span className="font-bold font-mono text-stone-900">{analytics.unpaidOrders}</span>
          </div>
        </div>
        <div className="text-stone-500 text-[11px] font-mono">
          Last refreshed: {new Date().toLocaleTimeString('en-IN')}
        </div>
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Sales Bar Chart (8 cols) */}
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

        {/* Payment Methods Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Payment Breakdown</h3>
            <p className="text-xs text-stone-500">Cash vs UPI vs Card distribution</p>
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

          {/* Payment Method Rows */}
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
        {/* Top 5 Products Table (7 cols) */}
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

        {/* Category Performance (5 cols) */}
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
  );
};
