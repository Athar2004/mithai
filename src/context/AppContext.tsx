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

export type TerminalView = 'pos' | 'kitchen' | 'billing' | 'dashboard' | 'printers' | 'settings';

export interface CartItem {
  product: Product;
  quantity: number; // e.g. 0.25 (for 250g) or 2 (for 2 pcs)
  specialInstructions?: string;
  lineTotal: number;
}

interface AppContextType {
  activeView: TerminalView;
  setActiveView: (view: TerminalView) => void;
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
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
  addToCart: (product: Product, quantity: number, instructions?: string) => void;
  updateCartItemQuantity: (index: number, quantity: number) => void;
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
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_pos1',
    name: 'Rajesh Sharma',
    role: 'pos_staff',
    pin: '2222',
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

      if (usrs.length > 0 && !currentUser.id) {
        setCurrentUser(usrs[1] || usrs[0]);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  }, [currentUser.id]);

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

  // Cart Management
  const addToCart = (product: Product, quantity: number, instructions?: string) => {
    if (quantity <= 0) return;
    setCart(prev => {
      // Find if item already exists with matching instructions
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && (item.specialInstructions || '') === (instructions || '')
      );

      const pricePerUnit = product.pricePerUnit;
      const taxRate = product.taxRatePercent || 5;

      if (existingIdx !== -1) {
        const copy = [...prev];
        const newQty = Math.round((copy[existingIdx].quantity + quantity) * 100) / 100;
        const sub = Math.round(newQty * pricePerUnit * 100) / 100;
        const tax = Math.round((sub * (taxRate / 100)) * 100) / 100;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: newQty,
          lineTotal: sub + tax,
        };
        return copy;
      }

      const sub = Math.round(quantity * pricePerUnit * 100) / 100;
      const tax = Math.round((sub * (taxRate / 100)) * 100) / 100;
      return [
        ...prev,
        {
          product,
          quantity,
          specialInstructions: instructions?.trim(),
          lineTotal: sub + tax,
        },
      ];
    });
  };

  const updateCartItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeCartItem(index);
      return;
    }
    setCart(prev => {
      const copy = [...prev];
      const item = copy[index];
      if (!item) return prev;
      const sub = Math.round(quantity * item.product.pricePerUnit * 100) / 100;
      const tax = Math.round((sub * ((item.product.taxRatePercent || 5) / 100)) * 100) / 100;
      copy[index] = {
        ...item,
        quantity,
        lineTotal: sub + tax,
      };
      return copy;
    });
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((sum, item) => sum + Math.round(item.quantity * item.product.pricePerUnit * 100) / 100, 0);
  const cartTax = cart.reduce((sum, item) => {
    const sub = Math.round(item.quantity * item.product.pricePerUnit * 100) / 100;
    return sum + Math.round((sub * ((item.product.taxRatePercent || 5) / 100)) * 100) / 100;
  }, 0);
  const cartTotal = Math.round((cartSubtotal + cartTax) * 100) / 100;

  const handleResetDemoData = async () => {
    await api.resetDemoData();
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        currentUser,
        users,
        setCurrentUser,
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
