import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { AssetLibrary } from '../../components/AssetLibrary';
import { DeliverableFile } from '../../types';

interface PortalVaultPageProps {
  navigate: (path: string) => void;
}

const DEFAULT_VAULT_FILES: DeliverableFile[] = [
  {
    id: 'f-1',
    name: 'Brand_Identity_Master_Assets_Pack.zip',
    category: 'Branding & Logo',
    size: '48.5 MB',
    fileType: 'ZIP',
    uploadDate: '2026-08-05',
    version: 'v2.1 Final',
    associatedOrderId: 'ORD-1092'
  },
  {
    id: 'f-2',
    name: 'Brand_Guidelines_&_Typography_System.pdf',
    category: 'Strategy & Docs',
    size: '12.4 MB',
    fileType: 'PDF',
    uploadDate: '2026-08-04',
    version: 'v1.0 Final',
    associatedOrderId: 'ORD-1092'
  },
  {
    id: 'f-3',
    name: 'Social_Reels_&_Story_Ads_Batch1.mp4',
    category: 'Video & Content',
    size: '142.8 MB',
    fileType: 'MP4',
    uploadDate: '2026-08-06',
    version: 'v1.2 Draft',
    associatedOrderId: 'ORD-1092'
  },
  {
    id: 'f-4',
    name: 'High_Res_Transparent_Logos.png',
    category: 'Branding & Logo',
    size: '8.2 MB',
    fileType: 'PNG',
    uploadDate: '2026-08-03',
    version: 'v2.0 Final',
    associatedOrderId: 'ORD-1092'
  },
  {
    id: 'f-5',
    name: 'Official_GST_Agency_Invoice_Receipt.pdf',
    category: 'Invoice',
    size: '420 KB',
    fileType: 'PDF',
    uploadDate: '2026-08-01',
    version: 'Official',
    associatedOrderId: 'ORD-1092'
  },
  {
    id: 'f-6',
    name: 'React_Tailwind_LandingPage_Source.zip',
    category: 'Web & Code',
    size: '18.6 MB',
    fileType: 'ZIP',
    uploadDate: '2026-08-07',
    version: 'v1.0 Live Build',
    associatedOrderId: 'ORD-1092'
  }
];

export const PortalVaultPage: React.FC<PortalVaultPageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();

  const [activeView, setActiveView] = useState<'deliverables' | 'explorer'>('deliverables');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const categories = ['All', 'Branding & Logo', 'Video & Content', 'Web & Code', 'Strategy & Docs', 'Invoice'];

  const filteredFiles = DEFAULT_VAULT_FILES.filter((file) => {
    const matchesCategory = categoryFilter === 'All' || file.category === categoryFilter;
    const matchesSearch = !searchQuery.trim() || file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDownloadFile = (fileName: string) => {
    setDownloadToast(`Initiating download for ${fileName}...`);
    setTimeout(() => {
      const blob = new Blob([`Dizo Pulse Secure Deliverable: ${fileName}\nAuthorized Client: ${currentUser?.name || 'Valued Client'}\nTimestamp: ${new Date().toISOString()}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadToast(`${fileName} downloaded successfully!`);
      setTimeout(() => setDownloadToast(null), 3000);
    }, 600);
  };

  const handleDownloadAllZip = () => {
    setDownloadToast('Packaging all project deliverables into ZIP archive...');
    setTimeout(() => {
      const blob = new Blob(['DIZO PULSE COMPLETE ASSETS ARCHIVE BUNDLE'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DizoPulse_Project_Deliverables_Bundle.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadToast('Deliverables archive downloaded!');
      setTimeout(() => setDownloadToast(null), 3500);
    }, 1200);
  };

  return (
    <div className="space-y-8" id="portal-vault-page">
      {/* Toast Alert */}
      <AnimatePresence>
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-6 z-50 p-3.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-2xl"
          >
            <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Files & Deliverables Vault
            </h1>
            <span className="px-2.5 py-0.5 bg-sky-950 border border-sky-800 text-sky-300 text-[10px] font-black uppercase tracking-wider rounded-full">
              {DEFAULT_VAULT_FILES.length} Files Ready
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Download vector brand assets, finalized video reels, React landing page source code, and strategy guidelines.
          </p>
        </div>

        {/* View mode toggle & Batch download */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveView('deliverables')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'deliverables' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Master Files
            </button>
            <button
              onClick={() => setActiveView('explorer')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeView === 'explorer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Folder Explorer
            </button>
          </div>

          <button
            onClick={handleDownloadAllZip}
            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-950/40 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Icons.DownloadCloud className="w-4 h-4" />
            <span>Download All ZIP</span>
          </button>
        </div>
      </div>

      {activeView === 'deliverables' ? (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file name..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                      {file.fileType}
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded-md">
                      {file.version}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-white line-clamp-2 leading-snug">{file.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {file.category} • {file.size}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(file.uploadDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDownloadFile(file.name)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-xl text-xs font-bold border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icons.Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6">
          <AssetLibrary
            projectId="PRJ-1001"
            projectName="Brand Identity & Web Platform"
            clientName={currentUser?.name || 'Valued Client'}
            clientEmail={currentUser?.email}
            isAdmin={false}
          />
        </div>
      )}
    </div>
  );
};
export default PortalVaultPage;
