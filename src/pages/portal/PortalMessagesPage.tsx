import React from 'react';
import * as Icons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProjectCommunication } from '../../components/ProjectCommunication';

interface PortalMessagesPageProps {
  navigate: (path: string) => void;
}

export const PortalMessagesPage: React.FC<PortalMessagesPageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6" id="portal-messages-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Project Communication & Messages
            </h1>
            <span className="px-2.5 py-0.5 bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-black uppercase tracking-wider rounded-full">
              Live Team Channel
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Collaborate directly with your Senior Project Manager Aisha Sharma, share feedback notes, and track milestone discussions.
          </p>
        </div>

        {/* Quick WhatsApp Escalate */}
        <a
          href="https://wa.me/917017324978?text=Hello%20Aisha%2C%20I%20have%20an%20urgent%20message%20regarding%20my%20Dizo%20Pulse%20project."
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Icons.MessageSquare className="w-3.5 h-3.5" />
          <span>Urgent WhatsApp Escalation</span>
        </a>
      </div>

      {/* Embedded Full Project Communication Component */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-xl min-h-[600px]">
        <ProjectCommunication
          mode="project"
          projectId="PRJ-1001"
          projectName="Brand Identity & Web Platform"
          clientName={currentUser?.name || 'Valued Client'}
          clientEmail={currentUser?.email || 'client@business.com'}
          userRole="client"
          userName={currentUser?.name || 'Valued Client'}
        />
      </div>
    </div>
  );
};
export default PortalMessagesPage;
