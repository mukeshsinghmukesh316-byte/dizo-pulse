import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import { Proposal, Inquiry } from '../../types';
import ProposalViewModal from '../../components/ProposalViewModal';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '../../components/UIPolish';

interface AdminProposalsPageProps {
  navigate: (path: string) => void;
  proposalIdParam?: string;
}

export const AdminProposalsPage: React.FC<AdminProposalsPageProps> = ({
  navigate,
  proposalIdParam,
}) => {
  const { adminUser } = useAdminAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Preview & Modal states
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);

  // Form Fields
  const [inquiryId, setInquiryId] = useState('');
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessNiche, setBusinessNiche] = useState('General Growth');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState('');
  const [timeline, setTimeline] = useState('7 - 10 Business Days');
  const [totalAmount, setTotalAmount] = useState<number>(15000);
  const [terms, setTerms] = useState(
    '1. Payment Schedule: 50% advance upon proposal approval to initiate project, 50% upon final deliverable review prior to source code/asset release.\n2. Revisions: Up to 2 rounds of revisions included per deliverable package.\n3. Intellectual Property: Full ownership transfers upon final payment settlement.'
  );
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [internalNotes, setInternalNotes] = useState('');
  const [status, setStatus] = useState<Proposal['status']>('Sent');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/proposals');
      if (res.ok) {
        const data = await res.json();
        setProposals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Handle URL parameters for direct view or action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const inqId = params.get('inquiryId');

    if (action === 'new-proposal') {
      if (inqId) {
        // Fetch inquiry details to prefill
        fetch(`/api/inquiries/${inqId}`)
          .then(r => r.ok ? r.json() : null)
          .then(inq => {
            if (inq) {
              handleOpenNewProposalModalWithInquiry(inq);
            } else {
              handleOpenNewProposalModal();
            }
          })
          .catch(() => handleOpenNewProposalModal());
      } else {
        handleOpenNewProposalModal();
      }
    }

    if (proposalIdParam && proposals.length > 0) {
      const match = proposals.find(p => p.id === proposalIdParam);
      if (match) {
        setViewingProposal(match);
        setShowViewModal(true);
      }
    }
  }, [proposalIdParam, proposals.length]);

  const handleOpenNewProposalModal = () => {
    setEditingProposalId(null);
    setInquiryId('');
    setClientName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setBusinessName('');
    setBusinessNiche('General Growth');
    setSelectedServices([]);
    setDeliverables('• Custom Vector Logo Suite (Main, Stacked, Icon variants)\n• High-Converting Mobile-Optimized Website\n• 15 Custom High-Retention Instagram Reels');
    setTimeline('7 - 10 Business Days');
    setTotalAmount(15000);
    setTerms(
      '1. Payment Schedule: 50% advance upon proposal approval to initiate project, 50% upon final deliverable review prior to source code/asset release.\n2. Revisions: Up to 2 rounds of revisions included per deliverable package.\n3. Intellectual Property: Full ownership transfers upon final payment settlement.'
    );
    setExpiryDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setInternalNotes('');
    setStatus('Sent');
    setShowFormModal(true);
  };

  const handleOpenNewProposalModalWithInquiry = (inq: Inquiry) => {
    setEditingProposalId(null);
    setInquiryId(inq.id);
    setClientName(inq.clientName);
    setContactPerson(inq.clientName);
    setEmail(inq.email);
    setPhone(inq.whatsapp);
    setBusinessName(inq.businessName);
    setBusinessNiche(inq.businessNiche || 'General Growth');
    setSelectedServices(inq.services || []);
    setDeliverables(`• Services: ${(inq.services || []).join(', ')}\n• Full Agency Support Package\n• Scope: ${inq.message || 'Standard Client Campaign'}`);
    setTimeline('7 - 10 Business Days');
    setTotalAmount(inq.totalDiscounted || inq.totalOriginal || 15000);
    setTerms(
      '1. Payment Schedule: 50% advance upon proposal approval to initiate project, 50% upon final deliverable review prior to source code/asset release.\n2. Revisions: Up to 2 rounds of revisions included per deliverable package.\n3. Intellectual Property: Full ownership transfers upon final payment settlement.'
    );
    setExpiryDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setInternalNotes(`Converted from Inquiry ID ${inq.id}`);
    setStatus('Sent');
    setShowFormModal(true);
  };

  const handleOpenEditProposalModal = (prop: Proposal) => {
    setEditingProposalId(prop.id);
    setInquiryId(prop.inquiryId || '');
    setClientName(prop.clientName);
    setContactPerson(prop.contactPerson || prop.clientName);
    setEmail(prop.email);
    setPhone(prop.phone || '');
    setBusinessName(prop.businessName);
    setBusinessNiche(prop.businessNiche || 'General Growth');
    setSelectedServices(prop.selectedServices || []);
    setDeliverables(prop.deliverables || '');
    setTimeline(prop.timeline || '7 - 10 Business Days');
    setTotalAmount(prop.totalAmount || 0);
    setTerms(prop.termsAndConditions || '');
    setExpiryDate(prop.expiryDate ? prop.expiryDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setInternalNotes(prop.internalNotes || '');
    setStatus(prop.status);
    setShowFormModal(true);
  };

  const handleSaveProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !email) {
      showToast('Validation Error', 'Business Name and Email are required', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        inquiryId,
        clientName: clientName || businessName,
        contactPerson: contactPerson || clientName || businessName,
        email: email.trim().toLowerCase(),
        phone,
        businessName,
        businessNiche,
        selectedServices,
        deliverables,
        timeline,
        totalAmount: Number(totalAmount),
        termsAndConditions: terms,
        expiryDate: new Date(expiryDate).toISOString(),
        internalNotes,
        status,
      };

      const url = editingProposalId ? `/api/proposals/${editingProposalId}` : '/api/proposals';
      const method = editingProposalId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Proposal Saved', `Proposal ${editingProposalId ? 'updated' : 'created'} successfully!`, 'success');
        setShowFormModal(false);
        await fetchProposals();
      } else {
        showToast('Save Failed', 'Server error while saving proposal', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/proposals/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        showToast('Proposal Duplicated', 'Duplicated proposal successfully.', 'success');
        await fetchProposals();
      }
    } catch (e: any) {
      showToast('Duplication Failed', e.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete proposal ${id}?`)) return;
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Proposal Deleted', `Proposal ${id} deleted.`, 'success');
        await fetchProposals();
      }
    } catch (e: any) {
      showToast('Delete Failed', e.message, 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Proposal['status']) => {
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast('Status Updated', `Status changed to ${newStatus}`, 'success');
        await fetchProposals();
      }
    } catch (e: any) {
      showToast('Update Failed', e.message, 'error');
    }
  };

  // Filtered list
  const filteredProposals = proposals.filter(p => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalValue = proposals.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const acceptedCount = proposals.filter(p => p.status === 'Approved').length;

  return (
    <AdminLayout
      activeTab="proposals"
      currentPath="/admin/proposals"
      navigate={navigate}
      requiredModule="proposals"
      pageTitle="Proposal Management"
      contextualActions={{
        onRefreshData: fetchProposals,
        onNewProposal: handleOpenNewProposalModal,
      }}
    >
      {/* Header & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Proposals</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Icons.FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">{proposals.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Commercial scope drafts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pipeline Valuation</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Icons.TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">₹{totalValue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Quoted project value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Accepted Deals</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Icons.CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-2">{acceptedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {proposals.length ? Math.round((acceptedCount / proposals.length) * 100) : 0}% win rate
          </div>
        </div>
      </div>

      {/* Action & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search proposals by business, client, or ID..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-bold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Viewed">Viewed</option>
            <option value="Approved">Approved</option>
            <option value="Changes Requested">Changes Requested</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            onClick={handleOpenNewProposalModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Create Proposal</span>
          </button>
        </div>
      </div>

      {/* Proposals Grid */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading proposal drafts...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Icons.FileText className="w-12 h-12 text-slate-700 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Proposals Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'All'
              ? 'No proposals matched your current filter criteria.'
              : 'Create your first commercial proposal to send to prospective clients.'}
          </p>
          <button
            onClick={handleOpenNewProposalModal}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl mt-2 cursor-pointer"
          >
            Create Proposal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProposals.map(prop => {
            const statusBadgeClasses: Record<string, string> = {
              Draft: 'bg-slate-800 text-slate-300 border-slate-700',
              Sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              Viewed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
              Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              'Changes Requested': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            };

            return (
              <div
                key={prop.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold rounded-md inline-block mb-1">
                        {prop.id}
                      </span>
                      <h4 className="text-base font-black text-white">{prop.businessName}</h4>
                      <p className="text-xs text-slate-400">
                        {prop.contactPerson || prop.clientName} • {prop.email}
                      </p>
                    </div>

                    <select
                      value={prop.status}
                      onChange={e => handleStatusChange(prop.id, e.target.value as any)}
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border cursor-pointer ${
                        statusBadgeClasses[prop.status] || 'bg-slate-800 text-slate-300'
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

                  {prop.selectedServices && prop.selectedServices.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {prop.selectedServices.map((srv, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-950 text-slate-300 text-[10px] font-semibold rounded-md border border-slate-800"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Quoted Valuation</span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        ₹{prop.totalAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Timeline</span>
                      <span className="text-xs font-bold text-slate-300">{prop.timeline || '7-10 Days'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">
                    Created {new Date(prop.createdAt).toLocaleDateString('en-IN')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {prop.status === 'Approved' && (
                      <button
                        onClick={() => navigate(`/admin/contracts?action=new-contract&proposalId=${prop.id}`)}
                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-lg transition-colors border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
                        title="Generate Legal Contract"
                      >
                        <Icons.FileCheck className="w-3.5 h-3.5" />
                        <span>Contract</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setViewingProposal(prop);
                        setShowViewModal(true);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors cursor-pointer"
                      title="Preview Document"
                    >
                      <Icons.Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditProposalModal(prop)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors cursor-pointer"
                      title="Edit Proposal"
                    >
                      <Icons.Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(prop.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors cursor-pointer"
                      title="Duplicate"
                    >
                      <Icons.Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(prop.id)}
                      className="p-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
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

      {/* Document View Modal */}
      {showViewModal && viewingProposal && (
        <ProposalViewModal
          proposal={viewingProposal}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingProposal(null);
          }}
          onUpdateProposalStatus={(updated) => {
            setProposals(prev => prev.map(p => p.id === updated.id ? updated : p));
          }}
          isClientView={false}
        />
      )}

      {/* Create / Edit Proposal Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Icons.FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {editingProposalId ? `Edit Proposal (${editingProposalId})` : 'Create Commercial Proposal'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configure deliverables, pricing, timeline, and terms</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProposalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Business / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Digital Corp"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Client Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="client@apex.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Quoted Valuation (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={totalAmount}
                    onChange={e => setTotalAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Execution Timeline
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={e => setTimeline(e.target.value)}
                    placeholder="e.g. 7-10 Business Days"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Proposal Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Deliverables Package Specifications
                </label>
                <textarea
                  rows={3}
                  value={deliverables}
                  onChange={e => setDeliverables(e.target.value)}
                  placeholder="Bullet-point list of deliverables included in this proposal..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Commercial Terms & Payment Milestone Conditions
                </label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Proposal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProposalsPage;
