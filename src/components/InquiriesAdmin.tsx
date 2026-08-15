import React, { useState, useEffect } from 'react';
import { Inquiry, Service, Settings, Coupon, Proposal, ServiceBundle } from '../types';
import { services } from '../data/services';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StaffManagement from './StaffManagement';
import ProposalViewModal from './ProposalViewModal';
import ContractsAdmin from './ContractsAdmin';
import ProjectsAdmin from './ProjectsAdmin';
import { ProjectCommunication } from './ProjectCommunication';
import { AgencyOperationsDashboard } from './AgencyOperationsDashboard';
import { AssetLibrary } from './AssetLibrary';
import { LeadsCrmPipeline } from './LeadsCrmPipeline';
import { ServicesCatalogAdmin } from './ServicesCatalogAdmin';
import { BusinessIntelligenceDashboard } from './BusinessIntelligenceDashboard';
import { ClientsCrmAdmin } from './ClientsCrmAdmin';
import { AuditLogsAdmin } from './AuditLogsAdmin';
import { SystemSettingsAdmin } from './SystemSettingsAdmin';
import { WebsiteContentManager } from './WebsiteContentManager';
import { SeoAdmin } from './SeoAdmin';
import SecurityAdmin from './SecurityAdmin';
import IntegrationsAdmin from './IntegrationsAdmin';
import { AdminNavigation, AdminHeaderBar, AdminTab } from './AdminNavigation';
import { Contract, Project } from '../types';
import { showToast, AsyncButton, SkeletonCard, SkeletonTable, EmptyState, ErrorState, ConfirmationModal } from './UIPolish';

interface ServicePricingCardProps {
  key?: any;
  service: any;
  onSave: (id: string, mrp: number, launch: number, imageUrl: string) => Promise<void>;
}

function ServicePricingCard({ service, onSave }: ServicePricingCardProps) {
  const [mrpVal, setMrpVal] = useState(service.mrp);
  const [launchVal, setLaunchVal] = useState(service.launchPrice);
  const [imageUrl, setImageUrl] = useState(service.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMrpVal(service.mrp);
    setLaunchVal(service.launchPrice);
    setImageUrl(service.imageUrl || '');
    setIsModified(false);
  }, [service]);

  const handleUpdateMrp = (val: string) => {
    const num = Number(val);
    setMrpVal(num);
    setIsModified(num !== service.mrp || launchVal !== service.launchPrice || imageUrl !== (service.imageUrl || ''));
  };

  const handleUpdateLaunch = (val: string) => {
    const num = Number(val);
    setLaunchVal(num);
    setIsModified(mrpVal !== service.mrp || num !== service.launchPrice || imageUrl !== (service.imageUrl || ''));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64String,
            extension: file.name.split('.').pop() || 'png',
            prefix: 'service-' + service.id
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setImageUrl(data.imageUrl);
          setIsModified(true);
          showToast('Image Uploaded', 'Service thumbnail image uploaded successfully.', 'success');
        } else {
          showToast('Upload Failed', 'Failed to upload image to server', 'error');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error(error);
      showToast('Upload Error', error?.message || 'Error uploading file', 'error');
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setIsModified(true);
  };

  const handleLocalSave = async () => {
    setIsSaving(true);
    await onSave(service.id, mrpVal, launchVal, imageUrl);
    setIsSaving(false);
    setIsModified(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex-shrink-0">
            {React.createElement((Icons as any)[service.iconName] || Icons.HelpCircle, { className: 'w-4 h-4' })}
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide truncate max-w-[200px]" title={service.name}>
              {service.name}
            </h4>
            <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">
              {service.category}
            </span>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">ID: {service.id}</span>
      </div>

      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">
        {service.description}
      </p>

      {/* Pricing Inputs */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Price (MRP)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-[11px] font-bold text-slate-400 leading-none">₹</span>
            <input
              type="number"
              value={mrpVal}
              onChange={(e) => handleUpdateMrp(e.target.value)}
              className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Launch Price</label>
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-[11px] font-bold text-slate-400 leading-none">₹</span>
            <input
              type="number"
              value={launchVal}
              onChange={(e) => handleUpdateLaunch(e.target.value)}
              className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Service Photo Section */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <label className="block text-[9px] font-bold text-slate-400 uppercase">Service Cover Photo</label>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center relative shadow-inner">
            {imageUrl ? (
              <img src={imageUrl} alt={service.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Icons.Image className="w-6 h-6 text-slate-300" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Icons.Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex gap-1.5">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id={`image-upload-${service.id}`}
              />
              <label
                htmlFor={`image-upload-${service.id}`}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Icons.Upload className="w-3 h-3 text-indigo-600" />
                Change Photo
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Icons.Trash2 className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-[9px] text-slate-400 font-medium">JPEG/PNG formats are persistent.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-green-600 font-bold">
          Discount Margin: {mrpVal > 0 ? Math.round(((mrpVal - launchVal) / mrpVal) * 100) : 0}% Off
        </span>
        {isModified && (
          <button
            onClick={handleLocalSave}
            disabled={isSaving}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            {isSaving ? <Icons.Loader2 className="w-3 h-3 animate-spin" /> : <Icons.Check className="w-3 h-3" />}
            Apply Changes
          </button>
        )}
      </div>
    </div>
  );
}

interface InquiriesAdminProps {
  onBackToSite?: () => void;
}

export default function InquiriesAdmin({ onBackToSite }: InquiriesAdminProps = {}) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);
  const [loginError, setLoginError] = useState('');
  const [userRole, setUserRole] = useState<'super_admin' | 'admin' | 'manager' | 'staff' | string>('super_admin');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<any>({
    proposals: 'write',
    contracts: 'write',
    projects: 'write',
    assets: 'write',
    messages: 'write',
    settings: 'write'
  });
  const [userProjectAccess, setUserProjectAccess] = useState<any>('all');

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordModalError, setPasswordModalError] = useState('');
  const [passwordModalSuccess, setPasswordModalSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Core inquiries database state
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [operationLoadingId, setOperationLoadingId] = useState<string | null>(null);

  // Search & Filter state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');

  // Interactive details side drawer state
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // --- NEW CRM & PIPELINE FEATURE STATES ---
  // 1. Bulk Selection
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<string[]>([]);

  // 2. Manual Lead Creator Form State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    clientName: '',
    whatsapp: '',
    email: '',
    businessName: '',
    businessNiche: '',
    message: '',
    selectedServiceIds: [] as string[],
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // 3. Admin Reminders & Tasks Log
  interface AdminTask {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
  }
  const [adminTasks, setAdminTasks] = useState<AdminTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // 4. Visual Kanban Board View Mode
  const [pipelineViewMode, setPipelineViewMode] = useState<'list' | 'kanban'>('kanban');

  // Local storage effects for Admin Tasks
  useEffect(() => {
    const savedTasks = localStorage.getItem('dizopulse_admin_tasks');
    if (savedTasks) {
      try {
        setAdminTasks(JSON.parse(savedTasks));
      } catch (err) {
        console.error('Error loading admin tasks:', err);
      }
    }
  }, []);

  const saveTasks = (updatedTasks: AdminTask[]) => {
    setAdminTasks(updatedTasks);
    localStorage.setItem('dizopulse_admin_tasks', JSON.stringify(updatedTasks));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: AdminTask = {
      id: 'task_' + Math.random().toString(36).substr(2, 9),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    saveTasks([newTask, ...adminTasks]);
    setNewTaskText('');
  };

  const handleToggleTask = (id: string) => {
    const updated = adminTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = adminTasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  const handleClearCompletedTasks = () => {
    const updated = adminTasks.filter(t => !t.completed);
    saveTasks(updated);
  };

  // --- CSV Export CRM Data Handler ---
  const handleExportCSV = () => {
    if (filteredInquiries.length === 0) {
      showToast('Export Unavailable', 'No leads match the current filters to export.', 'warning');
      return;
    }

    const headers = [
      'Inquiry ID', 'Client Name', 'WhatsApp Number', 'Email Address', 
      'Business Name', 'Industry Niche', 'Deliverables List', 
      'Base MRP Valuation', 'Discounted Package Price', 'Current Status', 
      'Priority Grade', 'Archived Status', 'Creation Timestamp', 'Internal Admin Notes'
    ];
    
    const rows = filteredInquiries.map(inq => {
      const servicesText = getServiceNamesList(inq.services).replace(/"/g, '""');
      const notesText = (inq.adminNotes || '').replace(/"/g, '""');
      
      return [
        inq.id,
        `"${inq.clientName.replace(/"/g, '""')}"`,
        `"${inq.whatsapp}"`,
        `"${inq.email}"`,
        `"${inq.businessName.replace(/"/g, '""')}"`,
        `"${(inq.businessNiche || 'General').replace(/"/g, '""')}"`,
        `"${servicesText}"`,
        inq.totalOriginal,
        inq.totalDiscounted,
        inq.status,
        inq.priority || 'low',
        inq.archived ? 'Yes' : 'No',
        inq.createdAt,
        `"${notesText}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', url);
    downloadLink.setAttribute('download', `dizo_pulse_crm_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast('Export Complete', `Exported ${filteredInquiries.length} leads to CSV file.`, 'success');
  };

  // --- Bulk Management Operations ---
  const handleBulkStatusChange = async (newStatus: 'new' | 'contacted' | 'proposal_sent' | 'closed') => {
    if (selectedInquiryIds.length === 0) return;
    setOperationLoadingId('bulk');
    try {
      await Promise.all(
        selectedInquiryIds.map(id =>
          fetch(`/api/inquiries/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );
      await fetchInquiries();
      setSelectedInquiryIds([]);
      showToast('Bulk Status Updated', `Updated ${selectedInquiryIds.length} lead(s) to ${newStatus}.`, 'success');
    } catch (err: any) {
      showToast('Status Update Failed', err.message || 'Error updating bulk statuses', 'error');
    } finally {
      setOperationLoadingId(null);
    }
  };

  const handleBulkArchiveToggle = async (shouldArchive: boolean) => {
    if (selectedInquiryIds.length === 0) return;
    setOperationLoadingId('bulk');
    try {
      await Promise.all(
        selectedInquiryIds.map(id =>
          fetch(`/api/inquiries/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archived: shouldArchive }),
          })
        )
      );
      await fetchInquiries();
      setSelectedInquiryIds([]);
      showToast('Bulk Archive Updated', `${shouldArchive ? 'Archived' : 'Unarchived'} ${selectedInquiryIds.length} lead(s).`, 'success');
    } catch (err: any) {
      showToast('Archive Failed', err.message || 'Error updating archive status', 'error');
    } finally {
      setOperationLoadingId(null);
    }
  };

  const handleBulkDeleteLeads = async () => {
    if (selectedInquiryIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete these ${selectedInquiryIds.length} leads? This action cannot be undone.`)) return;
    setOperationLoadingId('bulk');
    try {
      await Promise.all(
        selectedInquiryIds.map(id =>
          fetch(`/api/inquiries/${id}`, {
            method: 'DELETE',
          })
        )
      );
      await fetchInquiries();
      setSelectedInquiryIds([]);
      showToast('Leads Deleted', `Successfully deleted ${selectedInquiryIds.length} lead(s).`, 'success');
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Error performing bulk delete', 'error');
    } finally {
      setOperationLoadingId(null);
    }
  };

  const handleCreateManualLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.clientName || !newLeadForm.whatsapp || !newLeadForm.email || !newLeadForm.businessName) {
      showToast('Validation Error', 'Please fill out all required fields marked with *', 'warning');
      return;
    }

    setIsSubmittingLead(true);

    // Dynamic price estimation calculations
    let computedOriginalPrice = 0;
    newLeadForm.selectedServiceIds.forEach(srvId => {
      const srv = services.find(s => s.id === srvId);
      if (srv) computedOriginalPrice += srv.mrp;
    });

    // 20% active launch deal discount multiplier
    const computedDiscountedPrice = Math.round(computedOriginalPrice * 0.8);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: newLeadForm.clientName,
          whatsapp: newLeadForm.whatsapp,
          email: newLeadForm.email,
          businessName: newLeadForm.businessName,
          businessNiche: newLeadForm.businessNiche || 'General',
          message: newLeadForm.message || 'Manually logged by Admin Desk',
          services: newLeadForm.selectedServiceIds,
          serviceDetails: newLeadForm.selectedServiceIds.reduce((acc, srvId) => {
            acc[srvId] = {
              quantity: 1,
              speed: 'standard',
              brief: 'Manually created lead spec',
              fileName: '',
            };
            return acc;
          }, {} as any),
          totalOriginal: computedOriginalPrice,
          totalDiscounted: computedDiscountedPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Error writing new lead to local server database');
      }

      const createdLead = await response.json();
      setInquiries(prev => [createdLead, ...prev]);
      showToast('Lead Created', `Logged lead for ${createdLead.clientName} successfully.`, 'success');
      
      // Reset State variables & Close Modal
      setNewLeadForm({
        clientName: '',
        whatsapp: '',
        email: '',
        businessName: '',
        businessNiche: '',
        message: '',
        selectedServiceIds: [],
      });
      setShowAddLeadModal(false);
    } catch (err: any) {
      showToast('Creation Error', err.message || 'Error occurred during manual lead logging', 'error');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // --- DYNAMIC CONTROL STATES & HANDLERS ---
  const [adminSubTab, setAdminSubTab] = useState<AdminTab>(() => {
    try {
      const saved = localStorage.getItem('dizopulse_admin_subtab');
      if (
        saved &&
        [
          'overview',
          'pipeline',
          'proposals',
          'contracts',
          'projects',
          'messages',
          'assets',
          'clients',
          'audit_logs',
          'branding',
          'payment',
          'pricing',
          'users',
          'staff',
          'analytics',
          'website_content',
          'seo',
          'settings',
        ].includes(saved)
      ) {
        return saved as AdminTab;
      }
    } catch (e) {
      console.error('Error reading subtab from localStorage:', e);
    }
    return 'overview';
  });

  const handleAdminSubTabChange = (newTab: AdminTab) => {
    setAdminSubTab(newTab);
    try {
      localStorage.setItem('dizopulse_admin_subtab', newTab);
    } catch (e) {
      console.error('Error saving subtab to localStorage:', e);
    }
  };
  const [proposalToConvert, setProposalToConvert] = useState<Proposal | null>(null);
  const [contractToConvertForProject, setContractToConvertForProject] = useState<Contract | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [bundlesList, setBundlesList] = useState<ServiceBundle[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);

  // Real-time Agency Datasets for Control Center
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchAllAgencyData = async () => {
    try {
      const [resContracts, resProjects, resStaff, resConversations] = await Promise.all([
        fetch('/api/contracts').then(r => r.ok ? r.json() : []),
        fetch('/api/projects').then(r => r.ok ? r.json() : []),
        fetch('/api/admin/staff').then(r => r.ok ? r.json() : []),
        fetch('/api/conversations').then(r => r.ok ? r.json() : [])
      ]);

      setContracts(Array.isArray(resContracts) ? resContracts : []);
      setProjects(Array.isArray(resProjects) ? resProjects : []);
      setStaffList(Array.isArray(resStaff) ? resStaff : []);
      setConversations(Array.isArray(resConversations) ? resConversations : []);
    } catch (err) {
      console.error('Error fetching supplementary agency data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllAgencyData();
    }
  }, [isAuthenticated, adminSubTab]);

  // Proposals State
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsSearchTerm, setProposalsSearchTerm] = useState('');
  const [proposalsStatusFilter, setProposalsStatusFilter] = useState<string>('All');
  const [showProposalFormModal, setShowProposalFormModal] = useState(false);
  const [viewingProposalAdmin, setViewingProposalAdmin] = useState<Proposal | null>(null);
  const [showViewModalAdmin, setShowViewModalAdmin] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);

  // Proposal Form Inputs State
  const [propFormInquiryId, setPropFormInquiryId] = useState('');
  const [propFormClientName, setPropFormClientName] = useState('');
  const [propFormContactPerson, setPropFormContactPerson] = useState('');
  const [propFormEmail, setPropFormEmail] = useState('');
  const [propFormPhone, setPropFormPhone] = useState('');
  const [propFormBusinessName, setPropFormBusinessName] = useState('');
  const [propFormBusinessNiche, setPropFormBusinessNiche] = useState('');
  const [propFormSelectedServices, setPropFormSelectedServices] = useState<string[]>([]);
  const [propFormDeliverables, setPropFormDeliverables] = useState('');
  const [propFormTimeline, setPropFormTimeline] = useState('7 - 10 Business Days');
  const [propFormTotalAmount, setPropFormTotalAmount] = useState<number>(0);
  const [propFormTerms, setPropFormTerms] = useState(
    '1. Payment Schedule: 50% advance upon proposal approval to initiate project, 50% upon final deliverable review prior to source code/asset release.\n2. Revisions: Up to 2 rounds of revisions included per deliverable package.\n3. Intellectual Property: Full ownership transfers upon final payment settlement.'
  );
  const [propFormExpiryDate, setPropFormExpiryDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [propFormInternalNotes, setPropFormInternalNotes] = useState('');
  const [propFormStatus, setPropFormStatus] = useState<Proposal['status']>('Sent');
  const [isSavingProposal, setIsSavingProposal] = useState(false);

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/proposals');
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleOpenNewProposalModal = () => {
    setEditingProposalId(null);
    setPropFormInquiryId('');
    setPropFormClientName('');
    setPropFormContactPerson('');
    setPropFormEmail('');
    setPropFormPhone('');
    setPropFormBusinessName('');
    setPropFormBusinessNiche('General Growth');
    setPropFormSelectedServices([]);
    setPropFormDeliverables('• Custom Vector Logo Suite (Main, Stacked, Icon variants)\n• High-Converting Mobile-Optimized Website\n• 15 Custom High-Retention Instagram Reels');
    setPropFormTimeline('7 - 10 Business Days');
    setPropFormTotalAmount(15000);
    setPropFormTerms(
      '1. Payment Schedule: 50% advance upon proposal approval to initiate project, 50% upon final deliverable review prior to source code/asset release.\n2. Revisions: Up to 2 rounds of revisions included per deliverable package.\n3. Intellectual Property: Full ownership transfers upon final payment settlement.'
    );
    setPropFormExpiryDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPropFormInternalNotes('');
    setPropFormStatus('Sent');
    setShowProposalFormModal(true);
  };

  const handleOpenEditProposalModal = (prop: Proposal) => {
    setEditingProposalId(prop.id);
    setPropFormInquiryId(prop.inquiryId || '');
    setPropFormClientName(prop.clientName);
    setPropFormContactPerson(prop.contactPerson || prop.clientName);
    setPropFormEmail(prop.email);
    setPropFormPhone(prop.phone || '');
    setPropFormBusinessName(prop.businessName);
    setPropFormBusinessNiche(prop.businessNiche || 'General Growth');
    setPropFormSelectedServices(prop.selectedServices || []);
    setPropFormDeliverables(prop.deliverables || '');
    setPropFormTimeline(prop.timeline || '7 - 10 Business Days');
    setPropFormTotalAmount(prop.totalAmount || 0);
    setPropFormTerms(prop.termsAndConditions || '');
    setPropFormExpiryDate(prop.expiryDate ? prop.expiryDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setPropFormInternalNotes(prop.internalNotes || '');
    setPropFormStatus(prop.status);
    setShowProposalFormModal(true);
  };

  const handleConvertInquiryToProposal = (inq: Inquiry) => {
    setEditingProposalId(null);
    setPropFormInquiryId(inq.id);
    setPropFormClientName(inq.clientName);
    setPropFormContactPerson(inq.clientName);
    setPropFormEmail(inq.email);
    setPropFormPhone(inq.whatsapp);
    setPropFormBusinessName(inq.businessName);
    setPropFormBusinessNiche(inq.businessNiche || 'General Growth');
    setPropFormSelectedServices(inq.services || []);
    setPropFormDeliverables(`• Enrolled Services: ${(inq.services || []).join(', ')}\n• Full Agency Support & Deliverable Asset Package\n• Custom Scope Brief: ${inq.message || 'Standard Client Campaign'}`);
    setPropFormTimeline('7 - 10 Business Days');
    setPropFormTotalAmount(inq.totalDiscounted || inq.totalOriginal || 15000);
    setPropFormTerms(
      '1. Payment Schedule: 50% advance upon proposal approval to initiate project, 50% upon final deliverable review prior to source code/asset release.\n2. Revisions: Up to 2 rounds of revisions included per deliverable package.\n3. Intellectual Property: Full ownership transfers upon final payment settlement.'
    );
    setPropFormExpiryDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPropFormInternalNotes(`Converted from Inquiry ${inq.id}`);
    setPropFormStatus('Sent');
    setAdminSubTab('proposals');
    setShowProposalFormModal(true);
  };

  const handleSaveProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propFormBusinessName || !propFormEmail) {
      showToast('Validation Error', 'Please fill out Client/Business Name and Email', 'warning');
      return;
    }

    setIsSavingProposal(true);
    try {
      const payload = {
        inquiryId: propFormInquiryId,
        clientName: propFormClientName || propFormBusinessName,
        contactPerson: propFormContactPerson || propFormClientName || propFormBusinessName,
        email: propFormEmail.trim().toLowerCase(),
        phone: propFormPhone,
        businessName: propFormBusinessName,
        businessNiche: propFormBusinessNiche,
        selectedServices: propFormSelectedServices,
        deliverables: propFormDeliverables,
        timeline: propFormTimeline,
        totalAmount: Number(propFormTotalAmount),
        termsAndConditions: propFormTerms,
        expiryDate: new Date(propFormExpiryDate).toISOString(),
        internalNotes: propFormInternalNotes,
        status: propFormStatus,
      };

      let res;
      if (editingProposalId) {
        res = await fetch(`/api/proposals/${editingProposalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        await fetchProposals();
        setShowProposalFormModal(false);
        showToast('Proposal Saved', `Proposal ${editingProposalId ? 'updated' : 'created'} successfully!`, 'success');
      } else {
        showToast('Save Failed', 'Failed to save proposal on server', 'error');
      }
    } catch (err: any) {
      showToast('Save Error', err.message || 'Error saving proposal', 'error');
    } finally {
      setIsSavingProposal(false);
    }
  };

  const handleDuplicateProposal = async (id: string) => {
    try {
      const res = await fetch(`/api/proposals/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        await fetchProposals();
        showToast('Proposal Duplicated', 'Duplicated proposal successfully.', 'success');
      } else {
        showToast('Duplication Failed', 'Failed to duplicate proposal', 'error');
      }
    } catch (err: any) {
      showToast('Duplication Error', err.message, 'error');
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete proposal ${id}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProposals();
        showToast('Proposal Deleted', `Proposal ${id} deleted successfully.`, 'success');
      } else {
        showToast('Delete Failed', 'Failed to delete proposal', 'error');
      }
    } catch (err: any) {
      showToast('Delete Error', err.message, 'error');
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: Proposal['status']) => {
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchProposals();
        showToast('Status Updated', `Proposal status set to ${newStatus}`, 'success');
      }
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Failed to update proposal status', 'error');
    }
  };
  
  // Registered users state
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [usersSearchTerm, setUsersSearchTerm] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const fetchRegisteredUsers = async () => {
    setIsUsersLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setRegisteredUsers(data);
      }
    } catch (err) {
      console.error('Error fetching registered users:', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? This will log them out and prevent future access until registered again.')) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('User Deleted', 'User has been deleted successfully.', 'success');
        const data = await response.json();
        setRegisteredUsers(data.users || []);
      } else {
        showToast('Delete Failed', 'Could not delete user.', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  // Custom Payment QRs, Bank details and Split settings state
  const [paymentQRs, setPaymentQRs] = useState<any[]>([]);
  const [bankDetailsList, setBankDetailsList] = useState<any[]>([]);
  const [splitDetails, setSplitDetails] = useState<any>({ advancePercent: 50, instructions: "" });

  const [newQrLabel, setNewQrLabel] = useState('');
  const [newQrImageUrl, setNewQrImageUrl] = useState('');
  const [newQrUpiId, setNewQrUpiId] = useState('');
  const [qrUploadProgress, setQrUploadProgress] = useState(false);

  const [newBankLabel, setNewBankLabel] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccountName, setNewBankAccountName] = useState('');
  const [newBankAccountNumber, setNewBankAccountNumber] = useState('');
  const [newBankIfscCode, setNewBankIfscCode] = useState('');

  // AI Follow-up Template State
  const [activeFollowUpTemplate, setActiveFollowUpTemplate] = useState<'invite' | 'discount' | 'timeline' | 'ai_pitch'>('invite');
  const [isGeneratingAiPitch, setIsGeneratingAiPitch] = useState(false);
  const [customAiPitches, setCustomAiPitches] = useState<{ [inquiryId: string]: string }>({});

  // Dynamic Service Creator inputs
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('social');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceMrp, setNewServiceMrp] = useState('');
  const [newServiceLaunchPrice, setNewServiceLaunchPrice] = useState('');
  const [newServiceUnit, setNewServiceUnit] = useState('/ reel');
  const [newServiceIcon, setNewServiceIcon] = useState('Sparkles');
  const [newServiceImageUrl, setNewServiceImageUrl] = useState('');
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);

  // Editing structures for Branding / Logo
  const [logoFirst, setLogoFirst] = useState('');
  const [logoSecond, setLogoSecond] = useState('');
  const [logoSubtitleText, setLogoSubtitleText] = useState('Digital Agency');
  const [cyanStart, setCyanStart] = useState('#22d3ee');
  const [cyanEnd, setCyanEnd] = useState('#0891b2');
  const [purpleStart, setPurpleStart] = useState('#a855f7');
  const [purpleEnd, setPurpleEnd] = useState('#7e22ce');
  const [logoAnimationDuration, setLogoAnimationDuration] = useState(2);
  const [activeTheme, setActiveTheme] = useState('indigo-cyber');
  const [logoIconType, setLogoIconType] = useState('animated-vector');
  const [logoCustomUrl, setLogoCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Flipkart Event settings states
  const [eventActive, setEventActive] = useState(true);
  const [eventName, setEventName] = useState('BIG BILLION FIESTA');
  const [eventTagline, setEventTagline] = useState('');
  const [eventDiscountText, setEventDiscountText] = useState('');
  const [eventEndsAt, setEventEndsAt] = useState('');
  const [eventBannerBg, setEventBannerBg] = useState('sunset-fire');
  const [eventDeals, setEventDeals] = useState<any[]>([]);

  // Coupons manager inputs
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponEventName, setNewCouponEventName] = useState('');
  const [newCouponDiscountType, setNewCouponDiscountType] = useState<'flat' | 'percentage'>('percentage');
  const [newCouponDiscountValue, setNewCouponDiscountValue] = useState(0);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState(0);

  const fetchControlData = async () => {
    try {
      const resSettings = await fetch('/api/settings');
      if (resSettings.ok) {
        const dSettings = await resSettings.json();
        setSettings(dSettings);
        setLogoFirst(dSettings.logoTextFirst || 'DIZO');
        setLogoSecond(dSettings.logoTextSecond || 'PULSE');
        setLogoSubtitleText(dSettings.logoSubtitle || 'Digital Agency');
        setCyanStart(dSettings.logoCyanStart || dSettings.cyanStart || '#22d3ee');
        setCyanEnd(dSettings.logoCyanEnd || dSettings.cyanEnd || '#0891b2');
        setPurpleStart(dSettings.logoPurpleStart || dSettings.purpleStart || '#a855f7');
        setPurpleEnd(dSettings.logoPurpleEnd || dSettings.purpleEnd || '#7e22ce');
        setLogoAnimationDuration(dSettings.logoAnimDuration || dSettings.logoAnimDuration || 2);
        
        setActiveTheme(dSettings.activeTheme || 'indigo-cyber');
        setLogoIconType(dSettings.logoIconType || 'animated-vector');
        setLogoCustomUrl(dSettings.logoCustomUrl || '');
        setEventActive(dSettings.eventActive ?? true);
        setEventName(dSettings.eventName || 'BIG BILLION FIESTA');
        setEventTagline(dSettings.eventTagline || '');
        setEventDiscountText(dSettings.eventDiscountText || '');
        setEventEndsAt(dSettings.eventEndsAt ? dSettings.eventEndsAt.slice(0, 16) : '');
        setEventBannerBg(dSettings.eventBannerBg || 'sunset-fire');
        setEventDeals(dSettings.eventDeals || []);

        // Load payment QRs and bank accounts
        setPaymentQRs(dSettings.paymentQRs || [
          {
            id: 'qr-1',
            label: 'GPay / PhonePe UPI',
            imageUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=400&q=80',
            upiId: 'support.dizopulse@okaxis'
          }
        ]);
        setBankDetailsList(dSettings.bankDetailsList || [
          {
            id: 'bank-1',
            label: 'Primary Axis Account',
            bankName: 'Axis Bank',
            accountName: 'DIZO PULSE',
            accountNumber: '923020054718420',
            ifscCode: 'UTIB0001604'
          }
        ]);
        setSplitDetails(dSettings.splitDetails || {
          advancePercent: 50,
          instructions: 'To initiate your project contract, transfer the advance to UPI or Bank. Click the WhatsApp button below to instantly verify your contract draft!'
        });
      }
      const resServices = await fetch('/api/services');
      if (resServices.ok) {
        setServicesList(await resServices.json());
      } else {
        setServicesList(services);
      }
      const resBundles = await fetch('/api/bundles');
      if (resBundles.ok) {
        setBundlesList(await resBundles.json());
      }
      const resCoupons = await fetch('/api/coupons');
      if (resCoupons.ok) {
        setCouponsList(await resCoupons.json());
      }
    } catch (e) {
      console.error('Error fetching admin controls:', e);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServiceMrp || !newServiceLaunchPrice) {
      alert('Service Name, Price (MRP), and Launch Price are required.');
      return;
    }
    const generatedId = newServiceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!generatedId) {
      alert('Invalid Service Name.');
      return;
    }

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: generatedId,
          name: newServiceName,
          category: newServiceCategory,
          description: newServiceDescription,
          mrp: Number(newServiceMrp),
          launchPrice: Number(newServiceLaunchPrice),
          unit: newServiceUnit,
          iconName: newServiceIcon,
          imageUrl: newServiceImageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
        })
      });

      if (response.ok) {
        alert(`New Service "${newServiceName}" successfully created!`);
        setNewServiceName('');
        setNewServiceDescription('');
        setNewServiceMrp('');
        setNewServiceLaunchPrice('');
        setNewServiceImageUrl('');
        setShowAddServiceForm(false);
        fetchControlData();
      } else {
        alert('Failed to create service.');
      }
    } catch (err: any) {
      alert('Error creating service: ' + err.message);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this service? It will be removed from the Quote Estimator and strategy recommendations immediately.')) {
      return;
    }
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Service successfully deleted!');
        fetchControlData();
      } else {
        alert('Failed to delete service.');
      }
    } catch (err: any) {
      alert('Error deleting service: ' + err.message);
    }
  };

  const handleAddQR = () => {
    if (!newQrLabel) {
      alert('QR Label is required (e.g. GPay QR)');
      return;
    }
    const newQR = {
      id: `qr-${Date.now()}`,
      label: newQrLabel,
      imageUrl: newQrImageUrl || 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=400&q=80',
      upiId: newQrUpiId
    };
    setPaymentQRs([...paymentQRs, newQR]);
    setNewQrLabel('');
    setNewQrImageUrl('');
    setNewQrUpiId('');
  };

  const handleRemoveQR = (id: string) => {
    setPaymentQRs(paymentQRs.filter(qr => qr.id !== id));
  };

  const handleAddBank = () => {
    if (!newBankLabel || !newBankName || !newBankAccountName || !newBankAccountNumber || !newBankIfscCode) {
      alert('All Bank Account fields are required.');
      return;
    }
    const newBank = {
      id: `bank-${Date.now()}`,
      label: newBankLabel,
      bankName: newBankName,
      accountName: newBankAccountName,
      accountNumber: newBankAccountNumber,
      ifscCode: newBankIfscCode
    };
    setBankDetailsList([...bankDetailsList, newBank]);
    setNewBankLabel('');
    setNewBankName('');
    setNewBankAccountName('');
    setNewBankAccountNumber('');
    setNewBankIfscCode('');
  };

  const handleRemoveBank = (id: string) => {
    setBankDetailsList(bankDetailsList.filter(b => b.id !== id));
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchControlData();
      fetchRegisteredUsers();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && adminSubTab === 'users') {
      fetchRegisteredUsers();
    }
  }, [isAuthenticated, adminSubTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoTextFirst: logoFirst,
          logoTextSecond: logoSecond,
          logoSubtitle: logoSubtitleText,
          logoSlogan: settings?.logoSlogan || "DESIGN • CREATE • GROW",
          logoCyanStart: cyanStart,
          logoCyanEnd: cyanEnd,
          logoPurpleStart: purpleStart,
          logoPurpleEnd: purpleEnd,
          logoAnimDuration: Number(logoAnimationDuration),
          logoPreset: "custom",
          activeTheme,
          logoIconType,
          logoCustomUrl,
          eventActive,
          eventName,
          eventTagline,
          eventDiscountText,
          eventEndsAt: eventEndsAt ? new Date(eventEndsAt).toISOString() : new Date("2026-12-31T23:59:59Z").toISOString(),
          eventBannerBg,
          eventDeals,
          paymentQRs,
          bankDetailsList,
          splitDetails
        }),
      });
      if (response.ok) {
        alert('Branding, theme, and Flipkart sales event configurations successfully saved! Page will refresh to display live configurations.');
        window.location.reload();
      } else {
        alert('Error: Could not save settings.');
      }
    } catch (err: any) {
      alert('Error updating settings: ' + err.message);
    }
  };

  const handleSaveServicePrice = async (serviceId: string, updatedMrp: number, updatedLaunch: number, imageUrl?: string) => {
    try {
      const srv = servicesList.find(s => s.id === serviceId);
      if (!srv) return;
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...srv,
          mrp: Number(updatedMrp),
          launchPrice: Number(updatedLaunch),
          imageUrl: imageUrl !== undefined ? imageUrl : (srv.imageUrl || '')
        }),
      });
      if (response.ok) {
        alert(`Service "${srv.name}" successfully updated!`);
        fetchControlData();
      } else {
        alert('Failed to update service details.');
      }
    } catch (err: any) {
      alert('Error updating service details: ' + err.message);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponEventName) {
      alert('Required coupon field is missing.');
      return;
    }
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          eventName: newCouponEventName,
          discountType: newCouponDiscountType,
          discountValue: Number(newCouponDiscountValue),
          minOrderValue: Number(newCouponMinOrder),
          active: true,
        }),
      });
      if (response.ok) {
        alert(`Coupon "${newCouponCode.trim().toUpperCase()}" created successfully!`);
        setNewCouponCode('');
        setNewCouponEventName('');
        setNewCouponDiscountValue(0);
        setNewCouponMinOrder(0);
        fetchControlData();
      } else {
        alert('Failed to create coupon.');
      }
    } catch (err: any) {
      alert('Error creating coupon: ' + err.message);
    }
  };

  const handleToggleCouponActive = async (code: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/coupons?code=${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (response.ok) {
        fetchControlData();
      } else {
        alert('Failed to toggle coupon status.');
      }
    } catch (err: any) {
      alert('Error toggling coupon: ' + err.message);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete event coupon "${code}"?`)) return;
    try {
      const response = await fetch(`/api/coupons?code=${code}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchControlData();
      } else {
        alert('Failed to delete coupon.');
      }
    } catch (err: any) {
      alert('Error deleting coupon: ' + err.message);
    }
  };

  const getFollowUpMessage = (inq: Inquiry, type: 'invite' | 'discount' | 'timeline' | 'ai_pitch') => {
    if (type === 'ai_pitch') {
      return customAiPitches[inq.id] || "No custom AI Pitch has been generated yet for this lead. Click \"Generate Custom AI Pitch\" below to formulate a personalized, niche-specific follow-up pitch via Gemini!";
    }

    const brandName = inq.businessName || 'your brand';
    const price = inq.totalDiscounted.toLocaleString('en-IN');
    const items = inq.services.map(sId => servicesList.find(s => s.id === sId)?.name || sId).join(', ');

    switch (type) {
      case 'invite':
        return `Hello ${inq.clientName}! 👋 This is the Principal Consultant from Dizo Pulse. We reviewed your requested digital services (${items}) and have scope-approved your customized quote of ₹${price} for "${brandName}". Shall we set up a quick 10-minute kickoff chat to lock in the initial wireframe structures? Let me know your availability! 🚀`;
      case 'discount':
        return `Hi ${inq.clientName}! 🌟 It was great looking over your requirements for "${brandName}". To help you get started immediately, if we lock in your scoping roadmap of ₹${price} today, I can request an extra special launch-discount or double your project revision cycles! Shall I adjust your estimate and send over the kick-off calendar link?`;
      case 'timeline':
        return `Dear ${inq.clientName}, hope you are doing great! 📈 We have drafted your custom 4-week implementation milestones for "${brandName}" incorporating our premium packages (${items}). Your total launch budget is approved at ₹${price}. Are you free for a quick 10-minute call today to review the milestones?`;
      default:
        return '';
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Follow-up pitch text successfully copied to clipboard!');
  };

  const handleGenerateAiPitch = async (inq: Inquiry) => {
    setIsGeneratingAiPitch(true);
    try {
      const selectedServicesNames = inq.services.map(sId => servicesList.find(s => s.id === sId)?.name || sId);
      const response = await fetch('/api/admin/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: inq.clientName,
          businessName: inq.businessName,
          businessNiche: inq.businessNiche,
          message: inq.message,
          services: selectedServicesNames,
          totalDiscounted: inq.totalDiscounted
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomAiPitches(prev => ({
          ...prev,
          [inq.id]: data.pitch
        }));
      } else {
        alert('Failed to generate AI pitch.');
      }
    } catch (err: any) {
      alert('Error generating AI pitch: ' + err.message);
    } finally {
      setIsGeneratingAiPitch(false);
    }
  };

  // Session recovery
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('dizopulse_admin_auth');
    const savedRole = sessionStorage.getItem('dizopulse_admin_role');
    const savedEmail = sessionStorage.getItem('dizopulse_admin_email');
    const savedName = sessionStorage.getItem('dizopulse_admin_name');
    const savedPerms = sessionStorage.getItem('dizopulse_admin_permissions');
    const savedAccess = sessionStorage.getItem('dizopulse_admin_project_access');
    const savedToken = sessionStorage.getItem('dizopulse_session_token');

    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      if (savedRole) setUserRole(savedRole);
      if (savedEmail) setUserEmail(savedEmail);
      if (savedName) setUserName(savedName);
      if (savedPerms) {
        try {
          setUserPermissions(JSON.parse(savedPerms));
        } catch (e) {}
      }
      if (savedAccess) {
        try {
          setUserProjectAccess(JSON.parse(savedAccess));
        } catch (e) {}
      }

      // Validate active session token with backend
      if (savedToken) {
        fetch('/api/admin/security/validate-session', {
          headers: { 'X-Session-Token': savedToken }
        })
          .then(res => res.json())
          .then(data => {
            if (!data.valid) {
              handleLogout();
              showToast('Session expired or revoked. Please login again.', 'warning');
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Periodic Session Validation Check (Every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = sessionStorage.getItem('dizopulse_session_token');
    if (!token) return;

    const interval = setInterval(() => {
      fetch('/api/admin/security/validate-session', {
        headers: { 'X-Session-Token': token }
      })
        .then(res => res.json())
        .then(data => {
          if (!data.valid) {
            handleLogout();
            showToast('Your session was revoked or expired.', 'error');
          }
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimeLeft]);

  // Fetch all inquiries from fullstack API
  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inquiries');
      if (!response.ok) {
        throw new Error('Could not fetch pipeline from server');
      }
      const data = await response.json();
      setInquiries(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchInquiries();
    }
  }, [isAuthenticated]);

  // Sync temp notes when selected inquiry changes
  useEffect(() => {
    if (selectedInquiry) {
      setTempNotes(selectedInquiry.adminNotes || '');
    }
  }, [selectedInquiry]);

  // Handle Login authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both Email Address and Password.');
      return;
    }

    // Check if locked out
    if (lockoutTimeLeft > 0) {
      setLoginError(`System locked. Try again in ${lockoutTimeLeft} seconds.`);
      return;
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUserRole(data.role || 'super_admin');
        setUserName(data.name || '');
        setUserEmail(data.email || '');
        if (data.permissions) setUserPermissions(data.permissions);
        if (data.projectAccess) setUserProjectAccess(data.projectAccess);

        setFailedAttempts(0);
        setLoginPassword('');
        setLoginEmail('');

        sessionStorage.setItem('dizopulse_admin_auth', 'true');
        sessionStorage.setItem('dizopulse_admin_role', data.role || 'super_admin');
        if (data.email) sessionStorage.setItem('dizopulse_admin_email', data.email);
        if (data.name) sessionStorage.setItem('dizopulse_admin_name', data.name);
        if (data.permissions) sessionStorage.setItem('dizopulse_admin_permissions', JSON.stringify(data.permissions));
        if (data.projectAccess) sessionStorage.setItem('dizopulse_admin_project_access', JSON.stringify(data.projectAccess));
        if (data.sessionToken) sessionStorage.setItem('dizopulse_session_token', data.sessionToken);

        if (data.forcePasswordChange) {
          setShowChangePasswordModal(true);
          showToast('Security Alert: Password change required by Administrator.', 'warning');
        }
      } else {
        const data = await response.json();
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        setLoginError(data.error || 'Incorrect email or password.');
      }
    } catch (err: any) {
      setLoginError('Network connection error. Please try again.');
    }
  };

  // Secure Logout
  const handleLogout = () => {
    const token = sessionStorage.getItem('dizopulse_session_token');
    if (token) {
      fetch('/api/admin/security/revoke-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: token })
      }).catch(() => {});
    }

    setIsAuthenticated(false);
    sessionStorage.removeItem('dizopulse_admin_auth');
    sessionStorage.removeItem('dizopulse_admin_role');
    sessionStorage.removeItem('dizopulse_admin_email');
    sessionStorage.removeItem('dizopulse_admin_name');
    sessionStorage.removeItem('dizopulse_admin_permissions');
    sessionStorage.removeItem('dizopulse_admin_project_access');
    sessionStorage.removeItem('dizopulse_session_token');
    setSelectedInquiry(null);
  };

  // Staff Password Change Handler
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordModalError('');
    setPasswordModalSuccess('');

    if (!newPasswordInput.trim()) {
      setPasswordModalError('New Password cannot be empty.');
      return;
    }

    if (newPasswordInput.trim().length < 4) {
      setPasswordModalError('Password must be at least 4 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordModalError('New Password and Confirm Password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/admin/staff/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          oldPassword: oldPasswordInput,
          newPassword: newPasswordInput,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordModalSuccess('Your workspace password has been updated successfully.');
        setOldPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setPasswordModalSuccess('');
        }, 2000);
      } else {
        setPasswordModalError(data.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setPasswordModalError('Network error: ' + err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // REST API Actions
  const handleUpdateInquiryField = async (id: string, updates: Partial<Inquiry>) => {
    setOperationLoadingId(id);
    try {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update inquiry values');
      }

      const updated = await response.json();
      setInquiries((prev) => prev.map((inq) => (inq.id === id ? updated : inq)));
      
      // Sync selected drawer inquiry as well
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Error executing action');
    } finally {
      setOperationLoadingId(null);
    }
  };

  // Save private internal admin notes
  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes: tempNotes }),
      });

      if (!response.ok) {
        throw new Error('Could not save notes');
      }

      const updated = await response.json();
      setInquiries((prev) => prev.map((inq) => (inq.id === selectedInquiry.id ? updated : inq)));
      setSelectedInquiry(updated);
    } catch (err: any) {
      alert(err.message || 'Error saving internal notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Delete lead record entirely from JSON database
  const handleDeleteInquiry = async (id: string) => {
    try {
      const response = await fetch(`/api/inquiries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Could not delete from database');
      }

      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete lead');
    }
  };

  // --- BUSINESS METRICS ENGINE ---
  const activeLeads = inquiries.filter((i) => !i.archived);
  const totalLeadsCount = activeLeads.length;
  const archivedLeadsCount = inquiries.filter((i) => i.archived).length;
  const pipelineValue = activeLeads.reduce((sum, item) => sum + item.totalDiscounted, 0);
  const avgDealValue = totalLeadsCount > 0 ? Math.round(pipelineValue / totalLeadsCount) : 0;

  const weightedForecast = activeLeads.reduce((sum, item) => {
    let probability = 0.2; // 'new'
    if (item.status === 'contacted') probability = 0.5;
    if (item.status === 'proposal_sent') probability = 0.8;
    if (item.status === 'closed') probability = 1.0;
    return sum + Math.round(item.totalDiscounted * probability);
  }, 0);
  
  const highPriorityCount = activeLeads.filter((i) => i.priority === 'high').length;
  const midPriorityCount = activeLeads.filter((i) => i.priority === 'medium').length;
  const lowPriorityCount = activeLeads.filter((i) => i.priority === 'low' || !i.priority).length;

  const closedDeals = activeLeads.filter((i) => i.status === 'closed').length;
  const conversionRate = totalLeadsCount > 0 ? Math.round((closedDeals / totalLeadsCount) * 100) : 0;

  // Live analytics popular deliverables generator
  const getTopServicesDistribution = () => {
    const counts: { [name: string]: number } = {};
    inquiries.forEach((item) => {
      item.services.forEach((srvId) => {
        const srvObj = services.find((s) => s.id === srvId);
        const name = srvObj ? srvObj.name : srvId;
        counts[name] = (counts[name] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  };

  const topServices = getTopServicesDistribution();
  const maxServiceCount = topServices.length > 0 ? Math.max(...topServices.map((s) => s.count)) : 1;

  // --- FILTERING & SORTING LOGIC ---
  const filteredInquiries = inquiries
    .filter((item) => {
      // 1. Archive filter
      const matchesArchive = showArchived ? item.archived === true : !item.archived;
      if (!matchesArchive) return false;

      // 2. Stage Filter
      if (stageFilter !== 'all' && item.status !== stageFilter) return false;

      // 3. Priority Filter
      if (priorityFilter !== 'all') {
        const p = item.priority || 'low';
        if (p !== priorityFilter) return false;
      }

      // 4. Global Search query
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesClient = item.clientName.toLowerCase().includes(term);
        const matchesBusiness = item.businessName.toLowerCase().includes(term);
        const matchesEmail = item.email.toLowerCase().includes(term);
        const matchesPhone = item.whatsapp.toLowerCase().includes(term);
        const matchesNiche = (item.businessNiche || '').toLowerCase().includes(term);
        const matchesId = item.id.toLowerCase().includes(term);

        return matchesClient || matchesBusiness || matchesEmail || matchesPhone || matchesNiche || matchesId;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort logic
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'value-high') {
        return b.totalDiscounted - a.totalDiscounted;
      }
      if (sortBy === 'value-low') {
        return a.totalDiscounted - b.totalDiscounted;
      }
      return 0;
    });

  // Selection toggle handlers for checkboxes
  const isAllSelected = filteredInquiries.length > 0 && filteredInquiries.every(inq => selectedInquiryIds.includes(inq.id));

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      const filteredIds = filteredInquiries.map(inq => inq.id);
      setSelectedInquiryIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredInquiries.map(inq => inq.id);
      setSelectedInquiryIds(prev => {
        const union = new Set([...prev, ...filteredIds]);
        return Array.from(union);
      });
    }
  };

  const handleSelectInquiryToggle = (id: string) => {
    setSelectedInquiryIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Helper formatting utilities
  const getServiceNamesList = (ids: string[]) => {
    return ids
      .map((id) => services.find((s) => s.id === id)?.name || id)
      .join(', ');
  };

  const formatDateIndian = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const triggerInvoicePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans w-full" id="agency-leads-panel">
      {/* SECURE LOCK LOGIN PANEL */}
      {!isAuthenticated ? (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-md my-auto space-y-4">
            {onBackToSite && (
              <button
                onClick={onBackToSite}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-800 cursor-pointer shadow-md"
              >
                <Icons.ArrowLeft className="w-4 h-4" />
                <span>Back to Public Website</span>
              </button>
            )}

            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 text-center shadow-2xl text-slate-800">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Icons.ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl mb-1">Agency Admin & Team Portal</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Enter your corporate email address and workspace password to access the Admin Control Center.
              </p>

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Icons.Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. mukeshsinghmukesh316@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={lockoutTimeLeft > 0}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Workspace Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Icons.Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={lockoutTimeLeft > 0}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2 justify-center leading-normal">
                    <Icons.AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={lockoutTimeLeft > 0}
                  className="w-full font-black py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Icons.LogIn className="w-4 h-4" />
                  {lockoutTimeLeft > 0 ? `Locked Out (${lockoutTimeLeft}s)` : 'Sign In to Admin Control Center'}
                </button>
              </form>

              {/* Useful login credential hints box */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-left space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Default Executive Account:
                </span>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 font-medium space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">Super Admin:</span>
                    <span className="font-mono text-indigo-600">mukeshsinghmukesh316@gmail.com</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">Password:</span>
                    <span className="font-mono text-slate-700">dizo@teamwork</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-100/70 flex flex-col md:flex-row text-slate-800 w-full">
          {/* PREMIUM SAAS NAVIGATION SIDEBAR */}
          <AdminNavigation
            activeTab={adminSubTab as AdminTab}
            onTabChange={handleAdminSubTabChange}
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
            userPermissions={userPermissions}
            isMobileSidebarOpen={isMobileSidebarOpen}
            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
            onLogout={handleLogout}
            onBackToSite={onBackToSite}
            onChangePassword={() => setShowChangePasswordModal(true)}
            counts={{
              totalLeadsCount,
              proposalsCount: proposals.length,
              contractsCount: contracts.length,
              activeProjectsCount: projects.filter(p => p.status !== 'Completed').length,
              unreadMessagesCount: conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
              registeredUsersCount: registeredUsers.length,
              staffListCount: staffList.length,
            }}
          />

          {/* MAIN WORKSPACE CONTENT CONTAINER */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
            {/* BREADCRUMB & CONTEXTUAL HEADER BAR */}
            <AdminHeaderBar
              activeTab={adminSubTab as AdminTab}
              userRole={userRole}
              onBackToSite={onBackToSite}
              onChangePassword={() => setShowChangePasswordModal(true)}
              contextualActions={{
                onNewLead: () => setShowAddLeadModal(true),
                onExportCSV: handleExportCSV,
                onNewProposal: handleOpenNewProposalModal,
                onRefreshData: fetchAllAgencyData,
              }}
            />

            {/* TAB CONTENT 1: OVERVIEW DASHBOARD */}
            {adminSubTab === 'overview' && (
              <AgencyOperationsDashboard
                inquiries={inquiries}
                proposals={proposals}
                contracts={contracts}
                projects={projects}
                conversations={conversations}
                staffList={staffList}
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
                onNavigateTab={(tab) => setAdminSubTab(tab)}
                onOpenAddLeadModal={() => setShowAddLeadModal(true)}
                onOpenNewProposalModal={handleOpenNewProposalModal}
                onSelectInquiry={(inq) => setSelectedInquiry(inq)}
                onConvertInquiryToProposal={handleConvertInquiryToProposal}
                onOpenChangePassword={() => setShowChangePasswordModal(true)}
              />
            )}

            {/* TAB CONTENT 2: ADVANCED LEADS & ORDERS CRM PIPELINE */}
            {adminSubTab === 'pipeline' && (
              <LeadsCrmPipeline
                inquiries={inquiries}
                servicesList={services}
                staffList={staffList}
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
                onRefreshInquiries={fetchInquiries}
                onConvertInquiryToProposal={handleConvertInquiryToProposal}
                onOpenAddLeadModal={() => setShowAddLeadModal(true)}
              />
            )}

            {false && adminSubTab === 'pipeline' && (
            <>
              {/* DASHBOARD HERO METRICS SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* Metric 1: Active Pipeline */}
            <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-xl">
                <Icons.Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">
                  Active Pipeline
                </span>
                <p className="text-xl font-black text-slate-900 mt-1">{totalLeadsCount} Leads</p>
                {archivedLeadsCount > 0 && (
                  <span className="text-[9px] text-slate-400 mt-0.5 block">
                    +{archivedLeadsCount} archived
                  </span>
                )}
              </div>
            </div>

            {/* Metric 2: Raw Pipeline Value */}
            <div className="bg-gradient-to-br from-indigo-500/[0.03] to-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl">
                <Icons.TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">
                  Raw Contract Value
                </span>
                <p className="text-xl font-black text-indigo-900 mt-1">
                  ₹{pipelineValue.toLocaleString('en-IN')}
                </p>
                <span className="text-[9px] text-slate-500 mt-0.5 block">
                  Avg: ₹{avgDealValue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Metric 3: Weighted Sales Forecast */}
            <div className="bg-gradient-to-br from-emerald-500/[0.04] to-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-xl">
                <Icons.Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 block">
                  Weighted Forecast
                </span>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  ₹{weightedForecast.toLocaleString('en-IN')}
                </p>
                <span className="text-[9px] text-slate-500 mt-0.5 block">
                  Weighted probability CRM
                </span>
              </div>
            </div>

            {/* Metric 4: Priority Distribution */}
            <div className="bg-gradient-to-br from-amber-500/[0.02] to-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl">
                <Icons.Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">
                  Priority Hot Leads
                </span>
                <p className="text-xl font-black text-rose-600 mt-1">
                  {highPriorityCount} Hot 🔥
                </p>
                <span className="text-[9px] text-slate-500 mt-0.5 block">
                  {midPriorityCount} Mid | {lowPriorityCount} Low
                </span>
              </div>
            </div>

            {/* Metric 5: Stage Conversion Rate */}
            <div className="bg-gradient-to-br from-cyan-50/50 to-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-cyan-50 text-cyan-700 border border-cyan-100 rounded-xl">
                <Icons.CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">
                  Conversion Rate
                </span>
                <p className="text-xl font-black text-cyan-700 mt-1">{conversionRate}%</p>
                <span className="text-[9px] text-slate-500 mt-0.5 block">
                  {closedDeals} closed deals
                </span>
              </div>
            </div>
          </div>

          {/* ANALYTICS BENTO BLOCK */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            
            {/* Column 1: Top Demands Chart representation (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-150 shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-4">
                <Icons.PieChart className="w-4 h-4 text-indigo-600" />
                Service Popularity Scopes
              </h4>
              
              {topServices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Insufficient inquiry data to plot demand map.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {topServices.map((srv, index) => {
                    const widthPct = Math.round((srv.count / maxServiceCount) * 100);
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                          <span className="truncate">{srv.name}</span>
                          <span className="text-indigo-600 font-extrabold">{srv.count} requests</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 2: Active Operator Follow-up Tasks (lg:col-span-4) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center justify-between gap-1.5 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Icons.CheckSquare className="w-4 h-4 text-emerald-600" />
                    Follow-up Reminders
                  </span>
                  {adminTasks.some(t => t.completed) && (
                    <button
                      onClick={handleClearCompletedTasks}
                      className="text-[9px] text-red-500 hover:text-red-700 font-bold uppercase transition-colors cursor-pointer"
                    >
                      Clear Done
                    </button>
                  )}
                </h4>
                
                {/* Add Task Form */}
                <form onSubmit={handleAddTask} className="flex gap-1.5 mb-3">
                  <input
                    type="text"
                    placeholder="Call client, send proposal..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Icons.Plus className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Task items list */}
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {adminTasks.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-slate-400 font-medium">
                      No follow-up reminders. Add one to track pipeline actions!
                    </div>
                  ) : (
                    adminTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-1.5 rounded-lg border text-xs transition-all ${
                          t.completed 
                            ? 'bg-slate-50/55 border-slate-100 text-slate-400 line-through' 
                            : 'bg-white border-slate-150 text-slate-700 font-semibold'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => handleToggleTask(t.id)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="truncate">{t.text}</span>
                        </label>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5"
                          title="Delete Reminder"
                        >
                          <Icons.Trash className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Quick Actions & Status Summary Info (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Icons.Zap className="w-4 h-4 text-amber-500 animate-bounce" />
                  Operator Console
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Review leads, select status options to change stages, and chat directly via WhatsApp. Keep client cards scope synchronized.
                </p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[9px] block font-extrabold text-indigo-600 uppercase">Active Leads</span>
                    <span className="text-sm font-black text-indigo-900 block">{totalLeadsCount}</span>
                  </div>
                  <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[9px] block font-extrabold text-slate-600 uppercase">Archived</span>
                    <span className="text-sm font-black text-slate-800 block">{archivedLeadsCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-600">Secure CRM Live Connection</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200/60 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Icons.LogOut className="w-3 h-3" />
                  Disconnect Console
                </button>
              </div>
            </div>
          </div>

          {/* ADVANCED CRM ACTIONS CONTROLS & BULK DESK */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
            
            {/* Left side: Action launchers */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAddLeadModal(true)}
                className="px-4.5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-2 animate-fade-in"
              >
                <Icons.PlusCircle className="w-4 h-4" />
                Add Manual Lead
              </button>
              
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Icons.Download className="w-4 h-4 text-indigo-600" />
                Export CSV
              </button>
            </div>

            {/* Right side: Bulk desk (conditional on selection) */}
            <div className="flex-1 md:flex-initial">
              {selectedInquiryIds.length > 0 ? (
                <div className="bg-indigo-50/75 border border-indigo-100 p-2 px-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-pulse-subtle">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      {selectedInquiryIds.length}
                    </span>
                    <span className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider">
                      Leads Selected
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleBulkStatusChange('contacted')}
                      className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-md text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                    >
                      📞 Contacted
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('proposal_sent')}
                      className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-md text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                    >
                      ✉️ Proposal
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange('closed')}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                    >
                      🤝 Closed
                    </button>
                    <span className="text-slate-300 mx-0.5">|</span>
                    <button
                      onClick={() => handleBulkArchiveToggle(true)}
                      className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                      title="Archive Selected"
                    >
                      Archive
                    </button>
                    {userRole === 'admin' && (
                      <button
                        onClick={handleBulkDeleteLeads}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                        title="Delete Selected"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInquiryIds([])}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-1 ml-1"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-right text-[10px] font-semibold text-slate-400 italic">
                  Select checkboxes below to trigger multi-lead bulk actions.
                </div>
              )}
            </div>
          </div>

          {/* ADVANCED PIPELINE CONTROL TOOLBAR */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Search Input and Status tab switcher */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Icons.Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search lead by Name, Business, Email, Niche..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Select Tab Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setStageFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stageFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  All Stages
                </button>
                <button
                  onClick={() => setStageFilter('new')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    stageFilter === 'new'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  🆕 New
                </button>
                <button
                  onClick={() => setStageFilter('contacted')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    stageFilter === 'contacted'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  📞 Contacted
                </button>
                <button
                  onClick={() => setStageFilter('proposal_sent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    stageFilter === 'proposal_sent'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  ✉️ Proposal
                </button>
                <button
                  onClick={() => setStageFilter('closed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    stageFilter === 'closed'
                      ? 'bg-green-600 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  🤝 Closed
                </button>
              </div>
            </div>

            {/* Side filters: Sort, Archive selector, Priority dropdown */}
            <div className="flex flex-wrap items-center gap-3.5">
              {/* Priority filter selector */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">⚠️ All Priorities</option>
                  <option value="high">🔴 High Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="low">🟢 Low Priority</option>
                </select>
              </div>

              {/* Sorting Filter */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="newest">⏰ Date: Newest</option>
                  <option value="oldest">⏰ Date: Oldest</option>
                  <option value="value-high">💰 Value: High to Low</option>
                  <option value="value-low">💰 Value: Low to High</option>
                </select>
              </div>

              {/* View Switcher Segmented Control */}
              <div className="bg-slate-100/80 p-1 rounded-xl flex items-center border border-slate-200">
                <button
                  onClick={() => setPipelineViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    pipelineViewMode === 'list'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="List View"
                >
                  <Icons.List className="w-3.5 h-3.5" />
                  List
                </button>
                <button
                  onClick={() => setPipelineViewMode('kanban')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    pipelineViewMode === 'kanban'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Kanban Board"
                >
                  <Icons.Kanban className="w-3.5 h-3.5" />
                  Kanban
                </button>
              </div>

              {/* Archive Toggle Button */}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  showArchived
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icons.Archive className="w-3.5 h-3.5" />
                {showArchived ? 'Viewing Archived' : 'Show Archived'}
              </button>

              {/* Refresh pipeline button */}
              <button
                onClick={fetchInquiries}
                disabled={isLoading}
                className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50"
                title="Refresh Lead Database"
              >
                <Icons.RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* MAIN PIPELINE LEADS LIST/TABLE OR KANBAN */}
          {isLoading ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-150">
              <Icons.Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-slate-500 font-bold text-xs">Accessing lead databases and updating pipelines...</p>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
              <Icons.Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-black text-sm">No leads match your criteria.</p>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                Try clearing your search query, changing status categories, or checking active vs. archived collections.
              </p>
            </div>
          ) : pipelineViewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              {[
                { key: 'new', label: 'New Intake', icon: 'Sparkles', bg: 'bg-blue-50/20', text: 'text-blue-700', badgeBg: 'bg-blue-100' },
                { key: 'contacted', label: 'Contacted', icon: 'Phone', bg: 'bg-amber-50/20', text: 'text-amber-700', badgeBg: 'bg-amber-100' },
                { key: 'proposal_sent', label: 'Proposal Sent', icon: 'FileText', bg: 'bg-indigo-50/10', text: 'text-indigo-700', badgeBg: 'bg-indigo-100' },
                { key: 'closed', label: 'Closed Deal', icon: 'Award', bg: 'bg-green-50/20', text: 'text-green-700', badgeBg: 'bg-green-100' }
              ].map((col) => {
                const colInqs = filteredInquiries.filter(inq => inq.status === col.key);
                const colTotalValue = colInqs.reduce((acc, curr) => acc + curr.totalDiscounted, 0);

                return (
                  <div key={col.key} className={`rounded-2xl border border-slate-200 p-4 space-y-4 ${col.bg} flex flex-col min-h-[500px]`}>
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-black text-slate-800 truncate">{col.label}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${col.badgeBg} ${col.text}`}>
                          {colInqs.length}
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-indigo-600">₹{colTotalValue.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Column Body / Cards List */}
                    <div className="space-y-3 overflow-y-auto max-h-[600px] pr-0.5">
                      {colInqs.length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl bg-white/50">
                          Empty column
                        </div>
                      ) : (
                        colInqs.map((inq) => {
                          const priorityTag = inq.priority || 'low';
                          const isSelected = selectedInquiryIds.includes(inq.id);

                          return (
                            <div
                              key={inq.id}
                              className={`bg-white rounded-xl border border-slate-200 p-3.5 space-y-3.5 hover:shadow-md transition-all relative ${
                                isSelected ? 'ring-2 ring-indigo-500' : ''
                              }`}
                            >
                              {/* Card Header */}
                              <div className="flex items-start justify-between gap-1.5">
                                <label className="flex items-center gap-1.5 cursor-pointer min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectInquiryToggle(inq.id)}
                                    className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                                  />
                                  <span className="font-extrabold text-slate-900 truncate max-w-[110px]" title={inq.clientName}>
                                    {inq.clientName}
                                  </span>
                                </label>
                                
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                  priorityTag === 'high'
                                    ? 'bg-rose-50 border border-rose-100 text-rose-600'
                                    : priorityTag === 'medium'
                                    ? 'bg-amber-50 border border-amber-100 text-amber-600'
                                    : 'bg-green-50 border border-green-100 text-green-600'
                                }`}>
                                  {priorityTag === 'high' ? '🔥 HOT' : priorityTag.toUpperCase()}
                                </span>
                              </div>

                              {/* Card Body Details */}
                              <div className="space-y-1 text-[11px] text-slate-600">
                                <div className="truncate font-bold text-slate-800" title={inq.businessName}>
                                  🏢 {inq.businessName}
                                </div>
                                <div className="text-slate-500 text-[10px]">
                                  📁 {inq.businessNiche || 'General'}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {formatDateIndian(inq.createdAt)}
                                </div>
                              </div>

                              {/* Services Badge & Valuation */}
                              <div className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                <span className="font-bold text-slate-500">{inq.services.length} scopes</span>
                                <span className="font-black text-indigo-600">₹{inq.totalDiscounted.toLocaleString('en-IN')}</span>
                              </div>

                              {/* Card Footer Actions & Status transition arrows */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                {/* Status arrows */}
                                <div className="flex items-center gap-1">
                                  {col.key !== 'new' && (
                                    <button
                                      onClick={() => {
                                        const stages = ['new', 'contacted', 'proposal_sent', 'closed'];
                                        const prevStage = stages[stages.indexOf(col.key) - 1];
                                        handleUpdateInquiryField(inq.id, { status: prevStage as any });
                                      }}
                                      className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-indigo-600 text-xs font-bold"
                                      title="Move back"
                                    >
                                      ←
                                    </button>
                                  )}
                                  {col.key !== 'closed' && (
                                    <button
                                      onClick={() => {
                                        const stages = ['new', 'contacted', 'proposal_sent', 'closed'];
                                        const nextStage = stages[stages.indexOf(col.key) + 1];
                                        handleUpdateInquiryField(inq.id, { status: nextStage as any });
                                      }}
                                      className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-indigo-600 text-xs font-bold"
                                      title="Move forward"
                                    >
                                      →
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleConvertInquiryToProposal(inq)}
                                    className="p-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                                    title="Convert to Official Proposal"
                                  >
                                    <Icons.FileText className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedInquiry(inq)}
                                    className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                                    title="Open Scoping Workbench"
                                  >
                                    <Icons.Sliders className="w-3.5 h-3.5" />
                                  </button>
                                  <a
                                    href={`https://wa.me/${inq.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(
                                      `Hello ${inq.clientName}! This is Dizo Pulse Marketing Agency. We reviewed your custom quote request for ${inq.businessName} (Scoping total: ₹${inq.totalDiscounted.toLocaleString('en-IN')}) and would love to organize a creative brand alignment kickoff. Let us connect!`
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                                    title="WhatsApp Chat"
                                  >
                                    <Icons.Send className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                    <th className="w-12 py-4 px-5 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAllToggle}
                        className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        title="Toggle select all on this page"
                      />
                    </th>
                    <th className="py-4 px-5">Client & Business Details</th>
                    <th className="py-4 px-5">Contact Details</th>
                    <th className="py-4 px-5">ScopedDeliverables</th>
                    <th className="py-4 px-5">Calculated Quote</th>
                    <th className="py-4 px-5">Priority & Stage</th>
                    <th className="py-4 px-5 text-right">Quick Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {filteredInquiries.map((inq) => {
                    const hasNotes = inq.adminNotes && inq.adminNotes.trim() !== '';
                    const priorityTag = inq.priority || 'low';
                    const isRowSelected = selectedInquiryIds.includes(inq.id);

                    return (
                      <tr key={inq.id} className={`hover:bg-slate-50/40 transition-all ${isRowSelected ? 'bg-indigo-50/25' : ''}`}>
                        {/* Checkbox column */}
                        <td className="py-4.5 px-5 text-center">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={() => handleSelectInquiryToggle(inq.id)}
                            className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        {/* Client & Business Column */}
                        <td className="py-4.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-950 text-sm">{inq.clientName}</span>
                            {priorityTag === 'high' && (
                              <span className="bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-rose-500"></span>
                                HOT
                              </span>
                            )}
                          </div>
                          
                          <div className="text-slate-500 font-medium mt-1">
                            🏢 {inq.businessName} <span className="text-slate-400">({inq.businessNiche || 'General'})</span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center gap-2">
                            <span>ID: {inq.id}</span>
                            <span>•</span>
                            <span>{formatDateIndian(inq.createdAt)}</span>
                          </div>
                        </td>

                        {/* Contact Details Column */}
                        <td className="py-4.5 px-5 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Icons.MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{inq.whatsapp}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <Icons.Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[150px]">{inq.email}</span>
                          </div>
                        </td>

                        {/* Scoped Deliverables Column */}
                        <td className="py-4.5 px-5 max-w-[220px]">
                          <p className="line-clamp-2 text-slate-600 leading-normal font-medium" title={getServiceNamesList(inq.services)}>
                            {getServiceNamesList(inq.services) || 'Custom Scoping Consultation'}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                              {inq.services.length} deliverables
                            </span>
                            {hasNotes && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Icons.FileText className="w-3 h-3 text-slate-400" />
                                Note saved
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Calculations Quote total Column */}
                        <td className="py-4.5 px-5">
                          <div className="font-black text-indigo-600 text-sm">
                            ₹{inq.totalDiscounted.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5 line-through">
                            MRP: ₹{inq.totalOriginal.toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Priority Selector & Pipeline Stage Selection */}
                        <td className="py-4.5 px-5 space-y-1.5">
                          {/* Priority dropdown */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Priority:</span>
                            <select
                              value={priorityTag}
                              disabled={operationLoadingId === inq.id}
                              onChange={(e) => handleUpdateInquiryField(inq.id, { priority: e.target.value as any })}
                              className={`text-[9px] font-bold rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none ${
                                priorityTag === 'high'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : priorityTag === 'medium'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-green-50 text-green-700 border-green-200'
                              }`}
                            >
                              <option value="high">🔴 High</option>
                              <option value="medium">🟡 Medium</option>
                              <option value="low">🟢 Low</option>
                            </select>
                          </div>

                          {/* Stage picker selector */}
                          <select
                            value={inq.status}
                            disabled={operationLoadingId === inq.id}
                            onChange={(e) => handleUpdateInquiryField(inq.id, { status: e.target.value as any })}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                              inq.status === 'new'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : inq.status === 'contacted'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : inq.status === 'proposal_sent'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            <option value="new">🆕 New</option>
                            <option value="contacted">📞 Contacted</option>
                            <option value="proposal_sent">✉️ Proposal</option>
                            <option value="closed">🤝 Closed Deal</option>
                          </select>
                        </td>

                        {/* Actions Desk buttons */}
                        <td className="py-4.5 px-5 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedInquiry(inq)}
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors inline-block cursor-pointer"
                            title="Open Scoping Workbench & Notes"
                          >
                            <Icons.Sliders className="w-4 h-4" />
                          </button>

                          <a
                            href={`https://wa.me/${inq.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(
                              `Hello ${inq.clientName}! This is Dizo Pulse Marketing Agency. We reviewed your custom quote request for ${inq.businessName} (Scoping total: ₹${inq.totalDiscounted.toLocaleString('en-IN')}) and would love to organize a creative brand alignment kickoff. Let us connect!`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors inline-block cursor-pointer"
                            title="Follow Up on WhatsApp"
                          >
                            <Icons.Send className="w-4 h-4" />
                          </a>

                          {userRole === 'admin' && (
                            deleteConfirmId === inq.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteInquiry(inq.id)}
                                  className="px-1.5 py-1 bg-red-500 text-white rounded text-[9px] font-black cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-1 bg-slate-200 text-slate-700 rounded text-[9px] font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(inq.id)}
                                className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors inline-block cursor-pointer"
                                title="Delete inquiry"
                              >
                                <Icons.Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

      {/* LEAD SCORING DETAIL SLIDE-OVER DRAWER MODAL */}
      <AnimatePresence>
        {selectedInquiry && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end print:absolute print:inset-0 print:z-auto">
            
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInquiry(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs print:hidden"
            />

            {/* Slide over Drawer Panel body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto print:w-full print:shadow-none print:h-auto"
            >
              
              {/* Drawer Scrollable contents */}
              <div className="p-6 md:p-8 space-y-6 flex-1">
                
                {/* Drawer Header block */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-5 print:hidden">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-extrabold text-slate-400">
                      Scoping Desk Lead ID: {selectedInquiry.id}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                      Lead Scoping Workbench
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>

                {/* Printable Invoice header */}
                <div className="hidden print:block text-center border-b pb-5 mb-5">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Dizo Pulse Agency</h1>
                  <p className="text-xs text-slate-500">Aesthetics & Performance Redefined | support@dizopulse.com</p>
                  <p className="text-xs font-bold text-slate-700 mt-2">OFFICIAL DELIVERABLES SCOPING ESTIMATE</p>
                </div>

                {/* Client profile card overview */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{selectedInquiry.clientName}</h4>
                      <p className="text-xs text-indigo-600 font-bold mt-0.5">
                        🏢 {selectedInquiry.businessName} <span className="text-slate-500 font-medium">({selectedInquiry.businessNiche || 'N/A'})</span>
                      </p>
                    </div>
                    
                    <div className="text-right print:hidden">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                        selectedInquiry.status === 'new'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : selectedInquiry.status === 'contacted'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : selectedInquiry.status === 'proposal_sent'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        Stage: {selectedInquiry.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 border-t border-slate-200/60 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Icons.Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">{selectedInquiry.whatsapp}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icons.Mail className="w-4 h-4 text-slate-400" />
                      <span>{selectedInquiry.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <Icons.Calendar className="w-4 h-4 text-slate-400" />
                      <span>Received: {formatDateIndian(selectedInquiry.createdAt)}</span>
                    </div>
                  </div>

                  {selectedInquiry.message && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 mt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Client Guidelines:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        "{selectedInquiry.message}"
                      </p>
                    </div>
                  )}
                </div>

                {/* DETAILED SERVICE-BY-SERVICE CONFIGURATION ANALYSIS */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Icons.Boxes className="w-4 h-4 text-indigo-600" />
                    Enrolled Deliverables & Choice Configurations
                  </h4>

                  <div className="space-y-3.5">
                    {selectedInquiry.services.map((srvId, idx) => {
                      const srvObj = services.find((s) => s.id === srvId);
                      const customDetails = selectedInquiry.serviceDetails?.[srvId] || {
                        quantity: 1,
                        speed: 'standard',
                        brief: '',
                        fileName: '',
                      };

                      return (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                {React.createElement((Icons as any)[srvObj?.iconName || 'HelpCircle'] || Icons.HelpCircle, {
                                  className: 'w-4 h-4',
                                })}
                              </div>
                              <div>
                                <h5 className="font-extrabold text-xs text-slate-950">
                                  {srvObj?.name || srvId}
                                </h5>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Category: {srvObj?.category || 'Custom'}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 line-through block font-semibold">
                                MRP: ₹{((srvObj?.mrp || 0) * customDetails.quantity).toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs font-black text-indigo-600">
                                Launch Price active
                              </span>
                            </div>
                          </div>

                          {/* Specific variables configuration values */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600">
                            <div>
                              <span className="text-slate-400 text-[9px] uppercase block leading-none">Quantity</span>
                              <span className="text-slate-800 text-xs mt-1 block">
                                {customDetails.quantity} {srvObj?.unit || 'units'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[9px] uppercase block leading-none">Timeline Speed</span>
                              <span className={`text-xs mt-1 block ${customDetails.speed === 'express' ? 'text-amber-600 font-extrabold' : 'text-slate-800'}`}>
                                {customDetails.speed === 'express' ? '⚡ Express (+15%)' : 'Standard'}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 text-[9px] uppercase block leading-none">Style Reference</span>
                              <span className="text-slate-800 mt-1 block truncate" title={customDetails.fileName || 'None provided'}>
                                📁 {customDetails.fileName || 'None provided'}
                              </span>
                            </div>
                          </div>

                          {customDetails.brief && (
                            <div className="text-[10px] text-slate-500 bg-indigo-50/40 p-2 rounded border border-indigo-50/50">
                              <strong className="text-indigo-900 block font-bold mb-0.5">Scoping Brief:</strong>
                              "{customDetails.brief}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COMBINED BILLING FINANCIALS SUMMARY */}
                <div className="border-t border-slate-200 pt-4 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-slate-500">
                    <span>Base MRP Combined Valuation</span>
                    <span>₹{selectedInquiry.totalOriginal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <span>Flat Launch Discount Savings</span>
                    <span>-₹{(selectedInquiry.totalOriginal - selectedInquiry.totalDiscounted).toLocaleString('en-IN')}</span>
                  </div>
                  
                  {selectedInquiry.totalDiscounted >= 3000 && (
                    <div className="flex justify-between text-indigo-700 bg-indigo-50/60 border border-indigo-100 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                      <span>✨ Activated Elite Bonus Deal:</span>
                      <span>FREE Google Maps Business Setup</span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-slate-200">
                    <span className="font-extrabold text-slate-900 text-sm">Combined Package Estimate:</span>
                    <span className="text-xl font-black text-indigo-600">
                      ₹{selectedInquiry.totalDiscounted.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* INTERNAL PRIVATE NOTES & WORKBENCH */}
                <div className="border-t border-slate-100 pt-5 space-y-4 print:hidden">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Icons.FileText className="w-4 h-4 text-indigo-600" />
                    Internal Private Scoping Logs
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Private Follow-up logs (Admin Eyes Only)
                      </label>
                      <textarea
                        rows={3}
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="e.g. Spoke to Mukesh on Tuesday. Interested in Meta Ads launch but wants logo branding finalised first. Agreed to close by Friday."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none font-medium"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {/* Priority selector inside panel */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Pipeline Priority:</span>
                        <select
                          value={selectedInquiry.priority || 'low'}
                          onChange={(e) => handleUpdateInquiryField(selectedInquiry.id, { priority: e.target.value as any })}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border cursor-pointer focus:outline-none ${
                            selectedInquiry.priority === 'high'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : selectedInquiry.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                          }`}
                        >
                          <option value="high">🔴 High Priority</option>
                          <option value="medium">🟡 Medium Priority</option>
                          <option value="low">🟢 Low Priority</option>
                        </select>
                      </div>

                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSavingNotes ? (
                          <>
                            <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving Notes...
                          </>
                        ) : (
                          <>
                            <Icons.Save className="w-3.5 h-3.5" />
                            Save Private Note
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI EXECUTIVE CLIENT PITCH DESK */}
                <div className="bg-gradient-to-br from-indigo-50/20 to-white p-5 rounded-2xl border border-indigo-100 shadow-xs space-y-3.5 print:hidden">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Icons.Cpu className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                      Client Follow-Up Pitch Desk
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">
                      Active: {activeFollowUpTemplate.toUpperCase()}
                    </span>
                  </div>

                  {/* Template tabs selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-100/80 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveFollowUpTemplate('invite')}
                      className={`py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                        activeFollowUpTemplate === 'invite'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🤝 Kickoff Chat
                    </button>
                    <button
                      onClick={() => setActiveFollowUpTemplate('discount')}
                      className={`py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                        activeFollowUpTemplate === 'discount'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🎁 Incentive Offer
                    </button>
                    <button
                      onClick={() => setActiveFollowUpTemplate('timeline')}
                      className={`py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                        activeFollowUpTemplate === 'timeline'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📈 Timeline Pitch
                    </button>
                    <button
                      onClick={() => setActiveFollowUpTemplate('ai_pitch')}
                      className={`py-2 text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                        activeFollowUpTemplate === 'ai_pitch'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🤖 Custom AI Pitch
                    </button>
                  </div>

                  {/* Textarea review pane */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <p className="text-slate-700 text-xs leading-relaxed font-medium select-all whitespace-pre-line">
                      {getFollowUpMessage(selectedInquiry, activeFollowUpTemplate)}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
                      {activeFollowUpTemplate === 'ai_pitch' && (
                        <button
                          onClick={() => handleGenerateAiPitch(selectedInquiry)}
                          disabled={isGeneratingAiPitch}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {isGeneratingAiPitch ? (
                            <>
                              <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Generating Pitch...
                            </>
                          ) : (
                            <>
                              <Icons.Sparkles className="w-3.5 h-3.5" />
                              {customAiPitches[selectedInquiry.id] ? 'Regenerate AI Pitch' : 'Generate AI Pitch'}
                            </>
                          )}
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => handleCopyToClipboard(getFollowUpMessage(selectedInquiry, activeFollowUpTemplate))}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Icons.Copy className="w-3 h-3 text-slate-400" />
                        Copy Text
                      </button>
                    </div>
                  </div>
                </div>

                {/* Printable Invoice footer notice */}
                <div className="hidden print:block text-center border-t pt-8 mt-8 text-[10px] text-slate-400">
                  <p>All pricing specifications are subject to scope approval during technical kickoff.</p>
                  <p className="mt-1">Generated by Dizo Pulse Lead Scoping Module. ID: {selectedInquiry.id}</p>
                </div>
              </div>

              {/* Drawer Sticky Footer Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  {/* Archive button */}
                  <button
                    onClick={() => handleUpdateInquiryField(selectedInquiry.id, { archived: !selectedInquiry.archived })}
                    className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      selectedInquiry.archived
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Icons.Archive className="w-4 h-4 text-slate-400" />
                    {selectedInquiry.archived ? 'Activate Lead' : 'Archive Lead'}
                  </button>

                  {/* Print / Export Invoice */}
                  <button
                    onClick={triggerInvoicePrint}
                    className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icons.Printer className="w-4 h-4 text-slate-400" />
                    Print / PDF
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${selectedInquiry.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(
                      getFollowUpMessage(selectedInquiry, activeFollowUpTemplate)
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-green-100 cursor-pointer"
                  >
                    <Icons.MessageSquareQuote className="w-4.5 h-4.5" />
                    Follow Up on WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL LEAD CREATOR MODAL LAYER */}
      <AnimatePresence>
        {showAddLeadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Icons.UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                      Log Manual Client Inquiry
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Enter manual scoping requests from physical pitches, calls, or offline pitches
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowAddLeadModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateManualLeadSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* 2x2 Field Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Client Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={newLeadForm.clientName}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, clientName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      WhatsApp Contact *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={newLeadForm.whatsapp}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, whatsapp: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@business.com"
                      value={newLeadForm.email}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sharma Groceries"
                        value={newLeadForm.businessName}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, businessName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Business Niche
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Retail"
                        value={newLeadForm.businessNiche}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, businessNiche: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Scoping Scope Notes / Pitch Message
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe specific client details, requirements discussed, timeline requests..."
                    value={newLeadForm.message}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 resize-none focus:outline-none"
                  />
                </div>

                {/* Service Multi Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Select Scoped Deliverables Package
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {services.map((srv) => {
                      const isSelected = newLeadForm.selectedServiceIds.includes(srv.id);
                      return (
                        <div
                          key={srv.id}
                          onClick={() => {
                            const updatedSrvs = isSelected
                              ? newLeadForm.selectedServiceIds.filter(id => id !== srv.id)
                              : [...newLeadForm.selectedServiceIds, srv.id];
                            setNewLeadForm({ ...newLeadForm, selectedServiceIds: updatedSrvs });
                          }}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-extrabold'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                              {React.createElement((Icons as any)[srv.iconName] || Icons.HelpCircle, { className: 'w-3.5 h-3.5' })}
                            </div>
                            <span className="text-[11px] truncate">{srv.name}</span>
                          </div>
                          <span className={`text-[10px] font-extrabold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                            ₹{srv.mrp.toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Estimate Preview */}
                {newLeadForm.selectedServiceIds.length > 0 && (
                  <div className="bg-indigo-50/45 p-4 rounded-2xl border border-indigo-100/60 flex items-center justify-between text-xs font-bold text-slate-700 animate-fade-in">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block leading-none">Scoping Package Estimate</span>
                      <span className="text-slate-500 mt-1 block">
                        Base Value: ₹{newLeadForm.selectedServiceIds.reduce((sum, id) => sum + (services.find(s => s.id === id)?.mrp || 0), 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[9px] uppercase font-black">
                        Launch Deal: 20% Off
                      </span>
                      <span className="text-lg font-black text-indigo-600 block mt-1">
                        ₹{Math.round(newLeadForm.selectedServiceIds.reduce((sum, id) => sum + (services.find(s => s.id === id)?.mrp || 0), 0) * 0.8).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddLeadModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold uppercase rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold uppercase tracking-wide rounded-xl cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-1.5"
                  >
                    {isSubmittingLead ? (
                      <>
                        <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Logging Lead...
                      </>
                    ) : (
                      <>
                        <Icons.Check className="w-3.5 h-3.5" />
                        Register Lead
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
            </>
          )}

          {adminSubTab === 'proposals' && (
            <div className="space-y-6 animate-fade-in">
              {/* Proposals Header & Launcher */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Icons.FileText className="w-5 h-5 text-indigo-600" />
                    Professional Proposal Engine
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate, manage, track, and convert client proposals with automated ID generation and status syncing.
                  </p>
                </div>

                <button
                  onClick={handleOpenNewProposalModal}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Icons.PlusCircle className="w-4 h-4" />
                  <span>Create New Proposal</span>
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Icons.Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by ID, client name, email..."
                    value={proposalsSearchTerm}
                    onChange={(e) => setProposalsSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Filter Status:</span>
                  <select
                    value={proposalsStatusFilter}
                    onChange={(e) => setProposalsStatusFilter(e.target.value)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Viewed">Viewed</option>
                    <option value="Approved">Approved</option>
                    <option value="Changes Requested">Changes Requested</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Proposals Cards List */}
              {proposals.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <Icons.FileText className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">No Proposals Created Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click "Create New Proposal" or convert an inquiry from the Orders & Checkout Pipeline.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {proposals
                    .filter((prop) => {
                      const matchesTerm =
                        prop.id.toLowerCase().includes(proposalsSearchTerm.toLowerCase()) ||
                        prop.businessName.toLowerCase().includes(proposalsSearchTerm.toLowerCase()) ||
                        prop.clientName.toLowerCase().includes(proposalsSearchTerm.toLowerCase()) ||
                        prop.email.toLowerCase().includes(proposalsSearchTerm.toLowerCase());
                      const matchesStatus =
                        proposalsStatusFilter === 'All' || prop.status === proposalsStatusFilter;
                      return matchesTerm && matchesStatus;
                    })
                    .map((prop) => {
                      const statusColors: Record<string, string> = {
                        Draft: 'bg-slate-100 text-slate-700 border-slate-300',
                        Sent: 'bg-blue-50 text-blue-700 border-blue-200',
                        Viewed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        'Changes Requested': 'bg-amber-50 text-amber-700 border-amber-200',
                        Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
                      };

                      return (
                        <div
                          key={prop.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 block w-fit mb-1">
                                  {prop.id}
                                </span>
                                <h4 className="text-base font-extrabold text-slate-900">{prop.businessName}</h4>
                                <span className="text-xs text-slate-500 font-medium block">
                                  {prop.contactPerson || prop.clientName} • {prop.email}
                                </span>
                              </div>

                              <select
                                value={prop.status}
                                onChange={(e) => handleQuickStatusChange(prop.id, e.target.value as any)}
                                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border cursor-pointer ${
                                  statusColors[prop.status] || 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Viewed">Viewed</option>
                                <option value="Approved">Approved</option>
                                <option value="Changes Requested">Changes Requested</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {prop.selectedServices.map((srv, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200"
                                >
                                  {srv}
                                </span>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                              <div>
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Total Amount</span>
                                <span className="text-sm font-black text-indigo-600 font-mono">
                                  ₹{prop.totalAmount.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Timeline</span>
                                <span className="font-bold text-slate-700">{prop.timeline}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">
                              Created: {new Date(prop.createdAt).toLocaleDateString('en-IN')}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setProposalToConvert(prop);
                                  setAdminSubTab('contracts');
                                }}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
                                title="Convert Approved Proposal to Digital Contract"
                              >
                                <Icons.FileCheck className="w-3.5 h-3.5" />
                                <span>Create Contract</span>
                              </button>

                              <button
                                onClick={() => {
                                  setViewingProposalAdmin(prop);
                                  setShowViewModalAdmin(true);
                                }}
                                className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Preview Proposal Document"
                              >
                                <Icons.Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenEditProposalModal(prop)}
                                className="p-2 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Edit Proposal"
                              >
                                <Icons.Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDuplicateProposal(prop.id)}
                                className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Duplicate Proposal"
                              >
                                <Icons.Copy className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteProposal(prop.id)}
                                className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Delete Proposal"
                              >
                                <Icons.Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Proposal Form Modal (Create / Edit) */}
              {showProposalFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-8 overflow-hidden"
                  >
                    <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                          <Icons.FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">
                            {editingProposalId ? `Edit Proposal (${editingProposalId})` : 'Create Professional Proposal'}
                          </h3>
                          <p className="text-xs text-slate-500">Specify commercial scope, deliverables, timeline, and terms</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowProposalFormModal(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 cursor-pointer"
                      >
                        <Icons.X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProposalSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Client / Business Name *</label>
                          <input
                            type="text"
                            required
                            value={propFormBusinessName}
                            onChange={(e) => setPropFormBusinessName(e.target.value)}
                            placeholder="e.g. Aura Digital Labs"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Contact Person *</label>
                          <input
                            type="text"
                            required
                            value={propFormContactPerson}
                            onChange={(e) => setPropFormContactPerson(e.target.value)}
                            placeholder="e.g. Rajesh Kumar"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Client Email *</label>
                          <input
                            type="email"
                            required
                            value={propFormEmail}
                            onChange={(e) => setPropFormEmail(e.target.value)}
                            placeholder="client@business.com"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Phone / WhatsApp</label>
                          <input
                            type="text"
                            value={propFormPhone}
                            onChange={(e) => setPropFormPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Business Niche / Category</label>
                          <input
                            type="text"
                            value={propFormBusinessNiche}
                            onChange={(e) => setPropFormBusinessNiche(e.target.value)}
                            placeholder="e.g. E-Commerce & Fashion"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Execution Timeline</label>
                          <input
                            type="text"
                            value={propFormTimeline}
                            onChange={(e) => setPropFormTimeline(e.target.value)}
                            placeholder="e.g. 7 - 10 Business Days"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Total Quoted Amount (₹) *</label>
                          <input
                            type="number"
                            required
                            value={propFormTotalAmount}
                            onChange={(e) => setPropFormTotalAmount(Number(e.target.value))}
                            placeholder="15000"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Expiry Date</label>
                          <input
                            type="date"
                            value={propFormExpiryDate}
                            onChange={(e) => setPropFormExpiryDate(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Selected Services Multi-Checkboxes */}
                      <div className="space-y-1.5 pt-2">
                        <label className="font-extrabold text-slate-700 uppercase block">Enrolled Scope Services</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                          {services.map((srv) => {
                            const isChecked = propFormSelectedServices.includes(srv.name);
                            return (
                              <label key={srv.id} className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPropFormSelectedServices([...propFormSelectedServices, srv.name]);
                                    } else {
                                      setPropFormSelectedServices(propFormSelectedServices.filter((s) => s !== srv.name));
                                    }
                                  }}
                                  className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="truncate">{srv.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Service Deliverables Detailed Breakdown */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 uppercase">Service Deliverables Breakdown</label>
                        <textarea
                          rows={3}
                          value={propFormDeliverables}
                          onChange={(e) => setPropFormDeliverables(e.target.value)}
                          placeholder="List itemized deliverables..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono"
                        />
                      </div>

                      {/* Terms & Conditions */}
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700 uppercase">Terms & Conditions</label>
                        <textarea
                          rows={3}
                          value={propFormTerms}
                          onChange={(e) => setPropFormTerms(e.target.value)}
                          placeholder="Specify agency payment milestones and terms..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>

                      {/* Internal Notes & Initial Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Internal Admin Notes</label>
                          <input
                            type="text"
                            value={propFormInternalNotes}
                            onChange={(e) => setPropFormInternalNotes(e.target.value)}
                            placeholder="e.g. Discussed with lead on WhatsApp, approved 10% discount"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-700 uppercase">Initial Proposal Status</label>
                          <select
                            value={propFormStatus}
                            onChange={(e) => setPropFormStatus(e.target.value as any)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                          >
                            <option value="Draft">Save as Draft</option>
                            <option value="Sent">Sent (Client Visible)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowProposalFormModal(false)}
                          className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={isSavingProposal}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                        >
                          {isSavingProposal ? 'Saving Proposal...' : editingProposalId ? 'Update Proposal' : 'Issue Proposal'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* View Proposal Modal Admin */}
              {viewingProposalAdmin && (
                <ProposalViewModal
                  proposal={viewingProposalAdmin}
                  isOpen={showViewModalAdmin}
                  onClose={() => setShowViewModalAdmin(false)}
                  onUpdateProposalStatus={(updated) => {
                    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    setViewingProposalAdmin(updated);
                  }}
                  isClientView={false}
                />
              )}
            </div>
          )}

          {adminSubTab === 'contracts' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ContractsAdmin
                initialProposalToConvert={proposalToConvert}
                onClearProposalToConvert={() => setProposalToConvert(null)}
                onConvertToProject={(contract) => {
                  setContractToConvertForProject(contract);
                  setAdminSubTab('projects');
                }}
              />
            </motion.div>
          )}

          {adminSubTab === 'projects' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ProjectsAdmin
                initialContractToConvert={contractToConvertForProject}
                onClearContractToConvert={() => setContractToConvertForProject(null)}
              />
            </motion.div>
          )}

          {adminSubTab === 'messages' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ProjectCommunication
                mode="admin-hub"
                userRole="admin"
                userName="Agency Operations"
              />
            </motion.div>
          )}


          {adminSubTab === 'branding' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6 max-w-3xl mx-auto"
            >
              <div className="border-b border-slate-200 pb-4 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Icons.Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 text-base">Branding & Logo Control Desk</h3>
                  <p className="text-slate-500 text-xs">Instantly customize the agency name, logo text styling, dynamic colors, and motion animations across the entire application.</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Logo Text (First Half) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DIZO"
                      value={logoFirst}
                      onChange={(e) => setLogoFirst(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Logo Text (Second Half) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PULSE"
                      value={logoSecond}
                      onChange={(e) => setLogoSecond(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Logo Subtitle *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Digital Agency"
                      value={logoSubtitleText}
                      onChange={(e) => setLogoSubtitleText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Cyan Start Color
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={cyanStart}
                        onChange={(e) => setCyanStart(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={cyanStart}
                        onChange={(e) => setCyanStart(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Cyan End Color
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={cyanEnd}
                        onChange={(e) => setCyanEnd(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={cyanEnd}
                        onChange={(e) => setCyanEnd(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Purple Start Color
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={purpleStart}
                        onChange={(e) => setPurpleStart(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={purpleStart}
                        onChange={(e) => setPurpleStart(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Purple End Color
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={purpleEnd}
                        onChange={(e) => setPurpleEnd(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={purpleEnd}
                        onChange={(e) => setPurpleEnd(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Animation Duration Slider */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex justify-between">
                    <span>Logo Hover Animation Duration (seconds)</span>
                    <span className="text-indigo-600 font-extrabold">{logoAnimationDuration}s</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={logoAnimationDuration}
                    onChange={(e) => setLogoAnimationDuration(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                    <span>Fast (0.5s)</span>
                    <span>Slow (5.0s)</span>
                  </div>
                </div>

                {/* THEME SELECTOR ENGINE (BENTO GRID) */}
                <div className="pt-6 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icons.Palette className="w-4.5 h-4.5 text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Dynamic Theme Selector Engine</h4>
                  </div>
                  <p className="text-[11px] text-slate-500">Pick a professional preset style to instantly re-skin the page backgrounds, buttons, accents, gradients, and selection states across the entire application.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { id: 'indigo-cyber', name: '⚡ Cyber Indigo', desc: 'Cyberpunk tech style with bright cyan & deep indigo accents.', colors: ['#4f46e5', '#06b6d4', '#f8fafc'] },
                      { id: 'ocean-breeze', name: '🌊 Ocean Breeze', desc: 'Coastal calmness with teal, cyan, and fresh sky elements.', colors: ['#0d9488', '#0ea5e9', '#f0fdfa'] },
                      { id: 'sunset-gold', name: '🌅 Sunset Gold', desc: 'Warm stone grey canvas with golden amber and rose gradients.', colors: ['#e11d48', '#f59e0b', '#fafaf9'] },
                      { id: 'forest-mint', name: '🌲 Forest Mint', desc: 'Organic trust with emerald, rich green, and sage mint elements.', colors: ['#047857', '#10b981', '#f4fbf7'] },
                      { id: 'royal-purple', name: '🔮 Royal Amethyst', desc: 'Premium amethyst with majestic purple, violet, and hot pink accents.', colors: ['#9333ea', '#ec4899', '#fbf7ff'] },
                      { id: 'charcoal-luxury', name: '🏆 Charcoal Luxury', desc: 'Elite matte charcoal black dark mode with stunning gold lettering.', colors: ['#f59e0b', '#1e293b', '#020617'] },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTheme(t.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-28 ${
                          activeTheme === t.id 
                            ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">{t.name}</span>
                            {activeTheme === t.id && (
                              <Icons.Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3px]" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">{t.desc}</p>
                        </div>
                        
                        <div className="flex gap-1.5 mt-2">
                          {t.colors.map((c, idx) => (
                            <span 
                              key={idx} 
                              className="w-4 h-4 rounded-full border border-slate-300 shadow-xs inline-block" 
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* BRAND LOGO MARK & CUSTOM URL CUSTOMIZER */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Icons.Image className="w-4.5 h-4.5 text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Site Logo Mark & Icon Customizer</h4>
                  </div>
                  <p className="text-[11px] text-slate-500">Choose between multiple elegant vector mark shapes for the top header icon, or set a custom image link (PNG/SVG) to fully personalize your brand logo.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                        Header Logo Icon Mark Style
                      </label>
                      <select
                        value={logoIconType}
                        onChange={(e) => setLogoIconType(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="animated-vector">⚡ Animated Infinity-Pulse Vector (Default)</option>
                        <option value="symbol-shield">🛡️ Trust & Security Shield</option>
                        <option value="symbol-sparkles">✨ Vibrant Creative Sparkles</option>
                        <option value="symbol-crown">👑 Premium Royalty Crown</option>
                        <option value="symbol-bolt">⚡ High-Performance Lightning Zap</option>
                        <option value="text-only">📄 Clean Typography Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                        <span>Custom Logo Image</span>
                        <span className="text-[10px] text-slate-400 normal-case">(Upload PNG/SVG/JPG or enter custom URL)</span>
                      </label>
                      
                      <div className="space-y-2">
                        {/* File selector input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            id="logo-file-uploader"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              setIsUploading(true);
                              try {
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const base64String = reader.result as string;
                                  const response = await fetch('/api/upload-logo', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      imageBase64: base64String,
                                      extension: file.name.split('.').pop()
                                    })
                                  });
                                  
                                  if (response.ok) {
                                    const data = await response.json();
                                    setLogoCustomUrl(data.logoCustomUrl);
                                    setLogoIconType('symbol-shield'); // default custom-renderable preset
                                    alert('Logo image successfully uploaded! Click "Save Brand & Event Settings" below to apply.');
                                  } else {
                                    alert('Failed to upload logo image.');
                                  }
                                };
                                reader.readAsDataURL(file);
                              } catch (err: any) {
                                alert('Error uploading file: ' + err.message);
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                          />
                          <label
                            htmlFor="logo-file-uploader"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            {isUploading ? (
                              <>
                                <Icons.Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Icons.Upload className="w-3.5 h-3.5 text-slate-500" />
                                Choose Logo File
                              </>
                            )}
                          </label>

                          {logoCustomUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setLogoCustomUrl('');
                                setLogoIconType('animated-vector');
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                            >
                              Reset to Vector Preset
                            </button>
                          )}
                        </div>

                        {/* Text URL fallback Input */}
                        <input
                          type="text"
                          placeholder="Or enter image URL: https://example.com/logo.png"
                          value={logoCustomUrl}
                          onChange={(e) => setLogoCustomUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:font-normal"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-1.5"
                  >
                    <Icons.Save className="w-4 h-4" />
                    Save Brand & Theme Settings
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {adminSubTab === 'payment' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6 max-w-3xl mx-auto"
            >
              <div className="border-b border-slate-200 pb-4 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl animate-pulse">
                  <Icons.QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 text-base">Payment QR & Bank IMPS Control Desk</h3>
                  <p className="text-slate-500 text-xs">Configure multiple payment options, upload merchant QR codes, list official bank details, and edit split payment terms.</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Multiple QR Codes Manager */}
                <div className="bg-slate-100/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">1. Multiple UPI QR Codes</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">Add and upload multiple UPI QR code images (GPay, PhonePe, Paytm, etc.). Clients can select and scan them during checkout.</p>
                  </div>

                  {/* QR Code grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {paymentQRs.map((qr) => (
                      <div key={qr.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 relative group">
                        <img src={qr.imageUrl} alt={qr.label} className="w-12 h-12 rounded object-cover border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{qr.label}</p>
                          {qr.upiId && <p className="text-[10px] text-slate-400 font-mono truncate">{qr.upiId}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQR(qr.id)}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 p-1 bg-rose-50 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove QR"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {paymentQRs.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400 font-medium">No QR codes added yet. Use the fields below to add at least one.</div>
                    )}
                  </div>

                  {/* Add QR fields */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">QR Label *</label>
                      <input
                        type="text"
                        placeholder="e.g. GPay QR"
                        value={newQrLabel}
                        onChange={(e) => setNewQrLabel(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">UPI ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. support@okaxis"
                        value={newQrUpiId}
                        onChange={(e) => setNewQrUpiId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">QR Image Source</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="file"
                          accept="image/*"
                          id="qr-file-picker"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setQrUploadProgress(true);
                            try {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const base64 = reader.result as string;
                                const res = await fetch('/api/upload-image', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    imageBase64: base64,
                                    extension: file.name.split('.').pop(),
                                    prefix: 'payment-qr'
                                  })
                                });
                                if (res.ok) {
                                  const d = await res.json();
                                  setNewQrImageUrl(d.imageUrl);
                                  alert('QR Code Image uploaded successfully!');
                                } else {
                                  alert('Failed to upload QR Image.');
                                }
                              };
                              reader.readAsDataURL(file);
                            } catch (err: any) {
                              alert('Error uploading QR image: ' + err.message);
                            } finally {
                              setQrUploadProgress(false);
                            }
                          }}
                        />
                        <label
                          htmlFor="qr-file-picker"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0 border border-slate-300"
                        >
                          {qrUploadProgress ? 'Uploading...' : 'Upload Image'}
                        </label>
                        <input
                          type="text"
                          placeholder="Or image URL..."
                          value={newQrImageUrl}
                          onChange={(e) => setNewQrImageUrl(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                        />
                      </div>
                    </div>
                    <div className="col-span-full flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddQR}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Icons.Plus className="w-3.5 h-3.5" /> Add UPI QR Code
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bank Details Transfer Manager */}
                <div className="bg-slate-100/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">2. NEFT / IMPS Bank Accounts</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">Configure official bank account details so clients can do direct NEFT, IMPS or RTGS bank wire transfers.</p>
                  </div>

                  {/* Bank list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bankDetailsList.map((bank) => (
                      <div key={bank.id} className="p-3 bg-white border border-slate-200 rounded-xl relative group text-xs leading-normal">
                        <p className="font-bold text-slate-800 text-[13px] border-b border-slate-100 pb-1 mb-1.5 flex justify-between items-center">
                          <span>{bank.label}</span>
                          <span className="text-[10px] text-indigo-600 px-1.5 py-0.5 bg-indigo-50 rounded-full font-bold uppercase">{bank.bankName}</span>
                        </p>
                        <div className="space-y-0.5 text-slate-600">
                          <div>Name: <strong className="text-slate-800">{bank.accountName}</strong></div>
                          <div>A/C No: <strong className="text-slate-800 font-mono">{bank.accountNumber}</strong></div>
                          <div>IFSC: <strong className="text-slate-800 font-mono">{bank.ifscCode}</strong></div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBank(bank.id)}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 p-1 bg-rose-50 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Bank"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {bankDetailsList.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400 font-medium">No Bank accounts added yet. Use the fields below to add at least one.</div>
                    )}
                  </div>

                  {/* Add Bank Account fields */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Account Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Primary Axis Account"
                        value={newBankLabel}
                        onChange={(e) => setNewBankLabel(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Axis Bank"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Account Name</label>
                      <input
                        type="text"
                        placeholder="e.g. DIZO PULSE"
                        value={newBankAccountName}
                        onChange={(e) => setNewBankAccountName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 9230200..."
                        value={newBankAccountNumber}
                        onChange={(e) => setNewBankAccountNumber(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. UTIB0001604"
                        value={newBankIfscCode}
                        onChange={(e) => setNewBankIfscCode(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-full flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddBank}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Icons.Plus className="w-3.5 h-3.5" /> Add Bank Account
                      </button>
                    </div>
                  </div>
                </div>

                {/* Split payment manager */}
                <div className="bg-slate-100/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">3. Split Advance Contract Policy</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">Configure the percentage split and explicit instructions displayed to clients who opt for partial split contracts.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Advance Percent (%)</label>
                      <input
                        type="number"
                        min={10}
                        max={90}
                        value={splitDetails.advancePercent || 50}
                        onChange={(e) => setSplitDetails({ ...splitDetails, advancePercent: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Terms Instructions Text</label>
                      <textarea
                        rows={2}
                        value={splitDetails.instructions || ""}
                        onChange={(e) => setSplitDetails({ ...splitDetails, instructions: e.target.value })}
                        placeholder="e.g. To initiate your project contract, transfer the advance to UPI or Bank..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-1.5"
                  >
                    <Icons.Save className="w-4 h-4" />
                    Save Payment Settings
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {adminSubTab === 'pricing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ServicesCatalogAdmin
                services={servicesList}
                bundles={bundlesList}
                userRole={userRole as any}
                userName={userName || 'Admin'}
                onRefreshServices={async () => {
                  const res = await fetch('/api/services');
                  if (res.ok) setServicesList(await res.json());
                }}
                onRefreshBundles={async () => {
                  const res = await fetch('/api/bundles');
                  if (res.ok) setBundlesList(await res.json());
                }}
              />
            </motion.div>
          )}

          {/* Coupons tab disabled by user request */}
          {false && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6"
            >
              <div className="border-b border-slate-200 pb-4 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Icons.Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 text-base">Promotional Event Coupons Desk</h3>
                  <p className="text-slate-500 text-xs">Configure unique campaign event coupon codes (flat discounts or percentage promotions) to trigger custom package incentives.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Coupon Generator Form (lg:col-span-5) */}
                <form onSubmit={handleCreateCoupon} className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Icons.PlusSquare className="w-4 h-4 text-indigo-600" />
                    Forge Event Coupon Code
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Event Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FESTIVE30"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tracking-wide text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Event Promo Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Durga Puja Festival Special"
                      value={newCouponEventName}
                      onChange={(e) => setNewCouponEventName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Discount Type
                      </label>
                      <select
                        value={newCouponDiscountType}
                        onChange={(e) => setNewCouponDiscountType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Value (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newCouponDiscountValue === 0 ? '' : newCouponDiscountValue}
                        onChange={(e) => setNewCouponDiscountValue(Number(e.target.value))}
                        placeholder={newCouponDiscountType === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1 flex justify-between">
                      <span>Minimum Required Order Value</span>
                      <span className="text-slate-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={newCouponMinOrder === 0 ? '' : newCouponMinOrder}
                        onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                        placeholder="e.g. 2000"
                        className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Icons.PlusCircle className="w-4 h-4" />
                    Forge Event Coupon
                  </button>
                </form>

                {/* Coupon Codes Inventory List (lg:col-span-7) */}
                <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <Icons.Library className="w-4 h-4 text-emerald-600" />
                    Active Promo & Coupon Inventories
                  </h4>

                  {couponsList.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-medium">
                      No coupon campaigns currently established. Forge your first promo code on the left!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {couponsList.map((coupon) => (
                        <div
                          key={coupon.code}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                            coupon.active 
                              ? 'bg-emerald-50/20 border-emerald-100' 
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                                {coupon.code}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]" title={coupon.eventName}>
                                {coupon.eventName}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-2.5 text-[10px] text-slate-400 font-bold">
                              <span>
                                Discount: {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `Flat ₹${coupon.discountValue} Off`}
                              </span>
                              <span>•</span>
                              <span>
                                Min Booking: ₹{coupon.minOrderValue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Toggle active status */}
                            <button
                              onClick={() => handleToggleCouponActive(coupon.code, coupon.active)}
                              className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase border cursor-pointer transition-all ${
                                coupon.active
                                  ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              }`}
                            >
                              {coupon.active ? 'Active' : 'Disabled'}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteCoupon(coupon.code)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Icons.Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {adminSubTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6"
            >
              {/* Header */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Icons.Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-base">Registered Client Directory</h3>
                    <p className="text-slate-500 text-xs">Track registered clients, their account credentials, sign-up timelines, and total ordered service pipelines.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                    Total Clients: <span className="text-indigo-600 font-extrabold">{registeredUsers.length}</span>
                  </span>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                <Icons.Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search registered clients by name, email, or WhatsApp..."
                  value={usersSearchTerm}
                  onChange={(e) => setUsersSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
                />
                {usersSearchTerm && (
                  <button
                    onClick={() => setUsersSearchTerm('')}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Users List */}
              {isUsersLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Icons.Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs text-slate-400 font-medium">Loading registered client profiles...</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Client Profile</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Contact Channels</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Timeline / Status</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Ordered Scope</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filtered = registeredUsers.filter(u => {
                            const term = usersSearchTerm.toLowerCase();
                            return (
                              (u.name || '').toLowerCase().includes(term) ||
                              (u.email || '').toLowerCase().includes(term) ||
                              (u.whatsapp || '').toLowerCase().includes(term)
                            );
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                                  No registered clients match your search criteria.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((user) => {
                            const userLeads = inquiries.filter(
                              (inq) => (inq.email || '').trim().toLowerCase() === (user.email || '').trim().toLowerCase()
                            );
                            const totalValue = userLeads.reduce((sum, current) => sum + (current.totalDiscounted || 0), 0);

                            return (
                              <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white flex items-center justify-center font-extrabold text-xs shadow-xs uppercase">
                                      {user.name ? user.name.slice(0, 2) : 'CL'}
                                    </div>
                                    <div>
                                      <h4 className="font-extrabold text-slate-900 text-xs">{user.name}</h4>
                                      <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                      <Icons.MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                                      {user.whatsapp || 'No WhatsApp provided'}
                                    </div>
                                    {user.whatsapp && (
                                      <a
                                        href={`https://wa.me/${user.whatsapp.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[9px] text-emerald-600 hover:text-emerald-700 font-black uppercase tracking-wider flex items-center gap-0.5"
                                      >
                                        Ping Client
                                        <Icons.ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-500">
                                      Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      }) : 'N/A'}
                                    </span>
                                    <div className="text-[9px] text-slate-400">
                                      {user.createdAt ? new Date(user.createdAt).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : ''}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-extrabold text-slate-800">
                                      {userLeads.length} Order(s)
                                    </span>
                                    <div className="text-[10px] text-indigo-600 font-mono font-bold">
                                      ₹{totalValue.toLocaleString('en-IN')} pipeline
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer inline-flex"
                                    title="Delete Client Account"
                                  >
                                    <Icons.UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {adminSubTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <BusinessIntelligenceDashboard
                inquiries={inquiries}
                proposals={proposals}
                contracts={contracts}
                projects={projects}
                staffList={staffList}
                servicesList={servicesList}
                userRole={userRole}
                userName={userName}
                onRefresh={fetchAllAgencyData}
              />
            </motion.div>
          )}

          {adminSubTab === 'staff' && (
            <StaffManagement currentAdminRole={userRole} currentUserEmail={userEmail} />
          )}

          {adminSubTab === 'assets' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <AssetLibrary
                projectId="agency-global-assets"
                projectName="Agency Deliverables & Brand Media Library"
                isAdmin={true}
                uploadedByDefault={userName || 'Agency Operations'}
              />
            </motion.div>
          )}

          {adminSubTab === 'clients' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <ClientsCrmAdmin
                inquiries={inquiries}
                proposals={proposals}
                contracts={contracts}
                projects={projects}
                conversations={conversations}
                staffList={staffList}
                userRole={userRole}
                userName={userName}
                onRefresh={fetchAllAgencyData}
                onNavigateToTab={(tab) => setAdminSubTab(tab as any)}
              />
            </motion.div>
          )}

          {adminSubTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SystemSettingsAdmin
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
                onSettingsUpdated={(updated) => {
                  setSettings(updated);
                  fetchAllAgencyData();
                }}
              />
            </motion.div>
          )}

          {adminSubTab === 'website_content' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <WebsiteContentManager
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
              />
            </motion.div>
          )}

          {adminSubTab === 'seo' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SeoAdmin
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
                services={services}
              />
            </motion.div>
          )}

          {adminSubTab === 'integrations' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <IntegrationsAdmin
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
              />
            </motion.div>
          )}

          {adminSubTab === 'audit_logs' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <AuditLogsAdmin
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
              />
            </motion.div>
          )}

          {adminSubTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SecurityAdmin
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
              />
            </motion.div>
          )}
          </main>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Icons.Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Change Workspace Password</h3>
                    <p className="text-xs text-slate-500 font-medium">{userEmail || 'Update account credentials'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordModalError('');
                    setPasswordModalSuccess('');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 4 chars)"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {passwordModalError && (
                  <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Icons.AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{passwordModalError}</span>
                  </div>
                )}

                {passwordModalSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Icons.CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{passwordModalSuccess}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setPasswordModalError('');
                      setPasswordModalSuccess('');
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-100 disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
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
