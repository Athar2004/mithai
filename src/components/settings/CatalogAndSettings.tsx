import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { Product, UnitType } from '../../types/index.ts';
import * as api from '../../lib/api.ts';
import {
  Package,
  Settings,
  Shield,
  Plus,
  Edit2,
  Check,
  X,
  Save,
  Search,
} from 'lucide-react';

export const CatalogAndSettings: React.FC = () => {
  const {
    products,
    categories,
    settings,
    currentUser,
    refreshData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'shop' | 'audit'>('catalog');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isEditingProduct, setIsEditingProduct] = useState<boolean>(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    hindiName: '',
    sku: '',
    categoryId: 'dry-fruits',
    unit: 'kg',
    pricePerUnit: 500,
    taxRatePercent: 5,
    isActive: true,
    requiresKitchen: false,
    description: '',
  });

  // Shop settings form
  const [shopForm, setShopForm] = useState(settings || {
    shopName: '',
    tagline: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    gstin: '',
    fssaiNumber: '',
    tokenPrefix: 'T-',
    businessDayCutoffHour: 4,
    kitchenDelayThresholdMinutes: 10,
    currencySymbol: '₹',
    taxConfig: { cgstRate: 2.5, sgstRate: 2.5 },
    footerMessage: '',
  });

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const handleEditProduct = (prod: Product) => {
    setProductForm({ ...prod });
    setIsEditingProduct(true);
  };

  const handleNewProduct = () => {
    setProductForm({
      name: '',
      hindiName: '',
      sku: `SWT-${Date.now().toString().slice(-4)}`,
      categoryId: categories[0]?.id || 'dry-fruits',
      unit: 'kg',
      pricePerUnit: 400,
      taxRatePercent: 5,
      isActive: true,
      requiresKitchen: false,
      description: '',
    });
    setIsEditingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.pricePerUnit) return;

    try {
      await api.saveProduct({
        ...productForm,
        name: productForm.name,
        pricePerUnit: Number(productForm.pricePerUnit),
        unit: productForm.unit as UnitType,
      }, currentUser?.role);
      setIsEditingProduct(false);
      await refreshData();
      setSaveSuccessMessage('Product saved successfully');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save product failed';
      alert(msg);
      console.error('Save product failed:', err);
    }
  };

  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(shopForm, currentUser?.name || 'Admin', currentUser?.role);
      await refreshData();
      setSaveSuccessMessage('Shop settings saved successfully');
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save settings failed';
      alert(msg);
      console.error('Save settings failed:', err);
    }
  };

  const handleLoadAuditLogs = async () => {
    try {
      const logs = await api.fetchAuditLogs(100);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  // RBAC Guard: Only admin can add/edit catalog or settings
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-2">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900">Administrator Access Required</h2>
        <p className="text-sm text-stone-600 max-w-md mx-auto">
          Only administrators have access to add or edit the product catalog, adjust sweet pricing, or modify shop and GST tax configurations.
        </p>
        <p className="text-xs text-stone-500">
          Currently logged in as: <span className="font-semibold text-stone-800">{currentUser?.name || 'Staff'} ({currentUser?.role})</span>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
            Product Catalog &amp; Shop Settings
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Maintain sweet formulas, prices, GST tax breakdown, and view immutable audit trails
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-white border border-stone-200 rounded-lg shadow-2xs text-xs font-medium">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'catalog' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Product Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'shop' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Shop &amp; GST Settings
          </button>
          <button
            onClick={() => {
              setActiveTab('audit');
              handleLoadAuditLogs();
            }}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'audit' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* TAB 1: PRODUCT CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-stone-500">
              Prices updated here apply only to future orders; historical invoices remain permanently intact.
            </span>
            <button
              onClick={handleNewProduct}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Price / Unit</th>
                  <th className="p-3">GST Tax</th>
                  <th className="p-3">Kitchen Prep</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800 font-mono">
                {products.map(prod => {
                  const cat = categories.find(c => c.id === prod.categoryId);
                  return (
                    <tr key={prod.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded object-cover border border-stone-200 shrink-0 bg-stone-100"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-400">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-stone-900">{prod.name}</div>
                            {prod.hindiName && (
                              <div className="text-[11px] text-stone-400 font-normal">{prod.hindiName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-sans text-stone-600">{cat?.name || prod.categoryId}</td>
                      <td className="p-3">{prod.unit}</td>
                      <td className="p-3 font-bold text-stone-900">₹{prod.pricePerUnit}</td>
                      <td className="p-3">{prod.taxRatePercent}%</td>
                      <td className="p-3 font-sans">
                        {prod.requiresKitchen ? (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                            KOT Required
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">Direct Counter</span>
                        )}
                      </td>
                      <td className="p-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          prod.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                        }`}>
                          {prod.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        <button
                          onClick={() => handleEditProduct(prod)}
                          className="px-2.5 py-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-stone-400" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT / CREATE PRODUCT MODAL */}
      {isEditingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                {productForm.id ? 'Edit Product' : 'Add New Sweet / Snack'}
              </h3>
              <button
                onClick={() => setIsEditingProduct(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Product Name (English):</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Hindi / Regional Name:</label>
                  <input
                    type="text"
                    value={productForm.hindiName || ''}
                    onChange={(e) => setProductForm({ ...productForm, hindiName: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Category:</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Unit of Measure:</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value as UnitType })}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5"
                  >
                    <option value="kg">kg (weight)</option>
                    <option value="piece">piece (count)</option>
                    <option value="portion">portion</option>
                    <option value="box">box</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Price / Unit (₹):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={productForm.pricePerUnit}
                    onChange={(e) => setProductForm({ ...productForm, pricePerUnit: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.requiresKitchen}
                    onChange={(e) => setProductForm({ ...productForm, requiresKitchen: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Requires Kitchen Prep (KOT Ticket)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Active in POS Catalog</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="font-semibold text-stone-700 block mb-1">Image URL (e.g. /images/kaju-katli.jpg):</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={productForm.imageUrl || ''}
                    placeholder="/images/kaju-katli.jpg"
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="flex-1 bg-stone-50 border border-stone-300 rounded px-3 py-1.5 text-xs font-mono"
                  />
                  {productForm.imageUrl && (
                    <img
                      src={productForm.imageUrl}
                      alt="Preview"
                      className="w-8 h-8 rounded object-cover border border-stone-200"
                    />
                  )}
                </div>
              </div>

              <div className="pt-2">
                <label className="font-semibold text-stone-700 block mb-1">Description / Ingredients:</label>
                <textarea
                  rows={2}
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-1.5 text-xs"
                />
              </div>

              <div className="mt-5 flex gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProduct(false)}
                  className="flex-1 py-2 border border-stone-300 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SHOP SETTINGS */}
      {activeTab === 'shop' && (
        <form onSubmit={handleSaveShopSettings} className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-4 max-w-3xl text-xs">
          <h2 className="text-sm font-bold text-stone-900 border-b pb-2">Business &amp; Tax Profile</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Shop Name:</label>
              <input
                type="text"
                value={shopForm.shopName}
                onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 text-stone-900"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Tagline:</label>
              <input
                type="text"
                value={shopForm.tagline}
                onChange={(e) => setShopForm({ ...shopForm, tagline: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">GSTIN Number:</label>
              <input
                type="text"
                value={shopForm.gstin}
                onChange={(e) => setShopForm({ ...shopForm, gstin: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 font-mono text-stone-900"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">FSSAI License:</label>
              <input
                type="text"
                value={shopForm.fssaiNumber}
                onChange={(e) => setShopForm({ ...shopForm, fssaiNumber: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 font-mono text-stone-900"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Phone Number:</label>
              <input
                type="text"
                value={shopForm.phone}
                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Address:</label>
              <input
                type="text"
                value={shopForm.address}
                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 text-stone-900"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">City, State:</label>
              <input
                type="text"
                value={`${shopForm.city}, ${shopForm.state}`}
                onChange={(e) => {
                  const parts = e.target.value.split(',');
                  setShopForm({ ...shopForm, city: parts[0]?.trim() || '', state: parts[1]?.trim() || '' });
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 text-stone-900"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Pincode:</label>
              <input
                type="text"
                value={shopForm.pincode}
                onChange={(e) => setShopForm({ ...shopForm, pincode: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 font-mono text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Token Prefix:</label>
              <input
                type="text"
                value={shopForm.tokenPrefix}
                onChange={(e) => setShopForm({ ...shopForm, tokenPrefix: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 font-mono text-stone-900"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Kitchen Delay Alert (Mins):</label>
              <input
                type="number"
                min="1"
                value={shopForm.kitchenDelayThresholdMinutes}
                onChange={(e) => setShopForm({ ...shopForm, kitchenDelayThresholdMinutes: Number(e.target.value) })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 font-mono text-stone-900"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Business Day Cutoff (Hour):</label>
              <input
                type="number"
                min="0"
                max="23"
                value={shopForm.businessDayCutoffHour}
                onChange={(e) => setShopForm({ ...shopForm, businessDayCutoffHour: Number(e.target.value) })}
                className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 font-mono text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Receipt Footer Message:</label>
            <input
              type="text"
              value={shopForm.footerMessage}
              onChange={(e) => setShopForm({ ...shopForm, footerMessage: e.target.value })}
              className="w-full bg-stone-50 border border-stone-300 rounded px-3 py-2 text-stone-900"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Shop Configuration</span>
          </button>
        </form>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-stone-100 flex justify-between items-center">
            <span className="text-xs text-stone-500">
              Immutable audit log of all order lifecycle events, payments, cancellations, and settings modifications.
            </span>
            <button
              onClick={handleLoadAuditLogs}
              className="text-xs text-amber-700 font-medium hover:underline"
            >
              Refresh Logs
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-stone-800">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="p-3 text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-sans font-medium text-stone-900">{log.userName}</td>
                    <td className="p-3">
                      <span className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-stone-600">{log.entityType}</td>
                    <td className="p-3 font-sans text-stone-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
