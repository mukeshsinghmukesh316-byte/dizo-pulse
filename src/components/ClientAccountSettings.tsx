import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { useAuth, UserSession, AccountActivityItem } from '../context/AuthContext';

interface ClientAccountSettingsProps {
  onUnsavedStateChange?: (hasUnsaved: boolean) => void;
}

const INDUSTRY_PRESETS = [
  'E-Commerce & D2C',
  'Digital Brand & Marketing',
  'Software & SaaS',
  'Real Estate & Construction',
  'Healthcare & Wellness',
  'Education & EdTech',
  'Finance & FinTech',
  'Hospitality & Tourism',
  'Media & Entertainment',
  'Professional Services',
  'Other'
];

const AVATAR_COLORS = [
  { name: 'Indigo', bg: 'from-indigo-600 to-cyan-500', hex: '#6366f1' },
  { name: 'Emerald', bg: 'from-emerald-600 to-teal-500', hex: '#10b981' },
  { name: 'Amber', bg: 'from-amber-600 to-orange-500', hex: '#f59e0b' },
  { name: 'Rose', bg: 'from-rose-600 to-pink-500', hex: '#f43f5e' },
  { name: 'Cyan', bg: 'from-cyan-600 to-blue-500', hex: '#06b6d4' },
  { name: 'Purple', bg: 'from-purple-600 to-indigo-500', hex: '#a855f7' }
];

export default function ClientAccountSettings({ onUnsavedStateChange }: ClientAccountSettingsProps) {
  const { currentUser, updateUserProfile } = useAuth();

  // Active sub-section tab
  const [activeSubSection, setActiveSubSection] = useState<'personal' | 'business' | 'password' | 'sessions' | 'activity' | 'danger'>('personal');

  // Edit Profile mode state
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || '');
  const [company, setCompany] = useState(currentUser?.company || '');
  const [businessWebsite, setBusinessWebsite] = useState(currentUser?.businessWebsite || '');
  const [industry, setIndustry] = useState(currentUser?.industry || 'E-Commerce & D2C');
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photoUrl || '');
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || 'Indigo');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Account State & Logs
  const [sessions, setSessions] = useState<UserSession[]>(currentUser?.sessions || []);
  const [activityLog, setActivityLog] = useState<AccountActivityItem[]>(currentUser?.activityLog || []);
  const [deleteRequested, setDeleteRequested] = useState<boolean>(currentUser?.deleteRequested || false);

  // Modals & Confirmation States
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<typeof activeSubSection | null>(null);
  const [showRevokeSessionsModal, setShowRevokeSessionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Status Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setWhatsapp(currentUser.whatsapp || '');
      setCompany(currentUser.company || '');
      setBusinessWebsite(currentUser.businessWebsite || '');
      setIndustry(currentUser.industry || 'E-Commerce & D2C');
      setPhotoUrl(currentUser.photoUrl || '');
      setAvatarColor(currentUser.avatarColor || 'Indigo');
      if (currentUser.sessions) setSessions(currentUser.sessions);
      if (currentUser.activityLog) setActivityLog(currentUser.activityLog);
      if (currentUser.deleteRequested !== undefined) setDeleteRequested(currentUser.deleteRequested);
    }
  }, [currentUser]);

  // Load account extra details from API
  useEffect(() => {
    if (currentUser?.email) {
      fetch(`/api/users/account-details?email=${encodeURIComponent(currentUser.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            if (data.user.sessions) setSessions(data.user.sessions);
            if (data.user.activityLog) setActivityLog(data.user.activityLog);
            if (data.user.deleteRequested !== undefined) setDeleteRequested(data.user.deleteRequested);
            if (data.user.businessWebsite) setBusinessWebsite(data.user.businessWebsite);
            if (data.user.photoUrl) setPhotoUrl(data.user.photoUrl);
          }
        })
        .catch((err) => console.warn('Could not fetch extra account details:', err));
    }
  }, [currentUser?.email]);

  // Calculate if form is dirty
  const isFormDirty =
    name !== (currentUser?.name || '') ||
    email !== (currentUser?.email || '') ||
    whatsapp !== (currentUser?.whatsapp || '') ||
    company !== (currentUser?.company || '') ||
    businessWebsite !== (currentUser?.businessWebsite || '') ||
    industry !== (currentUser?.industry || 'E-Commerce & D2C') ||
    photoUrl !== (currentUser?.photoUrl || '') ||
    avatarColor !== (currentUser?.avatarColor || 'Indigo');

  useEffect(() => {
    if (onUnsavedStateChange) {
      onUnsavedStateChange(isEditingProfile && isFormDirty);
    }
  }, [isEditingProfile, isFormDirty, onUnsavedStateChange]);

  // Tab change wrapper with unsaved warning check
  const handleTabSelect = (tab: typeof activeSubSection) => {
    if (isEditingProfile && isFormDirty) {
      setPendingTabChange(tab);
      setShowUnsavedModal(true);
    } else {
      setActiveSubSection(tab);
    }
  };

  // Reset Form
  const handleCancelEdits = () => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setWhatsapp(currentUser.whatsapp || '');
      setCompany(currentUser.company || '');
      setBusinessWebsite(currentUser.businessWebsite || '');
      setIndustry(currentUser.industry || 'E-Commerce & D2C');
      setPhotoUrl(currentUser.photoUrl || '');
      setAvatarColor(currentUser.avatarColor || 'Indigo');
    }
    setIsEditingProfile(false);
    setShowUnsavedModal(false);
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSaving(true);

    try {
      await updateUserProfile({
        name,
        email,
        whatsapp,
        company,
        businessWebsite,
        industry,
        photoUrl,
        avatarColor
      });

      setStatusMessage({ type: 'success', text: 'Account profile details saved successfully!' });
      setIsEditingProfile(false);
      setShowUnsavedModal(false);

      // Re-fetch updated activity logs
      if (currentUser?.email) {
        const res = await fetch(`/api/users/account-details?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        if (data.user?.activityLog) setActivityLog(data.user.activityLog);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update account details.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        currentPassword,
        newPassword
      });

      setPasswordSuccess('Password updated successfully! Future logins will require your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Refresh activity log
      if (currentUser?.email) {
        const res = await fetch(`/api/users/account-details?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        if (data.user?.activityLog) setActivityLog(data.user.activityLog);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password. Verify current password.');
    } finally {
      setIsSaving(false);
    }
  };

  // Revoke Secondary Sessions Handler
  const handleRevokeSessions = async () => {
    if (!currentUser?.email) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/sessions/revoke-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.sessions) setSessions(data.sessions);
        setStatusMessage({ type: 'success', text: 'Logged out from all secondary devices successfully.' });
        setShowRevokeSessionsModal(false);

        // Refresh activity log
        const detailsRes = await fetch(`/api/users/account-details?email=${encodeURIComponent(currentUser.email)}`);
        const detailsData = await detailsRes.json();
        if (detailsData.user?.activityLog) setActivityLog(detailsData.user.activityLog);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to revoke sessions.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error revoking sessions.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Delete Account Request Handler
  const handleDeleteRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    if (!deleteReason.trim()) {
      setDeleteError('Please provide a reason for account deletion.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/users/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email,
          password: deletePassword,
          reason: deleteReason
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDeleteRequested(true);
        setShowDeleteModal(false);
        setStatusMessage({
          type: 'success',
          text: 'Account deletion request submitted to Dizo Pulse management.'
        });

        // Refresh activity log
        if (currentUser?.email) {
          const detailsRes = await fetch(`/api/users/account-details?email=${encodeURIComponent(currentUser.email)}`);
          const detailsData = await detailsRes.json();
          if (detailsData.user?.activityLog) setActivityLog(detailsData.user.activityLog);
        }
      } else {
        setDeleteError(data.error || 'Failed to submit account deletion request.');
      }
    } catch (err: any) {
      setDeleteError('Connection error submitting request.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAvatarGradient = AVATAR_COLORS.find((c) => c.name === avatarColor)?.bg || 'from-indigo-600 to-cyan-500';

  return (
    <div className="space-y-8" id="account-settings-container">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name || 'Profile Photo'}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-lg shrink-0"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${selectedAvatarGradient} flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-950/60 shrink-0 border border-white/20`}
              >
                {name ? name.split(' ').map((n) => n[0]).join('') : 'C'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-950 rounded-full flex items-center justify-center text-[10px] text-slate-950 font-black">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{name || 'Client Account'}</h2>
              <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                Client Profile
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{email} • {company || 'Independent Business'}</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Account ID: <strong className="text-slate-300">{currentUser?.id || 'usr_client'}</strong>
            </p>
          </div>
        </div>

        {/* Global Edit / Save Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {!isEditingProfile ? (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-950/50 cursor-pointer flex items-center gap-2"
            >
              <Icons.Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdits}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
              >
                <Icons.Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Status Message Toast */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Icons.AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white text-xs font-black cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Settings Sub-Navigation Pills */}
      <div className="flex flex-wrap bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => handleTabSelect('personal')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'personal'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icons.User className="w-3.5 h-3.5 text-cyan-400" />
          <span>Personal Info</span>
        </button>

        <button
          onClick={() => handleTabSelect('business')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'business'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icons.Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Business Details</span>
        </button>

        <button
          onClick={() => handleTabSelect('password')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'password'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icons.KeyRound className="w-3.5 h-3.5 text-emerald-400" />
          <span>Change Password</span>
        </button>

        <button
          onClick={() => handleTabSelect('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'sessions'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icons.Laptop className="w-3.5 h-3.5 text-indigo-400" />
          <span>Login Sessions ({sessions.length})</span>
        </button>

        <button
          onClick={() => handleTabSelect('activity')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'activity'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icons.History className="w-3.5 h-3.5 text-purple-400" />
          <span>Account Activity</span>
        </button>

        <button
          onClick={() => handleTabSelect('danger')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubSection === 'danger'
              ? 'bg-rose-900/80 text-rose-200 border border-rose-700 shadow-md shadow-rose-950/50'
              : 'text-rose-400 hover:text-rose-200'
          }`}
        >
          <Icons.ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* SECTION 1: PERSONAL INFORMATION */}
      {activeSubSection === 'personal' && (
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Icons.User className="w-4 h-4 text-cyan-400" />
                Personal Information
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage your primary account identity, email, and contact number.</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
              Verified Client
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Photo / Avatar Customizer */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                Profile Photo / Avatar Logo
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400 block">Option A: Image URL</span>
                  <input
                    type="url"
                    disabled={!isEditingProfile}
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                  {photoUrl && (
                    <button
                      type="button"
                      disabled={!isEditingProfile}
                      onClick={() => setPhotoUrl('')}
                      className="text-[10px] text-rose-400 hover:underline font-bold"
                    >
                      Remove Custom Photo
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400 block">Option B: Avatar Gradient Preset</span>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        disabled={!isEditingProfile}
                        onClick={() => setAvatarColor(c.name)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border ${
                          avatarColor === c.name
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.User className="w-3.5 h-3.5 text-indigo-400" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditingProfile}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Primary Email Address *
                </label>
                <input
                  type="email"
                  required
                  disabled={!isEditingProfile}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@business.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  disabled={!isEditingProfile}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60 font-mono"
                />
              </div>
            </div>

            {isEditingProfile && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCancelEdits}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel Edits
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-950/50"
                >
                  <Icons.Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Personal Details'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* SECTION 2: BUSINESS INFORMATION */}
      {activeSubSection === 'business' && (
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Icons.Building2 className="w-4 h-4 text-amber-400" />
                Business & Organization Details
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Used for invoicing, proposal customization, and project contracts.</p>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-900">
              Agency Client
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Business / Company Name
                </label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Aura Digital Labs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Business Website
                </label>
                <input
                  type="url"
                  disabled={!isEditingProfile}
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  placeholder="https://auradigital.io"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  Industry / Business Niche
                </label>
                <select
                  disabled={!isEditingProfile}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
                >
                  {INDUSTRY_PRESETS.map((ind) => (
                    <option key={ind} value={ind} className="bg-slate-900 text-white">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isEditingProfile && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCancelEdits}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-950/50"
                >
                  <Icons.Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Business Info'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* SECTION 3: CHANGE PASSWORD */}
      {activeSubSection === 'password' && (
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl max-w-2xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Icons.KeyRound className="w-4 h-4 text-emerald-400" />
              Security & Password Management
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Ensure your account password is strong and updated periodically.</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <Icons.AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Password Validation Meter */}
            {newPassword && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Password Strength:</span>
                  <span className={`font-bold ${newPassword.length >= 8 ? 'text-emerald-400' : newPassword.length >= 6 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 6 ? 'Medium' : 'Too Short'}
                  </span>
                </div>
                <div className="flex gap-2 text-[10px] text-slate-500">
                  <span className={newPassword.length >= 6 ? 'text-emerald-400' : ''}>✓ Min 6 chars</span>
                  <span className={newPassword === confirmPassword && confirmPassword ? 'text-emerald-400' : ''}>✓ Passwords Match</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              <Icons.KeyRound className="w-4 h-4" />
              <span>{isSaving ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 4: LOGIN SESSIONS */}
      {activeSubSection === 'sessions' && (
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Icons.Laptop className="w-4 h-4 text-indigo-400" />
                Active Devices & Login Sessions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage devices currently logged into your Dizo Pulse Client Portal.</p>
            </div>

            <button
              onClick={() => setShowRevokeSessionsModal(true)}
              className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Icons.LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Logout All Other Devices</span>
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((sess) => (
              <div key={sess.id} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${sess.isCurrent ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                    <Icons.Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white">{sess.device}</h4>
                      {sess.isCurrent && (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md text-[9px] font-black uppercase">
                          Current Session
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{sess.browser} • {sess.location}</p>
                    <span className="text-[10px] font-mono text-slate-500">IP: {sess.ip} • Last Active: {sess.lastActive}</span>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    Secondary Node
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: ACCOUNT ACTIVITY LOG */}
      {activeSubSection === 'activity' && (
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Icons.History className="w-4 h-4 text-purple-400" />
              Account Security & Audit History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological record of account updates, logins, and security actions.</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {activityLog.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No account activity recorded yet.</p>
            ) : (
              activityLog.map((act) => (
                <div key={act.id} className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-start gap-3">
                  <div className="p-2 bg-purple-950 text-purple-400 rounded-xl border border-purple-900 shrink-0 mt-0.5">
                    <Icons.Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white">{act.action}</h4>
                      <span className="text-[10px] font-mono text-slate-500">{new Date(act.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{act.details}</p>
                    {act.ip && <span className="text-[9px] font-mono text-slate-600 block mt-1">IP: {act.ip}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 6: DANGER ZONE / DELETE ACCOUNT */}
      {activeSubSection === 'danger' && (
        <div className="bg-rose-950/30 border border-rose-800/80 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="border-b border-rose-800/60 pb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-300 flex items-center gap-2">
              <Icons.ShieldAlert className="w-4 h-4 text-rose-400" />
              Account Danger Zone
            </h3>
            <p className="text-xs text-rose-200/80 mt-0.5">Irreversible account actions and client account deletion requests.</p>
          </div>

          {deleteRequested ? (
            <div className="p-4 bg-rose-950/80 border border-rose-700 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-200 font-bold text-xs">
                <Icons.AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Account Deletion Request Pending Review</span>
              </div>
              <p className="text-[11px] text-rose-300/80">
                You submitted an account deletion request to Dizo Pulse management. Your account remains active while our lead operations team reviews your request.
              </p>
            </div>
          ) : (
            <div className="p-5 bg-slate-950/80 rounded-2xl border border-rose-900/60 space-y-3">
              <h4 className="text-xs font-black text-white">Request Account Deletion</h4>
              <p className="text-xs text-slate-400">
                Submitting an account deletion request will notify agency administration to archive your client workspace and delete personal data in accordance with compliance guidelines.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/50 flex items-center gap-2"
              >
                <Icons.Trash2 className="w-4 h-4" />
                <span>Request Account Deletion</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: UNSAVED CHANGES WARNING */}
      <AnimatePresence>
        {showUnsavedModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <Icons.AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-black">Unsaved Profile Changes</h3>
              </div>
              <p className="text-xs text-slate-300">
                You have modified your profile information without saving. Discarding changes will revert your edits.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCancelEdits();
                    if (pendingTabChange) {
                      setActiveSubSection(pendingTabChange);
                      setPendingTabChange(null);
                    }
                  }}
                  className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowUnsavedModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Keep Editing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: REVOKE SESSIONS CONFIRMATION */}
      <AnimatePresence>
        {showRevokeSessionsModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <Icons.LogOut className="w-6 h-6" />
                <h3 className="text-base font-black">Logout All Other Devices</h3>
              </div>
              <p className="text-xs text-slate-300">
                This action will invalidate active login tokens on all other browser sessions and mobile devices. You will remain logged in on this current browser.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevokeSessionsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevokeSessions}
                  disabled={isSaving}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  {isSaving ? 'Logging out...' : 'Confirm Revoke'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: DELETE ACCOUNT REQUEST */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-rose-800/80 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <Icons.Trash2 className="w-6 h-6" />
                <h3 className="text-base font-black">Confirm Account Deletion Request</h3>
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl">
                  {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteRequestSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">Reason for Deletion *</label>
                  <textarea
                    required
                    rows={3}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Tell us why you wish to close your client account..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 block">Verify Account Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter password to confirm"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    {isSaving ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
