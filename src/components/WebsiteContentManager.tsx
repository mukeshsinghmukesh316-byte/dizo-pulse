import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from './UIPolish';

export interface WebsiteContentManagerProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

export function WebsiteContentManager({ userRole, userName, userEmail }: WebsiteContentManagerProps) {
  const isAdminOrSuperAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Data state
  const [contentState, setContentState] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'stats' | 'offers' | 'services' | 'about' | 'testimonials' | 'faq' | 'footer' | 'reorder'>('hero');
  
  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Fetch initial content
  const fetchWebsiteContent = async (mode: 'published' | 'draft' = 'draft') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/website-content?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setContentState(data);
        setFormData(JSON.parse(JSON.stringify(data.activeContent)));
        setHasUnsavedChanges(Boolean(data.isDraft));
      } else {
        showToast('Failed to load website content', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsiteContent('draft');
  }, []);

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev };
      if (!updated[section]) updated[section] = {};
      updated[section][field] = value;
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleNestedInputChange = (section: string, subObj: string, field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev };
      if (!updated[section]) updated[section] = {};
      if (!updated[section][subObj]) updated[section][subObj] = {};
      updated[section][subObj][field] = value;
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleToggleSection = (sectionKey: string) => {
    setFormData((prev: any) => {
      const updated = { ...prev };
      if (!updated[sectionKey]) updated[sectionKey] = {};
      updated[sectionKey].enabled = !updated[sectionKey].enabled;
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Image upload helper
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileDataUrl: dataUrl, fileName: file.name }),
        });
        const data = await res.json();
        if (data.url) {
          callback(data.url);
          setHasUnsavedChanges(true);
          showToast('Image uploaded successfully!', 'success');
        }
      } catch (err) {
        showToast('Image upload failed', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!isAdminOrSuperAdmin) {
      showToast('Super Admin or Admin permissions required to edit content.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/website-content/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: formData }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContentState(data.content);
        setHasUnsavedChanges(true);
        showToast('Draft changes saved successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to save draft', 'error');
      }
    } catch (err) {
      showToast('Error saving draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Publish
  const handlePublishLive = async () => {
    if (!isAdminOrSuperAdmin) {
      showToast('Super Admin or Admin permissions required to publish content.', 'error');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/website-content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          published: formData,
          updatedBy: `${userName} (${userRole})`,
          changeNote: publishNote || 'Updated homepage content sections'
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContentState(data.content);
        setFormData(JSON.parse(JSON.stringify(data.content.published)));
        setHasUnsavedChanges(false);
        setShowPublishModal(false);
        setPublishNote('');
        showToast('🚀 Changes published live to website!', 'success');
      } else {
        showToast(data.error || 'Failed to publish content', 'error');
      }
    } catch (err) {
      showToast('Error publishing content', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Cancel / Revert
  const handleRevertChanges = async () => {
    if (!hasUnsavedChanges) return;
    if (window.confirm('Discard all unsaved/draft changes and revert to the live published version?')) {
      try {
        await fetch('/api/website-content/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'discard_draft' }),
        });
        await fetchWebsiteContent('published');
        showToast('Reverted back to live published content', 'info');
      } catch (err) {
        showToast('Failed to revert changes', 'error');
      }
    }
  };

  // Restore revision
  const handleRestoreRevision = async (revId: string) => {
    if (!isAdminOrSuperAdmin) {
      showToast('Super Admin permission required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/website-content/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionId: revId,
          updatedBy: `${userName} (${userRole})`
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContentState(data.content);
        setFormData(JSON.parse(JSON.stringify(data.content.published)));
        setHasUnsavedChanges(false);
        setShowHistoryModal(false);
        showToast('Revision restored successfully and published live!', 'success');
      } else {
        showToast(data.error || 'Failed to restore revision', 'error');
      }
    } catch (err) {
      showToast('Error restoring revision', 'error');
    }
  };

  // Reordering sections helper
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const order = [...(formData.sectionOrder || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const temp = order[index];
    order[index] = order[targetIndex];
    order[targetIndex] = temp;
    setFormData((prev: any) => ({ ...prev, sectionOrder: order }));
    setHasUnsavedChanges(true);
  };

  if (loading || !formData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 min-h-[400px]">
        <Icons.Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading Website Content Manager...</p>
      </div>
    );
  }

  const sectionNameMap: Record<string, string> = {
    hero: 'Homepage Hero',
    stats: 'Success Statistics',
    seasonalOffers: 'Seasonal Offers',
    featuredServices: 'Featured Services',
    aboutSection: 'About Section',
    testimonials: 'Testimonials',
    faq: 'FAQ',
    footerInfo: 'Footer Information'
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Icons.Globe className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Website Content Manager</h2>
            {contentState?.isDraft ? (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Unpublished Draft
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Live Synced
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Edit text, upload imagery, toggle visibility, and publish updates live to the public homepage.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Live Preview"
          >
            <Icons.Eye className="w-4 h-4 text-indigo-600" />
            Live Preview
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Content Revision History"
          >
            <Icons.History className="w-4 h-4 text-slate-600" />
            History ({contentState?.history?.length || 0})
          </button>

          {hasUnsavedChanges && (
            <button
              onClick={handleRevertChanges}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.RotateCcw className="w-4 h-4" />
              Discard Draft
            </button>
          )}

          <button
            onClick={handleSaveDraft}
            disabled={saving || !isAdminOrSuperAdmin}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
            Save Draft
          </button>

          <button
            onClick={() => setShowPublishModal(true)}
            disabled={publishing || !isAdminOrSuperAdmin}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Icons.Send className="w-4 h-4" />
            Publish Live
          </button>
        </div>
      </div>

      {!isAdminOrSuperAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold flex items-center gap-2">
          <Icons.ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Notice: You are logged in with staff read-only access. Only Super Admin or Admin roles can save or publish content changes.</span>
        </div>
      )}

      {/* SECTION TABS & EDITING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TAB SIDEBAR */}
        <div className="lg:col-span-3 space-y-1.5 bg-white p-3 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Website Sections
          </div>

          {[
            { id: 'hero', label: '1. Homepage Hero', icon: 'Sparkles', enabled: formData.hero?.enabled },
            { id: 'stats', label: '2. Success Statistics', icon: 'BarChart2', enabled: formData.stats?.enabled },
            { id: 'offers', label: '3. Seasonal Offers', icon: 'Tag', enabled: formData.seasonalOffers?.enabled },
            { id: 'services', label: '4. Featured Services', icon: 'Grid', enabled: formData.featuredServices?.enabled },
            { id: 'about', label: '5. About Section', icon: 'Info', enabled: formData.aboutSection?.enabled },
            { id: 'testimonials', label: '6. Testimonials', icon: 'MessageSquare', enabled: formData.testimonials?.enabled },
            { id: 'faq', label: '7. FAQ Accordion', icon: 'HelpCircle', enabled: formData.faq?.enabled },
            { id: 'footer', label: '8. Footer & Contact', icon: 'Layout', enabled: formData.footerInfo?.enabled },
            { id: 'reorder', label: '⚙️ Section Reorder & Visibility', icon: 'Move', enabled: true },
          ].map((tab) => {
            const IconComp = (Icons as any)[tab.icon] || Icons.FileText;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.id !== 'reorder' && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tab.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* TAB EDITING PANEL */}
        <div className="lg:col-span-9 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">

          {/* TAB 1: HOMEPAGE HERO */}
          {activeTab === 'hero' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Homepage Hero Section</h3>
                  <p className="text-xs text-slate-500 font-medium">Main headline, value proposition, and primary call-to-action buttons.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.hero?.enabled ?? true}
                    onChange={() => handleToggleSection('hero')}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Section Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Badge Text (Top Pill)</label>
                  <input
                    type="text"
                    value={formData.hero?.badgeText || ''}
                    onChange={(e) => handleInputChange('hero', 'badgeText', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Headline Prefix Text</label>
                  <input
                    type="text"
                    value={formData.hero?.headlinePrefix || ''}
                    onChange={(e) => handleInputChange('hero', 'headlinePrefix', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Headline Gradient Accent Text</label>
                  <input
                    type="text"
                    value={formData.hero?.headlineGradientText || ''}
                    onChange={(e) => handleInputChange('hero', 'headlineGradientText', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Primary CTA Button Label</label>
                  <input
                    type="text"
                    value={formData.hero?.primaryCtaText || ''}
                    onChange={(e) => handleInputChange('hero', 'primaryCtaText', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Secondary CTA Button Label</label>
                  <input
                    type="text"
                    value={formData.hero?.secondaryCtaText || ''}
                    onChange={(e) => handleInputChange('hero', 'secondaryCtaText', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Hero Starting Price (₹ / Offer)</label>
                  <input
                    type="text"
                    value={formData.hero?.offerStartPrice || ''}
                    onChange={(e) => handleInputChange('hero', 'offerStartPrice', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Hero Subtitle / Description</label>
                <textarea
                  rows={3}
                  value={formData.hero?.description || ''}
                  onChange={(e) => handleInputChange('hero', 'description', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Offer Card Customization */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Zap className="w-4 h-4 text-amber-500" />
                  Hero Floating Promo Box Content
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Offer Badge Title"
                    value={formData.hero?.offerBadgeTitle || ''}
                    onChange={(e) => handleInputChange('hero', 'offerBadgeTitle', e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Offer Headline"
                    value={formData.hero?.offerHeadline || ''}
                    onChange={(e) => handleInputChange('hero', 'offerHeadline', e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Offer Description text"
                  value={formData.hero?.offerDescription || ''}
                  onChange={(e) => handleInputChange('hero', 'offerDescription', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {/* TAB 2: SUCCESS STATISTICS */}
          {activeTab === 'stats' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Success Statistics & Key Value Pillars</h3>
                  <p className="text-xs text-slate-500 font-medium">Highlight key stats, guarantee pillars, and brand advantages.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.stats?.enabled ?? true}
                    onChange={() => handleToggleSection('stats')}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Section Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.stats?.items || []).map((stat: any, idx: number) => (
                  <div key={stat.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-indigo-600">Pillar #{idx + 1}</span>
                      <button
                        onClick={() => {
                          const updated = [...(formData.stats?.items || [])];
                          updated.splice(idx, 1);
                          handleInputChange('stats', 'items', updated);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Remove Stat"
                      >
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Title / Metric (e.g. Fast Delivery)"
                        value={stat.title}
                        onChange={(e) => {
                          const updated = [...(formData.stats?.items || [])];
                          updated[idx].title = e.target.value;
                          handleInputChange('stats', 'items', updated);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Subtitle / Description"
                        value={stat.subtitle}
                        onChange={(e) => {
                          const updated = [...(formData.stats?.items || [])];
                          updated[idx].subtitle = e.target.value;
                          handleInputChange('stats', 'items', updated);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const items = formData.stats?.items || [];
                  const newStat = {
                    id: 'st-' + Date.now(),
                    icon: 'Rocket',
                    title: 'New Key Metric',
                    subtitle: 'Short description of this achievement'
                  };
                  handleInputChange('stats', 'items', [...items, newStat]);
                }}
                className="w-full py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icons.PlusCircle className="w-4 h-4" />
                Add New Statistic Pillar
              </button>
            </div>
          )}

          {/* TAB 3: SEASONAL OFFERS */}
          {activeTab === 'offers' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Seasonal Offers & Top Announcement Banner</h3>
                  <p className="text-xs text-slate-500 font-medium">Configure global promo banner text and discount callouts.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.seasonalOffers?.enabled ?? true}
                    onChange={() => handleToggleSection('seasonalOffers')}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Section Enabled</span>
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Promo Banner Title</label>
                  <input
                    type="text"
                    value={formData.seasonalOffers?.bannerTitle || ''}
                    onChange={(e) => handleInputChange('seasonalOffers', 'bannerTitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Discount Tag / Badge</label>
                  <input
                    type="text"
                    value={formData.seasonalOffers?.discountTag || ''}
                    onChange={(e) => handleInputChange('seasonalOffers', 'discountTag', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Banner Description Text</label>
                  <textarea
                    rows={2}
                    value={formData.seasonalOffers?.bannerText || ''}
                    onChange={(e) => handleInputChange('seasonalOffers', 'bannerText', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FEATURED SERVICES */}
          {activeTab === 'services' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Featured Services Showcase</h3>
                  <p className="text-xs text-slate-500 font-medium">Headings for popular service catalog section on homepage.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.featuredServices?.enabled ?? true}
                    onChange={() => handleToggleSection('featuredServices')}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Section Enabled</span>
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Section Heading</label>
                  <input
                    type="text"
                    value={formData.featuredServices?.heading || ''}
                    onChange={(e) => handleInputChange('featuredServices', 'heading', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Section Subheading</label>
                  <input
                    type="text"
                    value={formData.featuredServices?.subheading || ''}
                    onChange={(e) => handleInputChange('featuredServices', 'subheading', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Number of Popular Services to Display</label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={formData.featuredServices?.limitCount || 6}
                    onChange={(e) => handleInputChange('featuredServices', 'limitCount', parseInt(e.target.value) || 6)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ABOUT SECTION */}
          {activeTab === 'about' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">About Agency Section</h3>
                  <p className="text-xs text-slate-500 font-medium">Company background story, bullet highlights, and agency image.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.aboutSection?.enabled ?? true}
                    onChange={() => handleToggleSection('aboutSection')}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Section Enabled</span>
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">About Section Title</label>
                  <input
                    type="text"
                    value={formData.aboutSection?.title || ''}
                    onChange={(e) => handleInputChange('aboutSection', 'title', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Agency Bio / Story</label>
                  <textarea
                    rows={4}
                    value={formData.aboutSection?.description || ''}
                    onChange={(e) => handleInputChange('aboutSection', 'description', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                {/* Highlights list */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">Key Highlights / Feature Bullets</label>
                  {(formData.aboutSection?.highlights || []).map((h: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => {
                          const updated = [...(formData.aboutSection?.highlights || [])];
                          updated[idx] = e.target.value;
                          handleInputChange('aboutSection', 'highlights', updated);
                        }}
                        className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                      <button
                        onClick={() => {
                          const updated = [...(formData.aboutSection?.highlights || [])];
                          updated.splice(idx, 1);
                          handleInputChange('aboutSection', 'highlights', updated);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500"
                      >
                        <Icons.X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const updated = [...(formData.aboutSection?.highlights || []), 'New Agency Feature Highlight'];
                      handleInputChange('aboutSection', 'highlights', updated);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Icons.Plus className="w-3.5 h-3.5" />
                    Add Highlight Bullet
                  </button>
                </div>

                {/* About Image Upload */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">About Section Image</label>
                  <div className="flex items-center gap-4">
                    {formData.aboutSection?.imageUrl && (
                      <img
                        src={formData.aboutSection.imageUrl}
                        alt="About preview"
                        className="w-20 h-20 object-cover rounded-2xl border border-slate-200 shadow-sm"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Image URL or upload below"
                        value={formData.aboutSection?.imageUrl || ''}
                        onChange={(e) => handleInputChange('aboutSection', 'imageUrl', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all">
                        <Icons.Upload className="w-3.5 h-3.5 text-indigo-600" />
                        Upload New Image File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, (url) => handleInputChange('aboutSection', 'imageUrl', url))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TESTIMONIALS */}
          {activeTab === 'testimonials' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Client Testimonials & Feedback Cards</h3>
                  <p className="text-xs text-slate-500 font-medium">Manage social proof, reviews, ratings, and client avatars.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.testimonials?.enabled ?? true}
                    onChange={() => handleToggleSection('testimonials')}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Section Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Testimonial Section Heading</label>
                  <input
                    type="text"
                    value={formData.testimonials?.heading || ''}
                    onChange={(e) => handleInputChange('testimonials', 'heading', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Section Subheading</label>
                  <input
                    type="text"
                    value={formData.testimonials?.subheading || ''}
                    onChange={(e) => handleInputChange('testimonials', 'subheading', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Testimonials List */}
              <div className="space-y-4 pt-2">
                {(formData.testimonials?.items || []).map((t: any, idx: number) => (
                  <div key={t.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-indigo-600">Review #{idx + 1}</span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: t.rating || 5 }).map((_, i) => (
                            <Icons.Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const updated = [...(formData.testimonials?.items || [])];
                          updated.splice(idx, 1);
                          handleInputChange('testimonials', 'items', updated);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Delete Testimonial"
                      >
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Client Name (e.g. Aarav Sharma)"
                        value={t.clientName}
                        onChange={(e) => {
                          const updated = [...(formData.testimonials?.items || [])];
                          updated[idx].clientName = e.target.value;
                          handleInputChange('testimonials', 'items', updated);
                        }}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Business / Brand Name"
                        value={t.businessName}
                        onChange={(e) => {
                          const updated = [...(formData.testimonials?.items || [])];
                          updated[idx].businessName = e.target.value;
                          handleInputChange('testimonials', 'items', updated);
                        }}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Testimonial text..."
                      value={t.testimonialText}
                      onChange={(e) => {
                        const updated = [...(formData.testimonials?.items || [])];
                        updated[idx].testimonialText = e.target.value;
                        handleInputChange('testimonials', 'items', updated);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Avatar Image URL"
                          value={t.avatarUrl || ''}
                          onChange={(e) => {
                            const updated = [...(formData.testimonials?.items || [])];
                            updated[idx].avatarUrl = e.target.value;
                            handleInputChange('testimonials', 'items', updated);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                        <label className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer">
                          <Icons.Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, (url) => {
                              const updated = [...(formData.testimonials?.items || [])];
                              updated[idx].avatarUrl = url;
                              handleInputChange('testimonials', 'items', updated);
                            })}
                          />
                        </label>
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={t.verified ?? true}
                          onChange={(e) => {
                            const updated = [...(formData.testimonials?.items || [])];
                            updated[idx].verified = e.target.checked;
                            handleInputChange('testimonials', 'items', updated);
                          }}
                          className="w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                        <span className="text-[11px] font-bold text-slate-600">Verified Client Badge</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const items = formData.testimonials?.items || [];
                  const newT = {
                    id: 't-' + Date.now(),
                    clientName: 'New Client Partner',
                    businessName: 'Brand Enterprise',
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                    rating: 5,
                    testimonialText: 'Write client review feedback here...',
                    verified: true
                  };
                  handleInputChange('testimonials', 'items', [...items, newT]);
                }}
                className="w-full py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icons.PlusCircle className="w-4 h-4" />
                Add New Client Testimonial
              </button>
            </div>
          )}

          {/* TAB 7: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Frequently Asked Questions (FAQ)</h3>
                  <p className="text-xs text-slate-500 font-medium">Add, edit, or remove questions displayed in the public FAQ accordion.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.faq?.enabled ?? true}
                    onChange={() => handleToggleSection('faq')}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Section Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">FAQ Section Heading</label>
                  <input
                    type="text"
                    value={formData.faq?.heading || ''}
                    onChange={(e) => handleInputChange('faq', 'heading', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">FAQ Subheading</label>
                  <input
                    type="text"
                    value={formData.faq?.subheading || ''}
                    onChange={(e) => handleInputChange('faq', 'subheading', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* FAQ Accordion Items */}
              <div className="space-y-3 pt-2">
                {(formData.faq?.items || []).map((faq: any, idx: number) => (
                  <div key={faq.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-indigo-600">Question #{idx + 1}</span>
                      <button
                        onClick={() => {
                          const updated = [...(formData.faq?.items || [])];
                          updated.splice(idx, 1);
                          handleInputChange('faq', 'items', updated);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Delete FAQ"
                      >
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Question text"
                      value={faq.question}
                      onChange={(e) => {
                        const updated = [...(formData.faq?.items || [])];
                        updated[idx].question = e.target.value;
                        handleInputChange('faq', 'items', updated);
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    />

                    <textarea
                      rows={2}
                      placeholder="Answer text"
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...(formData.faq?.items || [])];
                        updated[idx].answer = e.target.value;
                        handleInputChange('faq', 'items', updated);
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const items = formData.faq?.items || [];
                  const newFaq = {
                    id: 'faq-' + Date.now(),
                    question: 'New Frequently Asked Question',
                    answer: 'Detailed answer explanation provided here for website visitors.'
                  };
                  handleInputChange('faq', 'items', [...items, newFaq]);
                }}
                className="w-full py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icons.PlusCircle className="w-4 h-4" />
                Add New Question & Answer
              </button>
            </div>
          )}

          {/* TAB 8: FOOTER */}
          {activeTab === 'footer' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Footer Information & Contact Links</h3>
                  <p className="text-xs text-slate-500 font-medium">Agency contact details, social media handles, and copyright footer notice.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.footerInfo?.enabled ?? true}
                    onChange={() => handleToggleSection('footerInfo')}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Section Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Contact Phone Number</label>
                  <input
                    type="text"
                    value={formData.footerInfo?.phone || ''}
                    onChange={(e) => handleInputChange('footerInfo', 'phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Support Email Address</label>
                  <input
                    type="text"
                    value={formData.footerInfo?.email || ''}
                    onChange={(e) => handleInputChange('footerInfo', 'email', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Instagram Handle</label>
                  <input
                    type="text"
                    value={formData.footerInfo?.instagram || ''}
                    onChange={(e) => handleInputChange('footerInfo', 'instagram', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">WhatsApp Link</label>
                  <input
                    type="text"
                    value={formData.footerInfo?.whatsappUrl || ''}
                    onChange={(e) => handleInputChange('footerInfo', 'whatsappUrl', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Footer Agency Brief Description</label>
                <textarea
                  rows={3}
                  value={formData.footerInfo?.quickDescription || ''}
                  onChange={(e) => handleInputChange('footerInfo', 'quickDescription', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Copyright Notice Text</label>
                <input
                  type="text"
                  value={formData.footerInfo?.copyrightNotice || ''}
                  onChange={(e) => handleInputChange('footerInfo', 'copyrightNotice', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {/* TAB 9: REORDER SECTIONS & MASTER VISIBILITY */}
          {activeTab === 'reorder' && (
            <div className="space-y-5 animate-fade-in">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900">Reorder Sections & Layout Sequence</h3>
                <p className="text-xs text-slate-500 font-medium">Use the move controls to rearrange the visual vertical order of homepage sections.</p>
              </div>

              <div className="space-y-3">
                {(formData.sectionOrder || ['hero', 'stats', 'seasonalOffers', 'featuredServices', 'aboutSection', 'testimonials', 'faq', 'footerInfo']).map((secKey: string, idx: number) => {
                  const secObj = formData[secKey] || {};
                  const isEnabled = secObj.enabled ?? true;

                  return (
                    <div
                      key={secKey}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-indigo-100 text-indigo-700 font-black rounded-xl text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">{sectionNameMap[secKey] || secKey}</h4>
                          <span className={`text-[10px] font-bold ${isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isEnabled ? 'Enabled & Visible' : 'Disabled / Hidden'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle switch */}
                        <button
                          onClick={() => handleToggleSection(secKey)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                            isEnabled ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </button>

                        {/* Move Up/Down */}
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                          <button
                            onClick={() => moveSection(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                            title="Move Up"
                          >
                            <Icons.ArrowUp className="w-3.5 h-3.5 text-slate-700" />
                          </button>
                          <button
                            onClick={() => moveSection(idx, 'down')}
                            disabled={idx === (formData.sectionOrder?.length || 8) - 1}
                            className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                            title="Move Down"
                          >
                            <Icons.ArrowDown className="w-3.5 h-3.5 text-slate-700" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* LIVE PREVIEW MODAL */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <Icons.Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Live Website Content Draft Preview</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Draft changes displayed in simulated responsive browser environment</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icons.Monitor className="w-3.5 h-3.5" />
                      Desktop
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icons.Smartphone className="w-3.5 h-3.5" />
                      Mobile
                    </button>
                  </div>

                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preview Body iFrame */}
              <div className="flex-1 bg-slate-100 p-4 overflow-y-auto flex justify-center items-center">
                <iframe
                  src="/?preview_mode=draft"
                  title="Homepage Live Preview"
                  className={`bg-white shadow-2xl rounded-2xl border border-slate-300 transition-all ${
                    previewDevice === 'desktop' ? 'w-full h-full' : 'w-[375px] h-[720px]'
                  }`}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REVISION HISTORY MODAL */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Icons.History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Content Change History</h3>
                    <p className="text-xs text-slate-500 font-medium">Audit logs of all published website revisions</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                {(contentState?.history || []).map((rev: any, idx: number) => (
                  <div
                    key={rev.id || idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-600 block">
                        {new Date(rev.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800">{rev.note || 'Published update'}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">By {rev.updatedBy}</p>
                    </div>

                    {rev.snapshot && idx > 0 && (
                      <button
                        onClick={() => handleRestoreRevision(rev.id)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                      >
                        Restore Version
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PUBLISH CONFIRMATION MODAL */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Icons.Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Publish Changes to Live Site?</h3>
                  <p className="text-xs text-slate-500 font-medium">Your edited content will immediately appear on the public website.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Change Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Updated holiday promotional pricing and hero title"
                  value={publishNote}
                  onChange={(e) => setPublishNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublishLive}
                  disabled={publishing}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {publishing ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Send className="w-4 h-4" />}
                  Confirm & Publish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
