import React, { useState } from 'react';
import { useApp, TerminalView } from '../context/AppContext.tsx';
import { Volume2, VolumeX, ShieldCheck, Sparkles, LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import { ProductOverviewModal } from './ProductOverviewModal.tsx';

export const Header: React.FC = () => {
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const {
    activeView,
    setActiveView,
    orders,
    currentUser,
    logout,
    settings,
    isRealtimeConnected,
    isAudioEnabled,
    setIsAudioEnabled,
    openTestModal,
    resetDemoData,
  } = useApp();

  const billingUnpaidCount = orders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED').length;

  const role = currentUser?.role;

  // RBAC Navigation Filtering:
  // 1. role - order POS: only see order POS data
  // 2. cashier/biller: bill and can take order pos also (show both option)
  // 3. admin: see overall data, orders, dashboard, etc.
  const navItems: Array<{ id: TerminalView; label: string; count?: number }> = [];

  if (role === 'order_pos' || role === 'pos_staff') {
    navItems.push({ id: 'pos', label: 'Order POS' });
  } else if (role === 'cashier') {
    navItems.push({ id: 'pos', label: 'Order POS' });
    navItems.push({ id: 'billing', label: 'Billing POS', count: billingUnpaidCount });
  } else {
    // Admin or default
    navItems.push({ id: 'pos', label: 'Order POS' });
    navItems.push({ id: 'billing', label: 'Billing POS', count: billingUnpaidCount });
    navItems.push({ id: 'dashboard', label: 'Admin Hub' });
    navItems.push({ id: 'printers', label: 'Print Agent' });
  }

  const roleBadge = () => {
    if (role === 'order_pos' || role === 'pos_staff') {
      return <span className="bg-blue-900/60 text-blue-300 border border-blue-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">Order POS</span>;
    }
    if (role === 'cashier') {
      return <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">Cashier &amp; Biller</span>;
    }
    return <span className="bg-amber-900/60 text-amber-300 border border-amber-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">Admin</span>;
  };

  return (
    <header className="sticky top-0 z-30 bg-stone-900 border-b border-stone-800 text-stone-100 px-4 md:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveView('pos')}
            className="text-lg md:text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-2 text-left"
          >
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block" />
            <span>{settings?.shopName || 'Sheetal Gajak Kulfi'}</span>
            <span className="text-xs font-normal text-amber-400/90 tracking-normal hidden md:inline">Indore</span>
          </button>
        </div>

        {/* Zone 2: RBAC Navigation Links */}
        <nav className="flex items-center gap-1.5 md:gap-2 overflow-x-auto py-1 scrollbar-none">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`px-3.5 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <span>{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                      isActive ? 'bg-amber-800 text-amber-100' : 'bg-stone-700 text-amber-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: User Info, Logout & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Real-time Indicator */}
          <div
            title={isRealtimeConnected ? 'Real-time connected via SSE' : 'Connecting to real-time events...'}
            className="items-center gap-1.5 text-[11px] text-stone-400 font-mono hidden xl:flex"
          >
            <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span>{isRealtimeConnected ? 'SYNCED' : 'SYNCING'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
            title={isAudioEnabled ? 'Audio chime enabled' : 'Chime muted'}
            aria-label="Toggle audio alerts"
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          {/* User Account / Role Display */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-stone-800/80 border border-stone-700/80 rounded-lg px-2.5 py-1 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-stone-400" />
              <div className="flex flex-col text-left">
                <span className="font-medium text-stone-200 text-[11px] leading-tight max-w-[130px] truncate">
                  {currentUser.email || currentUser.name}
                </span>
              </div>
              {roleBadge()}
            </div>
          )}

          {/* Logout Button */}
          {currentUser && (
            <button
              onClick={logout}
              className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Logout from terminal session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}

          {/* Product & Architecture Overview Button */}
          <button
            onClick={() => setShowOverviewModal(true)}
            className="px-2.5 py-1.5 bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
            title="Open Complete Product Overview & Architecture Spec"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Product Overview</span>
          </button>

          {/* Reload Demo Data Button (Admin or Cashier) */}
          {role === 'admin' && (
            <button
              onClick={async () => {
                await resetDemoData();
              }}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-xs font-medium rounded-lg transition-colors hidden lg:flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
              title="Reset & populate full realistic demo data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Data</span>
            </button>
          )}

          {/* Acceptance Test Runner Button */}
          {role === 'admin' && (
            <button
              onClick={openTestModal}
              className="px-2.5 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors hidden sm:flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
              title="Run System Acceptance Verification"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Overview Modal */}
      <ProductOverviewModal
        isOpen={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
      />
    </header>
  );
};
