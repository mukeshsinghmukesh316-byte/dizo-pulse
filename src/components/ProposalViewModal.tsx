import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Proposal } from '../types';

interface ProposalViewModalProps {
  proposal: Proposal;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProposalStatus?: (updated: Proposal) => void;
  isClientView?: boolean;
}

export default function ProposalViewModal({
  proposal,
  isOpen,
  onClose,
  onUpdateProposalStatus,
  isClientView = false,
}: ProposalViewModalProps) {
  const [currentProposal, setCurrentProposal] = useState<Proposal>(proposal);
  
  // Modals for Client Action
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  const [changesNotes, setChangesNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentProposal(proposal);
  }, [proposal]);

  // Mark as "Viewed" automatically when client opens a "Sent" proposal
  useEffect(() => {
    if (isOpen && currentProposal.status === 'Sent' && isClientView) {
      handleStatusUpdate('Viewed');
    }
  }, [isOpen, currentProposal.id, currentProposal.status, isClientView]);

  if (!isOpen) return null;

  const handleStatusUpdate = async (
    newStatus: Proposal['status'],
    note?: string
  ) => {
    setIsSubmittingAction(true);
    try {
      const payload: Partial<Proposal> = {
        status: newStatus,
        clientResponseNote: note !== undefined ? note : currentProposal.clientResponseNote,
        approvalDate: newStatus === 'Approved' ? new Date().toISOString() : currentProposal.approvalDate,
      };

      const res = await fetch(`/api/proposals/${currentProposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentProposal(updated);
        if (onUpdateProposalStatus) {
          onUpdateProposalStatus(updated);
        }

        // Also update local storage cache fallback
        const local = localStorage.getItem('dizopulse_proposals');
        if (local) {
          try {
            const list: Proposal[] = JSON.parse(local);
            const idx = list.findIndex((p) => p.id === updated.id);
            if (idx !== -1) {
              list[idx] = updated;
              localStorage.setItem('dizopulse_proposals', JSON.stringify(list));
            }
          } catch (e) {}
        }

        if (newStatus === 'Approved') {
          setActionSuccessMessage('Proposal approved successfully! Thank you for partnering with Dizo Pulse.');
        } else if (newStatus === 'Changes Requested') {
          setActionSuccessMessage('Your change requests have been sent to our agency team.');
        } else if (newStatus === 'Rejected') {
          setActionSuccessMessage('Proposal status updated to Rejected.');
        }
      } else {
        alert('Failed to update proposal status on server.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating proposal: ' + err.message);
    } finally {
      setIsSubmittingAction(false);
      setShowChangesModal(false);
      setShowRejectModal(false);
    }
  };

  const getStatusBadge = (status: Proposal['status']) => {
    switch (status) {
      case 'Approved':
        return { label: 'Approved', color: 'bg-emerald-950 text-emerald-400 border-emerald-800', icon: Icons.CheckCircle2 };
      case 'Changes Requested':
        return { label: 'Changes Requested', color: 'bg-amber-950 text-amber-400 border-amber-800', icon: Icons.AlertCircle };
      case 'Rejected':
        return { label: 'Rejected', color: 'bg-rose-950 text-rose-400 border-rose-800', icon: Icons.XCircle };
      case 'Viewed':
        return { label: 'Viewed by Client', color: 'bg-cyan-950 text-cyan-400 border-cyan-800', icon: Icons.Eye };
      case 'Sent':
        return { label: 'Proposal Sent', color: 'bg-indigo-950 text-indigo-400 border-indigo-800', icon: Icons.Send };
      default:
        return { label: 'Draft', color: 'bg-slate-800 text-slate-400 border-slate-700', icon: Icons.FileText };
    }
  };

  const statusInfo = getStatusBadge(currentProposal.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl text-white overflow-hidden relative print:border-none print:shadow-none print:bg-white print:text-black"
      >
        {/* Floating Actions Bar (Header) */}
        <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-900">
              {currentProposal.id}
            </span>
            <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-xl border flex items-center gap-1.5 ${statusInfo.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Icons.Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Success Alert Notification */}
        {actionSuccessMessage && (
          <div className="m-6 p-4 bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-2xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <Icons.CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-400 hover:text-white cursor-pointer"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* DOCUMENT BODY CONTENT */}
        <div className="p-6 md:p-10 space-y-8 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          
          {/* HEADER BRANDING */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-800 pb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center font-black text-white text-base">
                  D
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                    DIZO PULSE <span className="text-cyan-400 font-light">DIGITAL</span>
                  </h1>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Official Growth Proposal</p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Proposal Reference</span>
              <p className="text-lg font-mono font-black text-white">{currentProposal.id}</p>
              <p className="text-xs text-slate-400">
                Created: <strong className="text-slate-200">{new Date(currentProposal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
              </p>
              <p className="text-xs text-amber-400 font-semibold">
                Valid Until: {new Date(currentProposal.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* SECTION 1: CLIENT INFORMATION */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Icons.UserCheck className="w-4 h-4" />
              1. Client & Business Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block">Business / Brand</span>
                <span className="text-sm font-extrabold text-white block mt-0.5">{currentProposal.businessName}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block">Contact Person</span>
                <span className="text-xs font-bold text-slate-200 block mt-0.5">{currentProposal.contactPerson || currentProposal.clientName}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block">Business Industry / Niche</span>
                <span className="text-xs font-bold text-slate-200 block mt-0.5">{currentProposal.businessNiche || 'General E-Commerce & Growth'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block">Email Address</span>
                <span className="text-xs font-mono text-slate-300 block mt-0.5">{currentProposal.email}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block">WhatsApp / Phone</span>
                <span className="text-xs font-mono text-slate-300 block mt-0.5">{currentProposal.phone}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block">Assigned Account Desk</span>
                <span className="text-xs font-bold text-indigo-300 block mt-0.5">Dizo Pulse Executive Board</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: PROJECT OVERVIEW */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Icons.Target className="w-4 h-4" />
              2. Project Overview & Scope Alignment
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
              This proposal outlines the scoped strategy, branding assets, digital content deliverables, and execution roadmap curated specifically for <strong className="text-white">{currentProposal.businessName}</strong>. Our aim is to amplify brand positioning, streamline customer acquisition, and scale market reach using Dizo Pulse's creative and tech growth infrastructure.
            </p>
          </div>

          {/* SECTION 3: SELECTED SERVICES */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Icons.Boxes className="w-4 h-4" />
              3. Enrolled Services & Core Components
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentProposal.selectedServices.map((srv, idx) => (
                <div key={idx} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-xs">
                      0{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">{srv.replace(/-/g, ' ')}</h4>
                      <p className="text-[10px] text-slate-400">Professional Scoped Package</p>
                    </div>
                  </div>
                  <Icons.CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: DELIVERABLES */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Icons.PackageCheck className="w-4 h-4" />
              4. Key Deliverables & Output Specifications
            </h3>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
              {currentProposal.deliverables || (
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>Custom Vector Logo Suite (Main, Stacked, Icon variants with typography kit)</li>
                  <li>High-Converting Mobile-Optimized Web / Landing Page Source & Deployment</li>
                  <li>15 Custom High-Retention Instagram Reels + Creative Copywriting Briefs</li>
                  <li>Google Business Profile Local SEO Setup & Review Growth Engine</li>
                  <li>Dedicated Account Manager Support & Master Asset ZIP Handover</li>
                </ul>
              )}
            </div>
          </div>

          {/* SECTION 5: PROJECT TIMELINE */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Icons.CalendarClock className="w-4 h-4" />
              5. Estimated Project Execution Timeline
            </h3>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Turnaround Time</span>
                <span className="text-base font-black text-white mt-0.5 block">{currentProposal.timeline || '7 - 10 Business Days'}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Kick-off Schedule</span>
                <span className="text-xs font-bold text-emerald-400 mt-0.5 block">Within 24 Hours of Approval</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: COMMERCIAL SUMMARY */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Icons.Receipt className="w-4 h-4" />
              6. Commercial Investment Summary
            </h3>

            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800">
                <span className="text-slate-400 font-semibold">Subtotal (Package Quoted Services)</span>
                <span className="font-mono font-bold text-white">₹{currentProposal.totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-800">
                <span className="text-slate-400 font-semibold">Agency Taxes / GST (Included)</span>
                <span className="font-mono text-slate-400">18% Inclusive</span>
              </div>

              <div className="flex justify-between items-center text-base pt-1">
                <span className="font-black uppercase tracking-wider text-white">Total Investment Required</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">₹{currentProposal.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* SECTION 7: TERMS & CONDITIONS */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Icons.FileCheck className="w-4 h-4" />
              7. Standard Terms & Conditions
            </h3>

            <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-2 leading-relaxed">
              {currentProposal.termsAndConditions ? (
                <p className="whitespace-pre-line">{currentProposal.termsAndConditions}</p>
              ) : (
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Payment Schedule: 50% advance upon proposal approval to initiate project, 50% upon final deliverable review prior to master file release.</li>
                  <li>Revisions: Up to 2 rounds of design revisions included per deliverable package.</li>
                  <li>Intellectual Property: Full ownership of final approved designs and code source files transfers to client upon final payment settlement.</li>
                  <li>Proposal Validity: Rates and timelines guaranteed through the specified expiration date.</li>
                </ol>
              )}
            </div>
          </div>

          {/* SECTION 8: APPROVAL & CLIENT ACTION SECTION */}
          <div className="bg-slate-900/90 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 pt-6 print:border-t">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Icons.CheckSquare className="w-4 h-4" />
              8. Client Authorization & Status
            </h3>

            {/* Current Response State Banner */}
            {currentProposal.status === 'Approved' && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-400">
                  <Icons.CheckCircle2 className="w-5 h-5" />
                  Proposal Approved & Confirmed
                </div>
                <p className="text-[11px] text-emerald-400/90">
                  Approved on: <strong>{currentProposal.approvalDate ? new Date(currentProposal.approvalDate).toLocaleString('en-IN') : 'Confirmed'}</strong>
                </p>
                {currentProposal.clientResponseNote && (
                  <p className="text-[11px] text-slate-300 pt-1 italic">
                    Client Note: "{currentProposal.clientResponseNote}"
                  </p>
                )}
              </div>
            )}

            {currentProposal.status === 'Changes Requested' && (
              <div className="p-4 bg-amber-950/80 border border-amber-800 rounded-2xl text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-black text-sm text-amber-400">
                  <Icons.AlertCircle className="w-5 h-5" />
                  Changes Requested by Client
                </div>
                {currentProposal.clientResponseNote && (
                  <p className="text-[11px] text-slate-200 pt-1">
                    Requested Notes: "{currentProposal.clientResponseNote}"
                  </p>
                )}
              </div>
            )}

            {currentProposal.status === 'Rejected' && (
              <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-black text-sm text-rose-400">
                  <Icons.XCircle className="w-5 h-5" />
                  Proposal Rejected
                </div>
                {currentProposal.clientResponseNote && (
                  <p className="text-[11px] text-slate-200 pt-1">
                    Rejection Reason: "{currentProposal.clientResponseNote}"
                  </p>
                )}
              </div>
            )}

            {/* ACTION BUTTONS (For Client or Admin Review) */}
            {currentProposal.status !== 'Approved' && currentProposal.status !== 'Rejected' && (
              <div className="space-y-4 print:hidden">
                <p className="text-xs text-slate-400">
                  Please review the proposal details above and select your action below:
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    disabled={isSubmittingAction}
                    onClick={() => handleStatusUpdate('Approved')}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                  >
                    <Icons.CheckCircle2 className="w-4 h-4" />
                    <span>Approve Proposal</span>
                  </button>

                  <button
                    disabled={isSubmittingAction}
                    onClick={() => setShowChangesModal(true)}
                    className="px-5 py-3 bg-amber-600/90 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-950/50"
                  >
                    <Icons.MessageSquarePlus className="w-4 h-4" />
                    <span>Request Changes</span>
                  </button>

                  <button
                    disabled={isSubmittingAction}
                    onClick={() => setShowRejectModal(true)}
                    className="px-5 py-3 bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 disabled:opacity-50 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Icons.XCircle className="w-4 h-4" />
                    <span>Reject Proposal</span>
                  </button>
                </div>
              </div>
            )}

            {/* Internal Admin Notes (Visible to Admin only) */}
            {!isClientView && currentProposal.internalNotes && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 print:hidden">
                <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">Internal Admin Notes</span>
                <p className="text-xs text-slate-300">{currentProposal.internalNotes}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* MODAL: REQUEST CHANGES */}
      <AnimatePresence>
        {showChangesModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Icons.MessageSquarePlus className="w-5 h-5 text-amber-400" />
                  Submit Request Changes
                </h3>
                <button
                  onClick={() => setShowChangesModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Please specify any pricing, service additions, or timeline tweaks you would like us to modify for proposal <strong className="text-white">{currentProposal.id}</strong>.
              </p>

              <textarea
                rows={4}
                value={changesNotes}
                onChange={(e) => setChangesNotes(e.target.value)}
                placeholder="e.g., We would like to add Express delivery for the website build, and adjust total budget..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowChangesModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!changesNotes.trim() || isSubmittingAction}
                  onClick={() => handleStatusUpdate('Changes Requested', changesNotes)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-black uppercase rounded-xl cursor-pointer"
                >
                  Submit Notes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REJECT PROPOSAL */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Icons.XCircle className="w-5 h-5 text-rose-400" />
                  Reject Proposal
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Please provide a brief reason for declining proposal <strong className="text-white">{currentProposal.id}</strong>:
              </p>

              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Timeline conflicts or budget reallocation..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingAction}
                  onClick={() => handleStatusUpdate('Rejected', rejectReason || 'Declined by client')}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black uppercase rounded-xl cursor-pointer"
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
