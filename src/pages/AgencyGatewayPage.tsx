import React from 'react';
import * as Icons from 'lucide-react';
import Logo from '../components/Logo';

interface AgencyGatewayPageProps {
  navigate: (path: string, options?: { replace?: boolean }) => void;
}

export const AgencyGatewayPage: React.FC<AgencyGatewayPageProps> = ({ navigate }) => {
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden"
      id="agency-gateway-root"
    >
      {/* Background Decorative Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between relative z-10 py-2">
        <div onClick={() => navigate('/')} className="cursor-pointer select-none">
          <Logo variant="dark" showSubtitle={true} />
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 cursor-pointer"
        >
          <Icons.ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Website</span>
        </button>
      </header>

      {/* Central Gateway Panel */}
      <main className="w-full max-w-4xl mx-auto my-8 relative z-10 space-y-8">
        {/* Title & Security Badge */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <Icons.ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Official Agency Portal Gateway</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Centralized Operations & Management Control
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-400 font-medium leading-relaxed">
            Welcome to the internal administration environment for Dizo Pulse. Authorized team members can manage inquiries, proposals, active contracts, client deliverables, and business intelligence.
          </p>
        </div>

        {/* Gateway Action & Modules Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-8">
          {/* Quick Core Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center">
                <Icons.Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Leads & CRM Pipeline</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Track custom quote submissions, inbound project briefs, and client lifecycle stages.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400 flex items-center justify-center">
                <Icons.FileCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Proposals & Legal SLA</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Generate dynamic proposals, digital contract signatures, and milestone milestones.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 sm:col-span-2 md:col-span-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center justify-center">
                <Icons.BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">BI & Revenue Analytics</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Real-time visibility into active project billings, collected deposits, and conversion rates.
              </p>
            </div>
          </div>

          {/* Primary Call to Action Bar */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Agency Authentication Desk</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Encrypted Session • Role-Based Access Control (RBAC) Active
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/portal/login')}
                className="w-full sm:w-auto px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Icons.UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Client Portal Login</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xl shadow-indigo-950/60 flex items-center justify-center gap-2"
                id="continue-to-admin-login-btn"
              >
                <span>Continue to Staff Login</span>
                <Icons.ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice Note */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 flex items-start gap-3 text-xs text-slate-400">
          <Icons.Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-200">Security Verification Protocol:</strong> Access to the Agency Portal is restricted strictly to verified staff and system administrators. All authentication attempts and privileged actions are monitored and audited for data integrity.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-4 text-center text-[11px] text-slate-400 relative z-10 border-t border-slate-900">
        <p>© {new Date().getFullYear()} Dizo Pulse Digital Agency. Internal Enterprise Network.</p>
      </footer>
    </div>
  );
};

export default AgencyGatewayPage;
