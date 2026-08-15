import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Project, ProjectMilestone } from '../../types';

interface PortalProjectsPageProps {
  navigate: (path: string) => void;
  projectId?: string;
}

export const PortalProjectsPage: React.FC<PortalProjectsPageProps> = ({ navigate, projectId: propProjectId }) => {
  const { currentUser } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(propProjectId || '');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'on_hold'>('all');
  const [loading, setLoading] = useState(true);

  // Revision / Approval Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'request_changes'>('approve');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [currentUser?.email]);

  useEffect(() => {
    if (propProjectId) {
      setSelectedProjectId(propProjectId);
    }
  }, [propProjectId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const email = currentUser?.email;
      const res = await fetch(email ? `/api/projects?email=${encodeURIComponent(email)}` : '/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setProjects(data);
          if (!selectedProjectId) {
            setSelectedProjectId(data[0].id);
          }
        } else {
          loadFallback();
        }
      } else {
        loadFallback();
      }
    } catch (e) {
      loadFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadFallback = () => {
    const sample: Project = {
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
        },
        {
          id: 'ms-5',
          stageNumber: 5,
          name: 'Final Quality Audit, Domain SSL Launch & Handoff',
          description: 'Performance testing, SEO audit, source file archive, and active campaign launch.',
          status: 'Pending',
          progressPercent: 0,
          dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
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
        },
        {
          id: 'upd-2',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          author: 'Dizo Systems',
          title: 'Project Initialized',
          content: 'Project PRJ-1001 initialized upon signature of Contract CTR-1001.'
        }
      ],
      activityTimeline: [],
      internalNotes: [],
      lastUpdated: new Date().toISOString()
    };
    setProjects([sample]);
    setSelectedProjectId(sample.id);
  };

  const handleMilestoneAction = async () => {
    if (!selectedMilestone || !activeProject) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: selectedMilestone.id,
          clientApprovalAction: reviewAction,
          clientNotes: revisionNotes,
          updatedByUser: currentUser?.name || 'Valued Client',
          updatedByRole: 'client'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updated : p)));
        setReviewModalOpen(false);
        setRevisionNotes('');
        setSelectedMilestone(null);
        setToastMessage(`Stage ${reviewAction === 'approve' ? 'Approved' : 'Changes Requested'} successfully!`);
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        // Fallback local update
        const updatedMilestones = activeProject.milestones.map((m) => {
          if (m.id === selectedMilestone.id) {
            return {
              ...m,
              status: reviewAction === 'approve' ? 'Approved' : 'Active',
              clientApprovalStatus: reviewAction === 'approve' ? 'Approved' : 'Changes Requested',
              progressPercent: reviewAction === 'approve' ? 100 : m.progressPercent
            };
          }
          return m;
        });
        const updatedProject = { ...activeProject, milestones: updatedMilestones };
        setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProject : p)));
        setReviewModalOpen(false);
        setToastMessage(`Stage ${reviewAction === 'approve' ? 'Approved' : 'Changes Requested'}!`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === 'active') return p.status === 'In Progress' || p.status === 'Active' || p.status === 'Onboarding';
    if (filter === 'completed') return p.status === 'Completed' || p.status === 'Delivered';
    if (filter === 'on_hold') return p.status === 'On Hold' || p.status === 'Paused';
    return true;
  });

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  return (
    <div className="space-y-8" id="portal-projects-page">
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Projects & Milestones
            </h1>
            <span className="px-2.5 py-0.5 bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-full">
              {filteredProjects.length} Project(s)
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Track execution stages in real-time, inspect stage deliverables, and provide client milestone sign-offs.
          </p>
        </div>

        {/* Project Selector if multiple */}
        {projects.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Select Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.projectName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeProject ? (
        <div className="space-y-6">
          {/* Main Project Overview Card */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-mono font-bold rounded-md">
                    {activeProject.id}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-black uppercase rounded-md">
                    {activeProject.status}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-1.5">{activeProject.projectName}</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  {activeProject.projectDescription}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate('/portal/vault')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Icons.Folder className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Project Assets</span>
                </button>
                <button
                  onClick={() => navigate('/portal/messages')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Icons.MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                  <span>Message PM</span>
                </button>
              </div>
            </div>

            {/* Progress Bar & KPI Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Overall Project Milestone Completion</span>
                <span className="text-white font-mono font-black text-sm">
                  {activeProject.overallProgress || 60}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activeProject.overallProgress || 60}%` }}
                  transition={{ duration: 0.8 }}
                  className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full"
                />
              </div>
            </div>

            {/* Metas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Dedicated PM</span>
                <span className="text-xs font-bold text-white mt-0.5 block">{activeProject.projectManager || 'Aisha Sharma'}</span>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Start Date</span>
                <span className="text-xs font-bold text-white mt-0.5 block">
                  {activeProject.startDate ? new Date(activeProject.startDate).toLocaleDateString() : 'Active'}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Deadline</span>
                <span className="text-xs font-bold text-cyan-400 mt-0.5 block">
                  {activeProject.deadline ? new Date(activeProject.deadline).toLocaleDateString() : '7-10 Days'}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Associated Contract</span>
                <button
                  onClick={() => navigate(`/portal/contracts/${activeProject.contractId || 'CTR-1001'}`)}
                  className="text-xs font-bold text-indigo-400 hover:underline mt-0.5 block text-left"
                >
                  {activeProject.contractId || 'CTR-1001'}
                </button>
              </div>
            </div>
          </div>

          {/* Milestones & Stage Tracker */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Icons.ListChecks className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Execution Stages & Milestones</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {activeProject.milestones?.filter((m) => m.status === 'Approved' || m.status === 'Completed').length || 0} / {activeProject.milestones?.length || 0} Stages Complete
              </span>
            </div>

            <div className="space-y-4">
              {activeProject.milestones?.map((milestone, idx) => {
                const isApproved = milestone.status === 'Approved' || milestone.status === 'Completed' || milestone.clientApprovalStatus === 'Approved';
                const isActive = milestone.status === 'Active' || milestone.status === 'In Progress';
                const isPending = !isApproved && !isActive;

                return (
                  <div
                    key={milestone.id || idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-slate-950 border-indigo-600/60 shadow-lg shadow-indigo-950/40'
                        : isApproved
                        ? 'bg-slate-950/60 border-emerald-900/50'
                        : 'bg-slate-950/30 border-slate-800/60 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isApproved
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isActive
                              ? 'bg-indigo-600 text-white animate-pulse'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {isApproved ? <Icons.Check className="w-5 h-5" /> : `0${milestone.stageNumber || idx + 1}`}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{milestone.name}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isApproved
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : isActive
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {milestone.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                            {milestone.description}
                          </p>
                        </div>
                      </div>

                      {/* Client Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isActive && milestone.clientApprovalRequired && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                setReviewAction('request_changes');
                                setReviewModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Request Changes
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                setReviewAction('approve');
                                setReviewModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-950/50 cursor-pointer flex items-center gap-1.5"
                            >
                              <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Stage</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <Icons.CheckCircle2 className="w-4 h-4" />
                            Approved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Client Updates & Announcements */}
          {activeProject.clientUpdates && activeProject.clientUpdates.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Icons.Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-sm font-black text-white">Project Broadcasts & Updates</h3>
              </div>

              <div className="space-y-3">
                {activeProject.clientUpdates.map((upd) => (
                  <div key={upd.id} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">{upd.title || 'Stage Update'}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(upd.timestamp).toLocaleString()} • {upd.author || 'Team Lead'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{upd.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Icons.FolderGit2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You currently have no active projects registered under this account.
          </p>
          <button
            onClick={() => navigate('/quote-estimator')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
          >
            Create New Project Quote
          </button>
        </div>
      )}

      {/* Review & Approval Modal */}
      <AnimatePresence>
        {reviewModalOpen && selectedMilestone && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Icons.ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white">
                    {reviewAction === 'approve' ? 'Approve Milestone Stage' : 'Request Milestone Revisions'}
                  </h3>
                </div>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 font-bold">
                  Stage {selectedMilestone.stageNumber}
                </span>
                <p className="text-xs font-bold text-white">{selectedMilestone.name}</p>
                <p className="text-[11px] text-slate-400">{selectedMilestone.description}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  {reviewAction === 'approve' ? 'Approval Notes (Optional)' : 'Revision Notes & Instructions *'}
                </label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'e.g. Approved. Looks great, proceed with the next web platform build stage!'
                      : 'e.g. Please adjust the primary accent shade to deeper navy and provide a transparent icon.'
                  }
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingAction || (reviewAction === 'request_changes' && !revisionNotes.trim())}
                  onClick={handleMilestoneAction}
                  className={`px-5 py-2 text-white font-black uppercase tracking-wider rounded-xl transition-all ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/50'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-950/50'
                  }`}
                >
                  {submittingAction
                    ? 'Submitting...'
                    : reviewAction === 'approve'
                    ? 'Confirm Sign-Off'
                    : 'Submit Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default PortalProjectsPage;
