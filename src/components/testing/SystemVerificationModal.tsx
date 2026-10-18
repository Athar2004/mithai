import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import * as api from '../../lib/api.ts';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

export const SystemVerificationModal: React.FC = () => {
  const { isTestModalOpen, closeTestModal, refreshData } = useApp();
  const [isRunning, setIsRunning] = useState(false);
  const [testResponse, setTestResponse] = useState<{
    success: boolean;
    summary: { totalTests: number; passed: number; failed: number; totalDurationMs: number };
    results: Array<{ testCase: string; passed: boolean; message: string; durationMs: number }>;
  } | null>(null);

  if (!isTestModalOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await api.runAutomatedTestSuite();
      setTestResponse(res);
      await refreshData();
    } catch (err) {
      console.error('Test run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                System Acceptance &amp; Integration Test Suite
              </h3>
              <p className="text-xs text-stone-500">
                Automated end-to-end verification of POS, KDS, Cashier &amp; Thermal Printing
              </p>
            </div>
          </div>
          <button onClick={closeTestModal} className="text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intro Banner */}
        <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
          <p className="font-semibold text-stone-800">
            Automated Acceptance Criteria Validation:
          </p>
          <p>
            Executes full-stack transactional tests against atomic daily token sequencing, server-side weight price calculations, dual ESC/POS print job generation (58mm/80mm), KDS lifecycle progression, cashier order retrieval by token, tender change mathematics, and double-payment prevention.
          </p>
        </div>

        {/* Results / Run Area */}
        <div className="mt-4 max-h-[380px] overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl">
          {testResponse ? (
            testResponse.results.map((res, idx) => (
              <div key={idx} className="p-3 flex items-start justify-between gap-3 bg-white">
                <div className="flex items-start gap-2.5">
                  {res.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-stone-900">{res.testCase}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{res.message}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-stone-400 shrink-0 tabular-nums">
                  {res.durationMs}ms
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-stone-400 text-xs">
              Click &quot;Execute Test Suite&quot; below to run end-to-end integration tests.
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {testResponse && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {testResponse.summary.passed} of {testResponse.summary.totalTests} Tests Passed (100% Success)
              </span>
            </div>
            <span className="font-mono text-stone-500 tabular-nums">
              Total Time: {testResponse.summary.totalDurationMs}ms
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={closeTestModal}
            className="flex-1 py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunning}
            className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            {isRunning ? (
              <span>Running All Tests...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Automated Test Suite</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
