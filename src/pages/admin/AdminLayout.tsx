import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminNavigation, AdminTab, AdminHeaderBar } from '../../components/AdminNavigation';
import { AdminAccessDenied } from './AdminAccessDenied';
import { showToast } from '../../components/UIPolish';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  currentPath: string;
  navigate: (path: string) => void;
  requiredModule?: string;
  pageTitle?: string;
  pageDescription?: string;
  contextualActions?: {
    onNewLead?: () => void;
    onExportCSV?: () => void;
    onNewProposal?: () => void;
    onRefreshData?: () => void;
  };
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  currentPath,
  navigate,
  requiredModule,
  pageTitle,
  pageDescription,
  contextualActions,
}) => {
  const { isAuthenticated, adminUser, isLoading, logout, isModuleAllowed, updateUserPassword } = useAdminAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dynamic counts for sidebar badges
  const [counts, setCounts] = useState<{
    totalLeadsCount?: number;
    proposalsCount?: number;
    contractsCount?: number;
    activeProjectsCount?: number;
    unreadMessagesCount?: number;
    registeredUsersCount?: number;
    staffListCount?: number;
  }>({});

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log(`[AdminLayout:AuthGuard] Unauthenticated access detected. Redirecting to /admin/login from "${currentPath}"`);
      navigate(`/admin/login?returnUrl=${encodeURIComponent(currentPath || '/admin/dashboard')}`);
    } else if (!isLoading && isAuthenticated) {
      console.log(`[AdminLayout:AuthGuard] Authenticated admin session active (${adminUser?.email}, role: ${adminUser?.role}) on "${currentPath}"`);
    }
  }, [isLoading, isAuthenticated, currentPath, navigate, adminUser]);

  // Load counts for sidebar badges
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadBadgeCounts = async () => {
      try {
        const [inqRes, propRes, ctrRes, prjRes, msgRes, usrRes, stfRes] = await Promise.allSettled([
          fetch('/api/inquiries').then(r => r.ok ? r.json() : []),
          fetch('/api/proposals').then(r => r.ok ? r.json() : []),
          fetch('/api/contracts').then(r => r.ok ? r.json() : []),
          fetch('/api/projects').then(r => r.ok ? r.json() : []),
          fetch('/api/conversations').then(r => r.ok ? r.json() : []),
          fetch('/api/admin/users').then(r => r.ok ? r.json() : []),
          fetch('/api/admin/staff').then(r => r.ok ? r.json() : [])
        ]);

        const inqs = inqRes.status === 'fulfilled' && Array.isArray(inqRes.value) ? inqRes.value : [];
        const props = propRes.status === 'fulfilled' && Array.isArray(propRes.value) ? propRes.value : [];
        const ctrs = ctrRes.status === 'fulfilled' && Array.isArray(ctrRes.value) ? ctrRes.value : [];
        const prjs = prjRes.status === 'fulfilled' && Array.isArray(prjRes.value) ? prjRes.value : [];
        const msgs = msgRes.status === 'fulfilled' && Array.isArray(msgRes.value) ? msgRes.value : [];
        const usrs = usrRes.status === 'fulfilled' && Array.isArray(usrRes.value) ? usrRes.value : [];
        const stfs = stfRes.status === 'fulfilled' && Array.isArray(stfRes.value) ? stfRes.value : [];

        setCounts({
          totalLeadsCount: inqs.filter((i: any) => !i.archived && i.status !== 'closed').length,
          proposalsCount: props.filter((p: any) => p.status === 'Sent' || p.status === 'Viewed' || p.status === 'Draft').length,
          contractsCount: ctrs.filter((c: any) => c.status !== 'Approved' && c.status !== 'Terminated').length,
          activeProjectsCount: prjs.filter((p: any) => p.status !== 'Completed' && p.status !== 'Cancelled').length,
          unreadMessagesCount: msgs.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0),
          registeredUsersCount: usrs.length,
          staffListCount: stfs.length,
        });
      } catch (err) {
        console.error('Error fetching admin navigation counts:', err);
      }
    };

    loadBadgeCounts();
  }, [isAuthenticated, activeTab]);

  // Tab to path mapper
  const handleTabChange = (tabId: AdminTab) => {
    switch (tabId) {
      case 'overview':
        navigate('/admin/dashboard');
        break;
      case 'pipeline':
      case 'clients':
        navigate('/admin/crm');
        break;
      case 'proposals':
        navigate('/admin/proposals');
        break;
      case 'contracts':
        navigate('/admin/contracts');
        break;
      case 'projects':
        navigate('/admin/projects');
        break;
      case 'messages':
        navigate('/admin/messages');
        break;
      case 'assets':
        navigate('/admin/assets');
        break;
      case 'analytics':
        navigate('/admin/analytics');
        break;
      case 'pricing':
        navigate('/admin/services');
        break;
      case 'website_content':
        navigate('/admin/content');
        break;
      case 'seo':
        navigate('/admin/seo');
        break;
      case 'staff':
        navigate('/admin/staff');
        break;
      case 'settings':
      case 'branding':
      case 'payment':
      case 'integrations':
      case 'security':
      case 'audit_logs':
      case 'users':
        navigate('/admin/settings');
        break;
      default:
        navigate('/admin/dashboard');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!newPass.trim()) {
      setPassError('New password cannot be empty.');
      return;
    }
    if (newPass.length < 4) {
      setPassError('Password must be at least 4 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      const res = await updateUserPassword(oldPass, newPass);
      if (res.success) {
        setPassSuccess(res.message);
        showToast('Password Updated', 'Your admin password was changed successfully.', 'success');
        setTimeout(() => {
          setShowPasswordModal(false);
          setOldPass('');
          setNewPass('');
          setConfirmPass('');
          setPassSuccess('');
        }, 1500);
      } else {
        setPassError(res.message);
      }
    } catch (err: any) {
      setPassError(err.message || 'Error changing password.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading Operations Workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check RBAC module permission
  const hasAccess = requiredModule ? isModuleAllowed(requiredModule) : true;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <AdminNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userRole={adminUser?.role || 'admin'}
        userName={adminUser?.name || 'Staff'}
        userEmail={adminUser?.email || ''}
        userPermissions={adminUser?.permissions || {}}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        onLogout={logout}
        onBackToSite={() => navigate('/')}
        onChangePassword={() => setShowPasswordModal(true)}
        counts={counts}
        contextualActions={contextualActions}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-slate-900/60 overflow-y-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header Bar */}
        <AdminHeaderBar
          activeTab={activeTab}
          userRole={adminUser?.role || 'admin'}
          contextualActions={contextualActions}
          onChangePassword={() => setShowPasswordModal(true)}
          onBackToSite={() => navigate('/')}
        />

        {/* Page Content or RBAC Access Denied */}
        {!hasAccess ? (
          <AdminAccessDenied
            moduleName={pageTitle || activeTab}
            requiredRole={adminUser?.role === 'staff' ? 'Manager or Admin' : 'Super Administrator'}
            onNavigate={navigate}
          />
        ) : (
          <div className="space-y-6">
            {children}
          </div>
        )}
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Icons.Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Change Staff Password</h3>
                  <p className="text-[11px] text-slate-400">{adminUser?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {passError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <Icons.AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <Icons.CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPass}
                  onChange={e => setOldPass(e.target.value)}
                  placeholder="Enter current password (if set)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  {isUpdatingPass ? (
                    <>
                      <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
