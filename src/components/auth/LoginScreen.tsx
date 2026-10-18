import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LogIn, KeyRound, Mail, Sparkles, ShoppingBag, Receipt, ShieldCheck, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, settings } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(quickEmail, quickPass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center items-center p-4 sm:p-6 text-stone-100">
      <div className="w-full max-w-md bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {settings?.shopName || 'Sheetal Gajak Kulfi'}
          </h1>
          <p className="text-xs text-amber-400/90 mt-0.5">
            Opposite High Court, Shivaji Nagar, Indore, Madhya Pradesh 452003
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Role-Based Access Control · POS &amp; Billing Terminal
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-950/70 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">
              Email Address / Login ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. pos@gmail.com"
                required
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Terminal</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Role Login Presets */}
        <div className="mt-8 pt-6 border-t border-stone-800">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3 text-center">
            Or Click a Role to Login Instantly
          </p>

          <div className="space-y-2.5">
            {/* 1. Order POS */}
            <button
              type="button"
              onClick={() => handleQuickLogin('pos@gmail.com', 'pos@123')}
              className="w-full text-left p-3 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <span>Order POS</span>
                    <span className="text-[10px] text-blue-400 font-mono">pos@123</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    pos@gmail.com · Only order taking &amp; receipt slip
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 font-mono group-hover:text-amber-400 transition-colors">
                Select →
              </span>
            </button>

            {/* 2. Cashier / Biller */}
            <button
              type="button"
              onClick={() => handleQuickLogin('cashier@gmail.com', 'cashier@123')}
              className="w-full text-left p-3 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <span>Cashier / Biller</span>
                    <span className="text-[10px] text-emerald-400 font-mono">cashier@123</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    cashier@gmail.com · Billing + Take Order POS
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 font-mono group-hover:text-amber-400 transition-colors">
                Select →
              </span>
            </button>

            {/* 3. Admin */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@gmail.com', 'admin@123')}
              className="w-full text-left p-3 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                    <span>Admin</span>
                    <span className="text-[10px] text-amber-400 font-mono">admin@123</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    admin@gmail.com · Full access to dashboard &amp; all data
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 font-mono group-hover:text-amber-400 transition-colors">
                Select →
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
