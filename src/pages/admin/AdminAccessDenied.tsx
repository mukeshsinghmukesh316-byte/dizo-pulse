import React from 'react';
import * as Icons from 'lucide-react';

interface AdminAccessDeniedProps {
  moduleName?: string;
  requiredRole?: string;
  onNavigate: (path: string) => void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  moduleName = 'this module',
  requiredRole = 'Administrator',
  onNavigate
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <Icons.ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/30 inline-block">
            Access Restricted (RBAC)
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">
            Unauthorized Access
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Your current account role does not have permission to access <span className="text-slate-200 font-bold">{moduleName}</span>. This section is restricted to <span className="text-indigo-400 font-bold">{requiredRole}</span> level team members.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => onNavigate('/admin/dashboard')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <Icons.LayoutDashboard className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={() => window.history.back()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
          >
            <Icons.ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAccessDenied;
