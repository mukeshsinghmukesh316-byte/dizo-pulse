import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Contract, ContractActivity, ContractApprovalRecord } from '../types';
import DigitalSignatureCanvas from './DigitalSignatureCanvas';

interface ContractViewModalProps {
  contract: Contract;
  isOpen: boolean;
  onClose: () => void;
  onUpdateContract?: (updated: Contract) => void;
  isClientView?: boolean;
  clientUser?: { name?: string; email?: string };
}

export default function ContractViewModal({
  contract,
  isOpen,
  onClose,
  onUpdateContract,
  isClientView = false,
  clientUser,
}: ContractViewModalProps) {
  const [currentContract, setCurrentContract] = useState<Contract>(contract);

  // Modals for Client Action
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [changesNotes, setChangesNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentContract(contract);
  }, [contract]);

  // Automatically mark as "Viewed" when client opens a "Sent" contract
  useEffect(() => {
    if (isOpen && currentContract.status === 'Sent' && isClientView) {
      handleStatusUpdate('Viewed', undefined, 'Client opened and viewed contract document');
    }
  }, [isOpen, currentContract.id, currentContract.status, isClientView]);

  if (!isOpen) return null;

  const handlePrintPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      window.print();
      setIsExportingPdf(false);
    }, 400);
  };

  const handleStatusUpdate = async (
    newStatus: Contract['status'],
    approvalNotes?: string,
    activityActionNote?: string,
    signatureData?: string,
    signeeName?: string,
    signeeTitle?: string
  ) => {
    setIsSubmittingAction(true);
    try {
      const nowIso = new Date().toISOString();
      const resolvedClientName = signeeName || clientUser?.name || currentContract.contactPerson || currentContract.clientName || 'Client';
      const clientEmail = clientUser?.email || currentContract.email || '';

      let approvalRecord: ContractApprovalRecord | undefined = currentContract.approvalRecord;

      if (['Approved', 'Changes Requested', 'Rejected'].includes(newStatus)) {
        approvalRecord = {
          clientName: resolvedClientName,
          email: clientEmail,
          status: newStatus as any,
          timestamp: nowIso,
          method: 'In-Portal Digital E-Signature',
          notes: approvalNotes || (newStatus === 'Approved' ? 'Digital agreement executed & verified via Client Portal' : ''),
          signatureData: signatureData || currentContract.approvalRecord?.signatureData,
          signeeTitle: signeeTitle || 'Authorized Signatory',
        };
      }

      const activityEntry: Partial<ContractActivity> = {
        timestamp: nowIso,
        action: newStatus === 'Approved'
          ? 'Contract Digitally Executed & Approved'
          : newStatus === 'Changes Requested'
          ? 'Changes Requested'
          : newStatus === 'Rejected'
          ? 'Contract Rejected'
          : newStatus === 'Viewed'
          ? 'Contract Viewed'
          : `Status changed to ${newStatus}`,
        user: isClientView ? resolvedClientName : 'Admin',
        role: isClientView ? 'client' : 'admin',
        notes: activityActionNote || approvalNotes || `Status updated to ${newStatus}`,
      };

      const payload = {
        status: newStatus,
        approvalRecord,
        activityEntry,
        updatedByUser: isClientView ? resolvedClientName : 'Admin',
        updatedByRole: isClientView ? 'client' : 'admin',
      };

      const res = await fetch(`/api/contracts/${currentContract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated: Contract = await res.json();
        setCurrentContract(updated);
        if (onUpdateContract) {
          onUpdateContract(updated);
        }

        // Local storage cache sync
        const local = localStorage.getItem('dizopulse_contracts');
        if (local) {
          try {
            const list: Contract[] = JSON.parse(local);
            const idx = list.findIndex((c) => c.id === updated.id);
            if (idx !== -1) {
              list[idx] = updated;
              localStorage.setItem('dizopulse_contracts', JSON.stringify(list));
            }
          } catch (e) {}
        }

        if (newStatus === 'Approved') {
          setActionSuccessMessage('Contract digitally signed and approved! Agreement is now legally active.');
        } else if (newStatus === 'Changes Requested') {
          setActionSuccessMessage('Your change requests have been submitted to the agency team.');
        } else if (newStatus === 'Rejected') {
          setActionSuccessMessage('Contract status updated to Rejected.');
        }
      } else {
        // Fallback local update if offline/mock server
        const updatedFallback: Contract = {
          ...currentContract,
          status: newStatus,
          approvalRecord,
          activityHistory: [
            ...(currentContract.activityHistory || []),
            {
              id: 'act-' + Date.now(),
              timestamp: nowIso,
              action: newStatus === 'Approved' ? 'Contract Digitally Executed & Approved' : `Status: ${newStatus}`,
              user: resolvedClientName,
              role: isClientView ? 'client' : 'admin',
              notes: activityActionNote || approvalNotes || `Status updated to ${newStatus}`,
            },
          ],
        };
        setCurrentContract(updatedFallback);
        if (onUpdateContract) {
          onUpdateContract(updatedFallback);
        }
        if (newStatus === 'Approved') {
          setActionSuccessMessage('Contract digitally signed and approved! Agreement is now legally active.');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating contract: ' + err.message);
    } finally {
      setIsSubmittingAction(false);
      setShowChangesModal(false);
      setShowRejectModal(false);
    }
  };

  const statusBadgeStyles: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    Draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: Icons.FileEdit },
    Sent: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Icons.Send },
    Viewed: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Icons.Eye },
    'Awaiting Approval': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Icons.Clock },
    Approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Icons.CheckCircle2 },
    'Changes Requested': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Icons.AlertCircle },
    Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Icons.XCircle },
    Expired: { bg: 'bg-slate-200', text: 'text-slate-600', border: 'border-slate-300', icon: Icons.Clock },
    Archived: { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', icon: Icons.Archive },
  };

  const currentBadge = statusBadgeStyles[currentContract.status] || statusBadgeStyles['Draft'];
  const StatusIcon = currentBadge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col my-auto overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white print:text-slate-900"
      >
        {/* Document Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shrink-0">
              <Icons.FileCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {currentContract.id}
                </span>
                {currentContract.proposalId && (
                  <span className="font-mono font-bold text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Proposal: {currentContract.proposalId}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-black text-white mt-0.5 line-clamp-1">{currentContract.projectName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrintPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Print or Export Contract as PDF"
            >
              {isExportingPdf ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Icons.Printer className="w-4 h-4 text-indigo-400" />
                  <span>Print / PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Success Alert Banner */}
        {actionSuccessMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-4 flex justify-between items-center text-emerald-300 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Icons.CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="p-1 hover:bg-emerald-500/20 rounded cursor-pointer"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Contract Document Content */}
        <div className="p-4 sm:p-6 md:p-10 overflow-y-auto space-y-8 flex-1 text-slate-300 text-xs leading-relaxed print:p-0 print:text-slate-900 max-w-full">
          
          {/* SECTION 1: Agreement Header & Branding */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden space-y-6 print:bg-none print:border-b-2 print:border-slate-900 print:rounded-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl text-white tracking-wider">DIZO <span className="text-cyan-400">PULSE</span></span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                    Digital Agency
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Design • Create • Grow Services Agreement</p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <div className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{currentContract.status}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Issue Date: {new Date(currentContract.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block">Contract Document ID</span>
                <span className="text-lg font-mono font-black text-white">{currentContract.id}</span>
              </div>
              {currentContract.proposalId && (
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block">Linked Proposal Reference</span>
                  <span className="text-lg font-mono font-bold text-slate-300">{currentContract.proposalId}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 1: Agreement Overview & Preamble */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">1.</span>
              <span>Agreement Overview</span>
            </h3>
            <p className="text-slate-300 font-normal">
              This Digital Services Agreement ("Agreement") is executed on{' '}
              <strong className="text-white">{new Date(currentContract.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> by and between{' '}
              <strong className="text-indigo-400">Dizo Pulse Digital Agency</strong> ("Agency") and{' '}
              <strong className="text-white">{currentContract.businessName}</strong> ("Client"). This Agreement governs the digital scope, deliverables, responsibilities, and terms outlined below.
            </p>
          </div>

          {/* SECTION 2: Client & Party Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">2.</span>
              <span>Client & Party Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Client / Business Name</span>
                <span className="text-xs font-extrabold text-white">{currentContract.businessName}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Authorized Contact Person</span>
                <span className="text-xs font-extrabold text-slate-200">{currentContract.contactPerson || currentContract.clientName}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Official Email</span>
                <span className="text-xs font-mono font-bold text-slate-300">{currentContract.email}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Phone / WhatsApp</span>
                <span className="text-xs font-mono font-bold text-slate-300">{currentContract.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Industry / Business Niche</span>
                <span className="text-xs font-bold text-slate-300">{currentContract.businessNiche}</span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Agreement Expiry Date</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {new Date(currentContract.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Scope of Work */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">3.</span>
              <span>Scope of Work</span>
            </h3>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1">
              <h4 className="text-xs font-extrabold text-white">{currentContract.projectName}</h4>
              <p className="text-slate-300 whitespace-pre-line">{currentContract.projectDescription}</p>
            </div>
          </div>

          {/* SECTION 4: Services & Itemized Deliverables */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">4.</span>
              <span>Enrolled Services & Deliverables</span>
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {currentContract.selectedServices.map((srv, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold rounded-xl"
                >
                  {srv}
                </span>
              ))}
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
              {currentContract.deliverables || 'Itemized service deliverables as agreed in commercial scope.'}
            </div>
          </div>

          {/* SECTION 5: Project Execution Timeline */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">5.</span>
              <span>Project Execution Timeline</span>
            </h3>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
              <Icons.Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Agreed Turnaround Period</span>
                <span className="text-xs font-extrabold text-white">{currentContract.timeline}</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: Agency Responsibilities */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">6.</span>
              <span>Agency Responsibilities</span>
            </h3>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-slate-300 whitespace-pre-line">
              {currentContract.agencyResponsibilities}
            </div>
          </div>

          {/* SECTION 7: Client Responsibilities */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">7.</span>
              <span>Client Responsibilities</span>
            </h3>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-slate-300 whitespace-pre-line">
              {currentContract.clientResponsibilities}
            </div>
          </div>

          {/* SECTION 8: Revision Policy */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">8.</span>
              <span>Revision Policy</span>
            </h3>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-slate-300 whitespace-pre-line">
              {currentContract.revisionTerms}
            </div>
          </div>

          {/* SECTION 9: Confidentiality Terms */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">9.</span>
              <span>Confidentiality & Non-Disclosure</span>
            </h3>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-slate-300 whitespace-pre-line">
              {currentContract.confidentialityTerms}
            </div>
          </div>

          {/* SECTION 10: Cancellation / Termination Terms */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">10.</span>
              <span>Cancellation & Termination</span>
            </h3>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-slate-300 whitespace-pre-line">
              {currentContract.cancellationTerms}
            </div>
          </div>

          {/* SECTION 11: General Terms & Conditions */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">11.</span>
              <span>General Terms & Conditions</span>
            </h3>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-slate-300 whitespace-pre-line">
              {currentContract.generalTerms}
            </div>
          </div>

          {/* SECTION 12: Approval Record & In-Portal Digital Authorization */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg">12.</span>
              <span>Digital E-Signature & Agreement Execution</span>
            </h3>

            {currentContract.approvalRecord && currentContract.status === 'Approved' ? (
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                    <Icons.ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>Digitally Executed & Legally Verified Agreement</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono text-[10px] font-extrabold uppercase">
                    Status: Approved & Active
                  </span>
                </div>

                {/* Render Recorded Signature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Client Digital Signature
                    </span>
                    <div className="h-24 sm:h-28 flex items-center justify-center bg-slate-900/50 rounded-xl p-2 border border-slate-800/60">
                      {currentContract.approvalRecord.signatureData ? (
                        <img
                          src={currentContract.approvalRecord.signatureData}
                          alt="Digital Signature"
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                        />
                      ) : (
                        <span className="font-serif italic text-xl text-cyan-400 font-bold">
                          {currentContract.approvalRecord.clientName}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono text-center border-t border-slate-800/80 pt-1.5">
                      Digitally signed by {currentContract.approvalRecord.clientName}
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs bg-slate-950/90 p-4 rounded-2xl border border-slate-800 flex flex-col justify-center">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Authorized Signatory</span>
                      <span className="font-bold text-white text-sm">{currentContract.approvalRecord.clientName}</span>
                      <span className="text-[11px] text-indigo-400 block font-medium">
                        {currentContract.approvalRecord.signeeTitle || 'Authorized Signatory'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Email Address</span>
                        <span className="font-mono text-slate-300">{currentContract.approvalRecord.email}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Timestamp</span>
                        <span className="font-mono text-slate-300">
                          {new Date(currentContract.approvalRecord.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5 text-[10px] text-emerald-400/90 flex items-center gap-1 font-semibold">
                      <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{currentContract.approvalRecord.method}</span>
                    </div>
                  </div>
                </div>

                {currentContract.approvalRecord.notes && (
                  <div className="text-xs bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-300">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">Execution Note</span>
                    <span>{currentContract.approvalRecord.notes}</span>
                  </div>
                )}
              </div>
            ) : isClientView ? (
              <div className="space-y-4">
                {/* Responsive Signature Pad */}
                <DigitalSignatureCanvas
                  clientName={clientUser?.name || currentContract.contactPerson || currentContract.clientName || 'Valued Client'}
                  businessName={currentContract.businessName || 'Your Business'}
                  onSign={async (sigData, signeeName, signeeTitle) => {
                    await handleStatusUpdate('Approved', 'Digital agreement signed & executed in client portal', 'Contract Approved via Digital Signature', sigData, signeeName, signeeTitle);
                  }}
                  isSubmitting={isSubmittingAction}
                />

                {/* Alternate Secondary Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <span className="text-xs text-slate-400 font-medium">Need contract scope revisions or modifications?</span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowChangesModal(true)}
                      disabled={isSubmittingAction}
                      className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Icons.AlertCircle className="w-3.5 h-3.5" />
                      <span>Request Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      disabled={isSubmittingAction}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Icons.XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Pending client digital verification & signature execution.</span>
                <span className="text-slate-200 font-mono font-bold">{currentContract.status}</span>
              </div>
            )}
          </div>

          {/* Activity Log / History Trail */}
          {currentContract.activityHistory && currentContract.activityHistory.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Icons.History className="w-4 h-4 text-indigo-400" />
                <span>Contract Audit & Activity History</span>
              </h3>

              <div className="space-y-2">
                {currentContract.activityHistory.map((act) => (
                  <div key={act.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px]">
                    <div>
                      <span className="font-extrabold text-white">{act.action}</span>
                      {act.notes && <span className="text-slate-400 block text-[10px] mt-0.5">{act.notes}</span>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-slate-400 text-[10px]">
                        {new Date(act.timestamp).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-400 block">
                        {act.user} ({act.role})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </motion.div>

      {/* Request Changes Modal */}
      <AnimatePresence>
        {showChangesModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Icons.AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>Request Contract Changes</span>
                </h3>
                <button onClick={() => setShowChangesModal(false)} className="text-slate-400 hover:text-white">
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-slate-300 font-bold block">Specify required changes or additions:</label>
                <textarea
                  rows={4}
                  value={changesNotes}
                  onChange={(e) => setChangesNotes(e.target.value)}
                  placeholder="e.g. Please update turnaround timeline to 5 days, or modify deliverable 2..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowChangesModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate('Changes Requested', changesNotes, changesNotes)}
                  disabled={!changesNotes.trim() || isSubmittingAction}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Submit Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Contract Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Icons.XCircle className="w-5 h-5 text-rose-400" />
                  <span>Reject Contract</span>
                </h3>
                <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-white">
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-slate-300 font-bold block">Reason for rejection (Optional):</label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Terms do not align with our internal policy..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate('Rejected', rejectReason, rejectReason)}
                  disabled={isSubmittingAction}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
