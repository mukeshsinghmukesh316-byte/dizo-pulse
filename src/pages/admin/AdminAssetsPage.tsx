import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import { AssetLibrary } from '../../components/AssetLibrary';
import { Project } from '../../types';
import * as Icons from 'lucide-react';

interface AdminAssetsPageProps {
  navigate: (path: string) => void;
}

export const AdminAssetsPage: React.FC<AdminAssetsPageProps> = ({ navigate }) => {
  const { adminUser } = useAdminAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setIsLoadingProjects(false));
  }, []);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  return (
    <AdminLayout
      activeTab="assets"
      currentPath="/admin/assets"
      navigate={navigate}
      requiredModule="assets"
      pageTitle="Agency Asset Manager"
    >
      {/* Project Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Icons.Folder className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Central Deliverables Vault</h3>
            <p className="text-[11px] text-slate-400">Select a project workspace or view agency-wide creative files</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Filter Project:</span>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer min-w-[200px]"
          >
            <option value="all">📁 All Projects (Global Vault)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.projectName} ({p.businessName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Asset Library Main Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <AssetLibrary
          projectId={selectedProjectId}
          projectName={activeProject?.projectName || 'Global Agency Files'}
          clientName={activeProject?.clientName || 'Agency Wide'}
          isAdmin={true}
          uploadedByDefault={adminUser?.name || 'Dizo Operations'}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminAssetsPage;
