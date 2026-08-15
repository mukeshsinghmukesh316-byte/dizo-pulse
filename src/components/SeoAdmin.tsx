import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SeoConfig, SeoPageConfig, SeoServiceConfig, Service } from '../types';
import { DEFAULT_SEO_CONFIG, applySeoMetadata, calculateSeoScore } from '../utils/seo';
import { showToast } from './UIPolish';

export interface SeoAdminProps {
  userRole: string;
  userName: string;
  userEmail: string;
  services?: Service[];
  onSeoUpdated?: (updated: SeoConfig) => void;
}

export function SeoAdmin({ userRole, userName, userEmail, services = [], onSeoUpdated }: SeoAdminProps) {
  const isAdminOrSuperAdmin = userRole === 'super_admin' || userRole === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seoData, setSeoData] = useState<SeoConfig>(DEFAULT_SEO_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);

  // Active module sub-tab
  const [activeTab, setActiveTab] = useState<'global' | 'social' | 'pages' | 'services' | 'sitemap'>('global');

  // Page-wise active selection
  const [selectedPageKey, setSelectedPageKey] = useState<string>('home');

  // Services SEO active selection
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || 'insta-post');
  const [serviceSearch, setServiceSearch] = useState('');

  // Live preview settings
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewPlatform, setPreviewPlatform] = useState<'google' | 'facebook' | 'twitter'>('google');
  const [previewTarget, setPreviewTarget] = useState<'global' | 'page' | 'service'>('global');

  // Custom Sitemap URL form
  const [newCustomUrl, setNewCustomUrl] = useState({ loc: '', changefreq: 'monthly', priority: 0.5 });
  const [showXmlModal, setShowXmlModal] = useState(false);

  // Fetch SEO data on mount
  const fetchSeoData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seo');
      if (res.ok) {
        const data = await res.json();
        setSeoData(data);
        // Apply immediately to current head
        applySeoMetadata(data);
      } else {
        showToast('Using default SEO profile', 'info');
      }
    } catch (err) {
      console.error('Error loading SEO settings:', err);
      showToast('Error connecting to server for SEO settings', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoData();
  }, []);

  // Save SEO data
  const handleSaveSeo = async () => {
    if (!isAdminOrSuperAdmin) {
      showToast('Permission denied: Only Admins can update SEO settings', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...seoData,
        updatedBy: `${userName} (${userRole})`,
      };

      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setSeoData(result.seo || payload);
        setHasChanges(false);
        // Apply live metadata immediately to the browser
        applySeoMetadata(result.seo || payload);
        if (onSeoUpdated) onSeoUpdated(result.seo || payload);
        showToast('SEO & Social Sharing settings published live!', 'success');
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to save SEO settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving SEO settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all SEO metadata to default recommendations?')) {
      setSeoData(JSON.parse(JSON.stringify(DEFAULT_SEO_CONFIG)));
      setHasChanges(true);
      showToast('Reset to default SEO recommendations. Click Save to publish.', 'info');
    }
  };

  // Image uploader handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'favicon' | 'ogImage' | 'twitterImage' | 'pageOgImage' | 'serviceOgImage') => {
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
          if (targetField === 'favicon') {
            setSeoData(prev => ({ ...prev, global: { ...prev.global, faviconUrl: data.url } }));
          } else if (targetField === 'ogImage') {
            setSeoData(prev => ({ ...prev, global: { ...prev.global, ogImageUrl: data.url } }));
          } else if (targetField === 'twitterImage') {
            setSeoData(prev => ({ ...prev, global: { ...prev.global, twitterImageUrl: data.url } }));
          } else if (targetField === 'pageOgImage') {
            setSeoData(prev => ({
              ...prev,
              pages: {
                ...prev.pages,
                [selectedPageKey]: { ...prev.pages[selectedPageKey], ogImage: data.url },
              },
            }));
          } else if (targetField === 'serviceOgImage') {
            setSeoData(prev => ({
              ...prev,
              servicesSeo: {
                ...prev.servicesSeo,
                [selectedServiceId]: { ...prev.servicesSeo[selectedServiceId], customOgImage: data.url },
              },
            }));
          }
          setHasChanges(true);
          showToast('Image uploaded successfully!', 'success');
        }
      } catch (err) {
        showToast('Image upload failed', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper updates
  const updateGlobalField = (field: keyof typeof seoData.global, value: any) => {
    setSeoData(prev => ({
      ...prev,
      global: { ...prev.global, [field]: value },
    }));
    setHasChanges(true);
  };

  const updatePageField = (pageKey: string, field: keyof SeoPageConfig, value: any) => {
    setSeoData(prev => {
      const existingPage = prev.pages[pageKey] || {
        id: pageKey,
        pageName: pageKey,
        path: `/${pageKey}`,
        title: '',
        description: '',
        keywords: '',
        robotsIndex: true,
        robotsFollow: true,
        changefreq: 'weekly',
        priority: 0.8,
      };
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [pageKey]: { ...existingPage, [field]: value },
        },
      };
    });
    setHasChanges(true);
  };

  const updateServiceField = (serviceId: string, field: keyof SeoServiceConfig, value: any) => {
    setSeoData(prev => {
      const existing = prev.servicesSeo[serviceId] || { serviceId };
      return {
        ...prev,
        servicesSeo: {
          ...prev.servicesSeo,
          [serviceId]: { ...existing, [field]: value },
        },
      };
    });
    setHasChanges(true);
  };

  // Auto-generate service SEO metadata
  const handleAutoGenerateServiceSeo = (srv: Service) => {
    const title = `${srv.name} | Dizo Pulse Digital Agency`;
    const desc = `${srv.description} Professional digital solution with fast turnaround and transparent pricing starting at ₹${srv.launchPrice.toLocaleString('en-IN')}.`;
    const keywords = `${srv.name.toLowerCase()}, ${srv.category}, digital services india, dizo pulse, ${srv.unit}`;

    setSeoData(prev => ({
      ...prev,
      servicesSeo: {
        ...prev.servicesSeo,
        [srv.id]: {
          serviceId: srv.id,
          customTitle: title,
          customDescription: desc,
          customKeywords: keywords,
          customOgTitle: title,
          customOgDescription: desc,
          customOgImage: srv.imageUrl || prev.global.ogImageUrl,
          customCanonical: `${prev.global.canonicalBaseUrl || 'https://dizopulse.com'}/#service-${srv.id}`,
          robotsIndex: true,
          robotsFollow: true,
          changefreq: 'weekly',
          priority: 0.8,
        },
      },
    }));
    setHasChanges(true);
    showToast(`SEO metadata generated for "${srv.name}"`, 'success');
  };

  // Add custom URL to sitemap
  const handleAddCustomSitemapUrl = () => {
    if (!newCustomUrl.loc.trim()) {
      showToast('Please provide a URL or path', 'warning');
      return;
    }

    setSeoData(prev => ({
      ...prev,
      sitemapConfig: {
        ...prev.sitemapConfig,
        customUrls: [
          ...(prev.sitemapConfig?.customUrls || []),
          {
            loc: newCustomUrl.loc.trim(),
            changefreq: newCustomUrl.changefreq,
            priority: Number(newCustomUrl.priority) || 0.5,
            lastmod: new Date().toISOString().split('T')[0],
          },
        ],
      },
    }));
    setNewCustomUrl({ loc: '', changefreq: 'monthly', priority: 0.5 });
    setHasChanges(true);
    showToast('Custom URL added to sitemap', 'success');
  };

  const handleRemoveCustomUrl = (index: number) => {
    setSeoData(prev => {
      const updated = [...(prev.sitemapConfig?.customUrls || [])];
      updated.splice(index, 1);
      return {
        ...prev,
        sitemapConfig: { ...prev.sitemapConfig, customUrls: updated },
      };
    });
    setHasChanges(true);
  };

  // SEO Score calculation
  const seoHealth = useMemo(() => calculateSeoScore(seoData), [seoData]);

  // Current active page configuration
  const activePage = seoData.pages?.[selectedPageKey] || DEFAULT_SEO_CONFIG.pages.home;

  // Current active service configuration
  const activeServiceObj = services.find(s => s.id === selectedServiceId) || services[0];
  const activeServiceSeo = seoData.servicesSeo?.[selectedServiceId] || {};

  // Compute live preview values based on previewTarget ('global' | 'page' | 'service')
  const previewValues = useMemo(() => {
    const baseUrl = (seoData.global.canonicalBaseUrl || 'https://dizopulse.com').replace(/\/$/, '');

    if (previewTarget === 'page') {
      const p = activePage;
      const title = p.title || seoData.global.siteTitle;
      const desc = p.description || seoData.global.metaDescription;
      const url = p.canonical || `${baseUrl}${p.path}`;
      const ogTitle = p.ogTitle || title;
      const ogDesc = p.ogDescription || desc;
      const ogImage = p.ogImage || seoData.global.ogImageUrl;
      return { title, desc, url, ogTitle, ogDesc, ogImage, sourceLabel: `Page: ${p.pageName}` };
    }

    if (previewTarget === 'service' && activeServiceObj) {
      const srv = activeServiceObj;
      const srvSeo = activeServiceSeo;
      const title = srvSeo.customTitle || `${srv.name} | Dizo Pulse Services`;
      const desc = srvSeo.customDescription || srv.description || seoData.global.metaDescription;
      const url = srvSeo.customCanonical || `${baseUrl}/#service-${srv.id}`;
      const ogTitle = srvSeo.customOgTitle || title;
      const ogDesc = srvSeo.customOgDescription || desc;
      const ogImage = srvSeo.customOgImage || srv.imageUrl || seoData.global.ogImageUrl;
      return { title, desc, url, ogTitle, ogDesc, ogImage, sourceLabel: `Service: ${srv.name}` };
    }

    // Default global
    return {
      title: seoData.global.siteTitle,
      desc: seoData.global.metaDescription,
      url: seoData.global.canonicalBaseUrl || 'https://dizopulse.com',
      ogTitle: seoData.global.ogTitle || seoData.global.siteTitle,
      ogDesc: seoData.global.ogDescription || seoData.global.metaDescription,
      ogImage: seoData.global.ogImageUrl,
      sourceLabel: 'Global Default Profile',
    };
  }, [seoData, previewTarget, activePage, activeServiceObj, activeServiceSeo]);

  // Generate XML Sitemap string for live preview modal
  const generateSitemapXml = () => {
    const baseUrl = (seoData.global.canonicalBaseUrl || 'https://dizopulse.com').replace(/\/$/, '');
    const currentDate = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    if (seoData.sitemapConfig?.includePages !== false && seoData.pages) {
      Object.values(seoData.pages).forEach((page: any) => {
        if (page.robotsIndex !== false) {
          const loc = page.canonical || `${baseUrl}${page.path.startsWith('/') ? page.path : '/' + page.path}`;
          xml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>${page.changefreq || 'weekly'}</changefreq>\n    <priority>${(page.priority || 0.8).toFixed(1)}</priority>\n  </url>\n`;
        }
      });
    }

    if (seoData.sitemapConfig?.includeServices !== false && Array.isArray(services)) {
      services.forEach((srv: any) => {
        const srvSeo = seoData.servicesSeo?.[srv.id];
        if (srvSeo?.robotsIndex !== false) {
          const loc = srvSeo?.customCanonical || `${baseUrl}/#service-${srv.id}`;
          xml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>${srvSeo?.changefreq || 'weekly'}</changefreq>\n    <priority>${(srvSeo?.priority || 0.8).toFixed(1)}</priority>\n  </url>\n`;
        }
      });
    }

    if (Array.isArray(seoData.sitemapConfig?.customUrls)) {
      seoData.sitemapConfig.customUrls.forEach((custom: any) => {
        if (custom.loc) {
          const loc = custom.loc.startsWith('http') ? custom.loc : baseUrl + (custom.loc.startsWith('/') ? '' : '/') + custom.loc;
          xml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${custom.lastmod || currentDate}</lastmod>\n    <changefreq>${custom.changefreq || 'monthly'}</changefreq>\n    <priority>${(custom.priority || 0.5).toFixed(1)}</priority>\n  </url>\n`;
        }
      });
    }

    xml += `</urlset>`;
    return xml;
  };

  // Filtered services for services tab
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services;
    const q = serviceSearch.toLowerCase();
    return services.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [services, serviceSearch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Icons.Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading SEO & Social Sharing console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="seo-admin-root">
      {/* TOP HEADER & HEALTH BAR */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        {/* Background decorative tint */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-50/60 via-cyan-50/40 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Icons.SearchCheck className="w-5 h-5" />
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                SEO & Social Sharing Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Dynamic Engine
              </span>
            </div>
            <p className="text-slate-600 text-sm max-w-2xl">
              Control search engine rankings, Google SERP snippets, Open Graph Facebook/LinkedIn cards, Twitter/X cards, canonical URLs, robots indexing, and automatic XML sitemaps.
            </p>
          </div>

          {/* Action Buttons & Health Score Widget */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Health Score Pill */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-indigo-700 bg-indigo-100">
                  {seoHealth.score}%
                </div>
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800">SEO Health Score</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {seoHealth.score >= 80 ? '🟢 High Optimization' : seoHealth.score >= 60 ? '🟡 Good (Actionable)' : '🔴 Needs Attention'}
                </div>
              </div>
            </div>

            {/* View live sitemap / robots quick links */}
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              id="btn-seo-view-sitemap"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-sm transition"
            >
              <Icons.FileCode className="w-4 h-4 text-cyan-600" />
              <span>/sitemap.xml</span>
              <Icons.ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              id="btn-seo-view-robots"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-sm transition"
            >
              <Icons.Bot className="w-4 h-4 text-purple-600" />
              <span>/robots.txt</span>
              <Icons.ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Save Button */}
            <button
              onClick={handleSaveSeo}
              disabled={saving || !isAdminOrSuperAdmin}
              id="btn-save-seo-settings"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
                hasChanges
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 ring-2 ring-indigo-400 ring-offset-2 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
              }`}
            >
              {saving ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Live...</span>
                </>
              ) : (
                <>
                  <Icons.Sparkles className="w-4 h-4" />
                  <span>{hasChanges ? 'Save & Apply Live' : 'Saved Live'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SEO Quick Health Checks Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {seoHealth.checks.map((c, i) => (
            <div
              key={i}
              className={`p-2 rounded-xl border text-center transition-all ${
                c.pass
                  ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
                  : 'bg-amber-50/70 border-amber-100 text-amber-800'
              }`}
              title={c.feedback}
            >
              <div className="flex items-center justify-center gap-1 mb-0.5">
                {c.pass ? (
                  <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Icons.AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span className="text-[11px] font-bold truncate">{c.name}</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{c.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'global', label: 'Global SEO & Meta', icon: 'Globe' },
          { id: 'social', label: 'Social & Cards (OG / X)', icon: 'Share2' },
          { id: 'pages', label: 'Page-wise SEO', icon: 'FileText' },
          { id: 'services', label: 'Services Catalog SEO', icon: 'Layers' },
          { id: 'sitemap', label: 'Sitemap & Robots.txt', icon: 'Map' },
        ].map(tab => {
          const IconComponent = (Icons as any)[tab.icon] || Icons.FileText;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-seo-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            id="btn-seo-reset-defaults"
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 font-medium transition"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* MAIN CONTENT GRID: 2 COLUMNS (EDITOR + LIVE PREVIEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: EDITORS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TAB 1: GLOBAL SEO */}
          {activeTab === 'global' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Icons.Globe className="w-5 h-5 text-indigo-600" />
                  <span>Global SEO & Identity Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Default fallback metadata applied to all pages across the website unless overridden.
                </p>
              </div>

              {/* Site Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Global Website Title</label>
                  <span
                    className={`text-[11px] font-mono font-medium ${
                      seoData.global.siteTitle.length > 60 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {seoData.global.siteTitle.length}/60 chars (Recommended: 50-60)
                  </span>
                </div>
                <input
                  type="text"
                  id="input-global-site-title"
                  value={seoData.global.siteTitle}
                  onChange={e => updateGlobalField('siteTitle', e.target.value)}
                  placeholder="e.g. Dizo Pulse | Creative Media & Digital Growth Agency"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Title Template */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Title Template Pattern</label>
                  <span className="text-[11px] text-slate-400">Use %s for dynamic page name</span>
                </div>
                <input
                  type="text"
                  id="input-global-title-template"
                  value={seoData.global.titleTemplate}
                  onChange={e => updateGlobalField('titleTemplate', e.target.value)}
                  placeholder="%s | Dizo Pulse"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
                />
              </div>

              {/* Meta Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Global Meta Description</label>
                  <span
                    className={`text-[11px] font-mono font-medium ${
                      seoData.global.metaDescription.length > 160 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {seoData.global.metaDescription.length}/160 chars (Recommended: 120-160)
                  </span>
                </div>
                <textarea
                  id="textarea-global-meta-description"
                  rows={3}
                  value={seoData.global.metaDescription}
                  onChange={e => updateGlobalField('metaDescription', e.target.value)}
                  placeholder="Summary of services, value proposition, and key offerings for Google search index."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Meta Keywords (Comma separated)</label>
                <input
                  type="text"
                  id="input-global-keywords"
                  value={seoData.global.keywords}
                  onChange={e => updateGlobalField('keywords', e.target.value)}
                  placeholder="digital marketing, branding agency, reel editing, web development, SEO India"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {seoData.global.keywords
                    .split(',')
                    .filter(k => k.trim())
                    .map((k, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium">
                        #{k.trim()}
                      </span>
                    ))}
                </div>
              </div>

              {/* Canonical Base URL & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Canonical Base URL</label>
                  <input
                    type="url"
                    id="input-global-canonical-url"
                    value={seoData.global.canonicalBaseUrl}
                    onChange={e => updateGlobalField('canonicalBaseUrl', e.target.value)}
                    placeholder="https://dizopulse.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Author / Organization Name</label>
                  <input
                    type="text"
                    id="input-global-author"
                    value={seoData.global.author}
                    onChange={e => updateGlobalField('author', e.target.value)}
                    placeholder="Dizo Pulse Creative Media"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Favicon URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Website Favicon (.ico / .png)</label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {seoData.global.faviconUrl ? (
                      <img src={seoData.global.faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
                    ) : (
                      <Icons.Image className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="url"
                    id="input-global-favicon-url"
                    value={seoData.global.faviconUrl}
                    onChange={e => updateGlobalField('faviconUrl', e.target.value)}
                    placeholder="https://... or upload file"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1.5 flex-shrink-0">
                    <Icons.Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleImageUpload(e, 'favicon')}
                    />
                  </label>
                </div>
              </div>

              {/* Global Robots Indexing Directive */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Global Robots Directive (robots.txt & Meta)</h4>
                    <p className="text-[11px] text-slate-500">Allow search engine crawlers (Google, Bing) to discover and index site.</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      seoData.global.robotsIndex && seoData.global.robotsFollow
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {seoData.global.robotsIndex ? 'INDEX' : 'NOINDEX'} / {seoData.global.robotsFollow ? 'FOLLOW' : 'NOFOLLOW'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      id="checkbox-global-robots-index"
                      checked={seoData.global.robotsIndex}
                      onChange={e => updateGlobalField('robotsIndex', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-700">Allow Indexing (Index)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      id="checkbox-global-robots-follow"
                      checked={seoData.global.robotsFollow}
                      onChange={e => updateGlobalField('robotsFollow', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-700">Follow Links (Follow)</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SOCIAL SHARING & OPEN GRAPH / TWITTER */}
          {activeTab === 'social' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Icons.Share2 className="w-5 h-5 text-indigo-600" />
                  <span>Open Graph & Twitter / X Social Cards</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure rich social sharing embeds for WhatsApp, Facebook, LinkedIn, Twitter/X, and Slack.
                </p>
              </div>

              {/* Open Graph Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Icons.Facebook className="w-4 h-4 text-blue-600" />
                  <span>Open Graph Protocol (Facebook, LinkedIn, WhatsApp)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">OG Card Title (og:title)</label>
                  <input
                    type="text"
                    id="input-og-title"
                    value={seoData.global.ogTitle}
                    onChange={e => updateGlobalField('ogTitle', e.target.value)}
                    placeholder="e.g. Dizo Pulse | Scaling Digital Growth & Creative Craft"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">OG Card Description (og:description)</label>
                  <textarea
                    id="textarea-og-description"
                    rows={2}
                    value={seoData.global.ogDescription}
                    onChange={e => updateGlobalField('ogDescription', e.target.value)}
                    placeholder="Transform your brand with high-converting web apps, viral reels, vector identities, and ROI-driven marketing campaigns."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y"
                  />
                </div>

                {/* OG Image */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">OG Social Banner Image (1200x630)</label>
                    <span className="text-[11px] text-slate-400">Aspect Ratio 1.91:1</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {seoData.global.ogImageUrl ? (
                        <img src={seoData.global.ogImageUrl} alt="OG Card" className="w-full h-full object-cover" />
                      ) : (
                        <Icons.Image className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <input
                      type="url"
                      id="input-og-image-url"
                      value={seoData.global.ogImageUrl}
                      onChange={e => updateGlobalField('ogImageUrl', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-xs"
                    />
                    <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1.5 flex-shrink-0">
                      <Icons.Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageUpload(e, 'ogImage')}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Site Name (og:site_name)</label>
                    <input
                      type="text"
                      id="input-og-site-name"
                      value={seoData.global.ogSiteName}
                      onChange={e => updateGlobalField('ogSiteName', e.target.value)}
                      placeholder="Dizo Pulse Agency"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">OG Type (og:type)</label>
                    <select
                      id="select-og-type"
                      value={seoData.global.ogType}
                      onChange={e => updateGlobalField('ogType', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="website">website</option>
                      <option value="article">article</option>
                      <option value="business.business">business.business</option>
                      <option value="profile">profile</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Twitter / X Card Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Icons.Twitter className="w-4 h-4 text-sky-500" />
                  <span>Twitter / X Card Protocol</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Twitter Card Format</label>
                    <select
                      id="select-twitter-card-type"
                      value={seoData.global.twitterCardType}
                      onChange={e => updateGlobalField('twitterCardType', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="summary_large_image">summary_large_image (Large Hero Card)</option>
                      <option value="summary">summary (Small Square Image)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Twitter Handle (@handle)</label>
                    <input
                      type="text"
                      id="input-twitter-handle"
                      value={seoData.global.twitterHandle}
                      onChange={e => updateGlobalField('twitterHandle', e.target.value)}
                      placeholder="@dizo_pulse"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Twitter Card Title</label>
                  <input
                    type="text"
                    id="input-twitter-title"
                    value={seoData.global.twitterTitle}
                    onChange={e => updateGlobalField('twitterTitle', e.target.value)}
                    placeholder="e.g. Dizo Pulse | Creative Media & Digital Growth Agency"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Twitter Card Description</label>
                  <textarea
                    id="textarea-twitter-description"
                    rows={2}
                    value={seoData.global.twitterDescription}
                    onChange={e => updateGlobalField('twitterDescription', e.target.value)}
                    placeholder="From design to digital growth — everything your brand needs under one roof."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: PAGE-WISE SEO */}
          {activeTab === 'pages' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6"
            >
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Icons.FileText className="w-5 h-5 text-indigo-600" />
                    <span>Page-wise SEO Customization</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure custom titles, descriptions, and indexing directives for specific website pages.
                  </p>
                </div>
                <button
                  onClick={() => setPreviewTarget('page')}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                >
                  Preview this Page 👁️
                </button>
              </div>

              {/* Page Selector Pills */}
              <div className="flex flex-wrap gap-2">
                {Object.values(seoData.pages || {}).map((p: any) => {
                  const isSelected = selectedPageKey === p.id;
                  return (
                    <button
                      key={p.id}
                      id={`btn-select-page-${p.id}`}
                      onClick={() => {
                        setSelectedPageKey(p.id);
                        setPreviewTarget('page');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                      }`}
                    >
                      <span>{p.pageName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {p.path}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Page Editor */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span className="font-bold text-sm text-slate-900">{activePage.pageName}</span>
                    <span className="text-xs text-slate-400 font-mono">({activePage.path})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activePage.robotsIndex !== false}
                        onChange={e => updatePageField(selectedPageKey, 'robotsIndex', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded"
                      />
                      <span>Allow Index</span>
                    </label>
                  </div>
                </div>

                {/* Page Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Page Meta Title</label>
                    <span className="text-[11px] text-slate-400">{activePage.title?.length || 0}/60 chars</span>
                  </div>
                  <input
                    type="text"
                    id={`input-page-title-${selectedPageKey}`}
                    value={activePage.title || ''}
                    onChange={e => updatePageField(selectedPageKey, 'title', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                  />
                </div>

                {/* Page Description */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Page Meta Description</label>
                    <span className="text-[11px] text-slate-400">{activePage.description?.length || 0}/160 chars</span>
                  </div>
                  <textarea
                    rows={2}
                    id={`textarea-page-desc-${selectedPageKey}`}
                    value={activePage.description || ''}
                    onChange={e => updatePageField(selectedPageKey, 'description', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white resize-y"
                  />
                </div>

                {/* Page Keywords */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Page Specific Keywords</label>
                  <input
                    type="text"
                    value={activePage.keywords || ''}
                    onChange={e => updatePageField(selectedPageKey, 'keywords', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                  />
                </div>

                {/* Canonical Override & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Canonical URL Override</label>
                    <input
                      type="url"
                      value={activePage.canonical || ''}
                      onChange={e => updatePageField(selectedPageKey, 'canonical', e.target.value)}
                      placeholder="Leave empty for default canonical path"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Sitemap Priority (0.1 - 1.0)</label>
                    <select
                      value={activePage.priority || 0.8}
                      onChange={e => updatePageField(selectedPageKey, 'priority', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value={1.0}>1.0 (Critical Homepage)</option>
                      <option value={0.9}>0.9 (High Services)</option>
                      <option value={0.8}>0.8 (Standard Main)</option>
                      <option value={0.7}>0.7 (Sub-pages)</option>
                      <option value={0.5}>0.5 (Utility)</option>
                      <option value={0.3}>0.3 (Legal / Terms)</option>
                    </select>
                  </div>
                </div>

                {/* Page OG Image Override */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Page Social Share Image (OG Override)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={activePage.ogImage || ''}
                      onChange={e => updatePageField(selectedPageKey, 'ogImage', e.target.value)}
                      placeholder="Leave empty to use global default OG image"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white font-mono"
                    />
                    <label className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition flex items-center gap-1">
                      <Icons.Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageUpload(e, 'pageOgImage')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: SERVICES CATALOG SEO */}
          {activeTab === 'services' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6"
            >
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Icons.Layers className="w-5 h-5 text-indigo-600" />
                  <span>Services Catalog & Individual Service SEO</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Optimize individual service items for long-tail search queries (e.g. "Reel editing agency India", "Shopify landing page design").
                </p>
              </div>

              {/* Service Search Bar */}
              <div className="relative">
                <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  placeholder="Search catalog services (e.g. reel, instagram, website, seo)..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Service Select Scroll Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {filteredServices.map(srv => {
                  const isSelected = selectedServiceId === srv.id;
                  const hasCustomSeo = Boolean(seoData.servicesSeo?.[srv.id]?.customTitle);
                  return (
                    <button
                      key={srv.id}
                      id={`btn-select-service-${srv.id}`}
                      onClick={() => {
                        setSelectedServiceId(srv.id);
                        setPreviewTarget('service');
                      }}
                      className={`p-3 rounded-2xl text-left border transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-xs text-slate-900 truncate">{srv.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{srv.category} • ₹{srv.launchPrice}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {hasCustomSeo && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Custom SEO Defined" />
                        )}
                        <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Service Editor Box */}
              {activeServiceObj && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{activeServiceObj.name}</div>
                      <div className="text-xs text-slate-500">ID: {activeServiceObj.id} • Category: {activeServiceObj.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAutoGenerateServiceSeo(activeServiceObj)}
                        id="btn-seo-auto-generate"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
                      >
                        <Icons.Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Generate SEO</span>
                      </button>
                      <button
                        onClick={() => setPreviewTarget('service')}
                        className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition"
                      >
                        Preview 👁️
                      </button>
                    </div>
                  </div>

                  {/* Service Meta Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Custom Title Tag</label>
                    <input
                      type="text"
                      value={activeServiceSeo.customTitle || ''}
                      onChange={e => updateServiceField(selectedServiceId, 'customTitle', e.target.value)}
                      placeholder={`${activeServiceObj.name} | Dizo Pulse Services`}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    />
                  </div>

                  {/* Service Meta Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Custom Meta Description</label>
                    <textarea
                      rows={2}
                      value={activeServiceSeo.customDescription || ''}
                      onChange={e => updateServiceField(selectedServiceId, 'customDescription', e.target.value)}
                      placeholder={activeServiceObj.description}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white resize-y"
                    />
                  </div>

                  {/* Service Custom Keywords */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Service Target Keywords</label>
                    <input
                      type="text"
                      value={activeServiceSeo.customKeywords || ''}
                      onChange={e => updateServiceField(selectedServiceId, 'customKeywords', e.target.value)}
                      placeholder="e.g. reel editing services, instagram video editor, video editing agency"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    />
                  </div>

                  {/* Service Social Image */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Service Custom OG / Social Card Image</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={activeServiceSeo.customOgImage || ''}
                        onChange={e => updateServiceField(selectedServiceId, 'customOgImage', e.target.value)}
                        placeholder={activeServiceObj.imageUrl || 'Leave empty for default service photo'}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white font-mono"
                      />
                      <label className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition flex items-center gap-1">
                        <Icons.Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleImageUpload(e, 'serviceOgImage')}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: SITEMAP & ROBOTS.TXT */}
          {activeTab === 'sitemap' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6"
            >
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Icons.Map className="w-5 h-5 text-indigo-600" />
                    <span>XML Sitemap & Robots.txt Engine</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Dynamic XML sitemap automatically maintained for Google Search Console and Bing Webmaster Tools.
                  </p>
                </div>
                <button
                  onClick={() => setShowXmlModal(true)}
                  id="btn-seo-view-xml-code"
                  className="px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <Icons.Code className="w-3.5 h-3.5" />
                  <span>Inspect XML Code</span>
                </button>
              </div>

              {/* Sitemap Master Switches */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    id="checkbox-sitemap-include-pages"
                    checked={seoData.sitemapConfig?.includePages !== false}
                    onChange={e =>
                      setSeoData(prev => ({
                        ...prev,
                        sitemapConfig: { ...prev.sitemapConfig, includePages: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Include Core Pages in Sitemap</div>
                    <div className="text-[10px] text-slate-500">Home, Services, Calculator, About, Terms</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    id="checkbox-sitemap-include-services"
                    checked={seoData.sitemapConfig?.includeServices !== false}
                    onChange={e =>
                      setSeoData(prev => ({
                        ...prev,
                        sitemapConfig: { ...prev.sitemapConfig, includeServices: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Include Individual Services in Sitemap</div>
                    <div className="text-[10px] text-slate-500">{services.length} items from catalog index</div>
                  </div>
                </label>
              </div>

              {/* Custom URLs Manager */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Add Custom URLs / Landing Pages to Sitemap
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={newCustomUrl.loc}
                    onChange={e => setNewCustomUrl({ ...newCustomUrl, loc: e.target.value })}
                    placeholder="e.g. /special-offer or https://..."
                    className="sm:col-span-6 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <select
                    value={newCustomUrl.changefreq}
                    onChange={e => setNewCustomUrl({ ...newCustomUrl, changefreq: e.target.value })}
                    className="sm:col-span-3 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                  </select>
                  <button
                    onClick={handleAddCustomSitemapUrl}
                    id="btn-add-custom-sitemap-url"
                    className="sm:col-span-3 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Icons.Plus className="w-3.5 h-3.5" />
                    <span>Add URL</span>
                  </button>
                </div>

                {/* Custom URLs List */}
                {seoData.sitemapConfig?.customUrls && seoData.sitemapConfig.customUrls.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {seoData.sitemapConfig.customUrls.map((cu, idx) => (
                      <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                        <div className="font-mono text-slate-800 truncate pr-2">{cu.loc}</div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{cu.changefreq}</span>
                          <span className="text-slate-400 text-[10px] font-mono">P: {cu.priority}</span>
                          <button
                            onClick={() => handleRemoveCustomUrl(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Icons.Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No custom extra URLs added yet.</p>
                )}
              </div>

              {/* Robots.txt Preview Box */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">Dynamic robots.txt Content</h4>
                  <a href="/robots.txt" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-bold hover:underline">
                    View Live /robots.txt ↗
                  </a>
                </div>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto">
                  <pre>{`User-agent: *\n${seoData.global.robotsIndex ? 'Allow: /\nDisallow: /api/\nDisallow: /#client-portal\nDisallow: /?admin=true' : 'Disallow: /'}\n\nSitemap: ${(seoData.global.canonicalBaseUrl || 'https://dizopulse.com').replace(/\/$/, '')}/sitemap.xml`}</pre>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN: REAL-TIME INTERACTIVE PREVIEW PANEL (5 COLS) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            
            {/* PREVIEW CONTROLS */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Icons.Eye className="w-4 h-4 text-indigo-600" />
                  <span>Real-Time Live Preview</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">{previewValues.sourceLabel}</span>
              </div>

              {/* Target Source Dropdown */}
              <select
                value={previewTarget}
                onChange={e => setPreviewTarget(e.target.value as any)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 bg-slate-50 outline-none"
              >
                <option value="global">Global Fallback</option>
                <option value="page">Active Page ({activePage.pageName})</option>
                {activeServiceObj && <option value="service">Service ({activeServiceObj.name})</option>}
              </select>
            </div>

            {/* Platform Selector Buttons */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                id="btn-preview-google"
                onClick={() => setPreviewPlatform('google')}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  previewPlatform === 'google'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icons.Search className="w-3.5 h-3.5 text-blue-600" />
                <span>Google SERP</span>
              </button>

              <button
                id="btn-preview-facebook"
                onClick={() => setPreviewPlatform('facebook')}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  previewPlatform === 'facebook'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icons.Facebook className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Graph</span>
              </button>

              <button
                id="btn-preview-twitter"
                onClick={() => setPreviewPlatform('twitter')}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  previewPlatform === 'twitter'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icons.Twitter className="w-3.5 h-3.5 text-sky-500" />
                <span>Twitter / X</span>
              </button>
            </div>

            {/* 1. GOOGLE SERP PREVIEW */}
            {previewPlatform === 'google' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Search Engine Result Page (SERP)</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                      title="Desktop View"
                    >
                      <Icons.Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                      title="Mobile View"
                    >
                      <Icons.Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Google Snippet Container */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1.5 font-sans">
                  {/* Favicon & Breadcrumb */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {seoData.global.faviconUrl ? (
                        <img src={seoData.global.faviconUrl} alt="Favicon" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-bold text-indigo-700">D</span>
                      )}
                    </div>
                    <div className="text-[12px] text-slate-700 leading-tight truncate">
                      <span className="font-semibold">{seoData.global.ogSiteName || 'Dizo Pulse'}</span>
                      <span className="text-slate-400 mx-1">›</span>
                      <span className="text-slate-500 text-[11px] font-mono">{previewValues.url.replace(/^https?:\/\//, '')}</span>
                    </div>
                  </div>

                  {/* Clickable Blue Title */}
                  <h4 className="text-[17px] text-[#1a0dab] hover:underline font-medium cursor-pointer leading-snug">
                    {previewValues.title || 'Untitled Page — Dizo Pulse'}
                  </h4>

                  {/* Snippet Description */}
                  <p className="text-[13px] text-[#4d5156] leading-relaxed line-clamp-3">
                    {previewValues.desc || 'No meta description configured for this page.'}
                  </p>

                  {/* Badges / Rating Sitelinks */}
                  <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">★ 4.9 (120+ Reviews)</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">Free Quote Calculator</span>
                  </div>
                </div>

                {/* Character Guidance Meter */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Title Length:</span>
                    <span className={previewValues.title.length <= 60 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {previewValues.title.length}/60 chars ({previewValues.title.length <= 60 ? 'Optimal' : 'Truncated on Google'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Description Length:</span>
                    <span className={previewValues.desc.length <= 160 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {previewValues.desc.length}/160 chars ({previewValues.desc.length <= 160 ? 'Optimal' : 'Truncated on Google'})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. OPEN GRAPH FACEBOOK / LINKEDIN PREVIEW */}
            {previewPlatform === 'facebook' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500">Facebook / LinkedIn / WhatsApp Rich Link Preview</div>

                <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-sm font-sans">
                  {/* Image Container (1200x630 aspect ratio) */}
                  <div className="w-full h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {previewValues.ogImage ? (
                      <img src={previewValues.ogImage} alt="OG Card" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <Icons.Image className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-xs">No OG Image Set (1200x630)</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-3 bg-slate-100 border-t border-slate-200">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-mono truncate">
                      {seoData.global.canonicalBaseUrl?.replace(/^https?:\/\//, '') || 'dizopulse.com'}
                    </div>
                    <div className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                      {previewValues.ogTitle || previewValues.title}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {previewValues.ogDesc || previewValues.desc}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. TWITTER / X CARD PREVIEW */}
            {previewPlatform === 'twitter' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500">Twitter / X Large Image Summary Card</div>

                <div className="rounded-2xl border border-slate-300 overflow-hidden bg-slate-900 text-white shadow-sm font-sans">
                  {/* Image Container */}
                  <div className="w-full h-44 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                    {seoData.global.twitterImageUrl || previewValues.ogImage ? (
                      <img
                        src={seoData.global.twitterImageUrl || previewValues.ogImage}
                        alt="Twitter Card"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-500">
                        <Icons.Twitter className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-xs">No Twitter Card Image</span>
                      </div>
                    )}
                  </div>

                  {/* Twitter Snippet */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800">
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {seoData.global.twitterHandle || '@dizo_pulse'} • {seoData.global.canonicalBaseUrl?.replace(/^https?:\/\//, '') || 'dizopulse.com'}
                    </div>
                    <div className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                      {seoData.global.twitterTitle || previewValues.title}
                    </div>
                    <div className="text-xs text-slate-300 line-clamp-2 mt-1">
                      {seoData.global.twitterDescription || previewValues.desc}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Action Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Last updated: {seoData.lastUpdatedAt ? new Date(seoData.lastUpdatedAt).toLocaleDateString() : 'Active'}</span>
              <button
                onClick={() => {
                  applySeoMetadata(seoData, {
                    pageId: previewTarget === 'page' ? selectedPageKey : undefined,
                    service: previewTarget === 'service' ? activeServiceObj : undefined,
                  });
                  showToast('Preview metadata applied to current browser tab!', 'success');
                }}
                className="text-indigo-600 font-bold hover:underline"
              >
                Apply to Tab Head ⚡
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* XML SITEMAP INSPECTOR MODAL */}
      <AnimatePresence>
        {showXmlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Icons.FileCode className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-slate-900">Generated XML Sitemap Preview</h3>
                </div>
                <button
                  onClick={() => setShowXmlModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 flex-1 overflow-y-auto bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs">
                <pre>{generateSitemapXml()}</pre>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateSitemapXml());
                    showToast('Sitemap XML copied to clipboard!', 'success');
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Icons.Copy className="w-3.5 h-3.5" />
                  <span>Copy XML</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Open Live /sitemap.xml ↗
                  </a>
                  <button
                    onClick={() => setShowXmlModal(false)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
