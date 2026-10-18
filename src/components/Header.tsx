import React from 'react';
import { useApp, TerminalView } from '../context/AppContext.tsx';
import { Volume2, VolumeX, ShieldCheck, PlayCircle, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    orders,
    currentUser,
    users,
    setCurrentUser,
    isRealtimeConnected,
    isAudioEnabled,
    setIsAudioEnabled,
    openTestModal,
    resetDemoData,
  } = useApp();

  const kitchenPendingCount = orders.filter(o => o.status === 'RECEIVED' || o.status === 'PREPARING').length;
  const billingUnpaidCount = orders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED').length;

  const navItems: Array<{ id: TerminalView; label: string; count?: number }> = [
    { id: 'pos', label: 'Order POS' },
    { id: 'kitchen', label: 'Kitchen KDS', count: kitchenPendingCount },
    { id: 'billing', label: 'Billing POS', count: billingUnpaidCount },
    { id: 'dashboard', label: 'Admin Hub' },
    { id: 'printers', label: 'Print Agent' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-stone-900 border-b border-stone-800 text-stone-100 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveView('pos')}
            className="text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap flex items-center gap-2 text-left"
          >
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block" />
            <span>MithaiFlow</span>
            <span className="text-xs font-normal text-amber-400/90 tracking-normal hidden sm:inline">Smart POS &amp; KDS</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 md:gap-2 overflow-x-auto py-1 scrollbar-none">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`px-3.5 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
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

        {/* Zone 3: Primary Action & Role Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Real-time Indicator */}
          <div
            title={isRealtimeConnected ? 'Real-time connected via SSE' : 'Connecting to real-time events...'}
            className="flex items-center gap-1.5 text-[11px] text-stone-400 font-mono hidden lg:flex"
          >
            <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span>{isRealtimeConnected ? 'SYNCED' : 'SYNCING'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
            title={isAudioEnabled ? 'Kitchen/POS audio chime enabled' : 'Chime muted'}
            aria-label="Toggle audio alerts"
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          {/* User / Terminal Role Selector */}
          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const selected = users.find(u => u.id === e.target.value);
                if (selected) setCurrentUser(selected);
              }}
              className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer max-w-[140px] truncate"
              title="Switch user terminal persona"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Reload Demo Data Button */}
          <button
            onClick={async () => {
              await resetDemoData();
            }}
            className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
            title="Reset & populate full realistic demo data"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Demo Data</span>
          </button>

          {/* Acceptance Test Runner Button */}
          <button
            onClick={openTestModal}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            title="Run 8-Step System Acceptance Verification"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Verify Tests</span>
          </button>
        </div>
      </div>
    </header>
  );
};
