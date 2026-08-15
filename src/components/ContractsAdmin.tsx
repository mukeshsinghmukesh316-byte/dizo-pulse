import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Contract, Proposal } from '../types';
import ContractViewModal from './ContractViewModal';

interface ContractsAdminProps {
  initialProposalToConvert?: Proposal | null;
  onClearProposalToConvert?: () => void;
  onConvertToProject?: (contract: Contract) => void;
}

export default function ContractsAdmin({
  initialProposalToConvert,
  onClearProposalToConvert,
  onConvertToProject
}: ContractsAdminProps) {

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    proposalId: string;
    clientName: string;
    contactPerson: string;
    email: string;
    phone: string;
    businessName: string;
    businessNiche: string;
    projectName: string;
    projectDescription: string;
    selectedServices: string[];
    deliverables: string;
    timeline: string;
    revisionTerms: string;
    clientResponsibilities: string;
    agencyResponsibilities: string;
    confidentialityTerms: string;
    cancellationTerms: string;
    generalTerms: string;
    expiryDate: string;
    internalNotes: string;
    status: Contract['status'];
  }>({
    proposalId: '',
    clientName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessName: '',
    businessNiche: '',
    projectName: '',
    projectDescription: '',
    selectedServices: [],
    deliverables: '',
    timeline: '7 - 10 Business Days',
    revisionTerms: 'Up to 2 rounds of design & development revisions are included per service deliverable. Major scope changes beyond agreed deliverables will be quoted separately as an addendum.',
    clientResponsibilities: '1. Provide required brand assets, copy, logos, and access credentials in a timely manner.\n2. Provide constructive feedback within 48-72 hours during review phases.\n3. Fulfill agreed payment milestones promptly.',
    agencyResponsibilities: '1. Deliver high-quality work aligned with agreed project scope and timelines.\n2. Maintain strict confidentiality of client assets, credentials, and proprietary business information.\n3. Provide regular progress updates and milestone reports during execution.',
    confidentialityTerms: 'Both parties agree to treat all business information, trade secrets, software code, strategy briefs, and communications exchanged during this agreement as strictly confidential for a period of 3 years.',
    cancellationTerms: 'Either party may terminate this agreement with 7 days written notice. Payment for all completed deliverables and work-in-progress up to the notice date will remain due and payable.',
    generalTerms: 'This contract constitutes the entire agreement between Dizo Pulse and the Client. Any modifications must be made in writing and agreed by both parties. Governed by applicable business & digital service laws.',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    internalNotes: '',
    status: 'Draft',
  });

  const availableServicesList = [
    'Web Development',
    'SEO & Organic Growth',
    'Social Media Management',
    'Brand Identity & Logo',
    'UI/UX Design',
    'Performance Ads',
    'WhatsApp Automation',
    'Content Marketing',
  ];

  // Load Contracts
  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contracts');
      if (res.ok) {
        const data = await res.json();
        setContracts(data);
        localStorage.setItem('dizopulse_contracts', JSON.stringify(data));
      } else {
        throw new Error('Server returned non-ok');
      }
    } catch (e) {
      console.warn('Fallback to local storage for contracts');
      const cached = localStorage.getItem('dizopulse_contracts');
      if (cached) {
        try {
          setContracts(JSON.parse(cached));
        } catch (err) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Handle conversion if proposalToConvert was passed
  useEffect(() => {
    if (initialProposalToConvert) {
      populateFormFromProposal(initialProposalToConvert);
      setShowFormModal(true);
    }
  }, [initialProposalToConvert]);

  const populateFormFromProposal = (proposal: Proposal) => {
    setFormData({
      proposalId: proposal.id,
      clientName: proposal.contactPerson || proposal.clientName,
      contactPerson: proposal.contactPerson || proposal.clientName,
      email: proposal.email,
      phone: proposal.phone || '',
      businessName: proposal.clientName,
      businessNiche: proposal.businessNiche || 'General',
      projectName: `${proposal.clientName} - Digital Growth Contract`,
      projectDescription: `Digital services and growth execution agreement converted from proposal ${proposal.id}.`,
      selectedServices: proposal.selectedServices || [],
      deliverables: proposal.deliverables || '',
      timeline: proposal.timeline || '7 - 10 Business Days',
      revisionTerms: 'Up to 2 rounds of design & development revisions included per service. Additions beyond scope will be quoted separately.',
      clientResponsibilities: '1. Provide required brand assets, access credentials, and feedback promptly.\n2. Review and approve project milestones.',
      agencyResponsibilities: '1. Execute deliverables according to agreed technical specifications and quality standards.\n2. Provide regular project progress updates.',
      confidentialityTerms: 'All business strategy, assets, and project credentials remain confidential between Dizo Pulse and the Client.',
      cancellationTerms: 'Either party may terminate with 7 days written notice. Completed work up to notice remains payable.',
      generalTerms: 'This contract constitutes the full digital execution agreement between Dizo Pulse and the Client.',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      internalNotes: `Converted from approved proposal ${proposal.id}`,
      status: 'Draft',
    });
    setEditingContract(null);
  };

  const handleOpenNewModal = () => {
    setEditingContract(null);
    setFormData({
      proposalId: '',
      clientName: '',
      contactPerson: '',
      email: '',
      phone: '',
      businessName: '',
      businessNiche: '',
      projectName: '',
      projectDescription: '',
      selectedServices: [],
      deliverables: '',
      timeline: '7 - 10 Business Days',
      revisionTerms: 'Up to 2 rounds of design & development revisions are included per service deliverable. Major scope changes beyond agreed deliverables will be quoted separately as an addendum.',
      clientResponsibilities: '1. Provide required brand assets, copy, logos, and access credentials in a timely manner.\n2. Provide constructive feedback within 48-72 hours during review phases.\n3. Fulfill agreed payment milestones promptly.',
      agencyResponsibilities: '1. Deliver high-quality work aligned with agreed project scope and timelines.\n2. Maintain strict confidentiality of client assets, credentials, and proprietary business information.\n3. Provide regular progress updates and milestone reports during execution.',
      confidentialityTerms: 'Both parties agree to treat all business information, trade secrets, software code, strategy briefs, and communications exchanged during this agreement as strictly confidential for a period of 3 years.',
      cancellationTerms: 'Either party may terminate this agreement with 7 days written notice. Payment for all completed deliverables and work-in-progress up to the notice date will remain due and payable.',
      generalTerms: 'This contract constitutes the entire agreement between Dizo Pulse and the Client. Any modifications must be made in writing and agreed by both parties. Governed by applicable business & digital service laws.',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      internalNotes: '',
      status: 'Draft',
    });
    setShowFormModal(true);
  };

  const handleEditContract = (c: Contract) => {
    setEditingContract(c);
    setFormData({
      proposalId: c.proposalId || '',
      clientName: c.clientName,
      contactPerson: c.contactPerson || c.clientName,
      email: c.email,
      phone: c.phone || '',
      businessName: c.businessName,
      businessNiche: c.businessNiche || '',
      projectName: c.projectName,
      projectDescription: c.projectDescription,
      selectedServices: c.selectedServices || [],
      deliverables: c.deliverables,
      timeline: c.timeline,
      revisionTerms: c.revisionTerms,
      clientResponsibilities: c.clientResponsibilities,
      agencyResponsibilities: c.agencyResponsibilities,
      confidentialityTerms: c.confidentialityTerms,
      cancellationTerms: c.cancellationTerms,
      generalTerms: c.generalTerms,
      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '',
      internalNotes: c.internalNotes || '',
      status: c.status,
    });
    setShowFormModal(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContract) {
        // PATCH
        const res = await fetch(`/api/contracts/${editingContract.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchContracts();
          setShowFormModal(false);
        } else {
          alert('Failed to update contract');
        }
      } else {
        // POST
        const res = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchContracts();
          setShowFormModal(false);
          if (onClearProposalToConvert) onClearProposalToConvert();
        } else {
          alert('Failed to create contract');
        }
      }
    } catch (err: any) {
      alert('Error saving contract: ' + err.message);
    }
  };

  const handleDuplicateContract = async (id: string) => {
    if (!confirm('Duplicate this contract?')) return;
    try {
      const res = await fetch(`/api/contracts/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        await fetchContracts();
      } else {
        alert('Failed to duplicate contract');
      }
    } catch (e: any) {
      alert('Error duplicating contract: ' + e.message);
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return;
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContracts((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert('Failed to delete contract');
      }
    } catch (e: any) {
      alert('Error deleting contract: ' + e.message);
    }
  };

  const handleQuickStatusChange = async (c: Contract, newStatus: Contract['status']) => {
    try {
      const res = await fetch(`/api/contracts/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchContracts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.projectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleServiceInForm = (service: string) => {
    setFormData((prev) => {
      const exists = prev.selectedServices.includes(service);
      if (exists) {
        return { ...prev, selectedServices: prev.selectedServices.filter((s) => s !== service) };
      } else {
        return { ...prev, selectedServices: [...prev.selectedServices, service] };
      }
    });
  };

  const statusBadgeStyles: Record<string, { bg: string; text: string; border: string }> = {
    Draft: { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' },
    Sent: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    Viewed: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    'Awaiting Approval': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    Approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    'Changes Requested': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    Rejected: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    Expired: { bg: 'bg-slate-700/50', text: 'text-slate-400', border: 'border-slate-700' },
    Archived: { bg: 'bg-slate-900', text: 'text-slate-500', border: 'border-slate-800' },
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Icons.FileCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black text-white">Digital Contracts & Agreements</h2>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full font-mono border border-indigo-500/20">
              {contracts.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Manage client agreements, digital approvals, legal terms & activity history.</p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-950/50 transition-all cursor-pointer flex items-center gap-2"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, business name, email or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['All', 'Draft', 'Sent', 'Viewed', 'Approved', 'Changes Requested', 'Rejected', 'Expired'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table / Card List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          <Icons.Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          <span>Loading contracts...</span>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
          <Icons.FileX className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No Contracts Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'All'
              ? 'Try adjusting your search query or status filter.'
              : 'Create your first digital contract or convert an approved proposal into an agreement.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredContracts.map((c) => {
            const badge = statusBadgeStyles[c.status] || statusBadgeStyles['Draft'];

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all space-y-3"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                      {c.id}
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{c.businessName}</h3>
                      <p className="text-xs text-slate-400">{c.projectName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {c.status}
                    </span>

                    {/* Quick status dropdown for admin */}
                    <select
                      value={c.status}
                      onChange={(e) => handleQuickStatusChange(c, e.target.value as Contract['status'])}
                      className="bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Viewed">Viewed</option>
                      <option value="Awaiting Approval">Awaiting Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Changes Requested">Changes Requested</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact</span>
                    <span className="text-slate-300 font-semibold">{c.contactPerson || c.clientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Email</span>
                    <span className="text-slate-300 font-mono text-[11px]">{c.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Created On</span>
                    <span className="text-slate-300 font-mono">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Proposal Link</span>
                    <span className="text-indigo-400 font-mono font-bold">{c.proposalId || 'Direct'}</span>
                  </div>
                </div>

                {/* Actions bar */}
                <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-800/60">
                  {c.status === 'Approved' && onConvertToProject && (
                    <button
                      onClick={() => onConvertToProject(c)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
                      title="Create Live Execution Project from Approved Contract"
                    >
                      <Icons.Kanban className="w-3.5 h-3.5" />
                      <span>Create Project</span>
                    </button>
                  )}

                  <button
                    onClick={() => setViewingContract(c)}

                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Icons.Eye className="w-3.5 h-3.5" />
                    <span>View Contract</span>
                  </button>

                  <button
                    onClick={() => handleEditContract(c)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Icons.Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDuplicateContract(c.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Icons.Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    onClick={() => handleDeleteContract(c.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                    title="Delete Contract"
                  >
                    <Icons.Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Contract Create/Edit Modal Form */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <Icons.FileCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-black text-white">
                    {editingContract ? `Edit Contract (${editingContract.id})` : 'Create Digital Contract'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveForm} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
                
                {/* Party Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Client & Business Info</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Business / Client Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="e.g. Apex Retail Private Limited"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Contact Person *</label>
                      <input
                        type="text"
                        required
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rahul@apexretail.com"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Phone / WhatsApp</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Business Niche / Category</label>
                      <input
                        type="text"
                        value={formData.businessNiche}
                        onChange={(e) => setFormData({ ...formData, businessNiche: e.target.value })}
                        placeholder="e.g. E-commerce / Healthcare"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Linked Proposal ID (Optional)</label>
                      <input
                        type="text"
                        value={formData.proposalId}
                        onChange={(e) => setFormData({ ...formData, proposalId: e.target.value })}
                        placeholder="e.g. PROP-1002"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Scope of Work */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Project Scope & Deliverables</h4>
                  
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Project Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      placeholder="e.g. Complete E-commerce Redesign & SEO Execution Contract"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Project Overview / Description</label>
                    <textarea
                      rows={2}
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                      placeholder="Brief description of the execution scope..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Selected Services */}
                  <div>
                    <label className="text-slate-400 font-bold block mb-1.5">Enrolled Services</label>
                    <div className="flex flex-wrap gap-2">
                      {availableServicesList.map((service) => {
                        const isSelected = formData.selectedServices.includes(service);
                        return (
                          <button
                            key={service}
                            type="button"
                            onClick={() => toggleServiceInForm(service)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {service}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Itemized Deliverables */}
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Itemized Deliverables</label>
                    <textarea
                      rows={3}
                      value={formData.deliverables}
                      onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                      placeholder="1. Custom Next.js storefront with payment gateway&#10;2. On-page SEO setup&#10;3. WhatsApp notification workflow..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Project Timeline</label>
                      <input
                        type="text"
                        value={formData.timeline}
                        onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                        placeholder="e.g. 7 - 10 Business Days"
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Agreement Expiry Date</label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Responsibilities & Terms */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Responsibilities & Legal Clauses</h4>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Agency Responsibilities</label>
                    <textarea
                      rows={3}
                      value={formData.agencyResponsibilities}
                      onChange={(e) => setFormData({ ...formData, agencyResponsibilities: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Client Responsibilities</label>
                    <textarea
                      rows={3}
                      value={formData.clientResponsibilities}
                      onChange={(e) => setFormData({ ...formData, clientResponsibilities: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Revision Policy</label>
                    <textarea
                      rows={2}
                      value={formData.revisionTerms}
                      onChange={(e) => setFormData({ ...formData, revisionTerms: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Confidentiality Clause</label>
                    <textarea
                      rows={2}
                      value={formData.confidentialityTerms}
                      onChange={(e) => setFormData({ ...formData, confidentialityTerms: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Cancellation & Termination Terms</label>
                    <textarea
                      rows={2}
                      value={formData.cancellationTerms}
                      onChange={(e) => setFormData({ ...formData, cancellationTerms: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">General Terms & Governing Laws</label>
                    <textarea
                      rows={2}
                      value={formData.generalTerms}
                      onChange={(e) => setFormData({ ...formData, generalTerms: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Status & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Contract Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Contract['status'] })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Viewed">Viewed</option>
                      <option value="Awaiting Approval">Awaiting Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Changes Requested">Changes Requested</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Internal Admin Notes</label>
                    <input
                      type="text"
                      value={formData.internalNotes}
                      onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                      placeholder="Notes visible only to agency team..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-950/50 cursor-pointer"
                  >
                    {editingContract ? 'Save Changes' : 'Create Contract'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contract Viewer Modal */}
      {viewingContract && (
        <ContractViewModal
          contract={viewingContract}
          isOpen={!!viewingContract}
          onClose={() => setViewingContract(null)}
          onUpdateContract={(updated) => {
            setViewingContract(updated);
            fetchContracts();
          }}
          isClientView={false}
        />
      )}
    </div>
  );
}
