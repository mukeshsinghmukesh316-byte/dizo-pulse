import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { ProjectMessage, MessageAttachment, ConversationSummary, Project } from '../../types';

interface PortalMessagesPageProps {
  navigate: (path: string) => void;
}

export const PortalMessagesPage: React.FC<PortalMessagesPageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();

  // Conversation & Navigation State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('PRJ-1001');
  const [activeProjectName, setActiveProjectName] = useState<string>('Brand Identity & Web Platform');
  const [conversationSearch, setConversationSearch] = useState<string>('');
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);

  // Mobile View Toggle: 'list' on mobile shows conversations; 'chat' shows active thread full screen
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Active Chat State
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [messageSearch, setMessageSearch] = useState<string>('');
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalUnreadAll, setTotalUnreadAll] = useState<number>(0);

  // Composer State
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);
  const [sendingState, setSendingState] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Load of Conversations
  useEffect(() => {
    loadClientConversations();
  }, [currentUser?.email]);

  const loadClientConversations = async () => {
    setLoadingConversations(true);
    try {
      const email = currentUser?.email;
      const url = email 
        ? `/api/conversations?email=${encodeURIComponent(email)}` 
        : '/api/conversations';
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const convList: ConversationSummary[] = data.conversations || [];
        
        if (convList.length > 0) {
          setConversations(convList);
          setTotalUnreadAll(data.totalUnreadAll || 0);
          
          // If no selected project or selected project not in list, select first
          if (!selectedProjectId || !convList.some(c => c.projectId === selectedProjectId)) {
            setSelectedProjectId(convList[0].projectId);
            setActiveProjectName(convList[0].projectName);
          }
        } else {
          // Fallback if no specific conversations yet
          loadFallbackProjects();
        }
      } else {
        loadFallbackProjects();
      }
    } catch (e) {
      console.error('Error loading conversations:', e);
      loadFallbackProjects();
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadFallbackProjects = async () => {
    try {
      const email = currentUser?.email;
      const res = await fetch(email ? `/api/projects?email=${encodeURIComponent(email)}` : '/api/projects');
      if (res.ok) {
        const projData: Project[] = await res.json();
        if (projData && projData.length > 0) {
          const summaries: ConversationSummary[] = projData.map(p => ({
            projectId: p.id,
            projectName: p.projectName || 'Project Workspace',
            clientName: p.clientName || currentUser?.name || 'Valued Client',
            clientEmail: p.email || currentUser?.email || '',
            lastActivity: p.lastUpdated || p.startDate || new Date().toISOString(),
            totalMessages: 1,
            unreadCount: 0
          }));
          setConversations(summaries);
          setSelectedProjectId(summaries[0].projectId);
          setActiveProjectName(summaries[0].projectName);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load fallback projects:', err);
    }

    // Default static fallback
    const defaultFallback: ConversationSummary = {
      projectId: 'PRJ-1001',
      projectName: `${currentUser?.company || 'Aura Digital Labs'} — Brand Identity & Web Platform`,
      clientName: currentUser?.name || 'Valued Client',
      clientEmail: currentUser?.email || 'client@business.com',
      lastActivity: new Date().toISOString(),
      totalMessages: 2,
      unreadCount: 0
    };
    setConversations([defaultFallback]);
    setSelectedProjectId(defaultFallback.projectId);
    setActiveProjectName(defaultFallback.projectName);
  };

  // Load Messages for the Selected Project
  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectMessages(selectedProjectId);
    }
  }, [selectedProjectId, messageSearch]);

  const fetchProjectMessages = async (pId: string) => {
    if (!pId) return;
    setLoadingMessages(true);
    try {
      const email = currentUser?.email;
      const url = `/api/projects/${pId}/messages?search=${encodeURIComponent(messageSearch)}` + 
        (email ? `&email=${encodeURIComponent(email)}` : '');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || [];
        setMessages(msgs);
        setUnreadCount(data.unreadCount || 0);
        if (data.projectName) {
          setActiveProjectName(data.projectName);
        }

        // Mark unread messages as read automatically
        markMessagesAsRead(pId);
      } else {
        // Fallback default message if fresh project
        setMessages([
          {
            id: 'init-msg-1',
            projectId: pId,
            senderName: 'Aisha Sharma',
            senderRole: 'agency',
            senderEmail: 'aisha@dizopulse.com',
            content: 'Hello! I am Aisha Sharma, your Dedicated Senior Project Lead at Dizo Pulse. We have initiated the core discovery and milestone architecture for your project. Please feel free to share any brand assets, feedback, or revision requests directly in this channel.',
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
            status: 'sent',
            isRead: true
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching project messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markMessagesAsRead = async (pId: string) => {
    try {
      await fetch(`/api/projects/${pId}/messages/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'client' })
      });
      setUnreadCount(0);
      setConversations(prev => prev.map(c => c.projectId === pId ? { ...c, unreadCount: 0 } : c));
    } catch (err) {
      console.error('Error marking messages read:', err);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMessages]);

  // Handle Attachment Upload
  const handleFileAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      showToast('File size exceeds 12MB limit.');
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        const newAttach: MessageAttachment = {
          id: 'att_' + Math.random().toString(36).substring(2, 9),
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
      showToast('Failed to process file attachment.');
      setIsUploadingAttachment(false);
    }
  };

  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string, customAtts?: MessageAttachment[]) => {
    if (e) e.preventDefault();
    const textToSend = customMsg !== undefined ? customMsg : newMessageText;
    const attsToSend = customAtts !== undefined ? customAtts : pendingAttachments;

    if (!textToSend.trim() && attsToSend.length === 0) return;

    const targetPId = selectedProjectId || 'PRJ-1001';
    const tempId = 'msg_temp_' + Date.now();
    const tempMsg: ProjectMessage = {
      id: tempId,
      projectId: targetPId,
      senderName: currentUser?.name || 'Client',
      senderRole: 'client',
      senderEmail: currentUser?.email || '',
      content: textToSend.trim(),
      attachments: attsToSend,
      timestamp: new Date().toISOString(),
      status: 'sending',
      isRead: false
    };

    // Optimistic UI Update
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
          senderRole: 'client',
          senderEmail: tempMsg.senderEmail,
          content: tempMsg.content,
          attachments: tempMsg.attachments
        })
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
        // Refresh conversations to update last message preview
        loadClientConversations();
      } else {
        const errData = await res.json();
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        showToast(errData.error || 'Failed to dispatch message.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      showToast('Network error while dispatching message.');
    } finally {
      setSendingState(false);
    }
  };

  const handleRetryMessage = (failedMsg: ProjectMessage) => {
    setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
    handleSendMessage(undefined, failedMsg.content, failedMsg.attachments);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format Clear Timestamps
  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isToday) {
        return `Today at ${timeStr}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${timeStr}`;
      }

      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch {
      return '';
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c => {
    if (!conversationSearch.trim()) return true;
    const q = conversationSearch.toLowerCase();
    return (
      c.projectId.toLowerCase().includes(q) ||
      c.projectName.toLowerCase().includes(q) ||
      (c.latestMessage?.content && c.latestMessage.content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 w-full max-w-7xl mx-auto antialiased" id="portal-messages-page">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-4 sm:right-6 z-50 p-3.5 bg-slate-900 border border-indigo-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-2xl"
          >
            <Icons.Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header Bar (Hidden or Compact on Mobile when Chat is Active for maximum vertical screen space) */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 ${
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Project Communication & Messages
            </h1>
            <span className="px-2.5 py-0.5 bg-rose-950/90 border border-rose-800 text-rose-300 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Live Team Channel
            </span>
            {totalUnreadAll > 0 && (
              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full">
                {totalUnreadAll} Unread
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Collaborate directly with your Project Manager Aisha Sharma, share feedback notes, and track milestone revisions.
          </p>
        </div>

        {/* Quick WhatsApp Escalate Button */}
        <a
          href="https://wa.me/917017324978?text=Hello%20Aisha%2C%20I%20have%20an%20urgent%20message%20regarding%20my%20Dizo%20Pulse%20project."
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          <Icons.MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>WhatsApp Escalation</span>
        </a>
      </div>

      {/* ========================================================================= */}
      {/* RESPONSIVE MESSAGES SHELL (2-Panel Desktop / Full-Screen Switcher Mobile) */}
      {/* ========================================================================= */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[580px] h-[calc(100vh-170px)] max-h-[860px]">
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden h-full">

          {/* ===================================================================== */}
          {/* PANEL 1: CONVERSATION LIST (Full screen on mobile if mobileView=list) */}
          {/* ===================================================================== */}
          <div
            className={`md:col-span-4 lg:col-span-4 border-r border-slate-800 bg-slate-900/40 flex flex-col h-full overflow-hidden ${
              mobileView === 'list' ? 'flex w-full' : 'hidden md:flex'
            }`}
          >
            {/* Conversation List Search & Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/70 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Icons.FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Conversations ({conversations.length})</span>
                </span>

                <button
                  type="button"
                  onClick={loadClientConversations}
                  disabled={loadingConversations}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Icons.RefreshCw className={`w-3 h-3 ${loadingConversations ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search project or messages..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Conversation Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5">
              {loadingConversations ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <Icons.Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-400" />
                  <p className="text-xs">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-2 px-4">
                  <Icons.Inbox className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">No conversations found</p>
                  <p className="text-[11px]">Active project threads will appear here.</p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = c.projectId === selectedProjectId;
                  return (
                    <button
                      key={c.projectId}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(c.projectId);
                        setActiveProjectName(c.projectName);
                        setMobileView('chat'); // Switch to full-screen chat on mobile
                      }}
                      className={`w-full p-3.5 sm:p-4 text-left transition-all rounded-2xl cursor-pointer flex flex-col justify-between space-y-2 my-1 border ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-600/80 text-white shadow-md'
                          : 'bg-slate-950/40 hover:bg-slate-900/80 border-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-900">
                              {c.projectId}
                            </span>
                            {c.unreadCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full animate-pulse">
                                {c.unreadCount} NEW
                              </span>
                            )}
                          </div>
                          <h2 className="font-extrabold text-xs text-white mt-1 truncate">
                            {c.projectName}
                          </h2>
                          <p className="text-[11px] text-slate-400 truncate">
                            Lead: Aisha Sharma
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {c.lastActivity ? formatMessageTime(c.lastActivity).split(' at')[0] : ''}
                        </span>
                      </div>

                      {c.latestMessage && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 italic bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/60">
                          <strong className="text-indigo-300 font-bold not-italic">
                            {c.latestMessage.senderRole === 'client' ? 'You' : c.latestMessage.senderName}:
                          </strong>{' '}
                          {c.latestMessage.content || 'Attached file deliverable'}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* PANEL 2: CHAT THREAD (Full screen on mobile if mobileView=chat)       */}
          {/* ===================================================================== */}
          <div
            className={`md:col-span-8 lg:col-span-8 flex flex-col h-full bg-slate-950 overflow-hidden ${
              mobileView === 'chat' ? 'flex w-full' : 'hidden md:flex'
            }`}
          >
            {/* Chat Thread Header Bar */}
            <div className="p-3.5 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Mobile Back to Messages Button */}
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl flex items-center gap-1 text-xs font-bold transition-all shrink-0 cursor-pointer"
                  title="Back to Conversation List"
                  id="mobile-back-to-messages-btn"
                >
                  <Icons.ArrowLeft className="w-4 h-4 text-indigo-400" />
                  <span className="hidden xs:inline">Messages</span>
                </button>

                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                  AS
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[150px] sm:max-w-[280px]">
                      {activeProjectName}
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Online" />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Lead: Aisha Sharma • ID: {selectedProjectId}
                  </p>
                </div>
              </div>

              {/* Thread Search */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-28 sm:w-44">
                  <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search thread..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* WhatsApp Escalation for Mobile in Chat Header */}
                <a
                  href="https://wa.me/917017324978"
                  target="_blank"
                  rel="noreferrer"
                  className="sm:hidden p-2 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-lg hover:bg-emerald-900"
                  title="WhatsApp Escalation"
                >
                  <Icons.MessageSquare className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto space-y-4 overflow-x-hidden min-h-0">
              {loadingMessages ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <Icons.Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                  <p className="text-xs">Loading conversation history...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-3 px-4">
                  <div className="w-12 h-12 bg-slate-900 text-indigo-400 rounded-2xl mx-auto flex items-center justify-center border border-slate-800">
                    <Icons.MessageSquarePlus className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-300">No messages in this project thread yet</h3>
                  <p className="text-[11px] max-w-sm mx-auto">
                    Type a message below to coordinate directly with your Senior Project Manager.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isClient = msg.senderRole === 'client';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 max-w-[90%] sm:max-w-[80%] ${
                        isClient ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      {/* Sender Details */}
                      <div className="flex items-center gap-1.5 text-[10px] px-1">
                        <span className="font-extrabold text-slate-300 truncate max-w-[120px]">
                          {isClient ? 'You' : msg.senderName}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${
                            isClient
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          }`}
                        >
                          {isClient ? 'CLIENT' : 'AGENCY LEAD'}
                        </span>
                        <span className="text-slate-500 text-[9px] font-mono">
                          {formatMessageTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* Chat Message Bubble */}
                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl border text-xs space-y-2.5 relative shadow-md break-words [overflow-wrap:anywhere] max-w-full ${
                          isClient
                            ? 'bg-indigo-950/80 border-indigo-700/80 text-white rounded-tr-xs'
                            : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-xs'
                        }`}
                      >
                        {msg.content && (
                          <p className="whitespace-pre-wrap leading-relaxed select-text">
                            {msg.content}
                          </p>
                        )}

                        {/* Attachments Section */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {msg.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2 max-w-full"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="p-1.5 bg-slate-900 text-cyan-400 rounded-lg shrink-0">
                                    <Icons.FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold text-white truncate">
                                      {att.fileName}
                                    </p>
                                    <span className="text-[9px] text-slate-400 font-mono">
                                      {att.fileType} • {formatBytes(att.fileSize)}
                                    </span>
                                  </div>
                                </div>

                                <a
                                  href={att.fileUrl}
                                  download={att.fileName}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                  <Icons.Download className="w-3 h-3" />
                                  <span className="hidden xs:inline">Download</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message Delivery Status Bar */}
                        <div className="flex items-center justify-end gap-1 text-[9px] font-mono text-slate-400 pt-0.5">
                          {msg.status === 'sending' && (
                            <span className="text-amber-400 flex items-center gap-1">
                              <Icons.Loader2 className="w-3 h-3 animate-spin" />
                              <span>Sending...</span>
                            </span>
                          )}
                          {msg.status === 'failed' && (
                            <button
                              type="button"
                              onClick={() => handleRetryMessage(msg)}
                              className="text-rose-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                            >
                              <Icons.AlertCircle className="w-3 h-3" />
                              <span>Failed (Tap to Retry)</span>
                            </button>
                          )}
                          {msg.status === 'sent' && (
                            <span className="flex items-center gap-0.5">
                              {msg.isRead ? (
                                <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                                  <Icons.CheckCheck className="w-3 h-3 text-cyan-400" />
                                  <span>Read</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 flex items-center gap-0.5">
                                  <Icons.Check className="w-3 h-3 text-slate-500" />
                                  <span>Sent</span>
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

            {/* ================================================================= */}
            {/* COMPOSER BAR (Mobile keyboard optimized & sticky bottom)          */}
            {/* ================================================================= */}
            <div className="p-2.5 sm:p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 space-y-2.5 shrink-0 sticky bottom-0 z-20">
              {/* Pending Attachments List */}
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800 max-h-24 overflow-y-auto">
                  {pendingAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-1.5 px-2.5 bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-2 text-xs"
                    >
                      <Icons.Paperclip className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-white font-medium max-w-[120px] sm:max-w-[160px] truncate">
                        {att.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePendingAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
                        title="Remove attachment"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Composer Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileAttachment}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.docx,.zip,.mp4"
                />

                {/* Attachment Trigger Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className="min-w-[40px] h-[42px] sm:h-[44px] bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="Attach file (Images, PDF, ZIP, DOCX, MP4)"
                >
                  {isUploadingAttachment ? (
                    <Icons.Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : (
                    <Icons.Paperclip className="w-4 h-4 text-cyan-400" />
                  )}
                </button>

                {/* Message Input Field */}
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type message to PM..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors min-w-0"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={sendingState || (!newMessageText.trim() && pendingAttachments.length === 0)}
                  className="h-[42px] sm:h-[44px] px-3.5 sm:px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/50 shrink-0"
                >
                  {sendingState ? (
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span className="hidden xs:inline">Send</span>
                      <Icons.Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PortalMessagesPage;
