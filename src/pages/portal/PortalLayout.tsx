import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../../components/NotificationCenter';

interface PortalLayoutProps {
  currentPath: string;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  badge?: string;
  actionButton?: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  currentPath,
  navigate,
  children,
  pageTitle,
  pageSubtitle,
  badge,
  actionButton
}) => {
  const { currentUser, logOut, isAuthLoading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/portal/dashboard',
      icon: Icons.LayoutDashboard,
      color: 'text-indigo-400',
      activeGradient: 'from-indigo-600 to-cyan-600',
      description: 'Executive overview & KPI pulse'
    },
    {
      id: 'projects',
      label: 'Projects & Milestones',
      path: '/portal/projects',
      icon: Icons.FolderGit2,
      color: 'text-amber-400',
      activeGradient: 'from-amber-600 to-orange-600',
      description: 'Stage progress & approvals'
    },
    {
      id: 'proposals',
      label: 'Proposals',
      path: '/portal/proposals',
      icon: Icons.FileText,
      color: 'text-cyan-400',
      activeGradient: 'from-cyan-600 to-blue-600',
      description: 'Project scopes & quotes'
    },
    {
      id: 'contracts',
      label: 'Contracts',
      path: '/portal/contracts',
      icon: Icons.FileCheck,
      color: 'text-emerald-400',
      activeGradient: 'from-emerald-600 to-teal-600',
      description: 'Agreements & sign-offs'
    },
    {
      id: 'orders',
      label: 'Orders & History',
      path: '/portal/orders',
      icon: Icons.Receipt,
      color: 'text-violet-400',
      activeGradient: 'from-violet-600 to-purple-600',
      description: 'Invoices & billing records'
    },
    {
      id: 'vault',
      label: 'Files & Vault',
      path: '/portal/vault',
      icon: Icons.DownloadCloud,
      color: 'text-sky-400',
      activeGradient: 'from-sky-600 to-cyan-600',
      description: 'Deliverables & brand assets'
    },
    {
      id: 'messages',
      label: 'Project Messages',
      path: '/portal/messages',
      icon: Icons.MessageSquare,
      color: 'text-rose-400',
      activeGradient: 'from-rose-600 to-pink-600',
      description: 'Direct communication with PM'
    },
    {
      id: 'settings',
      label: 'Account Settings',
      path: '/portal/settings',
      icon: Icons.Settings,
      color: 'text-purple-400',
      activeGradient: 'from-purple-600 to-indigo-600',
      description: 'Security & contact profile'
    }
  ];

  const handleSignOut = async () => {
    try {
      await logOut();
      navigate('/portal/login', { replace: true });
    } catch (e) {
      console.error('Sign out error:', e);
      navigate('/portal/login', { replace: true });
    }
  };

  const handleNotificationNavigate = (
    section: 'proposals' | 'contracts' | 'projects' | 'assets' | 'messages',
    entityId?: string
  ) => {
    if (section === 'proposals') {
      navigate(entityId ? `/portal/proposals/${entityId}` : '/portal/proposals');
    } else if (section === 'contracts') {
      navigate(entityId ? `/portal/contracts/${entityId}` : '/portal/contracts');
    } else if (section === 'projects') {
      navigate('/portal/projects');
    } else if (section === 'assets') {
      navigate('/portal/vault');
    } else if (section === 'messages') {
      navigate('/portal/messages');
    }
  };

  const isNavActive = (itemPath: string) => {
    if (itemPath === '/portal/dashboard') {
      return currentPath === '/portal/dashboard' || currentPath === '/portal';
    }
    return currentPath.startsWith(itemPath);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white" id="portal-root-layout">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 max-w-full overflow-x-hidden">
        {/* Left: Brand + Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Toggle Portal Menu"
          >
            {mobileNavOpen ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={() => navigate('/portal/dashboard')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-950/60 group-hover:scale-105 transition-transform shrink-0">
              <Icons.Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors truncate">
                  DIZO<span className="text-cyan-400">PULSE</span>
                </span>
                <span className="hidden xxs:inline-block px-1.5 sm:px-2 py-0.5 bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md shrink-0">
                  Portal
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block truncate">
                Workspace & Deliverables Hub
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Center */}
          <NotificationCenter
            userEmail={currentUser?.email}
            onNavigateToSection={handleNotificationNavigate}
          />

          {/* Quick WhatsApp Support */}
          <a
            href="https://wa.me/917017324978?text=Hello%20Dizo%20Pulse%20Support%2C%20I%20have%20an%20inquiry%20regarding%20my%20client%20portal%20workspace."
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="Chat directly on WhatsApp"
          >
            <Icons.MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Support Lead</span>
          </a>

          {/* Back to Public Website */}
          <button
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Icons.ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-xs font-black text-white shrink-0">
                {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').slice(0, 2) : 'C'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold leading-tight truncate max-w-[120px]">
                  {currentUser?.name || 'Valued Client'}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {currentUser?.company || 'Business Client'}
                </p>
              </div>
              <Icons.ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs"
                  >
                    <div className="px-3 py-2.5 border-b border-slate-800">
                      <p className="font-extrabold text-white truncate">{currentUser?.name || 'Client User'}</p>
                      <p className="text-slate-400 text-[11px] truncate font-mono">{currentUser?.email}</p>
                      {currentUser?.company && (
                        <p className="text-indigo-400 text-[11px] font-semibold mt-0.5">{currentUser.company}</p>
                      )}
                    </div>

                    <div className="py-1.5 space-y-0.5">
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigate('/portal/dashboard'); }}
                        className="w-full px-3 py-2 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Icons.LayoutDashboard className="w-4 h-4 text-indigo-400" />
                        <span>Command Center</span>
                      </button>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigate('/portal/settings'); }}
                        className="w-full px-3 py-2 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Icons.Settings className="w-4 h-4 text-purple-400" />
                        <span>Account Settings</span>
                      </button>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigate('/quote-estimator'); }}
                        className="w-full px-3 py-2 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Icons.PlusCircle className="w-4 h-4 text-cyan-400" />
                        <span>Request New Project</span>
                      </button>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800">
                      <button
                        onClick={() => { setProfileDropdownOpen(false); handleSignOut(); }}
                        className="w-full px-3 py-2 rounded-xl text-left text-red-400 hover:text-red-300 hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer font-bold"
                      >
                        <Icons.LogOut className="w-4 h-4" />
                        <span>Sign Out of Portal</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 shrink-0 overflow-y-auto justify-between">
          <div className="space-y-6">
            {/* Account Quick Card */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white shadow-md shrink-0">
                  {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').slice(0, 2) : 'CL'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white truncate">
                    {currentUser?.name || 'Authorized Client'}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentUser?.company || 'Business Client'}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online Workspace
                </span>
                <span className="text-slate-400 font-mono">Dizo Client</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Workspace Navigation
              </p>
              {navItems.map((item) => {
                const active = isNavActive(item.path);
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left group ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${active ? 'text-white' : item.color} group-hover:scale-110 transition-transform`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {active && (
                      <Icons.ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Help / Project Manager Box */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 text-[11px] space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
                  AS
                </div>
                <div>
                  <p className="font-bold text-white leading-tight">Aisha Sharma</p>
                  <p className="text-[9px] text-slate-400">Senior Project Lead</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Need urgent project revisions or custom deliverables?
              </p>
              <a
                href="https://wa.me/917017324978"
                target="_blank"
                rel="noreferrer"
                className="w-full py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[10px]"
              >
                <Icons.MessageSquare className="w-3 h-3 text-emerald-400" />
                <span>Message PM</span>
              </a>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2 px-3 rounded-xl border border-slate-800 hover:border-red-900/60 text-slate-400 hover:text-red-400 hover:bg-red-950/20 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Icons.LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setMobileNavOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between z-10 overflow-y-auto"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">
                        DP
                      </div>
                      <span className="font-black text-sm text-white">Portal Navigation</span>
                    </div>
                    <button
                      onClick={() => setMobileNavOpen(false)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const active = isNavActive(item.path);
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setMobileNavOpen(false);
                            navigate(item.path);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                            active
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <IconComponent className={`w-4 h-4 ${active ? 'text-white' : item.color}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <button
                    onClick={() => {
                      setMobileNavOpen(false);
                      navigate('/');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Icons.Home className="w-3.5 h-3.5" />
                    <span>Return to Website</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileNavOpen(false);
                      handleSignOut();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-red-950/40 text-red-400 text-xs font-bold flex items-center justify-center gap-2 border border-red-900/60"
                  >
                    <Icons.LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Routed Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6" id="portal-content-scroll-container">
          {/* Header Banner if provided */}
          {(pageTitle || actionButton) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {pageTitle}
                  </h1>
                  {badge && (
                    <span className="px-2.5 py-0.5 bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-black uppercase tracking-wider rounded-full">
                      {badge}
                    </span>
                  )}
                </div>
                {pageSubtitle && (
                  <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
                    {pageSubtitle}
                  </p>
                )}
              </div>

              {actionButton && (
                <div className="shrink-0">
                  {actionButton}
                </div>
              )}
            </div>
          )}

          {/* Children Page Content */}
          <div className="relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default PortalLayout;
