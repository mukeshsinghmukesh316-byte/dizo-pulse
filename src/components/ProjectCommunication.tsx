import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectMessage, MessageAttachment, ConversationSummary } from '../types';

interface ProjectCommunicationProps {
  mode?: 'project' | 'admin-hub';
  projectId?: string;
  projectName?: string;
  clientName?: string;
  clientEmail?: string;
  userRole?: 'client' | 'admin' | 'staff';
  userName?: string;
  onSelectProject?: (projectId: string) => void;
}

export const ProjectCommunication: React.FC<ProjectCommunicationProps> = ({
  mode = 'project',
  projectId: propProjectId,
  projectName: propProjectName,
  clientName: propClientName,
  clientEmail,
  userRole = 'client',
  userName,
  onSelectProject
}) => {
  // Admin Hub State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(propProjectId || '');
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [totalUnreadAll, setTotalUnreadAll] = useState<number>(0);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(false);

  // Active Project Conversation State
  const [activeProjectId, setActiveProjectId] = useState<string>(propProjectId || '');
  const [activeProjectName, setActiveProjectName] = useState<string>(propProjectName || 'Project Workspace');
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [messageSearch, setMessageSearch] = useState<string>('');
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Composer State
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);
  const [sendingState, setSendingState] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Mobile View Toggle for Admin Hub
  const [showMobileList, setShowMobileList] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update active project ID when props change
  useEffect(() => {
    if (propProjectId) {
      setActiveProjectId(propProjectId);
      setSelectedProjectId(propProjectId);
    }
    if (propProjectName) {
      setActiveProjectName(propProjectName);
    }
  }, [propProjectId, propProjectName]);

  // Load Admin Hub Conversations
  const fetchConversations = async () => {
    if (mode !== 'admin-hub') return;
    setLoadingConversations(true);
    try {
      const url = `/api/conversations?search=${encodeURIComponent(adminSearch)}` + (clientEmail ? `&email=${encodeURIComponent(clientEmail)}` : '');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        setTotalUnreadAll(data.totalUnreadAll || 0);

        // Auto select first project if none selected
        if (!selectedProjectId && data.conversations && data.conversations.length > 0) {
          const first = data.conversations[0];
          setSelectedProjectId(first.projectId);
          setActiveProjectId(first.projectId);
          setActiveProjectName(first.projectName);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (mode === 'admin-hub') {
      fetchConversations();
    }
  }, [mode, adminSearch, clientEmail]);

  // Load Messages for Active Project
  const fetchProjectMessages = async (pId: string) => {
    if (!pId) return;
    setLoadingMessages(true);
    try {
      const url = `/api/projects/${pId}/messages?search=${encodeURIComponent(messageSearch)}` + (clientEmail ? `&email=${encodeURIComponent(clientEmail)}` : '');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
        if (data.projectName) setActiveProjectName(data.projectName);

        // Mark messages as read automatically when viewed
        markMessagesAsRead(pId);
      }
    } catch (err) {
      console.error('Error fetching project messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    const targetId = mode === 'admin-hub' ? selectedProjectId : activeProjectId;
    if (targetId) {
      fetchProjectMessages(targetId);
    }
  }, [selectedProjectId, activeProjectId, messageSearch, mode]);

  // Mark messages as read
  const markMessagesAsRead = async (pId: string) => {
    try {
      await fetch(`/api/projects/${pId}/messages/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: userRole === 'client' ? 'client' : 'admin' })
      });
      setUnreadCount(0);
      if (mode === 'admin-hub') {
        // refresh unread count on conversation list
        setConversations(prev => prev.map(c => c.projectId === pId ? { ...c, unreadCount: 0 } : c));
      }
    } catch (err) {
      console.error('Error marking messages read:', err);
    }
  };

  // Auto scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Attachment Upload
  const handleFileAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert('File size exceeds 12MB limit. Please upload a smaller file.');
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        const newAttach: MessageAttachment = {
          id: 'att_' + Math.random().toString(36).substr(2, 9),
          fileName: file.name,
          fileType: file.name.split('.').pop()?.toUpperCase() || 'FILE',
          fileSize: file.size,
          fileUrl: base64Data
        };
        setPendingAttachments(prev => [...prev, newAttach]);
        setIsUploadingAttachment(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Attachment error:', err);
      alert('Failed to process file attachment.');
      setIsUploadingAttachment(false);
    }
  };

  // Remove pending attachment
  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string, customAtts?: MessageAttachment[]) => {
    if (e) e.preventDefault();
    const textToSend = customMsg !== undefined ? customMsg : newMessageText;
    const attsToSend = customAtts !== undefined ? customAtts : pendingAttachments;

    if (!textToSend.trim() && attsToSend.length === 0) return;

    const targetPId = mode === 'admin-hub' ? selectedProjectId : activeProjectId;
    if (!targetPId) {
      alert('No active project selected to send message.');
      return;
    }

    const tempId = 'msg_temp_' + Date.now();
    const tempMsg: ProjectMessage = {
      id: tempId,
      projectId: targetPId,
      senderName: userName || (userRole === 'client' ? (propClientName || 'Client') : 'Dizo Admin'),
      senderRole: (userRole || 'client') as 'client' | 'admin' | 'agency' | 'staff',
      senderEmail: clientEmail || '',
      content: textToSend.trim(),
      attachments: attsToSend,
      timestamp: new Date().toISOString(),
      status: 'sending',
      isRead: false
    };

    // Optimistic UI update
    setMessages(prev => [...prev, tempMsg]);
    if (!customMsg) {
      setNewMessageText('');
      setPendingAttachments([]);
    }
    setSendingState(true);

    try {
      const res = await fetch(`/api/projects/${targetPId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: tempMsg.senderName,
          senderRole: tempMsg.senderRole,
          senderEmail: tempMsg.senderEmail,
          content: tempMsg.content,
          attachments: tempMsg.attachments
        })
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
        if (mode === 'admin-hub') {
          fetchConversations();
        }
      } else {
        const errData = await res.json();
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        alert(errData.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    } finally {
      setSendingState(false);
    }
  };

  // Retry Failed Message
  const handleRetryMessage = (failedMsg: ProjectMessage) => {
    setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
    handleSendMessage(undefined, failedMsg.content, failedMsg.attachments);
  };

  // Archive Message (Admin Only)
  const handleToggleArchiveMessage = async (msgId: string, currentArchivedStatus?: boolean) => {
    const targetPId = mode === 'admin-hub' ? selectedProjectId : activeProjectId;
    try {
      const res = await fetch(`/api/projects/${targetPId}/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !currentArchivedStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages(prev => prev.map(m => m.id === msgId ? updated : m));
      }
    } catch (err) {
      console.error('Archive toggle error:', err);
    }
  };

  // Format Bytes Utility
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filtered message display
  const displayMessages = messages.filter(m => showArchived ? true : !m.isArchived);

  // RENDER: Mode 2 — Standalone Admin Communication Hub
  if (mode === 'admin-hub') {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[600px] max-h-[850px]">
        {/* Hub Top Header */}
        <div className="bg-slate-900/90 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-950 text-indigo-400 rounded-2xl border border-indigo-900">
              <Icons.MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Client–Agency Communication Hub
                {totalUnreadAll > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                    {totalUnreadAll} Unread
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Project-specific client conversations, file sharing & agency updates</p>
            </div>
          </div>

          {/* Search Conversations Input */}
          <div className="relative w-full sm:w-64">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search client, project or ID..."
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Dual Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-[500px]">
          {/* Left Column: Conversation List */}
          <div className={`lg:col-span-4 border-r border-slate-800 bg-slate-900/40 flex flex-col ${showMobileList ? 'block' : 'hidden lg:block'}`}>
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Threads ({conversations.length})</span>
              <button
                onClick={fetchConversations}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Icons.RefreshCw className={`w-3 h-3 ${loadingConversations ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Icons.Inbox className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">No project conversations found</p>
                  <p className="text-[10px]">Client messages for active projects will appear here.</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = c.projectId === selectedProjectId;
                  return (
                    <button
                      key={c.projectId}
                      onClick={() => {
                        setSelectedProjectId(c.projectId);
                        setActiveProjectId(c.projectId);
                        setActiveProjectName(c.projectName);
                        setShowMobileList(false);
                        if (onSelectProject) onSelectProject(c.projectId);
                      }}
                      className={`w-full p-4 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative border-l-4 ${
                        isSelected
                          ? 'bg-indigo-950/40 border-l-indigo-500 text-white'
                          : 'hover:bg-slate-900/80 border-l-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-900">
                              {c.projectId}
                            </span>
                            {c.unreadCount > 0 && (
                              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full">
                                {c.unreadCount} NEW
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-xs text-white mt-1 truncate">{c.projectName}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{c.clientName} ({c.clientEmail})</p>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">
                          {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>

                      {c.latestMessage && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 italic bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/60">
                          <strong className="text-indigo-300 font-bold not-italic">{c.latestMessage.senderName}:</strong> {c.latestMessage.content || 'Sent attachment'}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Project Chat Thread */}
          <div className={`lg:col-span-8 flex flex-col bg-slate-950 ${!showMobileList ? 'block' : 'hidden lg:flex'}`}>
            {/* Thread Navigation / Header */}
            <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="lg:hidden p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:text-white"
                >
                  <Icons.ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                      {selectedProjectId}
                    </span>
                    <h4 className="font-extrabold text-sm text-white truncate">{activeProjectName}</h4>
                  </div>
                </div>
              </div>

              {/* Message Search in active thread */}
              <div className="flex items-center gap-2">
                <div className="relative w-36 sm:w-48">
                  <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search thread..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2 py-1 text-[11px] text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    showArchived ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {showArchived ? 'Hide Archived' : 'Show Archived'}
                </button>
              </div>
            </div>

            {/* Chat Thread Container */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 min-h-[350px]">
              {loadingMessages ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Icons.Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                  <p className="text-xs">Loading project conversation thread...</p>
                </div>
              ) : displayMessages.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-3">
                  <div className="w-12 h-12 bg-slate-900 text-indigo-400 rounded-2xl mx-auto flex items-center justify-center border border-slate-800">
                    <Icons.MessageSquarePlus className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-300">No messages in this conversation yet</h4>
                  <p className="text-[11px] max-w-sm mx-auto">Send a welcome update or project instructions below to start communicating with the client.</p>
                </div>
              ) : (
                displayMessages.map((msg) => {
                  const isAdminRole = msg.senderRole === 'admin' || msg.senderRole === 'agency' || msg.senderRole === 'staff';
                  const isCurrentUser = userRole === 'client' ? !isAdminRole : isAdminRole;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 max-w-[85%] sm:max-w-[75%] ${
                        isCurrentUser ? 'ml-auto items-end' : 'mr-auto items-start'
                      } ${msg.isArchived ? 'opacity-50' : ''}`}
                    >
                      {/* Sender metadata */}
                      <div className="flex items-center gap-2 text-[10px] px-1">
                        <span className="font-extrabold text-slate-300">{msg.senderName}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${
                          isAdminRole ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {isAdminRole ? 'AGENCY' : 'CLIENT'}
                        </span>
                        <span className="text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Bubble */}
                      <div className={`p-4 rounded-2xl border text-xs space-y-3 relative shadow-md ${
                        isCurrentUser
                          ? 'bg-indigo-950/80 border-indigo-800/80 text-white rounded-tr-xs'
                          : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-xs'
                      }`}>
                        {msg.content && (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {msg.attachments.map((att) => (
                              <div key={att.id} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="p-1.5 bg-slate-900 text-cyan-400 rounded-lg shrink-0">
                                    <Icons.FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-white truncate">{att.fileName}</p>
                                    <span className="text-[9px] text-slate-400 font-mono">{att.fileType} • {formatBytes(att.fileSize)}</span>
                                  </div>
                                </div>

                                <a
                                  href={att.fileUrl}
                                  download={att.fileName}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center gap-1"
                                >
                                  <Icons.Download className="w-3 h-3" />
                                  Download
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message status bar */}
                        <div className="flex items-center justify-end gap-2 text-[9px] font-mono text-slate-400 pt-1">
                          {msg.status === 'sending' && (
                            <span className="text-amber-400 flex items-center gap-1">
                              <Icons.Loader2 className="w-3 h-3 animate-spin" />
                              Sending...
                            </span>
                          )}
                          {msg.status === 'failed' && (
                            <button
                              onClick={() => handleRetryMessage(msg)}
                              className="text-rose-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                            >
                              <Icons.AlertCircle className="w-3 h-3" />
                              Failed (Click to Retry)
                            </button>
                          )}
                          {msg.status === 'sent' && (
                            <span className="flex items-center gap-1">
                              {msg.isRead ? (
                                <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                                  <Icons.CheckCheck className="w-3 h-3 text-cyan-400" />
                                  Read
                                </span>
                              ) : (
                                <span className="text-slate-400 flex items-center gap-0.5">
                                  <Icons.Check className="w-3 h-3 text-slate-500" />
                                  Sent
                                </span>
                              )}
                            </span>
                          )}

                          {/* Admin Archive toggle */}
                          {userRole !== 'client' && (
                            <button
                              onClick={() => handleToggleArchiveMessage(msg.id, msg.isArchived)}
                              title={msg.isArchived ? "Unarchive Message" : "Archive Message"}
                              className="ml-2 text-slate-500 hover:text-amber-400 transition-colors"
                            >
                              <Icons.Archive className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Bar */}
            <div className="p-3 md:p-4 bg-slate-900/90 border-t border-slate-800 space-y-3 sticky bottom-0">
              {/* Pending Attachments list */}
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                  {pendingAttachments.map((att) => (
                    <div key={att.id} className="p-1.5 px-2.5 bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-2 text-xs">
                      <Icons.Paperclip className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-white font-medium max-w-[140px] truncate">{att.fileName}</span>
                      <button
                        onClick={() => handleRemovePendingAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileAttachment}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.docx,.zip,.mp4"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className="p-2.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer shrink-0"
                  title="Attach file (JPG, PNG, PDF, DOCX, ZIP)"
                >
                  {isUploadingAttachment ? (
                    <Icons.Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : (
                    <Icons.Paperclip className="w-4 h-4 text-cyan-400" />
                  )}
                </button>

                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                />

                <button
                  type="submit"
                  disabled={sendingState || (!newMessageText.trim() && pendingAttachments.length === 0)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-950/50 shrink-0"
                >
                  {sendingState ? (
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Icons.Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Mode 1 — Embedded Project View (Client Dashboard / Admin Project Detail)
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
      {/* Embedded Header */}
      <div className="bg-slate-900/90 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-900">
            <Icons.MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-white flex items-center gap-2">
              Project Communication Channel
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-400">Direct client-agency project thread for {activeProjectName} ({activeProjectId})</p>
          </div>
        </div>

        {/* Search inside project conversation */}
        <div className="relative w-44 sm:w-56">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search messages..."
            value={messageSearch}
            onChange={(e) => setMessageSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 max-h-[500px]">
        {loadingMessages ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Icons.Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-400" />
            <p className="text-xs">Loading conversation history...</p>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <Icons.MessageSquarePlus className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-300">No messages in this project yet</h4>
            <p className="text-[11px]">Type a message below to send an update directly to the agency team.</p>
          </div>
        ) : (
          displayMessages.map((msg) => {
            const isAdminRole = msg.senderRole === 'admin' || msg.senderRole === 'agency' || msg.senderRole === 'staff';
            const isCurrentUser = userRole === 'client' ? !isAdminRole : isAdminRole;

            return (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1 max-w-[85%] sm:max-w-[75%] ${
                  isCurrentUser ? 'ml-auto items-end' : 'mr-auto items-start'
                } ${msg.isArchived ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2 text-[10px] px-1">
                  <span className="font-extrabold text-slate-300">{msg.senderName}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${
                    isAdminRole ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {isAdminRole ? 'AGENCY' : 'CLIENT'}
                  </span>
                  <span className="text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className={`p-4 rounded-2xl border text-xs space-y-3 relative shadow-md ${
                  isCurrentUser
                    ? 'bg-indigo-950/80 border-indigo-800/80 text-white rounded-tr-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-xs'
                }`}>
                  {msg.content && (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 bg-slate-900 text-cyan-400 rounded-lg shrink-0">
                              <Icons.FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-white truncate">{att.fileName}</p>
                              <span className="text-[9px] text-slate-400 font-mono">{att.fileType} • {formatBytes(att.fileSize)}</span>
                            </div>
                          </div>

                          <a
                            href={att.fileUrl}
                            download={att.fileName}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center gap-1"
                          >
                            <Icons.Download className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 text-[9px] font-mono text-slate-400 pt-1">
                    {msg.status === 'sending' && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Icons.Loader2 className="w-3 h-3 animate-spin" />
                        Sending...
                      </span>
                    )}
                    {msg.status === 'failed' && (
                      <button
                        onClick={() => handleRetryMessage(msg)}
                        className="text-rose-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Icons.AlertCircle className="w-3 h-3" />
                        Failed (Click to Retry)
                      </button>
                    )}
                    {msg.status === 'sent' && (
                      <span className="flex items-center gap-1">
                        {msg.isRead ? (
                          <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                            <Icons.CheckCheck className="w-3 h-3 text-cyan-400" />
                            Read
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-0.5">
                            <Icons.Check className="w-3 h-3 text-slate-500" />
                            Sent
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Embedded Composer Bar */}
      <div className="p-3 md:p-4 bg-slate-900/90 border-t border-slate-800 space-y-3 sticky bottom-0">
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
            {pendingAttachments.map((att) => (
              <div key={att.id} className="p-1.5 px-2.5 bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-2 text-xs">
                <Icons.Paperclip className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-white font-medium max-w-[140px] truncate">{att.fileName}</span>
                <button
                  onClick={() => handleRemovePendingAttachment(att.id)}
                  className="text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileAttachment}
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf,.docx,.zip,.mp4"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAttachment}
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer shrink-0"
            title="Attach file"
          >
            {isUploadingAttachment ? (
              <Icons.Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <Icons.Paperclip className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          <input
            type="text"
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
          />

          <button
            type="submit"
            disabled={sendingState || (!newMessageText.trim() && pendingAttachments.length === 0)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-950/50 shrink-0"
          >
            {sendingState ? (
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Icons.Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
