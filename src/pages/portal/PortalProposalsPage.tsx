import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Proposal } from '../../types';
import ProposalViewModal from '../../components/ProposalViewModal';

interface PortalProposalsPageProps {
  navigate: (path: string) => void;
  proposalId?: string;
}

export const PortalProposalsPage: React.FC<PortalProposalsPageProps> = ({ navigate, proposalId: propProposalId }) => {
  const { currentUser } = useAuth();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, [currentUser?.email]);

  useEffect(() => {
    if (propProposalId && proposals.length > 0) {
      const found = proposals.find((p) => p.id === propProposalId);
      if (found) {
        setSelectedProposal(found);
        setModalOpen(true);
      }
    }
  }, [propProposalId, proposals]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const email = currentUser?.email;
      const res = await fetch(email ? `/api/proposals?email=${encodeURIComponent(email)}` : '/api/proposals');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setProposals(data);
          if (propProposalId) {
            const found = data.find((p: Proposal) => p.id === propProposalId);
            if (found) {
              setSelectedProposal(found);
              setModalOpen(true);
            }
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
    const sample: Proposal = {
      id: 'PROP-1001',
      inquiryId: 'ORD-1092',
      clientName: currentUser?.name || 'Valued Client',
      contactPerson: currentUser?.name || 'Valued Client',
      email: currentUser?.email || 'client@business.com',
      phone: currentUser?.whatsapp || '+91 98765 43210',
      businessName: currentUser?.company || 'Aura Digital Labs',
      businessNiche: currentUser?.industry || 'E-Commerce & Retail',
      selectedServices: ['Logo & Brand Identity Pack', 'High-Converting Landing Page', 'Viral Reels Growth Pack'],
      deliverables: '1. Custom Vector Logo Suite (Main, Stacked, Favicon)\n2. High-Converting Landing Page with responsive mobile design\n3. 15 High-Retention Instagram Reels Batch',
      timeline: '7 - 10 Business Days',
      totalAmount: 22400,
      termsAndConditions: '1. 50% advance to initiate project execution.\n2. Up to 2 rounds of revisions included per deliverable.\n3. Final source files handover upon settlement.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Sent'
    };
    setProposals([sample]);
    if (propProposalId === 'PROP-1001') {
      setSelectedProposal(sample);
      setModalOpen(true);
    }
  };

  const handleUpdateProposal = (updated: Proposal) => {
    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProposal(updated);
  };

  const handleOpenProposal = (prop: Proposal) => {
    setSelectedProposal(prop);
    setModalOpen(true);
    window.history.pushState({}, '', `/portal/proposals/${prop.id}`);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    window.history.pushState({}, '', '/portal/proposals');
  };

  const filteredProposals = proposals.filter((p) => {
    if (filter === 'pending') return p.status === 'Sent' || p.status === 'Viewed' || p.status === 'Changes Requested';
    if (filter === 'approved') return p.status === 'Approved';
    return true;
  });

  return (
    <div className="space-y-8" id="portal-proposals-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Proposals & Estimates
            </h1>
            <span className="px-2.5 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-black uppercase tracking-wider rounded-full">
              {filteredProposals.length} Total
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Review detailed service proposals, deliverables scope, investment terms, and digitally sign-off on quotes.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({proposals.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'pending' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'approved' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Proposals Grid */}
      {filteredProposals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProposals.map((proposal) => {
            const isApproved = proposal.status === 'Approved';
            const isPending = proposal.status === 'Sent' || proposal.status === 'Viewed' || proposal.status === 'Changes Requested';

            return (
              <div
                key={proposal.id}
                className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-6 space-y-5 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Metas */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 text-cyan-400 text-xs font-mono font-bold rounded-lg">
                        {proposal.id}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Issued: {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        isApproved
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isPending
                          ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isApproved && <Icons.CheckCircle2 className="w-3 h-3" />}
                      {proposal.status}
                    </span>
                  </div>

                  {/* Business & Services */}
                  <div>
                    <h3 className="text-base font-black text-white">
                      {proposal.businessName || 'Digital Transformation Proposal'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {proposal.selectedServices?.length || 0} Service Packages Included
                    </p>
                  </div>

                  {/* Services Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proposal.selectedServices?.slice(0, 3).map((srv, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-medium rounded-lg"
                      >
                        {srv}
                      </span>
                    ))}
                    {(proposal.selectedServices?.length || 0) > 3 && (
                      <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-500 text-[11px] rounded-lg">
                        +{proposal.selectedServices.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Timeline & Price Bar */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Investment</span>
                      <span className="text-lg font-black text-white font-mono">
                        ₹{proposal.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Timeline</span>
                      <span className="text-xs font-bold text-cyan-400">{proposal.timeline || '7-10 Business Days'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-400">
                    Expires: {new Date(proposal.expiryDate).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => handleOpenProposal(proposal)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/40"
                  >
                    <span>Inspect Proposal</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Icons.FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Proposals Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no proposals matching your filter selection.
          </p>
        </div>
      )}

      {/* Proposal Detail View Modal */}
      {selectedProposal && (
        <ProposalViewModal
          proposal={selectedProposal}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onUpdateProposalStatus={handleUpdateProposal}
          isClientView={true}
        />
      )}
    </div>
  );
};
export default PortalProposalsPage;
