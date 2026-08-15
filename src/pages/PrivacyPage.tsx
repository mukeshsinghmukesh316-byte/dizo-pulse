import React from 'react';
import * as Icons from 'lucide-react';

interface PrivacyPageProps {
  navigate: (path: string) => void;
}

export default function PrivacyPage({ navigate }: PrivacyPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-10" id="privacy-page-root">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-10 border border-slate-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
          <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Privacy & Security</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Client Privacy Policy
        </h1>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Last Updated: July 2026 • Official Dizo Pulse Privacy Standards
        </p>
      </div>

      {/* Main Privacy Document Body */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed">
        <p className="text-base text-slate-800 font-medium">
          At <strong>Dizo Pulse</strong>, we understand that your project assets, business strategies, brand guidelines, and contact coordinates are valuable and confidential. This Privacy Policy details how we protect, store, and process your data.
        </p>

        {/* Section 1 */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">1</span>
            Information We Collect
          </h2>
          <p>We collect only the essential information necessary to produce your digital assets and manage project milestones:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
            <li><strong>Client Identity:</strong> Name, business name, WhatsApp number, and official email address.</li>
            <li><strong>Project Content:</strong> Raw footage, logos, typography files, product images, and design briefs.</li>
            <li><strong>Transaction Records:</strong> Invoices, transaction reference IDs, payment verification screenshots (we do not store raw credit/debit card numbers).</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">2</span>
            Secure Workspace Isolation & Access Control
          </h2>
          <p>
            Your uploaded assets and requirement notes are stored in secure cloud vaults and accessed exclusively by the dedicated designers, video editors, and project leads assigned to your active queue.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">3</span>
            Zero-Spam & Zero-Resale Guarantee
          </h2>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
            <h3 className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider">Our Privacy Promise</h3>
            <p className="text-xs text-emerald-800">
              We never sell, rent, or distribute your email, WhatsApp number, or client database to third-party marketing firms or data brokers. All communications are strictly related to your active project inquiries, proposals, and delivery updates.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">4</span>
            Data Retention & Deletion Rights
          </h2>
          <p>
            Delivered project assets are securely archived in your Client Vault for at least 12 months after completion so you can re-download brand kits anytime. You may request permanent deletion of your files or account records at any time by contacting <code className="text-indigo-600 font-mono text-xs">support.dizopulse@gmail.com</code>.
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
          onClick={() => navigate('/terms')}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>View Terms of Service</span>
          <Icons.ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
