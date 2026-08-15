import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import Logo from '../../components/Logo';

interface AdminLoginPageProps {
  navigate: (path: string) => void;
  returnUrl?: string;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  navigate,
  returnUrl: propReturnUrl = '/admin/dashboard',
}) => {
  const { isAuthenticated, login, loginError, failedAttempts, lockoutTimeLeft } = useAdminAuth();
  
  // Stored remember-me email support
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('dizopulse_remembered_admin_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return !!localStorage.getItem('dizopulse_remembered_admin_email');
    } catch {
      return false;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showQuickRoles, setShowQuickRoles] = useState(false);

  // Extract returnUrl from query parameters or default to dashboard
  const searchParams = new URLSearchParams(window.location.search);
  const effectiveReturnUrl = searchParams.get('returnUrl') || propReturnUrl || '/admin/dashboard';

  // If already authenticated, redirect to target dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(effectiveReturnUrl);
    }
  }, [isAuthenticated, effectiveReturnUrl, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    try {
      if (rememberMe && email) {
        localStorage.setItem('dizopulse_remembered_admin_email', email);
      } else {
        localStorage.removeItem('dizopulse_remembered_admin_email');
      }

      const success = await login(email, password);
      if (success) {
        navigate(effectiveReturnUrl);
      }
    } catch (err: any) {
      console.error('[AdminLoginPage] Login failed:', err);
      setLocalError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLocalError('');
  };

  const featureHighlights = [
    {
      icon: Icons.LayoutDashboard,
      title: 'Operations Dashboard',
      description: 'Real-time telemetry, revenue pulse, visitor metrics, and active client inquiries.',
      badge: 'Live Analytics',
    },
    {
      icon: Icons.Users2,
      title: 'Team & Staff Dispatch',
      description: 'Granular role-based access control, departmental assignments, and audit trails.',
      badge: 'RBAC Security',
    },
    {
      icon: Icons.FolderKanban,
      title: 'Project & Contract Control',
      description: 'Milestones tracking, digital signatures, deliverable assets, and invoice releases.',
      badge: 'Workflow Hub',
    },
    {
      icon: Icons.ShieldCheck,
      title: 'Enterprise Secure Gateway',
      description: 'Dual-token session integrity, brute-force defense, and instant permission revocation.',
      badge: '256-bit Guard',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 antialiased selection:bg-indigo-500 selection:text-white relative overflow-x-hidden" id="admin-login-view">
      {/* Background Decorative Gradients & Grid Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[130px]" />
        {/* Subtle grid mesh overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" 
        />
      </div>

      {/* Top Bar for Rapid Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between pb-4 sm:pb-6">
        <div 
          onClick={() => navigate('/')}
          className="cursor-pointer select-none group flex items-center gap-2"
          title="Return to Public Website"
        >
          <Logo variant="light" size="sm" className="origin-left" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <button
            type="button"
            onClick={() => navigate('/agency')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer shadow-xs"
          >
            <Icons.Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Agency Gateway</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer shadow-xs"
          >
            <Icons.ArrowLeft className="w-3.5 h-3.5" />
            <span>Main Website</span>
          </button>
        </div>
      </header>

      {/* Main Two-Column Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto my-auto py-4 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          
          {/* ================= LEFT SIDE: BRANDING & OPERATIONS HIGHLIGHTS ================= */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8 order-2 lg:order-1">
            
            {/* Badge & Headings */}
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-cyan-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Icons.ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Authorized Staff & Executive Portal</span>
              </div>

              <h1 className="text-2xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
                Operations <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  Control Center
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed max-w-xl">
                Unified operations command for Dizo Pulse leadership and delivery teams. Orchestrate client relationships, project pipelines, financial contracts, and live platform services from a single encrypted terminal.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {featureHighlights.map((feat, idx) => {
                const IconComp = feat.icon;
                return (
                  <div 
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 group shadow-sm flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-700/40 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-105 group-hover:bg-indigo-900/80 transition-all flex items-center justify-center">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400/90 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        {feat.badge}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                        {feat.title}
                      </h2>
                      <p className="text-[11px] text-slate-400 font-normal leading-relaxed mt-0.5">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status & Trust Bar */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Icons.Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium">256-Bit Hardware Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">System Telemetry: 99.98% Uptime</span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE: PREMIUM LOGIN CARD ================= */}
          <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto lg:max-w-none order-1 lg:order-2">
            <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800/90 hover:border-slate-700/80 rounded-3xl p-6 sm:p-8 lg:p-9 shadow-2xl shadow-slate-950/80 relative overflow-hidden transition-all">
              
              {/* Top Accent Gradient Border Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-wider mb-1">
                    <Icons.ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Secure Authentication</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Sign in to your account
                  </h2>
                  <p className="text-xs text-slate-400 font-normal">
                    Enter authorized agency email & password to continue.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Icons.KeyRound className="w-5 h-5" />
                </div>
              </div>

              {/* Error Banner */}
              {(loginError || localError) && (
                <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-2xl text-xs flex items-start gap-2.5 animate-fadeIn">
                  <Icons.AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold">Authentication Failed</p>
                    <p className="text-[11px] text-rose-300/90">{loginError || localError}</p>
                    {failedAttempts > 0 && failedAttempts < 5 && (
                      <p className="text-[10px] text-rose-400/80 mt-0.5">
                        Attempt {failedAttempts} of 5 before cooldown trigger.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Lockout Banner */}
              {lockoutTimeLeft > 0 && (
                <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-2xl text-xs flex items-center gap-2.5 animate-pulse">
                  <Icons.Clock className="w-4 h-4 shrink-0 text-amber-400" />
                  <div className="text-[11px]">
                    <span className="font-bold">Security Cooldown Active:</span> Too many failed attempts. Retry in <span className="font-mono font-bold text-amber-300">{lockoutTimeLeft}s</span>.
                  </div>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 tracking-wide">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Icons.Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@dizopulse.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-300 tracking-wide">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Icons.Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-md border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer accent-indigo-600"
                    />
                    <span className="text-xs text-slate-400 font-medium">
                      Remember this terminal
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <Icons.CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    SSL Protected
                  </span>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || lockoutTimeLeft > 0}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:via-indigo-400 hover:to-cyan-400 disabled:from-slate-800 disabled:via-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 active:scale-[0.99] flex items-center justify-center gap-2.5"
                  id="admin-submit-login-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Icons.Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Icons.LogIn className="w-4 h-4" />
                      <span>Sign In to Admin Portal</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Role Switcher (Visible ONLY in Development Mode) */}
              {import.meta.env.DEV && (
                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowQuickRoles(!showQuickRoles)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-300 py-1 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Icons.Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Quick Role Switcher (Dev / Demo Access)</span>
                    </span>
                    <Icons.ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showQuickRoles ? 'rotate-180 text-indigo-400' : 'text-slate-400'}`} />
                  </button>

                  {showQuickRoles && (
                    <div className="mt-2.5 grid grid-cols-2 gap-2 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('mukeshsinghmukesh316@gmail.com', 'dizo2025')}
                        className="p-2.5 bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            Super Admin
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                            Root
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">mukeshsinghmukesh...</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickLogin('admin@dizopulse.com', 'dizo2025')}
                        className="p-2.5 bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            Agency Admin
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                            Staff
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">admin@dizopulse...</div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hover:text-slate-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Website</span>
          </button>

          <span className="text-slate-800 hidden sm:inline">•</span>

          <button
            type="button"
            onClick={() => navigate('/agency')}
            className="hover:text-slate-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Agency Gateway & Roles</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>&copy; {new Date().getFullYear()} Dizo Pulse Agency. All rights reserved.</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Icons.KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Reset Agency Credentials</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              For security compliance, administrative credential resets are handled directly by the Super Administrator or via the Staff Security Management panel.
            </p>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
              <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Emergency Support Contact
              </div>
              <div className="text-white font-medium flex items-center gap-1.5">
                <Icons.Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>mukeshsinghmukesh316@gmail.com</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Or connect directly with your assigned Agency Lead via internal WhatsApp channel.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoginPage;

