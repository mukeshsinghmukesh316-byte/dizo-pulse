import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Project, Proposal, Contract, DeliverableFile } from '../../types';

interface PortalDashboardPageProps {
  navigate: (path: string) => void;
}

const DEFAULT_MOCK_FILES: DeliverableFile[] = [
  {
    id: 'f-1',
    name: 'Brand_Identity_Master_Assets_Pack.zip',
    category: 'Branding & Logo',
    size: '48.5 MB',
    fileType: 'ZIP',
    uploadDate: '2026-08-05',
    version: 'v2.1 Final',
    associatedOrderId: 'ORD-1092'
  },
  {
    id: 'f-2',
    name: 'Brand_Guidelines_&_Typography_System.pdf',
    category: 'Strategy & Docs',
    size: '12.4 MB',
    fileType: 'PDF',
    uploadDate: '2026-08-04',
    version: 'v1.0 Final',
    associatedOrderId: 'ORD-1092'
  },
  {
    id: 'f-3',
    name: 'Social_Reels_&_Story_Ads_Batch1.mp4',
    category: 'Video & Content',
    size: '142.8 MB',
    fileType: 'MP4',
    uploadDate: '2026-08-06',
    version: 'v1.2 Draft',
    associatedOrderId: 'ORD-1092'
  },
  {
    id: 'f-4',
    name: 'Official_GST_Agency_Invoice_Receipt.pdf',
    category: 'Invoice',
    size: '420 KB',
    fileType: 'PDF',
    uploadDate: '2026-08-01',
    version: 'Official',
    associatedOrderId: 'ORD-1092'
  }
];

export const PortalDashboardPage: React.FC<PortalDashboardPageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Message state
  const [quickMsg, setQuickMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [currentUser?.email]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const email = currentUser?.email;
      const [projRes, propRes, contRes] = await Promise.all([
        fetch(email ? `/api/projects?email=${encodeURIComponent(email)}` : '/api/projects'),
        fetch(email ? `/api/proposals?email=${encodeURIComponent(email)}` : '/api/proposals'),
        fetch(email ? `/api/contracts?email=${encodeURIComponent(email)}` : '/api/contracts')
      ]);

      if (projRes.ok) {
        const projData = await projRes.json();
        if (projData && projData.length > 0) {
          setProjects(projData);
        } else {
          setProjects([getFallbackProject()]);
        }
      } else {
        setProjects([getFallbackProject()]);
      }

      if (propRes.ok) {
        const propData = await propRes.json();
        if (propData && propData.length > 0) {
          setProposals(propData);
        } else {
          setProposals([getFallbackProposal()]);
        }
      } else {
        setProposals([getFallbackProposal()]);
      }

      if (contRes.ok) {
        const contData = await contRes.json();
        if (contData && contData.length > 0) {
          setContracts(contData);
        } else {
          setContracts([getFallbackContract()]);
        }
      } else {
        setContracts([getFallbackContract()]);
      }
    } catch (e) {
      console.error('Failed to load portal dashboard data:', e);
      setProjects([getFallbackProject()]);
      setProposals([getFallbackProposal()]);
      setContracts([getFallbackContract()]);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackProject = (): Project => ({
    id: 'PRJ-1001',
    contractId: 'CTR-1001',
    proposalId: 'PROP-1001',
    clientName: currentUser?.name || 'Valued Client',
    contactPerson: currentUser?.name || 'Valued Client',
    email: currentUser?.email || 'client@business.com',
    phone: currentUser?.whatsapp || '+91 98765 43210',
    businessName: currentUser?.company || 'Aura Digital Labs',
    projectName: `${currentUser?.company || 'Aura Digital Labs'} — Brand Identity & Web Platform`,
    projectDescription: 'End-to-end digital transformation including custom vector logo suite, mobile-optimized landing page, and 15 viral reels.',
    status: 'In Progress',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    deliverables: 'Brand Identity Master Pack, High-Converting Landing Page, 15 Viral Reels Batch',
    projectManager: 'Aisha Sharma',
    overallProgress: 60,
    selectedServices: ['Logo & Brand Identity Pack', 'High-Converting Landing Page', 'Viral Reels Growth Pack'],
    milestones: [
      {
        id: 'ms-1',
        stageNumber: 1,
        name: 'Discovery, Moodboard & Brand Core Architecture',
        description: 'Establishing primary typography, color palettes, competitor positioning, and brand guidelines.',
        status: 'Approved',
        progressPercent: 100,
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        clientApprovalRequired: true,
        clientApprovalStatus: 'Approved'
      },
      {
        id: 'ms-2',
        stageNumber: 2,
        name: 'Vector Logo Suite & Visual Identity Handover',
        description: 'Designing main logo, stacked icon, favicon, and dark/light transparent PNGs.',
        status: 'Approved',
        progressPercent: 100,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        clientApprovalRequired: true,
        clientApprovalStatus: 'Approved'
      },
      {
        id: 'ms-3',
        stageNumber: 3,
        name: 'High-Converting Web Platform Layout & Copywriting',
        description: 'Wireframing responsive landing page layout, crafting headlines, and setting up interactive conversion funnels.',
        status: 'Active',
        progressPercent: 60,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        clientApprovalRequired: true,
        clientApprovalStatus: 'Pending'
      },
      {
        id: 'ms-4',
        stageNumber: 4,
        name: '15 High-Retention Instagram Reels Batch Production',
        description: 'Editing 4K vertical videos with motion typography, sound effects, and engagement captions.',
        status: 'Pending',
        progressPercent: 0,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        clientApprovalRequired: true,
        clientApprovalStatus: 'Pending'
      }
    ],
    clientUpdates: [
      {
        id: 'upd-1',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Aisha Sharma',
        title: 'Stage 2 Logo Approved',
        content: 'Stage 2 vector logos approved! We are now wireframing the high-converting web landing page.'
      }
    ],
    activityTimeline: [],
    internalNotes: [],
    lastUpdated: new Date().toISOString()
  });

  const getFallbackProposal = (): Proposal => ({
    id: 'PROP-1001',
    inquiryId: 'ORD-1092',
    clientName: currentUser?.name || 'Valued Client',
    contactPerson: currentUser?.name || 'Valued Client',
    email: currentUser?.email || 'client@business.com',
    phone: currentUser?.whatsapp || '+91 98765 43210',
    businessName: currentUser?.company || 'Aura Digital Labs',
    businessNiche: currentUser?.industry || 'E-Commerce & Retail',
    selectedServices: ['Logo & Brand Identity Pack', 'High-Converting Landing Page', 'Viral Reels Growth Pack'],
    deliverables: '1. Custom Vector Logo Suite\n2. High-Converting Mobile-Optimized Website\n3. 15 High-Retention Reels',
    timeline: '7 - 10 Business Days',
    totalAmount: 22400,
    termsAndConditions: '1. 50% advance upon proposal approval.\n2. Up to 2 rounds of revisions included.\n3. Final handover upon settlement.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Sent'
  });

  const getFallbackContract = (): Contract => ({
    id: 'CTR-1001',
    proposalId: 'PROP-1001',
    clientName: currentUser?.name || 'Valued Client',
    contactPerson: currentUser?.name || 'Valued Client',
    email: currentUser?.email || 'client@business.com',
    phone: currentUser?.whatsapp || '+91 98765 43210',
    businessName: currentUser?.company || 'Aura Digital Labs',
    businessNiche: currentUser?.industry || 'E-Commerce & Retail',
    projectName: `${currentUser?.company || 'Aura Digital Labs'} - Growth Services Agreement`,
    projectDescription: 'Official agreement for digital branding, platform development, and performance growth.',
    selectedServices: ['Logo & Brand Identity Pack', 'High-Converting Landing Page', 'Viral Reels Growth Pack'],
    deliverables: '1. Vector Logo Suite\n2. Landing Page\n3. 15 Reels',
    timeline: '7 - 10 Business Days',
    revisionTerms: 'Up to 2 rounds of design revisions included.',
    clientResponsibilities: 'Provide brand assets and approve milestones.',
    agencyResponsibilities: 'Deliver high-quality work aligned with agreed timelines.',
    confidentialityTerms: 'Treat all business information as strictly confidential.',
    cancellationTerms: 'Either party may terminate with 7 days notice.',
    generalTerms: 'Governed by commercial business execution guidelines.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Awaiting Approval',
    activityHistory: []
  });

  const activeProject = projects[0] || null;
  const activeMilestone = activeProject?.milestones.find((m) => m.status === 'Active' || m.status === 'In Progress') || activeProject?.milestones[0];

  // Pending Actions
  const pendingProposals = proposals.filter((p) => p.status === 'Sent' || p.status === 'Changes Requested');
  const pendingContracts = contracts.filter((c) => c.status === 'Awaiting Approval' || c.status === 'Sent' || c.status === 'Changes Requested');
  const pendingMilestones = activeProject?.milestones.filter((m) => m.clientApprovalRequired && (m.status === 'Active' || m.status === 'In Progress' || m.status === 'Awaiting Approval')) || [];
  const totalPendingActions = pendingProposals.length + pendingContracts.length + pendingMilestones.length;

  const handleSendQuickMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMsg.trim() || !activeProject) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: currentUser?.name || activeProject.clientName || 'Client',
          senderRole: 'client',
          message: quickMsg.trim(),
          email: currentUser?.email
        })
      });
      if (res.ok) {
        setQuickMsg('');
        setToastMessage('Message successfully sent to Project Lead!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSimulateDownload = (fileName: string) => {
    setToastMessage(`Downloading deliverable: ${fileName}`);
    setTimeout(() => {
      const dummyBlob = new Blob([`Official Dizo Pulse Deliverable: ${fileName}\nClient: ${currentUser?.name || 'Valued Client'}\nGenerated: ${new Date().toISOString()}`], { type: 'text/plain' });
      const url = URL.createObjectURL(dummyBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 600);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-8" id="portal-dashboard-page">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-6 z-50 p-3.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-2xl"
          >
            <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-950/60 shrink-0">
            {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').slice(0, 2) : 'C'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Welcome back, {currentUser?.name || 'Valued Client'}
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Icons.ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Verified Account
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-200 text-xs font-extrabold rounded-lg border border-slate-700 flex items-center gap-1.5">
                <Icons.Building2 className="w-3.5 h-3.5 text-cyan-400" />
                {currentUser?.company || activeProject?.businessName || 'Aura Digital Labs'}
              </span>
              <span className="px-2.5 py-0.5 bg-slate-900 text-slate-400 text-xs font-semibold rounded-lg border border-slate-800">
                {currentUser?.industry || 'E-Commerce & Digital Brand'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto shrink-0 z-10">
          <div 
            onClick={() => navigate('/portal/projects')}
            className="bg-slate-950/80 hover:bg-slate-800/80 p-3 rounded-2xl border border-slate-800 text-center cursor-pointer transition-all"
          >
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Active Projects</span>
            <span className="text-xl font-black text-indigo-400">{projects.length}</span>
          </div>

          <div 
            onClick={() => {
              if (pendingProposals.length > 0) navigate(`/portal/proposals/${pendingProposals[0].id}`);
              else if (pendingContracts.length > 0) navigate(`/portal/contracts/${pendingContracts[0].id}`);
              else navigate('/portal/projects');
            }}
            className="bg-slate-950/80 hover:bg-slate-800/80 p-3 rounded-2xl border border-slate-800 text-center cursor-pointer transition-all"
          >
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Pending Review</span>
            <span className={`text-xl font-black ${totalPendingActions > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {totalPendingActions}
            </span>
          </div>

          <div 
            onClick={() => navigate('/portal/vault')}
            className="bg-slate-950/80 hover:bg-slate-800/80 p-3 rounded-2xl border border-slate-800 text-center col-span-2 sm:col-span-1 cursor-pointer transition-all"
          >
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Deliverables</span>
            <span className="text-xl font-black text-cyan-400">{DEFAULT_MOCK_FILES.length}</span>
          </div>
        </div>
      </div>

      {/* Pending Action Banner if items require review */}
      {totalPendingActions > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/80 p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Icons.AlertCircle className="w-4 h-4 text-amber-400 animate-bounce" />
              Action Required: {totalPendingActions} Pending Client Checkpoint(s)
            </h3>
            <span className="text-[10px] text-amber-400/80 font-mono">Requires your review & sign-off</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingProposals.map((p) => (
              <div key={p.id} className="bg-slate-950/90 p-3.5 rounded-2xl border border-amber-800/60 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9px] font-mono text-amber-400 font-bold">Proposal {p.id}</span>
                  <p className="text-xs font-black text-white truncate">Review & Approve Scope</p>
                  <p className="text-[10px] text-slate-400">₹{p.totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <button
                  onClick={() => navigate(`/portal/proposals/${p.id}`)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer"
                >
                  Review
                </button>
              </div>
            ))}

            {pendingContracts.map((c) => (
              <div key={c.id} className="bg-slate-950/90 p-3.5 rounded-2xl border border-amber-800/60 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">Contract {c.id}</span>
                  <p className="text-xs font-black text-white truncate">Agreement Sign-off</p>
                  <p className="text-[10px] text-slate-400">{c.timeline}</p>
                </div>
                <button
                  onClick={() => navigate(`/portal/contracts/${c.id}`)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer"
                >
                  Review
                </button>
              </div>
            ))}

            {pendingMilestones.map((m) => (
              <div key={m.id} className="bg-slate-950/90 p-3.5 rounded-2xl border border-amber-800/60 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9px] font-mono text-cyan-400 font-bold">Stage {m.stageNumber} Approval</span>
                  <p className="text-xs font-black text-white truncate">{m.name}</p>
                  <p className="text-[10px] text-slate-400">Milestone Complete</p>
                </div>
                <button
                  onClick={() => navigate('/portal/projects')}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer"
                >
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Active Project Snapshot + Quick PM Communication */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Project Snapshot Card */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                Primary Project Workspace
              </span>
              <h3 className="text-lg font-black text-white">
                {activeProject?.projectName || 'Brand Identity & Web Platform'}
              </h3>
            </div>
            <button
              onClick={() => navigate('/portal/projects')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
            >
              <span>View Milestones</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Bar & Stage Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Overall Project Completion</span>
              <span className="text-white font-mono font-black text-sm">
                {activeProject?.overallProgress || 60}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activeProject?.overallProgress || 60}%` }}
                transition={{ duration: 1 }}
                className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full"
              />
            </div>
          </div>

          {/* Active Stage Detail */}
          {activeMilestone && (
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Icons.Clock className="w-3.5 h-3.5" />
                  Currently In Execution: Stage {activeMilestone.stageNumber}
                </span>
                <span className="text-[10px] text-slate-400">
                  Target: {activeMilestone.dueDate ? new Date(activeMilestone.dueDate).toLocaleDateString() : 'Active'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{activeMilestone.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{activeMilestone.description}</p>
            </div>
          )}

          {/* Project Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Project Lead</span>
              <span className="text-xs font-bold text-white">{activeProject?.projectManager || 'Aisha Sharma'}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Status</span>
              <span className="text-xs font-bold text-emerald-400">{activeProject?.status || 'In Progress'}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Milestones</span>
              <span className="text-xs font-bold text-white">{activeProject?.milestones?.length || 5} Stages</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Deliverables</span>
              <span className="text-xs font-bold text-cyan-400">3 Master Packs</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Message Box & Dedicated PM */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  AS
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Aisha Sharma</h4>
                  <p className="text-[10px] text-slate-400">Dedicated Project Lead</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Have questions regarding your active stage, asset uploads, or need custom revisions? Dispatch a direct note:
            </p>

            <form onSubmit={handleSendQuickMessage} className="space-y-2">
              <textarea
                value={quickMsg}
                onChange={(e) => setQuickMsg(e.target.value)}
                placeholder="Type your message or revision note..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={sendingMsg || !quickMsg.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {sendingMsg ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Send className="w-3.5 h-3.5" />}
                <span>Send Note to PM</span>
              </button>
            </form>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => navigate('/portal/messages')}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icons.MessageSquare className="w-3.5 h-3.5 text-rose-400" />
              <span>Open Full Conversation Thread</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deliverables Vault Snapshot & Quick Navigation Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deliverables Snapshot */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Icons.DownloadCloud className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white">Recent Finished Deliverables</h3>
            </div>
            <button
              onClick={() => navigate('/portal/vault')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Full Asset Vault</span>
              <Icons.ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {DEFAULT_MOCK_FILES.map((file) => (
              <div
                key={file.id}
                className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0 font-bold text-[10px]">
                    {file.fileType}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {file.size} • {file.category} • <span className="text-emerald-400">{file.version}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSimulateDownload(file.name)}
                  className="p-2 bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-xl border border-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Download File"
                >
                  <Icons.Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Portal Quick Access Grid */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Icons.Compass className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-black text-white">Client Portal Modules</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/portal/projects')}
              className="bg-slate-950/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 text-left space-y-2 group transition-all cursor-pointer"
            >
              <Icons.FolderGit2 className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-extrabold text-white">Projects</p>
                <p className="text-[10px] text-slate-400">Milestones & reviews</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/portal/proposals')}
              className="bg-slate-950/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 text-left space-y-2 group transition-all cursor-pointer"
            >
              <Icons.FileText className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-extrabold text-white">Proposals</p>
                <p className="text-[10px] text-slate-400">Scopes & pricing</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/portal/contracts')}
              className="bg-slate-950/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 text-left space-y-2 group transition-all cursor-pointer"
            >
              <Icons.FileCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-extrabold text-white">Contracts</p>
                <p className="text-[10px] text-slate-400">Agreements & sign</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/portal/orders')}
              className="bg-slate-950/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 text-left space-y-2 group transition-all cursor-pointer"
            >
              <Icons.Receipt className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-extrabold text-white">Orders</p>
                <p className="text-[10px] text-slate-400">Invoices & history</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/portal/vault')}
              className="bg-slate-950/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 text-left space-y-2 group transition-all cursor-pointer"
            >
              <Icons.DownloadCloud className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-extrabold text-white">Files Vault</p>
                <p className="text-[10px] text-slate-400">Asset library</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/portal/settings')}
              className="bg-slate-950/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 text-left space-y-2 group transition-all cursor-pointer"
            >
              <Icons.Settings className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-extrabold text-white">Settings</p>
                <p className="text-[10px] text-slate-400">Security & profile</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PortalDashboardPage;
