import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'pipeline'
  | 'proposals'
  | 'contracts'
  | 'projects'
  | 'messages'
  | 'assets'
  | 'clients'
  | 'audit_logs'
  | 'security'
  | 'branding'
  | 'payment'
  | 'pricing'
  | 'users'
  | 'staff'
  | 'analytics'
  | 'website_content'
  | 'seo'
  | 'integrations'
  | 'settings';

export interface NavItemDef {
  id: AdminTab;
  label: string;
  description: string;
  group: 'CRM' | 'Operations' | 'Client Management' | 'Team' | 'Content & Settings' | 'Security';
  iconName: string;
  badgeCount?: number;
  badgeVariant?: 'indigo' | 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber';
}

export interface NavGroupDef {
  name: 'CRM' | 'Operations' | 'Client Management' | 'Team' | 'Content & Settings' | 'Security';
  label: string;
  iconName: string;
}

export const NAV_GROUPS: NavGroupDef[] = [
  { name: 'CRM', label: 'CRM & Sales', iconName: 'TrendingUp' },
  { name: 'Operations', label: 'Operations & Execution', iconName: 'Kanban' },
  { name: 'Client Management', label: 'Client Management', iconName: 'Users2' },
  { name: 'Team', label: 'Team & Organization', iconName: 'Users' },
  { name: 'Content & Settings', label: 'Content & Settings', iconName: 'Sliders' },
  { name: 'Security', label: 'Security & Governance', iconName: 'ShieldAlert' },
];

export const NAV_ITEMS: NavItemDef[] = [
  // CRM Group
  {
    id: 'overview',
    label: 'Operations Overview',
    description: 'Executive KPI metrics, revenue velocity & daily digest',
    group: 'CRM',
    iconName: 'LayoutDashboard',
  },
  {
    id: 'pipeline',
    label: 'Leads & Orders',
    description: 'Lead acquisition CRM pipeline & deal stage tracker',
    group: 'CRM',
    iconName: 'Layers',
  },
  {
    id: 'clients',
    label: 'Client 360° CRM',
    description: 'Unified client profiles, history & workspace accounts',
    group: 'CRM',
    iconName: 'UserCheck',
  },
  {
    id: 'proposals',
    label: 'Proposals Engine',
    description: 'Custom proposal generator, approval tracking & PDF exports',
    group: 'CRM',
    iconName: 'FileText',
  },
  {
    id: 'contracts',
    label: 'Contracts Hub',
    description: 'Legal agreement signatures & SLA milestones',
    group: 'CRM',
    iconName: 'FileCheck',
  },

  // Operations Group
  {
    id: 'projects',
    label: 'Project Kanban & Tasks',
    description: 'Deliverable workflows, milestone deadlines & board status',
    group: 'Operations',
    iconName: 'Kanban',
  },
  {
    id: 'messages',
    label: 'Communication Hub',
    description: 'Real-time client messaging, project updates & threads',
    group: 'Operations',
    iconName: 'MessageSquare',
  },
  {
    id: 'assets',
    label: 'Assets & Media Vault',
    description: 'Centralized client deliverables, brand kits & cloud assets',
    group: 'Operations',
    iconName: 'FolderArchive',
  },
  {
    id: 'analytics',
    label: 'Performance Insights',
    description: 'Business intelligence, revenue charts & conversion stats',
    group: 'Operations',
    iconName: 'BarChart3',
  },

  // Client Management Group
  {
    id: 'users',
    label: 'Client Accounts',
    description: 'Manage client portal credentials, passwords & access',
    group: 'Client Management',
    iconName: 'UserCog',
  },

  // Team Group
  {
    id: 'staff',
    label: 'Team & Role Permissions',
    description: 'Agency staff directory, role matrix & access levels',
    group: 'Team',
    iconName: 'Users',
  },

  // Content & Settings Group
  {
    id: 'pricing',
    label: 'Services & Pricing',
    description: 'Agency service catalog, packages & MRP pricing',
    group: 'Content & Settings',
    iconName: 'Tag',
  },
  {
    id: 'branding',
    label: 'Agency Theme',
    description: 'White-label logo, color theme & portal customization',
    group: 'Content & Settings',
    iconName: 'Palette',
  },
  {
    id: 'website_content',
    label: 'Website Content Manager',
    description: 'Edit public homepage hero, offers, testimonials, FAQs, statistics & footer',
    group: 'Content & Settings',
    iconName: 'Globe',
  },
  {
    id: 'seo',
    label: 'SEO & Social Sharing',
    description: 'Global SEO titles, Open Graph & Twitter cards, sitemap.xml & page metadata',
    group: 'Content & Settings',
    iconName: 'SearchCheck',
  },
  {
    id: 'integrations',
    label: 'Integrations & API Settings',
    description: 'Manage Email, WhatsApp, Cloud Storage, Analytics & Payment API credentials and connections',
    group: 'Content & Settings',
    iconName: 'PlugZap',
  },
  {
    id: 'payment',
    label: 'Payments & QR Config',
    description: 'Payment collection QR codes, UPI IDs & bank details',
    group: 'Content & Settings',
    iconName: 'QrCode',
  },
  {
    id: 'settings',
    label: 'System Settings',
    description: 'Global configuration, tax setup & automated triggers',
    group: 'Content & Settings',
    iconName: 'Sliders',
  },

  // Security Group
  {
    id: 'security',
    label: 'Security & Sessions',
    description: 'Active login sessions, device management, password locks & security policies',
    group: 'Security',
    iconName: 'ShieldCheck',
  },
  {
    id: 'audit_logs',
    label: 'Audit & Security Logs',
    description: 'Immutable system audit trails, login records & security alerts',
    group: 'Security',
    iconName: 'ShieldAlert',
  },
];

interface AdminNavigationProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  userRole: string;
  userName: string;
  userEmail: string;
  userPermissions: any;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  onBackToSite?: () => void;
  onChangePassword: () => void;
  counts: {
    totalLeadsCount?: number;
    proposalsCount?: number;
    contractsCount?: number;
    activeProjectsCount?: number;
    unreadMessagesCount?: number;
    registeredUsersCount?: number;
    staffListCount?: number;
  };
  contextualActions?: {
    onNewLead?: () => void;
    onExportCSV?: () => void;
    onNewProposal?: () => void;
    onRefreshData?: () => void;
  };
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  activeTab,
  onTabChange,
  userRole,
  userName,
  userEmail,
  userPermissions,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  onLogout,
  onBackToSite,
  onChangePassword,
  counts,
  contextualActions,
}) => {
  // --- PERSISTENT SIDEBAR COLLAPSE STATE ---
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dizopulse_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('dizopulse_admin_sidebar_collapsed', String(next));
      } catch (err) {
        console.error('Error saving sidebar collapse state:', err);
      }
      return next;
    });
  };

  // --- PERSISTENT GROUP COLLAPSE STATES ---
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('dizopulse_admin_groups_collapsed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups(prev => {
      const next = { ...prev, [groupName]: !prev[groupName] };
      try {
        localStorage.setItem('dizopulse_admin_groups_collapsed', JSON.stringify(next));
      } catch (err) {
        console.error('Error saving group collapse state:', err);
      }
      return next;
    });
  };

  // --- PERSISTENT PINNED / FAVORITES ITEMS ---
  const [pinnedTabs, setPinnedTabs] = useState<AdminTab[]>(() => {
    try {
      const saved = localStorage.getItem('dizopulse_admin_pinned_tabs');
      return saved ? JSON.parse(saved) : ['overview', 'pipeline', 'projects'];
    } catch {
      return ['overview', 'pipeline', 'projects'];
    }
  });

  const togglePinTab = (tabId: AdminTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedTabs(prev => {
      const isPinned = prev.includes(tabId);
      const next = isPinned ? prev.filter(t => t !== tabId) : [...prev, tabId];
      try {
        localStorage.setItem('dizopulse_admin_pinned_tabs', JSON.stringify(next));
      } catch (err) {
        console.error('Error saving pinned tabs:', err);
      }
      return next;
    });
  };

  // --- PERSISTENT RECENTLY VISITED PAGES ---
  const [recentTabs, setRecentTabs] = useState<AdminTab[]>(() => {
    try {
      const saved = localStorage.getItem('dizopulse_admin_recent_tabs');
      return saved ? JSON.parse(saved) : ['overview', 'pipeline'];
    } catch {
      return ['overview', 'pipeline'];
    }
  });

  // Track tab visits
  useEffect(() => {
    if (!activeTab) return;
    setRecentTabs(prev => {
      const filtered = prev.filter(t => t !== activeTab);
      const updated = [activeTab, ...filtered].slice(0, 4);
      try {
        localStorage.setItem('dizopulse_admin_recent_tabs', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving recent tabs:', err);
      }
      return updated;
    });
  }, [activeTab]);

  // --- SIDEBAR SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- ROLE-BASED AUTHORIZATION CHECK (RBAC) ---
  const isTabAllowed = (tabId: AdminTab): boolean => {
    if (userRole === 'super_admin' || userRole === 'admin') return true;

    // For manager or staff roles:
    if (tabId === 'overview' || tabId === 'pipeline' || tabId === 'clients' || tabId === 'audit_logs' || tabId === 'security') {
      return true;
    }
    if (tabId === 'proposals') return userPermissions?.proposals && userPermissions.proposals !== 'none';
    if (tabId === 'contracts') return userPermissions?.contracts && userPermissions.contracts !== 'none';
    if (tabId === 'projects') return userPermissions?.projects && userPermissions.projects !== 'none';
    if (tabId === 'messages') return userPermissions?.messages && userPermissions.messages !== 'none';
    if (tabId === 'assets') return userPermissions?.assets && userPermissions.assets !== 'none';
    if (tabId === 'analytics') return userRole === 'manager';
    if (tabId === 'users' || tabId === 'pricing' || tabId === 'branding' || tabId === 'payment' || tabId === 'seo' || tabId === 'website_content' || tabId === 'integrations' || tabId === 'settings') {
      return userPermissions?.settings && userPermissions.settings !== 'none';
    }
    if (tabId === 'staff') return false; // Staff management is restricted to admin/super_admin
    return true;
  };

  // Filter items by RBAC and search query
  const allowedItems = useMemo(() => {
    return NAV_ITEMS.filter(item => isTabAllowed(item.id));
  }, [userRole, userPermissions]);

  const searchFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allowedItems;
    const q = searchQuery.toLowerCase();
    return allowedItems.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [allowedItems, searchQuery]);

  // Map dynamic count badges
  const getItemBadge = (tabId: AdminTab) => {
    switch (tabId) {
      case 'pipeline':
        return counts.totalLeadsCount && counts.totalLeadsCount > 0 ? { count: counts.totalLeadsCount, label: '' } : null;
      case 'proposals':
        return counts.proposalsCount && counts.proposalsCount > 0 ? { count: counts.proposalsCount, label: '' } : null;
      case 'contracts':
        return counts.contractsCount && counts.contractsCount > 0 ? { count: counts.contractsCount, label: '' } : null;
      case 'projects':
        return counts.activeProjectsCount && counts.activeProjectsCount > 0 ? { count: counts.activeProjectsCount, label: 'active' } : null;
      case 'messages':
        return counts.unreadMessagesCount && counts.unreadMessagesCount > 0 ? { count: counts.unreadMessagesCount, label: '', pulse: true } : null;
      case 'users':
        return counts.registeredUsersCount && counts.registeredUsersCount > 0 ? { count: counts.registeredUsersCount, label: '' } : null;
      case 'staff':
        return counts.staffListCount && counts.staffListCount > 0 ? { count: counts.staffListCount, label: '' } : null;
      default:
        return null;
    }
  };

  // Active Item Def
  const activeItem = useMemo(() => {
    return NAV_ITEMS.find(item => item.id === activeTab) || NAV_ITEMS[0];
  }, [activeTab]);

  const handleSelectTab = (tabId: AdminTab) => {
    onTabChange(tabId);
    setIsMobileSidebarOpen(false);
  };

  const renderIcon = (iconName: string, className: string) => {
    const Component = (Icons as any)[iconName] || Icons.Circle;
    return <Component className={className} />;
  };

  return (
    <>
      {/* MOBILE TOP BAR NAVIGATION HEADER */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle navigation menu"
          >
            {isMobileSidebarOpen ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xs text-white shadow-sm">
              DP
            </div>
            <div>
              <span className="text-xs font-black uppercase text-white tracking-wider block leading-tight">Dizo Pulse</span>
              <span className="text-[9px] text-indigo-400 font-bold block leading-none">{activeItem.label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToSite && (
            <button
              onClick={onBackToSite}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
              title="Return to Public Website"
            >
              <Icons.Globe className="w-4 h-4 text-indigo-400" />
            </button>
          )}
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Live
          </span>
          <button
            onClick={onChangePassword}
            className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:text-white"
            title="Change Password"
          >
            <Icons.Key className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION (DESKTOP STICKY & MOBILE DRAWER) */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40 h-screen bg-slate-900 text-slate-300 border-r border-slate-800/80 flex flex-col justify-between shadow-2xl transition-all duration-300 shrink-0
          ${isMobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${!isMobileSidebarOpen && (isCollapsed ? 'md:w-20' : 'md:w-72')}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-500/20 shrink-0">
              DP
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="text-sm font-black text-white tracking-wide uppercase truncate">Dizo Pulse</h2>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 inline-block mt-0.5 truncate">
                  Admin Panel
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button (Desktop) */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all cursor-pointer border border-slate-700/50"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <Icons.ChevronRight className="w-4 h-4" /> : <Icons.ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close Mobile Drawer */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* SEARCH BAR (WHEN EXPANDED) */}
        {!isCollapsed && (
          <div className="p-3 border-b border-slate-800/60 bg-slate-950/20 shrink-0">
            <div className="relative">
              <Icons.Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* SIDEBAR MAIN MENU ITEMS SCROLL AREA */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
          {/* SEARCH RESULTS VIEW */}
          {searchQuery.trim() ? (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span>Matching Modules</span>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">
                  {searchFilteredItems.length}
                </span>
              </div>
              {searchFilteredItems.length === 0 ? (
                <div className="text-center py-6 px-3">
                  <Icons.SearchX className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">No modules found</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Try searching for "Leads", "Projects", etc.</p>
                </div>
              ) : (
                searchFilteredItems.map(item => {
                  const isActive = activeTab === item.id;
                  const badge = getItemBadge(item.id);
                  const isPinned = pinnedTabs.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderIcon(item.iconName, `w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`)}
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : badge.pulse
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-slate-800 text-indigo-300 border border-slate-700'
                            }`}
                          >
                            {badge.count} {badge.label}
                          </span>
                        )}
                        <span
                          onClick={e => togglePinTab(item.id, e)}
                          className={`p-1 rounded-md hover:bg-white/10 ${isPinned ? 'text-amber-400' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`}
                          title={isPinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Icons.Star className="w-3 h-3 fill-current" />
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <>
              {/* SECTION 1: PINNED / FAVORITES (IF ANY & ALLOWED) */}
              {pinnedTabs.length > 0 && (
                <div className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-2 text-[10px] font-black uppercase tracking-wider text-amber-400/90 mb-1.5 flex items-center gap-1.5">
                      <Icons.Star className="w-3 h-3 fill-amber-400/80 text-amber-400" />
                      <span>Pinned Modules</span>
                    </div>
                  )}

                  {pinnedTabs
                    .map(tabId => allowedItems.find(i => i.id === tabId))
                    .filter((item): item is NavItemDef => Boolean(item))
                    .map(item => {
                      const isActive = activeTab === item.id;
                      const badge = getItemBadge(item.id);

                      return (
                        <div key={`pinned-${item.id}`} className="relative group">
                          <button
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                            } ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                            title={isCollapsed ? `${item.label} (Pinned)` : undefined}
                          >
                            <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
                              {renderIcon(
                                item.iconName,
                                `w-4 h-4 shrink-0 ${
                                  isActive ? 'text-white' : 'text-amber-400'
                                }`
                              )}
                              {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </div>

                            {!isCollapsed && (
                              <div className="flex items-center gap-1 shrink-0">
                                {badge && (
                                  <span
                                    className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                                      isActive
                                        ? 'bg-white/20 text-white'
                                        : badge.pulse
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-slate-800 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {badge.count}
                                  </span>
                                )}
                                <span
                                  onClick={e => togglePinTab(item.id, e)}
                                  className="p-1 text-amber-400 hover:text-rose-400 rounded-md"
                                  title="Unpin"
                                >
                                  <Icons.Star className="w-3 h-3 fill-current" />
                                </span>
                              </div>
                            )}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* SECTION 2: RECENTLY VISITED QUICK ACCESS (IF NOT COLLAPSED) */}
              {!isCollapsed && recentTabs.length > 0 && (
                <div className="pt-1 pb-1">
                  <div className="px-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1">
                    <Icons.Clock className="w-3 h-3 text-slate-500" />
                    <span>Recent Pages</span>
                  </div>
                  <div className="flex flex-wrap gap-1 px-1">
                    {recentTabs
                      .map(tabId => allowedItems.find(i => i.id === tabId))
                      .filter((item): item is NavItemDef => Boolean(item))
                      .map(item => (
                        <button
                          key={`recent-${item.id}`}
                          onClick={() => handleSelectTab(item.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            activeTab === item.id
                              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          {renderIcon(item.iconName, 'w-3 h-3 text-slate-400')}
                          <span className="truncate max-w-[90px]">{item.label.split(' ')[0]}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: GROUPED SECTIONS & SUBMENUS */}
              {NAV_GROUPS.map(group => {
                const groupItems = allowedItems.filter(i => i.group === group.name);
                if (groupItems.length === 0) return null;

                const isGroupCollapsed = Boolean(collapsedGroups[group.name]);

                return (
                  <div key={group.name} className="space-y-1 pt-1">
                    {/* Group Header */}
                    {!isCollapsed ? (
                      <button
                        onClick={() => toggleGroupCollapse(group.name)}
                        className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-1.5">
                          {renderIcon(group.iconName, 'w-3 h-3 text-slate-500 group-hover:text-indigo-400')}
                          <span>{group.label}</span>
                        </div>
                        <Icons.ChevronDown
                          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                            isGroupCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                        />
                      </button>
                    ) : (
                      <div className="my-2 border-t border-slate-800/80" />
                    )}

                    {/* Submenu Items */}
                    {(!isGroupCollapsed || isCollapsed) && (
                      <div className="space-y-1">
                        {groupItems.map(item => {
                          const isActive = activeTab === item.id;
                          const badge = getItemBadge(item.id);
                          const isPinned = pinnedTabs.includes(item.id);

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectTab(item.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer group relative ${
                                isActive
                                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                              } ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                              title={isCollapsed ? `${item.label} — ${item.description}` : undefined}
                            >
                              {/* Active Left Indicator Bar */}
                              {isActive && !isCollapsed && (
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full shadow-xs" />
                              )}

                              <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
                                {renderIcon(
                                  item.iconName,
                                  `w-4 h-4 shrink-0 transition-colors ${
                                    isActive
                                      ? 'text-white'
                                      : 'text-indigo-400/90 group-hover:text-indigo-300'
                                  }`
                                )}
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                              </div>

                              {!isCollapsed && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {badge && (
                                    <span
                                      className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                                        isActive
                                          ? 'bg-white/20 text-white'
                                          : badge.pulse
                                          ? 'bg-rose-500 text-white animate-pulse'
                                          : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                                      }`}
                                    >
                                      {badge.count} {badge.label}
                                    </span>
                                  )}

                                  <span
                                    onClick={e => togglePinTab(item.id, e)}
                                    className={`p-1 rounded-md hover:bg-white/10 ${
                                      isPinned
                                        ? 'text-amber-400'
                                        : 'text-slate-600 opacity-0 group-hover:opacity-100'
                                    }`}
                                    title={isPinned ? 'Unpin' : 'Pin module'}
                                  >
                                    <Icons.Star className="w-3 h-3 fill-current" />
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* SIDEBAR FOOTER: USER ACTIVE SESSION */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 space-y-2.5 shrink-0">
          <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {userName ? userName.charAt(0).toUpperCase() : 'A'}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{userName || 'Agency Admin'}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{userEmail || 'Active Session'}</div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <span
                className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                  userRole === 'super_admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : userRole === 'admin'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : userRole === 'manager'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {userRole.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className={`flex items-center gap-1.5 ${isCollapsed ? 'flex-col' : ''}`}>
            {onBackToSite && (
              <button
                onClick={onBackToSite}
                className={`py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-500/30 ${
                  isCollapsed ? 'w-full' : 'flex-1'
                }`}
                title="Return to Public Website"
              >
                <Icons.Globe className="w-3.5 h-3.5" />
                {!isCollapsed && <span>Website</span>}
              </button>
            )}

            <button
              onClick={onChangePassword}
              className={`py-1.5 px-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700/60 ${
                isCollapsed || !onBackToSite ? (isCollapsed ? 'w-full' : 'flex-1') : 'px-2.5'
              }`}
              title="Change Password"
            >
              <Icons.Key className="w-3.5 h-3.5 text-indigo-400" />
              {!isCollapsed && !onBackToSite && <span>Password</span>}
            </button>

            <button
              onClick={onLogout}
              className={`py-1.5 px-2.5 bg-slate-800/90 hover:bg-rose-900/40 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40 text-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isCollapsed ? 'w-full' : ''
              }`}
              title="Sign Out"
            >
              <Icons.LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY BACKDROP */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}
    </>
  );
};

// --- TOP HEADER BREADCRUMB & CONTEXTUAL ACTIONS BAR ---
export interface AdminHeaderBarProps {
  activeTab: AdminTab;
  userRole: string;
  contextualActions?: {
    onNewLead?: () => void;
    onExportCSV?: () => void;
    onNewProposal?: () => void;
    onRefreshData?: () => void;
  };
  onChangePassword: () => void;
  onBackToSite?: () => void;
}

export const AdminHeaderBar: React.FC<AdminHeaderBarProps> = ({
  activeTab,
  userRole,
  contextualActions,
  onChangePassword,
  onBackToSite,
}) => {
  const activeItem = NAV_ITEMS.find(i => i.id === activeTab) || NAV_ITEMS[0];

  const renderIcon = (iconName: string, className: string) => {
    const Component = (Icons as any)[iconName] || Icons.Circle;
    return <Component className={className} />;
  };

  return (
    <div className="space-y-4">
      {/* Hierarchical Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Icons.Command className="w-3.5 h-3.5 text-indigo-600" />
            Control Center
          </span>
          <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-400">{activeItem.group}</span>
          <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            {activeItem.label}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onBackToSite && (
            <button
              onClick={onBackToSite}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Return to Public Website"
            >
              <Icons.Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Public Website</span>
            </button>
          )}

          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Data Synced
          </span>

          <button
            onClick={onChangePassword}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.Key className="w-3.5 h-3.5 text-indigo-600" />
            <span>Password</span>
          </button>
        </div>
      </div>

      {/* Page Title & Contextual Action Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl text-indigo-600 dark:text-indigo-400 shrink-0">
            {renderIcon(activeItem.iconName, 'w-6 h-6')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeItem.label}
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 uppercase tracking-wider">
                {activeItem.group}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium leading-relaxed">
              {activeItem.description}
            </p>
          </div>
        </div>

        {/* Dynamic Contextual Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          {activeTab === 'pipeline' && (
            <>
              {contextualActions?.onExportCSV && (
                <button
                  onClick={contextualActions.onExportCSV}
                  className="flex-1 md:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Icons.Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>Export CSV</span>
                </button>
              )}
              {contextualActions?.onNewLead && (
                <button
                  onClick={contextualActions.onNewLead}
                  className="flex-1 md:flex-initial px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Icons.Plus className="w-4 h-4" />
                  <span>Log New Lead</span>
                </button>
              )}
            </>
          )}

          {activeTab === 'proposals' && contextualActions?.onNewProposal && (
            <button
              onClick={contextualActions.onNewProposal}
              className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Icons.Plus className="w-4 h-4" />
              <span>Create New Proposal</span>
            </button>
          )}

          {activeTab === 'overview' && contextualActions?.onRefreshData && (
            <button
              onClick={contextualActions.onRefreshData}
              className="w-full md:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Icons.RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Refresh Metrics</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
