import React from 'react';
import * as Icons from 'lucide-react';

interface TermsPageProps {
  navigate: (path: string) => void;
}

export default function TermsPage({ navigate }: TermsPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-10" id="terms-page-root">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-10 border border-slate-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
          <Icons.FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>Legal Documentation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Terms & Conditions of Service
        </h1>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Last Updated: July 2026 • Official Dizo Pulse Digital Agency Terms
        </p>
      </div>

      {/* Main Terms Document Body */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed">
        <p className="text-base text-slate-800 font-medium">
          Welcome to <strong>Dizo Pulse Digital Agency</strong>. By placing an order, booking custom packages, making payment milestones, or interacting with our client portal, you agree to be bound by the terms and conditions outlined below.
        </p>

        {/* Section 1 */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">1</span>
            Project Scoping & Requirement Gathering
          </h2>
          <p>
            All design, video production, web engineering, and advertising projects are initiated based on the requirements, references, and assets supplied by the client during the checkout or briefing stage.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
            <li>Any fundamental alterations to the initial project scope after production has commenced may be subject to timeline adjustments or additional milestone fees.</li>
            <li>Clients are requested to provide clear, high-resolution logos, brand color codes, and copywriting copy to avoid delivery delays.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">2</span>
            Payment Milestones & 50/50 Split Billing
          </h2>
          <p>
            To maintain fairness, transparency, and trust, Dizo Pulse offers flexible payment schedules:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">50% Advance Milestone</h3>
              <p className="text-xs text-slate-600">
                Required upfront upon checkout to allocate design talent and initiate queue production.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">50% Final Clearance</h3>
              <p className="text-xs text-slate-600">
                Payable only upon client satisfaction and approval of draft deliverables before final unwatermarked asset delivery.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Payment can be processed securely via UPI QR, Net Banking, or official bank transfer. Official GST receipts and invoices are generated automatically in the Client Portal.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">3</span>
            Revision & Approval Policy
          </h2>
          <p>
            Customer satisfaction is at the core of our agency. Every standard catalog service includes up to <strong>3 major revision rounds</strong> at no extra cost.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
            <li>Revisions include modifications to typography, color palettes, pacing, cuts, audio alignment, and visual layout.</li>
            <li>Revisions do not cover complete script changes or pivot to an entirely different concept after final render.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">4</span>
            Intellectual Property & Commercial Licenses
          </h2>
          <p>
            Upon complete payment of all project milestones, full intellectual property rights, commercial licenses, high-resolution 4K video exports, vector files, and web source codes are completely transferred to the client.
          </p>
          <p className="text-xs text-slate-500">
            Dizo Pulse retains only the promotional right to showcase the finalized visual work in its agency portfolio, case studies, and social channels unless an explicit non-disclosure agreement (NDA) is executed.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">5</span>
            Cancellation & Project Holds
          </h2>
          <p>
            Clients may pause a project for up to 30 calendar days by contacting their project manager. If a project is cancelled after initial design concepts have been drafted, the 50% advance covers the creative labor incurred up to that milestone.
          </p>
        </section>
      </div>

      {/* Footer Navigation Back */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer"
        >
          <Icons.ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <button
          onClick={() => navigate('/privacy')}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>View Privacy Policy</span>
          <Icons.ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
