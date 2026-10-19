import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Category,
  Product,
  Order,
  PrinterConfig,
  PrintJob,
  ShopSettings,
  User,
  DashboardMetrics,
  UnitType,
} from '../types/index.ts';
import * as api from '../lib/api.ts';

export type TerminalView = 'pos' | 'billing' | 'dashboard' | 'printers' | 'settings';

export interface CartItem {
  product: Product;
  packWeightKg?: number; // e.g. 0.25 (for 250g pack)
  packCount: number; // e.g. 2 (for 2 packs of 250g)
  quantity: number; // total quantity
  specialInstructions?: string;
  lineTotal: number; // GST inclusive total
}

interface AppContextType {
  activeView: TerminalView;
  setActiveView: (view: TerminalView) => void;
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  categories: Category[];
  products: Product[];
  orders: Order[];
  printers: PrinterConfig[];
  printJobs: PrintJob[];
  settings: ShopSettings | null;

  analytics: DashboardMetrics | null;
  isRealtimeConnected: boolean;
  refreshData: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (
    product: Product,
    optionsOrQty: { packWeightKg?: number; packCount?: number; quantity?: number; instructions?: string } | number,
    instructions?: string
  ) => void;
  updateCartItemQuantity: (index: number, newPackCount: number) => void;
  removeCartItem: (index: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;

  // Thermal Receipt Modal
  activeThermalReceipt: {
    title: string;
    text: string;
    paperWidth: '58mm' | '80mm';
    tokenNumber?: string;
    jobType?: string;
    secondaryText?: string;
    secondaryTitle?: string;
    secondaryPaperWidth?: '58mm' | '80mm';
    initialTab?: 'both' | 'primary' | 'secondary';
  } | null;
  openThermalReceipt: (receipt: {
    title: string;
    text: string;
    paperWidth: '58mm' | '80mm';
    tokenNumber?: string;
    jobType?: string;
    secondaryText?: string;
    secondaryTitle?: string;
    secondaryPaperWidth?: '58mm' | '80mm';
    initialTab?: 'both' | 'primary' | 'secondary';
  }) => void;
  closeThermalReceipt: () => void;

  // System test modal
  isTestModalOpen: boolean;
  openTestModal: () => void;
  closeTestModal: () => void;

  // Reset Demo Data
  resetDemoData: () => Promise<void>;

  // Audio alerts
  isAudioEnabled: boolean;
  setIsAudioEnabled: (enabled: boolean) => void;
  playChime: (type: 'order' | 'ready' | 'pay') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Web Audio synthesizer for tactile feedback without fragile external MP3 files
function playBeep(frequency = 600, duration = 0.15, type: OscillatorType = 'sine') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio permission errors
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<TerminalView>('pos');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('mithaiflow_auth_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [analytics, setAnalytics] = useState<DashboardMetrics | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals
  const [activeThermalReceipt, setActiveThermalReceipt] = useState<AppContextType['activeThermalReceipt']>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Role Based View Control
  const handleSetActiveView = useCallback((view: TerminalView) => {
    if (!currentUser) {
      setActiveView('pos');
      return;
    }
    const role = currentUser.role;
    if (role === 'order_pos' || role === 'pos_staff') {
      setActiveView('pos');
      return;
    }
    if (role === 'cashier') {
      if (view === 'pos' || view === 'billing') {
        setActiveView(view);
      } else {
        setActiveView('billing');
      }
      return;
    }
    // Admin has full access
    setActiveView(view);
  }, [currentUser]);

  // Keep view aligned with role
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;
    if (role === 'order_pos' || role === 'pos_staff') {
      if (activeView !== 'pos') {
        setActiveView('pos');
      }
    } else if (role === 'cashier') {
      if (activeView !== 'pos' && activeView !== 'billing') {
        setActiveView('billing');
      }
    }
  }, [currentUser, activeView]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const user = await api.loginUser(email, password);
    setCurrentUser(user);
    try {
      localStorage.setItem('mithaiflow_auth_session', JSON.stringify(user));
    } catch {}

    const role = user.role;
    if (role === 'order_pos' || role === 'pos_staff') {
      setActiveView('pos');
    } else if (role === 'cashier') {
      setActiveView('billing');
    } else if (role === 'admin') {
      setActiveView('dashboard');
    }
    return user;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('mithaiflow_auth_session');
    } catch {}
    setActiveView('pos');
    setCart([]);
  }, []);

  const playChime = useCallback((type: 'order' | 'ready' | 'pay') => {
    if (!isAudioEnabled) return;
    if (type === 'order') {
      playBeep(523, 0.1);
      setTimeout(() => playBeep(659, 0.15), 100);
    } else if (type === 'ready') {
      playBeep(440, 0.1);
      setTimeout(() => playBeep(554, 0.1), 100);
      setTimeout(() => playBeep(659, 0.2), 200);
    } else if (type === 'pay') {
      playBeep(784, 0.12);
      setTimeout(() => playBeep(1046, 0.22), 120);
    }
  }, [isAudioEnabled]);

  const refreshData = useCallback(async () => {
    try {
      const [cats, prods, ords, prns, pJobs, sett, anl, usrs] = await Promise.all([
        api.fetchCategories(),
        api.fetchProducts(),
        api.fetchOrders(),
        api.fetchPrinters(),
        api.fetchPrintJobs(50),
        api.fetchSettings(),
        api.fetchAnalytics(),
        api.fetchUsers(),
      ]);

      setCategories(cats);
      setProducts(prods);
      setOrders(ords);
      setPrinters(prns);
      setPrintJobs(pJobs);
      setSettings(sett);
      setAnalytics(anl);
      setUsers(usrs);

      if (currentUser?.email) {
        const matched = usrs.find(u => u.email?.toLowerCase() === currentUser.email?.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
        }
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  }, [currentUser?.email]);


  useEffect(() => {
    refreshData();

    // Subscribe to SSE real-time stream
    const unsubscribe = api.subscribeToEvents((event) => {
      setIsRealtimeConnected(true);

      if (event.type === 'ORDER_CREATED') {
        const newOrder = event.payload as Order;
        setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
        playChime('order');
        api.fetchAnalytics().then(setAnalytics).catch(() => {});
        api.fetchPrintJobs(50).then(setPrintJobs).catch(() => {});
      } else if (event.type === 'ORDER_STATUS_UPDATED') {
        const updated = event.payload as Order;
        setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
        if (updated.status === 'READY') {
          playChime('ready');
        }
        api.fetchAnalytics().then(setAnalytics).catch(() => {});
      } else if (event.type === 'PAYMENT_PROCESSED') {
        const { order } = event.payload as { order: Order };
        setOrders(prev => prev.map(o => (o.id === order.id ? order : o)));
        playChime('pay');
        api.fetchAnalytics().then(setAnalytics).catch(() => {});
        api.fetchPrintJobs(50).then(setPrintJobs).catch(() => {});
      } else if (event.type === 'ORDER_CANCELLED') {
        const cancelled = event.payload as Order;
        setOrders(prev => prev.map(o => (o.id === cancelled.id ? cancelled : o)));
        api.fetchAnalytics().then(setAnalytics).catch(() => {});
      } else if (event.type === 'PRINT_JOB_CREATED' || event.type === 'PRINT_JOB_UPDATED') {
        const job = event.payload as PrintJob;
        setPrintJobs(prev => [job, ...prev.filter(j => j.id !== job.id)]);
      } else if (event.type === 'PRODUCT_CREATED' || event.type === 'PRODUCT_UPDATED') {
        api.fetchProducts().then(setProducts).catch(() => {});
      } else if (event.type === 'SETTINGS_UPDATED') {
        api.fetchSettings().then(setSettings).catch(() => {});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshData, playChime]);

  // Cart Management - Multi-Pack Weight Model & GST Inclusive
  const addToCart = (
    product: Product,
    optionsOrQty: { packWeightKg?: number; packCount?: number; quantity?: number; instructions?: string } | number,
    instructions?: string
  ) => {
    let packWeightKg: number | undefined;
    let packCount = 1;
    let quantity = 1;
    let specialInstructions = instructions;

    if (typeof optionsOrQty === 'number') {
      quantity = optionsOrQty;
      packCount = quantity;
      if (product.unit === 'kg') {
        packWeightKg = quantity;
        packCount = 1;
      }
    } else {
      packWeightKg = optionsOrQty.packWeightKg;
      packCount = optionsOrQty.packCount && optionsOrQty.packCount > 0 ? optionsOrQty.packCount : 1;
      quantity = optionsOrQty.quantity || (packWeightKg ? Math.round(packWeightKg * packCount * 1000) / 1000 : packCount);
      specialInstructions = optionsOrQty.instructions || instructions;
    }

    if (quantity <= 0) return;

    setCart(prev => {
      // Find existing item with matching productId AND matching packWeightKg
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id &&
          ((item.packWeightKg === undefined && packWeightKg === undefined) ||
           (item.packWeightKg !== undefined && packWeightKg !== undefined && Math.abs(item.packWeightKg - packWeightKg) < 0.001)) &&
          (item.specialInstructions || '') === (specialInstructions || '')
      );

      const pricePerUnit = product.pricePerUnit;

      if (existingIdx !== -1) {
        // Customer needs same weight 2 pack -> do NOT increase weight, increase pack count!
        const copy = [...prev];
        const existing = copy[existingIdx];
        const newPackCount = (existing.packCount || 1) + packCount;
        const newTotalQty = packWeightKg
          ? Math.round(packWeightKg * newPackCount * 1000) / 1000
          : newPackCount;
        const lineTotal = packWeightKg
          ? Math.round(newPackCount * (packWeightKg * pricePerUnit) * 100) / 100
          : Math.round(newPackCount * pricePerUnit * 100) / 100;

        copy[existingIdx] = {
          ...existing,
          packCount: newPackCount,
          quantity: newTotalQty,
          lineTotal,
        };
        return copy;
      }

      // New line item
      const lineTotal = packWeightKg
        ? Math.round(packCount * (packWeightKg * pricePerUnit) * 100) / 100
        : Math.round(packCount * pricePerUnit * 100) / 100;

      return [
        ...prev,
        {
          product,
          packWeightKg,
          packCount,
          quantity,
          specialInstructions: specialInstructions?.trim(),
          lineTotal,
        },
      ];
    });
  };

  const updateCartItemQuantity = (index: number, newPackCount: number) => {
    if (newPackCount <= 0) {
      removeCartItem(index);
      return;
    }
    setCart(prev => {
      const copy = [...prev];
      const item = copy[index];
      if (!item) return prev;
      const packWeightKg = item.packWeightKg;
      const newTotalQty = packWeightKg
        ? Math.round(packWeightKg * newPackCount * 1000) / 1000
        : newPackCount;
      const lineTotal = packWeightKg
        ? Math.round(newPackCount * (packWeightKg * item.product.pricePerUnit) * 100) / 100
        : Math.round(newPackCount * item.product.pricePerUnit * 100) / 100;

      copy[index] = {
        ...item,
        packCount: newPackCount,
        quantity: newTotalQty,
        lineTotal,
      };
      return copy;
    });
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  // All prices are inclusive of GST. Tax is broken down ONLY on Cashier Bill
  const cartSubtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartTax = 0;
  const cartTotal = cartSubtotal;

  const handleResetDemoData = async () => {
    await api.resetDemoData();
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView: handleSetActiveView,
        currentUser,
        users,
        setCurrentUser,
        login,
        logout,

        categories,
        products,
        orders,
        printers,
        printJobs,
        settings,
        analytics,
        isRealtimeConnected,
        refreshData,
        resetDemoData: handleResetDemoData,
        cart,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart,
        cartSubtotal: Math.round(cartSubtotal * 100) / 100,
        cartTax: Math.round(cartTax * 100) / 100,
        cartTotal,
        activeThermalReceipt,
        openThermalReceipt: setActiveThermalReceipt,
        closeThermalReceipt: () => setActiveThermalReceipt(null),
        isTestModalOpen,
        openTestModal: () => setIsTestModalOpen(true),
        closeTestModal: () => setIsTestModalOpen(false),
        isAudioEnabled,
        setIsAudioEnabled,
        playChime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
