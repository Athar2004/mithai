import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { PrintJob, PrinterConfig } from '../../types/index.ts';
import * as api from '../../lib/api.ts';
import {
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Clock,
  Wifi,
  WifiOff,
  Code2,
  ExternalLink,
} from 'lucide-react';

export const PrintAgentTerminal: React.FC = () => {
  const { printJobs, printers, refreshData, openThermalReceipt, currentUser } = useApp();
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  // Filter jobs
  const filteredJobs = printJobs.filter(j => {
    if (filterType === 'all') return true;
    return j.jobType === filterType;
  });

  const handleRetry = async (job: PrintJob) => {
    setIsRetrying(job.id);
    try {
      await api.retryPrintJob(job.id);
      await refreshData();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(null);
    }
  };

  const handleReprint = async (job: PrintJob) => {
    try {
      const updated = await api.reprintJob(job.id, currentUser.name);
      openThermalReceipt({
        title: `Reprint - ${job.jobType} (${job.tokenNumber})`,
        text: updated.payload,
        paperWidth: updated.paperWidth,
        tokenNumber: job.tokenNumber,
        jobType: job.jobType,
      });
      await refreshData();
    } catch (err) {
      console.error('Reprint failed:', err);
    }
  };

  const handleTogglePrinter = async (printer: PrinterConfig) => {
    try {
      await api.updatePrinter(printer.id, { isConnected: !printer.isConnected });
      await refreshData();
    } catch (err) {
      console.error('Failed to update printer state:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
            Thermal Print Agent &amp; Hardware Hub
          </h1>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
            <span>ESC/POS Thermal Protocol Engine</span>
            <span aria-hidden="true">·</span>
            <span>Supports 58mm &amp; 80mm Roll Widths</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Duplicate Idempotent Queue</span>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refreshData()}
          className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
          <span>Refresh Print Queue</span>
        </button>
      </div>

      {/* Printer Hardware Status Cards */}
      <div>
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
          Configured Thermal Printers &amp; Station Links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {printers.map(printer => {
            return (
              <div
                key={printer.id}
                className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                      {printer.paperWidth}
                    </span>
                    <button
                      onClick={() => handleTogglePrinter(printer)}
                      className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                        printer.isConnected
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                      title="Click to toggle printer connection simulator"
                    >
                      {printer.isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      <span>{printer.isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 mt-2">{printer.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5 font-mono">Role: {printer.targetRole}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>Interface: {printer.interfaceType}</span>
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                    Auto-Cut Enabled
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Print Jobs Queue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-stone-200 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Print Jobs Queue</h3>
              <p className="text-xs text-stone-500">{filteredJobs.length} dispatched print jobs</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-0.5 bg-stone-100 rounded text-xs">
              {['all', 'CUSTOMER_TOKEN', 'KITCHEN_TICKET', 'TAX_INVOICE'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    filterType === t ? 'bg-white font-semibold text-stone-900 shadow-2xs' : 'text-stone-600'
                  }`}
                >
                  {t === 'all' ? 'All' : t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-stone-200 rounded-lg overflow-hidden mt-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium">
                <tr>
                  <th className="p-2.5">Job ID</th>
                  <th className="p-2.5">Type &amp; Token</th>
                  <th className="p-2.5">Paper</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800 font-mono">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-stone-400 font-sans">
                      No print jobs in queue.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map(job => {
                    const isSelected = selectedJob?.id === job.id;
                    const isSuccess = job.status === 'PRINTED';
                    const isFailed = job.status === 'FAILED';

                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50/80 font-bold' : 'hover:bg-stone-50'
                        }`}
                      >
                        <td className="p-2.5 text-stone-900">{job.id}</td>
                        <td className="p-2.5 font-sans">
                          <span className="font-semibold text-stone-900">{job.tokenNumber}</span>
                          <span className="text-[11px] text-stone-400 ml-1.5 font-mono">
                            ({job.jobType})
                          </span>
                        </td>
                        <td className="p-2.5 text-stone-600">{job.paperWidth}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isSuccess
                                ? 'bg-emerald-100 text-emerald-800'
                                : isFailed
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {job.status}
                          </span>
                          {job.reprintCount > 0 && (
                            <span className="ml-1 text-[10px] text-stone-500 font-sans">
                              (Reprinted x{job.reprintCount})
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {isFailed && (
                              <button
                                onClick={() => handleRetry(job)}
                                disabled={isRetrying === job.id}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded flex items-center gap-1 transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Retry</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleReprint(job)}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-medium rounded flex items-center gap-1 transition-colors"
                              title="Reprint receipt"
                            >
                              <Printer className="w-3 h-3 text-stone-600" />
                              <span>Reprint</span>
                            </button>

                            <button
                              onClick={() => {
                                openThermalReceipt({
                                  title: `${job.jobType} - ${job.tokenNumber}`,
                                  text: job.payload,
                                  paperWidth: job.paperWidth,
                                  tokenNumber: job.tokenNumber,
                                  jobType: job.jobType,
                                });
                              }}
                              className="p-1 text-stone-400 hover:text-stone-900 rounded"
                              title="View formatted receipt"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Job Thermal Preview & ESC/POS Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-stone-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-stone-900 mb-1">Receipt Preview</h3>
          <p className="text-xs text-stone-500 mb-3">
            {selectedJob ? `${selectedJob.paperWidth} Thermal Receipt` : 'Select a print job to inspect'}
          </p>

          {selectedJob ? (
            <div className="space-y-4">
              {/* Thermal Paper Simulation */}
              <div className="bg-amber-50/40 p-4 rounded-lg border border-dashed border-stone-300 font-mono text-xs whitespace-pre text-stone-800 leading-tight overflow-x-auto shadow-inner">
                {selectedJob.payload}
              </div>

              {/* ESC/POS Raw Hex Data (Hardware debugging) */}
              {selectedJob.rawEscPosHex && (
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Raw ESC/POS Hex Bytes</span>
                  </div>
                  <div className="p-2 bg-stone-900 text-amber-300 font-mono text-[10px] rounded break-all max-h-24 overflow-y-auto">
                    {selectedJob.rawEscPosHex.slice(0, 200)}...
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    openThermalReceipt({
                      title: `${selectedJob.jobType} - ${selectedJob.tokenNumber}`,
                      text: selectedJob.payload,
                      paperWidth: selectedJob.paperWidth,
                      tokenNumber: selectedJob.tokenNumber,
                      jobType: selectedJob.jobType,
                    });
                  }}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Browser Print Emulation</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-stone-400 text-xs">
              Select any print job from the left table to inspect formatted output and ESC/POS hex payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
