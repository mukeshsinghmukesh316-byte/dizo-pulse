import React from 'react';
import * as Icons from 'lucide-react';
import ClientAccountSettings from '../../components/ClientAccountSettings';

interface PortalSettingsPageProps {
  navigate: (path: string) => void;
}

export const PortalSettingsPage: React.FC<PortalSettingsPageProps> = ({ navigate }) => {
  return (
    <div className="space-y-6" id="portal-settings-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Client Account & Security Settings
            </h1>
            <span className="px-2.5 py-0.5 bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-black uppercase tracking-wider rounded-full">
              Settings & Privacy
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Manage your personal profile, business credentials, notification preferences, and active security sessions.
          </p>
        </div>
      </div>

      {/* Embedded Client Account Settings Component */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-xl">
        <ClientAccountSettings />
      </div>
    </div>
  );
};
export default PortalSettingsPage;
