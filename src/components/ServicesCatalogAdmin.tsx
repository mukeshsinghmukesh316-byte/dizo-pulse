import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast, EmptyState } from './UIPolish';
import { Service, ServiceBundle, PricingHistoryEntry } from '../types';
import { AdminDataTable, ColumnDef } from './AdminDataTable';

interface ServicesCatalogAdminProps {
  services: Service[];
  bundles?: ServiceBundle[];
  userRole: 'super_admin' | 'admin' | 'manager' | 'staff';
  userName?: string;
  onRefreshServices: () => Promise<void>;
  onRefreshBundles?: () => Promise<void>;
}

export const CATEGORIES_CONFIG = [
  { id: 'social', label: 'Social Media & Reels', icon: 'Instagram', color: 'indigo' },
  { id: 'branding', label: 'Design & Branding', icon: 'Palette', color: 'purple' },
  { id: 'web', label: 'Web & SEO Solutions', icon: 'Code', color: 'emerald' },
  { id: 'marketing', label: 'Ads & Lead Gen', icon: 'Megaphone', color: 'rose' },
  { id: 'systems', label: 'Systems & Automations', icon: 'Cpu', color: 'cyan' },
];

export const ServicesCatalogAdmin: React.FC<ServicesCatalogAdminProps> = ({
  services = [],
  bundles = [],
  userRole,
  userName = 'Admin',
  onRefreshServices,
  onRefreshBundles
}) => {
  // Main Tab
  const [activeTab, setActiveTab] = useState<'services' | 'bundles' | 'ordering'>('services');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'order' | 'name' | 'price_asc' | 'price_desc'>('order');

  // Modals & Drawers
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  const [showBundleModal, setShowBundleModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Partial<ServiceBundle> | null>(null);

  const [previewItem, setPreviewItem] = useState<{ type: 'service' | 'bundle'; data: any } | null>(null);
  const [historyItem, setHistoryItem] = useState<{ name: string; history: PricingHistoryEntry[] } | null>(null);

  // Deliverable input state inside modal
  const [newDeliverableInput, setNewDeliverableInput] = useState('');
  const [changeReasonInput, setChangeReasonInput] = useState('');
  const [modalTab, setModalTab] = useState<'basic' | 'pricing' | 'deliverables' | 'media' | 'workflow'>('basic');

  // Bulk selection
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const total = services.length;
    const published = services.filter(s => s.status === 'published' || !s.status).length;
    const drafts = services.filter(s => s.status === 'draft').length;
    const archived = services.filter(s => s.status === 'archived').length;
    const totalBundles = bundles.length;
    const publishedBundles = bundles.filter(b => b.status === 'published').length;

    return { total, published, drafts, archived, totalBundles, publishedBundles };
  }, [services, bundles]);

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return services
      .filter(s => {
        // Status filter
        const st = s.status || 'published';
        if (statusFilter !== 'all' && st !== statusFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;

        // Featured filter
        if (featuredFilter && !s.isFeatured && !s.isPopular) return false;

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchCat = s.category.toLowerCase().includes(q);
          const matchSub = (s.subcategory || '').toLowerCase().includes(q);
          const matchDesc = s.description.toLowerCase().includes(q);
          const matchDeliv = (s.deliverables || []).some(d => d.toLowerCase().includes(q));
          if (!matchName && !matchCat && !matchSub && !matchDesc && !matchDeliv) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price_asc') return a.launchPrice - b.launchPrice;
        if (sortBy === 'price_desc') return b.launchPrice - a.launchPrice;
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      });
  }, [services, statusFilter, categoryFilter, featuredFilter, searchTerm, sortBy]);

  // Icon renderer helper
  const renderLucideIcon = (iconName: string, className = 'w-5 h-5') => {
    const LucideComp = (Icons as any)[iconName] || Icons.Sparkles;
    return <LucideComp className={className} />;
  };

  // Standardized Column Definitions for Services Table
  const serviceColumns: ColumnDef<Service>[] = useMemo(() => [
    {
      id: 'select',
      header: '',
      width: '40px',
      cell: (srv) => {
        const isSelected = selectedServiceIds.includes(srv.id);
        return (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedServiceIds(prev => [...prev, srv.id]);
              } else {
                setSelectedServiceIds(prev => prev.filter(i => i !== srv.id));
              }
            }}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
          />
        );
      }
    },
    {
      id: 'service',
      header: 'Service & Category',
      sortable: true,
      accessorKey: 'name',
      cell: (srv) => (
        <div className="flex items-center gap-3">
          <span className="p-2 bg-slate-100 text-slate-700 rounded-xl shrink-0">
            {renderLucideIcon(srv.iconName || 'Sparkles', 'w-4 h-4')}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-xs truncate">{srv.name}</span>
              {srv.isFeatured && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-black uppercase rounded border border-amber-200 flex items-center gap-0.5">
                  <Icons.Star className="w-2 h-2 fill-amber-500" /> Featured
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
              <span className="font-mono">{srv.id}</span>
              <span>•</span>
              <span className="font-bold uppercase text-indigo-600">
                {srv.category} {srv.subcategory ? `• ${srv.subcategory}` : ''}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pricing',
      header: 'Pricing & GST',
      sortable: true,
      accessorKey: 'launchPrice',
      cell: (srv) => (
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black text-slate-900">₹{srv.launchPrice.toLocaleString('en-IN')}</span>
            {srv.mrp > srv.launchPrice && (
              <span className="text-[10px] text-slate-400 line-through">₹{srv.mrp.toLocaleString('en-IN')}</span>
            )}
            <span className="text-[10px] text-slate-500">{srv.unit || '/ service'}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold block">
            + {srv.gstPercent || 18}% GST
          </span>
        </div>
      )
    },
    {
      id: 'deliverables',
      header: 'Deliverables & Turnaround',
      cell: (srv) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-slate-700">
            {srv.deliverables?.length || 0} Deliverables
          </div>
          {srv.turnaroundTime && (
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Icons.Clock className="w-3 h-3 text-indigo-500" />
              <span>{srv.turnaroundTime}</span>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      accessorKey: 'status',
      cell: (srv) => {
        const st = srv.status || 'published';
        return (
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              st === 'published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : st === 'draft'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {st}
            </span>
            <button
              onClick={() => handleToggleStatus(srv, st === 'published' ? 'draft' : 'published')}
              className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all cursor-pointer"
              title="Toggle Status"
            >
              {st === 'published' ? 'Draft' : 'Publish'}
            </button>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (srv) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setPreviewItem({ type: 'service', data: srv })}
            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Live Catalog Preview"
          >
            <Icons.Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setHistoryItem({ name: srv.name, history: srv.priceHistory || [] })}
            className="p-1.5 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Price Change History"
          >
            <Icons.History className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setEditingService({ ...srv });
              setModalTab('basic');
              setShowServiceModal(true);
            }}
            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <Icons.Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>

          {(userRole === 'super_admin' || userRole === 'admin') && (
            <button
              onClick={() => handleDeleteService(srv.id)}
              className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
              title="Delete Service"
            >
              <Icons.Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ], [selectedServiceIds, userRole]);

  // --- SERVICE SAVE HANDLER ---
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.name || !editingService?.id) {
      showToast('Validation Error', 'Service ID and Name are required.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...editingService,
        mrp: Number(editingService.mrp || 0),
        launchPrice: Number(editingService.launchPrice || 0),
        gstPercent: Number(editingService.gstPercent !== undefined ? editingService.gstPercent : 18),
        discountPercent: editingService.mrp && editingService.launchPrice
          ? Math.round(((editingService.mrp - editingService.launchPrice) / editingService.mrp) * 100)
          : Number(editingService.discountPercent || 0),
        author: userName,
        changeReason: changeReasonInput.trim() || 'Catalog Management update'
      };

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowServiceModal(false);
        setEditingService(null);
        setChangeReasonInput('');
        await onRefreshServices();
        showToast('Service Saved', `Service "${payload.name}" saved successfully.`, 'success');
      } else {
        const err = await res.json();
        showToast('Save Failed', 'Failed to save service: ' + (err.error || 'Unknown error'), 'error');
      }
    } catch (err: any) {
      console.error('Error saving service:', err);
      showToast('Network Error', 'Network error while saving service: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // --- BUNDLE SAVE HANDLER ---
  const handleSaveBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBundle?.name) {
      showToast('Validation Error', 'Bundle Name is required.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...editingBundle,
        mrp: Number(editingBundle.mrp || 0),
        bundlePrice: Number(editingBundle.bundlePrice || 0),
        gstPercent: Number(editingBundle.gstPercent !== undefined ? editingBundle.gstPercent : 18),
        author: userName,
        changeReason: changeReasonInput.trim() || 'Bundle configuration update'
      };

      const res = await fetch('/api/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowBundleModal(false);
        setEditingBundle(null);
        setChangeReasonInput('');
        if (onRefreshBundles) await onRefreshBundles();
        showToast('Bundle Saved', `Bundle "${payload.name}" saved successfully.`, 'success');
      } else {
        const err = await res.json();
        showToast('Save Failed', 'Failed to save bundle: ' + (err.error || 'Unknown error'), 'error');
      }
    } catch (err: any) {
      console.error('Error saving bundle:', err);
      showToast('Network Error', 'Network error while saving bundle: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // --- QUICK STATUS TOGGLE ---
  const handleToggleStatus = async (service: Service, newStatus: 'published' | 'draft' | 'archived') => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...service,
          status: newStatus,
          author: userName,
          changeReason: `Status changed to ${newStatus}`
        })
      });
      if (res.ok) {
        await onRefreshServices();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // --- DELETE SERVICE ---
  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' });
      if (res.ok) {
        await onRefreshServices();
      }
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  // --- DELETE BUNDLE ---
  const handleDeleteBundle = async (bundleId: string) => {
    if (!window.confirm('Delete this package bundle?')) return;
    try {
      const res = await fetch(`/api/bundles/${bundleId}`, { method: 'DELETE' });
      if (res.ok) {
        if (onRefreshBundles) await onRefreshBundles();
      }
    } catch (err) {
      console.error('Error deleting bundle:', err);
    }
  };

  // --- BULK ACTION HANDLER ---
  const handleBulkAction = async (action: 'publish' | 'draft' | 'archive' | 'delete') => {
    if (selectedServiceIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedServiceIds.length} services permanently?`)) return;

    try {
      const targetStatus = action === 'publish' ? 'published' : action === 'draft' ? 'draft' : 'archived';
      const res = await fetch('/api/services-bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedServiceIds,
          action: action === 'delete' ? 'delete' : 'status',
          status: targetStatus
        })
      });
      if (res.ok) {
        setSelectedServiceIds([]);
        await onRefreshServices();
      }
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  };

  // --- REORDER HANDLER ---
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredServices.length) return;

    const listCopy = [...filteredServices];
    const current = listCopy[index];
    const neighbor = listCopy[targetIndex];

    const displayOrders = [
      { id: current.id, order: neighbor.displayOrder || targetIndex + 1 },
      { id: neighbor.id, order: current.displayOrder || index + 1 }
    ];

    try {
      const res = await fetch('/api/services-bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', displayOrders })
      });
      if (res.ok) {
        await onRefreshServices();
      }
    } catch (err) {
      console.error('Reorder failed:', err);
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. TOP SUMMARY METRICS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Icons.Tag className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Total Catalog</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">{stats.total} Services</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Icons.CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Live Published</span>
            <div className="text-lg font-black text-emerald-700 mt-0.5">{stats.published} Live</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Icons.FileEdit className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Drafts / In Review</span>
            <div className="text-lg font-black text-amber-700 mt-0.5">{stats.drafts} Drafts</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
            <Icons.Boxes className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Combo Packages</span>
            <div className="text-lg font-black text-purple-800 mt-0.5">{stats.totalBundles} Bundles</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl shrink-0">
            <Icons.Percent className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Standard GST</span>
            <div className="text-lg font-black text-cyan-700 mt-0.5">18% Flat</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-center gap-1.5">
          <button
            onClick={() => {
              setEditingService({
                id: 'srv-' + Math.random().toString(36).substring(2, 7),
                name: '',
                category: 'social',
                subcategory: 'General',
                mrp: 1000,
                launchPrice: 799,
                gstPercent: 18,
                discountPercent: 20,
                turnaroundTime: '3-5 Business Days',
                deliverables: ['Custom Graphic Design', 'Source File Included'],
                description: '',
                unit: '/ service',
                iconName: 'Sparkles',
                status: 'draft',
                isFeatured: false
              });
              setModalTab('basic');
              setShowServiceModal(true);
            }}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            <span>+ Add Service</span>
          </button>

          <button
            onClick={() => {
              setEditingBundle({
                id: 'bundle-' + Math.random().toString(36).substring(2, 7),
                name: '',
                description: '',
                category: 'combo',
                subcategory: 'Growth Package',
                serviceIds: [],
                bundleType: 'fixed',
                mrp: 15000,
                bundlePrice: 9999,
                gstPercent: 18,
                turnaroundTime: '5-7 Days',
                deliverables: ['Full Service Combo Suite'],
                badge: 'SPECIAL BUNDLE',
                status: 'published',
                isFeatured: true
              });
              setShowBundleModal(true);
            }}
            className="w-full py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <Icons.PackagePlus className="w-3.5 h-3.5" />
            <span>+ Create Bundle</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS & SEARCH / FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Icons.Grid className="w-4 h-4" />
              <span>Services Catalog ({stats.total})</span>
            </button>

            <button
              onClick={() => setActiveTab('bundles')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'bundles'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-100'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Icons.Boxes className="w-4 h-4" />
              <span>Packages & Bundles ({stats.totalBundles})</span>
            </button>

            <button
              onClick={() => setActiveTab('ordering')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ordering'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Icons.ArrowUpDown className="w-4 h-4" />
              <span>Display Ordering</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-400 hidden md:inline">
            ⚡ All published items sync in real-time with website catalog & quote calculator
          </span>
        </div>

        {/* Search & Filter Bar */}
        {activeTab === 'services' && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Icons.Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search services by name, category, subcategory, deliverables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <Icons.X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {CATEGORIES_CONFIG.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="published">🟢 Published Only</option>
                <option value="draft">🟡 Drafts Only</option>
                <option value="archived">🔴 Archived Only</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="order">Default Order</option>
                <option value="name">Name (A-Z)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              {/* Featured Toggle Filter */}
              <button
                onClick={() => setFeaturedFilter(!featuredFilter)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                  featuredFilter
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Icons.Star className={`w-3.5 h-3.5 ${featuredFilter ? 'fill-white' : ''}`} />
                <span>Popular / Featured</span>
              </button>

            </div>

          </div>
        )}

        {/* Bulk Operations Toolbar */}
        {selectedServiceIds.length > 0 && activeTab === 'services' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-indigo-900 text-white rounded-xl flex items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500 font-black text-xs flex items-center justify-center">
                {selectedServiceIds.length}
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider">Services Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Publish Selected
              </button>
              <button
                onClick={() => handleBulkAction('draft')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Move to Draft
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Archive Selected
              </button>
              <button
                onClick={() => setSelectedServiceIds([])}
                className="px-2 py-1 text-indigo-300 hover:text-white text-xs underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}

      </div>

      {/* 3. TAB CONTENT 1: SERVICES CATALOG GRID & TABLE */}
      {activeTab === 'services' && (
        <AdminDataTable<Service>
          data={filteredServices}
          columns={serviceColumns}
          keyExtractor={(srv) => srv.id}
          searchable={false}
          selectable={false}
          emptyTitle="No services match your search or filters."
          emptyDescription="Try adjusting your category, status, or featured filter."
          emptyIcon={Icons.SearchX}
          initialPageSize={12}
          pageSizeOptions={[12, 24, 48, 96]}
          defaultViewMode="cards"
          allowViewToggle={true}
          tableMinWidth="min-w-[950px]"
          renderCard={(srv) => {
            const isSelected = selectedServiceIds.includes(srv.id);
            const st = srv.status || 'published';

            return (
              <motion.div
                key={srv.id}
                layout
                className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all space-y-4 relative flex flex-col justify-between ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' : 'border-slate-200/90'
                }`}
              >
                {/* Top Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedServiceIds(prev => [...prev, srv.id]);
                          } else {
                            setSelectedServiceIds(prev => prev.filter(i => i !== srv.id));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                      />
                      <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                        {renderLucideIcon(srv.iconName || 'Sparkles', 'w-4 h-4')}
                      </span>
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-mono text-slate-400 block truncate">{srv.id}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block truncate">
                          {srv.category} {srv.subcategory ? `• ${srv.subcategory}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Status & Featured badges */}
                    <div className="flex items-center gap-1 shrink-0">
                      {srv.isFeatured && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded-full border border-amber-200 flex items-center gap-0.5">
                          <Icons.Star className="w-2.5 h-2.5 fill-amber-500" /> Featured
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        st === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : st === 'draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {st}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-slate-900 text-sm mt-1 line-clamp-1">{srv.name}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2 mt-1 min-h-[32px]">{srv.description || 'No description added yet.'}</p>

                  {/* Price Block */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-slate-900">₹{srv.launchPrice.toLocaleString('en-IN')}</span>
                        {srv.mrp > srv.launchPrice && (
                          <span className="text-xs text-slate-400 line-through font-bold">₹{srv.mrp.toLocaleString('en-IN')}</span>
                        )}
                        <span className="text-[10px] text-slate-500 font-medium">{srv.unit || '/ service'}</span>
                      </div>
                      <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">
                        + {srv.gstPercent || 18}% GST (₹{Math.round((srv.launchPrice * (srv.gstPercent || 18)) / 100).toLocaleString('en-IN')})
                      </span>
                    </div>

                    {srv.turnaroundTime && (
                      <span className="px-2 py-1 bg-white text-slate-700 text-[10px] font-extrabold rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs">
                        <Icons.Clock className="w-3 h-3 text-indigo-600" />
                        {srv.turnaroundTime}
                      </span>
                    )}
                  </div>

                  {/* Deliverables Checklist Preview */}
                  {srv.deliverables && srv.deliverables.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Deliverables Checklist</span>
                      <ul className="space-y-1">
                        {srv.deliverables.slice(0, 3).map((item, dIdx) => (
                          <li key={dIdx} className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                            <Icons.CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                        {srv.deliverables.length > 3 && (
                          <li className="text-[10px] font-bold text-indigo-600">
                            +{srv.deliverables.length - 3} more deliverables
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-1 mt-3">
                  <div className="flex items-center gap-1">
                    {/* Live Preview Button */}
                    <button
                      onClick={() => setPreviewItem({ type: 'service', data: srv })}
                      className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Live Catalog Preview"
                    >
                      <Icons.Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Pricing History Button */}
                    <button
                      onClick={() => setHistoryItem({ name: srv.name, history: srv.priceHistory || [] })}
                      className="p-1.5 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Price Change History"
                    >
                      <Icons.History className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Publish / Draft Switch */}
                    <button
                      onClick={() => handleToggleStatus(srv, st === 'published' ? 'draft' : 'published')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border ${
                        st === 'published'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                      title="Toggle Publish / Draft"
                    >
                      {st === 'published' ? 'Draft' : 'Publish'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingService({ ...srv });
                        setModalTab('basic');
                        setShowServiceModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Icons.Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {(userRole === 'super_admin' || userRole === 'admin') && (
                      <button
                        onClick={() => handleDeleteService(srv.id)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Service"
                      >
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          }}
        />
      )}

      {/* 4. TAB CONTENT 2: PACKAGES & BUNDLES */}
      {activeTab === 'bundles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-purple-50 p-4 rounded-2xl border border-purple-100">
            <div>
              <h3 className="font-extrabold text-purple-950 text-sm flex items-center gap-2">
                <Icons.Boxes className="w-4 h-4 text-purple-600" />
                Service Combo Packages & Bundle Discount Rules
              </h3>
              <p className="text-purple-700 text-xs mt-0.5">
                Group multiple services together with special bundle pricing and stacked deliverables.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingBundle({
                  id: 'bundle-' + Math.random().toString(36).substring(2, 7),
                  name: '',
                  description: '',
                  category: 'combo',
                  serviceIds: [],
                  bundleType: 'fixed',
                  mrp: 20000,
                  bundlePrice: 14999,
                  gstPercent: 18,
                  turnaroundTime: '7 Days',
                  deliverables: ['All Combo Deliverables Included'],
                  status: 'published'
                });
                setShowBundleModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-200 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Icons.Plus className="w-4 h-4" />
              <span>Create New Bundle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
                <Icons.PackageX className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-sm">No combo packages created yet.</p>
                <p className="text-xs text-slate-400">Create a bundle to offer bundled discounts on multi-service packages.</p>
              </div>
            ) : (
              bundles.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-purple-100 p-5 shadow-2xs space-y-4 relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black uppercase rounded-full border border-purple-200">
                        {b.badge || 'COMBO BUNDLE'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        b.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-base">{b.name}</h3>
                    <p className="text-slate-500 text-xs mt-1">{b.description}</p>

                    {/* Included Services Tags */}
                    <div className="mt-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Included Services ({b.serviceIds.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {b.serviceIds.map(sid => {
                          const sMatch = services.find(s => s.id === sid);
                          return (
                            <span key={sid} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                              ✓ {sMatch ? sMatch.name : sid}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pricing Block */}
                    <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 mt-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-purple-900">₹{b.bundlePrice.toLocaleString('en-IN')}</span>
                          {b.mrp > b.bundlePrice && (
                            <span className="text-xs text-slate-400 line-through font-bold">₹{b.mrp.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-purple-700 font-bold block mt-0.5">
                          Includes {b.gstPercent || 18}% GST • Instant Package Discount
                        </span>
                      </div>

                      {b.turnaroundTime && (
                        <span className="px-2.5 py-1 bg-white text-purple-900 text-[11px] font-black rounded-lg border border-purple-200 shadow-2xs">
                          ⚡ {b.turnaroundTime}
                        </span>
                      )}
                    </div>

                    {/* Deliverables */}
                    {b.deliverables && b.deliverables.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bundle Deliverables</span>
                        <ul className="space-y-1">
                          {b.deliverables.map((deliv, dIdx) => (
                            <li key={dIdx} className="text-xs text-slate-600 flex items-center gap-1.5">
                              <Icons.CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>{deliv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewItem({ type: 'bundle', data: b })}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Icons.Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingBundle({ ...b });
                          setShowBundleModal(true);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Edit Bundle
                      </button>
                      <button
                        onClick={() => handleDeleteBundle(b.id)}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                        title="Delete Bundle"
                      >
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 3: DISPLAY ORDERING MANAGER */}
      {activeTab === 'ordering' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Service Display Order Manager</h3>
              <p className="text-slate-500 text-xs">Use arrow controls to rearrange service ordering on the public Website Catalog.</p>
            </div>
            <button
              onClick={() => onRefreshServices()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
            >
              <Icons.RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh List</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredServices.map((srv, idx) => (
              <div key={srv.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-xs font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    {renderLucideIcon(srv.iconName || 'Sparkles', 'w-4 h-4')}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{srv.name}</h4>
                    <span className="text-[10px] text-slate-400 uppercase font-black">{srv.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 mr-2">₹{srv.launchPrice.toLocaleString('en-IN')}</span>
                  
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveOrder(idx, 'up')}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 disabled:opacity-30 rounded-lg cursor-pointer"
                    title="Move Up"
                  >
                    <Icons.ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    disabled={idx === filteredServices.length - 1}
                    onClick={() => handleMoveOrder(idx, 'down')}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 disabled:opacity-30 rounded-lg cursor-pointer"
                    title="Move Down"
                  >
                    <Icons.ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. MODAL: SERVICE CREATOR / EDITOR */}
      <AnimatePresence>
        {showServiceModal && editingService && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl">
                    <Icons.Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">
                      {editingService.name ? `Edit Service: ${editingService.name}` : 'Create New Deliverable Service'}
                    </h3>
                    <p className="text-xs text-slate-400">Configure deliverables, pricing rules, GST, and turnaround terms.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tab Controls */}
              <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold overflow-x-auto">
                <button
                  onClick={() => setModalTab('basic')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    modalTab === 'basic' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1. Basic Details
                </button>
                <button
                  onClick={() => setModalTab('pricing')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    modalTab === 'pricing' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2. Pricing & GST
                </button>
                <button
                  onClick={() => setModalTab('deliverables')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    modalTab === 'deliverables' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3. Deliverables Checklist ({editingService.deliverables?.length || 0})
                </button>
                <button
                  onClick={() => setModalTab('media')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    modalTab === 'media' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4. Media & Badges
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveService} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
                
                {/* TAB 1: BASIC DETAILS */}
                {modalTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Service Identifier / Slug *</label>
                        <input
                          type="text"
                          required
                          value={editingService.id || ''}
                          onChange={(e) => setEditingService({ ...editingService, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                          placeholder="e.g. meta-ads-growth"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Service Title *</label>
                        <input
                          type="text"
                          required
                          value={editingService.name || ''}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          placeholder="e.g. Meta Ads & Lead Gen Suite"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Category *</label>
                        <select
                          value={editingService.category || 'social'}
                          onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          {CATEGORIES_CONFIG.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Subcategory / Tag</label>
                        <input
                          type="text"
                          value={editingService.subcategory || ''}
                          onChange={(e) => setEditingService({ ...editingService, subcategory: e.target.value })}
                          placeholder="e.g. Lead Generation, Reels, E-commerce"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 uppercase mb-1">Service Description</label>
                      <textarea
                        rows={3}
                        value={editingService.description || ''}
                        onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                        placeholder="Comprehensive description of what is included in this service..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Unit Descriptor</label>
                        <input
                          type="text"
                          value={editingService.unit || ''}
                          onChange={(e) => setEditingService({ ...editingService, unit: e.target.value })}
                          placeholder="e.g. / month, / website, / reel"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Turnaround Time</label>
                        <input
                          type="text"
                          value={editingService.turnaroundTime || ''}
                          onChange={(e) => setEditingService({ ...editingService, turnaroundTime: e.target.value })}
                          placeholder="e.g. 3-5 Business Days, 24 Hours Express"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRICING & GST */}
                {modalTab === 'pricing' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Standard List Price MRP (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editingService.mrp || 0}
                          onChange={(e) => {
                            const mrpVal = Number(e.target.value);
                            const discVal = Number(editingService.discountPercent || 20);
                            const calcLaunch = Math.round(mrpVal * (1 - discVal / 100));
                            setEditingService({ ...editingService, mrp: mrpVal, launchPrice: calcLaunch });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Selling / Launch Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={editingService.launchPrice || 0}
                          onChange={(e) => {
                            const launchVal = Number(e.target.value);
                            const mrpVal = Number(editingService.mrp || launchVal);
                            const calcDisc = mrpVal > 0 ? Math.round(((mrpVal - launchVal) / mrpVal) * 100) : 0;
                            setEditingService({ ...editingService, launchPrice: launchVal, discountPercent: calcDisc });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">GST Percentage (%)</label>
                        <select
                          value={editingService.gstPercent !== undefined ? editingService.gstPercent : 18}
                          onChange={(e) => setEditingService({ ...editingService, gstPercent: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value={18}>18% GST (Standard Services)</option>
                          <option value={12}>12% GST</option>
                          <option value={5}>5% GST</option>
                          <option value={0}>0% GST (Tax Exempt)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Discount % Indicator</label>
                        <input
                          type="number"
                          value={editingService.discountPercent || 0}
                          onChange={(e) => {
                            const discVal = Number(e.target.value);
                            const mrpVal = Number(editingService.mrp || 1000);
                            const calcLaunch = Math.round(mrpVal * (1 - discVal / 100));
                            setEditingService({ ...editingService, discountPercent: discVal, launchPrice: calcLaunch });
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Calculated Price Breakdown Box */}
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Final Client Invoice Calculation</span>
                      <div className="flex items-center justify-between text-xs font-black text-emerald-900 pt-1">
                        <span>Base Selling Price: ₹{(editingService.launchPrice || 0).toLocaleString('en-IN')}</span>
                        <span>GST ({editingService.gstPercent || 18}%): +₹{Math.round(((editingService.launchPrice || 0) * (editingService.gstPercent || 18)) / 100).toLocaleString('en-IN')}</span>
                        <span className="text-sm underline">Total: ₹{Math.round((editingService.launchPrice || 0) * (1 + (editingService.gstPercent || 18) / 100)).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 uppercase mb-1">Price Change History Reason Note</label>
                      <input
                        type="text"
                        value={changeReasonInput}
                        onChange={(e) => setChangeReasonInput(e.target.value)}
                        placeholder="e.g. Festive discount update, Scope addition, Inflation adjustment..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: DELIVERABLES CHECKLIST */}
                {modalTab === 'deliverables' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-black text-slate-700 uppercase mb-1">Add Deliverable Checklist Item</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newDeliverableInput}
                          onChange={(e) => setNewDeliverableInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newDeliverableInput.trim()) {
                                setEditingService({
                                  ...editingService,
                                  deliverables: [...(editingService.deliverables || []), newDeliverableInput.trim()]
                                });
                                setNewDeliverableInput('');
                              }
                            }
                          }}
                          placeholder="e.g. 10 Custom Reel Graphics, Source Files Included, 2 Revisions"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newDeliverableInput.trim()) {
                              setEditingService({
                                ...editingService,
                                deliverables: [...(editingService.deliverables || []), newDeliverableInput.trim()]
                              });
                              setNewDeliverableInput('');
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Deliverables List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(!editingService.deliverables || editingService.deliverables.length === 0) ? (
                        <p className="text-slate-400 italic text-center py-4">No deliverables added yet. Type an item above and click Add.</p>
                      ) : (
                        editingService.deliverables.map((item, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-800 flex items-center gap-2">
                              <Icons.CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              {item}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingService({
                                  ...editingService,
                                  deliverables: editingService.deliverables?.filter((_, i) => i !== idx)
                                });
                              }}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                            >
                              <Icons.X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: MEDIA & BADGES */}
                {modalTab === 'media' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Lucide Icon Identifier</label>
                        <select
                          value={editingService.iconName || 'Sparkles'}
                          onChange={(e) => setEditingService({ ...editingService, iconName: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="Sparkles">✨ Sparkles</option>
                          <option value="Instagram">📸 Instagram</option>
                          <option value="Video">📹 Video / Reel</option>
                          <option value="Code">💻 Code / Web</option>
                          <option value="Palette">🎨 Palette / Design</option>
                          <option value="Megaphone">📢 Megaphone / Ads</option>
                          <option value="Cpu">⚙️ Cpu / System</option>
                          <option value="FileText">📄 FileText / Content</option>
                          <option value="Search">🔍 Search / SEO</option>
                          <option value="TrendingUp">📈 TrendingUp / Marketing</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-black text-slate-700 uppercase mb-1">Custom Badge Text</label>
                        <input
                          type="text"
                          value={editingService.badge || ''}
                          onChange={(e) => setEditingService({ ...editingService, badge: e.target.value })}
                          placeholder="e.g. 🔥 POPULAR, 20% OFF, STARTER"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-black text-slate-700 uppercase mb-1">Cover Image URL</label>
                      <input
                        type="url"
                        value={editingService.imageUrl || ''}
                        onChange={(e) => setEditingService({ ...editingService, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!editingService.isFeatured}
                          onChange={(e) => setEditingService({ ...editingService, isFeatured: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="font-extrabold text-slate-800">Feature on Homepage / Catalog Hero</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingService.status === 'published'}
                          onChange={(e) => setEditingService({ ...editingService, status: e.target.checked ? 'published' : 'draft' })}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <span className="font-extrabold text-slate-800">Publish Immediately to Website Catalog</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">
                    Status: <strong className="uppercase text-indigo-600">{editingService.status || 'draft'}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowServiceModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Service'}
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. MODAL: BUNDLE CREATOR / EDITOR */}
      <AnimatePresence>
        {showBundleModal && editingBundle && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8"
            >
              <div className="p-5 bg-purple-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-600 text-white rounded-xl">
                    <Icons.Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">Configure Package Combo Bundle</h3>
                    <p className="text-xs text-purple-200">Combine multiple services with bundled pricing discounts.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBundleModal(false)}
                  className="p-2 hover:bg-purple-800 text-purple-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBundle} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block font-black text-slate-700 uppercase mb-1">Bundle Name *</label>
                  <input
                    type="text"
                    required
                    value={editingBundle.name || ''}
                    onChange={(e) => setEditingBundle({ ...editingBundle, name: e.target.value })}
                    placeholder="e.g. 360° Digital Launch Pack"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 uppercase mb-1">Bundle Description</label>
                  <textarea
                    rows={2}
                    value={editingBundle.description || ''}
                    onChange={(e) => setEditingBundle({ ...editingBundle, description: e.target.value })}
                    placeholder="Includes Web & SEO, Logo & Brand Identity, and 1 Month Social Growth..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Service Selection Checklist */}
                <div>
                  <label className="block font-black text-slate-700 uppercase mb-1">Select Included Services</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto space-y-1.5">
                    {services.map(s => {
                      const isIncluded = (editingBundle.serviceIds || []).includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center justify-between p-1.5 hover:bg-white rounded-lg cursor-pointer">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={isIncluded}
                              onChange={(e) => {
                                const current = editingBundle.serviceIds || [];
                                if (e.target.checked) {
                                  setEditingBundle({ ...editingBundle, serviceIds: [...current, s.id] });
                                } else {
                                  setEditingBundle({ ...editingBundle, serviceIds: current.filter(id => id !== s.id) });
                                }
                              }}
                              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                            />
                            {s.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">₹{s.launchPrice.toLocaleString('en-IN')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Pricing Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-black text-slate-700 uppercase mb-1">Total Component Price MRP (₹)</label>
                    <input
                      type="number"
                      value={editingBundle.mrp || 0}
                      onChange={(e) => setEditingBundle({ ...editingBundle, mrp: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 uppercase mb-1">Special Bundle Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={editingBundle.bundlePrice || 0}
                      onChange={(e) => setEditingBundle({ ...editingBundle, bundlePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-purple-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-black text-slate-700 uppercase mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={editingBundle.badge || ''}
                      onChange={(e) => setEditingBundle({ ...editingBundle, badge: e.target.value })}
                      placeholder="e.g. BEST SELLER 🚀, SAVE 30%"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 uppercase mb-1">Turnaround Time</label>
                    <input
                      type="text"
                      value={editingBundle.turnaroundTime || ''}
                      onChange={(e) => setEditingBundle({ ...editingBundle, turnaroundTime: e.target.value })}
                      placeholder="e.g. 7-10 Days"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBundleModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-md shadow-purple-200 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Bundle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. MODAL: LIVE PREVIEW BEFORE PUBLISHING */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-xs uppercase flex items-center gap-1">
                  <Icons.Eye className="w-3.5 h-3.5" />
                  Live Website Catalog Card Preview
                </span>
                <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Card Mockup */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="p-2 bg-white text-indigo-600 rounded-xl shadow-2xs">
                    {renderLucideIcon(previewItem.data.iconName || 'Sparkles', 'w-5 h-5')}
                  </span>
                  {previewItem.data.badge && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black text-[10px] rounded-full border border-amber-200">
                      {previewItem.data.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-slate-900">{previewItem.data.name}</h3>
                <p className="text-xs text-slate-600">{previewItem.data.description || 'Deliverable details and specifications.'}</p>

                <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-black text-indigo-700">
                      ₹{(previewItem.data.launchPrice || previewItem.data.bundlePrice || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-bold">
                      + {previewItem.data.gstPercent || 18}% GST
                    </span>
                  </div>

                  <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-2xs">
                    + Select Service
                  </span>
                </div>

                {previewItem.data.deliverables && previewItem.data.deliverables.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Included Deliverables</span>
                    <ul className="space-y-1">
                      {previewItem.data.deliverables.map((del: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-center gap-1.5">
                          <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. MODAL: PRICE CHANGE HISTORY TIMELINE */}
      <AnimatePresence>
        {historyItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Icons.History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Pricing Audit History</h3>
                    <p className="text-xs text-slate-400">{historyItem.name}</p>
                  </div>
                </div>
                <button onClick={() => setHistoryItem(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {historyItem.history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No price changes logged yet. Future edits to MRP or selling price will be recorded automatically.
                  </p>
                ) : (
                  historyItem.history.map((h) => (
                    <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Edited by {h.author || 'Admin'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 pt-1 font-semibold">
                        <span className="line-through text-slate-400">₹{h.oldLaunchPrice.toLocaleString('en-IN')}</span>
                        <Icons.ArrowRight className="w-3 h-3 text-indigo-600" />
                        <span className="font-black text-indigo-700">₹{h.newLaunchPrice.toLocaleString('en-IN')}</span>
                        {h.oldMrp !== h.newMrp && (
                          <span className="text-[10px] text-slate-400 ml-auto">(MRP: ₹{h.oldMrp} → ₹{h.newMrp})</span>
                        )}
                      </div>
                      {h.reason && (
                        <p className="text-[11px] text-slate-500 italic pt-0.5">Note: "{h.reason}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setHistoryItem(null)}
                className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Close History
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
