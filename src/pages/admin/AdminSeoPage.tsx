import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import * as Icons from 'lucide-react';
import { showToast } from '../../components/UIPolish';

interface AdminSeoPageProps {
  navigate: (path: string) => void;
}

interface PageSeoConfig {
  id: string;
  pageName: string;
  path: string;
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export const AdminSeoPage: React.FC<AdminSeoPageProps> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'pages' | 'social' | 'sitemap'>('global');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedPageKey, setSelectedPageKey] = useState<string>('home');

  // Global SEO state
  const [siteName, setSiteName] = useState('Dizo Pulse | Creative Media & Digital Growth Agency');
  const [globalTitle, setGlobalTitle] = useState('Dizo Pulse | Creative Media & Digital Growth Agency');
  const [globalDescription, setGlobalDescription] = useState(
    'From design to digital growth — everything your brand needs under one roof. High-converting websites, 4K reel production, vector branding, and performance marketing.'
  );
  const [globalKeywords, setGlobalKeywords] = useState(
    'digital agency, creative media, reel editing, web development, SEO, performance marketing, India'
  );
  const [canonicalBase, setCanonicalBase] = useState('https://dizopulse.com');
  const [googleVerification, setGoogleVerification] = useState('google-site-verification=SAMPLE_TOKEN_CODE');
  const [globalRobotsIndex, setGlobalRobotsIndex] = useState(true);
  const [globalRobotsFollow, setGlobalRobotsFollow] = useState(true);

  // Social / OpenGraph state
  const [ogTitle, setOgTitle] = useState('Dizo Pulse - Design. Create. Grow.');
  const [ogDescription, setOgDescription] = useState(
    'All digital solutions under one roof for modern founders and creators.'
  );
  const [ogImageUrl, setOgImageUrl] = useState(
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80'
  );
  const [twitterHandle, setTwitterHandle] = useState('@dizo_pulse');

  // Page Specific SEO Configurations
  const [pagesConfig, setPagesConfig] = useState<Record<string, PageSeoConfig>>({
    home: {
      id: 'home',
      pageName: 'Home Page',
      path: '/',
      title: 'Dizo Pulse | Creative Media & Digital Growth Agency',
      description:
        'From design to digital growth — everything your brand needs in one place. We craft memorable corporate signatures, edit viral reels, and scale businesses.',
      keywords: 'digital marketing agency, web design india, reel editing, branding, performance marketing',
      canonical: 'https://dizopulse.com/',
      robotsIndex: true,
      robotsFollow: true
    },
    services: {
      id: 'services',
      pageName: 'All Services Catalog',
      path: '/services',
      title: 'Services Catalog & Transparent Pricing | Dizo Pulse',
      description:
        'Explore all digital services: Instagram post design, 4K reel editing, custom React web development, organic SEO, and Google ads with transparent pricing.',
      keywords: 'services pricing, reel editing price, website design cost, SEO packages, social media management',
      canonical: 'https://dizopulse.com/services',
      robotsIndex: true,
      robotsFollow: true
    },
    calculator: {
      id: 'calculator',
      pageName: 'Quote Estimator & Scope Builder',
      path: '/quote-estimator',
      title: 'Instant Project Quote Calculator & Cost Estimator | Dizo Pulse',
      description:
        'Build your custom service bundle and calculate transparent project costs instantly with pre-applied promotional launch discounts.',
      keywords: 'project quote estimator, marketing cost calculator, website price calculator',
      canonical: 'https://dizopulse.com/quote-estimator',
      robotsIndex: true,
      robotsFollow: true
    },
    about: {
      id: 'about',
      pageName: 'About & Company',
      path: '/about',
      title: 'About Dizo Pulse | Creative Media & Digital Engineering',
      description:
        'Learn about Dizo Pulse story, our multidisciplinary team of designers, engineers, and growth strategists in India.',
      keywords: 'about dizo pulse, creative agency team, digital engineering india',
      canonical: 'https://dizopulse.com/about',
      robotsIndex: true,
      robotsFollow: true
    },
    contact: {
      id: 'contact',
      pageName: 'Contact & Inquiries',
      path: '/contact',
      title: 'Contact Dizo Pulse | Project Discovery & Inquiries',
      description: 'Get in touch with the Dizo Pulse team to discuss your next brand expansion or digital campaign.',
      keywords: 'contact agency, hire digital team, dizo pulse contact',
      canonical: 'https://dizopulse.com/contact',
      robotsIndex: true,
      robotsFollow: true
    },
    portal: {
      id: 'portal',
      pageName: 'Client Workspace Hub',
      path: '/portal/login',
      title: 'Client Workspace Hub | Dizo Pulse',
      description: 'Private workspace for active proposals, signed contracts, deliverable review, and milestone tracking.',
      keywords: 'client portal, project tracking, deliverable vault',
      canonical: 'https://dizopulse.com/portal/login',
      robotsIndex: false,
      robotsFollow: false
    }
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.seo) {
          if (data.seo.global) {
            setGlobalTitle(data.seo.global.title || globalTitle);
            setGlobalDescription(data.seo.global.description || globalDescription);
            setGlobalKeywords(data.seo.global.keywords || globalKeywords);
            setCanonicalBase(data.seo.global.canonicalBase || canonicalBase);
            setGoogleVerification(data.seo.global.googleVerification || googleVerification);
            setGlobalRobotsIndex(data.seo.global.robotsIndex ?? true);
            setGlobalRobotsFollow(data.seo.global.robotsFollow ?? true);
          }
          if (data.seo.social) {
            setOgTitle(data.seo.social.ogTitle || ogTitle);
            setOgDescription(data.seo.social.ogDescription || ogDescription);
            setOgImageUrl(data.seo.social.ogImageUrl || ogImageUrl);
            setTwitterHandle(data.seo.social.twitterHandle || twitterHandle);
          }
          if (data.seo.pages && Object.keys(data.seo.pages).length > 0) {
            setPagesConfig(prev => ({ ...prev, ...data.seo.pages }));
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveSeo = async () => {
    setIsSaving(true);
    try {
      const payload = {
        seo: {
          global: {
            title: globalTitle,
            description: globalDescription,
            keywords: globalKeywords,
            canonicalBase,
            googleVerification,
            robotsIndex: globalRobotsIndex,
            robotsFollow: globalRobotsFollow
          },
          social: {
            ogTitle,
            ogDescription,
            ogImageUrl,
            twitterHandle
          },
          pages: pagesConfig
        }
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('SEO Settings Published', 'Meta tags, OG tags, and sitemaps updated!', 'success');
      } else {
        showToast('Save Failed', 'Server error while updating SEO configurations', 'error');
      }
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePageField = (key: string, field: keyof PageSeoConfig, value: any) => {
    setPagesConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const currentPage = pagesConfig[selectedPageKey] || pagesConfig.home;

  return (
    <AdminLayout
      activeTab="seo"
      currentPath="/admin/seo"
      navigate={navigate}
      requiredModule="seo"
      pageTitle="Search Engine Optimization & Meta Control"
      contextualActions={{
        onRefreshData: () => window.location.reload()
      }}
    >
      {/* Tab Navigation & Save Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'global', label: 'Global SEO Defaults', icon: 'Globe' },
            { key: 'pages', label: 'Per-Route Meta Tags', icon: 'FileCode' },
            { key: 'social', label: 'OpenGraph & Social Cards', icon: 'Share2' },
            { key: 'sitemap', label: 'Sitemap & Robots.txt', icon: 'Code' }
          ].map(tab => {
            const IconComp = (Icons as any)[tab.icon] || Icons.Globe;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSaveSeo}
          disabled={isSaving}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {isSaving ? (
            <>
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving SEO...</span>
            </>
          ) : (
            <>
              <Icons.Save className="w-4 h-4" />
              <span>Publish SEO Engine</span>
            </>
          )}
        </button>
      </div>

      {/* Global SEO Tab */}
      {activeTab === 'global' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 max-w-3xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Icons.Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Global Meta Configuration</h3>
              <p className="text-[11px] text-slate-400">Default fallback SEO tags applied across the entire domain</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Global Title Tag (Fallback) *
              </label>
              <input
                type="text"
                value={globalTitle}
                onChange={e => setGlobalTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Global Meta Description (150-160 chars recommended) *
              </label>
              <textarea
                rows={3}
                value={globalDescription}
                onChange={e => setGlobalDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 block text-right font-mono">
                {globalDescription.length} characters
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Global Meta Keywords (Comma Separated)
              </label>
              <input
                type="text"
                value={globalKeywords}
                onChange={e => setGlobalKeywords(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Canonical Base URL
                </label>
                <input
                  type="text"
                  value={canonicalBase}
                  onChange={e => setCanonicalBase(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Google Search Console Verification
                </label>
                <input
                  type="text"
                  value={googleVerification}
                  onChange={e => setGoogleVerification(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={globalRobotsIndex}
                  onChange={e => setGlobalRobotsIndex(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-950"
                />
                <span>Allow Search Engines to Index (index)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={globalRobotsFollow}
                  onChange={e => setGlobalRobotsFollow(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-950"
                />
                <span>Allow Following Links (follow)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Per-Page SEO Tab */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Route selector list */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-2 h-fit">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
              Select Route
            </h4>
            {(Object.entries(pagesConfig) as [string, PageSeoConfig][]).map(([key, cfg]) => {
              const isSelected = selectedPageKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPageKey(key)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{cfg.pageName}</p>
                    <p className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {cfg.path}
                    </p>
                  </div>
                  {cfg.robotsIndex ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Indexed" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Noindex" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Route SEO Editor */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">{currentPage.pageName}</h3>
                <span className="text-xs text-indigo-400 font-mono">{currentPage.path}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={currentPage.robotsIndex}
                    onChange={e => handleUpdatePageField(selectedPageKey, 'robotsIndex', e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span>Indexable</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Page Title Tag *
                </label>
                <input
                  type="text"
                  value={currentPage.title}
                  onChange={e => handleUpdatePageField(selectedPageKey, 'title', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Page Meta Description *
                </label>
                <textarea
                  rows={3}
                  value={currentPage.description}
                  onChange={e => handleUpdatePageField(selectedPageKey, 'description', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 block text-right font-mono">
                  {currentPage.description.length} characters
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Target Keywords
                </label>
                <input
                  type="text"
                  value={currentPage.keywords}
                  onChange={e => handleUpdatePageField(selectedPageKey, 'keywords', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Canonical Route URL
                </label>
                <input
                  type="text"
                  value={currentPage.canonical}
                  onChange={e => handleUpdatePageField(selectedPageKey, 'canonical', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social & OpenGraph Tab */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-black text-white">Social Sharing Cards (OpenGraph / Twitter)</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Social Card Title (og:title)
                </label>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={e => setOgTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Social Card Description (og:description)
                </label>
                <textarea
                  rows={3}
                  value={ogDescription}
                  onChange={e => setOgDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Social Share Image URL (1200x630px recommended)
                </label>
                <input
                  type="text"
                  value={ogImageUrl}
                  onChange={e => setOgImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Twitter Handle
                </label>
                <input
                  type="text"
                  value={twitterHandle}
                  onChange={e => setTwitterHandle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-400 font-bold focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Live OpenGraph Preview Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-black text-white">Live Link Preview</h3>
            <p className="text-[11px] text-slate-400">
              How your link appears when shared on WhatsApp, Twitter / X, LinkedIn, and Facebook:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl max-w-sm mx-auto">
              {ogImageUrl ? (
                <img src={ogImageUrl} alt="OG Preview" className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-44 bg-slate-900 flex items-center justify-center text-slate-600">
                  <Icons.Image className="w-10 h-10" />
                </div>
              )}
              <div className="p-3.5 space-y-1">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">dizopulse.com</span>
                <h4 className="text-xs font-black text-white line-clamp-1">{ogTitle}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{ogDescription}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sitemap & Robots Tab */}
      {activeTab === 'sitemap' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">Dynamic XML Sitemap</h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                GET /sitemap.xml
              </span>
            </div>
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${canonicalBase}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${canonicalBase}/services</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${canonicalBase}/quote-estimator</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${canonicalBase}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${canonicalBase}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${canonicalBase}/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${canonicalBase}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`}
            </pre>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">robots.txt Directives</h3>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                GET /robots.txt
              </span>
            </div>
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto">
{`User-agent: *
${globalRobotsIndex ? 'Allow: /' : 'Disallow: /'}
Disallow: /admin/
Disallow: /portal/
Disallow: /api/

Sitemap: ${canonicalBase}/sitemap.xml`}
            </pre>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSeoPage;
