import React, { useState, useEffect, useMemo } from 'react';
import { showToast, EmptyState } from './UIPolish';
import {
  Folder,
  FolderPlus,
  File,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  Upload,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  ChevronRight,
  History,
  Tag,
  Lock,
  Plus,
  Edit3,
  Trash2,
  FileArchive,
  ArrowUpDown,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { ProjectAsset, FileVersion, AssetFolder, AssetStatus, ProjectAssetStats } from '../types';

interface AssetLibraryProps {
  projectId: string;
  projectName?: string;
  clientName?: string;
  clientEmail?: string; // If passed, enforces client-mode security query
  isAdmin?: boolean;
  uploadedByDefault?: string;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  projectId,
  projectName,
  clientName,
  clientEmail,
  isAdmin = false,
  uploadedByDefault = 'Dizo Admin'
}) => {
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [stats, setStats] = useState<ProjectAssetStats>({ totalFiles: 0, finalFiles: 0, totalSizeBytes: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Sorting state
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [previewModalAsset, setPreviewModalAsset] = useState<{ asset: ProjectAsset; version: FileVersion } | null>(null);
  const [detailsModalAsset, setDetailsModalAsset] = useState<ProjectAsset | null>(null);
  const [versionUploadAsset, setVersionUploadAsset] = useState<ProjectAsset | null>(null);

  // Multi-select for ZIP download
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Admin Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAssetName, setUploadAssetName] = useState('');
  const [uploadFolderId, setUploadFolderId] = useState('');
  const [uploadFolderName, setUploadFolderName] = useState('');
  const [uploadVersionNum, setUploadVersionNum] = useState('v1.0');
  const [uploadStatus, setUploadStatus] = useState<AssetStatus>('Draft');
  const [uploadIsClientVisible, setUploadIsClientVisible] = useState(true);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVersionNotes, setUploadVersionNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // Custom Folder Form State
  const [newFolderNameInput, setNewFolderNameInput] = useState('');

  // Fetch Folders and Assets
  const fetchFoldersAndAssets = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch Folders
      const foldersRes = await fetch(`/api/projects/${projectId}/folders`);
      if (foldersRes.ok) {
        const fldData = await foldersRes.json();
        setFolders(fldData);
      }

      // 2. Fetch Assets
      let url = `/api/projects/${projectId}/assets?includeArchived=${showArchived}`;
      if (clientEmail) {
        url += `&email=${encodeURIComponent(clientEmail)}`;
      }

      const assetsRes = await fetch(url);
      if (!assetsRes.ok) {
        if (assetsRes.status === 403) {
          throw new Error('Unauthorized: You do not have access to this asset library.');
        }
        throw new Error('Failed to load asset files.');
      }

      const resData = await assetsRes.json();
      setAssets(resData.assets || []);
      if (resData.stats) {
        setStats(resData.stats);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching asset library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoldersAndAssets();
  }, [projectId, clientEmail, showArchived]);

  // Handle Folder Selection
  const activeFolders = useMemo(() => {
    return folders.filter((f) => showArchived || !f.isArchived);
  }, [folders, showArchived]);

  // Filtered & Sorted Assets
  const processedAssets = useMemo(() => {
    let result = [...assets];

    // Filter by Folder
    if (selectedFolderId !== 'all') {
      result = result.filter(
        (a) => a.folderId === selectedFolderId || a.folderName.toLowerCase() === selectedFolderId.toLowerCase()
      );
    }

    // Filter by Status
    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.assetName.toLowerCase().includes(q) ||
          a.folderName.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q) ||
          a.currentVersion?.fileName.toLowerCase().includes(q) ||
          a.currentVersion?.versionNumber.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return a.assetName.localeCompare(b.assetName);
      }
      if (sortBy === 'size') {
        return (b.currentVersion?.fileSize || 0) - (a.currentVersion?.fileSize || 0);
      }
      return 0;
    });

    return result;
  }, [assets, selectedFolderId, statusFilter, searchQuery, sortBy]);

  // Helper for Formatting Bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper for File Type Icon
  const renderFileIcon = (fileType: string = '', fileName: string = '') => {
    const type = fileType.toLowerCase();
    const name = fileName.toLowerCase();

    if (type.includes('image') || name.match(/\.(png|jpg|jpeg|webp|svg|gif)$/)) {
      return <ImageIcon className="w-5 h-5 text-cyan-400" />;
    }
    if (type.includes('video') || name.match(/\.(mp4|webm|mov|mkv)$/)) {
      return <Video className="w-5 h-5 text-purple-400" />;
    }
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (name.match(/\.(zip|rar|7z|tar|gz)$/)) {
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    }
    return <File className="w-5 h-5 text-indigo-400" />;
  };

  // Single File Download Trigger
  const handleSingleDownload = (fileUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Download Started', `Downloading ${fileName}`, 'info');
    } catch (e) {
      showToast('Download Error', `Could not download file: ${fileName}. Check browser permissions.`, 'error');
    }
  };

  // ZIP Download for Multiple Selected Assets
  const handleBatchZipDownload = async () => {
    if (selectedAssetIds.length === 0) return;
    setIsZipping(true);
    setZipProgress(10);

    try {
      const zip = new JSZip();
      const selectedAssets = assets.filter((a) => selectedAssetIds.includes(a.id));

      for (let i = 0; i < selectedAssets.length; i++) {
        const asset = selectedAssets[i];
        const ver = asset.currentVersion;
        const folderName = asset.folderName || 'Uncategorized';
        const fileFolder = zip.folder(folderName);

        if (ver.fileUrl.startsWith('data:')) {
          const base64Data = ver.fileUrl.split(',')[1];
          fileFolder?.file(ver.fileName, base64Data, { base64: true });
        } else if (ver.fileUrl.startsWith('http')) {
          try {
            const resp = await fetch(ver.fileUrl);
            const blob = await resp.blob();
            fileFolder?.file(ver.fileName, blob);
          } catch {
            fileFolder?.file(`${ver.fileName}.txt`, `Reference URL: ${ver.fileUrl}`);
          }
        } else {
          fileFolder?.file(ver.fileName, ver.fileUrl);
        }

        setZipProgress(Math.round(((i + 1) / selectedAssets.length) * 80));
      }

      setZipProgress(90);
      const content = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `${projectId}_Asset_Bundle_${new Date().toISOString().slice(0, 10)}.zip`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSelectedAssetIds([]);
      showToast('ZIP Bundle Created', `Downloaded ${selectedAssets.length} asset(s) as ZIP archive.`, 'success');
    } catch (err: any) {
      showToast('ZIP Error', `ZIP Creation Error: ${err.message || 'Failed to assemble ZIP package'}`, 'error');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  // Admin New Folder Handler
  const handleCreateFolder = async () => {
    if (!newFolderNameInput.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          folderName: newFolderNameInput.trim()
        })
      });

      if (res.ok) {
        const updatedFolders = await res.json();
        setFolders(updatedFolders);
        setNewFolderNameInput('');
        setNewFolderModalOpen(false);
      }
    } catch (e) {
      console.error('Failed to create folder', e);
    }
  };

  // Admin File Upload Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile && !versionUploadAsset) {
      showToast('Validation Error', 'Please select a file to upload.', 'warning');
      return;
    }

    setUploading(true);

    try {
      let fileDataUrl = '';
      let fName = uploadFile?.name || 'Asset_File';
      let fType = uploadFile?.type || 'application/octet-stream';
      let fSize = uploadFile?.size || 0;

      if (uploadFile) {
        fileDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });
      }

      const targetFld = folders.find((f) => f.id === uploadFolderId) || folders[0];

      const payload = {
        existingAssetId: versionUploadAsset ? versionUploadAsset.id : undefined,
        assetName: uploadAssetName.trim() || fName,
        folderId: uploadFolderId || targetFld?.id || 'fld-final',
        folderName: targetFld?.name || 'Final Delivery',
        versionNumber: uploadVersionNum || 'v1.0',
        status: uploadStatus,
        isClientVisible: uploadIsClientVisible,
        description: uploadDescription,
        versionNotes: uploadVersionNotes,
        uploadedBy: uploadedByDefault,
        fileName: fName,
        fileType: fType,
        fileSize: fSize,
        fileDataUrl: fileDataUrl
      };

      const res = await fetch(`/api/projects/${projectId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchFoldersAndAssets();
        setUploadModalOpen(false);
        setVersionUploadAsset(null);
        showToast('Asset Uploaded', `Successfully uploaded ${payload.assetName}`, 'success');
        // Reset fields
        setUploadFile(null);
        setUploadAssetName('');
        setUploadDescription('');
        setUploadVersionNotes('');
        setUploadVersionNum('v1.0');
      } else {
        const errData = await res.json();
        showToast('Upload Failed', `Upload error: ${errData.error || 'Failed to upload asset'}`, 'error');
      }
    } catch (e: any) {
      showToast('Upload Exception', `Upload exception: ${e.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Toggle Client Visibility (Admin Action)
  const handleToggleVisibility = async (asset: ProjectAsset) => {
    try {
      const newVis = !asset.isClientVisible;
      const res = await fetch(`/api/projects/${projectId}/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClientVisible: newVis })
      });

      if (res.ok) {
        fetchFoldersAndAssets();
        if (detailsModalAsset && detailsModalAsset.id === asset.id) {
          setDetailsModalAsset({ ...detailsModalAsset, isClientVisible: newVis });
        }
      }
    } catch (e) {
      console.error('Failed to toggle visibility', e);
    }
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedAssetIds.length === processedAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(processedAssets.map((a) => a.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR & SUMMARY STATS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md text-[10px] font-black uppercase tracking-wider">
                Asset Vault
              </span>
              <span className="text-xs text-slate-400">ID: {projectId}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Project File & Deliverable Library
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure digital delivery, versioned files, and production assets for {businessOrClient(projectName, clientName)}.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
              <p className="text-[10px] font-bold uppercase text-slate-400">Total Assets</p>
              <p className="text-base font-black text-white">{stats.totalFiles || processedAssets.length}</p>
            </div>
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
              <p className="text-[10px] font-bold uppercase text-emerald-400">Final Approved</p>
              <p className="text-base font-black text-emerald-400">{stats.finalFiles}</p>
            </div>
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl hidden sm:block">
              <p className="text-[10px] font-bold uppercase text-slate-400">Total Size</p>
              <p className="text-base font-black text-cyan-300">{formatBytes(stats.totalSizeBytes)}</p>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setVersionUploadAsset(null);
                  setUploadModalOpen(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/10 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload Asset
              </button>
            )}
          </div>
        </div>

        {/* FOLDER NAVIGATION BAR */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-cyan-400" /> Folders & Categories
            </h3>
            {isAdmin && (
              <button
                onClick={() => setNewFolderModalOpen(true)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" /> + Custom Folder
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            <button
              onClick={() => setSelectedFolderId('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                selectedFolderId === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              All Assets ({assets.length})
            </button>

            {activeFolders.map((fld) => {
              const count = assets.filter((a) => a.folderId === fld.id || a.folderName === fld.name).length;
              return (
                <button
                  key={fld.id}
                  onClick={() => setSelectedFolderId(fld.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    selectedFolderId === fld.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800/80'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 opacity-70" />
                  {fld.name}
                  <span className="px-1.5 py-0.2 bg-slate-900 text-[10px] rounded-full text-slate-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SEARCH, FILTERS & BATCH DOWNLOAD CONTROLS */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assets by file name, version, folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Final">Final Delivery</option>
              <option value="In Review">In Review</option>
              {isAdmin && <option value="Draft">Draft (Admin Only)</option>}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">File Size</option>
            </select>

            {/* Select All Checkbox for Multi-Download */}
            {processedAssets.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                {selectedAssetIds.length === processedAssets.length ? (
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                Select All
              </button>
            )}

            {/* Batch ZIP Download Button */}
            {selectedAssetIds.length > 0 && (
              <button
                onClick={handleBatchZipDownload}
                disabled={isZipping}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Packaging ZIP ({zipProgress}%)...
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4" /> Download Selected ({selectedAssetIds.length} ZIP)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE IF ANY */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          {errorMsg}
        </div>
      )}

      {/* ASSET GRID / LIST (COMPACT RESPONSIVE MOBILE-FIRST CARDS) */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading asset vault...</p>
        </div>
      ) : processedAssets.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <Folder className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-white">No Assets Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            There are no files uploaded in this category yet. Files added by the design team will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedAssets.map((asset) => {
            const curVer = asset.currentVersion;
            const isSelected = selectedAssetIds.includes(asset.id);

            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group relative bg-slate-900/80 hover:bg-slate-900 border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500 ring-1 ring-cyan-500/50 bg-cyan-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* TOP ROW: SELECT CHECKBOX & BADGES */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (isSelected) {
                          setSelectedAssetIds(selectedAssetIds.filter((id) => id !== asset.id));
                        } else {
                          setSelectedAssetIds([...selectedAssetIds, asset.id]);
                        }
                      }}
                      className="text-slate-500 hover:text-cyan-400 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>

                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] font-bold text-slate-400 uppercase">
                      {asset.folderName}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5">
                    {asset.status === 'Final' && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" /> FINAL
                      </span>
                    )}
                    {asset.status === 'In Review' && (
                      <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        In Review
                      </span>
                    )}
                    {asset.status === 'Draft' && (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-md text-[10px] font-bold uppercase">
                        Draft
                      </span>
                    )}

                    {/* Admin Only Badge */}
                    {isAdmin && !asset.isClientVisible && (
                      <span
                        title="Admin Only (Client cannot see)"
                        className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-[10px] font-bold flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" /> Hidden
                      </span>
                    )}
                  </div>
                </div>

                {/* FILE PREVIEW THUMBNAIL / CARD HEADER */}
                <div
                  onClick={() => setPreviewModalAsset({ asset, version: curVer })}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 mb-3 cursor-pointer hover:border-cyan-500/40 transition-all flex items-center gap-3 group-hover:bg-slate-950/80"
                >
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex-shrink-0">
                    {renderFileIcon(curVer?.fileType, curVer?.fileName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {asset.assetName}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                      {curVer?.fileName}
                    </p>
                  </div>
                </div>

                {/* METADATA SUMMARY */}
                <div className="space-y-1.5 text-[11px] text-slate-400 mb-4 px-1">
                  <div className="flex justify-between items-center">
                    <span>Current Version:</span>
                    <span className="font-bold text-white bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {curVer?.versionNumber || 'v1.0'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Size:</span>
                    <span className="text-slate-300">{formatBytes(curVer?.fileSize || 0)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Uploaded:</span>
                    <span className="text-slate-400">
                      {new Date(curVer?.uploadDate || asset.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewModalAsset({ asset, version: curVer })}
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
                  </button>

                  <button
                    onClick={() => handleSingleDownload(curVer.fileUrl, curVer.fileName)}
                    className="flex-1 py-2 bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" /> Download
                  </button>

                  <button
                    onClick={() => setDetailsModalAsset(asset)}
                    title="View details & version history"
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      <AnimatePresence>
        {previewModalAsset && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {renderFileIcon(previewModalAsset.version.fileType, previewModalAsset.version.fileName)}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {previewModalAsset.asset.assetName} ({previewModalAsset.version.versionNumber})
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {previewModalAsset.version.fileName} • {formatBytes(previewModalAsset.version.fileSize)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleSingleDownload(
                        previewModalAsset.version.fileUrl,
                        previewModalAsset.version.fileName
                      )
                    }
                    className="px-3 py-1.5 bg-cyan-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-cyan-500"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File
                  </button>
                  <button
                    onClick={() => setPreviewModalAsset(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Preview Canvas */}
              <div className="p-6 bg-slate-950/60 overflow-auto flex-1 flex items-center justify-center min-h-[350px]">
                {previewModalAsset.version.fileType.includes('image') ||
                previewModalAsset.version.fileName.match(/\.(png|jpg|jpeg|webp|svg|gif)$/i) ? (
                  <img
                    src={previewModalAsset.version.fileUrl}
                    alt={previewModalAsset.asset.assetName}
                    className="max-h-[65vh] max-w-full object-contain rounded-lg border border-slate-800 shadow-xl"
                  />
                ) : previewModalAsset.version.fileType.includes('video') ||
                  previewModalAsset.version.fileName.match(/\.(mp4|webm|mov)$/i) ? (
                  <video
                    controls
                    autoPlay
                    src={previewModalAsset.version.fileUrl}
                    className="max-h-[65vh] w-full max-w-2xl rounded-lg border border-slate-800 shadow-xl"
                  />
                ) : previewModalAsset.version.fileType.includes('pdf') ||
                  previewModalAsset.version.fileName.endsWith('.pdf') ? (
                  <iframe
                    src={previewModalAsset.version.fileUrl}
                    title="PDF Preview"
                    className="w-full h-[65vh] rounded-lg border border-slate-800 bg-white"
                  />
                ) : previewModalAsset.version.fileType.includes('text') ||
                  previewModalAsset.version.fileName.endsWith('.txt') ? (
                  <div className="w-full max-h-[60vh] bg-slate-950 p-4 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-auto whitespace-pre-wrap">
                    {previewModalAsset.version.description || 'Text preview container'}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <File className="w-16 h-16 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Direct browser preview is not supported for this file format ({previewModalAsset.version.fileName}).
                    </p>
                    <button
                      onClick={() =>
                        handleSingleDownload(
                          previewModalAsset.version.fileUrl,
                          previewModalAsset.version.fileName
                        )
                      }
                      className="px-5 py-2.5 bg-cyan-600 text-white font-bold text-xs uppercase rounded-xl cursor-pointer hover:bg-cyan-500"
                    >
                      Download File Directly
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FILE DETAILS & VERSION HISTORY MODAL */}
      <AnimatePresence>
        {detailsModalAsset && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase rounded border border-cyan-500/20">
                    {detailsModalAsset.folderName}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {detailsModalAsset.assetName}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailsModalAsset(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Description */}
                {detailsModalAsset.currentVersion?.description && (
                  <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-300">
                      {detailsModalAsset.currentVersion.description}
                    </p>
                  </div>
                )}

                {/* Metadata Table */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Status</span>
                    <span className="font-bold text-white mt-0.5 block">{detailsModalAsset.status}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Latest Version</span>
                    <span className="font-bold text-cyan-300 mt-0.5 block">
                      {detailsModalAsset.currentVersion?.versionNumber}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">File Size</span>
                    <span className="text-slate-300 mt-0.5 block">
                      {formatBytes(detailsModalAsset.currentVersion?.fileSize || 0)}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Uploaded By</span>
                    <span className="text-slate-300 mt-0.5 block">
                      {detailsModalAsset.currentVersion?.uploadedBy || 'Team'}
                    </span>
                  </div>
                </div>

                {/* VERSION HISTORY LIST */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-cyan-400" /> Version History ({detailsModalAsset.versionHistory?.length || 1})
                    </h4>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setVersionUploadAsset(detailsModalAsset);
                          setUploadAssetName(detailsModalAsset.assetName);
                          setUploadFolderId(detailsModalAsset.folderId);
                          setUploadFolderId(detailsModalAsset.folderId);
                          const currentVerNum = detailsModalAsset.currentVersion?.versionNumber || 'v1.0';
                          setUploadVersionNum(incrementVersionString(currentVerNum));
                          setUploadModalOpen(true);
                          setDetailsModalAsset(null);
                        }}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Upload New Version
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(detailsModalAsset.versionHistory || [detailsModalAsset.currentVersion]).map((ver) => (
                      <div
                        key={ver.versionId}
                        className="bg-slate-950 p-3 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{ver.versionNumber}</span>
                            {ver.isCurrent && (
                              <span className="px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-black uppercase rounded">
                                LATEST
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">
                              {new Date(ver.uploadDate).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {ver.fileName} ({formatBytes(ver.fileSize)})
                          </p>
                          {ver.versionNotes && (
                            <p className="text-[10px] text-slate-500 mt-1 italic">
                              "{ver.versionNotes}"
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleSingleDownload(ver.fileUrl, ver.fileName)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-cyan-400" /> Get
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ADMIN EXTRA CONTROLS */}
                {isAdmin && (
                  <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => handleToggleVisibility(detailsModalAsset)}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      {detailsModalAsset.isClientVisible ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-rose-400" /> Make Admin Only
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-cyan-400" /> Make Client Visible
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN UPLOAD ASSET MODAL */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  {versionUploadAsset ? `Upload New Version for ${versionUploadAsset.assetName}` : 'Upload New Project Asset'}
                </h3>
                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    setVersionUploadAsset(null);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                {/* File Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    File Attachment *
                  </label>
                  <input
                    type="file"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setUploadFile(file);
                        if (!uploadAssetName) {
                          setUploadAssetName(file.name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-2"
                  />
                </div>

                {/* Asset Name */}
                {!versionUploadAsset && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Asset Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Master Vector Logo Pack"
                      value={uploadAssetName}
                      onChange={(e) => setUploadAssetName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {/* Folder & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target Folder</label>
                    <select
                      value={uploadFolderId}
                      onChange={(e) => setUploadFolderId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {activeFolders.map((fld) => (
                        <option key={fld.id} value={fld.id}>
                          {fld.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Status</label>
                    <select
                      value={uploadStatus}
                      onChange={(e) => setUploadStatus(e.target.value as AssetStatus)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Draft">Draft (Internal)</option>
                      <option value="In Review">In Review</option>
                      <option value="Final">Final Approved</option>
                    </select>
                  </div>
                </div>

                {/* Version Number & Version Notes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Version Number</label>
                    <input
                      type="text"
                      placeholder="e.g. v1.0 or v2.1 Final"
                      value={uploadVersionNum}
                      onChange={(e) => setUploadVersionNum(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Client Visible?</label>
                    <select
                      value={uploadIsClientVisible ? 'yes' : 'no'}
                      onChange={(e) => setUploadIsClientVisible(e.target.value === 'yes')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="yes">Yes (Visible in Client Dashboard)</option>
                      <option value="no">No (Admin Only)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Version Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Adjusted vector contrast and color codes"
                    value={uploadVersionNotes}
                    onChange={(e) => setUploadVersionNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="File details or specifications..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadModalOpen(false);
                      setVersionUploadAsset(null);
                    }}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Save Asset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW CUSTOM FOLDER MODAL */}
      <AnimatePresence>
        {newFolderModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-cyan-400" /> Create Custom Asset Folder
                </h3>
                <button
                  onClick={() => setNewFolderModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ad Creatives Q3"
                  value={newFolderNameInput}
                  onChange={(e) => setNewFolderNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setNewFolderModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderNameInput.trim()}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper for incrementing version strings e.g. "v1.0" -> "v1.1"
function incrementVersionString(ver: string): string {
  const match = ver.match(/v?(\d+)\.(\d+)/i);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10) + 1;
    return `v${major}.${minor}`;
  }
  return 'v2.0';
}

function businessOrClient(pName?: string, cName?: string): string {
  if (pName) return pName;
  if (cName) return cName;
  return 'this project';
}
