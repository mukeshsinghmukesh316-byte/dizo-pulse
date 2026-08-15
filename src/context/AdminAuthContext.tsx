import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AdminUser {
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff' | string;
  permissions?: {
    proposals?: 'read' | 'write' | 'none';
    contracts?: 'read' | 'write' | 'none';
    projects?: 'read' | 'write' | 'none';
    assets?: 'read' | 'write' | 'none';
    messages?: 'read' | 'write' | 'none';
    settings?: 'read' | 'write' | 'none';
    [key: string]: any;
  };
  projectAccess?: string[] | 'all';
  sessionToken?: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  isLoading: boolean;
  loginError: string;
  failedAttempts: number;
  lockoutTimeLeft: number;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isModuleAllowed: (moduleId: string) => boolean;
  refreshSession: () => Promise<void>;
  updateUserPassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);

  // Load session from sessionStorage on mount
  useEffect(() => {
    const checkSavedSession = () => {
      console.log('[AdminAuthProvider] Checking saved session in sessionStorage...');
      try {
        const savedAuth = sessionStorage.getItem('dizopulse_admin_auth');
        const savedRole = sessionStorage.getItem('dizopulse_admin_role');
        const savedEmail = sessionStorage.getItem('dizopulse_admin_email');
        const savedName = sessionStorage.getItem('dizopulse_admin_name');
        const savedPerms = sessionStorage.getItem('dizopulse_admin_permissions');
        const savedAccess = sessionStorage.getItem('dizopulse_admin_project_access');
        const savedToken = sessionStorage.getItem('dizopulse_session_token');

        if (savedAuth === 'true' && savedEmail) {
          let perms: any = {
            proposals: 'write',
            contracts: 'write',
            projects: 'write',
            assets: 'write',
            messages: 'write',
            settings: 'write'
          };
          if (savedPerms) {
            try {
              perms = JSON.parse(savedPerms);
            } catch (e) {}
          }

          let projAccess: any = 'all';
          if (savedAccess) {
            try {
              projAccess = JSON.parse(savedAccess);
            } catch (e) {}
          }

          console.log('[AdminAuthProvider] Restored authenticated user session:', {
            email: savedEmail,
            role: savedRole,
            name: savedName
          });

          setIsAuthenticated(true);
          setAdminUser({
            name: savedName || 'Agency Staff',
            email: savedEmail,
            role: savedRole || 'admin',
            permissions: perms,
            projectAccess: projAccess,
            sessionToken: savedToken || undefined
          });

          // Validate token with backend if present
          if (savedToken) {
            fetch('/api/admin/security/validate-session', {
              headers: { 'X-Session-Token': savedToken }
            })
              .then(res => res.json())
              .then(data => {
                if (!data.valid) {
                  console.warn('[AdminAuthProvider] Server session token expired or invalid. Logging out.');
                  logout();
                } else {
                  console.log('[AdminAuthProvider] Session token validated with server.');
                }
              })
              .catch((err) => {
                console.warn('[AdminAuthProvider] Could not validate session with server:', err);
              });
          }
        } else {
          console.log('[AdminAuthProvider] No active admin session found. State set to unauthenticated.');
          setIsAuthenticated(false);
          setAdminUser(null);
        }
      } catch (err) {
        console.error('[AdminAuthProvider] Error recovering admin session:', err);
      } finally {
        setIsLoading(false);
        console.log('[AdminAuthProvider] Session initialization complete. isLoading = false.');
      }
    };

    checkSavedSession();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimeLeft]);

  // Login handler
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoginError('');
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter both Email Address and Password.');
      return false;
    }

    if (lockoutTimeLeft > 0) {
      setLoginError(`System locked. Try again in ${lockoutTimeLeft} seconds.`);
      return false;
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const userObj: AdminUser = {
          name: data.name || email.split('@')[0],
          email: data.email || email.trim(),
          role: data.role || 'admin',
          permissions: data.permissions || {
            proposals: 'write',
            contracts: 'write',
            projects: 'write',
            assets: 'write',
            messages: 'write',
            settings: 'write'
          },
          projectAccess: data.projectAccess || 'all',
          sessionToken: data.sessionToken
        };

        setIsAuthenticated(true);
        setAdminUser(userObj);
        setFailedAttempts(0);

        sessionStorage.setItem('dizopulse_admin_auth', 'true');
        sessionStorage.setItem('dizopulse_admin_role', userObj.role);
        sessionStorage.setItem('dizopulse_admin_email', userObj.email);
        sessionStorage.setItem('dizopulse_admin_name', userObj.name);
        sessionStorage.setItem('dizopulse_admin_permissions', JSON.stringify(userObj.permissions));
        sessionStorage.setItem('dizopulse_admin_project_access', JSON.stringify(userObj.projectAccess));
        if (data.sessionToken) {
          sessionStorage.setItem('dizopulse_session_token', data.sessionToken);
          try {
            document.cookie = `dizopulse_session_token=${encodeURIComponent(data.sessionToken)}; path=/; max-age=604800; SameSite=Lax`;
          } catch {}
        }

        return true;
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLockoutTimeLeft(60);
          setLoginError('Too many failed attempts. System locked for 60 seconds.');
        } else {
          setLoginError(data.error || 'Incorrect email or password.');
        }
        return false;
      }
    } catch (err: any) {
      setLoginError('Network connection error. Please try again.');
      return false;
    }
  };

  // Logout handler
  const logout = useCallback(() => {
    const token = sessionStorage.getItem('dizopulse_session_token');
    if (token) {
      fetch('/api/admin/security/revoke-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: token })
      }).catch(() => {});
    }

    setIsAuthenticated(false);
    setAdminUser(null);
    sessionStorage.removeItem('dizopulse_admin_auth');
    sessionStorage.removeItem('dizopulse_admin_role');
    sessionStorage.removeItem('dizopulse_admin_email');
    sessionStorage.removeItem('dizopulse_admin_name');
    sessionStorage.removeItem('dizopulse_admin_permissions');
    sessionStorage.removeItem('dizopulse_admin_project_access');
    sessionStorage.removeItem('dizopulse_session_token');
    try {
      document.cookie = 'dizopulse_session_token=; path=/; max-age=0; SameSite=Lax';
    } catch {}
  }, []);

  // RBAC permission check
  const isModuleAllowed = useCallback((moduleId: string): boolean => {
    if (!adminUser) return false;
    const role = adminUser.role;
    const permissions = adminUser.permissions || {};

    if (role === 'super_admin' || role === 'admin') return true;

    // Module specific checks for manager/staff
    switch (moduleId) {
      case 'dashboard':
      case 'overview':
      case 'crm':
      case 'pipeline':
      case 'clients':
      case 'audit_logs':
      case 'security':
        return true;
      case 'proposals':
        return permissions.proposals !== 'none' && Boolean(permissions.proposals);
      case 'contracts':
        return permissions.contracts !== 'none' && Boolean(permissions.contracts);
      case 'projects':
        return permissions.projects !== 'none' && Boolean(permissions.projects);
      case 'messages':
        return permissions.messages !== 'none' && Boolean(permissions.messages);
      case 'assets':
        return permissions.assets !== 'none' && Boolean(permissions.assets);
      case 'analytics':
        return role === 'manager' || role === 'admin' || role === 'super_admin';
      case 'services':
      case 'pricing':
      case 'content':
      case 'website_content':
      case 'seo':
      case 'settings':
      case 'branding':
      case 'integrations':
        return permissions.settings !== 'none' && Boolean(permissions.settings);
      case 'staff':
        return role === 'super_admin' || role === 'admin';
      default:
        return true;
    }
  }, [adminUser]);

  const refreshSession = async () => {
    try {
      const email = adminUser?.email || sessionStorage.getItem('dizopulse_admin_email');
      if (!email) return;
      const res = await fetch(`/api/admin/staff?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const staffList = await res.json();
        const me = staffList.find((s: any) => s.email === email);
        if (me) {
          const updated: AdminUser = {
            name: me.name,
            email: me.email,
            role: me.role,
            permissions: me.permissions,
            projectAccess: me.projectAccess
          };
          setAdminUser(prev => ({ ...prev, ...updated }));
          sessionStorage.setItem('dizopulse_admin_role', me.role);
          sessionStorage.setItem('dizopulse_admin_name', me.name);
          sessionStorage.setItem('dizopulse_admin_permissions', JSON.stringify(me.permissions));
          sessionStorage.setItem('dizopulse_admin_project_access', JSON.stringify(me.projectAccess));
        }
      }
    } catch (e) {}
  };

  const updateUserPassword = async (oldPass: string, newPass: string) => {
    if (!adminUser?.email) {
      return { success: false, message: 'Not logged in.' };
    }
    try {
      const res = await fetch('/api/admin/staff/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminUser.email,
          oldPassword: oldPass,
          newPassword: newPass
        })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message || 'Password changed successfully!' };
      } else {
        return { success: false, message: data.error || 'Failed to update password' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error' };
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        adminUser,
        isLoading,
        loginError,
        failedAttempts,
        lockoutTimeLeft,
        login,
        logout,
        isModuleAllowed,
        refreshSession,
        updateUserPassword
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
