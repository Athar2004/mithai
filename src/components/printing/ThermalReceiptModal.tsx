import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Printer, X, Copy, Check, SplitSquareVertical } from 'lucide-react';

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

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const primaryTitle = activeThermalReceipt.title || 'Customer Waiting Token (2-Inch)';
  const secondaryTitle = activeThermalReceipt.secondaryTitle || 'Order POS Dispatch Slip (2-Inch / 50.8mm)';

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 relative my-6 transition-all ${
        hasSecondary && activeTab === 'both' ? 'max-w-3xl' : 'max-w-lg'
      }`}>
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900">
                {hasSecondary && activeTab === 'both'
                  ? `Dual Receipts — Token ${activeThermalReceipt.tokenNumber || ''}`
                  : activeTab === 'secondary'
                  ? secondaryTitle
                  : primaryTitle}
              </h3>
              {activeThermalReceipt.tokenNumber && (
                <span className="px-2 py-0.5 bg-stone-900 text-amber-400 font-mono text-xs font-bold rounded">
                  {activeThermalReceipt.tokenNumber}
                </span>
              )}
            </div>
            <span className="text-[11px] text-stone-500 font-mono">
              ESC/POS Thermal Formatter · 58mm &amp; 80mm Compatible
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => handleCopy(
                activeTab === 'secondary' && activeThermalReceipt.secondaryText
                  ? activeThermalReceipt.secondaryText
                  : activeThermalReceipt.text
              )}
              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded text-xs transition-colors flex items-center gap-1"
              title="Copy receipt text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={closeThermalReceipt}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100"
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
              className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'both' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-amber-600" />
              <span>Both Receipts (Queue)</span>
            </button>
            <button
              onClick={() => setActiveTab('primary')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                activeTab === 'primary' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Customer Slip (2-Inch)
            </button>
            <button
              onClick={() => setActiveTab('secondary')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                activeTab === 'secondary' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Order POS Slip (2-Inch)
            </button>
          </div>
        )}

        {/* Realistic Thermal Paper Simulation Container */}
        <div className="my-4 bg-stone-100 p-3 sm:p-5 rounded-xl border border-stone-200 overflow-x-auto max-h-[500px]">
          <div id="printable-thermal-receipt" className="flex flex-col md:flex-row justify-center items-start gap-4 mx-auto w-fit">
            {/* Receipt 1: Customer Token Slip */}
            {(activeTab === 'both' || activeTab === 'primary') && (
              <div className="flex flex-col items-center thermal-slip-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1 no-print">
                  1. Customer Token Slip (2-Inch / 50.8mm · Token Only)
                </span>
                <div
                  className="bg-[#fdfcf7] text-stone-900 shadow-md border-x border-stone-300 font-mono text-[11px] leading-tight p-4 select-text w-[280px]"
                  style={{ fontFamily: '"JetBrains Mono", Courier, monospace' }}
                >
                  <div className="text-center text-stone-300 text-[8px] tracking-widest pb-2 select-none no-print">
                    ▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼
                  </div>
                  <pre className="whitespace-pre-wrap font-inherit text-stone-900 break-words">
                    {activeThermalReceipt.text}
                  </pre>
                  <div className="text-center text-stone-300 text-[8px] tracking-widest pt-2 select-none no-print">
                    ▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼
                  </div>
                </div>
              </div>
            )}

            {/* Print separator / cut line between slips in queue */}
            {hasSecondary && activeTab === 'both' && (
              <div className="thermal-cut-separator hidden print:block" />
            )}

            {/* Receipt 2: Order POS Slip */}
            {hasSecondary && (activeTab === 'both' || activeTab === 'secondary') && (
              <div className="flex flex-col items-center thermal-slip-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1 no-print">
                  2. Order POS Dispatch Slip (2-Inch / 50.8mm · Packing Slip)
                </span>
                <div
                  className="bg-[#fdfcf7] text-stone-900 shadow-md border-x border-stone-300 font-mono text-[11px] leading-tight p-4 select-text w-[280px]"
                  style={{ fontFamily: '"JetBrains Mono", Courier, monospace' }}
                >
                  <div className="text-center text-stone-300 text-[8px] tracking-widest pb-2 select-none no-print">
                    ▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼
                  </div>
                  <pre className="whitespace-pre-wrap font-inherit text-stone-900 break-words">
                    {activeThermalReceipt.secondaryText}
                  </pre>
                  <div className="text-center text-stone-300 text-[8px] tracking-widest pt-2 select-none no-print">
                    ▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-stone-100">
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
              <span>Print to 2-Inch Thermal Printer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
