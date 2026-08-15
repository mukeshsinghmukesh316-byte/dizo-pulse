import React, { useState, useEffect, useMemo } from 'react';
import { StaffMember, TeamRole, PermissionLevel, TeamMemberPermissions } from '../types';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast, AsyncButton, SkeletonTable, EmptyState } from './UIPolish';
import { AdminDataTable, ColumnDef } from './AdminDataTable';

interface StaffManagementProps {
  currentAdminRole: 'super_admin' | 'admin' | 'manager' | 'staff' | string;
  currentUserEmail?: string;
}

const DEFAULT_PERMISSIONS_BY_ROLE: Record<TeamRole, TeamMemberPermissions> = {
  super_admin: {
    proposals: 'write',
    contracts: 'write',
    projects: 'write',
    assets: 'write',
    messages: 'write',
    settings: 'write'
  },
  admin: {
    proposals: 'write',
    contracts: 'write',
    projects: 'write',
    assets: 'write',
    messages: 'write',
    settings: 'write'
  },
  manager: {
    proposals: 'write',
    contracts: 'write',
    projects: 'write',
    assets: 'write',
    messages: 'write',
    settings: 'read'
  },
  staff: {
    proposals: 'read',
    contracts: 'read',
    projects: 'write',
    assets: 'write',
    messages: 'write',
    settings: 'none'
  }
};

const MODULE_LABELS: Record<keyof TeamMemberPermissions, { label: string; icon: string; desc: string }> = {
  proposals: { label: 'Proposals', icon: 'FileText', desc: 'Commercial quotes & deliverables' },
  contracts: { label: 'Contracts', icon: 'FileCheck', desc: 'Legal terms & sign-offs' },
  projects: { label: 'Projects', icon: 'Kanban', desc: 'Milestones & deliverables' },
  assets: { label: 'Assets', icon: 'FolderGit2', desc: 'Brand assets & files' },
  messages: { label: 'Messages', icon: 'MessageSquare', desc: 'Client communication' },
  settings: { label: 'Settings', icon: 'Settings', desc: 'Branding & payment QRs' }
};

export default function StaffManagement({ currentAdminRole, currentUserEmail }: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [agencyProjects, setAgencyProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | TeamRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState<StaffMember | null>(null);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<TeamRole>('staff');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPermissions, setFormPermissions] = useState<TeamMemberPermissions>(DEFAULT_PERMISSIONS_BY_ROLE.staff);
  const [formProjectAccessType, setFormProjectAccessType] = useState<'all' | 'custom'>('all');
  const [formSelectedProjectIds, setFormSelectedProjectIds] = useState<string[]>([]);
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      } else {
        console.error('Failed to fetch staff members');
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setAgencyProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects list', err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchProjects();
  }, []);

  const handleRoleChange = (newRole: TeamRole) => {
    setFormRole(newRole);
    // Auto populate default recommended permissions for the selected role
    setFormPermissions({ ...DEFAULT_PERMISSIONS_BY_ROLE[newRole] });
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormEmail('');
    setFormRole('staff');
    setFormPassword('');
    setFormWhatsapp('');
    setFormDepartment('Operations');
    setFormStatus('active');
    setFormPermissions({ ...DEFAULT_PERMISSIONS_BY_ROLE.staff });
    setFormProjectAccessType('all');
    setFormSelectedProjectIds([]);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormEmail(member.email);
    const roleKey: TeamRole = (member.role as TeamRole) || 'staff';
    setFormRole(roleKey);
    setFormPassword(member.password || '');
    setFormWhatsapp(member.whatsapp || '');
    setFormDepartment(member.department || '');
    setFormStatus(member.status);
    setFormPermissions(member.permissions || { ...DEFAULT_PERMISSIONS_BY_ROLE[roleKey] });
    
    if (Array.isArray(member.projectAccess)) {
      setFormProjectAccessType('custom');
      setFormSelectedProjectIds(member.projectAccess);
    } else {
      setFormProjectAccessType('all');
      setFormSelectedProjectIds([]);
    }
    
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formEmail.trim()) {
      setFormError('Full Name and Email Address are required.');
      return;
    }

    if (!editingMember && !formPassword.trim()) {
      setFormError('Initial Password is required for creating a new team member account.');
      return;
    }

    const finalProjectAccess = formProjectAccessType === 'all' ? 'all' : formSelectedProjectIds;

    setIsSubmitting(true);
    try {
      if (editingMember) {
        // Edit flow (PUT)
        const res = await fetch(`/api/admin/staff/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            role: formRole,
            password: formPassword,
            whatsapp: formWhatsapp,
            department: formDepartment,
            status: formStatus,
            permissions: formPermissions,
            projectAccess: finalProjectAccess
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setStaff(data.staff || []);
          setShowModal(false);
          if (showProfileModal && showProfileModal.id === editingMember.id) {
            setShowProfileModal(data.staffMember || null);
          }
          showToast('Staff Member Updated', `Updated profile for ${formName}`, 'success');
        } else {
          const errorData = await res.json();
          setFormError(errorData.error || 'Failed to update team member.');
          showToast('Update Failed', errorData.error || 'Failed to update team member.', 'error');
        }
      } else {
        // Add flow (POST)
        const res = await fetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            role: formRole,
            password: formPassword,
            whatsapp: formWhatsapp,
            department: formDepartment,
            status: formStatus,
            permissions: formPermissions,
            projectAccess: finalProjectAccess
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setStaff(data.staff || []);
          setShowModal(false);
          showToast('Team Member Created', `Added ${formName} to agency staff.`, 'success');
        } else {
          const errorData = await res.json();
          setFormError(errorData.error || 'Failed to add team member.');
          showToast('Creation Failed', errorData.error || 'Failed to add team member.', 'error');
        }
      }
    } catch (err: any) {
      setFormError('Connection error: ' + err.message);
      showToast('Submit Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickToggleStatus = async (member: StaffMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
        showToast('Status Updated', `${member.name} marked as ${newStatus}`, 'success');
      } else {
        const err = await res.json();
        showToast('Update Failed', err.error || 'Failed to update status', 'error');
      }
    } catch (err: any) {
      showToast('Update Error', err.message, 'error');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (currentAdminRole !== 'super_admin' && currentAdminRole !== 'admin') {
      showToast('Permission Restricted', 'Only Super Admins or Admins can revoke team credentials.', 'warning');
      return;
    }

    if (!window.confirm(`Are you absolutely sure you want to remove ${name} from the agency team? They will immediately lose workspace privileges.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
        if (showProfileModal && showProfileModal.id === id) {
          setShowProfileModal(null);
        }
        showToast('Credentials Revoked', `Removed ${name} from agency staff.`, 'success');
      } else {
        const err = await res.json();
        showToast('Revoke Failed', err.error || 'Failed to delete team member.', 'error');
      }
    } catch (err: any) {
      showToast('Revoke Error', err.message, 'error');
    }
  };

  const handleCopyCredentials = (member: StaffMember) => {
    const text = `DIZO PULSE Team Access Details:\nName: ${member.name}\nEmail: ${member.email}\nRole: ${member.role.toUpperCase()}\nPasscode: ${member.password || 'dizo@staff'}\nPortal URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    showToast('Credentials Copied', `Copied login details for ${member.name} to clipboard.`, 'info');
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Filter logic
  const filteredStaff = staff.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.department || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Role counters
  const totalMembers = staff.length;
  const activeMembers = staff.filter(s => s.status === 'active').length;
  const superAdminCount = staff.filter(s => s.role === 'super_admin').length;
  const adminCount = staff.filter(s => s.role === 'admin').length;
  const managerCount = staff.filter(s => s.role === 'manager').length;
  const staffCount = staff.filter(s => s.role === 'staff').length;

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <Icons.Crown className="w-3 h-3 text-purple-600" /> Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
            <Icons.ShieldCheck className="w-3 h-3 text-indigo-600" /> Admin
          </span>
        );
      case 'manager':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Icons.Briefcase className="w-3 h-3 text-amber-600" /> Manager
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <Icons.UserCheck className="w-3 h-3 text-slate-500" /> Staff
          </span>
        );
    }
  };

  const renderPermissionPill = (level?: PermissionLevel) => {
    if (level === 'write') {
      return <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Full (Write)</span>;
    }
    if (level === 'read') {
      return <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded">View Only</span>;
    }
    return <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-slate-100 text-slate-400 border border-slate-200 rounded">No Access</span>;
  };

  const canManageTeam = currentAdminRole === 'super_admin' || currentAdminRole === 'admin';

  // Standardized Column Definitions for AdminDataTable
  const staffColumns: ColumnDef<StaffMember>[] = useMemo(() => [
    {
      id: 'member',
      header: 'Team Member',
      accessorKey: 'name',
      sortable: true,
      cell: (member) => (
        <div
          onClick={() => setShowProfileModal(member)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
              {member.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">{member.email}</div>
          </div>
        </div>
      )
    },
    {
      id: 'role',
      header: 'Role',
      accessorKey: 'role',
      sortable: true,
      cell: (member) => renderRoleBadge(member.role)
    },
    {
      id: 'department',
      header: 'Department',
      accessorKey: 'department',
      sortable: true,
      cell: (member) => <span className="font-semibold text-slate-700">{member.department || 'Operations'}</span>
    },
    {
      id: 'permissions',
      header: 'Granular Permissions',
      cell: (member) => (
        <div className="flex items-center gap-1 flex-wrap">
          <span title="Proposals">{renderPermissionPill(member.permissions?.proposals)}</span>
          <span title="Contracts">{renderPermissionPill(member.permissions?.contracts)}</span>
          <span title="Projects">{renderPermissionPill(member.permissions?.projects)}</span>
        </div>
      )
    },
    {
      id: 'projectScope',
      header: 'Project Scope',
      cell: (member) => (
        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
          {Array.isArray(member.projectAccess) ? `${member.projectAccess.length} Selected` : 'All Projects'}
        </span>
      )
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (member) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleQuickToggleStatus(member);
          }}
          className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
            member.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
        >
          ● {member.status}
        </button>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (member) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowProfileModal(member)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="View Profile"
          >
            <Icons.Eye className="w-4 h-4" />
          </button>
          {canManageTeam && (
            <>
              <button
                type="button"
                onClick={() => openEditModal(member)}
                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Edit Member"
              >
                <Icons.Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMember(member.id, member.name)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Delete Member"
              >
                <Icons.Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ], [canManageTeam]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] px-3 py-0.5 rounded-full font-black uppercase tracking-wider font-mono">
              RBAC Team Management Engine
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> {activeMembers}/{totalMembers} Active Team Members
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <Icons.Users className="w-6 h-6 text-indigo-400" />
            Agency Team & Role Management
          </h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-2xl">
            Manage agency team members, assign granular permissions across proposals, contracts, projects, assets, and settings, and enforce project-level access controls.
          </p>
        </div>

        {canManageTeam && (
          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-900/30 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/20 shrink-0"
          >
            <Icons.UserPlus className="w-4 h-4 stroke-[2.5px]" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Icons.Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{superAdminCount}</div>
            <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Super Admins</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Icons.ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{adminCount}</div>
            <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Admins</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Icons.Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{managerCount}</div>
            <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Managers</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
            <Icons.UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{staffCount}</div>
            <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Staff Members</div>
          </div>
        </div>
      </div>

      {/* Standardized AdminDataTable */}
      <AdminDataTable<StaffMember>
        data={filteredStaff}
        columns={staffColumns}
        keyExtractor={(m) => m.id}
        isLoading={loading}
        searchable={false}
        selectable={false}
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50]}
        defaultViewMode="table"
        allowViewToggle={true}
        tableMinWidth="min-w-[900px]"
        emptyTitle="No Team Members Found"
        emptyDescription="We couldn't find any team accounts matching your search parameters. Adjust filters or register a new team member."
        emptyIcon={Icons.UserX}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <Icons.Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Icons.Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] uppercase font-black text-slate-400">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admins</option>
                <option value="admin">Administrators</option>
                <option value="manager">Managers</option>
                <option value="staff">Staff Members</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Icons.Activity className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] uppercase font-black text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Members</option>
                <option value="inactive">Inactive Members</option>
              </select>
            </div>
          </div>
        }
        renderCard={(member) => (
          <motion.div
            key={member.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white border rounded-3xl p-5 shadow-xs relative transition-all flex flex-col justify-between hover:border-slate-350 hover:shadow-md ${
              member.status === 'inactive' ? 'bg-slate-50/60 border-slate-200 opacity-75' : 'border-slate-200/80'
            }`}
          >
            <div>
              {/* Header Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {renderRoleBadge(member.role)}
                </div>

                <div className="flex items-center gap-2">
                  {/* Active Switch */}
                  <button
                    onClick={() => handleQuickToggleStatus(member)}
                    className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                      member.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                    title="Click to toggle active / inactive status"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {member.status}
                  </button>
                </div>
              </div>

              {/* Profile Brief */}
              <div className="flex items-start gap-3 mt-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-indigo-100 uppercase">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    onClick={() => setShowProfileModal(member)}
                    className="font-black text-slate-900 text-sm truncate hover:text-indigo-600 cursor-pointer transition-colors"
                    title="Click to view full profile & permissions"
                  >
                    {member.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{member.email}</p>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                    <Icons.Building2 className="w-3 h-3 text-indigo-400" />
                    {member.department || 'Operations'}
                  </p>
                </div>
              </div>

              {/* Granular Permissions Overview */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex justify-between items-center">
                  <span>Module Permissions</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    Scope: {Array.isArray(member.projectAccess) ? `${member.projectAccess.length} Projects` : 'All Projects'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-semibold">Proposals:</span>
                    {renderPermissionPill(member.permissions?.proposals)}
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-semibold">Contracts:</span>
                    {renderPermissionPill(member.permissions?.contracts)}
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-semibold">Projects:</span>
                    {renderPermissionPill(member.permissions?.projects)}
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-semibold">Assets:</span>
                    {renderPermissionPill(member.permissions?.assets)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowProfileModal(member)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-extrabold uppercase transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Icons.Eye className="w-3.5 h-3.5" /> Profile
              </button>

              {canManageTeam && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(member)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-xl text-[10px] font-extrabold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Icons.Edit3 className="w-3 h-3" /> Edit
                  </button>

                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Revoke team account"
                  >
                    <Icons.Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      />

      {/* TEAM MEMBER PROFILE MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-8"
            >
              {/* Profile Card Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
                <button
                  onClick={() => setShowProfileModal(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                >
                  <Icons.X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-950 uppercase border-2 border-white/20">
                    {showProfileModal.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black">{showProfileModal.name}</h3>
                    <p className="text-xs text-indigo-200 font-medium">{showProfileModal.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {renderRoleBadge(showProfileModal.role)}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        showProfileModal.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        ● {showProfileModal.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Card Body */}
              <div className="p-6 space-y-5 text-xs">
                {/* Meta Details */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Department Node</span>
                    <span className="font-bold text-slate-800">{showProfileModal.department || 'Operations'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">WhatsApp Contact</span>
                    <span className="font-bold text-slate-800">{showProfileModal.whatsapp || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Account Created</span>
                    <span className="font-bold text-slate-800">
                      {new Date(showProfileModal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Last Active</span>
                    <span className="font-bold text-slate-800">
                      {showProfileModal.lastActive ? new Date(showProfileModal.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Granular Permissions Matrix */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider flex items-center justify-between">
                    <span>Granular RBAC Permissions</span>
                    <span className="text-[9px] text-indigo-600 font-bold">Active Configuration</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(MODULE_LABELS).map(([key, config]) => {
                      const level = showProfileModal.permissions?.[key as keyof TeamMemberPermissions] || 'none';
                      return (
                        <div key={key} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-extrabold text-slate-800 text-[11px]">{config.label}</div>
                            <div className="text-[9px] text-slate-400">{config.desc}</div>
                          </div>
                          <div>{renderPermissionPill(level)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Project Access Control */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider">
                    Project Access Scope
                  </h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                    {showProfileModal.projectAccess === 'all' || !Array.isArray(showProfileModal.projectAccess) ? (
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <Icons.CheckCircle2 className="w-4 h-4 text-emerald-600" /> Global Access (All Agency Projects)
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-slate-800 mb-1">
                          Restricted Access ({showProfileModal.projectAccess.length} Assigned Projects):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {showProfileModal.projectAccess.map(pid => (
                            <span key={pid} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] rounded border border-indigo-200">
                              {pid}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Credentials Copy Box */}
                <div className="p-3 bg-indigo-50/60 border border-indigo-150 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-indigo-900 text-xs">Login Passcode</div>
                    <div className="font-mono text-indigo-700 font-black text-xs mt-0.5">
                      {showProfileModal.password || 'dizo@staff'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCredentials(showProfileModal)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold uppercase transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    {copySuccess ? <Icons.Check className="w-3.5 h-3.5 text-emerald-300" /> : <Icons.Copy className="w-3.5 h-3.5" />}
                    {copySuccess ? 'Copied!' : 'Copy Info'}
                  </button>
                </div>
              </div>

              {/* Profile Card Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                {canManageTeam ? (
                  <button
                    onClick={() => {
                      const member = showProfileModal;
                      setShowProfileModal(null);
                      openEditModal(member);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Icons.Edit3 className="w-3.5 h-3.5" /> Edit Member
                  </button>
                ) : <div />}

                <button
                  onClick={() => setShowProfileModal(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEAM MEMBER PROVISIONING / EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full my-8 overflow-hidden"
            >
              {/* Modal header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base">
                    {editingMember ? 'Edit Team Member & Access Policy' : 'Provision New Team Member'}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                    Configure profile information, RBAC role, and module permissions.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold leading-normal flex items-center gap-2">
                    <Icons.AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mukesh Singh"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-800 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. mukesh@dizopulse.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-800 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                      Passcode / Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showFormPassword ? "text" : "password"}
                        required
                        placeholder="Passcode"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      >
                        {showFormPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                      Department Node
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Creative Operations"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-800 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                      WhatsApp / Mobile
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-800 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                      Account Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Role Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-extrabold uppercase text-slate-700 tracking-wider block">
                    Select Role (Pre-fills Recommended Permissions)
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['super_admin', 'admin', 'manager', 'staff'] as TeamRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(r)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          formRole === r
                            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-900 ring-2 ring-indigo-200 font-extrabold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="capitalize text-xs font-black">{r.replace('_', ' ')}</div>
                        <div className="text-[9px] text-slate-500 font-normal mt-0.5">
                          {r === 'super_admin' ? 'Full Control' : r === 'admin' ? 'Agency Admin' : r === 'manager' ? 'Ops Lead' : 'Specialist'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granular Permissions Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold uppercase text-slate-700 tracking-wider block">
                      Granular Module Permissions
                    </label>
                    <span className="text-[9px] text-slate-400">Customize permission levels per module</span>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    {Object.entries(MODULE_LABELS).map(([key, config]) => {
                      const currentVal = formPermissions[key as keyof TeamMemberPermissions] || 'none';
                      return (
                        <div key={key} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <div>
                            <div className="font-extrabold text-slate-800 text-xs">{config.label}</div>
                            <div className="text-[9px] text-slate-400">{config.desc}</div>
                          </div>

                          <div className="flex items-center gap-1">
                            {(['write', 'read', 'none'] as PermissionLevel[]).map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() =>
                                  setFormPermissions({
                                    ...formPermissions,
                                    [key]: level
                                  })
                                }
                                className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer ${
                                  currentVal === level
                                    ? level === 'write'
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : level === 'read'
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                      : 'bg-slate-700 text-white border-slate-700 shadow-xs'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {level === 'write' ? 'Write' : level === 'read' ? 'Read' : 'None'}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Project Access Control */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-extrabold uppercase text-slate-700 tracking-wider block">
                    Projects Access Control
                  </label>

                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="radio"
                        name="projectAccessType"
                        checked={formProjectAccessType === 'all'}
                        onChange={() => setFormProjectAccessType('all')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>All Agency Projects (Global Access)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="radio"
                        name="projectAccessType"
                        checked={formProjectAccessType === 'custom'}
                        onChange={() => setFormProjectAccessType('custom')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Restricted Projects Only</span>
                    </label>
                  </div>

                  {formProjectAccessType === 'custom' && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto space-y-1.5">
                      {agencyProjects.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic">No active projects found in database. Enter custom project IDs if required.</div>
                      ) : (
                        agencyProjects.map((p) => {
                          const isChecked = formSelectedProjectIds.includes(p.id);
                          return (
                            <label key={p.id} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormSelectedProjectIds([...formSelectedProjectIds, p.id]);
                                  } else {
                                    setFormSelectedProjectIds(formSelectedProjectIds.filter(id => id !== p.id));
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-mono font-bold text-indigo-600">{p.id}</span>
                              <span className="truncate text-slate-800">{p.clientName || p.businessName || 'Project'}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold uppercase rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold uppercase tracking-wide rounded-xl cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving to Database...
                      </>
                    ) : (
                      <>
                        <Icons.Check className="w-3.5 h-3.5" />
                        {editingMember ? 'Apply Changes' : 'Register Member'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
