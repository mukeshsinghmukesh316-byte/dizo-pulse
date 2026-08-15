import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

interface PortalLoginPageProps {
  navigate: (path: string, options?: { replace?: boolean }) => void;
  returnUrl?: string;
}

export const PortalLoginPage: React.FC<PortalLoginPageProps> = ({
  navigate,
  returnUrl = '/portal/dashboard'
}) => {
  const { signIn, signUp, authError, setAuthError, authSuccess, setAuthSuccess } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('client@business.com');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Sign Up Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regCompany, setRegCompany] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setAuthError('');
    try {
      await signIn(loginEmail.trim(), loginPassword);
      setAuthSuccess('Welcome back! Loading your client dashboard...');
      setTimeout(() => {
        navigate(returnUrl, { replace: true });
      }, 500);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setAuthError('Please fill all required registration fields.');
      return;
    }
    setLoading(true);
    setAuthError('');
    try {
      const user = await signUp(regName.trim(), regEmail.trim(), regPassword, regWhatsapp.trim());
      // If company was filled, update profile
      if (regCompany && user) {
        const stored = localStorage.getItem('dizopulse_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.company = regCompany;
            localStorage.setItem('dizopulse_user', JSON.stringify(parsed));
          } catch (e) {}
        }
      }
      setAuthSuccess('Account registered successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate(returnUrl, { replace: true });
      }, 600);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to create account. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleOneClickDemo = async () => {
    setLoginEmail('client@business.com');
    setLoginPassword('password123');
    setLoading(true);
    setAuthError('');
    try {
      await signIn('client@business.com', 'password123');
      setAuthSuccess('Logged in as Aura Digital Labs Demo Client!');
      setTimeout(() => {
        navigate(returnUrl, { replace: true });
      }, 400);
    } catch (err: any) {
      setAuthError('Demo sign in failed. Please try manual entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans" id="portal-login-page">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Navigation */}
      <header className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full z-10">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50 group-hover:scale-105 transition-transform">
            <Icons.Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              DIZO<span className="text-cyan-400">PULSE</span>
            </span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Client Portal
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Icons.ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Website</span>
        </button>
      </header>

      {/* Login / Register Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6"
        >
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-700/60 text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
              <Icons.Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {mode === 'signin' ? 'Sign In to Client Portal' : 'Register Client Account'}
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              {mode === 'signin'
                ? 'Access your active project milestones, approve scopes, and download finished deliverables.'
                : 'Create an account to review proposals, contracts, and collaborate with your dedicated team.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => { setMode('signin'); setAuthError(''); setAuthSuccess(''); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setAuthError(''); setAuthSuccess(''); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold rounded-xl flex items-start gap-2"
              >
                <Icons.AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </motion.div>
            )}
            {authSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl flex items-start gap-2"
              >
                <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  Work / Corporate Email
                </label>
                <div className="relative">
                  <Icons.Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="client@business.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    Portal Password
                  </label>
                </div>
                <div className="relative">
                  <Icons.Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-950/50 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing into Workspace...</span>
                  </>
                ) : (
                  <>
                    <Icons.LogIn className="w-4 h-4" />
                    <span>Access Client Dashboard</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  Company / Brand Name
                </label>
                <input
                  type="text"
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  placeholder="e.g. Aura Digital Labs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="vikram@aura.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  WhatsApp Contact
                </label>
                <input
                  type="tel"
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  Create Password *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <Icons.UserPlus className="w-4 h-4" />
                    <span>Register Client Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Access Bar */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={handleOneClickDemo}
              disabled={loading}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800/80 border border-indigo-900/60 rounded-xl text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <Icons.Sparkles className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span>1-Click Demo Client Login (Aura Digital Labs)</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="p-4 text-center text-slate-400 text-[11px] z-10">
        <p>© {new Date().getFullYear()} Dizo Pulse Digital Agency. Secure Encrypted Client Portal.</p>
      </footer>
    </div>
  );
};
export default PortalLoginPage;
