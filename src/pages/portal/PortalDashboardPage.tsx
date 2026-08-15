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
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto antialiased" id="portal-dashboard-page">
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

      {/* ========================================================================= */}
      {/* 1. TOP BENTO SECTION: Welcome Overview, Active Project & Quick Actions   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Welcome & Business Overview Card (Col 1-12) */}
        <div className="md:col-span-12 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-950/60 shrink-0">
              {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').slice(0, 2) : 'C'}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Welcome back, {currentUser?.name || 'Valued Client'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-950/90 text-indigo-300 border border-indigo-800/80 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <Icons.ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Verified Account
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-slate-800/90 text-slate-200 text-xs font-bold rounded-lg border border-slate-700/80 flex items-center gap-1.5">
                  <Icons.Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{currentUser?.company || activeProject?.businessName || 'Aura Digital Labs'}</span>
                </span>
                <span className="px-2.5 py-0.5 bg-slate-900/90 text-slate-400 text-xs font-semibold rounded-lg border border-slate-800">
                  {currentUser?.industry || 'E-Commerce & Digital Brand'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 z-10">
            <div 
              onClick={() => navigate('/portal/projects')}
              className="bg-slate-950/80 hover:bg-slate-800/80 p-3 rounded-2xl border border-slate-800 text-center cursor-pointer transition-all hover:border-slate-700 flex flex-col justify-center min-w-[90px]"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Projects</span>
              <span className="text-lg sm:text-xl font-black text-indigo-400 font-mono mt-0.5">{projects.length}</span>
            </div>

            <div 
              onClick={() => {
                if (pendingProposals.length > 0) navigate(`/portal/proposals/${pendingProposals[0].id}`);
                else if (pendingContracts.length > 0) navigate(`/portal/contracts/${pendingContracts[0].id}`);
                else navigate('/portal/projects');
              }}
              className="bg-slate-950/80 hover:bg-slate-800/80 p-3 rounded-2xl border border-slate-800 text-center cursor-pointer transition-all hover:border-slate-700 flex flex-col justify-center min-w-[90px]"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pending</span>
              <span className={`text-lg sm:text-xl font-black font-mono mt-0.5 ${totalPendingActions > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {totalPendingActions}
              </span>
            </div>

            <div 
              onClick={() => navigate('/portal/vault')}
              className="bg-slate-950/80 hover:bg-slate-800/80 p-3 rounded-2xl border border-slate-800 text-center cursor-pointer transition-all hover:border-slate-700 flex flex-col justify-center min-w-[90px]"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Vault Files</span>
              <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono mt-0.5">{DEFAULT_MOCK_FILES.length}</span>
            </div>
          </div>
        </div>

        {/* Active Project & Current Milestone Spotlight (Col 1-7 on desktop) */}
        <div className="md:col-span-12 lg:col-span-7 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                    Primary Active Workspace
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                    {activeProject?.status || 'In Progress'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white line-clamp-1">
                  {activeProject?.projectName || 'Brand Identity & Web Platform'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/portal/projects')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-sm shrink-0"
              >
                <span>View Milestones</span>
                <Icons.ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current Active Milestone Highlight */}
            {activeMilestone ? (
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Icons.Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>In Execution: Stage {activeMilestone.stageNumber}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">
                    Target: {activeMilestone.dueDate ? new Date(activeMilestone.dueDate).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{activeMilestone.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{activeMilestone.description}</p>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-xs text-slate-400">
                All scheduled milestones are completed or pending assignment.
              </div>
            )}
          </div>

          {/* Quick Metadata Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Project Lead</span>
              <span className="text-xs font-bold text-white truncate block">{activeProject?.projectManager || 'Aisha Sharma'}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Progress</span>
              <span className="text-xs font-bold text-indigo-400 font-mono">{activeProject?.overallProgress || 60}%</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Milestones</span>
              <span className="text-xs font-bold text-white font-mono">{activeProject?.milestones?.length || 4} Stages</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Deliverables</span>
              <span className="text-xs font-bold text-cyan-400">3 Master Packs</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Pending Checkpoints Card (Col 8-12 on desktop) */}
        <div className="md:col-span-12 lg:col-span-5 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Icons.Zap className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Quick Actions & Review</h2>
              </div>
              {totalPendingActions > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-800">
                  {totalPendingActions} Action(s)
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Icons.Check className="w-3 h-3" /> Up to date
                </span>
              )}
            </div>

            {/* Pending Checkpoints Alert Bar if any */}
            {totalPendingActions > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {pendingProposals.slice(0, 1).map((p) => (
                  <div key={p.id} className="bg-slate-950/90 p-3 rounded-2xl border border-amber-800/70 flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-[9px] font-mono text-amber-400 font-bold block">Proposal {p.id}</span>
                      <p className="text-xs font-bold text-white truncate">Review & Sign-off Scope</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/portal/proposals/${p.id}`)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                      Review
                    </button>
                  </div>
                ))}

                {pendingContracts.slice(0, 1).map((c) => (
                  <div key={c.id} className="bg-slate-950/90 p-3 rounded-2xl border border-emerald-800/70 flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-[9px] font-mono text-emerald-400 font-bold block">Contract {c.id}</span>
                      <p className="text-xs font-bold text-white truncate">Agreement Signature</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/portal/contracts/${c.id}`)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                      Sign
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/portal/proposals')}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/90 text-left transition-all group cursor-pointer flex items-center gap-2.5"
              >
                <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                  <Icons.FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">Proposals</span>
                  <span className="text-[10px] text-slate-400 block truncate">Quotes & SLA</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/portal/contracts')}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/90 text-left transition-all group cursor-pointer flex items-center gap-2.5"
              >
                <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <Icons.FileCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">Contracts</span>
                  <span className="text-[10px] text-slate-400 block truncate">Legal SLA</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/portal/vault')}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/90 text-left transition-all group cursor-pointer flex items-center gap-2.5"
              >
                <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-800/60 text-sky-400 group-hover:scale-105 transition-transform shrink-0">
                  <Icons.DownloadCloud className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">Asset Vault</span>
                  <span className="text-[10px] text-slate-400 block truncate">Files & exports</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/quote-estimator')}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/90 text-left transition-all group cursor-pointer flex items-center gap-2.5"
              >
                <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                  <Icons.PlusCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">Add Scope</span>
                  <span className="text-[10px] text-slate-400 block truncate">New order</span>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>24/7 Client Desk Active</span>
            <button
              type="button"
              onClick={() => navigate('/portal/messages')}
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Message PM</span>
              <Icons.ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE BENTO SECTION: Project Progress, Deliverables, Recent Messages  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Project Progress Card (Col 1-4 on desktop) */}
        <div className="md:col-span-12 lg:col-span-4 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Icons.Activity className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Project Progress</h2>
              </div>
              <span className="text-xs font-mono font-black text-indigo-400">
                {activeProject?.overallProgress || 60}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Overall Completion</span>
                <span className="text-slate-300 font-bold">{activeProject?.overallProgress || 60}%</span>
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

            {/* Milestone Stage Tracker List */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Milestone Pipeline
              </span>
              <div className="space-y-2">
                {activeProject?.milestones.map((ms) => {
                  const isComplete = ms.status === 'Approved' || ms.progressPercent === 100;
                  const isActive = ms.status === 'Active' || ms.status === 'In Progress';
                  return (
                    <div
                      key={ms.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                        isComplete
                          ? 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                          : isActive
                          ? 'bg-indigo-950/30 border-indigo-700/60 text-white shadow-xs'
                          : 'bg-slate-950/40 border-slate-800/40 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isComplete ? (
                          <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isActive ? (
                          <Icons.Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                        ) : (
                          <Icons.Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className="font-bold truncate text-[11px]">
                          Stage {ms.stageNumber}: {ms.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono shrink-0 font-bold">
                        {ms.progressPercent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => navigate('/portal/projects')}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Full Project Details</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Deliverables Vault Snapshot (Col 5-8 on desktop) */}
        <div className="md:col-span-12 lg:col-span-4 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Icons.DownloadCloud className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Deliverables Vault</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/portal/vault')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>All Files</span>
                <Icons.ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Deliverables File Items */}
            <div className="space-y-2">
              {DEFAULT_MOCK_FILES.slice(0, 3).map((file) => (
                <div
                  key={file.id}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0 font-bold text-[9px] font-mono">
                      {file.fileType}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {file.size} • <span className="text-emerald-400 font-medium">{file.version}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulateDownload(file.name)}
                    className="p-2 bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-xl border border-slate-800 transition-colors cursor-pointer shrink-0"
                    title={`Download ${file.name}`}
                  >
                    <Icons.Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => navigate('/portal/vault')}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icons.FolderDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Browse All Finished Assets</span>
            </button>
          </div>
        </div>

        {/* Recent Messages & PM Direct Communication (Col 9-12 on desktop) */}
        <div className="md:col-span-12 lg:col-span-4 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-[11px]">
                  AS
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">Aisha Sharma</h3>
                  <p className="text-[9px] text-slate-400">Dedicated Project Lead</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Have questions regarding active deliverables or need instant adjustments?
            </p>

            <form onSubmit={handleSendQuickMessage} className="space-y-2">
              <textarea
                value={quickMsg}
                onChange={(e) => setQuickMsg(e.target.value)}
                placeholder="Type note or revision request..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={sendingMsg || !quickMsg.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {sendingMsg ? <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icons.Send className="w-3.5 h-3.5" />}
                <span>Send Note to PM</span>
              </button>
            </form>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => navigate('/portal/messages')}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icons.MessageSquare className="w-3.5 h-3.5 text-rose-400" />
              <span>Open Message Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM BENTO SECTION: Recent Proposals/Contracts & Account/Support     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Recent Proposals & Legal Contracts (Col 1-7 on desktop) */}
        <div className="md:col-span-12 lg:col-span-7 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Icons.FileStack className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Proposals & Agreements</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/portal/proposals')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                >
                  Proposals
                </button>
                <span className="text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => navigate('/portal/contracts')}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                >
                  Contracts
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Proposal Snapshot */}
              {proposals.slice(0, 1).map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">Proposal #{p.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-900 text-slate-300 border border-slate-800">
                        {p.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white line-clamp-1">{p.businessName}</h3>
                    <p className="text-xs font-black text-indigo-400 font-mono">
                      ₹{p.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/portal/proposals/${p.id}`)}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>View Proposal</span>
                    <Icons.ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Contract Snapshot */}
              {contracts.slice(0, 1).map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">Contract #{c.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-900 text-emerald-400 border border-slate-800">
                        {c.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white line-clamp-1">{c.projectName}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Timeline: {c.timeline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/portal/contracts/${c.id}`)}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Review Agreement</span>
                    <Icons.ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>All contracts include standard agency SLA & revisions</span>
            <button
              type="button"
              onClick={() => navigate('/portal/orders')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View Orders</span>
              <Icons.ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Account & Support Information / Modules (Col 8-12 on desktop) */}
        <div className="md:col-span-12 lg:col-span-5 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Icons.HelpCircle className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Account & Priority Support</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/portal/settings')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Icons.Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-400">Official Help Desk</span>
                <span className="text-[10px] text-emerald-400 font-bold">Mon - Sat (9am - 8pm)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Support Email</span>
                  <span className="text-[11px] font-bold text-slate-200 truncate block">hello@dizopulse.com</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Direct Phone</span>
                  <span className="text-[11px] font-bold text-slate-200 truncate block">+91 98765 43210</span>
                </div>
              </div>
            </div>

            {/* Quick module pills */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => navigate('/portal/projects')}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-center transition-all cursor-pointer"
              >
                <Icons.FolderGit2 className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-300 block">Projects</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/portal/orders')}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-center transition-all cursor-pointer"
              >
                <Icons.Receipt className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-300 block">Orders</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/portal/vault')}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-center transition-all cursor-pointer"
              >
                <Icons.DownloadCloud className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-300 block">Vault</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dizo Pulse Enterprise Client SLA</span>
            <span className="text-slate-400">ID: {currentUser?.id || 'CLIENT-101'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboardPage;
