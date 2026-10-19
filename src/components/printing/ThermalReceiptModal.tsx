import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Printer, X, Copy, Check, SplitSquareVertical, Download, FileText } from 'lucide-react';

export const ThermalReceiptModal: React.FC = () => {
  const { activeThermalReceipt, closeThermalReceipt } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'both' | 'primary' | 'secondary'>('both');

  useEffect(() => {
    if (activeThermalReceipt?.initialTab) {
      setActiveTab(activeThermalReceipt.initialTab);
    } else {
      setActiveTab('both');
    }
  }, [activeThermalReceipt]);

  if (!activeThermalReceipt) return null;

  const hasSecondary = Boolean(activeThermalReceipt.secondaryText);
  const is80mm = activeThermalReceipt.paperWidth === '80mm' || activeThermalReceipt.jobType === 'TAX_INVOICE';

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentText =
    activeTab === 'secondary' && activeThermalReceipt.secondaryText
      ? activeThermalReceipt.secondaryText
      : activeThermalReceipt.text;

  const primaryTitle =
    activeThermalReceipt.title ||
    (is80mm ? 'Cashier Tax Invoice (3-Inch / 80mm)' : 'Customer Waiting Token (2-Inch)');
  const secondaryTitle =
    activeThermalReceipt.secondaryTitle || 'Order POS Dispatch Slip (2-Inch / 50.8mm)';

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl w-full p-4 sm:p-6 shadow-2xl border border-stone-200 relative my-6 transition-all ${
          hasSecondary && activeTab === 'both' ? 'max-w-4xl' : is80mm ? 'max-w-xl' : 'max-w-lg'
        }`}
      >
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-stone-200 gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>
                  {hasSecondary && activeTab === 'both'
                    ? `Dual Print Queue — Token #${activeThermalReceipt.tokenNumber || ''}`
                    : activeTab === 'secondary'
                    ? secondaryTitle
                    : primaryTitle}
                </span>
              </h3>
              {activeThermalReceipt.tokenNumber && (
                <span className="px-2 py-0.5 bg-stone-900 text-amber-400 font-mono text-xs font-bold rounded">
                  #{activeThermalReceipt.tokenNumber}
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                is80mm
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-blue-50 text-blue-800 border-blue-300'
              }`}>
                {is80mm ? '3-INCH (80MM / 48 COLS)' : '2-INCH (58MM / 32 COLS)'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-mono mt-0.5">
              Sheetal Gajak Kulfi · Thermal ESC/POS Printable Output
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => handleCopy(currentText)}
              className="p-1.5 px-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs transition-colors flex items-center gap-1 border border-stone-200 cursor-pointer shadow-2xs"
              title="Copy receipt text to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() =>
                handleDownload(
                  currentText,
                  `${is80mm ? 'cashier_invoice' : 'order_slip'}_${activeThermalReceipt.tokenNumber || 'receipt'}.txt`
                )
              }
              className="p-1.5 px-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs transition-colors flex items-center gap-1 border border-stone-200 cursor-pointer shadow-2xs"
              title="Download raw receipt text"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Export</span>
            </button>
            <button
              onClick={closeThermalReceipt}
              className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher if both receipts are present */}
        {hasSecondary && (
          <div className="flex items-center justify-center p-1 bg-stone-100 rounded-lg mt-3 text-xs font-medium">
            <button
              onClick={() => setActiveTab('both')}
              className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'both' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-amber-600" />
              <span>Queue View (Both Slips)</span>
            </button>
            <button
              onClick={() => setActiveTab('primary')}
              className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'primary' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Customer Slip (2")
            </button>
            <button
              onClick={() => setActiveTab('secondary')}
              className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'secondary' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Dispatch Slip (2")
            </button>
          </div>
        )}

        {/* Realistic Thermal Paper Simulation Container */}
        <div className="my-4 bg-stone-200/70 p-3 sm:p-5 rounded-xl border border-stone-300/80 overflow-x-auto max-h-[520px]">
          <div id="printable-thermal-receipt" className="flex flex-col md:flex-row justify-center items-start gap-5 mx-auto w-fit">
            {/* Receipt 1: Customer Token Slip OR 3-Inch Cashier Bill */}
            {(activeTab === 'both' || activeTab === 'primary') && (
              <div className="flex flex-col items-center thermal-slip-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5 no-print">
                  {is80mm
                    ? '3-Inch (80mm / 48 cols) Cashier Tax Invoice'
                    : '1. Customer Token Slip (2-Inch / 58mm · Token Only)'}
                </span>

                {/* Thermal Receipt Paper Sheet */}
                <div
                  className={`bg-[#fefdfb] text-stone-900 shadow-lg border-x border-stone-300/80 font-mono p-4 sm:p-5 select-text rounded-xs transition-all ${
                    is80mm ? 'w-[390px] sm:w-[430px]' : 'w-[285px] sm:w-[295px]'
                  }`}
                  style={{
                    fontFamily: '"JetBrains Mono", "Courier New", Courier, monospace',
                    fontSize: is80mm ? '11px' : '11px',
                    lineHeight: '1.32',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Top Perforated Serration Line */}
                  <div className="text-center text-stone-300 text-[8px] tracking-[3px] pb-2.5 select-none no-print border-b border-stone-200 mb-2">
                    - - - - - - - - CUT HERE - - - - - - - -
                  </div>

                  <pre className="whitespace-pre font-mono text-stone-900 overflow-x-auto scrollbar-none">
                    {activeThermalReceipt.text}
                  </pre>

                  {/* Bottom Perforated Serration Line */}
                  <div className="text-center text-stone-300 text-[8px] tracking-[3px] pt-3 select-none no-print border-t border-stone-200 mt-2">
                    - - - - - - - - TEAR HERE - - - - - - - -
                  </div>
                </div>
              </div>
            )}

            {/* Print separator between slips in queue */}
            {hasSecondary && activeTab === 'both' && (
              <div className="thermal-cut-separator hidden print:block" />
            )}

            {/* Receipt 2: Order POS Slip */}
            {hasSecondary && (activeTab === 'both' || activeTab === 'secondary') && (
              <div className="flex flex-col items-center thermal-slip-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1.5 no-print">
                  2. Order POS Dispatch Slip (2-Inch / 58mm · Packing Slip)
                </span>

                <div
                  className="bg-[#fefdfb] text-stone-900 shadow-lg border-x border-stone-300/80 font-mono p-4 sm:p-5 select-text rounded-xs w-[285px] sm:w-[295px]"
                  style={{
                    fontFamily: '"JetBrains Mono", "Courier New", Courier, monospace',
                    fontSize: '11px',
                    lineHeight: '1.32',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  <div className="text-center text-stone-300 text-[8px] tracking-[3px] pb-2.5 select-none no-print border-b border-stone-200 mb-2">
                    - - - - - - - - CUT HERE - - - - - - - -
                  </div>

                  <pre className="whitespace-pre font-mono text-stone-900 overflow-x-auto scrollbar-none">
                    {activeThermalReceipt.secondaryText}
                  </pre>

                  <div className="text-center text-stone-300 text-[8px] tracking-[3px] pt-3 select-none no-print border-t border-stone-200 mt-2">
                    - - - - - - - - TEAR HERE - - - - - - - -
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-stone-200">
          <button
            type="button"
            onClick={closeThermalReceipt}
            className="sm:w-28 py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>

          {hasSecondary ? (
            <div className="flex-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('primary');
                  setTimeout(() => handlePrint(), 50);
                }}
                className="flex-1 min-w-[130px] py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-stone-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-stone-600" />
                <span>Print Slip #1 (2")</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('secondary');
                  setTimeout(() => handlePrint(), 50);
                }}
                className="flex-1 min-w-[130px] py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-700" />
                <span>Print Slip #2 (2")</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('both');
                  setTimeout(() => handlePrint(), 50);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Both in Queue</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>
                {is80mm
                  ? 'Print to 3-Inch Thermal Printer (80mm)'
                  : 'Print to 2-Inch Thermal Printer (58mm)'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
