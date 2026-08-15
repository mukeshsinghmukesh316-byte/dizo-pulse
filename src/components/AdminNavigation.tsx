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
  | 'services'
  | 'content'
  | 'users'
  | 'staff'
  | 'analytics'
  | 'website_content'
  | 'seo'
  | 'integrations'
  | 'settings';

export type NavGroupName = 'OPERATIONS' | 'COMMERCE' | 'GROWTH & CMS' | 'SYSTEM';

export interface NavGroupDef {
  name: NavGroupName;
  label: string;
  iconName: string;
  description: string;
}

export interface NavItemDef {
  id: AdminTab;
  label: string;
  description: string;
  group: NavGroupName;
  iconName: string;
  aliases?: AdminTab[];
  badgeKey?: 'totalLeadsCount' | 'proposalsCount' | 'contractsCount' | 'activeProjectsCount' | 'unreadMessagesCount' | 'staffListCount' | 'registeredUsersCount';
  badgeVariant?: 'indigo' | 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber';
}

export const NAV_GROUPS: NavGroupDef[] = [
  {
    name: 'OPERATIONS',
    label: 'OPERATIONS',
    iconName: 'Activity',
    description: 'Core agency workflows, pipeline CRM and active projects'
  },
  {
    name: 'COMMERCE',
    label: 'COMMERCE',
    iconName: 'BadgeDollarSign',
    description: 'Proposals, legal contracts and service pricing'
  },
  {
    name: 'GROWTH & CMS',
    label: 'GROWTH & CMS',
    iconName: 'Sparkles',
    description: 'Website content manager, SEO metadata and media vault'
  },
  {
    name: 'SYSTEM',
    label: 'SYSTEM',
    iconName: 'Cpu',
    description: 'Staff permissions, business intelligence and security settings'
  },
];

export const NAV_ITEMS: NavItemDef[] = [
  // ==========================================
  // 1. OPERATIONS
  // ==========================================
  {
    id: 'overview',
    label: 'Dashboard',
    description: 'Executive KPI metrics, revenue velocity & daily operations digest',
    group: 'OPERATIONS',
    iconName: 'LayoutDashboard',
    aliases: ['overview']
  },
  {
    id: 'pipeline',
    label: 'CRM',
    description: 'Lead acquisition CRM pipeline, deal tracking & client directory',
    group: 'OPERATIONS',
    iconName: 'Users2',
    aliases: ['pipeline', 'clients'],
    badgeKey: 'totalLeadsCount'
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Deliverable workflows, milestone deadlines & task kanban',
    group: 'OPERATIONS',
    iconName: 'Kanban',
    aliases: ['projects'],
    badgeKey: 'activeProjectsCount'
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Real-time client messaging, project updates & threads',
    group: 'OPERATIONS',
    iconName: 'MessageSquare',
    aliases: ['messages'],
    badgeKey: 'unreadMessagesCount'
  },

  // ==========================================
  // 2. COMMERCE
  // ==========================================
  {
    id: 'proposals',
    label: 'Proposals',
    description: 'Custom proposal generator, approval tracking & PDF exports',
    group: 'COMMERCE',
    iconName: 'FileText',
    aliases: ['proposals'],
    badgeKey: 'proposalsCount'
  },
  {
    id: 'contracts',
    label: 'Contracts',
    description: 'Legal agreement signatures & SLA milestones',
    group: 'COMMERCE',
    iconName: 'FileCheck',
    aliases: ['contracts'],
    badgeKey: 'contractsCount'
  },
  {
    id: 'pricing',
    label: 'Services',
    description: 'Agency service catalog, packages & MRP pricing',
    group: 'COMMERCE',
    iconName: 'Tag',
    aliases: ['pricing', 'services']
  },

  // ==========================================
  // 3. GROWTH & CMS
  // ==========================================
  {
    id: 'website_content',
    label: 'Website Content',
    description: 'Edit public homepage hero, offers, testimonials, FAQs & footer',
    group: 'GROWTH & CMS',
    iconName: 'Globe',
    aliases: ['website_content', 'content']
  },
  {
    id: 'seo',
    label: 'SEO',
    description: 'Global SEO titles, Open Graph & Twitter cards, sitemap & metadata',
    group: 'GROWTH & CMS',
    iconName: 'SearchCheck',
    aliases: ['seo']
  },
  {
    id: 'assets',
    label: 'Assets',
    description: 'Centralized client deliverables, brand kits & media library',
    group: 'GROWTH & CMS',
    iconName: 'FolderArchive',
    aliases: ['assets']
  },

  // ==========================================
  // 4. SYSTEM
  // ==========================================
  {
    id: 'staff',
    label: 'Staff & Access',
    description: 'Agency staff directory, role matrix & access levels',
    group: 'SYSTEM',
    iconName: 'Users',
    aliases: ['staff'],
    badgeKey: 'staffListCount'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Business intelligence, revenue charts & conversion stats',
    group: 'SYSTEM',
    iconName: 'BarChart3',
    aliases: ['analytics']
  },
  {
    id: 'settings',
    label: 'Settings & Security',
    description: 'Global configuration, payment QR, security policies & system preferences',
    group: 'SYSTEM',
    iconName: 'ShieldCheck',
    aliases: ['settings', 'security', 'audit_logs', 'branding', 'payment', 'integrations', 'users']
  },
];

export const getNavItemForTab = (tab: AdminTab): NavItemDef => {
  const found = NAV_ITEMS.find(
    item => item.id === tab || (item.aliases && item.aliases.includes(tab))
  );
  return found || NAV_ITEMS[0];
};

export const isTabActive = (item: NavItemDef, currentTab: AdminTab): boolean => {
  if (item.id === currentTab) return true;
  if (item.aliases && item.aliases.includes(currentTab)) return true;
  return false;
};

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

  // --- SIDEBAR SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- ROLE-BASED AUTHORIZATION CHECK (RBAC) ---
  const isItemAllowed = (item: NavItemDef): boolean => {
    if (userRole === 'super_admin' || userRole === 'admin') return true;

    // Operations
    if (item.id === 'overview') return true;
    if (item.id === 'pipeline') return true;
    if (item.id === 'projects') return userPermissions?.projects && userPermissions.projects !== 'none';
    if (item.id === 'messages') return userPermissions?.messages && userPermissions.messages !== 'none';

    // Commerce
    if (item.id === 'proposals') return userPermissions?.proposals && userPermissions.proposals !== 'none';
    if (item.id === 'contracts') return userPermissions?.contracts && userPermissions.contracts !== 'none';
    if (item.id === 'pricing') return userPermissions?.settings && userPermissions.settings !== 'none';

    // Growth & CMS
    if (item.id === 'website_content' || item.id === 'seo') {
      return userPermissions?.settings && userPermissions.settings !== 'none';
    }
    if (item.id === 'assets') return userPermissions?.assets && userPermissions.assets !== 'none';

    // System
    if (item.id === 'staff') return false; // Staff management is restricted to admin/super_admin
    if (item.id === 'analytics') return userRole === 'manager';
    if (item.id === 'settings') {
      return userPermissions?.settings && userPermissions.settings !== 'none';
    }

    return true;
  };

  // Filter items by RBAC and search query
  const allowedItems = useMemo(() => {
    return NAV_ITEMS.filter(item => isItemAllowed(item));
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

  // Dynamic count badges
  const getItemBadge = (item: NavItemDef) => {
    if (!item.badgeKey) return null;
    const val = counts[item.badgeKey];
    if (!val || val <= 0) return null;

    if (item.badgeKey === 'unreadMessagesCount') {
      return { count: val, label: '', pulse: true };
    }
    if (item.badgeKey === 'activeProjectsCount') {
      return { count: val, label: 'act', pulse: false };
    }
    return { count: val, label: '', pulse: false };
  };

  const activeItem = useMemo(() => {
    return getNavItemForTab(activeTab);
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
      {/* ===================================================================== */}
      {/* MOBILE TOP BAR (DRAWER TOGGLE)                                        */}
      {/* ===================================================================== */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle navigation menu"
            id="admin-mobile-drawer-toggle"
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
            Admin
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

      {/* ===================================================================== */}
      {/* SIDEBAR NAVIGATION (DESKTOP STICKY & MOBILE DRAWER)                   */}
      {/* ===================================================================== */}
      <aside
        id="admin-portal-sidebar"
        className={`
          fixed md:sticky top-0 left-0 z-40 h-screen bg-slate-900 text-slate-300 border-r border-slate-800/80 flex flex-col justify-between shadow-2xl transition-all duration-300 shrink-0
          ${isMobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${!isMobileSidebarOpen && (isCollapsed ? 'md:w-20' : 'md:w-72')}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-500/20 shrink-0">
              DP
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="text-sm font-black text-white tracking-wide uppercase truncate">Dizo Pulse</h2>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 inline-block mt-0.5 truncate">
                  Admin Portal
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Button */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all cursor-pointer border border-slate-700/50"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            id="admin-sidebar-collapse-btn"
          >
            {isCollapsed ? <Icons.ChevronRight className="w-4 h-4" /> : <Icons.ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close Mobile Drawer */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
            id="admin-mobile-drawer-close"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Filter (When Expanded) */}
        {!isCollapsed && (
          <div className="p-3 border-b border-slate-800/60 bg-slate-950/20 shrink-0">
            <div className="relative">
              <Icons.Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search modules & pages..."
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

        {/* Scrollable Navigation Groups & Links */}
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
                  <p className="text-[10px] text-slate-500 mt-0.5">Try searching for "Projects", "Proposals", etc.</p>
                </div>
              ) : (
                searchFilteredItems.map(item => {
                  const isActive = isTabActive(item, activeTab);
                  const badge = getItemBadge(item);

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
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* 4 GROUPED CATEGORIES */
            NAV_GROUPS.map(group => {
              const groupItems = allowedItems.filter(i => i.group === group.name);
              if (groupItems.length === 0) return null;

              const isGroupCollapsed = Boolean(collapsedGroups[group.name]);

              return (
                <div key={group.name} className="space-y-1 pt-1" id={`nav-group-${group.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                  {/* Collapsible Group Header */}
                  {!isCollapsed ? (
                    <button
                      onClick={() => toggleGroupCollapse(group.name)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer group rounded-lg hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-1.5">
                        {renderIcon(group.iconName, 'w-3.5 h-3.5 text-indigo-400/80 group-hover:text-indigo-300')}
                        <span>{group.label}</span>
                      </div>
                      <Icons.ChevronDown
                        className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                          isGroupCollapsed ? '-rotate-90 text-slate-600' : 'rotate-0 text-slate-400'
                        }`}
                      />
                    </button>
                  ) : (
                    <div className="my-2 border-t border-slate-800/80" />
                  )}

                  {/* Group Nav Items */}
                  {(!isGroupCollapsed || isCollapsed) && (
                    <div className="space-y-1">
                      {groupItems.map(item => {
                        const isActive = isTabActive(item, activeTab);
                        const badge = getItemBadge(item);

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group relative ${
                              isActive
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                            } ${isCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                            title={isCollapsed ? `${item.label} — ${item.description}` : undefined}
                            id={`nav-item-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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

                            {!isCollapsed && badge && (
                              <div className="flex items-center gap-1.5 shrink-0">
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
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Active Staff Session */}
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

// ============================================================================
// TOP HEADER BREADCRUMB & CONTEXTUAL ACTIONS BAR
// ============================================================================
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
  const activeItem = getNavItemForTab(activeTab);

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
            <Icons.Command className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
            <Icons.Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
              <Icons.RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Refresh Metrics</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNavigation;
