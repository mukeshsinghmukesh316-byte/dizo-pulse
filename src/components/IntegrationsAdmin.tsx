import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  IntegrationItem,
  IntegrationCategory,
  IntegrationEnvironment,
  IntegrationFieldDef,
} from '../types';

interface IntegrationsAdminProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

const CATEGORY_META: Record<IntegrationCategory, { label: string; icon: string; color: string; bg: string }> = {
  email: { label: 'Email Services', icon: 'Mail', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  whatsapp: { label: 'WhatsApp & SMS', icon: 'MessageCircle', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  cloud_storage: { label: 'Cloud Storage', icon: 'HardDrive', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  analytics: { label: 'Analytics & Tracking', icon: 'BarChart3', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  payment_gateway: { label: 'Payment Gateways', icon: 'CreditCard', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
};

export default function IntegrationsAdmin({
  userRole = 'admin',
  userName = 'Admin User',
  userEmail = 'admin@dizopulse.com',
}: IntegrationsAdminProps) {
  const isSuperAdmin = userRole === 'super_admin';

  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [stats, setStats] = useState({ total: 0, enabled: 0, connected: 0, needsAttention: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Integration for Editing
  const [editingItem, setEditingItem] = useState<IntegrationItem | null>(null);
  const [formConfig, setFormConfig] = useState<Record<string, string>>({});
  const [formEnv, setFormEnv] = useState<IntegrationEnvironment>('production');
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [newSecretInputs, setNewSecretInputs] = useState<Record<string, string>>({});

  // Action states
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [confirmDisconnectItem, setConfirmDisconnectItem] = useState<IntegrationItem | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch Integrations list
  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/integrations');
      if (!res.ok) {
        throw new Error('Failed to load integrations catalog');
      }
      const data = await res.json();
      setIntegrations(data.integrations || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Filtered Integrations
  const filteredIntegrations = useMemo(() => {
    return integrations.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && item.isEnabled) ||
        (statusFilter === 'disabled' && !item.isEnabled) ||
        (statusFilter === 'connected' && item.status === 'connected') ||
        (statusFilter === 'error' && item.status === 'error');
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesStatus && matchesSearch;
    });
  }, [integrations, selectedCategory, statusFilter, searchQuery]);

  // Open Edit Modal
  const handleOpenEdit = (item: IntegrationItem) => {
    setEditingItem(item);
    setFormConfig({ ...(item.config || {}) });
    setFormEnv(item.environment || 'production');
    setRevealedSecrets({});
    setNewSecretInputs({});
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditingItem(null);
    setFormConfig({});
    setRevealedSecrets({});
    setNewSecretInputs({});
  };

  // Save / Update Integration Credentials
  const handleSaveIntegration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingItem) return;

    if (!isSuperAdmin) {
      showToast('Access Denied', 'Only Super Admins can update API credentials.', 'error');
      return;
    }

    try {
      setSaving(true);
      // Merge config with any new secrets input
      const finalConfig = { ...formConfig };
      for (const [key, val] of Object.entries(newSecretInputs)) {
        if (typeof val === 'string' && val.trim()) {
          finalConfig[key] = val.trim();
        }
      }

      const res = await fetch(`/api/integrations/${editingItem.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: finalConfig,
          environment: formEnv,
          userRole,
          userName,
          userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save credentials');
      }

      showToast(
        'Credentials Saved',
        `${editingItem.name} configuration updated securely. Masked credentials are stored safely in backend.`,
        'success'
      );

      handleCloseEdit();
      await fetchIntegrations();
    } catch (err: any) {
      showToast('Save Failed', err?.message || 'Error updating credentials', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Enable / Disable
  const handleToggle = async (item: IntegrationItem) => {
    if (!isSuperAdmin) {
      showToast('Permission Restricted', 'Only Super Admins can enable or disable integrations.', 'error');
      return;
    }

    try {
      setTogglingId(item.id);
      const res = await fetch(`/api/integrations/${item.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: !item.isEnabled,
          userRole,
          userName,
          userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle status');
      }

      showToast(
        item.isEnabled ? 'Integration Disabled' : 'Integration Enabled',
        `${item.name} has been ${item.isEnabled ? 'deactivated' : 'activated'}.`,
        'info'
      );

      // Optimistic update
      setIntegrations((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isEnabled: !item.isEnabled } : i))
      );
      await fetchIntegrations();
    } catch (err: any) {
      showToast('Toggle Error', err?.message || 'Failed to update integration state', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Test Connection
  const handleTestConnection = async (item: IntegrationItem) => {
    try {
      setTestingId(item.id);
      const res = await fetch(`/api/integrations/${item.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole,
          userName,
          userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Connection test failed');
      }

      if (data.status === 'connected') {
        showToast('Connection Successful', data.message || `Connected to ${item.name} simulated endpoint.`, 'success');
      } else {
        showToast('Connection Warning', data.message || `Test reported status: ${data.status}`, 'error');
      }

      await fetchIntegrations();
    } catch (err: any) {
      showToast('Connection Test Failed', err?.message || 'Connection test encountered an error', 'error');
    } finally {
      setTestingId(null);
    }
  };

  // Disconnect / Clear Credentials
  const handleDisconnect = async (item: IntegrationItem) => {
    if (!isSuperAdmin) {
      showToast('Permission Restricted', 'Only Super Admins can purge integration credentials.', 'error');
      return;
    }

    try {
      setDisconnectingId(item.id);
      const res = await fetch(`/api/integrations/${item.id}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole,
          userName,
          userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to disconnect');
      }

      showToast('Integration Disconnected', `${item.name} credentials purged securely and integration disabled.`, 'info');
      setConfirmDisconnectItem(null);
      if (editingItem?.id === item.id) {
        handleCloseEdit();
      }
      await fetchIntegrations();
    } catch (err: any) {
      showToast('Disconnect Failed', err?.message || 'Could not disconnect integration', 'error');
    } finally {
      setDisconnectingId(null);
    }
  };

  // Dynamic icon helper
  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    const IconComp = (Icons as any)[iconName] || Icons.PlugZap;
    return <IconComp className={className} />;
  };

  // Format date helper
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Never checked';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 max-w-md w-full"
          >
            <div
              className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/50'
                  : toast.type === 'error'
                  ? 'bg-rose-950/90 text-rose-100 border-rose-700/50'
                  : 'bg-slate-900/90 text-slate-100 border-slate-700/50'
              }`}
            >
              {toast.type === 'success' && <Icons.CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <Icons.AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Icons.Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <h5 className="font-extrabold text-xs">{toast.title}</h5>
                <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 translate-y-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Icons.ShieldCheck className="w-3.5 h-3.5" />
                Enterprise Security Core
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                <Icons.Lock className="w-3 h-3 text-amber-400" />
                Secrets Masked at Backend
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Integrations & API Settings
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Connect and manage production API credentials for Email, WhatsApp, Cloud Storage, Analytics, and Payment Gateways. All credentials are encrypted and secrets are masked before reaching the browser.
            </p>
          </div>

          {/* Quick Super Admin Status Badge */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isSuperAdmin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {isSuperAdmin ? <Icons.ShieldCheck className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Active Access Tier
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {isSuperAdmin ? 'Super Admin (Full Write)' : 'Read-Only Operator'}
                </span>
              </div>
            </div>

            <button
              onClick={fetchIntegrations}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              <Icons.RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Catalog
            </button>
          </div>
        </div>

        {/* Read-Only Notice for Non-Super Admin */}
        {!isSuperAdmin && (
          <div className="mt-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-200 text-xs">
            <Icons.AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Read-Only View:</strong> You are signed in as an Admin. Updating, testing, and disconnecting API credentials requires <strong>Super Admin</strong> credentials for compliance and security audit logs.
            </span>
          </div>
        )}
      </div>

      {/* Metrics & Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Services</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total || integrations.length}</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">Catalog connectors</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Icons.Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Active / Enabled</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.enabled}</span>
            <span className="text-[10px] font-bold text-emerald-700 mt-0.5 block">Operational switches</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Icons.CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Verified Connected</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">{stats.connected}</span>
            <span className="text-[10px] font-bold text-blue-700 mt-0.5 block">Live simulated ping</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Icons.Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Issues & Alerts</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">{stats.needsAttention}</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">Requires attention</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <Icons.AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Icons.LayoutGrid className="w-3.5 h-3.5" />
            All Integrations ({integrations.length})
          </button>
          {(Object.keys(CATEGORY_META) as IntegrationCategory[]).map((catKey) => {
            const meta = CATEGORY_META[catKey];
            const count = integrations.filter((i) => i.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === catKey
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {renderIcon(meta.icon, 'w-3.5 h-3.5')}
                {meta.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search services, providers, keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="enabled">Enabled Only</option>
              <option value="disabled">Disabled Only</option>
              <option value="connected">Connected</option>
              <option value="error">Has Errors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Integration Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
          <Icons.Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500">Decrypting & loading integrations catalog...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
          <Icons.AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h4 className="font-extrabold text-rose-900 text-sm">{error}</h4>
          <button
            onClick={fetchIntegrations}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredIntegrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Icons.Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-extrabold text-slate-800">No Integrations Match Selected Filters</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or switching category filters above.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIntegrations.map((item) => {
            const categoryMeta = CATEGORY_META[item.category] || CATEGORY_META.email;
            const isConnected = item.status === 'connected';
            const isError = item.status === 'error';
            const isPending = item.status === 'not_configured';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  item.isEnabled
                    ? isConnected
                      ? 'border-emerald-200/80 hover:border-emerald-300'
                      : isError
                      ? 'border-rose-200/80 hover:border-rose-300'
                      : 'border-slate-200 hover:border-indigo-300'
                    : 'border-slate-200/60 opacity-85 hover:opacity-100'
                }`}
              >
                {/* Card Top / Header */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border flex-shrink-0 ${categoryMeta.bg} ${categoryMeta.color}`}>
                        {renderIcon(item.iconName, 'w-6 h-6')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{item.name}</h4>
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">
                          {item.provider}
                        </span>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => handleToggle(item)}
                        disabled={togglingId === item.id || !isSuperAdmin}
                        title={
                          !isSuperAdmin
                            ? 'Super Admin required to toggle'
                            : item.isEnabled
                            ? 'Click to disable'
                            : 'Click to enable'
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                          item.isEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            item.isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-[9px] font-extrabold uppercase text-slate-400">
                        {item.isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {/* Status & Environment Pill Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isError
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isPending
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConnected
                            ? 'bg-emerald-500'
                            : isError
                            ? 'bg-rose-500'
                            : isPending
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {item.status === 'connected'
                        ? 'Connected'
                        : item.status === 'error'
                        ? 'Error'
                        : item.status === 'not_configured'
                        ? 'Not Configured'
                        : 'Disconnected'}
                    </span>

                    {/* Environment Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${
                        item.environment === 'production'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <Icons.Terminal className="w-2.5 h-2.5" />
                      {item.environment === 'production' ? 'Production' : 'Sandbox / Test'}
                    </span>

                    {/* Category Label */}
                    <span className="text-[9px] text-slate-400 font-bold uppercase ml-auto">
                      {categoryMeta.label}
                    </span>
                  </div>

                  {/* Configured Fields Summary (Masked) */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400 text-[9px] font-bold uppercase tracking-wider pb-1 border-b border-slate-200/60">
                      <span>Parameters</span>
                      <span>Config State</span>
                    </div>

                    {item.fields.slice(0, 3).map((field) => {
                      const val = item.config?.[field.key];
                      const hasVal = val !== undefined && val !== null && String(val).trim() !== '';

                      return (
                        <div key={field.key} className="flex items-center justify-between gap-2">
                          <span className="text-slate-600 font-medium truncate max-w-[120px]" title={field.label}>
                            {field.label}:
                          </span>
                          <span className="font-mono text-[10px] text-slate-700 font-bold truncate max-w-[140px]">
                            {hasVal ? (
                              field.isSecret ? (
                                <span className="text-slate-400">{val}</span>
                              ) : (
                                String(val)
                              )
                            ) : (
                              <span className="text-slate-400 italic">Not set</span>
                            )}
                          </span>
                        </div>
                      );
                    })}

                    {item.fields.length > 3 && (
                      <span className="text-[9px] text-slate-400 italic block text-right pt-0.5">
                        +{item.fields.length - 3} more parameters
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom / Footer Actions */}
                <div className="bg-slate-50/70 p-4 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Icons.Clock className="w-3 h-3" />
                      {formatDate(item.lastChecked)}
                    </span>
                    {item.lastTestedLatencyMs !== undefined && (
                      <span className="text-emerald-600 font-mono font-bold">{item.lastTestedLatencyMs}ms</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Icons.Sliders className="w-3.5 h-3.5 text-slate-500" />
                      Configure
                    </button>

                    <button
                      onClick={() => handleTestConnection(item)}
                      disabled={testingId === item.id}
                      className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Run live simulated handshake test"
                    >
                      <Icons.Zap className={`w-3.5 h-3.5 ${testingId === item.id ? 'animate-bounce' : ''}`} />
                      {testingId === item.id ? 'Testing...' : 'Test'}
                    </button>

                    {isConnected && (
                      <button
                        onClick={() => setConfirmDisconnectItem(item)}
                        disabled={!isSuperAdmin}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all cursor-pointer disabled:opacity-30"
                        title={isSuperAdmin ? 'Disconnect and clear credentials' : 'Super admin required'}
                      >
                        <Icons.Unplug className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT CONFIGURATION MODAL */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30">
                    {renderIcon(editingItem.iconName, 'w-6 h-6')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white">{editingItem.name}</h3>
                      <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-slate-700">
                        {editingItem.provider}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{editingItem.description}</p>
                  </div>
                </div>

                <button
                  onClick={handleCloseEdit}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveIntegration} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Security Advisory */}
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                  <Icons.ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-900 leading-relaxed">
                    <strong className="block font-extrabold text-indigo-950 mb-0.5">Secrets Masking Policy:</strong>
                    Stored API keys and tokens are masked. Existing secrets show masked dots (`••••••••xxxx`). To keep the existing key unchanged, leave the input as-is or blank. Enter a new secret only when updating.
                  </div>
                </div>

                {/* Environment Selector */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Operating Environment
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        formEnv === 'production'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="environment"
                        value="production"
                        checked={formEnv === 'production'}
                        onChange={() => setFormEnv('production')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-extrabold block">Production Live</span>
                        <span className="text-[10px] text-slate-500 block">Uses live customer channels</span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        formEnv === 'test'
                          ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="environment"
                        value="test"
                        checked={formEnv === 'test'}
                        onChange={() => setFormEnv('test')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-extrabold block">Sandbox / Test</span>
                        <span className="text-[10px] text-slate-500 block">Dry-run testing without billing</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Dynamic Configuration Fields */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Icons.Key className="w-4 h-4 text-indigo-600" />
                    API Credentials & Parameters
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {editingItem.fields.map((field: IntegrationFieldDef) => {
                      const currentValue = formConfig[field.key];
                      const isSecret = field.isSecret;
                      const hasExistingMaskedValue = isSecret && currentValue && String(currentValue).includes('•••');

                      return (
                        <div
                          key={field.key}
                          className="space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                              {field.label}
                              {field.required && <span className="text-rose-500">*</span>}
                            </label>
                            {isSecret && (
                              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                                Secret (Masked)
                              </span>
                            )}
                          </div>

                          {field.type === 'select' ? (
                            <select
                              value={formConfig[field.key] || ''}
                              onChange={(e) => setFormConfig({ ...formConfig, [field.key]: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : isSecret ? (
                            <div className="space-y-1">
                              <div className="relative">
                                <input
                                  type={revealedSecrets[field.key] ? 'text' : 'password'}
                                  placeholder={
                                    hasExistingMaskedValue
                                      ? 'Masked (Enter new value to replace)'
                                      : field.placeholder || 'Enter secret'
                                  }
                                  value={newSecretInputs[field.key] !== undefined ? newSecretInputs[field.key] : ''}
                                  onChange={(e) =>
                                    setNewSecretInputs({
                                      ...newSecretInputs,
                                      [field.key]: e.target.value,
                                    })
                                  }
                                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedSecrets({
                                      ...revealedSecrets,
                                      [field.key]: !revealedSecrets[field.key],
                                    })
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                  {revealedSecrets[field.key] ? (
                                    <Icons.EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Icons.Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              {hasExistingMaskedValue && !newSecretInputs[field.key] && (
                                <span className="text-[10px] text-slate-400 font-mono block pl-1">
                                  Current: {currentValue}
                                </span>
                              )}
                            </div>
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : 'text'}
                              placeholder={field.placeholder || ''}
                              value={formConfig[field.key] || ''}
                              onChange={(e) => setFormConfig({ ...formConfig, [field.key]: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                            />
                          )}

                          {field.helperText && (
                            <p className="text-[10px] text-slate-400">{field.helperText}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleTestConnection(editingItem)}
                    disabled={testingId === editingItem.id}
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Icons.Zap className={`w-3.5 h-3.5 ${testingId === editingItem.id ? 'animate-bounce' : ''}`} />
                    {testingId === editingItem.id ? 'Testing Connection...' : 'Test Connection'}
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleCloseEdit}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !isSuperAdmin}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Icons.Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving...' : 'Save & Encrypt'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DISCONNECT MODAL */}
      <AnimatePresence>
        {confirmDisconnectItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <Icons.AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-extrabold text-slate-950 text-base">
                  Disconnect {confirmDisconnectItem.name}?
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  This will securely purge all stored API keys, tokens, and credentials for this service. The integration will immediately be switched to disconnected mode.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Service:</span>
                  <span className="font-bold">{confirmDisconnectItem.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Provider:</span>
                  <span className="font-bold">{confirmDisconnectItem.provider}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDisconnectItem(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDisconnect(confirmDisconnectItem)}
                  disabled={disconnectingId === confirmDisconnectItem.id}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Icons.Unplug className="w-3.5 h-3.5" />
                  {disconnectingId === confirmDisconnectItem.id ? 'Purging...' : 'Confirm Disconnect'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
