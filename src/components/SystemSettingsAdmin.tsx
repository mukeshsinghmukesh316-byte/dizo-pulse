import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

interface SystemSettingsAdminProps {
  userRole: string;
  userName: string;
  userEmail: string;
  onSettingsUpdated?: (newSettings: any) => void;
}

export const SystemSettingsAdmin: React.FC<SystemSettingsAdminProps> = ({
  userRole,
  userName,
  userEmail,
  onSettingsUpdated
}) => {
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

  const [savedSettings, setSavedSettings] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // System status live diagnostics
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('all');

  // Confirmation Modals
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Fetch initial settings & status
  useEffect(() => {
    fetchSettings();
    fetchSystemStatus();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSavedSettings(data);
        setSettings(data);
      } else {
        showToast('Failed to load system settings', 'error');
      }
    } catch (err: any) {
      showToast('Error loading settings: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/admin/system-status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (err) {
      console.error('System status fetch failed', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin) {
      showToast('You need Admin or Super Admin rights to modify settings.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...settings,
        updatedBy: userName || 'Admin User',
        updatedByRole: userRole || 'admin',
        updatedByEmail: userEmail || ''
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        setSavedSettings(result.settings);
        setSettings(result.settings);
        showToast('System settings updated and saved successfully!', 'success');
        if (onSettingsUpdated) onSettingsUpdated(result.settings);
      } else {
        const errData = await res.json();
        showToast('Error saving settings: ' + (errData.error || 'Server error'), 'error');
      }
    } catch (err: any) {
      showToast('Error saving settings: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Discard / Cancel
  const handleDiscard = () => {
    setSettings(savedSettings);
    showToast('Unsaved changes discarded.', 'info');
  };

  // Handle Reset to Defaults
  const handleResetToDefaults = async () => {
    if (!isSuperAdmin) {
      showToast('Only Super Admin can reset system settings to defaults.', 'error');
      return;
    }

    setResetting(true);
    try {
      const res = await fetch('/api/admin/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedBy: userName,
          userRole: userRole,
          userEmail: userEmail
        })
      });

      if (res.ok) {
        const result = await res.json();
        setSavedSettings(result.settings);
        setSettings(result.settings);
        setShowResetModal(false);
        showToast('Settings reset to factory defaults successfully!', 'success');
        if (onSettingsUpdated) onSettingsUpdated(result.settings);
      } else {
        showToast('Failed to reset settings', 'error');
      }
    } catch (err: any) {
      showToast('Reset failed: ' + err.message, 'error');
    } finally {
      setResetting(false);
    }
  };

  // Field updater helper
  const updateField = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Icons.Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading Agency System Settings...
        </span>
      </div>
    );
  }

  // Section visibility check for search query
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const sectionsList = [
    { id: 'general', title: 'General Agency', icon: Icons.Building, desc: 'Agency identity, tagline, & website' },
    { id: 'branding', title: 'Branding & Logo', icon: Icons.Palette, desc: 'Logo text, preset colors, & themes' },
    { id: 'contact', title: 'Contact Information', icon: Icons.MapPin, desc: 'Emails, phones, & office address' },
    { id: 'social', title: 'Social Links', icon: Icons.Globe, desc: 'LinkedIn, Instagram, Twitter/X, etc.' },
    { id: 'hours', title: 'Business Hours', icon: Icons.Clock, desc: 'Working hours, days, & timezone' },
    { id: 'currency', title: 'Currency & GST', icon: Icons.DollarSign, desc: 'GSTIN, PAN, tax rate, currency' },
    { id: 'communication', title: 'Email & WhatsApp', icon: Icons.MessageSquare, desc: 'WhatsApp number, welcome greetings' },
    { id: 'proposal_terms', title: 'Proposal Terms', icon: Icons.FileText, desc: 'Default validity & payment split' },
    { id: 'contract_terms', title: 'Contract Terms', icon: Icons.FileCode, desc: 'Jurisdiction, NDA, termination' },
    { id: 'project_defaults', title: 'Project Defaults', icon: Icons.FolderKanban, desc: 'Milestones & approval policies' },
    { id: 'client_portal', title: 'Client Portal', icon: Icons.Users, desc: 'Registration, bios, & uploads' },
    { id: 'file_limits', title: 'File Limits', icon: Icons.UploadCloud, desc: 'Max file size & allowed extensions' },
    { id: 'maintenance', title: 'Maintenance Mode', icon: Icons.Wrench, desc: 'System lockdown & bypass roles' },
    { id: 'system_status', title: 'System Status', icon: Icons.Activity, desc: 'Live DB health & memory diagnostic' }
  ];

  return (
    <div className="space-y-6 pb-24 relative">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : toast.type === 'info'
                ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <Icons.AlertCircle className="w-4 h-4 text-rose-400" />
            ) : toast.type === 'info' ? (
              <Icons.Info className="w-4 h-4 text-cyan-400" />
            ) : (
              <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl">
                <Icons.Settings className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  System Settings & Agency Configuration
                  {settings.maintenanceModeEnabled && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider animate-pulse">
                      Maintenance Mode Active
                    </span>
                  )}
                </h2>
                <p className="text-slate-400 text-xs">
                  Manage core agency parameters, branding assets, financial defaults, client policies, and system diagnostics.
                </p>
              </div>
            </div>

            {/* Last Updated Metadata */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mt-3">
              <span className="inline-flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
                <Icons.UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                Updated by: <strong className="text-slate-200">{settings.lastUpdatedBy || 'System Admin'}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
                <Icons.Clock className="w-3.5 h-3.5 text-cyan-400" />
                On:{' '}
                <strong className="text-slate-200">
                  {settings.lastUpdatedAt
                    ? new Date(settings.lastUpdatedAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'}
                </strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Icons.Undo2 className="w-4 h-4 text-slate-400" />
                Discard
              </button>
            )}

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Icons.RotateCcw className="w-4 h-4 text-rose-400" />
                Reset Defaults
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || !isAdmin}
              className={`px-6 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/40 ring-2 ring-indigo-400/50 scale-105'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin text-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Icons.Save className="w-4 h-4 text-white" />
                  Save System Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* SEARCH BAR & SECTION JUMP TABS */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search setting keys or options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Jump Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                activeSection === 'all'
                  ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Sections (14)
            </button>
            {sectionsList.map((sec) => {
              const IconComp = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeSection === sec.id
                      ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <IconComp className="w-3 h-3" />
                  {sec.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* UNSAVED CHANGES FLOATING STICKY BANNER */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/50 shadow-2xl shadow-amber-500/20 px-6 py-3.5 rounded-3xl flex items-center gap-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <div>
                <span className="text-xs font-black text-white flex items-center gap-2">
                  Unsaved System Changes Detected
                </span>
                <p className="text-[10px] text-amber-200/80">
                  You have modified agency configuration. Remember to save to persist changes across website/client portal.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscard}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                Discard
              </button>
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                {saving ? (
                  <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icons.Save className="w-3.5 h-3.5" />
                )}
                Save Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM SECTIONS */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: GENERAL AGENCY SETTINGS */}
        {(activeSection === 'all' || activeSection === 'general') && matchesSearch('general agency name tagline industry website description') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Icons.Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">1. General Agency Settings</h3>
                <p className="text-slate-500 text-xs">Official agency entity name, industry vertical, and public metadata.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Agency Official Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.agencyName || ''}
                  onChange={(e) => updateField('agencyName', e.target.value)}
                  placeholder="e.g. Dizo Pulse Creative Media"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={settings.agencyTagline || ''}
                  onChange={(e) => updateField('agencyTagline', e.target.value)}
                  placeholder="e.g. Designing Brands • Accelerating Growth"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  value={settings.industry || ''}
                  onChange={(e) => updateField('industry', e.target.value)}
                  placeholder="e.g. Digital Marketing & Software Engineering"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Official Website URL
                </label>
                <input
                  type="url"
                  value={settings.officialWebsite || ''}
                  onChange={(e) => updateField('officialWebsite', e.target.value)}
                  placeholder="https://dizopulse.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Agency Bio / Executive Description
                </label>
                <textarea
                  rows={2}
                  value={settings.agencyDescription || ''}
                  onChange={(e) => updateField('agencyDescription', e.target.value)}
                  placeholder="Short description displayed in client portal footer and official proposals..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: AGENCY LOGO & BRANDING */}
        {(activeSection === 'all' || activeSection === 'branding') && matchesSearch('branding logo text preset cyan purple theme primary color') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                <Icons.Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">2. Agency Logo & Branding Theme</h3>
                <p className="text-slate-500 text-xs">Vector text styling, theme color accents, dark mode presets, and logo URLs.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Logo Text (First Half)
                </label>
                <input
                  type="text"
                  value={settings.logoTextFirst || 'DIZO'}
                  onChange={(e) => updateField('logoTextFirst', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Logo Text (Second Half)
                </label>
                <input
                  type="text"
                  value={settings.logoTextSecond || 'PULSE'}
                  onChange={(e) => updateField('logoTextSecond', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Logo Subtitle
                </label>
                <input
                  type="text"
                  value={settings.logoSubtitle || 'Marketing Agency'}
                  onChange={(e) => updateField('logoSubtitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Logo Slogan Text
                </label>
                <input
                  type="text"
                  value={settings.logoSlogan || 'DESIGN • CREATE • GROW'}
                  onChange={(e) => updateField('logoSlogan', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Active Canvas Theme Preset
                </label>
                <select
                  value={settings.activeTheme || 'indigo-cyber'}
                  onChange={(e) => updateField('activeTheme', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="indigo-cyber">Indigo Cyber (Default High-Contrast)</option>
                  <option value="midnight-obsidian">Midnight Obsidian (Ultra Dark Luxury)</option>
                  <option value="charcoal-luxury">Charcoal Gold (Executive Theme)</option>
                  <option value="emerald-mint">Emerald Mint (Clean Tech)</option>
                  <option value="sunset-rose">Sunset Cyber (Neon Gradient)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Custom Logo URL (Light Mode)
                </label>
                <input
                  type="url"
                  value={settings.logoCustomUrl || ''}
                  onChange={(e) => updateField('logoCustomUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Dark Logo URL (Dark Canvas)
                </label>
                <input
                  type="url"
                  value={settings.darkLogoUrl || ''}
                  onChange={(e) => updateField('darkLogoUrl', e.target.value)}
                  placeholder="https://example.com/logo-dark.png"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Favicon URL
                </label>
                <input
                  type="url"
                  value={settings.faviconUrl || ''}
                  onChange={(e) => updateField('faviconUrl', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Primary Accent Color (Hex)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor || '#4f46e5'}
                    onChange={(e) => updateField('primaryColor', e.target.value)}
                    className="w-10 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor || '#4f46e5'}
                    onChange={(e) => updateField('primaryColor', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: CONTACT INFORMATION */}
        {(activeSection === 'all' || activeSection === 'contact') && matchesSearch('contact email phone support address city state pincode') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-2xl">
                <Icons.MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">3. Official Contact Information</h3>
                <p className="text-slate-500 text-xs">Official correspondence emails, client hotlines, and office address.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={settings.officialEmail || 'hello@dizopulse.com'}
                  onChange={(e) => updateField('officialEmail', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Support / Helpdesk Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail || 'support@dizopulse.com'}
                  onChange={(e) => updateField('supportEmail', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Primary Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={settings.primaryPhone || '+91 98765 43210'}
                  onChange={(e) => updateField('primaryPhone', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Secondary / Alternative Phone
                </label>
                <input
                  type="text"
                  value={settings.secondaryPhone || ''}
                  onChange={(e) => updateField('secondaryPhone', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Official Registered Office Address
                </label>
                <input
                  type="text"
                  value={settings.officialAddress || ''}
                  onChange={(e) => updateField('officialAddress', e.target.value)}
                  placeholder="e.g. Suite 402, Pulse Tech Tower, Cyber City"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:col-span-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={settings.city || 'Gurugram'}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">State</label>
                  <input
                    type="text"
                    value={settings.state || 'Haryana'}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pincode</label>
                  <input
                    type="text"
                    value={settings.pincode || '122002'}
                    onChange={(e) => updateField('pincode', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Country</label>
                  <input
                    type="text"
                    value={settings.country || 'India'}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: SOCIAL LINKS */}
        {(activeSection === 'all' || activeSection === 'social') && matchesSearch('social linkedin instagram twitter facebook youtube github') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Icons.Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">4. Official Social Handles & Media Links</h3>
                <p className="text-slate-500 text-xs">Public profile links rendered on website, footer, and proposals.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Icons.Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn URL
                </label>
                <input
                  type="url"
                  value={settings.linkedinUrl || ''}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/company/dizopulse"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Icons.Instagram className="w-3.5 h-3.5 text-pink-600" /> Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.instagramUrl || ''}
                  onChange={(e) => updateField('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/dizopulse"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Icons.Twitter className="w-3.5 h-3.5 text-sky-500" /> Twitter / X URL
                </label>
                <input
                  type="url"
                  value={settings.twitterUrl || ''}
                  onChange={(e) => updateField('twitterUrl', e.target.value)}
                  placeholder="https://x.com/dizopulse"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Icons.Facebook className="w-3.5 h-3.5 text-blue-700" /> Facebook Page URL
                </label>
                <input
                  type="url"
                  value={settings.facebookUrl || ''}
                  onChange={(e) => updateField('facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/dizopulse"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Icons.Youtube className="w-3.5 h-3.5 text-rose-600" /> YouTube Channel
                </label>
                <input
                  type="url"
                  value={settings.youtubeUrl || ''}
                  onChange={(e) => updateField('youtubeUrl', e.target.value)}
                  placeholder="https://youtube.com/@dizopulse"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Icons.Github className="w-3.5 h-3.5 text-slate-800" /> GitHub Repo / Org
                </label>
                <input
                  type="url"
                  value={settings.githubUrl || ''}
                  onChange={(e) => updateField('githubUrl', e.target.value)}
                  placeholder="https://github.com/dizopulse"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: BUSINESS HOURS & TIMEZONE */}
        {(activeSection === 'all' || activeSection === 'hours') && matchesSearch('business hours working days start end timezone') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                <Icons.Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">5. Business Hours & SLA Timezone</h3>
                <p className="text-slate-500 text-xs">Standard working shift hours, SLA response expectations, and operational timezone.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Working Days
                </label>
                <input
                  type="text"
                  value={settings.workingDays || 'Monday - Saturday'}
                  onChange={(e) => updateField('workingDays', e.target.value)}
                  placeholder="e.g. Monday - Saturday"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Shift Hours (Start - End)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={settings.startHour || '09:30'}
                    onChange={(e) => updateField('startHour', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                  />
                  <span className="text-slate-400 font-bold text-xs">to</span>
                  <input
                    type="time"
                    value={settings.endHour || '18:30'}
                    onChange={(e) => updateField('endHour', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Operational Timezone
                </label>
                <input
                  type="text"
                  value={settings.timezone || 'Asia/Kolkata (IST +5:30)'}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Client Support Hours SLA Note
                </label>
                <input
                  type="text"
                  value={settings.supportHours || '24/7 Priority Support for Retainer Clients'}
                  onChange={(e) => updateField('supportHours', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: DEFAULT CURRENCY & GST SETTINGS */}
        {(activeSection === 'all' || activeSection === 'currency') && matchesSearch('currency gst tax gstin pan rate billing') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Icons.DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    6. Financial Currency & GST Compliance Settings
                    {!isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                        🔒 Critical Tax Settings (Super Admin Guard)
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-500 text-xs">GSTIN tax registration, PAN number, default currency, and tax billing rates.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Currency Code
                </label>
                <select
                  value={settings.currencyCode || 'INR'}
                  onChange={(e) => updateField('currencyCode', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                >
                  <option value="INR">INR (Indian Rupee - ₹)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                  <option value="EUR">EUR (Euro - €)</option>
                  <option value="GBP">GBP (British Pound - £)</option>
                  <option value="AED">AED (UAE Dirham - AED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settings.currencySymbol || '₹'}
                  onChange={(e) => updateField('currencySymbol', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Default GST Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.defaultGstRate ?? 18}
                  onChange={(e) => updateField('defaultGstRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  GSTIN / Tax Identification No.
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.gstinNumber || ''}
                  onChange={(e) => updateField('gstinNumber', e.target.value.toUpperCase())}
                  placeholder="07AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 disabled:opacity-60 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Agency Permanent Account No. (PAN)
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.panNumber || ''}
                  onChange={(e) => updateField('panNumber', e.target.value.toUpperCase())}
                  placeholder="AAAAA0000A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 disabled:opacity-60 uppercase"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableGstBilling ?? true}
                    onChange={(e) => updateField('enableGstBilling', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Enable Tax & GST Billing</span>
                    <span className="text-[10px] text-slate-500">Auto-calculate GST on all proposals & invoice PDFs</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: EMAIL & WHATSAPP CONTACT SETTINGS */}
        {(activeSection === 'all' || activeSection === 'communication') && matchesSearch('whatsapp email welcome message reply auto responder') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Icons.MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">7. WhatsApp & Email Routing Settings</h3>
                <p className="text-slate-500 text-xs">WhatsApp ping numbers, default client welcome greeting, and auto-responder toggles.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  WhatsApp Country Code
                </label>
                <input
                  type="text"
                  value={settings.whatsappCountryCode || '+91'}
                  onChange={(e) => updateField('whatsappCountryCode', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Official WhatsApp Hotline
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber || '9876543210'}
                  onChange={(e) => updateField('whatsappNumber', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Default Reply-To Email
                </label>
                <input
                  type="email"
                  value={settings.replyToEmail || 'hello@dizopulse.com'}
                  onChange={(e) => updateField('replyToEmail', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Default Client Welcome & Inquiry Greeting Message
                </label>
                <textarea
                  rows={2}
                  value={settings.defaultWelcomeMessage || ''}
                  onChange={(e) => updateField('defaultWelcomeMessage', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="md:col-span-3 flex items-center pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAutoResponder ?? true}
                    onChange={(e) => updateField('enableAutoResponder', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Enable Automated Inquiry Acknowledgment</span>
                    <span className="text-[10px] text-slate-500">Send immediate welcome response upon receiving new client web leads</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: PROPOSAL DEFAULT TERMS */}
        {(activeSection === 'all' || activeSection === 'proposal_terms') && matchesSearch('proposal validity payment terms scope disclaimer') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Icons.FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">8. Proposal Default Terms & Validity</h3>
                <p className="text-slate-500 text-xs">Default proposal expiration timeline, payment split percentages, and disclaimer boilerplate.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Default Proposal Validity (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.proposalValidityDays ?? 15}
                  onChange={(e) => updateField('proposalValidityDays', parseInt(e.target.value) || 15)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Default Payment Split Structure
                </label>
                <input
                  type="text"
                  value={settings.defaultPaymentTermsPercent || '50% Upfront, 30% Mid-Milestone, 20% Final Delivery'}
                  onChange={(e) => updateField('defaultPaymentTermsPercent', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Scope Clarification Disclaimer
                </label>
                <input
                  type="text"
                  value={settings.scopeClarificationDisclaimer || ''}
                  onChange={(e) => updateField('scopeClarificationDisclaimer', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Standard Proposal Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={settings.standardProposalTerms || ''}
                  onChange={(e) => updateField('standardProposalTerms', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 9: CONTRACT DEFAULT TERMS */}
        {(activeSection === 'all' || activeSection === 'contract_terms') && matchesSearch('contract jurisdiction nda termination interest clauses') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-2xl">
                <Icons.FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">9. Contract Default Legal Clauses</h3>
                <p className="text-slate-500 text-xs">Legal jurisdiction, NDA enforcement, termination notice, and late payment interest clauses.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Legal Jurisdiction City / Court
                </label>
                <input
                  type="text"
                  value={settings.jurisdictionCity || 'Gurugram, Haryana'}
                  onChange={(e) => updateField('jurisdictionCity', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Termination Notice Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={settings.terminationNoticeDays ?? 14}
                  onChange={(e) => updateField('terminationNoticeDays', parseInt(e.target.value) || 14)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Late Payment Interest Rate (% / month)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.latePaymentInterestPercent ?? 1.5}
                  onChange={(e) => updateField('latePaymentInterestPercent', parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="md:col-span-3 flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ndaClauseEnabled ?? true}
                    onChange={(e) => updateField('ndaClauseEnabled', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Include Standard Mutual NDA Clause</span>
                    <span className="text-[10px] text-slate-500">Automatically inject non-disclosure terms in all generated contracts</span>
                  </div>
                </label>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Standard Contract Terms & Boilerplate Clauses
                </label>
                <textarea
                  rows={3}
                  value={settings.standardContractClauses || ''}
                  onChange={(e) => updateField('standardContractClauses', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 10: PROJECT DEFAULT SETTINGS */}
        {(activeSection === 'all' || activeSection === 'project_defaults') && matchesSearch('project milestone approval days archive') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-2xl">
                <Icons.FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">10. Project Operations & Milestone Defaults</h3>
                <p className="text-slate-500 text-xs">Milestone workflows, client sign-off rules, and auto-archiving schedules.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Default Milestone Lifecycle Template
                </label>
                <input
                  type="text"
                  value={settings.defaultMilestoneStructure || ''}
                  onChange={(e) => updateField('defaultMilestoneStructure', e.target.value)}
                  placeholder="e.g. Discovery -> Design -> Development -> QA -> Launch"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Default Milestone Duration (Working Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.defaultWorkingDaysPerMilestone ?? 7}
                  onChange={(e) => updateField('defaultWorkingDaysPerMilestone', parseInt(e.target.value) || 7)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Auto-Archive Completed Projects (After Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.autoArchiveCompletedProjectsDays ?? 90}
                  onChange={(e) => updateField('autoArchiveCompletedProjectsDays', parseInt(e.target.value) || 90)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireMilestoneApproval ?? true}
                    onChange={(e) => updateField('requireMilestoneApproval', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Require Mandatory Client Milestone Sign-Off</span>
                    <span className="text-[10px] text-slate-500">Require client portal approval before advancing to next deliverable stage</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 11: CLIENT PORTAL SETTINGS */}
        {(activeSection === 'all' || activeSection === 'client_portal') && matchesSearch('client portal registration uploads bios banner') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                <Icons.Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">11. Client Workspace & Portal Policies</h3>
                <p className="text-slate-500 text-xs">Portal registration rules, staff bio visibility, and welcome banner text.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Client Workspace Welcome Banner Message
                </label>
                <textarea
                  rows={2}
                  value={settings.clientDashboardBannerMessage || ''}
                  onChange={(e) => updateField('clientDashboardBannerMessage', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowClientSelfRegistration ?? false}
                    onChange={(e) => updateField('allowClientSelfRegistration', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Allow Client Self-Registration</span>
                    <span className="text-[10px] text-slate-500">Enable public client signup form</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowClientFileUploads ?? true}
                    onChange={(e) => updateField('allowClientFileUploads', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Allow Client File Uploads</span>
                    <span className="text-[10px] text-slate-500">Permit clients to upload assets in workspace</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showStaffBiosToClient ?? true}
                    onChange={(e) => updateField('showStaffBiosToClient', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Show Team Bios to Client</span>
                    <span className="text-[10px] text-slate-500">Display assigned team profiles</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 12: FILE UPLOAD LIMITS & ALLOWED FORMATS */}
        {(activeSection === 'all' || activeSection === 'file_limits') && matchesSearch('file upload size limit extension formats') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                  <Icons.UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    12. File Storage & Security Upload Limits
                    {!isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                        🔒 Security Restricted (Super Admin)
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-500 text-xs">Maximum asset file size limits and allowed file extension rules.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Max File Upload Size (MB)
                </label>
                <input
                  type="number"
                  disabled={!isSuperAdmin}
                  min="1"
                  max="500"
                  value={settings.maxFileUploadSizeMB ?? 25}
                  onChange={(e) => updateField('maxFileUploadSizeMB', parseInt(e.target.value) || 25)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 disabled:opacity-60"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Allowed File Extensions (Comma Separated)
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.allowedFileExtensions || 'pdf, png, jpg, jpeg, zip, docx, figma, mp4, svg, csv, xlsx'}
                  onChange={(e) => updateField('allowedFileExtensions', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 13: MAINTENANCE MODE */}
        {(activeSection === 'all' || activeSection === 'maintenance') && matchesSearch('maintenance mode lockdown bypass banner') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-white">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
                  <Icons.Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    13. Maintenance Mode & Emergency Lockdown
                    {!isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 text-[10px] font-bold border border-rose-800">
                        🔒 Super Admin Only
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-400 text-xs">Restrict public agency site and client portal during upgrades or maintenance.</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isSuperAdmin}
                  checked={settings.maintenanceModeEnabled ?? false}
                  onChange={(e) => updateField('maintenanceModeEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">
                  Maintenance Notice Banner Text
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.maintenanceNoticeBanner || ''}
                  onChange={(e) => updateField('maintenanceNoticeBanner', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-xs font-medium text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">
                  Allowed Bypass Roles
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.allowedBypassRoles || 'super_admin, admin'}
                  onChange={(e) => updateField('allowedBypassRoles', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-xs font-bold text-white disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 14: SYSTEM STATUS & CORE DIAGNOSTICS */}
        {(activeSection === 'all' || activeSection === 'system_status') && matchesSearch('system status database health uptime memory node environment diagnostics') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Icons.Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">14. System Status & Real-Time Diagnostics</h3>
                  <p className="text-slate-500 text-xs">Live server health, database connectivity, memory footprint, and environment metrics.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchSystemStatus}
                disabled={loadingStatus}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Icons.RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
                Refresh Status
              </button>
            </div>

            {systemStatus ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Database Health</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-slate-900">{systemStatus.database}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Server Uptime</span>
                  <div className="text-xs font-extrabold text-slate-900">
                    {Math.floor(systemStatus.uptimeSeconds / 3600)}h {Math.floor((systemStatus.uptimeSeconds % 3600) / 60)}m {systemStatus.uptimeSeconds % 60}s
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Memory Footprint</span>
                  <div className="text-xs font-extrabold text-slate-900">
                    {systemStatus.memoryUsageMB?.heapUsed} MB / {systemStatus.memoryUsageMB?.rss} MB RSS
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Runtime & Node.js</span>
                  <div className="text-xs font-extrabold text-slate-900 font-mono">
                    Node {systemStatus.nodeVersion} ({systemStatus.platform})
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                Click Refresh Status to query live server telemetry metrics.
              </div>
            )}
          </div>
        )}
      </form>

      {/* RESET CONFIRMATION MODAL */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-rose-800/80 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="p-3 bg-rose-950/80 text-rose-400 border border-rose-800/80 rounded-2xl">
                  <Icons.AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Reset Settings to Factory Defaults?</h3>
                  <p className="text-xs text-slate-400">This action will revert all 14 agency settings sections back to default values.</p>
                </div>
              </div>

              <div className="bg-rose-950/30 border border-rose-900/50 p-3.5 rounded-2xl text-xs text-rose-200/90 leading-relaxed">
                ⚠️ <strong>Super Admin Warning:</strong> Agency branding, GST parameters, contact details, and client portal defaults will be reset.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  disabled={resetting}
                  className="px-5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {resetting ? (
                    <>
                      <Icons.Loader2 className="w-4 h-4 animate-spin" /> Resetting...
                    </>
                  ) : (
                    <>
                      <Icons.RotateCcw className="w-4 h-4" /> Confirm Factory Reset
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
