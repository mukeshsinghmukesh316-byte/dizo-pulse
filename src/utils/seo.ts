import { SeoConfig, SeoPageConfig, SeoServiceConfig } from '../types';

export const DEFAULT_SEO_CONFIG: SeoConfig = {
  global: {
    siteTitle: 'Dizo Pulse | Creative Media & Digital Growth Agency',
    titleTemplate: '%s | Dizo Pulse',
    metaDescription: 'Full-service digital marketing, custom software engineering, high-converting websites, branding, and performance ads agency in India. Design • Create • Grow.',
    keywords: 'digital marketing, web design, reel editing, branding agency, react web development, performance marketing, SEO services, social media marketing, India',
    canonicalBaseUrl: 'https://dizopulse.com',
    faviconUrl: '',
    robotsIndex: true,
    robotsFollow: true,
    author: 'Dizo Pulse Creative Media',
    language: 'en-US',
    ogType: 'website',
    ogTitle: 'Dizo Pulse | Scaling Digital Growth & Creative Craft',
    ogDescription: 'Transform your brand with high-converting web apps, viral reels, vector identities, and ROI-driven marketing campaigns.',
    ogImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80',
    ogSiteName: 'Dizo Pulse Agency',
    twitterCardType: 'summary_large_image',
    twitterTitle: 'Dizo Pulse | Creative Media & Digital Growth Agency',
    twitterDescription: 'From design to digital growth — everything your brand needs under one roof.',
    twitterImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80',
    twitterHandle: '@dizo_pulse',
  },
  pages: {
    home: {
      id: 'home',
      pageName: 'Home Page',
      path: '/',
      title: 'Dizo Pulse | Creative Media & Digital Growth Agency',
      description: 'From design to digital growth — everything your brand needs in one place. We craft memorable corporate signatures, edit viral reels, and scale businesses.',
      keywords: 'digital marketing agency, web design india, reel editing, branding, performance marketing',
      canonical: 'https://dizopulse.com/',
      ogTitle: 'Dizo Pulse - Design. Create. Grow.',
      ogDescription: 'All digital solutions under one roof for modern founders and creators.',
      ogImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'daily',
      priority: 1.0,
    },
    services: {
      id: 'services',
      pageName: 'Services Catalog & Pricing',
      path: '/#services-browser',
      title: 'Services Catalog & Transparent Pricing | Dizo Pulse',
      description: 'Explore all digital services: Instagram post design, 4K reel editing, custom React web development, organic SEO, and Google ads with transparent pricing.',
      keywords: 'services pricing, reel editing price, website design cost, SEO packages, social media management, India digital agency',
      canonical: 'https://dizopulse.com/#services-browser',
      ogTitle: 'Digital Marketing & Web Services Catalog | Dizo Pulse',
      ogDescription: 'Transparent pricing, tiered bundles, and fast delivery turnaround.',
      ogImage: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&h=630&q=80',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'weekly',
      priority: 0.9,
    },
    calculator: {
      id: 'calculator',
      pageName: 'Quote Estimator & Scope Builder',
      path: '/#quote-calculator',
      title: 'Instant Project Quote Calculator & Cost Estimator | Dizo Pulse',
      description: 'Build your custom service bundle and calculate transparent project costs instantly with pre-applied promotional launch discounts.',
      keywords: 'project quote estimator, marketing cost calculator, website price calculator, digital scope builder',
      canonical: 'https://dizopulse.com/#quote-calculator',
      ogTitle: 'Instant Project Quote Estimator | Dizo Pulse',
      ogDescription: 'Calculate transparent project costs and configure your custom digital package.',
      ogImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&h=630&q=80',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'monthly',
      priority: 0.8,
    },
    client_portal: {
      id: 'client_portal',
      pageName: 'Client Workspace Hub',
      path: '/#client-portal',
      title: 'Client Portal & Project Hub | Dizo Pulse',
      description: 'Private client workspace for active proposals, signed contracts, deliverable review, and milestone tracking.',
      keywords: 'client portal, project tracking, deliverable vault',
      canonical: 'https://dizopulse.com/#client-portal',
      ogTitle: 'Client Workspace Hub | Dizo Pulse',
      ogDescription: 'Private client portal for milestone tracking and real-time deliverables.',
      ogImage: '',
      robotsIndex: false,
      robotsFollow: false,
      changefreq: 'weekly',
      priority: 0.5,
    },
    about: {
      id: 'about',
      pageName: 'About & Company',
      path: '/#about',
      title: 'About Dizo Pulse | Creative Media & Digital Engineering',
      description: 'Learn about Dizo Pulse story, our multidisciplinary team of designers, engineers, and growth strategists in India.',
      keywords: 'about dizo pulse, creative agency team, digital engineering india, agency story',
      canonical: 'https://dizopulse.com/#about',
      ogTitle: 'About Dizo Pulse Agency',
      ogDescription: 'Crafting memorable corporate signatures and scalable software platforms.',
      ogImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&h=630&q=80',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'monthly',
      priority: 0.7,
    },
    privacy: {
      id: 'privacy',
      pageName: 'Privacy Policy',
      path: '/#privacy',
      title: 'Privacy Policy | Dizo Pulse Agency',
      description: 'Official privacy practices, data security protocols, and client confidentiality terms of Dizo Pulse.',
      keywords: 'privacy policy, client data protection, confidentiality',
      canonical: 'https://dizopulse.com/#privacy',
      ogTitle: 'Privacy Policy | Dizo Pulse',
      ogDescription: 'Privacy practices and data protection commitment.',
      ogImage: '',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'yearly',
      priority: 0.3,
    },
    terms: {
      id: 'terms',
      pageName: 'Terms & Conditions',
      path: '/#terms',
      title: 'Terms & Conditions | Dizo Pulse Agency',
      description: 'Standard agency service terms, SLA agreements, and scope clarifications.',
      keywords: 'terms and conditions, service agreement, SLA terms',
      canonical: 'https://dizopulse.com/#terms',
      ogTitle: 'Terms & Conditions | Dizo Pulse',
      ogDescription: 'Service agreements and terms of engagement.',
      ogImage: '',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'yearly',
      priority: 0.3,
    },
  },
  servicesSeo: {},
  sitemapConfig: {
    includeServices: true,
    includePages: true,
    defaultChangeFreq: 'weekly',
    defaultPriority: 0.8,
    customUrls: [],
  },
  lastUpdatedAt: new Date().toISOString(),
  lastUpdatedBy: 'Agency Administrator',
};

// Helper to get or create HTML meta tag in <head>
function setMetaTag(name: string, content: string, isProperty = false) {
  if (typeof document === 'undefined') return;
  const attribute = isProperty ? 'property' : 'name';
  let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content || '');
}

// Helper to set canonical tag in <head>
function setCanonicalTag(url: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url || '');
}

// Helper to set favicon link in <head>
function setFaviconTag(url: string) {
  if (typeof document === 'undefined' || !url) return;
  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'icon');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Dynamically applies SEO tags to document head based on current config,
 * active page route, and optionally active service modal/details.
 */
export function applySeoMetadata(
  config: SeoConfig | null,
  options?: {
    pageId?: string;
    service?: { id: string; name: string; description: string; imageUrl?: string; category?: string };
    customTitle?: string;
  }
) {
  if (typeof document === 'undefined') return;

  const currentConfig: SeoConfig = config || DEFAULT_SEO_CONFIG;
  const global = currentConfig.global || DEFAULT_SEO_CONFIG.global;
  const pageId = options?.pageId || 'home';
  const pageConfig: SeoPageConfig | undefined = currentConfig.pages?.[pageId] || currentConfig.pages?.['home'];

  let finalTitle = options?.customTitle || pageConfig?.title || global.siteTitle;
  let finalDescription = pageConfig?.description || global.metaDescription;
  let finalKeywords = pageConfig?.keywords || global.keywords;
  let finalCanonical = pageConfig?.canonical || `${global.canonicalBaseUrl || 'https://dizopulse.com'}${pageConfig?.path || '/'}`;
  let finalOgTitle = pageConfig?.ogTitle || finalTitle;
  let finalOgDescription = pageConfig?.ogDescription || finalDescription;
  let finalOgImage = pageConfig?.ogImage || global.ogImageUrl;
  let robotsIndex = pageConfig ? pageConfig.robotsIndex : global.robotsIndex;
  let robotsFollow = pageConfig ? pageConfig.robotsFollow : global.robotsFollow;

  // If viewing a specific individual service
  if (options?.service) {
    const srv = options.service;
    const srvSeo: SeoServiceConfig | undefined = currentConfig.servicesSeo?.[srv.id];
    
    if (srvSeo?.customTitle) {
      finalTitle = srvSeo.customTitle;
    } else {
      finalTitle = `${srv.name} | Dizo Pulse Services`;
    }

    if (srvSeo?.customDescription) {
      finalDescription = srvSeo.customDescription;
    } else {
      finalDescription = srv.description || global.metaDescription;
    }

    if (srvSeo?.customKeywords) {
      finalKeywords = srvSeo.customKeywords;
    } else {
      finalKeywords = `${srv.name.toLowerCase()}, ${srv.category || 'digital service'}, ${global.keywords}`;
    }

    if (srvSeo?.customCanonical) {
      finalCanonical = srvSeo.customCanonical;
    } else {
      finalCanonical = `${global.canonicalBaseUrl || 'https://dizopulse.com'}/#service-${srv.id}`;
    }

    if (srvSeo?.customOgTitle) {
      finalOgTitle = srvSeo.customOgTitle;
    } else {
      finalOgTitle = finalTitle;
    }

    if (srvSeo?.customOgDescription) {
      finalOgDescription = srvSeo.customOgDescription;
    } else {
      finalOgDescription = finalDescription;
    }

    if (srvSeo?.customOgImage) {
      finalOgImage = srvSeo.customOgImage;
    } else if (srv.imageUrl) {
      finalOgImage = srv.imageUrl;
    }

    if (srvSeo?.robotsIndex !== undefined) {
      robotsIndex = srvSeo.robotsIndex;
    }
    if (srvSeo?.robotsFollow !== undefined) {
      robotsFollow = srvSeo.robotsFollow;
    }
  }

  // 1. Update Document Title
  document.title = finalTitle;

  // 2. Standard Meta Tags
  setMetaTag('description', finalDescription);
  setMetaTag('keywords', finalKeywords);
  setMetaTag('author', global.author || 'Dizo Pulse Creative Media');
  setMetaTag('robots', `${robotsIndex ? 'index' : 'noindex'}, ${robotsFollow ? 'follow' : 'nofollow'}`);

  // 3. Canonical Link
  setCanonicalTag(finalCanonical);

  // 4. Favicon
  if (global.faviconUrl) {
    setFaviconTag(global.faviconUrl);
  }

  // 5. Open Graph Meta Tags
  setMetaTag('og:title', finalOgTitle, true);
  setMetaTag('og:description', finalOgDescription, true);
  setMetaTag('og:image', finalOgImage, true);
  setMetaTag('og:url', finalCanonical, true);
  setMetaTag('og:type', global.ogType || 'website', true);
  setMetaTag('og:site_name', global.ogSiteName || 'Dizo Pulse Agency', true);

  // 6. Twitter / X Card Meta Tags
  setMetaTag('twitter:card', global.twitterCardType || 'summary_large_image');
  setMetaTag('twitter:title', global.twitterTitle || finalTitle);
  setMetaTag('twitter:description', global.twitterDescription || finalDescription);
  setMetaTag('twitter:image', global.twitterImageUrl || finalOgImage);
  if (global.twitterHandle) {
    setMetaTag('twitter:site', global.twitterHandle);
    setMetaTag('twitter:creator', global.twitterHandle);
  }
}

/**
 * Calculates SEO Health Score & checklist for given SEO values
 */
export function calculateSeoScore(seo: SeoConfig): {
  score: number;
  checks: { name: string; pass: boolean; score: number; feedback: string }[];
} {
  const checks = [
    {
      name: 'Global Title Length',
      pass: Boolean(seo.global.siteTitle && seo.global.siteTitle.length >= 30 && seo.global.siteTitle.length <= 65),
      score: 15,
      feedback: seo.global.siteTitle
        ? `${seo.global.siteTitle.length} characters (Recommended: 30-65 chars)`
        : 'Missing global title',
    },
    {
      name: 'Meta Description Depth',
      pass: Boolean(seo.global.metaDescription && seo.global.metaDescription.length >= 100 && seo.global.metaDescription.length <= 165),
      score: 15,
      feedback: seo.global.metaDescription
        ? `${seo.global.metaDescription.length} characters (Recommended: 100-165 chars)`
        : 'Missing meta description',
    },
    {
      name: 'Target Keywords Configured',
      pass: Boolean(seo.global.keywords && seo.global.keywords.split(',').length >= 3),
      score: 10,
      feedback: seo.global.keywords ? `${seo.global.keywords.split(',').length} keywords detected` : 'No keywords defined',
    },
    {
      name: 'Canonical Base URL',
      pass: Boolean(seo.global.canonicalBaseUrl && seo.global.canonicalBaseUrl.startsWith('http')),
      score: 10,
      feedback: seo.global.canonicalBaseUrl ? 'Canonical base valid' : 'Missing HTTPS canonical base',
    },
    {
      name: 'Open Graph Social Image (1200x630)',
      pass: Boolean(seo.global.ogImageUrl && seo.global.ogImageUrl.trim().length > 0),
      score: 15,
      feedback: seo.global.ogImageUrl ? 'High-res OG card image present' : 'Missing social sharing image',
    },
    {
      name: 'Twitter / X Card Configured',
      pass: Boolean(seo.global.twitterTitle && (seo.global.twitterImageUrl || seo.global.ogImageUrl)),
      score: 10,
      feedback: seo.global.twitterHandle ? `Bound to ${seo.global.twitterHandle}` : 'Twitter cards ready',
    },
    {
      name: 'Search Engine Indexing Directive',
      pass: Boolean(seo.global.robotsIndex && seo.global.robotsFollow),
      score: 10,
      feedback: seo.global.robotsIndex ? 'Crawlers set to Index & Follow' : 'Warning: Robots set to No-Index',
    },
    {
      name: 'Page-wise Coverage',
      pass: Boolean(seo.pages && Object.keys(seo.pages).length >= 5),
      score: 15,
      feedback: `${Object.keys(seo.pages || {}).length} core pages mapped with unique metadata`,
    },
  ];

  const totalPossible = checks.reduce((acc, c) => acc + c.score, 0);
  const earned = checks.filter(c => c.pass).reduce((acc, c) => acc + c.score, 0);
  const score = Math.round((earned / totalPossible) * 100);

  return { score, checks };
}
