import React, { useState, useEffect, useMemo } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import { Proposal, Inquiry } from '../../types';
import ProposalViewModal from '../../components/ProposalViewModal';
import ProposalBuilderWizard from '../../components/ProposalBuilderWizard';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '../../components/UIPolish';
import { AdminDataTable, ColumnDef } from '../../components/AdminDataTable';

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
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [inquiryForProposal, setInquiryForProposal] = useState<Inquiry | null>(null);

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
    setEditingProposal(null);
    setInquiryForProposal(null);
    setShowFormModal(true);
  };

  const handleOpenNewProposalModalWithInquiry = (inq: Inquiry) => {
    setEditingProposal(null);
    setInquiryForProposal(inq);
    setShowFormModal(true);
  };

  const handleOpenEditProposalModal = (prop: Proposal) => {
    setEditingProposal(prop);
    setInquiryForProposal(null);
    setShowFormModal(true);
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

  const statusBadgeClasses: Record<string, string> = {
    Draft: 'bg-slate-800 text-slate-300 border-slate-700',
    Sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Viewed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Changes Requested': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const proposalColumns: ColumnDef<Proposal>[] = useMemo(() => [
    {
      id: 'id',
      header: 'ID',
      accessorKey: 'id',
      sortable: true,
      cell: (p) => (
        <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          {p.id}
        </span>
      )
    },
    {
      id: 'business',
      header: 'Business & Client',
      accessorKey: 'businessName',
      sortable: true,
      cell: (p) => (
        <div>
          <div className="font-bold text-white text-xs">{p.businessName}</div>
          <div className="text-[11px] text-slate-400">{p.contactPerson || p.clientName} • {p.email}</div>
        </div>
      )
    },
    {
      id: 'services',
      header: 'Services',
      cell: (p) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {p.selectedServices && p.selectedServices.length > 0 ? (
            p.selectedServices.slice(0, 2).map((srv, idx) => (
              <span key={idx} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700 truncate max-w-[120px]">
                {srv}
              </span>
            ))
          ) : (
            <span className="text-slate-500 text-[11px]">—</span>
          )}
          {p.selectedServices && p.selectedServices.length > 2 && (
            <span className="text-[10px] text-slate-400 font-bold">+{p.selectedServices.length - 2}</span>
          )}
        </div>
      )
    },
    {
      id: 'amount',
      header: 'Quoted Value',
      accessorKey: 'totalAmount',
      sortable: true,
      cell: (p) => (
        <span className="font-black text-emerald-400 font-mono text-xs">
          ₹{p.totalAmount?.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      id: 'timeline',
      header: 'Timeline',
      accessorKey: 'timeline',
      cell: (p) => <span className="text-slate-300 text-xs">{p.timeline || '7-10 Days'}</span>
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (p) => (
        <select
          value={p.status}
          onChange={(e) => handleStatusChange(p.id, e.target.value as any)}
          onClick={(e) => e.stopPropagation()}
          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border cursor-pointer ${
            statusBadgeClasses[p.status] || 'bg-slate-800 text-slate-300'
          }`}
        >
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Viewed">Viewed</option>
          <option value="Approved">Approved</option>
          <option value="Changes Requested">Changes Requested</option>
          <option value="Rejected">Rejected</option>
        </select>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {p.status === 'Approved' && (
            <button
              onClick={() => navigate(`/admin/contracts?action=new-contract&proposalId=${p.id}`)}
              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-lg transition-colors border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
              title="Generate Legal Contract"
            >
              <Icons.FileCheck className="w-3.5 h-3.5" />
              <span>Contract</span>
            </button>
          )}
          <button
            onClick={() => {
              setViewingProposal(p);
              setShowViewModal(true);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors cursor-pointer"
            title="Preview Document"
          >
            <Icons.Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEditProposalModal(p)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors cursor-pointer"
            title="Edit Proposal"
          >
            <Icons.Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDuplicate(p.id)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors cursor-pointer"
            title="Duplicate"
          >
            <Icons.Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(p.id)}
            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
            title="Delete"
          >
            <Icons.Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ], []);

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

      {/* Standardized AdminDataTable */}
      <AdminDataTable<Proposal>
        data={filteredProposals}
        columns={proposalColumns}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        searchable={false}
        selectable={false}
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50]}
        defaultViewMode="cards"
        allowViewToggle={true}
        tableMinWidth="min-w-[850px]"
        emptyTitle="No Proposals Found"
        emptyDescription={
          searchTerm || statusFilter !== 'All'
            ? 'No proposals matched your current filter criteria.'
            : 'Create your first commercial proposal to send to prospective clients.'
        }
        emptyIcon={Icons.FileText}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search proposals by business, client, or ID..."
                className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-bold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
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
        }
        actionsSlot={
          <button
            onClick={handleOpenNewProposalModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Create Proposal</span>
          </button>
        }
        renderCard={(prop) => (
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
        )}
      />

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

      {/* 3-Step Proposal Builder Wizard */}
      {showFormModal && (
        <ProposalBuilderWizard
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingProposal(null);
            setInquiryForProposal(null);
          }}
          initialProposal={editingProposal}
          initialInquiry={inquiryForProposal}
          editingProposalId={editingProposal?.id || null}
          onSaveSuccess={(saved) => {
            fetchProposals();
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminProposalsPage;
