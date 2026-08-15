import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast, EmptyState, SkeletonCard } from './UIPolish';
import { Project, ProjectStatus, ProjectMilestone, MilestoneStatus, Contract } from '../types';
import { AssetLibrary } from './AssetLibrary';
import { ProjectCommunication } from './ProjectCommunication';
import { AdminDataTable, ColumnDef } from './AdminDataTable';

interface ProjectsAdminProps {
  initialContractToConvert?: Contract | null;
  onClearContractToConvert?: () => void;
}

export default function ProjectsAdmin({
  initialContractToConvert,
  onClearContractToConvert
}: ProjectsAdminProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New project form state
  const [formData, setFormData] = useState({
    contractId: '',
    proposalId: '',
    clientName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessName: '',
    businessNiche: '',
    projectName: '',
    projectDescription: '',
    selectedServicesText: '',
    deliverables: '',
    timeline: '10 - 14 Business Days',
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    projectManager: 'Rahul Verma'
  });

  // Note and Client Update forms in detailed view
  const [newInternalNote, setNewInternalNote] = useState<string>('');
  const [newUpdateTitle, setNewUpdateTitle] = useState<string>('');
  const [newUpdateContent, setNewUpdateContent] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (initialContractToConvert) {
      setFormData({
        contractId: initialContractToConvert.id || '',
        proposalId: initialContractToConvert.proposalId || '',
        clientName: initialContractToConvert.clientName || '',
        contactPerson: initialContractToConvert.contactPerson || '',
        email: initialContractToConvert.email || '',
        phone: initialContractToConvert.phone || '',
        businessName: initialContractToConvert.businessName || '',
        businessNiche: initialContractToConvert.businessNiche || '',
        projectName: initialContractToConvert.projectName || `${initialContractToConvert.businessName} - Digital Services Execution`,
        projectDescription: initialContractToConvert.projectDescription || '',
        selectedServicesText: (initialContractToConvert.selectedServices || []).join(', '),
        deliverables: initialContractToConvert.deliverables || '',
        timeline: initialContractToConvert.timeline || '10 - 14 Business Days',
        startDate: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectManager: 'Rahul Verma'
      });
      setShowCreateModal(true);
      if (onClearContractToConvert) {
        onClearContractToConvert();
      }
    }
  }, [initialContractToConvert]);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.email) {
      showToast('Validation Error', 'Business Name and Email are required', 'warning');
      return;
    }

    try {
      const servicesArray = formData.selectedServicesText
        ? formData.selectedServicesText.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          selectedServices: servicesArray,
          createdByUser: 'Dizo Agency Admin'
        })
      });

      if (res.ok) {
        const newProject = await res.json();
        setProjects((prev) => [newProject, ...prev]);
        setShowCreateModal(false);
        setSelectedProject(newProject);
        showToast('Project Created', `Project ${newProject.id} initialized successfully!`, 'success');
      } else {
        const err = await res.json();
        showToast('Creation Error', `Error creating project: ${err.error}`, 'error');
      }
    } catch (err: any) {
      console.error('Failed to create project:', err);
      showToast('Creation Error', err.message || 'Failed to create project', 'error');
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updatedByUser: 'Dizo Agency Admin',
          updatedByRole: 'admin'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        showNotification(`Project status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Failed to update project status:', err);
    }
  };

  const handleUpdateOverallProgress = async (projectId: string, newProgress: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallProgress: newProgress,
          activityEntry: {
            action: `Overall progress manually set to ${newProgress}%`,
            user: 'Admin',
            role: 'admin',
            isClientVisible: true
          }
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        showNotification(`Progress updated to ${newProgress}%`);
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleUpdateMilestone = async (
    projectId: string,
    milestoneId: string,
    updates: {
      status?: MilestoneStatus;
      progressPercent?: number;
      adminNotes?: string;
      clientVisibleUpdate?: string;
      clientApprovalRequired?: boolean;
    }
  ) => {
    try {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) return;

      const updatedMilestones = proj.milestones.map((m) => {
        if (m.id === milestoneId) {
          return { ...m, ...updates };
        }
        return m;
      });

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: updatedMilestones,
          activityEntry: {
            action: `Milestone updated: ${proj.milestones.find((m) => m.id === milestoneId)?.name}`,
            user: 'Admin',
            role: 'admin',
            isClientVisible: true,
            notes: updates.clientVisibleUpdate || updates.adminNotes || `Status set to ${updates.status || 'updated'}`
          }
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        showNotification('Milestone updated successfully');
      }
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  const handleAddInternalNote = async (projectId: string) => {
    if (!newInternalNote.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalNoteEntry: {
            author: 'Dizo Admin',
            content: newInternalNote.trim()
          }
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        setNewInternalNote('');
        showNotification('Internal note added');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleAddClientUpdate = async (projectId: string) => {
    if (!newUpdateTitle.trim() || !newUpdateContent.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUpdateEntry: {
            author: 'Dizo Team',
            title: newUpdateTitle.trim(),
            content: newUpdateContent.trim()
          }
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)));
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        setNewUpdateTitle('');
        setNewUpdateContent('');
        showNotification('Client update published');
      }
    } catch (err) {
      console.error('Failed to add client update:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(`Are you sure you want to delete project ${projectId}?`)) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
        }
        showNotification(`Project ${projectId} deleted`);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  // Helper for deadline status
  const getDeadlineDays = (deadlineStr: string) => {
    if (!deadlineStr) return { days: 0, isOverdue: false };
    const deadlineDate = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      days: diffDays,
      isOverdue: diffDays < 0
    };
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Standardized Column Definitions for Projects Table
  const projectColumns: ColumnDef<Project>[] = useMemo(() => [
    {
      id: 'id',
      header: 'Project ID',
      sortable: true,
      accessorKey: 'id',
      cell: (p) => (
        <div>
          <span className="text-[11px] font-mono font-black text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
            {p.id}
          </span>
          {p.contractId && (
            <div className="text-[10px] font-mono text-emerald-400 mt-1">
              🔗 {p.contractId}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'project',
      header: 'Project & Client',
      sortable: true,
      accessorFn: (p) => p.projectName,
      cell: (p) => (
        <div
          className="cursor-pointer"
          onClick={() => setSelectedProject(p)}
        >
          <div className="font-extrabold text-white hover:text-indigo-400 transition-colors">
            {p.projectName}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">
            {p.clientName} <span className="text-slate-500">({p.businessName})</span>
          </div>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      accessorKey: 'status',
      cell: (p) => (
        <span
          className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl border inline-block ${
            p.status === 'Completed'
              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
              : p.status === 'In Progress'
              ? 'bg-indigo-950 text-indigo-400 border-indigo-800'
              : p.status === 'Client Review'
              ? 'bg-purple-950 text-purple-400 border-purple-800 animate-pulse'
              : p.status === 'Revision'
              ? 'bg-amber-950 text-amber-400 border-amber-800'
              : p.status === 'On Hold' || p.status === 'Cancelled'
              ? 'bg-rose-950 text-rose-400 border-rose-800'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          {p.status}
        </span>
      )
    },
    {
      id: 'progress',
      header: 'Progress',
      sortable: true,
      accessorKey: 'overallProgress',
      cell: (p) => (
        <div className="space-y-1 min-w-[120px]">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-slate-400">Execution</span>
            <span className="font-mono text-indigo-400">{p.overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full transition-all"
              style={{ width: `${p.overallProgress}%` }}
            />
          </div>
        </div>
      )
    },
    {
      id: 'stage',
      header: 'Current Stage',
      cell: (p) => {
        const currentStage = p.milestones.find((m) => m.status === 'Active' || m.status === 'Client Review') || p.milestones[0];
        return (
          <span className="text-xs font-bold text-slate-300">
            {currentStage?.name || 'Stage 1 — Kickoff'}
          </span>
        );
      }
    },
    {
      id: 'deadline',
      header: 'Deadline & Countdown',
      sortable: true,
      accessorKey: 'deadline',
      cell: (p) => {
        const { days: daysRemaining, isOverdue } = getDeadlineDays(p.deadline);
        return (
          <div className="text-xs">
            <div className="text-slate-300 font-medium">{p.deadline}</div>
            <div className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
              <Icons.Clock className="w-3 h-3" />
              <span>{isOverdue ? 'Overdue!' : `${daysRemaining}d left`}</span>
            </div>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'center',
      cell: (p) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setSelectedProject(p)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-md"
          >
            <Icons.Eye className="w-3.5 h-3.5" />
            <span>Manage</span>
          </button>
          <button
            onClick={() => handleDeleteProject(p.id)}
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-950/40 transition-colors"
            title="Delete Project"
          >
            <Icons.Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ], [projects]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-indigo-400"
          >
            <Icons.CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Icons.Kanban className="w-6 h-6 text-indigo-400" />
            Live Project Management & Progress Tracking
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Oversee active client executions, update 5-stage milestones, manage client updates, and log activity history.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-950/50 flex items-center gap-2 whitespace-nowrap"
        >
          <Icons.PlusCircle className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Standardized AdminDataTable */}
      <AdminDataTable<Project>
        data={filteredProjects}
        columns={projectColumns}
        keyExtractor={(p) => p.id}
        isLoading={loading}
        searchable={true}
        searchPlaceholder="Filter projects..."
        filtersSlot={
          <div className="flex items-center gap-2">
            <Icons.Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses ({projects.length})</option>
              <option value="Kickoff">Kickoff</option>
              <option value="In Progress">In Progress</option>
              <option value="Client Review">Client Review</option>
              <option value="Revision">Revision</option>
              <option value="Final Approval">Final Approval</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        }
        emptyTitle="No Projects Found"
        emptyDescription={
          searchQuery || statusFilter !== 'All'
            ? 'Try adjusting your search query or status filter.'
            : 'Convert an approved contract to a project or create one manually.'
        }
        emptyIcon={Icons.FolderKanban}
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        tableMinWidth="min-w-[950px]"
        renderCard={(project) => {
          const { days: daysRemaining, isOverdue } = getDeadlineDays(project.deadline);
          const currentStage = project.milestones.find((m) => m.status === 'Active' || m.status === 'Client Review') || project.milestones[0];

          return (
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/50 transition-all space-y-5 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                {/* Top Bar */}
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-900">
                        {project.id}
                      </span>
                      {project.contractId && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                          {project.contractId}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-white">{project.projectName}</h3>
                    <p className="text-xs text-slate-400">{project.clientName} ({project.businessName})</p>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl border shrink-0 ${
                      project.status === 'Completed'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : project.status === 'In Progress'
                        ? 'bg-indigo-950 text-indigo-400 border-indigo-800'
                        : project.status === 'Client Review'
                        ? 'bg-purple-950 text-purple-400 border-purple-800 animate-pulse'
                        : project.status === 'Revision'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : project.status === 'On Hold' || project.status === 'Cancelled'
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Progress Bar Display */}
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Overall Execution Progress
                    </span>
                    <span className="font-mono font-black text-indigo-400 text-xs">
                      {project.overallProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${project.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Active Stage & Deadline Banner */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Current Stage</span>
                    <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">
                      {currentStage?.name || 'Stage 1 — Kickoff'}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isOverdue ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-slate-950 border-slate-800/60 text-slate-200'}`}>
                    <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Deadline Countdown</span>
                    <div className="flex items-center gap-1 mt-0.5 font-bold text-xs">
                      <Icons.Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{isOverdue ? 'Overdue!' : `${daysRemaining} Days Remaining`}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Icons.UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Manager: {project.projectManager || 'Rahul Verma'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Icons.Eye className="w-3.5 h-3.5" />
                    <span>Manage & Track</span>
                  </button>

                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-950/40 transition-colors"
                    title="Delete Project"
                  >
                    <Icons.Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* DETAILED PROJECT MANAGEMENT MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900/95 border-b border-slate-800 p-6 z-10 flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-900">
                    {selectedProject.id}
                  </span>
                  {selectedProject.contractId && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-900">
                      Contract: {selectedProject.contractId}
                    </span>
                  )}
                  {selectedProject.proposalId && (
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-900">
                      Proposal: {selectedProject.proposalId}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-white">{selectedProject.projectName}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client: <span className="text-slate-200 font-bold">{selectedProject.clientName}</span> ({selectedProject.email}) • Business: <span className="text-slate-200 font-bold">{selectedProject.businessName}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* SECTION 1: STATUS, PROGRESS & DEADLINE MANAGEMENT */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950 p-6 rounded-3xl border border-slate-800">
                {/* Status Selector */}
                <div className="md:col-span-4 space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Update Project Status
                  </label>
                  <select
                    value={selectedProject.status}
                    onChange={(e) => handleUpdateProjectStatus(selectedProject.id, e.target.value as ProjectStatus)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Kickoff">Kickoff</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Client Review">Client Review</option>
                    <option value="Revision">Revision</option>
                    <option value="Final Approval">Final Approval</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Progress Control */}
                <div className="md:col-span-5 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Overall Progress %
                    </label>
                    <span className="font-mono font-bold text-indigo-400 text-xs">
                      {selectedProject.overallProgress}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={selectedProject.overallProgress}
                    onChange={(e) => handleUpdateOverallProgress(selectedProject.id, parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${selectedProject.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Deadline Info */}
                <div className="md:col-span-3 space-y-1 bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500">Execution Deadline</span>
                  <span className="text-xs font-bold text-slate-200">
                    {new Date(selectedProject.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={`text-[10px] font-extrabold ${getDeadlineDays(selectedProject.deadline).isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {getDeadlineDays(selectedProject.deadline).isOverdue ? 'Overdue!' : `${getDeadlineDays(selectedProject.deadline).days} Days Remaining`}
                  </span>
                </div>
              </div>

              {/* SECTION 2: 5-STAGE MILESTONE MANAGEMENT SYSTEM */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Icons.CheckSquare className="w-4 h-4 text-emerald-400" />
                    5-Stage Project Milestone System
                  </h3>
                  <span className="text-xs text-slate-500">
                    {selectedProject.milestones.filter((m) => m.status === 'Completed' || m.status === 'Approved').length} / {selectedProject.milestones.length} Stages Completed
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedProject.milestones.map((m) => {
                    const isCompleted = m.status === 'Completed' || m.status === 'Approved';
                    const isActive = m.status === 'Active' || m.status === 'Client Review';

                    return (
                      <div
                        key={m.id}
                        className={`p-5 rounded-2xl border transition-all space-y-3 ${
                          isCompleted
                            ? 'bg-emerald-950/20 border-emerald-900/60'
                            : isActive
                            ? 'bg-indigo-950/30 border-indigo-800/80'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                Stage {m.stageNumber}
                              </span>
                              <h4 className="text-sm font-black text-white">{m.name}</h4>
                              {m.clientApprovalRequired && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900 flex items-center gap-1">
                                  <Icons.ShieldCheck className="w-3 h-3" />
                                  Client Approval Required
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                          </div>

                          {/* Stage Quick Actions */}
                          <div className="flex items-center gap-2">
                            <select
                              value={m.status}
                              onChange={(e) =>
                                handleUpdateMilestone(selectedProject.id, m.id, {
                                  status: e.target.value as MilestoneStatus,
                                  progressPercent: e.target.value === 'Completed' || e.target.value === 'Approved' ? 100 : m.progressPercent
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Active">Active</option>
                              <option value="Client Review">Client Review</option>
                              <option value="Revision Requested">Revision Requested</option>
                              <option value="Approved">Approved</option>
                              <option value="Completed">Completed</option>
                            </select>

                            {m.status !== 'Completed' && m.status !== 'Approved' ? (
                              <button
                                onClick={() =>
                                  handleUpdateMilestone(selectedProject.id, m.id, {
                                    status: 'Completed',
                                    progressPercent: 100
                                  })
                                }
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors"
                              >
                                Complete Stage
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleUpdateMilestone(selectedProject.id, m.id, {
                                    status: 'Active',
                                    progressPercent: 50
                                  })
                                }
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-extrabold cursor-pointer transition-colors"
                              >
                                Reopen Stage
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Stage details & controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                          {/* Client visible update text */}
                          <div>
                            <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-1">
                              Client-Visible Update Message
                            </label>
                            <input
                              type="text"
                              placeholder="Message displayed on client dashboard timeline..."
                              defaultValue={m.clientVisibleUpdate || ''}
                              onBlur={(e) =>
                                handleUpdateMilestone(selectedProject.id, m.id, {
                                  clientVisibleUpdate: e.target.value
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Admin internal notes */}
                          <div>
                            <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-1">
                              Admin Internal Notes (Private)
                            </label>
                            <input
                              type="text"
                              placeholder="Private notes for agency staff..."
                              defaultValue={m.adminNotes || ''}
                              onBlur={(e) =>
                                handleUpdateMilestone(selectedProject.id, m.id, {
                                  adminNotes: e.target.value
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Client Checkpoint Toggle */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`chk-${m.id}`}
                            checked={!!m.clientApprovalRequired}
                            onChange={(e) =>
                              handleUpdateMilestone(selectedProject.id, m.id, {
                                clientApprovalRequired: e.target.checked
                              })
                            }
                            className="rounded accent-indigo-500 cursor-pointer"
                          />
                          <label htmlFor={`chk-${m.id}`} className="text-xs text-slate-400 cursor-pointer">
                            Enable <span className="font-bold text-slate-200">Client Approval Checkpoint</span> for this stage (requires client to review & approve in their dashboard)
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: NOTES & CLIENT UPDATES DUAL TABS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Internal Notes (Admin Only) */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Icons.Lock className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Internal Agency Notes (Admin Only)
                    </h4>
                  </div>

                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {(!selectedProject.internalNotes || selectedProject.internalNotes.length === 0) ? (
                      <p className="text-xs text-slate-500 italic">No internal notes added yet.</p>
                    ) : (
                      selectedProject.internalNotes.map((note) => (
                        <div key={note.id} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span className="font-bold text-indigo-400">{note.author}</span>
                            <span>{new Date(note.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-300">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <textarea
                      placeholder="Add private note for agency staff..."
                      value={newInternalNote}
                      onChange={(e) => setNewInternalNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                    />
                    <button
                      onClick={() => handleAddInternalNote(selectedProject.id)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Save Internal Note
                    </button>
                  </div>
                </div>

                {/* Client Updates (Visible to Client) */}
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Icons.Globe className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Client-Visible Updates
                    </h4>
                  </div>

                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {(!selectedProject.clientUpdates || selectedProject.clientUpdates.length === 0) ? (
                      <p className="text-xs text-slate-500 italic">No client updates published yet.</p>
                    ) : (
                      selectedProject.clientUpdates.map((upd) => (
                        <div key={upd.id} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span className="font-bold text-emerald-400">{upd.title}</span>
                            <span>{new Date(upd.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-300">{upd.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Update Title (e.g. Logo Concepts Ready)"
                      value={newUpdateTitle}
                      onChange={(e) => setNewUpdateTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                      placeholder="Update details visible to client..."
                      value={newUpdateContent}
                      onChange={(e) => setNewUpdateContent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 h-16 resize-none"
                    />
                    <button
                      onClick={() => handleAddClientUpdate(selectedProject.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Publish Client Update
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 4: FULL ACTIVITY TIMELINE */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Icons.History className="w-4 h-4 text-indigo-400" />
                  Full Project Activity Audit Log
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {selectedProject.activityTimeline.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs border-b border-slate-900 pb-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.role === 'client' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200">{act.action}</span>
                          <span className="text-[10px] text-slate-500">{new Date(act.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{act.user} ({act.role})</p>
                        {act.notes && <p className="text-[11px] text-slate-300 italic mt-0.5">{act.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: PROJECT FILE & ASSET VAULT */}
              <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Icons.Folder className="w-4 h-4 text-cyan-400" />
                    Project File & Asset Delivery Vault
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    Admin Asset Uploads & Versioning Control
                  </span>
                </div>

                <AssetLibrary
                  projectId={selectedProject.id}
                  projectName={selectedProject.projectName}
                  clientName={selectedProject.clientName}
                  isAdmin={true}
                  uploadedByDefault="Dizo Admin"
                />
              </div>

              {/* SECTION 6: PROJECT MESSAGING & COMMUNICATION */}
              <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Icons.MessageSquare className="w-4 h-4 text-indigo-400" />
                    Project Client Messages & Communication
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    Live Direct Message Thread with Client
                  </span>
                </div>

                <ProjectCommunication
                  mode="project"
                  projectId={selectedProject.id}
                  projectName={selectedProject.projectName}
                  clientName={selectedProject.clientName}
                  clientEmail={selectedProject.email}
                  userRole="admin"
                  userName="Agency Operations"
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* CREATE NEW PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Initialize New Project</h3>
                <p className="text-xs text-slate-400">Onboard client project with 5-stage milestone roadmap</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Contract ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CTR-1001"
                    value={formData.contractId}
                    onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Proposal ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PROP-1001"
                    value={formData.proposalId}
                    onChange={(e) => setFormData({ ...formData, proposalId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aura Digital Labs"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Client Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. client@business.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Client Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mukesh Singh"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Aura Digital Labs - Growth Suite"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Services (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Logo & Brand Identity Pack, High-Converting Landing Page"
                  value={formData.selectedServicesText}
                  onChange={(e) => setFormData({ ...formData, selectedServicesText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Execution Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Initialize Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
