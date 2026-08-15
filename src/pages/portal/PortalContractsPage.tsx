import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Contract } from '../../types';
import ContractViewModal from '../../components/ContractViewModal';

interface PortalContractsPageProps {
  navigate: (path: string) => void;
  contractId?: string;
}

export const PortalContractsPage: React.FC<PortalContractsPageProps> = ({ navigate, contractId: propContractId }) => {
  const { currentUser } = useAuth();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, [currentUser?.email]);

  useEffect(() => {
    if (propContractId && contracts.length > 0) {
      const found = contracts.find((c) => c.id === propContractId);
      if (found) {
        setSelectedContract(found);
        setModalOpen(true);
      }
    }
  }, [propContractId, contracts]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const email = currentUser?.email;
      const res = await fetch(email ? `/api/contracts?email=${encodeURIComponent(email)}` : '/api/contracts');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setContracts(data);
          if (propContractId) {
            const found = data.find((c: Contract) => c.id === propContractId);
            if (found) {
              setSelectedContract(found);
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
    const sample: Contract = {
      id: 'CTR-1001',
      proposalId: 'PROP-1001',
      clientName: currentUser?.name || 'Valued Client',
      contactPerson: currentUser?.name || 'Valued Client',
      email: currentUser?.email || 'client@business.com',
      phone: currentUser?.whatsapp || '+91 98765 43210',
      businessName: currentUser?.company || 'Aura Digital Labs',
      businessNiche: currentUser?.industry || 'E-Commerce & Retail',
      projectName: `${currentUser?.company || 'Aura Digital Labs'} - Growth Services Agreement`,
      projectDescription: 'Official agreement for digital branding, platform development, and performance growth execution.',
      selectedServices: ['Logo & Brand Identity Pack', 'High-Converting Landing Page', 'Viral Reels Growth Pack'],
      deliverables: '1. Custom Vector Logo Suite\n2. High-Converting Mobile-Optimized Website\n3. 15 High-Retention Instagram Reels Batch',
      timeline: '7 - 10 Business Days',
      revisionTerms: 'Up to 2 rounds of design & development revisions included per service deliverable.',
      clientResponsibilities: '1. Provide brand assets and design inputs in a timely manner.\n2. Review and approve milestone deliverables.',
      agencyResponsibilities: '1. Deliver high-quality work aligned with agreed project scope and timelines.\n2. Maintain strict confidentiality of client assets.',
      confidentialityTerms: 'Both parties agree to treat all business data as strictly confidential.',
      cancellationTerms: 'Either party may terminate with 7 days written notice.',
      generalTerms: 'Governed by applicable business and digital service execution guidelines.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Awaiting Approval',
      activityHistory: [
        {
          id: 'act-1',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'Contract Generated and Dispatched for Client Review',
          user: 'Legal Operations',
          role: 'admin'
        }
      ]
    };
    setContracts([sample]);
    if (propContractId === 'CTR-1001') {
      setSelectedContract(sample);
      setModalOpen(true);
    }
  };

  const handleUpdateContract = (updated: Contract) => {
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedContract(updated);
  };

  const handleOpenContract = (c: Contract) => {
    setSelectedContract(c);
    setModalOpen(true);
    window.history.pushState({}, '', `/portal/contracts/${c.id}`);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    window.history.pushState({}, '', '/portal/contracts');
  };

  const filteredContracts = contracts.filter((c) => {
    if (filter === 'pending') return c.status === 'Awaiting Approval' || c.status === 'Sent' || c.status === 'Viewed' || c.status === 'Changes Requested';
    if (filter === 'approved') return c.status === 'Approved';
    return true;
  });

  return (
    <div className="space-y-8" id="portal-contracts-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Legal Contracts & Service Agreements
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-full">
              {filteredContracts.length} Total
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Review contractual terms, legal scope boundaries, and digitally execute your master service agreements.
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
            All ({contracts.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'pending' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Awaiting Approval
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

      {/* Contracts Grid */}
      {filteredContracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContracts.map((contract) => {
            const isApproved = contract.status === 'Approved';
            const isPending = contract.status === 'Awaiting Approval' || contract.status === 'Sent' || contract.status === 'Viewed' || contract.status === 'Changes Requested';

            return (
              <div
                key={contract.id}
                className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-6 space-y-5 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Metas */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono font-bold rounded-lg">
                        {contract.id}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Issued: {new Date(contract.createdAt).toLocaleDateString()}
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
                      {contract.status}
                    </span>
                  </div>

                  {/* Project Agreement Name */}
                  <div>
                    <h3 className="text-base font-black text-white">{contract.projectName}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {contract.projectDescription}
                    </p>
                  </div>

                  {/* Contract Clauses Summary */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">Associated Proposal</span>
                      <button
                        onClick={() => navigate(`/portal/proposals/${contract.proposalId || 'PROP-1001'}`)}
                        className="text-cyan-400 hover:underline font-mono font-bold"
                      >
                        {contract.proposalId || 'PROP-1001'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">Service Timeline</span>
                      <span className="text-white font-bold">{contract.timeline || '7-10 Days'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">Revision Scope</span>
                      <span className="text-emerald-400 font-bold">2 Full Revision Cycles</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-400">
                    Expires: {new Date(contract.expiryDate).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => handleOpenContract(contract)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                  >
                    <span>Inspect Agreement</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Icons.FileCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Contracts Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no legal contracts matching your filter selection.
          </p>
        </div>
      )}

      {/* Contract Detail View Modal */}
      {selectedContract && (
        <ContractViewModal
          contract={selectedContract}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onUpdateContract={handleUpdateContract}
          isClientView={true}
          clientUser={{ name: currentUser?.name, email: currentUser?.email }}
        />
      )}
    </div>
  );
};
export default PortalContractsPage;
