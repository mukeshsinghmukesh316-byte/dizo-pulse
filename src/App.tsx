import React, { useState, useEffect } from 'react';
import Logo from './components/Logo';
import InquiriesAdmin from './components/InquiriesAdmin';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import QuoteEstimatorPage from './pages/QuoteEstimatorPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import { getTheme } from './utils/theme';
import { Service, SeoConfig } from './types';
import { services as allCatalogServices } from './data/services';
import { applySeoMetadata } from './utils/seo';
import { trackVisitorPageView } from './utils/visitorTracker';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastContainer } from './components/UIPolish';
import { useAuth } from './context/AuthContext';

// Portal Page Imports
import PortalLayout from './pages/portal/PortalLayout';
import PortalLoginPage from './pages/portal/PortalLoginPage';
import PortalDashboardPage from './pages/portal/PortalDashboardPage';
import PortalProjectsPage from './pages/portal/PortalProjectsPage';
import PortalProposalsPage from './pages/portal/PortalProposalsPage';
import PortalContractsPage from './pages/portal/PortalContractsPage';
import PortalOrdersPage from './pages/portal/PortalOrdersPage';
import PortalVaultPage from './pages/portal/PortalVaultPage';
import PortalMessagesPage from './pages/portal/PortalMessagesPage';
import PortalSettingsPage from './pages/portal/PortalSettingsPage';
import AgencyGatewayPage from './pages/AgencyGatewayPage';

// Admin Page Imports
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCrmPage from './pages/admin/AdminCrmPage';
import AdminProposalsPage from './pages/admin/AdminProposalsPage';
import AdminContractsPage from './pages/admin/AdminContractsPage';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';
import AdminAssetsPage from './pages/admin/AdminAssetsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminContentPage from './pages/admin/AdminContentPage';
import AdminSeoPage from './pages/admin/AdminSeoPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

export type AppRoute = 
  | { type: 'home' }
  | { type: 'services' }
  | { type: 'service_detail'; slug: string }
  | { type: 'quote_estimator' }
  | { type: 'about' }
  | { type: 'contact' }
  | { type: 'terms' }
  | { type: 'privacy' }
  | { type: 'agency' }
  | { type: 'portal_login' }
  | { type: 'portal_dashboard' }
  | { type: 'portal_projects'; projectId?: string }
  | { type: 'portal_proposals'; proposalId?: string }
  | { type: 'portal_contracts'; contractId?: string }
  | { type: 'portal_orders'; orderId?: string }
  | { type: 'portal_vault' }
  | { type: 'portal_messages' }
  | { type: 'portal_settings' }
  | { type: 'admin_login' }
  | { type: 'admin_dashboard' }
  | { type: 'admin_crm' }
  | { type: 'admin_proposals' }
  | { type: 'admin_contracts' }
  | { type: 'admin_projects' }
  | { type: 'admin_messages' }
  | { type: 'admin_assets' }
  | { type: 'admin_analytics' }
  | { type: 'admin_services' }
  | { type: 'admin_content' }
  | { type: 'admin_seo' }
  | { type: 'admin_staff' }
  | { type: 'admin_settings' };

function parsePathToRoute(pathname: string): { route: AppRoute; path: string } {
  // Strip query parameters and hash fragments before route matching
  const urlPath = (pathname || '').split('?')[0].split('#')[0];
  const cleanPath = urlPath.replace(/\/+$/, '') || '/';
  
  if (cleanPath === '/' || cleanPath === '') {
    return { route: { type: 'home' }, path: '/' };
  }
  if (cleanPath === '/services') {
    return { route: { type: 'services' }, path: '/services' };
  }
  if (cleanPath.startsWith('/services/')) {
    const slug = cleanPath.replace('/services/', '').trim();
    if (slug) {
      return { route: { type: 'service_detail', slug }, path: cleanPath };
    }
    return { route: { type: 'services' }, path: '/services' };
  }
  if (cleanPath === '/quote-estimator' || cleanPath === '/quote' || cleanPath === '/calculator') {
    return { route: { type: 'quote_estimator' }, path: '/quote-estimator' };
  }
  if (cleanPath === '/about' || cleanPath === '/about-us') {
    return { route: { type: 'about' }, path: '/about' };
  }
  if (cleanPath === '/contact' || cleanPath === '/contact-us') {
    return { route: { type: 'contact' }, path: '/contact' };
  }
  if (cleanPath === '/terms' || cleanPath === '/terms-and-conditions') {
    return { route: { type: 'terms' }, path: '/terms' };
  }
  if (cleanPath === '/privacy' || cleanPath === '/privacy-policy') {
    return { route: { type: 'privacy' }, path: '/privacy' };
  }
  if (cleanPath === '/agency' || cleanPath === '/agency-gateway') {
    return { route: { type: 'agency' }, path: '/agency' };
  }

  // PORTAL ROUTES
  if (cleanPath === '/portal/login' || cleanPath === '/client/login') {
    return { route: { type: 'portal_login' }, path: '/portal/login' };
  }
  if (cleanPath === '/portal' || cleanPath === '/portal/dashboard' || cleanPath === '/client/dashboard') {
    return { route: { type: 'portal_dashboard' }, path: '/portal/dashboard' };
  }
  if (cleanPath === '/portal/projects') {
    return { route: { type: 'portal_projects' }, path: '/portal/projects' };
  }
  if (cleanPath.startsWith('/portal/projects/')) {
    const projectId = cleanPath.replace('/portal/projects/', '').trim();
    return { route: { type: 'portal_projects', projectId }, path: cleanPath };
  }
  if (cleanPath === '/portal/proposals') {
    return { route: { type: 'portal_proposals' }, path: '/portal/proposals' };
  }
  if (cleanPath.startsWith('/portal/proposals/')) {
    const proposalId = cleanPath.replace('/portal/proposals/', '').trim();
    return { route: { type: 'portal_proposals', proposalId }, path: cleanPath };
  }
  if (cleanPath === '/portal/contracts') {
    return { route: { type: 'portal_contracts' }, path: '/portal/contracts' };
  }
  if (cleanPath.startsWith('/portal/contracts/')) {
    const contractId = cleanPath.replace('/portal/contracts/', '').trim();
    return { route: { type: 'portal_contracts', contractId }, path: cleanPath };
  }
  if (cleanPath === '/portal/orders') {
    return { route: { type: 'portal_orders' }, path: '/portal/orders' };
  }
  if (cleanPath.startsWith('/portal/orders/')) {
    const orderId = cleanPath.replace('/portal/orders/', '').trim();
    return { route: { type: 'portal_orders', orderId }, path: cleanPath };
  }
  if (cleanPath === '/portal/vault' || cleanPath === '/portal/files' || cleanPath === '/portal/assets') {
    return { route: { type: 'portal_vault' }, path: '/portal/vault' };
  }
  if (cleanPath === '/portal/messages' || cleanPath === '/portal/communication') {
    return { route: { type: 'portal_messages' }, path: '/portal/messages' };
  }
  if (cleanPath === '/portal/settings' || cleanPath === '/portal/account') {
    return { route: { type: 'portal_settings' }, path: '/portal/settings' };
  }
  if (cleanPath.startsWith('/portal')) {
    return { route: { type: 'portal_dashboard' }, path: '/portal/dashboard' };
  }

  // ADMIN ROUTES
  if (cleanPath === '/admin/login' || cleanPath === '/staff/login') {
    return { route: { type: 'admin_login' }, path: '/admin/login' };
  }
  if (cleanPath === '/admin' || cleanPath === '/admin/dashboard') {
    return { route: { type: 'admin_dashboard' }, path: '/admin/dashboard' };
  }
  if (cleanPath === '/admin/crm' || cleanPath === '/admin/leads' || cleanPath === '/admin/clients') {
    return { route: { type: 'admin_crm' }, path: '/admin/crm' };
  }
  if (cleanPath === '/admin/proposals') {
    return { route: { type: 'admin_proposals' }, path: '/admin/proposals' };
  }
  if (cleanPath === '/admin/contracts') {
    return { route: { type: 'admin_contracts' }, path: '/admin/contracts' };
  }
  if (cleanPath === '/admin/projects') {
    return { route: { type: 'admin_projects' }, path: '/admin/projects' };
  }
  if (cleanPath === '/admin/messages' || cleanPath === '/admin/chat' || cleanPath === '/admin/communication') {
    return { route: { type: 'admin_messages' }, path: '/admin/messages' };
  }
  if (cleanPath === '/admin/assets' || cleanPath === '/admin/media' || cleanPath === '/admin/vault') {
    return { route: { type: 'admin_assets' }, path: '/admin/assets' };
  }
  if (cleanPath === '/admin/analytics' || cleanPath === '/admin/bi' || cleanPath === '/admin/intelligence') {
    return { route: { type: 'admin_analytics' }, path: '/admin/analytics' };
  }
  if (cleanPath === '/admin/services' || cleanPath === '/admin/pricing') {
    return { route: { type: 'admin_services' }, path: '/admin/services' };
  }
  if (cleanPath === '/admin/content' || cleanPath === '/admin/copy') {
    return { route: { type: 'admin_content' }, path: '/admin/content' };
  }
  if (cleanPath === '/admin/seo' || cleanPath === '/admin/meta') {
    return { route: { type: 'admin_seo' }, path: '/admin/seo' };
  }
  if (cleanPath === '/admin/staff' || cleanPath === '/admin/team' || cleanPath === '/admin/rbac') {
    return { route: { type: 'admin_staff' }, path: '/admin/staff' };
  }
  if (cleanPath === '/admin/settings' || cleanPath === '/admin/system' || cleanPath === '/admin/security') {
    return { route: { type: 'admin_settings' }, path: '/admin/settings' };
  }
  if (cleanPath.startsWith('/admin')) {
    return { route: { type: 'admin_dashboard' }, path: '/admin/dashboard' };
  }

  // Fallback to Home for unknown routes
  return { route: { type: 'home' }, path: '/' };
}

export default function App() {
  const { currentUser } = useAuth();
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => parsePathToRoute(window.location.pathname || '/').route);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [dynamicServices, setDynamicServices] = useState<Service[]>(allCatalogServices);
  const [settings, setSettings] = useState<any>(null);
  const [websiteContent, setWebsiteContent] = useState<any>(null);
  const [seoConfig, setSeoConfig] = useState<SeoConfig | null>(null);
  const [portalUser, setPortalUser] = useState<any>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [globalCouponCode, setGlobalCouponCode] = useState<string>('');

  // Primary URL Router Navigation Handler
  const navigate = (path: string, options?: { replace?: boolean }) => {
    const parsed = parsePathToRoute(path);
    const isAdmin = parsed.route.type.startsWith('admin_');
    console.log(`[Router:navigate] Navigate requested -> "${path}" | Target Route: "${parsed.route.type}" | Base Path: "${parsed.path}" | isAdminPrefix: ${isAdmin}`);

    if (options?.replace) {
      window.history.replaceState({}, '', path);
    } else {
      const currentFullUrl = window.location.pathname + window.location.search;
      if (currentFullUrl !== path && window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    }
    setCurrentPath(path);
    setCurrentRoute(parsed.route);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to Browser Back / Forward buttons (popstate events)
  useEffect(() => {
    const handlePopState = () => {
      const fullUrl = window.location.pathname + window.location.search;
      const parsed = parsePathToRoute(fullUrl);
      const isAdmin = parsed.route.type.startsWith('admin_');
      console.log(`[Router:popstate] Browser history change -> "${fullUrl}" | Route: "${parsed.route.type}" | isAdminPrefix: ${isAdmin}`);
      setCurrentPath(fullUrl);
      setCurrentRoute(parsed.route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Monitor currentRoute and currentPath state transitions
  useEffect(() => {
    const isAdmin = currentRoute.type.startsWith('admin_');
    console.log(`[Router:StateUpdate] currentRoute: "${currentRoute.type}" | currentPath: "${currentPath}" | isAdminPrefix: ${isAdmin}`);
  }, [currentRoute, currentPath]);

  // Floating scroll-to-top detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync client portal session
  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('dizopulse_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setPortalUser(u);
        } catch (e) {
          setPortalUser(null);
        }
      } else {
        setPortalUser(null);
      }
    };
    checkUser();
    const interval = setInterval(checkUser, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load app dynamic data
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const resSettings = await fetch('/api/settings');
        if (resSettings.ok) {
          setSettings(await resSettings.json());
        }
        const resServices = await fetch('/api/services');
        if (resServices.ok) {
          setDynamicServices(await resServices.json());
        }
        const isPreviewMode = new URLSearchParams(window.location.search).get('preview_mode') === 'draft';
        const resContent = await fetch(`/api/website-content${isPreviewMode ? '?mode=draft' : ''}`);
        if (resContent.ok) {
          const contentResp = await resContent.json();
          if (contentResp?.activeContent) {
            setWebsiteContent(contentResp.activeContent);
          }
        }
        const resSeo = await fetch('/api/seo');
        if (resSeo.ok) {
          const seoJson = await resSeo.json();
          setSeoConfig(seoJson);
        }
      } catch (err) {
        console.error('Error fetching dynamic app configurations:', err);
      }
    };
    loadAppData();
  }, []);

  // Update SEO head tags based on active route
  useEffect(() => {
    let currentPageId = 'home';
    if (currentRoute.type === 'services' || currentRoute.type === 'service_detail') {
      currentPageId = 'services';
    } else if (currentRoute.type === 'quote_estimator') {
      currentPageId = 'calculator';
    } else if (currentRoute.type === 'about') {
      currentPageId = 'about';
    } else if (currentRoute.type === 'contact') {
      currentPageId = 'contact';
    } else if (currentRoute.type === 'terms') {
      currentPageId = 'terms';
    } else if (currentRoute.type === 'privacy') {
      currentPageId = 'privacy';
    }

    applySeoMetadata(seoConfig, { pageId: currentPageId });
  }, [seoConfig, currentRoute]);

  // Automatic Public Page Visitor Tracking
  useEffect(() => {
    const isPublicRoute =
      !currentRoute.type.startsWith('admin_') &&
      !currentRoute.type.startsWith('portal_') &&
      currentRoute.type !== 'agency';

    if (isPublicRoute) {
      trackVisitorPageView(currentPath);
    }
  }, [currentPath, currentRoute]);

  // Listen for admin query triggers and shortcut (Ctrl + Shift + A)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('login') === 'true') {
      navigate('/admin/dashboard');
    }
    if (params.get('workspace') === 'true' || params.get('user') === 'login') {
      navigate('/portal/dashboard');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigate('/agency');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Callback to add/remove services
  const handleAddService = (service: Service) => {
    const exists = selectedServices.some((s) => s.id === service.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
  };

  const handleClearServices = () => {
    setSelectedServices([]);
  };

  const theme = getTheme(settings);

  // ==========================================
  // DEDICATED AGENCY GATEWAY ROUTE RENDERING
  // ==========================================
  if (currentRoute.type === 'agency') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" id="app-root-container">
        <AgencyGatewayPage navigate={navigate} />
        <ToastContainer />
      </div>
    );
  }

  // ==========================================
  // DEDICATED ADMIN ROUTE RENDERING
  // ==========================================
  const isAdminRoute = currentRoute.type.startsWith('admin_');

  if (isAdminRoute) {
    return (
      <AdminAuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans w-full" id="app-root-container">
          {currentRoute.type === 'admin_login' && <AdminLoginPage navigate={navigate} />}
          {currentRoute.type === 'admin_dashboard' && <AdminDashboardPage navigate={navigate} />}
          {currentRoute.type === 'admin_crm' && <AdminCrmPage navigate={navigate} />}
          {currentRoute.type === 'admin_proposals' && <AdminProposalsPage navigate={navigate} />}
          {currentRoute.type === 'admin_contracts' && <AdminContractsPage navigate={navigate} />}
          {currentRoute.type === 'admin_projects' && <AdminProjectsPage navigate={navigate} />}
          {currentRoute.type === 'admin_messages' && <AdminMessagesPage navigate={navigate} />}
          {currentRoute.type === 'admin_assets' && <AdminAssetsPage navigate={navigate} />}
          {currentRoute.type === 'admin_analytics' && <AdminAnalyticsPage navigate={navigate} />}
          {currentRoute.type === 'admin_services' && <AdminServicesPage navigate={navigate} />}
          {currentRoute.type === 'admin_content' && <AdminContentPage navigate={navigate} />}
          {currentRoute.type === 'admin_seo' && <AdminSeoPage navigate={navigate} />}
          {currentRoute.type === 'admin_staff' && <AdminStaffPage navigate={navigate} />}
          {currentRoute.type === 'admin_settings' && <AdminSettingsPage navigate={navigate} />}
          <ToastContainer />
        </div>
      </AdminAuthProvider>
    );
  }

  // ==========================================
  // DEDICATED PORTAL ROUTE RENDERING
  // ==========================================
  const isPortalRoute = currentRoute.type.startsWith('portal_');

  if (currentRoute.type === 'portal_login') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" id="app-root-container">
        <PortalLoginPage navigate={navigate} />
        <ToastContainer />
      </div>
    );
  }

  if (isPortalRoute) {
    // If not logged in, enforce authentication guard
    if (!currentUser && !portalUser) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" id="app-root-container">
          <PortalLoginPage navigate={navigate} returnUrl={currentPath} />
          <ToastContainer />
        </div>
      );
    }

    // Authenticated Portal View with dedicated PortalLayout
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" id="app-root-container">
        <PortalLayout currentPath={currentPath} navigate={navigate}>
          {currentRoute.type === 'portal_dashboard' && <PortalDashboardPage navigate={navigate} />}
          {currentRoute.type === 'portal_projects' && <PortalProjectsPage navigate={navigate} projectId={currentRoute.projectId} />}
          {currentRoute.type === 'portal_proposals' && <PortalProposalsPage navigate={navigate} proposalId={currentRoute.proposalId} />}
          {currentRoute.type === 'portal_contracts' && <PortalContractsPage navigate={navigate} contractId={currentRoute.contractId} />}
          {currentRoute.type === 'portal_orders' && <PortalOrdersPage navigate={navigate} orderId={currentRoute.orderId} />}
          {currentRoute.type === 'portal_vault' && <PortalVaultPage navigate={navigate} />}
          {currentRoute.type === 'portal_messages' && <PortalMessagesPage navigate={navigate} />}
          {currentRoute.type === 'portal_settings' && <PortalSettingsPage navigate={navigate} />}
        </PortalLayout>
        <ToastContainer />
      </div>
    );
  }

  // ==========================================
  // PUBLIC WEBSITE RENDERING
  // ==========================================
  return (
    <div className={`min-h-screen ${theme.appContainerBg} ${theme.textMain} font-sans ${theme.selection} flex flex-col justify-between`} id="app-root-container">
      {/* Top Section Wrapper */}
      <div>
        {/* Maintenance Alert Banner */}
        {settings?.maintenanceModeEnabled && (
          <div className="bg-amber-500 text-slate-950 font-extrabold text-xs py-2 px-4 text-center shadow-inner flex items-center justify-center gap-2 z-50">
            <Icons.Wrench className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>
              {settings.maintenanceNoticeBanner || 'Dizo Pulse is undergoing scheduled maintenance. We will be back shortly!'}
            </span>
          </div>
        )}

        {/* Global Multi-Page Navigation Header */}
        <header
          className={`sticky top-0 z-40 ${
            settings?.activeTheme === 'charcoal-luxury'
              ? 'bg-slate-900/90 border-slate-800 text-slate-100'
              : 'bg-white/95 border-slate-200/80 text-slate-900'
          } backdrop-blur-md border-b py-3 px-4 sm:px-6 lg:px-8 xl:px-12 shadow-xs transition-colors`}
          id="site-header"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 lg:gap-4">
            {/* Logo Links to Home (/) */}
            <div onClick={() => navigate('/')} className="cursor-pointer select-none shrink-0">
              <Logo
                showSubtitle={true}
                variant={settings?.activeTheme === 'charcoal-luxury' ? 'light' : 'dark'}
                className="transform scale-90 sm:scale-95 origin-left"
                settings={settings}
              />
            </div>

            {/* Desktop Navigation Links (Maintained for lg+ 1024px+ screens with whitespace-nowrap and responsive gaps) */}
            <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-xs xl:text-sm font-semibold text-slate-600 shrink-0" id="desktop-nav-menu">
              <button
                onClick={() => navigate('/')}
                className={`hover:text-indigo-600 transition-colors flex items-center gap-1.5 cursor-pointer py-1 whitespace-nowrap ${
                  currentRoute.type === 'home'
                    ? 'text-indigo-600 font-extrabold border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icons.Home className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Home</span>
              </button>

              <button
                onClick={() => navigate('/services')}
                className={`hover:text-indigo-600 transition-colors flex items-center gap-1.5 cursor-pointer py-1 whitespace-nowrap ${
                  currentRoute.type === 'services' || currentRoute.type === 'service_detail'
                    ? 'text-indigo-600 font-extrabold border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icons.Grid className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Services</span>
              </button>

              <button
                onClick={() => navigate('/quote-estimator')}
                className={`hover:text-indigo-600 transition-colors flex items-center gap-1.5 cursor-pointer py-1 whitespace-nowrap ${
                  currentRoute.type === 'quote_estimator'
                    ? 'text-indigo-600 font-extrabold border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icons.Calculator className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Quote Estimator</span>
                {selectedServices.length > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-bounce shrink-0">
                    {selectedServices.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('/about')}
                className={`hover:text-indigo-600 transition-colors flex items-center gap-1.5 cursor-pointer py-1 whitespace-nowrap ${
                  currentRoute.type === 'about'
                    ? 'text-indigo-600 font-extrabold border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icons.Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>About</span>
              </button>

              <button
                onClick={() => navigate('/contact')}
                className={`hover:text-indigo-600 transition-colors flex items-center gap-1.5 cursor-pointer py-1 whitespace-nowrap ${
                  currentRoute.type === 'contact'
                    ? 'text-indigo-600 font-extrabold border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icons.MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Contact</span>
              </button>

              <button
                onClick={() => navigate(currentUser || portalUser ? '/portal/dashboard' : '/portal/login')}
                className={`hover:text-indigo-600 transition-colors flex items-center gap-1.5 cursor-pointer py-1 whitespace-nowrap ${
                  currentRoute.type.startsWith('portal_')
                    ? 'text-indigo-600 font-extrabold border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icons.UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{currentUser || portalUser ? 'Client Portal' : 'Login / Register'}</span>
              </button>
            </nav>

            {/* Header Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {currentUser || portalUser ? (
                <button
                  onClick={() => navigate('/portal/dashboard')}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-extrabold px-2.5 sm:px-3 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <Icons.User className="w-3.5 h-3.5 text-emerald-600 shrink-0 hidden sm:inline-block" />
                  <span className="max-w-[80px] sm:max-w-[110px] truncate">
                    Hi, {(currentUser?.name || portalUser?.name || 'Client').split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/portal/login')}
                  className="hidden sm:flex lg:hidden items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 px-2.5 py-2 rounded-xl border border-slate-200 hover:border-indigo-200 bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Icons.LogIn className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Login</span>
                </button>
              )}

              <button
                onClick={() => navigate('/quote-estimator')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-3 sm:px-3.5 py-2 rounded-xl uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                id="header-start-project-cta"
              >
                <Icons.Sparkles className="w-3.5 h-3.5 shrink-0 hidden xs:inline-block" />
                <span>Start Project {selectedServices.length > 0 ? `(${selectedServices.length})` : ''}</span>
              </button>

              {/* Mobile / Tablet (<1024px) Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
                aria-label="Toggle Navigation Menu"
                id="mobile-menu-toggle-btn"
              >
                {mobileMenuOpen ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Animated Mobile & Tablet Dropdown Navigation Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="lg:hidden overflow-hidden border-t border-slate-200/80 mt-3 pt-3 pb-2 space-y-1.5 text-xs font-bold max-w-7xl mx-auto"
                id="mobile-nav-panel"
              >
                <button
                  onClick={() => navigate('/')}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                    currentRoute.type === 'home'
                      ? 'bg-indigo-50 text-indigo-600 font-extrabold border-l-2 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icons.Home className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Home</span>
                </button>

                <button
                  onClick={() => navigate('/services')}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                    currentRoute.type === 'services' || currentRoute.type === 'service_detail'
                      ? 'bg-indigo-50 text-indigo-600 font-extrabold border-l-2 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icons.Grid className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>All Services</span>
                </button>

                <button
                  onClick={() => navigate('/quote-estimator')}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                    currentRoute.type === 'quote_estimator'
                      ? 'bg-indigo-50 text-indigo-600 font-extrabold border-l-2 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icons.Calculator className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Quote Estimator</span>
                  {selectedServices.length > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">
                      {selectedServices.length} Selected
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigate('/about')}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                    currentRoute.type === 'about'
                      ? 'bg-indigo-50 text-indigo-600 font-extrabold border-l-2 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icons.Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>About Us</span>
                </button>

                <button
                  onClick={() => navigate('/contact')}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                    currentRoute.type === 'contact'
                      ? 'bg-indigo-50 text-indigo-600 font-extrabold border-l-2 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icons.MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Contact Us</span>
                </button>

                <button
                  onClick={() => navigate('/terms')}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                    currentRoute.type === 'terms'
                      ? 'bg-indigo-50 text-indigo-600 font-extrabold border-l-2 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icons.FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Terms & Conditions</span>
                </button>

                <button
                  onClick={() => navigate('/privacy')}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                    currentRoute.type === 'privacy'
                      ? 'bg-indigo-50 text-indigo-600 font-extrabold border-l-2 border-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icons.ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Privacy Policy</span>
                </button>

                <div className="pt-2 border-t border-slate-200/80">
                  <button
                    onClick={() => navigate(currentUser || portalUser ? '/portal/dashboard' : '/portal/login')}
                    className="w-full text-left py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 font-extrabold shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Icons.UserCheck className="w-4 h-4 shrink-0" />
                    <span>{currentUser || portalUser ? 'Client Portal Dashboard' : 'Client Login / Register'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Main Routed Page Content Container */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8" id="main-view-workspace">
          {currentRoute.type === 'home' && (
            <HomePage
              websiteContent={websiteContent}
              theme={theme}
              catalogServices={dynamicServices}
              selectedServiceIds={selectedServices.map((s) => s.id)}
              onAddService={handleAddService}
              navigate={navigate}
            />
          )}

          {currentRoute.type === 'services' && (
            <ServicesPage
              catalogServices={dynamicServices}
              selectedServiceIds={selectedServices.map((s) => s.id)}
              onAddService={handleAddService}
              navigate={navigate}
            />
          )}

          {currentRoute.type === 'service_detail' && (
            <ServiceDetailPage
              slug={currentRoute.slug}
              catalogServices={dynamicServices}
              selectedServiceIds={selectedServices.map((s) => s.id)}
              onAddService={handleAddService}
              navigate={navigate}
            />
          )}

          {currentRoute.type === 'quote_estimator' && (
            <QuoteEstimatorPage
              selectedServices={selectedServices}
              onRemoveService={handleRemoveService}
              onClearServices={handleClearServices}
              catalogServices={dynamicServices}
              onAddService={handleAddService}
              settings={settings}
              globalCouponCode={globalCouponCode}
              setGlobalCouponCode={setGlobalCouponCode}
              navigate={navigate}
            />
          )}

          {currentRoute.type === 'about' && (
            <AboutPage navigate={navigate} websiteContent={websiteContent} />
          )}

          {currentRoute.type === 'contact' && (
            <ContactPage navigate={navigate} websiteContent={websiteContent} />
          )}

          {currentRoute.type === 'terms' && (
            <TermsPage navigate={navigate} />
          )}

          {currentRoute.type === 'privacy' && (
            <PrivacyPage navigate={navigate} />
          )}
        </main>
      </div>

      {/* Global Corporate Footer with Route Links */}
      <footer className="bg-slate-900 border-t border-slate-800 text-white py-12 px-6 md:px-12 mt-16" id="site-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Info */}
          <div className="md:col-span-4 space-y-4">
            <div onClick={() => navigate('/')} className="cursor-pointer select-none">
              <Logo showSubtitle={true} variant="light" className="scale-90 origin-left" settings={settings} />
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {websiteContent?.footerInfo?.tagline ||
                'We provide comprehensive premium branding, graphic designs, advanced video/reel editing, high-converting websites, organic SEO, and advertising campaign administration.'}
            </p>
          </div>

          {/* Quick Page Routes */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-extrabold text-sm text-white tracking-wider uppercase border-b border-slate-800 pb-2">
              Website Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5">
                  <Icons.ChevronRight className="w-3 h-3 text-indigo-500" />
                  <span>Home</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/services')} className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5">
                  <Icons.ChevronRight className="w-3 h-3 text-indigo-500" />
                  <span>All Services Catalog</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/quote-estimator')} className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5">
                  <Icons.ChevronRight className="w-3 h-3 text-indigo-500" />
                  <span>Quote Estimator</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/about')} className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5">
                  <Icons.ChevronRight className="w-3 h-3 text-indigo-500" />
                  <span>About Us</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contact')} className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5">
                  <Icons.ChevronRight className="w-3 h-3 text-indigo-500" />
                  <span>Contact Us</span>
                </button>
              </li>
              <li className="pt-2 border-t border-slate-800/80">
                <button onClick={() => navigate('/portal/login')} className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5 font-semibold">
                  <Icons.UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Client Login / Register</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Communication Info */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-extrabold text-sm text-white tracking-wider uppercase border-b border-slate-800 pb-2">
              Connect Directly
            </h4>

            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-center gap-3">
                <div className="p-2 bg-green-950 text-green-400 rounded-lg">
                  <Icons.Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">WhatsApp & Phone</span>
                  <a
                    href={`https://wa.me/${websiteContent?.footerInfo?.phone || '917017324978'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-200 hover:text-green-400 font-extrabold text-sm mt-0.5 inline-block"
                  >
                    {websiteContent?.footerInfo?.phone || '+91 70173 24978'}
                  </a>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <div className="p-2 bg-indigo-950 text-indigo-400 rounded-lg">
                  <Icons.Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Corporate Email</span>
                  <a
                    href={`mailto:${websiteContent?.footerInfo?.email || 'support.dizopulse@gmail.com'}`}
                    className="text-slate-200 hover:text-indigo-400 font-semibold mt-0.5 inline-block"
                  >
                    {websiteContent?.footerInfo?.email || 'support.dizopulse@gmail.com'}
                  </a>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <div className="p-2 bg-pink-950 text-pink-400 rounded-lg">
                  <Icons.Instagram className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Instagram</span>
                  <a
                    href={`https://instagram.com/${(websiteContent?.footerInfo?.instagram || '@dizo_pulse').replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-200 hover:text-pink-400 font-semibold mt-0.5 inline-block"
                  >
                    {websiteContent?.footerInfo?.instagram || '@dizo_pulse'}
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Links and Copyright */}
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 flex flex-col items-center justify-center text-[11px] text-slate-500 gap-3">
          <div className="flex gap-4 flex-wrap justify-center">
            <button onClick={() => navigate('/about')} className="hover:text-indigo-400 cursor-pointer transition-colors">
              About Us
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={() => navigate('/services')} className="hover:text-indigo-400 cursor-pointer transition-colors">
              Services Catalog
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={() => navigate('/quote-estimator')} className="hover:text-indigo-400 cursor-pointer transition-colors">
              Quote Estimator
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={() => navigate('/contact')} className="hover:text-indigo-400 cursor-pointer transition-colors">
              Contact Us
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={() => navigate('/terms')} className="hover:text-indigo-400 cursor-pointer transition-colors">
              Terms & Conditions
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={() => navigate('/privacy')} className="hover:text-indigo-400 cursor-pointer transition-colors">
              Privacy Policy
            </button>
          </div>
          <p className="cursor-default select-none text-center hover:text-slate-400 transition-colors mt-1">
            © {new Date().getFullYear()} Dizo Pulse Digital Agency. All rights reserved. Designed for premier growth.
          </p>
        </div>
      </footer>

      {/* Floating Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 30 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-white text-indigo-600 border border-slate-200 shadow-xl hover:bg-slate-50 cursor-pointer transition-all duration-300"
            id="scroll-to-top-button"
            title="Scroll to Top"
          >
            <Icons.ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Global Toast Notifications Container */}
      <ToastContainer />
    </div>
  );
}
