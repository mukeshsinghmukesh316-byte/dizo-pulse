import React, { useState, useEffect, useMemo } from 'react';
import { AuditLog, AuditLogSeverity, AuditLogStatus } from '../types';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditLogsAdminProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

export function AuditLogsAdmin({
  userRole = 'super_admin',
  userName = 'Agency Admin',
  userEmail = 'admin@dizopulse.com'
}: AuditLogsAdminProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [securityOnly, setSecurityOnly] = useState<boolean>(false);

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const isAdminOrSuper = userRole === 'super_admin' || userRole === 'admin';

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/audit-logs');
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs from server');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err: any) {
      console.error('Audit logs fetch error:', err);
      setError('Unable to load server audit logs. Using cached view.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Filter Logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Staff RBAC Scope Filter
      if (!isAdminOrSuper) {
        // Normal staff can only view logs associated with their email or general system logs
        if (log.userEmail && log.userEmail.toLowerCase() !== userEmail.toLowerCase() && log.user.toLowerCase() !== userName.toLowerCase()) {
          return false;
        }
      }

      // Security Events Only Toggle
      if (securityOnly) {
        const isSecurityEvent =
          log.status === 'failed' ||
          log.severity === 'critical' ||
          log.severity === 'warning' ||
          log.action.includes('LOGIN_FAILED') ||
          log.action.includes('PASSWORD') ||
          log.action.includes('ROLE') ||
          log.action.includes('DELETED');
        if (!isSecurityEvent) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          log.user?.toLowerCase().includes(q) ||
          log.userEmail?.toLowerCase().includes(q) ||
          log.action?.toLowerCase().includes(q) ||
          log.description?.toLowerCase().includes(q) ||
          log.target?.toLowerCase().includes(q) ||
          log.ipAddress?.toLowerCase().includes(q) ||
          log.deviceInfo?.toLowerCase().includes(q) ||
          log.id?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Module Filter
      if (selectedModule !== 'all' && log.module !== selectedModule) {
        return false;
      }

      // Role Filter
      if (selectedRole !== 'all' && log.role !== selectedRole) {
        return false;
      }

      // Severity / Status Filter
      if (selectedSeverity !== 'all') {
        if (selectedSeverity === 'failed_only' && log.status !== 'failed') return false;
        if (selectedSeverity === 'warning' && log.severity !== 'warning') return false;
        if (selectedSeverity === 'critical' && log.severity !== 'critical') return false;
        if (selectedSeverity === 'info' && log.severity !== 'info') return false;
      }

      // Date Range Filter
      if (dateFilter !== 'all') {
        const logDate = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (dateFilter === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (logDate < startOfToday) return false;
        } else if (dateFilter === '7days') {
          if (now - logDate > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (dateFilter === '30days') {
          if (now - logDate > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedModule, selectedRole, selectedSeverity, dateFilter, securityOnly, isAdminOrSuper, userEmail, userName]);

  // Calculations for Stats Headers
  const stats = useMemo(() => {
    const total = logs.length;
    const failedLogins = logs.filter((l) => l.action === 'LOGIN_FAILED' || l.status === 'failed').length;
    const securityWarnings = logs.filter((l) => l.severity === 'critical' || l.severity === 'warning').length;
    const todayCount = logs.filter((l) => {
      const logDate = new Date(l.timestamp).setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      return logDate === today;
    }).length;

    return { total, failedLogins, securityWarnings, todayCount };
  }, [logs]);

  // CSV Export Handler
  const exportToCsv = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'Log ID',
      'Date & Time',
      'User',
      'User Email',
      'Role',
      'Module',
      'Action Code',
      'Target / Entity',
      'Status',
      'Severity',
      'Description',
      'IP Address',
      'Device Info'
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id || ''}"`,
      `"${log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}"`,
      `"${(log.user || '').replace(/"/g, '""')}"`,
      `"${(log.userEmail || '').replace(/"/g, '""')}"`,
      `"${log.role || ''}"`,
      `"${log.module || ''}"`,
      `"${log.action || ''}"`,
      `"${(log.target || '').replace(/"/g, '""')}"`,
      `"${log.status || ''}"`,
      `"${log.severity || ''}"`,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      `"${log.ipAddress || ''}"`,
      `"${(log.deviceInfo || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `dizo_audit_logs_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper functions for badges & icons
  const getSeverityBadge = (severity: AuditLogSeverity, status: AuditLogStatus) => {
    if (status === 'failed' || severity === 'critical') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
          <Icons.ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Security Alert</span>
        </span>
      );
    }
    if (severity === 'warning') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Icons.AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Warning</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Success</span>
      </span>
    );
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'auth':
        return <Icons.Lock className="w-3.5 h-3.5 text-indigo-400" />;
      case 'staff':
        return <Icons.Users className="w-3.5 h-3.5 text-purple-400" />;
      case 'proposals':
        return <Icons.FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'contracts':
        return <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'projects':
        return <Icons.Briefcase className="w-3.5 h-3.5 text-cyan-400" />;
      case 'services':
        return <Icons.Tag className="w-3.5 h-3.5 text-teal-400" />;
      case 'settings':
        return <Icons.Sliders className="w-3.5 h-3.5 text-amber-400" />;
      case 'clients':
        return <Icons.UserCheck className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Icons.Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER TITLE & CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Icons.ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Audit Logs & Security Activity
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Server-Persisted • Immutable
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive security audit trail tracking user authentication, staff permissions, proposal/contract updates, and agency settings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAuditLogs}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700/60 disabled:opacity-50"
          >
            <Icons.RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Logs'}</span>
          </button>

          <button
            onClick={exportToCsv}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Icons.Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {!isAdminOrSuper && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
          <Icons.Info className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>
            <strong>Staff Restricted View:</strong> You are viewing activity logs associated with your staff account (<code>{userEmail}</code>). Full system-wide audit logs are reserved for Administrators.
          </span>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Recorded Logs</span>
            <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
              <Icons.Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.total}</span>
            <span className="text-xs text-slate-400">events logged</span>
          </div>
        </div>

        {/* Failed Logins */}
        <div className={`p-5 rounded-3xl bg-slate-900/60 border backdrop-blur-xl relative overflow-hidden ${
          stats.failedLogins > 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed Auth Attempts</span>
            <div className={`p-2 rounded-xl ${stats.failedLogins > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
              <Icons.Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${stats.failedLogins > 0 ? 'text-rose-400' : 'text-white'}`}>
              {stats.failedLogins}
            </span>
            <span className="text-xs text-slate-400">failed logins</span>
          </div>
        </div>

        {/* Security Warnings */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Events</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Icons.AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{stats.securityWarnings}</span>
            <span className="text-xs text-slate-400">critical / warnings</span>
          </div>
        </div>

        {/* Today Activity */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Activity</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Icons.Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{stats.todayCount}</span>
            <span className="text-xs text-slate-400">logs today</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, email, action code, IP address, target entity..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Security Events Only Toggle */}
          <button
            onClick={() => setSecurityOnly(!securityOnly)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
              securityOnly
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <Icons.ShieldAlert className={`w-4 h-4 ${securityOnly ? 'text-white' : 'text-rose-400'}`} />
            <span>Security Alerts Only</span>
          </button>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          {/* Module Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Module</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Modules</option>
              <option value="auth">🔒 Auth & Security</option>
              <option value="staff">👥 Staff & Roles</option>
              <option value="proposals">📄 Proposals</option>
              <option value="contracts">🛡️ Contracts</option>
              <option value="projects">🚀 Projects</option>
              <option value="services">🏷️ Services & Pricing</option>
              <option value="settings">⚙️ Settings & Branding</option>
              <option value="clients">🤝 Client 360°</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="client">Client</option>
              <option value="system">System Core</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Severity / Status</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="failed_only">❌ Failed Attempts Only</option>
              <option value="critical">🚨 Critical Severity</option>
              <option value="warning">⚠️ Warnings</option>
              <option value="info">ℹ️ Normal Success</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Timeframe</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* AUDIT LOGS TABLE */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.List className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">
              Showing {filteredLogs.length} of {logs.length} Audit Records
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Icons.Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Read-Only Audit Trail</span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <Icons.Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
            <p className="text-xs font-bold">Loading Audit Logs from Server...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Icons.ShieldX className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-bold text-slate-300">No audit logs found</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Status & Time</th>
                  <th className="py-3.5 px-4">User & Role</th>
                  <th className="py-3.5 px-4">Module & Action</th>
                  <th className="py-3.5 px-4">Target & Summary</th>
                  <th className="py-3.5 px-4">IP & Device</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-800/40 transition-all cursor-pointer group"
                  >
                    {/* Status & Time */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="space-y-1">
                        <div>{getSeverityBadge(log.severity, log.status)}</div>
                        <div className="text-[11px] font-bold text-slate-300">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Icons.Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(log.timestamp)}</span>
                        </div>
                      </div>
                    </td>

                    {/* User & Role */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                        {log.user || 'Unknown User'}
                      </div>
                      {log.userEmail && (
                        <div className="text-[11px] text-slate-400 font-mono">{log.userEmail}</div>
                      )}
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60 uppercase">
                          {log.role || 'staff'}
                        </span>
                      </div>
                    </td>

                    {/* Module & Action */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5 font-bold text-slate-300">
                        {getModuleIcon(log.module)}
                        <span className="uppercase text-[11px] tracking-wide text-slate-200">{log.module}</span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block">
                        {log.action}
                      </div>
                    </td>

                    {/* Target & Summary */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      {log.target && (
                        <div className="text-[11px] font-bold text-indigo-300 truncate mb-0.5 flex items-center gap-1">
                          <Icons.CornerDownRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                          <span className="truncate">{log.target}</span>
                        </div>
                      )}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {log.description}
                      </p>
                    </td>

                    {/* IP & Device */}
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                        <Icons.Globe className="w-3 h-3 text-slate-500" />
                        <span>{log.ipAddress || '127.0.0.1'}</span>
                      </div>
                      {log.deviceInfo && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[130px] mt-0.5 flex items-center gap-1" title={log.deviceInfo}>
                          <Icons.Laptop className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{log.deviceInfo}</span>
                        </div>
                      )}
                    </td>

                    {/* View Details Button */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="View Full Log Details"
                      >
                        <Icons.Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AUDIT LOG DETAIL MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 relative"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Icons.ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      Audit Log Detail
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                        {selectedLog.id}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Logged at {new Date(selectedLog.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Severity Bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Status & Severity</span>
                  <div>{getSeverityBadge(selectedLog.severity, selectedLog.status)}</div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Action Code</span>
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 inline-block">
                    {selectedLog.action}
                  </span>
                </div>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* User Info */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Icons.User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Actor / User</span>
                  </div>
                  <p className="text-sm font-bold text-white">{selectedLog.user}</p>
                  {selectedLog.userEmail && (
                    <p className="text-xs font-mono text-slate-400">{selectedLog.userEmail}</p>
                  )}
                  <p className="text-[11px] text-slate-500 uppercase font-bold">Role: {selectedLog.role}</p>
                </div>

                {/* Network & Device Info */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Icons.Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Network & Device</span>
                  </div>
                  <p className="text-xs font-mono text-slate-200">IP: {selectedLog.ipAddress || '127.0.0.1'}</p>
                  <p className="text-xs text-slate-400 leading-relaxed truncate" title={selectedLog.deviceInfo}>
                    Device: {selectedLog.deviceInfo || 'Web Browser'}
                  </p>
                </div>
              </div>

              {/* Target & Description */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Icons.FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Target & Description</span>
                </div>
                {selectedLog.target && (
                  <div className="text-xs font-bold text-indigo-300">
                    Target Entity: <span className="text-white">{selectedLog.target}</span>
                  </div>
                )}
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
                  {selectedLog.description}
                </p>
              </div>

              {/* Raw JSON Metadata Inspector */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Icons.Code className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Extended Log Metadata</span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Icons.ShieldCheck className="w-4 h-4" /> Immutable Server Trail
                </span>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AuditLogsAdmin;
