import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast, AsyncButton, ConfirmationModal } from './UIPolish';

export interface UserSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  userType: 'staff' | 'client';
  token: string;
  ipAddress: string;
  userAgent: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  createdAt: string;
  lastActiveAt: string;
  status: 'active' | 'revoked' | 'expired';
  isCurrentSession?: boolean;
}

export interface FailedLoginRecord {
  id: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  attemptedAt: string;
  reason: string;
  status: 'failed';
}

export interface SecurityPolicy {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  sessionInactivityMinutes: number;
  requirePasswordChangeDays: number;
  forcePasswordChangeOnFirstLogin: boolean;
}

interface SecurityAdminProps {
  userRole: string;
  userName: string;
  userEmail: string;
  currentToken?: string;
  onLogoutCurrentSession?: () => void;
  onRefreshData?: () => void;
}

export const SecurityAdmin: React.FC<SecurityAdminProps> = ({
  userRole,
  userName,
  userEmail,
  currentToken,
  onLogoutCurrentSession,
  onRefreshData,
}) => {
  const isAdminOrSuper = userRole === 'super_admin' || userRole === 'admin';

  // Sub-tabs state
  const [activeTab, setActiveTab] = useState<'sessions' | 'password' | 'team_controls' | 'failed_logins' | 'policy'>('sessions');

  // Data states
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [failedLogins, setFailedLogins] = useState<FailedLoginRecord[]>([]);
  const [policy, setPolicy] = useState<SecurityPolicy>({
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30,
    sessionInactivityMinutes: 120,
    requirePasswordChangeDays: 90,
    forcePasswordChangeOnFirstLogin: false,
  });
  const [teamSecurityList, setTeamSecurityList] = useState<any[]>([]);

  // Loading states
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingFailedLogins, setIsLoadingFailedLogins] = useState(false);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Search & Filters
  const [sessionSearch, setSessionSearch] = useState('');
  const [failedLoginsSearch, setFailedLoginsSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');

  // Revoke modal
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // User Control Confirm Modal
  const [userControlModal, setUserControlModal] = useState<{
    userEmail: string;
    userName: string;
    action: 'unlock' | 'force_password_change' | 'suspend' | 'reactivate' | 'reset_failed';
    title: string;
    description: string;
  } | null>(null);
  const [isExecutingControl, setIsExecutingControl] = useState(false);

  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch active sessions
  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const storedToken = sessionStorage.getItem('dizopulse_session_token') || currentToken || '';
      const url = isAdminOrSuper
        ? `/api/admin/security/sessions?all=true`
        : `/api/admin/security/sessions?email=${encodeURIComponent(userEmail)}`;
      
      const res = await fetch(url, {
        headers: {
          'X-Session-Token': storedToken,
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Annotate current session
        const annotated = (data || []).map((s: UserSession) => ({
          ...s,
          isCurrentSession: storedToken && s.token === storedToken,
        }));
        setSessions(annotated);
      }
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Fetch failed login records
  const fetchFailedLogins = async () => {
    if (!isAdminOrSuper && activeTab === 'failed_logins') {
      // Staff only sees their own
    }
    setIsLoadingFailedLogins(true);
    try {
      const storedToken = sessionStorage.getItem('dizopulse_session_token') || currentToken || '';
      const url = isAdminOrSuper
        ? `/api/admin/security/failed-logins`
        : `/api/admin/security/failed-logins?email=${encodeURIComponent(userEmail)}`;

      const res = await fetch(url, {
        headers: { 'X-Session-Token': storedToken },
      });
      if (res.ok) {
        const data = await res.json();
        setFailedLogins(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching failed logins:', err);
    } finally {
      setIsLoadingFailedLogins(false);
    }
  };

  // Fetch Security Policy
  const fetchPolicy = async () => {
    try {
      const storedToken = sessionStorage.getItem('dizopulse_session_token') || currentToken || '';
      const res = await fetch('/api/admin/security/policy', {
        headers: { 'X-Session-Token': storedToken },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.policy) setPolicy(data.policy);
      }
    } catch (err) {
      console.error('Error fetching policy:', err);
    }
  };

  // Fetch Team Security List
  const fetchTeamSecurity = async () => {
    if (!isAdminOrSuper) return;
    setIsLoadingTeam(true);
    try {
      const storedToken = sessionStorage.getItem('dizopulse_session_token') || currentToken || '';
      const res = await fetch('/api/admin/staff', {
        headers: { 'X-Session-Token': storedToken },
      });
      if (res.ok) {
        const data = await res.json();
        setTeamSecurityList(data || []);
      }
    } catch (err) {
      console.error('Error fetching team security:', err);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    if (isAdminOrSuper) {
      fetchPolicy();
      fetchTeamSecurity();
    }
  }, [userEmail, userRole]);

  useEffect(() => {
    if (activeTab === 'failed_logins') fetchFailedLogins();
    if (activeTab === 'team_controls') fetchTeamSecurity();
    if (activeTab === 'sessions') fetchSessions();
  }, [activeTab]);

  // Handle single session revocation
  const handleConfirmRevokeSession = async () => {
    if (!sessionToRevoke) return;
    setIsRevoking(true);
    try {
      const storedToken = sessionStorage.getItem('dizopulse_session_token') || currentToken || '';
      const res = await fetch('/api/admin/security/revoke-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': storedToken,
        },
        body: JSON.stringify({
          sessionId: sessionToRevoke.id,
          userEmail: sessionToRevoke.userEmail,
        }),
      });

      if (res.ok) {
        showToast('Session Terminated', `Terminated active session for ${sessionToRevoke.userEmail}`, 'success');
        if (sessionToRevoke.isCurrentSession && onLogoutCurrentSession) {
          onLogoutCurrentSession();
        } else {
          fetchSessions();
        }
      } else {
        const err = await res.json();
        showToast('Revoke Failed', err.error || 'Failed to revoke session', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsRevoking(false);
      setSessionToRevoke(null);
    }
  };

  // Handle Logout All Other Sessions
  const handleConfirmRevokeAllOther = async () => {
    setIsRevokingAll(true);
    try {
      const storedToken = sessionStorage.getItem('dizopulse_session_token') || currentToken || '';
      const res = await fetch('/api/admin/security/revoke-other-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': storedToken,
        },
        body: JSON.stringify({
          targetEmail: userEmail,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('Sessions Terminated', data.message || 'Logged out from all other devices successfully.', 'success');
        fetchSessions();
      } else {
        const err = await res.json();
        showToast('Error', err.error || 'Failed to revoke other sessions', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsRevokingAll(false);
      setShowRevokeAllConfirm(false);
    }
  };

  // Save Security Policy
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    try {
      const storedToken = sessionStorage.getItem('dizopulse_session_token') || currentToken || '';
      const res = await fetch('/api/admin/security/policy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': storedToken,
        },
        body: JSON.stringify({ policy }),
      });

      if (res.ok) {
        showToast('Security Policy Saved', 'Updated security thresholds and session policy.', 'success');
      } else {
        const err = await res.json();
        showToast('Save Failed', err.error || 'Failed to update policy', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // User Security Control Action (Unlock, Force Password Change, Suspend, Reactivate)
  const handleExecuteUserControl = async () => {
    if (!userControlModal) return;
    setIsExecutingControl(true);
    try {
      const storedToken = sessionStorage.getItem('dizopulse_session_token') || currentToken || '';
      const res = await fetch('/api/admin/security/user-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': storedToken,
        },
        body: JSON.stringify({
          email: userControlModal.userEmail,
          action: userControlModal.action,
          requestedBy: userName || userEmail,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('Action Executed', data.message || 'Updated account security status', 'success');
        fetchTeamSecurity();
        fetchSessions();
      } else {
        const err = await res.json();
        showToast('Control Failed', err.error || 'Failed to execute security control', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsExecutingControl(false);
      setUserControlModal(null);
    }
  };

  // Change Password Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please verify.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/admin/staff/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          oldPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setPasswordSuccess('Your password has been changed successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password Updated', 'Your security password was updated successfully.', 'success');
      } else {
        const data = await res.json();
        setPasswordError(data.error || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordError('Network connection error. Try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Clear Failed Login Logs
  const handleClearFailedLogins = async () => {
    if (!window.confirm('Are you sure you want to clear all failed login audit records?')) return;
    try {
      const storedToken = sessionStorage.getItem('dizopulse_session_token') || currentToken || '';
      const res = await fetch('/api/admin/security/failed-logins', {
        method: 'DELETE',
        headers: { 'X-Session-Token': storedToken },
      });
      if (res.ok) {
        showToast('Logs Cleared', 'Failed login history cleared successfully.', 'success');
        setFailedLogins([]);
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const activeSessionsCount = sessions.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border border-indigo-500/30">
              <Icons.ShieldCheck className="w-4 h-4 text-cyan-400" />
              Agency Security & Session Management
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Security Operations Center
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Monitor real-time active login sessions, device fingerprints, password hygiene, account locking rules, and login failure audit logs across Dizo Pulse workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/80 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Active Sessions</span>
              <span className="text-2xl font-black text-cyan-400">{activeSessionsCount}</span>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/80 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Account Role</span>
              <span className="text-sm font-black text-indigo-300 uppercase">{userRole.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icons.Smartphone className="w-4 h-4" />
            Active Sessions ({activeSessionsCount})
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'password'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icons.KeyRound className="w-4 h-4" />
            My Security & Password
          </button>

          {isAdminOrSuper && (
            <>
              <button
                onClick={() => setActiveTab('team_controls')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'team_controls'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icons.UserCheck className="w-4 h-4" />
                Team Accounts & Locks
              </button>

              <button
                onClick={() => setActiveTab('failed_logins')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'failed_logins'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icons.ShieldAlert className="w-4 h-4 text-rose-400" />
                Failed Login Logs ({failedLogins.length})
              </button>

              <button
                onClick={() => setActiveTab('policy')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'policy'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icons.Sliders className="w-4 h-4" />
                Security Policies
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- TAB 1: ACTIVE SESSIONS --- */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Icons.Monitor className="w-5 h-5 text-indigo-600" />
                  Active Login Sessions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Devices currently signed in to your account or team workspace.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSessions}
                  disabled={isLoadingSessions}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <button
                  onClick={() => setShowRevokeAllConfirm(true)}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-extrabold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.LogOut className="w-3.5 h-3.5" />
                  Logout All Other Devices
                </button>
              </div>
            </div>

            {/* Filter Search */}
            {isAdminOrSuper && (
              <div className="relative max-w-md">
                <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter sessions by name, email, or device..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Session Cards List */}
            {isLoadingSessions ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Icons.Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-medium">Scanning active security sessions...</p>
              </div>
            ) : (() => {
              const filtered = sessions.filter(s => {
                if (!sessionSearch.trim()) return true;
                const q = sessionSearch.toLowerCase();
                return (
                  s.userName?.toLowerCase().includes(q) ||
                  s.userEmail?.toLowerCase().includes(q) ||
                  s.browser?.toLowerCase().includes(q) ||
                  s.os?.toLowerCase().includes(q) ||
                  s.ipAddress?.includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    <Icons.ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-600">No active sessions matching filter.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((s) => {
                    const isMobile = s.deviceType === 'Mobile';
                    return (
                      <div
                        key={s.id}
                        className={`p-5 rounded-2xl border transition-all relative ${
                          s.isCurrentSession
                            ? 'bg-gradient-to-br from-indigo-50/70 to-white border-indigo-300 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl ${s.isCurrentSession ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 text-slate-700'}`}>
                              {isMobile ? <Icons.Smartphone className="w-5 h-5" /> : <Icons.Monitor className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-900 text-xs md:text-sm">
                                  {s.browser || 'Web Browser'} on {s.os || 'Desktop OS'}
                                </h4>
                                {s.isCurrentSession && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-500 text-[11px] font-medium mt-0.5">
                                {s.userName} ({s.userEmail}) • <span className="font-mono text-slate-700">{s.ipAddress}</span>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setSessionToRevoke(s)}
                            className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                            title="Revoke session"
                          >
                            <Icons.LogOut className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Signed In</span>
                            <span className="font-bold text-slate-700">{new Date(s.createdAt).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Last Activity</span>
                            <span className="font-bold text-slate-700">{new Date(s.lastActiveAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- TAB 2: MY SECURITY & PASSWORD --- */}
      {activeTab === 'password' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icons.KeyRound className="w-5 h-5 text-indigo-600" />
                Change Password
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your account password to maintain system security.
              </p>
            </div>

            {passwordError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2">
                <Icons.AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2">
                <Icons.CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Lock className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5 bg-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
            <h4 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Icons.ShieldCheck className="w-4 h-4" />
              Account Security Status
            </h4>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Email Handle</span>
                <span className="font-extrabold text-white text-sm">{userEmail}</span>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Account Access Role</span>
                <span className="font-extrabold text-indigo-400 text-sm uppercase">{userRole}</span>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Session Inactivity Expiry</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {policy.sessionInactivityMinutes ? `${policy.sessionInactivityMinutes} Minutes` : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: TEAM ACCOUNTS & LOCKS (Admin Only) --- */}
      {isAdminOrSuper && activeTab === 'team_controls' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icons.UserCheck className="w-5 h-5 text-indigo-600" />
                Team Accounts & Security Controls
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage staff security state, account lockouts, forced password changes, and suspensions.
              </p>
            </div>

            <div className="relative max-w-xs">
              <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {isLoadingTeam ? (
            <div className="py-12 text-center text-slate-400">
              <Icons.Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading team accounts...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Role & Dept</th>
                    <th className="p-4">Security Status</th>
                    <th className="p-4">Failed Attempts</th>
                    <th className="p-4">Password Age</th>
                    <th className="p-4 text-right">Security Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {teamSecurityList
                    .filter(stf => !teamSearch || stf.name?.toLowerCase().includes(teamSearch.toLowerCase()) || stf.email?.toLowerCase().includes(teamSearch.toLowerCase()))
                    .map((stf) => {
                      const isLocked = stf.lockedUntil && new Date(stf.lockedUntil) > new Date();
                      const isSuspended = stf.status === 'inactive';
                      const forceChange = stf.forcePasswordChange;

                      return (
                        <tr key={stf.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-bold text-slate-900">
                            <div>{stf.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">{stf.email}</div>
                          </td>

                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                              {stf.role}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">{stf.department}</div>
                          </td>

                          <td className="p-4">
                            {isLocked ? (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-300 inline-flex items-center gap-1">
                                <Icons.Lock className="w-3 h-3 text-rose-600" />
                                Locked (Until {new Date(stf.lockedUntil).toLocaleTimeString()})
                              </span>
                            ) : isSuspended ? (
                              <span className="bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-slate-300 inline-flex items-center gap-1">
                                <Icons.UserX className="w-3 h-3 text-slate-600" />
                                Suspended
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                                <Icons.CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active
                              </span>
                            )}

                            {forceChange && (
                              <div className="mt-1">
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded">
                                  Password Reset Required
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="p-4 font-bold">
                            <span className={stf.failedLoginAttempts > 0 ? 'text-rose-600 font-black' : 'text-slate-500'}>
                              {stf.failedLoginAttempts || 0} failed
                            </span>
                          </td>

                          <td className="p-4 text-slate-500 text-[11px]">
                            {stf.passwordLastChangedAt
                              ? new Date(stf.passwordLastChangedAt).toLocaleDateString()
                              : 'Default'}
                          </td>

                          <td className="p-4 text-right space-x-1">
                            {isLocked && (
                              <button
                                onClick={() =>
                                  setUserControlModal({
                                    userEmail: stf.email,
                                    userName: stf.name,
                                    action: 'unlock',
                                    title: 'Unlock User Account',
                                    description: `Are you sure you want to unlock the account for ${stf.name}? This resets failed attempt counter immediately.`,
                                  })
                                }
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase rounded-lg border border-emerald-200 cursor-pointer"
                              >
                                Unlock
                              </button>
                            )}

                            <button
                              onClick={() =>
                                setUserControlModal({
                                  userEmail: stf.email,
                                  userName: stf.name,
                                  action: 'force_password_change',
                                  title: 'Force Password Change',
                                  description: `Require ${stf.name} to change their password on their next login session?`,
                                })
                              }
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase rounded-lg border border-amber-200 cursor-pointer"
                            >
                              Force Reset
                            </button>

                            {isSuspended ? (
                              <button
                                onClick={() =>
                                  setUserControlModal({
                                    userEmail: stf.email,
                                    userName: stf.name,
                                    action: 'reactivate',
                                    title: 'Reactivate Account',
                                    description: `Reactivate workspace access for ${stf.name}?`,
                                  })
                                }
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[10px] uppercase rounded-lg border border-blue-200 cursor-pointer"
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setUserControlModal({
                                    userEmail: stf.email,
                                    userName: stf.name,
                                    action: 'suspend',
                                    title: 'Suspend Account & Logout',
                                    description: `Immediately log out and suspend account access for ${stf.name}?`,
                                  })
                                }
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[10px] uppercase rounded-lg border border-rose-200 cursor-pointer"
                              >
                                Suspend
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: FAILED LOGIN LOGS (Admin Only) --- */}
      {isAdminOrSuper && activeTab === 'failed_logins' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icons.ShieldAlert className="w-5 h-5 text-rose-600" />
                Failed Login Audit History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit records of failed authentication attempts, IP addresses, and lockouts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchFailedLogins}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Refresh
              </button>
              <button
                onClick={handleClearFailedLogins}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200"
              >
                Clear History
              </button>
            </div>
          </div>

          {isLoadingFailedLogins ? (
            <div className="py-12 text-center text-slate-400">
              <Icons.Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs">Fetching failed login history...</p>
            </div>
          ) : failedLogins.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <Icons.CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-extrabold text-slate-700">No failed login attempts recorded!</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Attempted Email</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Device Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {failedLogins.map((fl) => (
                    <tr key={fl.id} className="hover:bg-slate-50/60">
                      <td className="p-4 font-bold text-slate-700">
                        {new Date(fl.attemptedAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono font-extrabold text-slate-900">
                        {fl.userEmail}
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        {fl.ipAddress}
                      </td>
                      <td className="p-4 font-extrabold text-rose-600">
                        {fl.reason}
                      </td>
                      <td className="p-4 text-[11px] text-slate-500 max-w-xs truncate" title={fl.userAgent}>
                        {fl.deviceInfo || fl.userAgent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 5: SECURITY POLICIES (Admin Only) --- */}
      {isAdminOrSuper && activeTab === 'policy' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 max-w-4xl">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Icons.Sliders className="w-5 h-5 text-indigo-600" />
              Security Policy Controls
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure brute-force prevention, lockout thresholds, and session inactivity limits.
            </p>
          </div>

          <form onSubmit={handleSavePolicy} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-900 uppercase">
                  Max Failed Login Attempts
                </label>
                <p className="text-[11px] text-slate-500">
                  Number of incorrect password attempts before the account is temporarily locked.
                </p>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={policy.maxFailedAttempts}
                  onChange={(e) => setPolicy({ ...policy, maxFailedAttempts: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900"
                />
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-900 uppercase">
                  Account Lockout Duration (Minutes)
                </label>
                <p className="text-[11px] text-slate-500">
                  Time period an account remains locked after exceeding max failed attempts.
                </p>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={policy.lockoutDurationMinutes}
                  onChange={(e) => setPolicy({ ...policy, lockoutDurationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900"
                />
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-900 uppercase">
                  Session Inactivity Timeout (Minutes)
                </label>
                <p className="text-[11px] text-slate-500">
                  Automatically expire idle sessions after this duration (0 to disable).
                </p>
                <input
                  type="number"
                  min="0"
                  max="1440"
                  value={policy.sessionInactivityMinutes}
                  onChange={(e) => setPolicy({ ...policy, sessionInactivityMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900"
                />
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-900 uppercase">
                  Require Password Change (Days)
                </label>
                <p className="text-[11px] text-slate-500">
                  Maximum password age before requiring user reset (0 for no limit).
                </p>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={policy.requirePasswordChangeDays}
                  onChange={(e) => setPolicy({ ...policy, requirePasswordChangeDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPolicy}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                {isSavingPolicy ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
                Save Security Policy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- CONFIRMATION MODAL FOR SINGLE SESSION REVOCATION --- */}
      {sessionToRevoke && (
        <ConfirmationModal
          isOpen={!!sessionToRevoke}
          onClose={() => setSessionToRevoke(null)}
          onConfirm={handleConfirmRevokeSession}
          title="Revoke Session"
          message={`Are you sure you want to terminate the login session on ${sessionToRevoke.browser || 'Web Browser'} (${sessionToRevoke.userEmail})?`}
          confirmText="Terminate Session"
          cancelText="Cancel"
          variant="danger"
          isLoading={isRevoking}
        />
      )}

      {/* --- CONFIRMATION MODAL FOR LOGOUT ALL OTHER SESSIONS --- */}
      {showRevokeAllConfirm && (
        <ConfirmationModal
          isOpen={showRevokeAllConfirm}
          onClose={() => setShowRevokeAllConfirm(false)}
          onConfirm={handleConfirmRevokeAllOther}
          title="Logout All Other Devices"
          message="Are you sure you want to log out from all other devices and active web sessions? Your current session will remain active."
          confirmText="Logout All Other Devices"
          cancelText="Cancel"
          variant="danger"
          isLoading={isRevokingAll}
        />
      )}

      {/* --- USER CONTROL ACTION MODAL --- */}
      {userControlModal && (
        <ConfirmationModal
          isOpen={!!userControlModal}
          onClose={() => setUserControlModal(null)}
          onConfirm={handleExecuteUserControl}
          title={userControlModal.title}
          message={userControlModal.description}
          confirmText="Confirm Action"
          cancelText="Cancel"
          variant={userControlModal.action === 'suspend' ? 'danger' : 'primary'}
          isLoading={isExecutingControl}
        />
      )}
    </div>
  );
};

export default SecurityAdmin;
