import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification, NotificationType } from '../types';

interface NotificationCenterProps {
  userEmail?: string;
  isAdmin?: boolean;
  onNavigateToSection?: (section: 'proposals' | 'contracts' | 'projects' | 'assets' | 'messages', entityId?: string) => void;
  className?: string;
}

export function NotificationCenter({
  userEmail,
  isAdmin = false,
  onNavigateToSection,
  className = ''
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Admin notification compose state
  const [showAdminCompose, setShowAdminCompose] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeType, setComposeType] = useState<NotificationType>('system');
  const [composeSection, setComposeSection] = useState<'proposals' | 'contracts' | 'projects' | 'assets' | 'messages'>('projects');
  const [composeEntityId, setComposeEntityId] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  // Auto load notifications
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 12000); // Poll every 12 seconds
    return () => clearInterval(interval);
  }, [userEmail, isAdmin]);

  const loadNotifications = async () => {
    try {
      let url = '/api/notifications';
      if (!isAdmin && userEmail) {
        url += `?email=${encodeURIComponent(userEmail)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: isAdmin ? '' : userEmail })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        loadNotifications();
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeMessage.trim()) return;

    setComposeSending(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: composeRecipient.trim() || 'all',
          title: composeTitle.trim(),
          message: composeMessage.trim(),
          type: composeType,
          relatedEntityId: composeEntityId.trim(),
          relatedSection: composeSection,
          linkText: 'View Details'
        })
      });

      if (res.ok) {
        setShowAdminCompose(false);
        setComposeTitle('');
        setComposeMessage('');
        setComposeRecipient('');
        setComposeEntityId('');
        loadNotifications();
      }
    } catch (err) {
      console.error('Failed to create notification:', err);
    } finally {
      setComposeSending(false);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }

    if (onNavigateToSection && notif.relatedSection) {
      onNavigateToSection(notif.relatedSection, notif.relatedEntityId);
      setIsOpen(false);
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'proposal':
        return {
          icon: Icons.FileText,
          bg: 'bg-cyan-950/80 border-cyan-800/80 text-cyan-400',
          label: 'Proposal'
        };
      case 'contract':
        return {
          icon: Icons.FileCheck,
          bg: 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400',
          label: 'Contract'
        };
      case 'milestone':
        return {
          icon: Icons.CheckCircle2,
          bg: 'bg-amber-950/80 border-amber-800/80 text-amber-400',
          label: 'Milestone'
        };
      case 'asset':
        return {
          icon: Icons.FolderUp,
          bg: 'bg-blue-950/80 border-blue-800/80 text-blue-400',
          label: 'Asset'
        };
      case 'message':
        return {
          icon: Icons.MessageSquare,
          bg: 'bg-purple-950/80 border-purple-800/80 text-purple-400',
          label: 'Message'
        };
      case 'project_status':
        return {
          icon: Icons.Activity,
          bg: 'bg-indigo-950/80 border-indigo-800/80 text-indigo-400',
          label: 'Status'
        };
      default:
        return {
          icon: Icons.Bell,
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          label: 'System'
        };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'unread') return !n.isRead;
    if (filterType !== 'all') return n.type === filterType;
    return true;
  });

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center group"
        title="Notifications Center"
        id="notification-center-trigger"
      >
        <Icons.Bell className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide Drawer / Popover Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for click outside */}
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-12 z-50 w-[calc(100vw-16px)] sm:w-[420px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[620px]"
              id="notification-center-panel"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/80 flex items-center justify-center text-indigo-400">
                    <Icons.Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-800/80 text-rose-400 text-[10px] font-bold rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">Updates for proposals, milestones & messages</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <Icons.CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Mark Read</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => setShowAdminCompose(true)}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer"
                      title="Send Targeted Notification"
                    >
                      <Icons.Plus className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="p-2 border-b border-slate-800/60 bg-slate-950/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: `Unread (${unreadCount})` },
                  { id: 'proposal', label: 'Proposals' },
                  { id: 'contract', label: 'Contracts' },
                  { id: 'milestone', label: 'Milestones' },
                  { id: 'asset', label: 'Assets' },
                  { id: 'message', label: 'Messages' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      filterType === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[460px]">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 px-4 text-center text-slate-500 space-y-3">
                    <Icons.BellOff className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs font-medium">No notifications match this filter.</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const badge = getTypeBadge(notif.type);
                    const TypeIcon = badge.icon;

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer group relative flex items-start gap-3 ${
                          notif.isRead
                            ? 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/80 hover:border-slate-700'
                            : 'bg-slate-900/90 border-indigo-900/60 hover:border-indigo-700 shadow-md shadow-indigo-950/20'
                        }`}
                      >
                        {/* Unread indicator dot */}
                        {!notif.isRead && (
                          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse"></span>
                        )}

                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${badge.bg}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className={`px-2 py-0.2 bg-slate-950 border border-slate-800 text-[10px] font-bold uppercase rounded-md text-slate-300`}>
                              {badge.label}
                            </span>
                            {notif.relatedEntityId && (
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                                {notif.relatedEntityId}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 ml-auto">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>

                          <h4 className={`text-xs font-bold tracking-tight line-clamp-1 ${notif.isRead ? 'text-slate-300' : 'text-white font-extrabold'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>

                          {/* Footer links */}
                          <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-800/40">
                            <span className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                              <span>{notif.linkText || 'Open Section'}</span>
                              <Icons.ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {!notif.isRead && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notif.id, e)}
                                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                                  title="Mark as read"
                                >
                                  <Icons.Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                                  className="p-1 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 rounded transition-colors"
                                  title="Delete notification"
                                >
                                  <Icons.Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Admin Compose Modal Overlay inside Panel */}
              {showAdminCompose && (
                <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Icons.Send className="w-3.5 h-3.5 text-indigo-400" />
                      Create Notification
                    </h4>
                    <button
                      onClick={() => setShowAdminCompose(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateNotification} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Recipient Email ('all' or specific client email)
                      </label>
                      <input
                        type="text"
                        value={composeRecipient}
                        onChange={(e) => setComposeRecipient(e.target.value)}
                        placeholder="e.g. client@business.com or all"
                        className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Type</label>
                        <select
                          value={composeType}
                          onChange={(e) => setComposeType(e.target.value as NotificationType)}
                          className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-2 py-1.5 focus:outline-none"
                        >
                          <option value="system">System Broadcast</option>
                          <option value="proposal">Proposal</option>
                          <option value="contract">Contract</option>
                          <option value="milestone">Milestone</option>
                          <option value="asset">Asset</option>
                          <option value="message">Message</option>
                          <option value="project_status">Project Status</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Target Section</label>
                        <select
                          value={composeSection}
                          onChange={(e) => setComposeSection(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-2 py-1.5 focus:outline-none"
                        >
                          <option value="projects">Projects</option>
                          <option value="proposals">Proposals</option>
                          <option value="contracts">Contracts</option>
                          <option value="assets">Assets</option>
                          <option value="messages">Messages</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Related ID (optional)</label>
                        <input
                          type="text"
                          value={composeEntityId}
                          onChange={(e) => setComposeEntityId(e.target.value)}
                          placeholder="e.g. PRJ-1001"
                          className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Title</label>
                        <input
                          type="text"
                          required
                          value={composeTitle}
                          onChange={(e) => setComposeTitle(e.target.value)}
                          placeholder="Headline..."
                          className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Message Content</label>
                      <textarea
                        required
                        rows={2}
                        value={composeMessage}
                        onChange={(e) => setComposeMessage(e.target.value)}
                        placeholder="Write message for the client..."
                        className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAdminCompose(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={composeSending}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                      >
                        {composeSending ? 'Sending...' : 'Send Notification'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
