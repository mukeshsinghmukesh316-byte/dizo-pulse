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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Extract returnUrl from query parameters or default to dashboard
  const searchParams = new URLSearchParams(window.location.search);
  const effectiveReturnUrl = searchParams.get('returnUrl') || propReturnUrl || '/admin/dashboard';

  // If already authenticated, redirect to target dashboard
  useEffect(() => {
    if (isAuthenticated) {
      console.log(`[AdminLoginPage] User is authenticated. Redirecting to "${effectiveReturnUrl}"`);
      navigate(effectiveReturnUrl);
    }
  }, [isAuthenticated, effectiveReturnUrl, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    try {
      console.log(`[AdminLoginPage] Submitting login for ${email}...`);
      const success = await login(email, password);
      if (success) {
        console.log(`[AdminLoginPage] Login successful. Navigating to "${effectiveReturnUrl}"`);
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
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo variant="dark" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Icons.ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff & Admin Gateway</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Operations Control Center
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sign in with authorized agency credentials to manage CRM, projects, contracts, and revenue.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {(loginError || localError) && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center gap-2.5">
              <Icons.AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{loginError || localError}</span>
            </div>
          )}

          {lockoutTimeLeft > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs flex items-center gap-2.5">
              <Icons.Clock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Security cooldown active. Retry in {lockoutTimeLeft}s.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Icons.Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@dizopulse.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <Icons.Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || lockoutTimeLeft > 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Icons.LogIn className="w-4 h-4" />
                  <span>Sign In to Admin Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Testing */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">
              Quick Role Switcher (Staff Directory)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('mukeshsinghmukesh316@gmail.com', 'dizo2025')}
                className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white truncate">Super Admin</div>
                <div className="text-[9px] text-slate-400 truncate">mukeshsingh...</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@dizopulse.com', 'dizo2025')}
                className="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white truncate">Agency Admin</div>
                <div className="text-[9px] text-slate-400 truncate">admin@dizo...</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-center text-xs text-slate-500 px-2">
          <button
            onClick={() => navigate('/')}
            className="hover:text-slate-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Icons.ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Website</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
