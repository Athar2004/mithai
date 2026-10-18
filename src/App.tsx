import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { OrderPOS } from './components/pos/OrderPOS.tsx';
import { KitchenKDS } from './components/kitchen/KitchenKDS.tsx';
import { BillingTerminal } from './components/billing/BillingTerminal.tsx';
import { AdminDashboard } from './components/dashboard/AdminDashboard.tsx';
import { PrintAgentTerminal } from './components/printing/PrintAgentTerminal.tsx';
import { CatalogAndSettings } from './components/settings/CatalogAndSettings.tsx';
import { ThermalReceiptModal } from './components/printing/ThermalReceiptModal.tsx';
import { SystemVerificationModal } from './components/testing/SystemVerificationModal.tsx';

const AppContent: React.FC = () => {
  const { activeView, setActiveView, settings } = useApp();

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Top 3-Zone Navigation Header */}
      <Header />

      {/* Main Screen Content */}
      <main className="flex-1 pb-12">
        {activeView === 'pos' && <OrderPOS />}
        {activeView === 'kitchen' && <KitchenKDS />}
        {activeView === 'billing' && <BillingTerminal />}
        {activeView === 'dashboard' && <AdminDashboard />}
        {activeView === 'printers' && <PrintAgentTerminal />}
        {activeView === 'settings' && <CatalogAndSettings />}
      </main>

      {/* Subtle Footer */}
      <footer className="bg-white border-t border-stone-200 py-4 px-4 md:px-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">{settings?.shopName || 'MithaiFlow'}</span>
            <span aria-hidden="true">·</span>
            <span>GSTIN: {settings?.gstin}</span>
            <span aria-hidden="true">·</span>
            <span>FSSAI: {settings?.fssaiNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('settings')}
              className="text-stone-600 hover:text-stone-900 transition-colors"
            >
              Catalog &amp; Settings
            </button>
            <span aria-hidden="true">·</span>
            <span>MithaiFlow POS v2.4</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ThermalReceiptModal />
      <SystemVerificationModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
