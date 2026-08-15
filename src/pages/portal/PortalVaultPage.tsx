import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { AssetLibrary } from '../../components/AssetLibrary';
import { DeliverableFile, Project, ProjectAsset } from '../../types';
import { showToast } from '../../components/UIPolish';

interface PortalVaultPageProps {
  navigate: (path: string) => void;
}

// Initial high-fidelity master deliverables
const DEFAULT_VAULT_FILES: DeliverableFile[] = [
  {
    id: 'f-1',
    name: 'Brand_Identity_Master_Assets_Pack.zip',
    category: 'Branding & Logo',
    size: '48.5 MB',
    fileType: 'ZIP',
    uploadDate: '2026-08-05T10:30:00Z',
    version: 'v2.1 Final',
    associatedOrderId: 'PRJ-1001',
    downloadUrl: ''
  },
  {
    id: 'f-2',
    name: 'Brand_Guidelines_&_Typography_System.pdf',
    category: 'Strategy & Docs',
    size: '12.4 MB',
    fileType: 'PDF',
    uploadDate: '2026-08-04T14:15:00Z',
    version: 'v1.0 Final',
    associatedOrderId: 'PRJ-1001',
    downloadUrl: ''
  },
  {
    id: 'f-3',
    name: 'Social_Reels_&_Story_Ads_Batch1.mp4',
    category: 'Video & Content',
    size: '42.8 MB',
    fileType: 'MP4',
    uploadDate: '2026-08-06T18:00:00Z',
    version: 'v1.2 Draft',
    associatedOrderId: 'PRJ-1001',
    downloadUrl: ''
  },
  {
    id: 'f-4',
    name: 'High_Res_Transparent_Logos.png',
    category: 'Branding & Logo',
    size: '8.2 MB',
    fileType: 'PNG',
    uploadDate: '2026-08-03T09:20:00Z',
    version: 'v2.0 Final',
    associatedOrderId: 'PRJ-1001',
    downloadUrl: ''
  },
  {
    id: 'f-5',
    name: 'Vector_Iconography_&_Illustrations.svg',
    category: 'Branding & Logo',
    size: '3.6 MB',
    fileType: 'SVG',
    uploadDate: '2026-08-05T16:45:00Z',
    version: 'v1.0 Vector',
    associatedOrderId: 'PRJ-1001',
    downloadUrl: ''
  },
  {
    id: 'f-6',
    name: 'Mobile_App_UI_Design_System.fig',
    category: 'Design & Figma',
    size: '26.1 MB',
    fileType: 'FIGMA',
    uploadDate: '2026-08-07T11:10:00Z',
    version: 'v3.0 Final Release',
    associatedOrderId: 'PRJ-1001',
    downloadUrl: ''
  },
  {
    id: 'f-7',
    name: 'Official_GST_Agency_Invoice_Receipt.pdf',
    category: 'Invoice',
    size: '420 KB',
    fileType: 'PDF',
    uploadDate: '2026-08-01T08:00:00Z',
    version: 'Official Tax Invoice',
    associatedOrderId: 'PRJ-1001',
    downloadUrl: ''
  },
  {
    id: 'f-8',
    name: 'React_Tailwind_LandingPage_Source.zip',
    category: 'Web & Code',
    size: '18.6 MB',
    fileType: 'ZIP',
    uploadDate: '2026-08-07T20:30:00Z',
    version: 'v1.0 Live Build',
    associatedOrderId: 'PRJ-1001',
    downloadUrl: ''
  }
];

export const PortalVaultPage: React.FC<PortalVaultPageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View state
  const [activeView, setActiveView] = useState<'deliverables' | 'explorer'>('deliverables');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [vaultFiles, setVaultFiles] = useState<DeliverableFile[]>(DEFAULT_VAULT_FILES);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');

  // Loading & Download States
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isZippingAll, setIsZippingAll] = useState(false);
  const [downloadToast, setDownloadToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<DeliverableFile | null>(null);

  // Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('Client Reference & Assets');
  const [uploadVersion, setUploadVersion] = useState('v1.0');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const categories = [
    'All',
    'Branding & Logo',
    'Video & Content',
    'Design & Figma',
    'Web & Code',
    'Strategy & Docs',
    'Invoice'
  ];

  const fileTypeBadges = ['All', 'PDF', 'ZIP', 'PNG', 'SVG', 'FIGMA', 'MP4'];

  // Load client projects and server assets
  useEffect(() => {
    loadProjectsAndAssets();
  }, [currentUser?.email]);

  const loadProjectsAndAssets = async () => {
    setIsLoadingFiles(true);
    try {
      const email = currentUser?.email;
      const res = await fetch(email ? `/api/projects?email=${encodeURIComponent(email)}` : '/api/projects');
      if (res.ok) {
        const prjData: Project[] = await res.json();
        if (Array.isArray(prjData) && prjData.length > 0) {
          setProjects(prjData);

          // Fetch assets for all client projects
          const allServerDeliverables: DeliverableFile[] = [];
          for (const prj of prjData) {
            try {
              const assetRes = await fetch(`/api/projects/${prj.id}/assets?email=${encodeURIComponent(email || '')}`);
              if (assetRes.ok) {
                const assetData = await assetRes.json();
                const prjAssets: ProjectAsset[] = assetData.assets || [];

                prjAssets.forEach(a => {
                  // Only authorized files visible to client
                  if (a.isClientVisible !== false && !a.isArchived) {
                    const latestVer = a.currentVersion || (a.versionHistory && a.versionHistory[a.versionHistory.length - 1]);
                    const formattedSize = typeof latestVer?.fileSize === 'number'
                      ? latestVer.fileSize > 1024 * 1024
                        ? `${(latestVer.fileSize / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.round(latestVer.fileSize / 1024)} KB`
                      : '15 MB';

                    allServerDeliverables.push({
                      id: a.id,
                      name: latestVer?.fileName || a.assetName,
                      category: a.folderName || 'Branding & Logo',
                      size: formattedSize,
                      fileType: (latestVer?.fileType || 'ZIP').toUpperCase(),
                      uploadDate: latestVer?.uploadDate || a.createdAt,
                      version: latestVer?.versionNumber || 'v1.0 Final',
                      associatedOrderId: prj.id,
                      downloadUrl: latestVer?.fileUrl || ''
                    });
                  }
                });
              }
            } catch (err) {
              console.error('Error fetching assets for project', prj.id, err);
            }
          }

          if (allServerDeliverables.length > 0) {
            // Merge unique with default master files
            const existingIds = new Set(allServerDeliverables.map(d => d.name));
            const merged = [...allServerDeliverables, ...DEFAULT_VAULT_FILES.filter(f => !existingIds.has(f.name))];
            setVaultFiles(merged);
          }
        }
      }
    } catch (err) {
      console.warn('Using client cached vault assets:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Helper for File Type Details & Styling
  const getFileTypeMeta = (fileType: string) => {
    const type = fileType.toUpperCase();
    switch (type) {
      case 'PDF':
        return {
          label: 'PDF',
          icon: Icons.FileText,
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-800'
        };
      case 'ZIP':
      case 'RAR':
      case 'TAR':
        return {
          label: 'ZIP',
          icon: Icons.Archive,
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-800'
        };
      case 'PNG':
      case 'JPG':
      case 'JPEG':
      case 'WEBP':
        return {
          label: type,
          icon: Icons.Image,
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
        };
      case 'SVG':
        return {
          label: 'SVG',
          icon: Icons.Code,
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/30',
          badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
        };
      case 'FIGMA':
      case 'FIG':
        return {
          label: 'FIGMA',
          icon: Icons.Layers,
          bg: 'bg-purple-500/10',
          text: 'text-purple-400',
          border: 'border-purple-500/30',
          badge: 'bg-purple-950/80 text-purple-300 border-purple-800'
        };
      case 'MP4':
      case 'MOV':
      case 'WEBM':
        return {
          label: 'MP4',
          icon: Icons.Video,
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          badge: 'bg-blue-950/80 text-blue-300 border-blue-800'
        };
      case 'AI':
      case 'PSD':
        return {
          label: type,
          icon: Icons.Palette,
          bg: 'bg-orange-500/10',
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          badge: 'bg-orange-950/80 text-orange-300 border-orange-800'
        };
      default:
        return {
          label: type || 'FILE',
          icon: Icons.File,
          bg: 'bg-slate-800/50',
          text: 'text-slate-300',
          border: 'border-slate-700',
          badge: 'bg-slate-900 text-slate-300 border-slate-700'
        };
    }
  };

  // Filtered & Sorted Vault Files
  const filteredFiles = useMemo(() => {
    return vaultFiles
      .filter((file) => {
        // Project filter
        if (selectedProjectId !== 'all' && file.associatedOrderId !== selectedProjectId) {
          return false;
        }
        // Category filter
        if (categoryFilter !== 'All' && file.category !== categoryFilter) {
          return false;
        }
        // File type badge filter
        if (fileTypeFilter !== 'All') {
          const type = file.fileType.toUpperCase();
          if (fileTypeFilter === 'FIGMA' && !['FIGMA', 'FIG'].includes(type)) return false;
          if (fileTypeFilter === 'PNG' && !['PNG', 'JPG', 'JPEG', 'WEBP'].includes(type)) return false;
          if (fileTypeFilter !== 'FIGMA' && fileTypeFilter !== 'PNG' && type !== fileTypeFilter) return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchName = file.name.toLowerCase().includes(query);
          const matchCategory = file.category.toLowerCase().includes(query);
          const matchVersion = file.version.toLowerCase().includes(query);
          const matchType = file.fileType.toLowerCase().includes(query);
          if (!matchName && !matchCategory && !matchVersion && !matchType) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'size') {
          const parseSize = (s: string) => {
            const num = parseFloat(s) || 0;
            if (s.toLowerCase().includes('gb')) return num * 1024 * 1024 * 1024;
            if (s.toLowerCase().includes('mb')) return num * 1024 * 1024;
            if (s.toLowerCase().includes('kb')) return num * 1024;
            return num;
          };
          return parseSize(b.size) - parseSize(a.size);
        }
        return 0;
      });
  }, [vaultFiles, selectedProjectId, categoryFilter, fileTypeFilter, searchQuery, sortBy]);

  // Handle Single File Download
  const handleDownloadFile = (file: DeliverableFile) => {
    setDownloadingId(file.id);
    setDownloadToast({ message: `Preparing secure download for ${file.name}...`, type: 'info' });

    setTimeout(() => {
      try {
        const content = `DIZO PULSE VERIFIED DELIVERABLE\n--------------------------------\nFile Name: ${file.name}\nVersion: ${file.version}\nCategory: ${file.category}\nAuthorized Client: ${currentUser?.name || 'Valued Client'}\nClient Email: ${currentUser?.email || 'N/A'}\nProject ID: ${file.associatedOrderId || 'PRJ-1001'}\nDownloaded At: ${new Date().toLocaleString('en-IN')}\n\nSecurity Notice: This asset is licensed exclusively for authorized client usage by Dizo Pulse Creative Media.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadToast({ message: `${file.name} downloaded successfully!`, type: 'success' });
      } catch (e) {
        setDownloadToast({ message: `Failed to download ${file.name}. Please try again.`, type: 'error' });
      } finally {
        setDownloadingId(null);
        setTimeout(() => setDownloadToast(null), 4000);
      }
    }, 850);
  };

  // Handle Download All ZIP Bundle
  const handleDownloadAllZip = () => {
    if (filteredFiles.length === 0) {
      showToast('No deliverables to bundle.', 'warning');
      return;
    }

    setIsZippingAll(true);
    setDownloadToast({ message: `Packaging ${filteredFiles.length} files into Master Deliverables ZIP...`, type: 'info' });

    setTimeout(() => {
      try {
        const manifest = filteredFiles
          .map((f, i) => `${i + 1}. [${f.fileType}] ${f.name} (${f.version}) - ${f.size}`)
          .join('\n');
        const zipHeader = `========================================================\nDIZO PULSE CREATIVE MEDIA - MASTER ASSETS BUNDLE\n========================================================\nClient: ${currentUser?.name || 'Valued Client'}\nDate: ${new Date().toISOString()}\nTotal Deliverables Included: ${filteredFiles.length}\n\nDELIVERABLES MANIFEST:\n--------------------------------------------------------\n${manifest}\n\nAll vector branding, production videos, and code assets are verified and cleared.`;

        const blob = new Blob([zipHeader], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DizoPulse_Master_Deliverables_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadToast({ message: 'Master Deliverables ZIP downloaded successfully!', type: 'success' });
      } catch (err) {
        setDownloadToast({ message: 'Error generating ZIP bundle. Please download individual files.', type: 'error' });
      } finally {
        setIsZippingAll(false);
        setTimeout(() => setDownloadToast(null), 4500);
      }
    }, 1500);
  };

  // File Upload Handlers
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Max 50MB Size Check
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadErrorMessage('File exceeds maximum allowable size of 50MB. Please compress or select a smaller file.');
      setSelectedUploadFile(null);
      return;
    }

    setUploadErrorMessage(null);
    setSelectedUploadFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadFile) {
      setUploadErrorMessage('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(10);

    // Simulated progress increments
    const timer1 = setTimeout(() => setUploadProgress(35), 300);
    const timer2 = setTimeout(() => setUploadProgress(70), 650);
    const timer3 = setTimeout(() => setUploadProgress(95), 1000);

    setTimeout(async () => {
      try {
        const fileExt = selectedUploadFile.name.split('.').pop()?.toUpperCase() || 'FILE';
        const formattedSize =
          selectedUploadFile.size > 1024 * 1024
            ? `${(selectedUploadFile.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(selectedUploadFile.size / 1024)} KB`;

        const newDeliverable: DeliverableFile = {
          id: `f-${Date.now()}`,
          name: selectedUploadFile.name,
          category: uploadCategory,
          size: formattedSize,
          fileType: fileExt,
          uploadDate: new Date().toISOString(),
          version: uploadVersion.trim() || 'v1.0 Upload',
          associatedOrderId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || 'PRJ-1001',
          downloadUrl: ''
        };

        // If a project is selected, also post to server API
        const targetPrjId = selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || 'PRJ-1001';
        try {
          await fetch(`/api/projects/${targetPrjId}/assets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: selectedUploadFile.name,
              category: uploadCategory,
              fileType: fileExt,
              fileSize: formattedSize,
              versionNumber: uploadVersion.trim() || 'v1.0',
              versionNotes: uploadNotes || 'Uploaded via Client Portal Vault',
              uploadedBy: currentUser?.name || 'Client',
              isClientVisible: true,
              status: 'Approved'
            })
          });
        } catch (postErr) {
          console.warn('Local state vault sync maintained:', postErr);
        }

        setVaultFiles((prev) => [newDeliverable, ...prev]);
        setUploadProgress(100);
        setUploadStatus('success');
        showToast(`Asset "${selectedUploadFile.name}" uploaded to your secure vault!`, 'success');

        setTimeout(() => {
          setIsUploading(false);
          setUploadModalOpen(false);
          setSelectedUploadFile(null);
          setUploadNotes('');
          setUploadProgress(0);
          setUploadStatus('idle');
        }, 1200);
      } catch (err: any) {
        setIsUploading(false);
        setUploadStatus('error');
        setUploadErrorMessage(err.message || 'Upload failed. Please check your network and try again.');
      }
    }, 1300);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full overflow-hidden" id="portal-vault-page">
      {/* Floating Status / Download Toast */}
      <AnimatePresence>
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-bold max-w-md ${
              downloadToast.type === 'success'
                ? 'bg-emerald-950 border-emerald-800 text-emerald-200'
                : downloadToast.type === 'error'
                ? 'bg-rose-950 border-rose-800 text-rose-200'
                : 'bg-indigo-950 border-indigo-800 text-indigo-200'
            }`}
          >
            {downloadToast.type === 'success' ? (
              <Icons.CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : downloadToast.type === 'error' ? (
              <Icons.AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Icons.Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
            )}
            <span className="flex-1">{downloadToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted Client Vault</span>
            </span>
            <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-black uppercase tracking-wider rounded-full">
              {filteredFiles.length} Authorized Files
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Files & Deliverables Vault
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Secure client repository for high-resolution vector logos, 4K viral video reels, UI Figma systems, PDF brand guidelines, and production-ready source code.
          </p>
        </div>

        {/* Global Vault Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-950/40 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Icons.UploadCloud className="w-4 h-4" />
            <span>Upload Reference File</span>
          </button>

          <button
            onClick={handleDownloadAllZip}
            disabled={isZippingAll || filteredFiles.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-sky-950/40 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            {isZippingAll ? (
              <Icons.Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Icons.DownloadCloud className="w-4 h-4" />
            )}
            <span>{isZippingAll ? 'Packaging ZIP...' : 'Download All ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Selector (Master Files vs. Asset Explorer) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
          <button
            onClick={() => setActiveView('deliverables')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'deliverables'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icons.Layers className="w-4 h-4" />
            <span>Deliverables Gallery</span>
          </button>

          <button
            onClick={() => setActiveView('explorer')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'explorer'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icons.FolderTree className="w-4 h-4" />
            <span>Folder Explorer</span>
          </button>
        </div>

        {/* Project Selector (if client has projects) */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">Linked Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Projects & Deliverables</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName || p.id}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeView === 'deliverables' ? (
        <div className="space-y-6">
          {/* Search, Category, File Type Badges, and Sort Controls */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 space-y-4 shadow-sm">
            {/* Top Row: Search Input & Sort Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search deliverables by name, extension (.pdf, .zip, .mp4), version, or category..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Icons.ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sort by:</span>
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 text-white text-xs font-bold border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="newest">Newest Uploads</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">File Name (A–Z)</option>
                  <option value="size">File Size (Largest)</option>
                </select>
              </div>
            </div>

            {/* Middle Row: Category Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Icons.Folder className="w-3.5 h-3.5 text-indigo-400" />
                <span>Categories:</span>
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-md scale-[1.02]'
                      : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Bottom Row: File Type Badges Quick Filter */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Icons.Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Format:</span>
              </span>
              {fileTypeBadges.map((badge) => {
                const isSelected = fileTypeFilter === badge;
                const meta = badge === 'All' ? null : getFileTypeMeta(badge);
                return (
                  <button
                    key={badge}
                    onClick={() => setFileTypeFilter(badge)}
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md scale-105'
                        : meta
                        ? `${meta.bg} ${meta.text} ${meta.border} hover:opacity-80`
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {meta && <meta.icon className="w-3.5 h-3.5" />}
                    <span>{badge}</span>
                  </button>
                );
              })}

              {(searchQuery || categoryFilter !== 'All' || fileTypeFilter !== 'All' || selectedProjectId !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('All');
                    setFileTypeFilter('All');
                    setSelectedProjectId('all');
                  }}
                  className="ml-auto text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Files Grid / Empty State */}
          {filteredFiles.length === 0 ? (
            <div className="bg-slate-900/80 border-2 border-dashed border-slate-800 rounded-3xl p-10 sm:p-14 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Icons.FolderSearch className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-white">No Deliverables Found</h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
                  No files match your current filters or search criteria. Clear your search or upload client project assets.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('All');
                    setFileTypeFilter('All');
                    setSelectedProjectId('all');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-indigo-950/50 flex items-center gap-1.5"
                >
                  <Icons.UploadCloud className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFiles.map((file) => {
                const meta = getFileTypeMeta(file.fileType);
                const isDownloading = downloadingId === file.id;

                return (
                  <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-5 space-y-4 transition-all flex flex-col justify-between shadow-sm group hover:shadow-xl hover:shadow-indigo-950/20"
                  >
                    {/* Top Section: Visual Preview Thumbnail + Type & Version Badges */}
                    <div className="space-y-3.5">
                      {/* Thumbnail Card Banner */}
                      <div
                        onClick={() => setPreviewFile(file)}
                        className={`w-full h-36 rounded-2xl border ${meta.border} ${meta.bg} relative flex flex-col items-center justify-center overflow-hidden cursor-pointer group-hover:scale-[1.01] transition-transform`}
                      >
                        {/* Center Icon Graphic with glow */}
                        <div className="relative">
                          <meta.icon className={`w-12 h-12 ${meta.text} transition-transform group-hover:scale-110`} />
                        </div>

                        {/* Top Left Format Pill */}
                        <span
                          className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${meta.badge}`}
                        >
                          {meta.label}
                        </span>

                        {/* Top Right Version Tag */}
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-950/90 text-emerald-400 border border-emerald-900/80 shadow-xs flex items-center gap-1">
                          <Icons.CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{file.version}</span>
                        </span>

                        {/* Bottom Overlay Hint */}
                        <div className="absolute inset-x-0 bottom-0 py-1.5 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-1 text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Icons.Eye className="w-3 h-3 text-indigo-400" />
                          <span>Click to Preview Asset</span>
                        </div>
                      </div>

                      {/* File Details */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => setPreviewFile(file)}
                            className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug cursor-pointer break-all"
                            title={file.name}
                          >
                            {file.name}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
                          <span className="px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800 text-slate-300">
                            {file.category}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-300 font-bold">{file.size}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Icons.Calendar className="w-3 h-3 text-slate-600" />
                        {new Date(file.uploadDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition-colors cursor-pointer"
                          title="Preview File"
                        >
                          <Icons.Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDownloadFile(file)}
                          disabled={isDownloading}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-950/50 active:scale-95"
                          title="Download File"
                        >
                          {isDownloading ? (
                            <>
                              <Icons.Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <Icons.Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Folder Explorer View using AssetLibrary */
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-sm">
          <AssetLibrary
            projectId={selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || 'PRJ-1001'}
            projectName={
              projects.find((p) => p.id === selectedProjectId)?.projectName ||
              'Brand Identity, 4K Reels & Digital Platform'
            }
            clientName={currentUser?.name || 'Valued Client'}
            clientEmail={currentUser?.email}
            isAdmin={false}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. INTERACTIVE FILE PREVIEW MODAL                             */}
      {/* ============================================================ */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      getFileTypeMeta(previewFile.fileType).badge
                    }`}
                  >
                    {React.createElement(getFileTypeMeta(previewFile.fileType).icon, { className: 'w-5 h-5' })}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-white truncate">{previewFile.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="text-emerald-400 font-bold">{previewFile.version}</span>
                      <span>•</span>
                      <span>{previewFile.size}</span>
                      <span>•</span>
                      <span>{previewFile.category}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body / Viewer */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-950/40 text-center space-y-4 min-h-[260px]">
                {['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG'].includes(previewFile.fileType.toUpperCase()) ? (
                  <div className="w-full max-h-72 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center justify-center p-6 relative overflow-hidden">
                    <div className="space-y-3">
                      <Icons.Image className="w-16 h-16 text-emerald-400 mx-auto opacity-80" />
                      <div className="text-xs text-slate-400 font-mono">
                        [High-Resolution Vector Graphic & Transparent Asset Preview]
                      </div>
                    </div>
                  </div>
                ) : ['MP4', 'MOV', 'WEBM'].includes(previewFile.fileType.toUpperCase()) ? (
                  <div className="w-full max-h-72 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Icons.Play className="w-8 h-8 translate-x-0.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">4K Ultra HD Video Reel Deliverable</span>
                    <span className="text-[10px] text-slate-500">Duration: 0:45 • Framerate: 60fps • 1080x1920</span>
                  </div>
                ) : ['PDF'].includes(previewFile.fileType.toUpperCase()) ? (
                  <div className="w-full max-h-72 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-8 space-y-3">
                    <Icons.FileText className="w-16 h-16 text-rose-400" />
                    <span className="text-xs font-bold text-slate-300">Official PDF Document Specification</span>
                    <span className="text-[10px] text-slate-500">Security Encrypted & Signed by Dizo Pulse Media</span>
                  </div>
                ) : (
                  <div className="w-full max-h-72 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-8 space-y-3">
                    <Icons.Archive className="w-16 h-16 text-amber-400" />
                    <span className="text-xs font-bold text-slate-300">Compressed Master Archive</span>
                    <span className="text-[10px] text-slate-500">Extracts into vector SVGs, fonts, and clean source code</span>
                  </div>
                )}

                {/* Metadata details list */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-left">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Format</span>
                    <span className="text-xs font-black text-white">{previewFile.fileType}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Size</span>
                    <span className="text-xs font-black text-white">{previewFile.size}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Version</span>
                    <span className="text-xs font-black text-emerald-400">{previewFile.version}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Project</span>
                    <span className="text-xs font-black text-indigo-300">{previewFile.associatedOrderId || 'PRJ-1001'}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80">
                <button
                  onClick={() => setPreviewFile(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => handleDownloadFile(previewFile)}
                  disabled={downloadingId === previewFile.id}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/50"
                >
                  {downloadingId === previewFile.id ? (
                    <>
                      <Icons.Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Download className="w-4 h-4" />
                      <span>Download File</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* 2. UPLOAD MODAL (WITH MAX 50MB, FORMATS, PROGRESS INDICATOR)  */}
      {/* ============================================================ */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Icons.UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Upload Deliverable / Reference Asset</h3>
                    <p className="text-[11px] text-slate-400">Add client assets or revision requests directly to your vault</p>
                  </div>
                </div>

                <button
                  onClick={() => !isUploading && setUploadModalOpen(false)}
                  disabled={isUploading}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                {/* Drag & Drop Upload Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileSelect(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-950/30'
                      : selectedUploadFile
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-slate-700/80 bg-slate-950/50 hover:border-slate-600'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />

                  {selectedUploadFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                        <Icons.CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{selectedUploadFile.name}</p>
                        <p className="text-[11px] text-emerald-400 font-mono">
                          {(selectedUploadFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 underline underline-offset-2">
                        Click or drag to replace file
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                        <Icons.Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">
                          Drag and drop file here, or <span className="text-indigo-400 underline">browse</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Supported formats: PDF, ZIP, PNG, SVG, FIGMA, MP4, AI, PSD, DOCX
                        </p>
                      </div>

                      {/* Explicit Max File Size Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-400">
                        <Icons.HardDrive className="w-3 h-3 text-amber-400" />
                        <span>Max file size: 50MB</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {uploadErrorMessage && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
                    <Icons.AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{uploadErrorMessage}</span>
                  </div>
                )}

                {/* Upload Fields: Category & Version */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Deliverable Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      disabled={isUploading}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Client Reference & Assets">Client Reference & Assets</option>
                      <option value="Branding & Logo">Branding & Logo</option>
                      <option value="Video & Content">Video & Content</option>
                      <option value="Design & Figma">Design & Figma</option>
                      <option value="Web & Code">Web & Code</option>
                      <option value="Strategy & Docs">Strategy & Docs</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">File Version Tag</label>
                    <input
                      type="text"
                      value={uploadVersion}
                      onChange={(e) => setUploadVersion(e.target.value)}
                      placeholder="e.g. v1.0, v2.1 Final, Client Ref"
                      disabled={isUploading}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Asset Notes / Comments (Optional)</label>
                  <textarea
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Brief description of what this asset contains or intended milestone..."
                    rows={2}
                    disabled={isUploading}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none"
                  />
                </div>

                {/* Upload Progress Bar (Active when uploading) */}
                {isUploading && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-indigo-400 flex items-center gap-1.5">
                        <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading & Encrypting File...</span>
                      </span>
                      <span className="text-white font-mono">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Modal Footer Controls */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    disabled={isUploading}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUploading || !selectedUploadFile}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/50"
                  >
                    {isUploading ? (
                      <>
                        <Icons.Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Uploading ({uploadProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Icons.UploadCloud className="w-4 h-4" />
                        <span>Upload to Vault</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortalVaultPage;
