import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Inquiry, Proposal, Contract, Project, DashboardWidgetConfig, WidgetSize, WidgetId } from '../types';
import { DashboardCustomizerModal } from './DashboardCustomizerModal';

interface AgencyOperationsDashboardProps {
  inquiries: Inquiry[];
  proposals: Proposal[];
  contracts: Contract[];
  projects: Project[];
  conversations: any[];
  staffList: any[];
  userRole: string;
  userName: string;
  userEmail: string;
  onNavigateTab: (tab: any) => void;
  onOpenAddLeadModal: () => void;
  onOpenNewProposalModal: () => void;
  onSelectInquiry: (inq: Inquiry) => void;
  onConvertInquiryToProposal: (inq: Inquiry) => void;
  onOpenChangePassword: () => void;
}

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: 'quick_actions',
    title: 'Quick Actions & Executive Console',
    description: 'Instant actions to create leads, proposals, contracts, projects, and export pipeline data',
    icon: 'Zap',
    visible: true,
    size: 'large',
    order: 0
  },
  {
    id: 'performance',
    title: 'Performance & Agency KPIs',
    description: 'Real-time sales velocity, pipeline values, conversion rates, and revenue forecasts',
    icon: 'TrendingUp',
    visible: true,
    size: 'large',
    order: 1
  },
  {
    id: 'pending_actions',
    title: 'Pending Actions & Urgent Items',
    description: 'Operational alerts needing attention: uncontacted leads, sent proposals, and unread messages',
    icon: 'AlertTriangle',
    visible: true,
    size: 'medium',
    order: 2
  },
  {
    id: 'leads',
    title: 'Leads & Inquiry Flow',
    description: 'Incoming lead intake, pipeline status trackers, and one-click proposal generation',
    icon: 'Users',
    visible: true,
    size: 'medium',
    order: 3
  },
  {
    id: 'projects',
    title: 'Active Projects & Milestone Health',
    description: 'Active project health status, delivery timelines, and milestone progress percentages',
    icon: 'Kanban',
    visible: true,
    size: 'medium',
    order: 4
  },
  {
    id: 'proposals',
    title: 'Proposals & Conversion Status',
    description: 'Sent, viewed, and approved proposals with total values and contract conversion triggers',
    icon: 'FileText',
    visible: true,
    size: 'medium',
    order: 5
  },
  {
    id: 'contracts',
    title: 'Contracts & Legal E-Signatures',
    description: 'Digital service contracts, sign-off status, and project onboarding triggers',
    icon: 'FileCheck',
    visible: true,
    size: 'small',
    order: 6
  },
  {
    id: 'messages',
    title: 'Client Messages & Hub',
    description: 'Direct client conversation threads, unread counter badges, and communication shortcuts',
    icon: 'MessageSquare',
    visible: true,
    size: 'small',
    order: 7
  },
  {
    id: 'recent_activity',
    title: 'Recent Activity Stream',
    description: 'Live chronological agency activity stream across leads, proposals, contracts, and projects',
    icon: 'Clock',
    visible: true,
    size: 'medium',
    order: 8
  }
];

export const AgencyOperationsDashboard: React.FC<AgencyOperationsDashboardProps> = ({
  inquiries = [],
  proposals = [],
  contracts = [],
  projects = [],
  conversations = [],
  staffList = [],
  userRole,
  userName,
  userEmail,
  onNavigateTab,
  onOpenAddLeadModal,
  onOpenNewProposalModal,
  onSelectInquiry,
  onConvertInquiryToProposal,
  onOpenChangePassword
}) => {
  // Layout customization state
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(DEFAULT_WIDGETS);
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [isCustomized, setIsCustomized] = useState(false);
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const isSuperAdmin = userRole === 'super_admin';

  // Load layout from backend on mount or user change
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const emailParam = encodeURIComponent(userEmail || '');
        const res = await fetch(`/api/dashboard-layout?userEmail=${emailParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.layout && Array.isArray(data.layout.widgets)) {
            setWidgets(data.layout.widgets);
            setDensity(data.layout.density || 'comfortable');
            setIsCustomized(Boolean(data.isCustomized));
            return;
          }
        }
      } catch {
        // Fallback to local storage
      }

      // Check localStorage fallback
      const localKey = `dizo_dashboard_layout_${userEmail || 'guest'}`;
      try {
        const cached = localStorage.getItem(localKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.widgets)) {
            setWidgets(parsed.widgets);
            setDensity(parsed.density || 'comfortable');
            setIsCustomized(true);
          }
        }
      } catch {
        // Use default
      }
    };

    fetchLayout();
  }, [userEmail]);

  // Auto-dismiss save feedback
  useEffect(() => {
    if (saveFeedback) {
      const timer = setTimeout(() => setSaveFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveFeedback]);

  // Save personal layout
  const handleSavePersonalLayout = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/dashboard-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userName,
          userRole,
          widgets,
          density,
          isGlobalDefault: false
        })
      });

      if (res.ok) {
        setIsCustomized(true);
        setSaveFeedback('Personal dashboard layout saved successfully!');
        // Cache locally
        localStorage.setItem(`dizo_dashboard_layout_${userEmail}`, JSON.stringify({ widgets, density }));
      } else {
        const err = await res.json();
        setSaveFeedback(`Failed to save layout: ${err.error || 'Server error'}`);
      }
    } catch {
      localStorage.setItem(`dizo_dashboard_layout_${userEmail}`, JSON.stringify({ widgets, density }));
      setIsCustomized(true);
      setSaveFeedback('Dashboard layout saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  // Super Admin Set Global Default Layout
  const handleSetGlobalDefaultLayout = async () => {
    if (!isSuperAdmin) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/dashboard-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userName,
          userRole,
          widgets,
          density,
          isGlobalDefault: true
        })
      });

      if (res.ok) {
        setSaveFeedback('Global default layout set for all agency team members!');
      } else {
        const err = await res.json();
        setSaveFeedback(`Error setting default: ${err.error || 'Permission issue'}`);
      }
    } catch {
      setSaveFeedback('Network error while setting global default layout.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default layout
  const handleResetLayout = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/dashboard-layout/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userName,
          userRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.layout && Array.isArray(data.layout.widgets)) {
          setWidgets(data.layout.widgets);
          setDensity(data.layout.density || 'comfortable');
        } else {
          setWidgets(DEFAULT_WIDGETS);
        }
        setIsCustomized(false);
        localStorage.removeItem(`dizo_dashboard_layout_${userEmail}`);
        setSaveFeedback('Dashboard layout reset to global defaults.');
      } else {
        setWidgets(DEFAULT_WIDGETS);
        setIsCustomized(false);
        setSaveFeedback('Reset to default layout.');
      }
    } catch {
      setWidgets(DEFAULT_WIDGETS);
      setIsCustomized(false);
      localStorage.removeItem(`dizo_dashboard_layout_${userEmail}`);
      setSaveFeedback('Reset to default layout.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Widget Controls
  const handleQuickResize = (widgetId: WidgetId, newSize: WidgetSize) => {
    const updated = widgets.map(w => (w.id === widgetId ? { ...w, size: newSize } : w));
    setWidgets(updated);
    setIsCustomized(true);
  };

  const handleQuickToggleVisibility = (widgetId: WidgetId) => {
    const updated = widgets.map(w => (w.id === widgetId ? { ...w, visible: !w.visible } : w));
    setWidgets(updated);
    setIsCustomized(true);
  };

  const handleQuickMove = (widgetId: WidgetId, direction: 'left' | 'right') => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(w => w.id === widgetId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const item = sorted.splice(currentIndex, 1)[0];
    sorted.splice(targetIndex, 0, item);

    const reordered = sorted.map((w, idx) => ({ ...w, order: idx }));
    setWidgets(reordered);
    setIsCustomized(true);
  };

  // --- REAL-TIME KPIS COMPUTATIONS ---
  const totalLeads = inquiries.length;
  const activeLeads = inquiries.filter(i => !i.archived && i.status !== 'closed').length;
  const newUncontactedLeads = inquiries.filter(i => i.status === 'new').length;
  const closedDeals = inquiries.filter(i => i.status === 'closed').length;
  const totalPipelineValue = inquiries
    .filter(i => !i.archived)
    .reduce((acc, i) => acc + (i.totalDiscounted || i.totalOriginal || 0), 0);
  const avgDealValue = totalLeads > 0 ? Math.round(totalPipelineValue / totalLeads) : 0;
  const highPriorityCount = inquiries.filter(i => i.priority === 'high').length;
  const midPriorityCount = inquiries.filter(i => i.priority === 'medium').length;
  const lowPriorityCount = inquiries.filter(i => i.priority === 'low').length;

  const totalProposals = proposals.length;
  const acceptedProposals = proposals.filter(p => p.status === 'Accepted' || p.status === 'Approved').length;
  const pendingProposals = proposals.filter(p => p.status === 'Sent' || p.status === 'Viewed' || p.status === 'Draft').length;
  const proposalConversionRate = totalProposals > 0 ? Math.round((acceptedProposals / totalProposals) * 100) : 0;
  const totalProposalValue = proposals.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

  const totalContracts = contracts.length;
  const approvedContracts = contracts.filter(c => c.status === 'Approved').length;
  const pendingContracts = contracts.filter(c => c.status === 'Sent' || c.status === 'Awaiting Approval' || c.status === 'Viewed').length;

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled');
  const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;

  // Project Health Breakdown
  const now = new Date();
  const overdueProjects = activeProjects.filter(p => {
    if (p.status === 'On Hold' || p.status === 'Completed') return false;
    const targetDate = p.targetCompletionDate ? new Date(p.targetCompletionDate) : null;
    return targetDate && targetDate < now;
  });
  const atRiskProjects = activeProjects.filter(p => {
    if (overdueProjects.some(op => op.id === p.id)) return false;
    return p.status === 'Revision' || p.status === 'On Hold' || p.status === 'Client Review';
  });
  const onTrackProjects = activeProjects.filter(p => {
    return !overdueProjects.some(op => op.id === p.id) && !atRiskProjects.some(arp => arp.id === p.id);
  });

  // Pending Action Items Count
  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const pendingActionsCount = newUncontactedLeads + pendingProposals + pendingContracts + atRiskProjects.length + totalUnreadMessages;

  // Active Team Count
  const totalTeamMembers = staffList.length;
  const activeTeamMembers = staffList.filter(s => s.status === 'active' || !s.status).length;

  // Weighted sales forecast computation (New = 25%, Contacted = 50%, Proposal = 75%, Closed = 100%)
  const weightedForecast = inquiries
    .filter(i => !i.archived)
    .reduce((acc, inq) => {
      const val = inq.totalDiscounted || inq.totalOriginal || 0;
      if (inq.status === 'closed') return acc + val;
      if (inq.status === 'proposal_sent') return acc + val * 0.75;
      if (inq.status === 'contacted') return acc + val * 0.5;
      return acc + val * 0.25;
    }, 0);

  // Demand breakdown
  const servicePopularity: Record<string, number> = {};
  inquiries.forEach(inq => {
    if (Array.isArray(inq.selectedServices)) {
      inq.selectedServices.forEach(s => {
        servicePopularity[s] = (servicePopularity[s] || 0) + 1;
      });
    }
  });
  const topServices = Object.entries(servicePopularity)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxServiceCount = Math.max(...topServices.map(s => s.count), 1);

  // Recent 5 Inquiries
  const recentInquiries = [...inquiries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Recent 5 Active Projects
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt || b.lastUpdated || 0).getTime() - new Date(a.createdAt || a.lastUpdated || 0).getTime())
    .slice(0, 5);

  // Recent Proposals
  const recentProposals = [...proposals]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  // Recent Contracts
  const recentContracts = [...contracts]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  // Recent Activity Feed Generation
  const activities: Array<{ id: string; title: string; subtitle: string; timestamp: string; type: 'lead' | 'proposal' | 'contract' | 'project' | 'message'; icon: any; color: string }> = [];

  recentInquiries.forEach(inq => {
    activities.push({
      id: 'act_inq_' + inq.id,
      title: `New Inquiry: ${inq.clientName}`,
      subtitle: `${inq.businessName} (${inq.businessNiche || 'General'}) • ₹${(inq.totalDiscounted || inq.totalOriginal || 0).toLocaleString('en-IN')}`,
      timestamp: inq.createdAt,
      type: 'lead',
      icon: Icons.UserPlus,
      color: 'text-cyan-600 bg-cyan-50'
    });
  });

  proposals.slice(0, 4).forEach(prop => {
    activities.push({
      id: 'act_prop_' + prop.id,
      title: `Proposal ${prop.status}: ${prop.businessName}`,
      subtitle: `Value ₹${(prop.totalAmount || 0).toLocaleString('en-IN')} • ${prop.clientName}`,
      timestamp: prop.createdAt || new Date().toISOString(),
      type: 'proposal',
      icon: Icons.FileText,
      color: 'text-indigo-600 bg-indigo-50'
    });
  });

  contracts.slice(0, 4).forEach(ctr => {
    activities.push({
      id: 'act_ctr_' + ctr.id,
      title: `Contract ${ctr.status}: ${ctr.businessName}`,
      subtitle: `Project ${ctr.projectName} • ${ctr.clientName}`,
      timestamp: ctr.createdAt || new Date().toISOString(),
      type: 'contract',
      icon: Icons.FileCheck,
      color: 'text-purple-600 bg-purple-50'
    });
  });

  projects.slice(0, 4).forEach(prj => {
    activities.push({
      id: 'act_prj_' + prj.id,
      title: `Project Activity: ${prj.projectName}`,
      subtitle: `Client ${prj.clientName} • Stage: ${prj.status} (${prj.overallProgress || 0}%)`,
      timestamp: prj.lastUpdated || prj.createdAt || new Date().toISOString(),
      type: 'project',
      icon: Icons.Kanban,
      color: 'text-emerald-600 bg-emerald-50'
    });
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentActivities = activities.slice(0, 7);

  // Sorted list of widgets
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);
  const visibleWidgets = sortedWidgets.filter(w => w.visible);

  // Helper for responsive grid column spans
  const getColSpanClass = (size: WidgetSize) => {
    switch (size) {
      case 'small':
        return 'col-span-1 md:col-span-6 lg:col-span-4';
      case 'medium':
        return 'col-span-1 md:col-span-12 lg:col-span-6 xl:col-span-8';
      case 'large':
      default:
        return 'col-span-1 md:col-span-12';
    }
  };

  // Render widget header with control bar
  const renderWidgetHeader = (
    widgetConfig: DashboardWidgetConfig,
    title: string,
    icon: any,
    subtitle?: string,
    actionButton?: React.ReactNode
  ) => {
    const IconComp = icon || Icons.LayoutGrid;
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <IconComp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2 truncate">
              <span>{title}</span>
            </h3>
            {subtitle && <p className="text-[11px] text-slate-500 font-medium truncate">{subtitle}</p>}
          </div>
        </div>

        {/* Action button + Widget customize bar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 justify-between sm:justify-end">
          {actionButton}

          {/* Quick widget size & move toolbar */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-[10px]">
            {/* Sizing dropdown / buttons */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleQuickResize(widgetConfig.id, 'small')}
                className={`px-1.5 py-0.5 rounded-md font-extrabold transition-all cursor-pointer ${
                  widgetConfig.size === 'small' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Small (1 Col)"
              >
                S
              </button>
              <button
                type="button"
                onClick={() => handleQuickResize(widgetConfig.id, 'medium')}
                className={`px-1.5 py-0.5 rounded-md font-extrabold transition-all cursor-pointer ${
                  widgetConfig.size === 'medium' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Medium (2 Cols)"
              >
                M
              </button>
              <button
                type="button"
                onClick={() => handleQuickResize(widgetConfig.id, 'large')}
                className={`px-1.5 py-0.5 rounded-md font-extrabold transition-all cursor-pointer ${
                  widgetConfig.size === 'large' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Large (Full Width)"
              >
                L
              </button>
            </div>

            <span className="text-slate-300 mx-0.5">|</span>

            {/* Reorder buttons */}
            <button
              type="button"
              onClick={() => handleQuickMove(widgetConfig.id, 'left')}
              className="p-1 hover:bg-white text-slate-500 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
              title="Move Widget Earlier"
            >
              <Icons.ArrowLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickMove(widgetConfig.id, 'right')}
              className="p-1 hover:bg-white text-slate-500 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
              title="Move Widget Later"
            >
              <Icons.ArrowRight className="w-3 h-3" />
            </button>

            <span className="text-slate-300 mx-0.5">|</span>

            {/* Hide button */}
            <button
              type="button"
              onClick={() => handleQuickToggleVisibility(widgetConfig.id)}
              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
              title="Hide Widget"
            >
              <Icons.EyeOff className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- WIDGET RENDERERS ---

  // 1. WIDGET: Quick Actions & Executive Header
  const renderQuickActionsWidget = (config: DashboardWidgetConfig) => {
    return (
      <div key={config.id} className={`${getColSpanClass(config.size)} space-y-4`}>
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Agency Command Hub
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                {isCustomized && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1">
                    <Icons.Sliders className="w-3 h-3" />
                    Customized Layout
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Welcome back, <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">{userName || 'Agency Executive'}</span> 👋
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
                Live agency operations matrix. {pendingActionsCount > 0 ? `You have ${pendingActionsCount} urgent pipeline actions requiring attention.` : 'All operational pipelines are flowing smoothly.'}
              </p>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
              <button
                onClick={onOpenAddLeadModal}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2 border border-indigo-400/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icons.UserPlus className="w-4 h-4 text-indigo-200" />
                <span>+ New Lead</span>
              </button>

              <button
                onClick={onOpenNewProposalModal}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border border-slate-700/60 hover:border-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icons.FileText className="w-4 h-4 text-cyan-400" />
                <span>+ New Proposal</span>
              </button>

              <button
                onClick={() => onNavigateTab('contracts')}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-purple-300 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border border-slate-700/60 hover:border-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icons.FileCheck className="w-4 h-4 text-purple-400" />
                <span>+ New Contract</span>
              </button>

              <button
                onClick={() => onNavigateTab('projects')}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border border-slate-700/60 hover:border-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icons.Kanban className="w-4 h-4 text-emerald-400" />
                <span>+ New Project</span>
              </button>

              {/* Layout Customizer Trigger */}
              <button
                onClick={() => setShowCustomizerModal(true)}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border border-white/20 hover:scale-[1.02]"
                title="Customize Dashboard Layout"
              >
                <Icons.Sliders className="w-4 h-4 text-indigo-300" />
                <span>Customize Layout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. WIDGET: Performance & Agency KPIs
  const renderPerformanceWidget = (config: DashboardWidgetConfig) => {
    return (
      <div key={config.id} className={`${getColSpanClass(config.size)} bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5`}>
        {renderWidgetHeader(
          config,
          'Performance & Agency Growth KPIs',
          Icons.TrendingUp,
          'Real-time financial velocity, conversion metrics, and weighted pipeline forecast',
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Full Pipeline</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 5 KPI Metric Bento */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-white rounded-2xl border border-indigo-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Raw Pipeline</span>
            <div className="text-xl font-black text-indigo-950 mt-1">₹{totalPipelineValue.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Avg: ₹{avgDealValue.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-50/60 to-white rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Weighted Forecast</span>
            <div className="text-xl font-black text-emerald-700 mt-1">₹{Math.round(weightedForecast).toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Probability-adjusted</span>
          </div>

          <div className="p-4 bg-gradient-to-br from-cyan-50/60 to-white rounded-2xl border border-cyan-100">
            <span className="text-[10px] font-extrabold text-cyan-700 uppercase tracking-wider block">Proposal Win Rate</span>
            <div className="text-xl font-black text-cyan-700 mt-1">{proposalConversionRate}%</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{acceptedProposals} of {totalProposals} approved</span>
          </div>

          <div className="p-4 bg-gradient-to-br from-rose-50/60 to-white rounded-2xl border border-rose-100">
            <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">Hot Priority Leads</span>
            <div className="text-xl font-black text-rose-600 mt-1">{highPriorityCount} Hot 🔥</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{midPriorityCount} Mid • {lowPriorityCount} Low</span>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50/60 to-white rounded-2xl border border-purple-100">
            <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider block">Closed Deliveries</span>
            <div className="text-xl font-black text-purple-700 mt-1">{closedDeals} Deals</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{completedProjectsCount} Handed Over</span>
          </div>
        </div>

        {/* Service Popularity Progress Bars */}
        {topServices.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Icons.PieChart className="w-3.5 h-3.5 text-indigo-600" />
                Service Popularity & Demand Distribution
              </span>
              <span className="text-slate-400 font-semibold">{totalLeads} total inquiries</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {topServices.map((srv, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span className="truncate">{srv.name}</span>
                    <span className="text-indigo-600 font-extrabold">{srv.count} reqs</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((srv.count / maxServiceCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 3. WIDGET: Pending Actions & Urgent Items
  const renderPendingActionsWidget = (config: DashboardWidgetConfig) => {
    return (
      <div key={config.id} className={`${getColSpanClass(config.size)} bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4`}>
        {renderWidgetHeader(
          config,
          'Pending Actions & Urgent Items',
          Icons.AlertTriangle,
          'Action items requiring immediate operational attention',
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
            {pendingActionsCount} Pending
          </span>
        )}

        <div className="space-y-2.5">
          {newUncontactedLeads > 0 && (
            <div 
              onClick={() => onNavigateTab('pipeline')}
              className="p-3.5 bg-amber-50/70 hover:bg-amber-100/80 rounded-2xl border border-amber-200/80 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Icons.UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{newUncontactedLeads} New Uncontacted Leads</div>
                  <div className="text-[10px] text-amber-700 font-medium">Awaiting initial outreach & scoping call</div>
                </div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}

          {pendingProposals > 0 && (
            <div 
              onClick={() => onNavigateTab('proposals')}
              className="p-3.5 bg-indigo-50/70 hover:bg-indigo-100/80 rounded-2xl border border-indigo-200/80 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Icons.FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{pendingProposals} Proposals Pending Decision</div>
                  <div className="text-[10px] text-indigo-700 font-medium">Follow up with clients to close contracts</div>
                </div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}

          {pendingContracts > 0 && (
            <div 
              onClick={() => onNavigateTab('contracts')}
              className="p-3.5 bg-purple-50/70 hover:bg-purple-100/80 rounded-2xl border border-purple-200/80 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Icons.FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{pendingContracts} Contracts Awaiting Signature</div>
                  <div className="text-[10px] text-purple-700 font-medium">Digital e-signature verification pending</div>
                </div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}

          {totalUnreadMessages > 0 && (
            <div 
              onClick={() => onNavigateTab('messages')}
              className="p-3.5 bg-cyan-50/70 hover:bg-cyan-100/80 rounded-2xl border border-cyan-200/80 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 text-cyan-700 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  <Icons.MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{totalUnreadMessages} Unread Client Messages</div>
                  <div className="text-[10px] text-cyan-700 font-medium">Client portal communication hub</div>
                </div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-cyan-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}

          {pendingActionsCount === 0 && (
            <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl">
              🎉 No pending urgent actions! All pipelines are fully up to date.
            </div>
          )}
        </div>
      </div>
    );
  };

  // 4. WIDGET: Leads & Inquiry Flow
  const renderLeadsWidget = (config: DashboardWidgetConfig) => {
    return (
      <div key={config.id} className={`${getColSpanClass(config.size)} bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4`}>
        {renderWidgetHeader(
          config,
          'Incoming Leads & Inquiry Flow',
          Icons.Users,
          'Latest client scoping requests and pipeline intake',
          <button 
            onClick={() => onNavigateTab('pipeline')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({inquiries.length})</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Quick counter bar */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-150">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Leads</span>
            <span className="font-extrabold text-slate-800 text-sm">{totalLeads}</span>
          </div>
          <div className="p-2 bg-cyan-50 rounded-xl border border-cyan-150">
            <span className="text-[9px] font-bold text-cyan-700 uppercase block">New Intake</span>
            <span className="font-extrabold text-cyan-900 text-sm">{newUncontactedLeads}</span>
          </div>
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-150">
            <span className="text-[9px] font-bold text-emerald-700 uppercase block">Active Deals</span>
            <span className="font-extrabold text-emerald-900 text-sm">{activeLeads}</span>
          </div>
        </div>

        {recentInquiries.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs font-semibold">
            No inquiries recorded yet. Click "+ New Lead" to log a lead manually.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {recentInquiries.map(inq => (
              <div key={inq.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs">{inq.clientName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({inq.businessName})</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                      inq.status === 'new' ? 'bg-cyan-100 text-cyan-800' :
                      inq.status === 'proposal_sent' ? 'bg-indigo-100 text-indigo-800' :
                      inq.status === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {inq.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                    <span>📱 {inq.whatsapp}</span>
                    <span>•</span>
                    <span>✉️ {inq.email}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="font-black text-slate-900 text-xs">₹{(inq.totalDiscounted || inq.totalOriginal || 0).toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400">{new Date(inq.createdAt).toLocaleDateString()}</div>
                  </div>

                  <button
                    onClick={() => onConvertInquiryToProposal(inq)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs"
                    title="Draft Proposal for Lead"
                  >
                    Proposal →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 5. WIDGET: Active Projects & Health
  const renderProjectsWidget = (config: DashboardWidgetConfig) => {
    return (
      <div key={config.id} className={`${getColSpanClass(config.size)} bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4`}>
        {renderWidgetHeader(
          config,
          'Active Projects & Milestone Health',
          Icons.Kanban,
          'Milestone progress, deadline health, and active client deliverables',
          <button 
            onClick={() => onNavigateTab('projects')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>All Projects ({projects.length})</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Health status summary */}
        <div className="flex items-center justify-between text-xs font-bold bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {onTrackProjects.length} On Track
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {atRiskProjects.length} At Risk
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            {overdueProjects.length} Overdue
          </span>
        </div>

        {activeProjects.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs font-semibold">
            No active projects in progress. Convert approved contracts to initiate projects.
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {activeProjects.slice(0, 5).map(prj => {
              const isOverdue = overdueProjects.some(op => op.id === prj.id);
              const isAtRisk = atRiskProjects.some(arp => arp.id === prj.id);
              const healthStatus = isOverdue ? 'Overdue' : isAtRisk ? 'At Risk' : 'On Track';
              const healthBadgeClass = isOverdue 
                ? 'bg-rose-100 text-rose-800 border-rose-200' 
                : isAtRisk 
                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                : 'bg-emerald-100 text-emerald-800 border-emerald-200';

              return (
                <div 
                  key={prj.id}
                  onClick={() => onNavigateTab('projects')}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">{prj.projectName}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${healthBadgeClass}`}>
                        {healthStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Client: <span className="text-slate-800 font-semibold">{prj.clientName}</span> • Stage: <span className="text-indigo-600 font-bold">{prj.status}</span>
                    </p>
                  </div>

                  <div className="w-full md:w-40 space-y-1 shrink-0">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                      <span>Progress</span>
                      <span>{prj.overallProgress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${isOverdue ? 'bg-rose-500' : isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${prj.overallProgress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 6. WIDGET: Proposals & Conversion
  const renderProposalsWidget = (config: DashboardWidgetConfig) => {
    return (
      <div key={config.id} className={`${getColSpanClass(config.size)} bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4`}>
        {renderWidgetHeader(
          config,
          'Proposals & Conversion Status',
          Icons.FileText,
          'Track proposals submitted, approved amounts, and contract conversions',
          <button 
            onClick={() => onNavigateTab('proposals')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({proposals.length})</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
            <span className="text-[9px] font-extrabold text-indigo-700 uppercase block">Total Proposal Value</span>
            <span className="text-sm font-black text-indigo-950 font-mono">₹{totalProposalValue.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-2.5 bg-cyan-50/70 rounded-xl border border-cyan-100">
            <span className="text-[9px] font-extrabold text-cyan-700 uppercase block">Acceptance Rate</span>
            <span className="text-sm font-black text-cyan-950">{proposalConversionRate}% ({acceptedProposals} Won)</span>
          </div>
        </div>

        {recentProposals.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs font-semibold">
            No proposals generated yet. Click "+ New Proposal" to create one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
            {recentProposals.map(prop => (
              <div key={prop.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-extrabold text-xs text-slate-900 truncate">{prop.businessName}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      prop.status === 'Approved' || prop.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                      prop.status === 'Sent' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {prop.clientName} • ₹{(prop.totalAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('proposals')}
                  className="p-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-600 transition-colors cursor-pointer shrink-0"
                  title="View Proposal"
                >
                  <Icons.Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 7. WIDGET: Contracts & E-Signatures
  const renderContractsWidget = (config: DashboardWidgetConfig) => {
    return (
      <div key={config.id} className={`${getColSpanClass(config.size)} bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4`}>
        {renderWidgetHeader(
          config,
          'Contracts & E-Signatures',
          Icons.FileCheck,
          'Signed agreements and legal status',
          <button 
            onClick={() => onNavigateTab('contracts')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>All ({contracts.length})</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="flex items-center justify-between text-xs font-bold bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
          <span className="text-purple-900">{approvedContracts} Approved & Signed</span>
          <span className="text-purple-600 font-semibold">{pendingContracts} Awaiting</span>
        </div>

        {recentContracts.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs font-semibold">
            No digital contracts yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
            {recentContracts.map(ctr => (
              <div key={ctr.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-extrabold text-xs text-slate-900 truncate">{ctr.businessName}</div>
                  <div className="text-[10px] text-slate-400 font-medium truncate">{ctr.projectName}</div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                  ctr.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {ctr.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 8. WIDGET: Client Messages & Hub
  const renderMessagesWidget = (config: DashboardWidgetConfig) => {
    return (
      <div key={config.id} className={`${getColSpanClass(config.size)} bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4`}>
        {renderWidgetHeader(
          config,
          'Client Messages & Hub',
          Icons.MessageSquare,
          'Direct client communication inbox',
          <button 
            onClick={() => onNavigateTab('messages')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            Open Hub →
          </button>
        )}

        {conversations.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs font-semibold">
            No client conversations yet.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {conversations.slice(0, 4).map(conv => (
              <div 
                key={conv.projectId}
                onClick={() => onNavigateTab('messages')}
                className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">{conv.clientName}</span>
                  {conv.unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                      {conv.unreadCount} New
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                  {conv.latestMessage ? conv.latestMessage.content || conv.latestMessage.text || 'Attached file' : 'Active communication thread'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 9. WIDGET: Recent Activity Stream
  const renderRecentActivityWidget = (config: DashboardWidgetConfig) => {
    return (
      <div key={config.id} className={`${getColSpanClass(config.size)} bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4`}>
        {renderWidgetHeader(
          config,
          'Operational Activity Stream',
          Icons.Clock,
          'Live chronological operational log across all agency workspaces'
        )}

        {recentActivities.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs font-semibold">
            No recent activity logged yet.
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-100 max-h-72 overflow-y-auto pr-1">
            {recentActivities.map(act => {
              const IconComp = act.icon || Icons.Activity;
              return (
                <div key={act.id} className="relative pl-7 space-y-0.5">
                  <div className={`absolute left-0 top-0.5 p-1 rounded-full border border-white shadow-sm ${act.color}`}>
                    <IconComp className="w-3 h-3" />
                  </div>
                  <div className="text-xs font-bold text-slate-900">{act.title}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{act.subtitle}</div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {new Date(act.timestamp).toLocaleDateString()} at {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Widget Dispatcher map
  const renderWidget = (config: DashboardWidgetConfig) => {
    if (!config.visible) return null;

    switch (config.id) {
      case 'quick_actions':
        return renderQuickActionsWidget(config);
      case 'performance':
        return renderPerformanceWidget(config);
      case 'pending_actions':
        return renderPendingActionsWidget(config);
      case 'leads':
        return renderLeadsWidget(config);
      case 'projects':
        return renderProjectsWidget(config);
      case 'proposals':
        return renderProposalsWidget(config);
      case 'contracts':
        return renderContractsWidget(config);
      case 'messages':
        return renderMessagesWidget(config);
      case 'recent_activity':
        return renderRecentActivityWidget(config);
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${density === 'compact' ? 'max-w-7xl mx-auto' : ''}`}>
      {/* Top Customization Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Icons.LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">Customizable Operational Dashboard</span>
              {isCustomized ? (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-full border border-indigo-100">
                  Custom Layout ({visibleWidgets.length}/{widgets.length} Active)
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-extrabold rounded-full border border-slate-200">
                  Agency Default Layout
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Adjust widget widths, toggle visibility, and drag to reorganize your personal workflow.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Edit Mode Toggle */}
          <button
            onClick={() => setShowCustomizerModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Icons.Sliders className="w-3.5 h-3.5" />
            <span>Customize Layout</span>
          </button>

          {isCustomized && (
            <button
              onClick={handleSavePersonalLayout}
              disabled={isSaving}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              title="Save current layout changes to your account"
            >
              {isSaving ? <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icons.Save className="w-3.5 h-3.5" />}
              <span>Save Layout</span>
            </button>
          )}

          <button
            onClick={handleResetLayout}
            disabled={isSaving}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Reset to Default Layout"
          >
            <Icons.RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save feedback toast / banner */}
      <AnimatePresence>
        {saveFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-extrabold flex items-center justify-between gap-2 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Icons.CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>{saveFeedback}</span>
            </div>
            <button onClick={() => setSaveFeedback(null)} className="text-indigo-400 hover:text-indigo-600">
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Widgets Quick Restore Bar */}
      {widgets.some(w => !w.visible) && (
        <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-semibold flex-wrap">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Hidden Widgets:</span>
            {widgets.filter(w => !w.visible).map(hw => (
              <button
                key={hw.id}
                onClick={() => handleQuickToggleVisibility(hw.id)}
                className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-md font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                title="Click to restore this widget"
              >
                <Icons.Plus className="w-3 h-3 text-indigo-600" />
                <span>{hw.title}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const allVis = widgets.map(w => ({ ...w, visible: true }));
              setWidgets(allVis);
              setIsCustomized(true);
            }}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer shrink-0"
          >
            Show All
          </button>
        </div>
      )}

      {/* Dynamic Responsive 12-Column Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-12 ${density === 'compact' ? 'gap-4' : 'gap-6'}`}>
        {sortedWidgets.map(w => renderWidget(w))}
      </div>

      {/* Customizer Drawer / Modal */}
      <DashboardCustomizerModal
        isOpen={showCustomizerModal}
        onClose={() => setShowCustomizerModal(false)}
        widgets={widgets}
        density={density}
        onUpdateWidgets={(newWidgets) => {
          setWidgets(newWidgets);
          setIsCustomized(true);
        }}
        onUpdateDensity={(newDensity) => {
          setDensity(newDensity);
          setIsCustomized(true);
        }}
        onSavePersonalLayout={handleSavePersonalLayout}
        onSetGlobalDefaultLayout={handleSetGlobalDefaultLayout}
        onResetLayout={handleResetLayout}
        isSuperAdmin={isSuperAdmin}
        isSaving={isSaving}
        isCustomized={isCustomized}
      />
    </div>
  );
};
