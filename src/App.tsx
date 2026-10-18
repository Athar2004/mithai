import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { LoginScreen } from './components/auth/LoginScreen.tsx';
import { OrderPOS } from './components/pos/OrderPOS.tsx';
import { BillingTerminal } from './components/billing/BillingTerminal.tsx';
import { AdminDashboard } from './components/dashboard/AdminDashboard.tsx';
import { PrintAgentTerminal } from './components/printing/PrintAgentTerminal.tsx';
import { CatalogAndSettings } from './components/settings/CatalogAndSettings.tsx';
import { ThermalReceiptModal } from './components/printing/ThermalReceiptModal.tsx';
import { SystemVerificationModal } from './components/testing/SystemVerificationModal.tsx';

const AppContent: React.FC = () => {
  const { activeView, setActiveView, settings, currentUser } = useApp();

  // If not logged in, display full-screen Login with RBAC options
  if (!currentUser) {
    return <LoginScreen />;
  }

  const role = currentUser.role;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Top RBAC Navigation Header */}
      <Header />

      {/* Main Screen Content */}
      <main className="flex-1 pb-12">
        {activeView === 'pos' && <OrderPOS />}
        {activeView === 'billing' && (role === 'admin' || role === 'cashier') && <BillingTerminal />}
        {activeView === 'dashboard' && role === 'admin' && <AdminDashboard />}
        {activeView === 'printers' && role === 'admin' && <PrintAgentTerminal />}
        {activeView === 'settings' && role === 'admin' && <CatalogAndSettings />}
      </main>

      {/* Subtle Footer */}
      <footer className="bg-white border-t border-stone-200 py-4 px-4 md:px-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">{settings?.shopName || 'Sheetal Gajak Kulfi'}</span>
            <span aria-hidden="true">·</span>
            <span>GSTIN: {settings?.gstin}</span>
            <span aria-hidden="true">·</span>
            <span>FSSAI: {settings?.fssaiNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveView('settings')}
                  className="text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Catalog &amp; Settings
                </button>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>MithaiFlow POS v2.5</span>
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
