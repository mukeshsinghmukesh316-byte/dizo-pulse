import React, { useState, useMemo } from 'react';
import { Inquiry, Proposal, Contract, Project, Service, StaffMember } from '../types';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BusinessIntelligenceDashboardProps {
  inquiries: Inquiry[];
  proposals: Proposal[];
  contracts: Contract[];
  projects: Project[];
  staffList: StaffMember[];
  servicesList: Service[];
  userRole?: string;
  userName?: string;
  onRefresh?: () => void;
}

type TimeFilter = 'today' | '7days' | '30days' | '3months' | '12months' | 'custom';
type BITab = 'overview' | 'funnel' | 'services' | 'projects' | 'team';

export const BusinessIntelligenceDashboard: React.FC<BusinessIntelligenceDashboardProps> = ({
  inquiries = [],
  proposals = [],
  contracts = [],
  projects = [],
  staffList = [],
  servicesList = [],
  userRole = 'super_admin',
  userName = 'Admin',
  onRefresh
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<BITab>('overview');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // Filter helper
  const filterDateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    
    if (timeFilter === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (timeFilter === '7days') {
      start.setDate(now.getDate() - 7);
    } else if (timeFilter === '30days') {
      start.setDate(now.getDate() - 30);
    } else if (timeFilter === '3months') {
      start.setMonth(now.getMonth() - 3);
    } else if (timeFilter === '12months') {
      start.setFullYear(now.getFullYear() - 1);
    } else if (timeFilter === 'custom') {
      start = customStartDate ? new Date(customStartDate) : new Date(0);
      const end = customEndDate ? new Date(customEndDate) : now;
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    
    return { start, end: now };
  }, [timeFilter, customStartDate, customEndDate]);

  const isWithinFilter = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    return d >= filterDateRange.start && d <= filterDateRange.end;
  };

  // --- FILTERED DATASETS ---
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(i => isWithinFilter(i.createdAt));
  }, [inquiries, filterDateRange]);

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => isWithinFilter(p.createdAt));
  }, [proposals, filterDateRange]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => isWithinFilter(c.createdAt));
  }, [contracts, filterDateRange]);

  const filteredProjects = useMemo(() => {
    return projects.filter(pr => isWithinFilter(pr.startDate || pr.lastUpdated));
  }, [projects, filterDateRange]);

  // --- METRIC CALCULATIONS ---
  const metrics = useMemo(() => {
    // 1. Revenue Overview
    // Proposal values
    const totalProposalValue = filteredProposals.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const approvedProposals = filteredProposals.filter(p => p.status === 'Approved');
    const approvedProposalValue = approvedProposals.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    // Contract values
    const contractPipelineValue = filteredContracts.reduce((sum, c) => {
      // Find matching proposal if available
      const matchingProp = proposals.find(p => p.id === c.proposalId);
      return sum + (matchingProp?.totalAmount || 50000); // estimate fallback if standalone
    }, 0);

    // Inquiries potential value
    const inquiriesPotentialRevenue = filteredInquiries.reduce((sum, i) => sum + (i.totalDiscounted || i.totalOriginal || 0), 0);

    // Project values & collections calculation
    const completedProjectsList = filteredProjects.filter(p => p.status === 'Completed');
    const activeProjectsList = filteredProjects.filter(p => p.status === 'In Progress' || p.status === 'Kickoff' || p.status === 'Client Review' || p.status === 'Revision');
    const pendingProjectsList = filteredProjects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled');

    // Revenue collected estimation (Approved proposals / active projects)
    const totalCollectedRevenue = approvedProposalValue + (completedProjectsList.length * 35000);
    const totalPipelineRevenue = inquiriesPotentialRevenue + totalProposalValue + contractPipelineValue;
    const outstandingCollections = Math.max(0, totalPipelineRevenue - totalCollectedRevenue);

    const aov = filteredInquiries.length > 0 ? Math.round(inquiriesPotentialRevenue / filteredInquiries.length) : 0;

    // 2. Conversion & Funnel
    const totalInquiriesCount = filteredInquiries.length;
    const convertedLeadsCount = filteredInquiries.filter(i => 
      i.status === 'proposal_sent' || i.status === 'contract_signed' || i.status === 'project_active' || i.status === 'completed'
    ).length;
    const leadConversionRate = totalInquiriesCount > 0 ? Math.round((convertedLeadsCount / totalInquiriesCount) * 100) : 0;

    // Funnel Steps
    const funnelInquiries = totalInquiriesCount;
    const funnelProposals = filteredProposals.length;
    const funnelContracts = filteredContracts.length;
    const funnelProjects = filteredProjects.length;

    const inqToPropPct = funnelInquiries > 0 ? Math.round((funnelProposals / funnelInquiries) * 100) : 0;
    const propToCtrPct = funnelProposals > 0 ? Math.round((funnelContracts / funnelProposals) * 100) : 0;
    const ctrToPrjPct = funnelContracts > 0 ? Math.round((funnelProjects / funnelContracts) * 100) : 0;

    // 3. Proposal Approval Rate
    const totalProposalsCount = filteredProposals.length;
    const approvedProposalsCount = approvedProposals.length;
    const proposalApprovalRate = totalProposalsCount > 0 ? Math.round((approvedProposalsCount / totalProposalsCount) * 100) : 0;

    // 4. Project Completion & Duration
    const totalProjectsCount = filteredProjects.length;
    const projectCompletionRate = totalProjectsCount > 0 ? Math.round((completedProjectsList.length / totalProjectsCount) * 100) : 0;

    // Calculate Average Duration in days for completed projects
    let totalDays = 0;
    let completedWithDates = 0;
    completedProjectsList.forEach(p => {
      if (p.startDate && p.completionDate) {
        const start = new Date(p.startDate);
        const end = new Date(p.completionDate);
        const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
        totalDays += diffDays;
        completedWithDates++;
      }
    });
    const avgProjectDurationDays = completedWithDates > 0 ? Math.round(totalDays / completedWithDates) : 7; // default standard 7 days estimate

    // 5. Client Retention & Repeat Clients
    const clientEmailMap: { [email: string]: { name: string; count: number; totalSpent: number } } = {};
    
    inquiries.forEach(i => {
      if (i.email) {
        const emailKey = i.email.toLowerCase().trim();
        if (!clientEmailMap[emailKey]) {
          clientEmailMap[emailKey] = { name: i.clientName || i.businessName, count: 0, totalSpent: 0 };
        }
        clientEmailMap[emailKey].count += 1;
        clientEmailMap[emailKey].totalSpent += (i.totalDiscounted || i.totalOriginal || 0);
      }
    });

    const uniqueClientsList = Object.keys(clientEmailMap);
    const repeatClientsList = uniqueClientsList.filter(email => clientEmailMap[email].count > 1);
    const repeatClientRate = uniqueClientsList.length > 0 ? Math.round((repeatClientsList.length / uniqueClientsList.length) * 100) : 0;

    const repeatClientRevenue = repeatClientsList.reduce((sum, email) => sum + clientEmailMap[email].totalSpent, 0);

    return {
      totalCollectedRevenue,
      totalPipelineRevenue,
      outstandingCollections,
      aov,
      totalInquiriesCount,
      convertedLeadsCount,
      leadConversionRate,
      funnelInquiries,
      funnelProposals,
      funnelContracts,
      funnelProjects,
      inqToPropPct,
      propToCtrPct,
      ctrToPrjPct,
      totalProposalsCount,
      approvedProposalsCount,
      proposalApprovalRate,
      approvedProposalValue,
      totalProjectsCount,
      completedProjectsCount: completedProjectsList.length,
      activeProjectsCount: activeProjectsList.length,
      pendingProjectsCount: pendingProjectsList.length,
      projectCompletionRate,
      avgProjectDurationDays,
      uniqueClientsCount: uniqueClientsList.length,
      repeatClientsCount: repeatClientsList.length,
      repeatClientRate,
      repeatClientRevenue
    };
  }, [filteredInquiries, filteredProposals, filteredContracts, filteredProjects, inquiries, proposals]);

  // --- MONTHLY / WEEKLY LEAD TRENDS DATA ---
  const leadTrendsData = useMemo(() => {
    // Generate buckets based on selected filter range
    const daysDiff = Math.max(1, Math.round((filterDateRange.end.getTime() - filterDateRange.start.getTime()) / (1000 * 3600 * 24)));
    
    // Bucket count limit: 7 to 12 bars
    let bucketCount = 7;
    let stepDays = Math.ceil(daysDiff / bucketCount);
    if (stepDays < 1) stepDays = 1;

    const buckets: { label: string; dateStart: Date; dateEnd: Date; count: number; value: number }[] = [];

    let current = new Date(filterDateRange.start);
    while (current <= filterDateRange.end && buckets.length < 12) {
      const bStart = new Date(current);
      const bEnd = new Date(current);
      bEnd.setDate(bEnd.getDate() + stepDays);

      let label = '';
      if (timeFilter === 'today' || daysDiff <= 1) {
        label = bStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (daysDiff <= 14) {
        label = bStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (daysDiff <= 90) {
        label = `W${buckets.length + 1} (${bStart.getDate()}/${bStart.getMonth() + 1})`;
      } else {
        label = bStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      // Calculate matching leads
      const matching = filteredInquiries.filter(i => {
        const d = new Date(i.createdAt);
        return d >= bStart && d < bEnd;
      });

      const val = matching.reduce((sum, i) => sum + (i.totalDiscounted || i.totalOriginal || 0), 0);

      buckets.push({
        label,
        dateStart: bStart,
        dateEnd: bEnd,
        count: matching.length,
        value: val
      });

      current.setDate(current.getDate() + stepDays);
    }

    const maxCount = Math.max(1, ...buckets.map(b => b.count));
    return { buckets, maxCount };
  }, [filteredInquiries, filterDateRange, timeFilter]);

  // --- SERVICE-WISE DEMAND DATA ---
  const serviceDemandData = useMemo(() => {
    const demandMap: { [serviceId: string]: { name: string; count: number; category: string; revenue: number } } = {};

    filteredInquiries.forEach(inq => {
      const services = inq.services || [];
      const perServiceEst = services.length > 0 ? (inq.totalDiscounted || inq.totalOriginal || 0) / services.length : 0;

      services.forEach(sId => {
        const sObj = servicesList.find(s => s.id === sId);
        const name = sObj?.name || sId;
        const cat = sObj?.category || 'General';

        if (!demandMap[sId]) {
          demandMap[sId] = { name, count: 0, category: cat, revenue: 0 };
        }
        demandMap[sId].count += 1;
        demandMap[sId].revenue += perServiceEst;
      });
    });

    const sorted = Object.entries(demandMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    const totalSelections = sorted.reduce((sum, item) => sum + item.count, 0);

    return { sorted, totalSelections };
  }, [filteredInquiries, servicesList]);

  // --- TEAM WORKLOAD DATA ---
  const teamWorkloadData = useMemo(() => {
    const activeStaff = staffList.length > 0 ? staffList : [
      { id: 'stf_1', name: userName || 'Admin', email: 'admin@dizo.pulse', role: userRole || 'super_admin', status: 'active', createdAt: new Date().toISOString() } as StaffMember
    ];

    return activeStaff.map(member => {
      // Find assigned projects
      const memberProjects = projects.filter(p => p.projectManager === member.name || p.projectManager === member.id);
      const activePrj = memberProjects.filter(p => p.status === 'In Progress' || p.status === 'Client Review' || p.status === 'Revision' || p.status === 'Kickoff').length;
      const completedPrj = memberProjects.filter(p => p.status === 'Completed').length;

      // Assigned leads
      const assignedLeads = inquiries.filter(i => i.assignedStaffId === member.id || i.assignedStaffName === member.name).length;

      let workloadStatus: 'Low' | 'Optimal' | 'High' | 'Overloaded' = 'Optimal';
      if (activePrj === 0 && assignedLeads === 0) workloadStatus = 'Low';
      else if (activePrj >= 5 || assignedLeads >= 10) workloadStatus = 'Overloaded';
      else if (activePrj >= 3 || assignedLeads >= 6) workloadStatus = 'High';

      return {
        member,
        activeProjects: activePrj,
        completedProjects: completedPrj,
        assignedLeads,
        workloadStatus
      };
    });
  }, [staffList, projects, inquiries, userName, userRole]);

  // --- CSV EXPORT HANDLER ---
  const handleExportCSV = () => {
    const csvRows: string[] = [];

    // Title & Metadata
    csvRows.push(`DIZO PULSE - BUSINESS INTELLIGENCE REPORT`);
    csvRows.push(`Generated On,${new Date().toLocaleString()}`);
    csvRows.push(`Date Range Filter,${timeFilter.toUpperCase()} (${filterDateRange.start.toISOString().split('T')[0]} to ${filterDateRange.end.toISOString().split('T')[0]})`);
    csvRows.push(``);

    // Executive Metrics
    csvRows.push(`EXECUTIVE KPI OVERVIEW`);
    csvRows.push(`Metric,Value`);
    csvRows.push(`Total Collected Revenue,₹${metrics.totalCollectedRevenue.toLocaleString('en-IN')}`);
    csvRows.push(`Total Pipeline Value,₹${metrics.totalPipelineRevenue.toLocaleString('en-IN')}`);
    csvRows.push(`Outstanding Collections,₹${metrics.outstandingCollections.toLocaleString('en-IN')}`);
    csvRows.push(`Average Order Value (AOV),₹${metrics.aov.toLocaleString('en-IN')}`);
    csvRows.push(`Total Inquiries Received,${metrics.totalInquiriesCount}`);
    csvRows.push(`Lead Conversion Rate,${metrics.leadConversionRate}%`);
    csvRows.push(`Proposal Approval Rate,${metrics.proposalApprovalRate}%`);
    csvRows.push(`Project Completion Rate,${metrics.projectCompletionRate}%`);
    csvRows.push(`Average Project Duration,${metrics.avgProjectDurationDays} Days`);
    csvRows.push(`Repeat Client Rate,${metrics.repeatClientRate}%`);
    csvRows.push(``);

    // Funnel Breakdown
    csvRows.push(`CONVERSION FUNNEL BREAKDOWN`);
    csvRows.push(`Stage,Count,Conversion Rate %`);
    csvRows.push(`1. Inquiries Received,${metrics.funnelInquiries},100%`);
    csvRows.push(`2. Proposals Sent,${metrics.funnelProposals},${metrics.inqToPropPct}%`);
    csvRows.push(`3. Contracts Signed,${metrics.funnelContracts},${metrics.propToCtrPct}%`);
    csvRows.push(`4. Projects Started/Completed,${metrics.funnelProjects},${metrics.ctrToPrjPct}%`);
    csvRows.push(``);

    // Service Demand
    csvRows.push(`SERVICE DEMAND RANKINGS`);
    csvRows.push(`Service Name,Category,Selections Count,Estimated Revenue`);
    serviceDemandData.sorted.forEach(s => {
      csvRows.push(`"${s.name.replace(/"/g, '""')}","${s.category}",${s.count},₹${Math.round(s.revenue).toLocaleString('en-IN')}`);
    });
    csvRows.push(``);

    // Team Workload
    csvRows.push(`TEAM WORKLOAD & PERFORMANCE`);
    csvRows.push(`Staff Member,Role,Active Projects,Completed Projects,Handled Leads,Workload Status`);
    teamWorkloadData.forEach(t => {
      csvRows.push(`"${t.member.name.replace(/"/g, '""')}","${t.member.role}",${t.activeProjects},${t.completedProjects},${t.assignedLeads},"${t.workloadStatus}"`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `dizo_pulse_bi_report_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-md shadow-indigo-100 shrink-0">
            <Icons.BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-950 text-lg tracking-tight">Business Intelligence Dashboard</h2>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-wider">
                Live Analytics
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Real-time executive metrics, conversion funnels, revenue indicators, and operational workloads.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Refresh Data"
            >
              <Icons.RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.Download className="w-3.5 h-3.5 text-amber-400" />
            Export CSV
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.Printer className="w-3.5 h-3.5" />
            Executive Report
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-slate-100/80 p-2.5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-2 shrink-0">Filter Window:</span>
          
          {(['today', '7days', '30days', '3months', '12months', 'custom'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeFilter === f
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {f === 'today' && 'Today'}
              {f === '7days' && '7 Days'}
              {f === '30days' && '30 Days'}
              {f === '3months' && '3 Months'}
              {f === '12months' && '12 Months'}
              {f === 'custom' && 'Custom Range'}
            </button>
          ))}
        </div>

        {timeFilter === 'custom' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-indigo-100 shadow-xs text-xs font-bold"
          >
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </motion.div>
        )}

        <div className="text-[11px] text-slate-500 font-medium px-2 shrink-0 flex items-center gap-1.5">
          <Icons.Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            {filterDateRange.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {filterDateRange.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icons.LayoutDashboard className="w-4 h-4" />
          Executive Overview
        </button>

        <button
          onClick={() => setActiveTab('funnel')}
          className={`pb-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'funnel'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icons.GitMerge className="w-4 h-4" />
          Conversion Funnel
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'services'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icons.PieChart className="w-4 h-4" />
          Service Demand
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'projects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icons.Kanban className="w-4 h-4" />
          Projects & Delivery
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'team'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icons.Users className="w-4 h-4" />
          Team & Clients
        </button>
      </div>

      {/* --- TAB CONTENT: EXECUTIVE OVERVIEW --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Collected Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Revenue Collected</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Icons.IndianRupee className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">₹{metrics.totalCollectedRevenue.toLocaleString('en-IN')}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Pipeline: ₹{metrics.totalPipelineRevenue.toLocaleString('en-IN')}</span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-0.5">
                  <Icons.TrendingUp className="w-3 h-3" />
                  Active
                </span>
              </div>
            </div>

            {/* KPI 2: Lead Conversion Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Lead Conversion Rate</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Icons.Target className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.leadConversionRate}%</p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">{metrics.convertedLeadsCount} of {metrics.totalInquiriesCount} Leads</span>
                <span className="font-extrabold text-indigo-600">
                  AOV: ₹{metrics.aov.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* KPI 3: Proposal Approval Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Proposal Approval Rate</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Icons.FileCheck className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.proposalApprovalRate}%</p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">{metrics.approvedProposalsCount} Approved Proposals</span>
                <span className="font-extrabold text-blue-600">₹{metrics.approvedProposalValue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* KPI 4: Project Completion Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Project Completion Rate</span>
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                  <Icons.CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.projectCompletionRate}%</p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">{metrics.completedProjectsCount} Done / {metrics.activeProjectsCount} Active</span>
                <span className="font-extrabold text-purple-600 flex items-center gap-0.5">
                  <Icons.Clock className="w-3 h-3" />
                  ~{metrics.avgProjectDurationDays}d
                </span>
              </div>
            </div>
          </div>

          {/* Lead Trends Bar Chart + Quick Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Lead Intake Bar Chart (lg:col-span-8) */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <Icons.TrendingUp className="w-4 h-4 text-indigo-600" />
                    Lead Intake & Volume Trends
                  </h3>
                  <p className="text-[11px] text-slate-500">Inquiry counts grouped across the selected date window</p>
                </div>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 self-start sm:self-auto">
                  {metrics.totalInquiriesCount} Total Leads
                </span>
              </div>

              {leadTrendsData.buckets.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No inquiries recorded in this filter timeframe.
                </div>
              ) : (
                <div className="pt-4">
                  <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-2 border-b border-slate-200 pb-2">
                    {leadTrendsData.buckets.map((b, idx) => {
                      const heightPct = Math.max(8, Math.round((b.count / leadTrendsData.maxCount) * 100));
                      const isHovered = hoveredTrendIndex === idx;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredTrendIndex(idx)}
                          onMouseLeave={() => setHoveredTrendIndex(null)}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        >
                          {/* Tooltip on hover */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded-xl shadow-lg z-20 whitespace-nowrap pointer-events-none"
                              >
                                <div className="font-bold border-b border-slate-800 pb-1 mb-1 text-amber-400">{b.label}</div>
                                <div>Leads: <span className="font-extrabold text-white">{b.count}</span></div>
                                <div>Value: <span className="font-extrabold text-emerald-400">₹{b.value.toLocaleString('en-IN')}</span></div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Bar */}
                          <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPct}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`w-full rounded-t-xl transition-colors ${
                                isHovered ? 'bg-indigo-500' : 'bg-indigo-600'
                              }`}
                            />
                          </div>

                          {/* Label */}
                          <span className="text-[10px] font-bold text-slate-500 mt-2 truncate w-full text-center">
                            {b.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Side Highlights Panel (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Outstanding Collections Box */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Icons.AlertCircle className="w-4 h-4 text-amber-400" />
                    Pending Collections
                  </span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
                    Unbilled / Active
                  </span>
                </div>
                <p className="text-2xl font-black text-amber-400 tracking-tight">₹{metrics.outstandingCollections.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Contracted deal value currently pending final milestone release or proposal signatures.
                </p>
              </div>

              {/* Repeat Client Rate Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Icons.Repeat className="w-4 h-4 text-emerald-600" />
                    Client Retention
                  </h4>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    {metrics.repeatClientRate}% Repeat Rate
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Unique Clients:</span>
                    <span className="font-extrabold text-slate-900">{metrics.uniqueClientsCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Repeat Clients ({'>'}1 order):</span>
                    <span className="font-extrabold text-emerald-600">{metrics.repeatClientsCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Repeat Clients Revenue:</span>
                    <span className="font-extrabold text-slate-900">₹{metrics.repeatClientRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: CONVERSION FUNNEL --- */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Icons.GitMerge className="w-5 h-5 text-indigo-600" />
                Inquiry → Proposal → Contract → Project Conversion Funnel
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Detailed stage progression and conversion drop-off points across the sales pipeline.
              </p>
            </div>

            {/* Funnel Steps Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1: Inquiry */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 mb-2">
                  <span>STEP 1</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px]">Intake</span>
                </div>
                <p className="text-xl font-black text-slate-900">{metrics.funnelInquiries} Inquiries</p>
                <p className="text-[10px] text-slate-500 mt-1">100% Top of Funnel</p>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                  <span>Conversion to Proposal:</span>
                  <span>{metrics.inqToPropPct}%</span>
                </div>
              </div>

              {/* Step 2: Proposal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 mb-2">
                  <span>STEP 2</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px]">Proposal</span>
                </div>
                <p className="text-xl font-black text-slate-900">{metrics.funnelProposals} Proposals</p>
                <p className="text-[10px] text-slate-500 mt-1">{metrics.approvedProposalsCount} Approved</p>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                  <span>Conversion to Contract:</span>
                  <span>{metrics.propToCtrPct}%</span>
                </div>
              </div>

              {/* Step 3: Contract */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 mb-2">
                  <span>STEP 3</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px]">Contract</span>
                </div>
                <p className="text-xl font-black text-slate-900">{metrics.funnelContracts} Contracts</p>
                <p className="text-[10px] text-slate-500 mt-1">Signed Legal Agreements</p>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                  <span>Conversion to Project:</span>
                  <span>{metrics.ctrToPrjPct}%</span>
                </div>
              </div>

              {/* Step 4: Project */}
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 relative">
                <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 mb-2">
                  <span>STEP 4</span>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[10px]">Delivery</span>
                </div>
                <p className="text-xl font-black text-emerald-950">{metrics.funnelProjects} Projects</p>
                <p className="text-[10px] text-emerald-700 mt-1">{metrics.completedProjectsCount} Fully Delivered</p>

                <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                  <span>Overall Conversion:</span>
                  <span>{metrics.leadConversionRate}%</span>
                </div>
              </div>
            </div>

            {/* Funnel Progress Bars */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Visual Stage Capacity</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Inquiries Intake Capacity</span>
                  <span className="text-slate-900">{metrics.funnelInquiries} (100%)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Proposals Issued Capacity</span>
                  <span className="text-slate-900">{metrics.funnelProposals} ({metrics.inqToPropPct}%)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${metrics.inqToPropPct}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Signed Contracts Capacity</span>
                  <span className="text-slate-900">{metrics.funnelContracts} ({metrics.propToCtrPct}%)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${metrics.propToCtrPct}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Active / Completed Delivery Projects</span>
                  <span className="text-slate-900">{metrics.funnelProjects} ({metrics.ctrToPrjPct}%)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${metrics.leadConversionRate}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: SERVICE DEMAND --- */}
      {activeTab === 'services' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Icons.PieChart className="w-5 h-5 text-emerald-600" />
                Service-Wise Catalog Demand Index
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Most requested deliverables, package selections, and estimated revenue share.
              </p>
            </div>
            <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              {serviceDemandData.totalSelections} Total Deliverable Selections
            </span>
          </div>

          {serviceDemandData.sorted.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs font-medium">
              No service selections recorded in active lead quotes.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceDemandData.sorted.map((item, idx) => {
                const pct = serviceDemandData.totalSelections > 0
                  ? Math.round((item.count / serviceDemandData.totalSelections) * 100)
                  : 0;

                return (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-200 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs truncate max-w-[200px]">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{item.count} Lead Selections ({pct}%)</span>
                      <span className="font-black text-emerald-700">Est. ₹{Math.round(item.revenue).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: PROJECTS & DELIVERY --- */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-black text-slate-400">Total Delivery Pipeline</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalProjectsCount} Projects</p>
              <p className="text-[11px] text-slate-500 mt-1">{metrics.activeProjectsCount} Currently In Progress</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-black text-slate-400">Project Completion Rate</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.projectCompletionRate}%</p>
              <p className="text-[11px] text-slate-500 mt-1">{metrics.completedProjectsCount} Projects Fully Handed Over</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-black text-slate-400">Average Turnaround Time</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{metrics.avgProjectDurationDays} Days</p>
              <p className="text-[11px] text-slate-500 mt-1">Mean duration from kickoff to signoff</p>
            </div>
          </div>

          {/* Pending vs Completed Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Icons.Kanban className="w-4 h-4 text-indigo-600" />
              Pending vs Completed Delivery Distribution
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-emerald-800 text-xs font-bold block">Completed Projects</span>
                <span className="text-2xl font-black text-emerald-950 mt-1 block">{metrics.completedProjectsCount}</span>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-amber-800 text-xs font-bold block">Active / Pending Review</span>
                <span className="text-2xl font-black text-amber-950 mt-1 block">{metrics.activeProjectsCount}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 text-xs font-bold block">Unassigned / Draft</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {Math.max(0, metrics.totalProjectsCount - (metrics.completedProjectsCount + metrics.activeProjectsCount))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: TEAM & CLIENTS --- */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Icons.Users className="w-4 h-4 text-indigo-600" />
              Team Workload & Capacity Management
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-[10px] uppercase font-black text-slate-400">
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-center">Active Projects</th>
                    <th className="p-3 text-center">Completed Projects</th>
                    <th className="p-3 text-center">Assigned Leads</th>
                    <th className="p-3 text-right">Workload Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {teamWorkloadData.map((t) => (
                    <tr key={t.member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center">
                          {t.member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{t.member.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{t.member.email}</p>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 uppercase text-[10px] font-black">{t.member.role}</td>
                      <td className="p-3 text-center text-indigo-600 font-extrabold">{t.activeProjects}</td>
                      <td className="p-3 text-center text-emerald-600 font-extrabold">{t.completedProjects}</td>
                      <td className="p-3 text-center text-slate-700 font-extrabold">{t.assignedLeads}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                          t.workloadStatus === 'Low' ? 'bg-slate-100 text-slate-600' :
                          t.workloadStatus === 'Optimal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          t.workloadStatus === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {t.workloadStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE EXECUTIVE REPORT MODAL */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200"
            >
              {/* Modal Control Header (hidden on print) */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <Icons.Printer className="w-5 h-5 text-indigo-400" />
                  <span className="font-extrabold text-sm">Executive BI Report Printable Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Icons.Printer className="w-3.5 h-3.5" />
                    Print / Save PDF
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="p-8 space-y-6 text-slate-900 print:p-0">
                {/* Agency Header */}
                <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-4">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-indigo-950">DIZO PULSE DIGITAL SOLUTIONS</h1>
                    <p className="text-xs text-slate-500 uppercase font-extrabold tracking-wider mt-0.5">Executive Business Intelligence & Performance Audit Report</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-bold">
                    <p>Report Date: {new Date().toLocaleDateString('en-IN')}</p>
                    <p>Filter: {timeFilter.toUpperCase()}</p>
                  </div>
                </div>

                {/* KPI Overview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Revenue Collected</span>
                    <span className="text-lg font-black text-slate-900">₹{metrics.totalCollectedRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Pipeline Revenue</span>
                    <span className="text-lg font-black text-indigo-700">₹{metrics.totalPipelineRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Lead Conversion Rate</span>
                    <span className="text-lg font-black text-slate-900">{metrics.leadConversionRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Project Completion Rate</span>
                    <span className="text-lg font-black text-emerald-700">{metrics.projectCompletionRate}%</span>
                  </div>
                </div>

                {/* Funnel Conversion Breakdown */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm uppercase text-slate-800 border-b border-slate-200 pb-1">1. Sales Pipeline Conversion Funnel</h3>
                  <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead className="bg-slate-100 font-extrabold text-[10px] uppercase text-slate-600">
                      <tr>
                        <th className="p-2 border">Stage</th>
                        <th className="p-2 border text-center">Volume</th>
                        <th className="p-2 border text-right">Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      <tr>
                        <td className="p-2 border">1. Inquiries Intake</td>
                        <td className="p-2 border text-center">{metrics.funnelInquiries}</td>
                        <td className="p-2 border text-right">100%</td>
                      </tr>
                      <tr>
                        <td className="p-2 border">2. Proposals Issued</td>
                        <td className="p-2 border text-center">{metrics.funnelProposals}</td>
                        <td className="p-2 border text-right">{metrics.inqToPropPct}%</td>
                      </tr>
                      <tr>
                        <td className="p-2 border">3. Contracts Signed</td>
                        <td className="p-2 border text-center">{metrics.funnelContracts}</td>
                        <td className="p-2 border text-right">{metrics.propToCtrPct}%</td>
                      </tr>
                      <tr>
                        <td className="p-2 border">4. Delivered Projects</td>
                        <td className="p-2 border text-center">{metrics.funnelProjects}</td>
                        <td className="p-2 border text-right">{metrics.leadConversionRate}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Service Demand Breakdown */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm uppercase text-slate-800 border-b border-slate-200 pb-1">2. Top Requested Services</h3>
                  <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead className="bg-slate-100 font-extrabold text-[10px] uppercase text-slate-600">
                      <tr>
                        <th className="p-2 border">Service Name</th>
                        <th className="p-2 border">Category</th>
                        <th className="p-2 border text-center">Selections</th>
                        <th className="p-2 border text-right">Est. Value Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {serviceDemandData.sorted.slice(0, 5).map((s) => (
                        <tr key={s.id}>
                          <td className="p-2 border font-bold">{s.name}</td>
                          <td className="p-2 border uppercase text-[10px]">{s.category}</td>
                          <td className="p-2 border text-center">{s.count}</td>
                          <td className="p-2 border text-right font-bold">₹{Math.round(s.revenue).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signoff Footer */}
                <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs text-slate-500 font-medium">
                  <div>
                    <p>Report Compiled By: <span className="font-bold text-slate-900">{userName || 'Admin'} ({userRole})</span></p>
                    <p>System: Dizo Pulse Agency Management Control Desk</p>
                  </div>
                  <div className="text-right border-t border-slate-400 pt-1 w-48">
                    <p className="font-bold text-slate-900">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
