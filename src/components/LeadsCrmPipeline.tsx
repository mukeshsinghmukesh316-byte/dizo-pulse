import React, { useState, useMemo, useRef } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast, EmptyState } from './UIPolish';
import { AdminDataTable, ColumnDef } from './AdminDataTable';
import { Inquiry, Service, InquiryStatus, InquiryPriority, ContactHistoryItem, InquiryNote } from '../types';

interface LeadsCrmPipelineProps {
  inquiries: Inquiry[];
  servicesList?: Service[];
  staffList?: any[];
  userRole: 'super_admin' | 'admin' | 'manager' | 'staff';
  userName?: string;
  userEmail?: string;
  userPermissions?: any;
  onRefreshInquiries: () => Promise<void>;
  onConvertInquiryToProposal: (inquiry: Inquiry) => void;
  onOpenAddLeadModal: () => void;
}

export const STAGES: {
  id: InquiryStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  icon: any;
  probability: number;
}[] = [
  {
    id: 'new',
    label: 'New Inquiry',
    color: 'blue',
    bgColor: 'bg-blue-50/60',
    borderColor: 'border-blue-200/80',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Icons.Inbox,
    probability: 20
  },
  {
    id: 'reviewing',
    label: 'Reviewing',
    color: 'cyan',
    bgColor: 'bg-cyan-50/60',
    borderColor: 'border-cyan-200/80',
    textColor: 'text-cyan-700',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: Icons.Search,
    probability: 35
  },
  {
    id: 'contacted',
    label: 'Contacted',
    color: 'amber',
    bgColor: 'bg-amber-50/60',
    borderColor: 'border-amber-200/80',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Icons.PhoneCall,
    probability: 50
  },
  {
    id: 'proposal_sent',
    label: 'Proposal Sent',
    color: 'purple',
    bgColor: 'bg-purple-50/60',
    borderColor: 'border-purple-200/80',
    textColor: 'text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Icons.FileText,
    probability: 75
  },
  {
    id: 'contract_signed',
    label: 'Contract Signed',
    color: 'teal',
    bgColor: 'bg-teal-50/60',
    borderColor: 'border-teal-200/80',
    textColor: 'text-teal-700',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: Icons.FileCheck,
    probability: 90
  },
  {
    id: 'project_active',
    label: 'Project Active',
    color: 'indigo',
    bgColor: 'bg-indigo-50/60',
    borderColor: 'border-indigo-200/80',
    textColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Icons.Rocket,
    probability: 100
  },
  {
    id: 'completed',
    label: 'Completed',
    color: 'emerald',
    bgColor: 'bg-emerald-50/60',
    borderColor: 'border-emerald-200/80',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Icons.CheckCircle2,
    probability: 100
  },
  {
    id: 'closed', // map closed / lost
    label: 'Lost / Closed',
    color: 'rose',
    bgColor: 'bg-rose-50/40',
    borderColor: 'border-rose-200/60',
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: Icons.XCircle,
    probability: 0
  }
];

export const LeadsCrmPipeline: React.FC<LeadsCrmPipelineProps> = ({
  inquiries,
  servicesList = [],
  staffList = [],
  userRole,
  userName = 'Operator',
  onRefreshInquiries,
  onConvertInquiryToProposal,
  onOpenAddLeadModal
}) => {
  // View mode
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Kanban Horizontal Scroll Container Ref
  const kanbanScrollRef = useRef<HTMLDivElement>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Selection state
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<string[]>([]);

  // Drawer / Modal Lead state
  const [activeDrawerInquiry, setActiveDrawerInquiry] = useState<Inquiry | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'history' | 'notes' | 'quote'>('details');

  // Interactive drawer note inputs
  const [newNoteText, setNewNoteText] = useState('');
  const [newHistoryType, setNewHistoryType] = useState<'call' | 'whatsapp' | 'email' | 'meeting' | 'note'>('call');
  const [newHistorySummary, setNewHistorySummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Drag and Drop state
  const [draggedInquiryId, setDraggedInquiryId] = useState<string | null>(null);

  // Role permissions
  const canDelete = userRole === 'super_admin' || userRole === 'admin';

  // Helper to resolve stage ID normalization (e.g. 'lost' -> 'closed')
  const normalizeStatus = (status?: string): InquiryStatus => {
    if (!status) return 'new';
    if (status === 'lost') return 'closed';
    return status as InquiryStatus;
  };

  // --- DEDUPLICATION LOGIC (Guarantees unique records by ID across whole pipeline) ---
  const uniqueInquiries = useMemo(() => {
    if (!Array.isArray(inquiries)) return [];
    const map = new Map<string, Inquiry>();
    for (const inq of inquiries) {
      if (!inq) continue;
      const key = inq.id || (inq as any)._id;
      if (key && !map.has(key)) {
        map.set(key, inq);
      }
    }
    return Array.from(map.values());
  }, [inquiries]);

  // --- FILTERING LOGIC (Applied to deduplicated data) ---
  const filteredInquiries = useMemo(() => {
    return uniqueInquiries.filter(inq => {
      // Archive filter
      if (showArchived ? !inq.archived : inq.archived) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = inq.clientName?.toLowerCase().includes(query);
        const matchBusiness = inq.businessName?.toLowerCase().includes(query);
        const matchEmail = inq.email?.toLowerCase().includes(query);
        const matchPhone = inq.whatsapp?.includes(query);
        const matchId = inq.id?.toLowerCase().includes(query);
        const matchNiche = inq.businessNiche?.toLowerCase().includes(query);
        if (!matchName && !matchBusiness && !matchEmail && !matchPhone && !matchId && !matchNiche) {
          return false;
        }
      }

      // Stage filter
      if (stageFilter !== 'all') {
        if (normalizeStatus(inq.status) !== stageFilter) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        const p = inq.priority || 'medium';
        if (p !== priorityFilter) {
          return false;
        }
      }

      // Staff filter
      if (staffFilter !== 'all') {
        if (staffFilter === 'unassigned') {
          if (inq.assignedStaffId) return false;
        } else {
          if (inq.assignedStaffId !== staffFilter) return false;
        }
      }

      // Service filter
      if (serviceFilter !== 'all') {
        if (!inq.services || !inq.services.includes(serviceFilter)) {
          return false;
        }
      }

      // Date Range Filter
      if (dateRangeFilter !== 'all') {
        const createdDate = new Date(inq.createdAt).getTime();
        const now = new Date().getTime();
        const dayMs = 24 * 60 * 60 * 1000;

        if (dateRangeFilter === 'today' && now - createdDate > dayMs) return false;
        if (dateRangeFilter === 'week' && now - createdDate > 7 * dayMs) return false;
        if (dateRangeFilter === 'month' && now - createdDate > 30 * dayMs) return false;
      }

      return true;
    });
  }, [uniqueInquiries, showArchived, searchTerm, stageFilter, priorityFilter, staffFilter, serviceFilter, dateRangeFilter]);

  // Smooth scroll handler for Kanban board
  const scrollKanban = (direction: 'left' | 'right') => {
    if (kanbanScrollRef.current) {
      const scrollOffset = direction === 'left' ? -360 : 360;
      kanbanScrollRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // --- STATS CALCULATIONS ---
  const stats = useMemo(() => {
    let totalVal = 0;
    let forecastVal = 0;
    let urgentCount = 0;
    let highCount = 0;
    let closedCount = 0;

    filteredInquiries.forEach(inq => {
      const val = inq.totalDiscounted || inq.totalOriginal || 0;
      totalVal += val;

      const normSt = normalizeStatus(inq.status);
      const stageConfig = STAGES.find(s => s.id === normSt);
      const prob = stageConfig ? stageConfig.probability : 50;
      forecastVal += (val * prob) / 100;

      if (inq.priority === 'urgent') urgentCount++;
      if (inq.priority === 'high') highCount++;
      if (normSt === 'completed' || normSt === 'contract_signed' || normSt === 'project_active') closedCount++;
    });

    const convRate = filteredInquiries.length > 0 ? Math.round((closedCount / filteredInquiries.length) * 100) : 0;

    return {
      totalLeads: filteredInquiries.length,
      totalVal,
      forecastVal,
      convRate,
      urgentCount,
      highCount
    };
  }, [filteredInquiries]);

  // --- API HANDLERS ---
  const updateInquiryStatus = async (inquiryId: string, newStatus: InquiryStatus) => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        if (activeDrawerInquiry && activeDrawerInquiry.id === inquiryId) {
          setActiveDrawerInquiry(prev => prev ? { ...prev, status: newStatus } : null);
        }
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    }
  };

  const updateInquiryPriority = async (inquiryId: string, priority: InquiryPriority) => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      });
      if (res.ok) {
        if (activeDrawerInquiry && activeDrawerInquiry.id === inquiryId) {
          setActiveDrawerInquiry(prev => prev ? { ...prev, priority } : null);
        }
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Failed to update inquiry priority:', err);
    }
  };

  const assignInquiryStaff = async (inquiryId: string, staffId: string, staffName: string) => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedStaffId: staffId, assignedStaffName: staffName })
      });
      if (res.ok) {
        if (activeDrawerInquiry && activeDrawerInquiry.id === inquiryId) {
          setActiveDrawerInquiry(prev => prev ? { ...prev, assignedStaffId: staffId, assignedStaffName: staffName } : null);
        }
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Failed to assign staff:', err);
    }
  };

  const handleAddInternalNote = async () => {
    if (!activeDrawerInquiry || !newNoteText.trim()) return;
    setIsSaving(true);
    try {
      const existingNotes: InquiryNote[] = activeDrawerInquiry.internalNotesList || [];
      const newNote: InquiryNote = {
        id: 'note_' + Math.random().toString(36).substr(2, 7),
        timestamp: new Date().toISOString(),
        author: userName || 'Staff',
        content: newNoteText.trim()
      };
      const updatedNotes = [newNote, ...existingNotes];

      const res = await fetch(`/api/inquiries/${activeDrawerInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotesList: updatedNotes })
      });

      if (res.ok) {
        setNewNoteText('');
        setActiveDrawerInquiry({ ...activeDrawerInquiry, internalNotesList: updatedNotes });
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddContactHistory = async () => {
    if (!activeDrawerInquiry || !newHistorySummary.trim()) return;
    setIsSaving(true);
    try {
      const existingHistory: ContactHistoryItem[] = activeDrawerInquiry.contactHistory || [];
      const newEntry: ContactHistoryItem = {
        id: 'hist_' + Math.random().toString(36).substr(2, 7),
        timestamp: new Date().toISOString(),
        type: newHistoryType,
        author: userName || 'Staff',
        summary: newHistorySummary.trim()
      };
      const updatedHistory = [newEntry, ...existingHistory];

      const res = await fetch(`/api/inquiries/${activeDrawerInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactHistory: updatedHistory })
      });

      if (res.ok) {
        setNewHistorySummary('');
        setActiveDrawerInquiry({ ...activeDrawerInquiry, contactHistory: updatedHistory });
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Error adding contact history:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDealValue = async (newVal: number) => {
    if (!activeDrawerInquiry) return;
    try {
      const res = await fetch(`/api/inquiries/${activeDrawerInquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalDiscounted: newVal })
      });
      if (res.ok) {
        setActiveDrawerInquiry({ ...activeDrawerInquiry, totalDiscounted: newVal });
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Error updating value:', err);
    }
  };

  const handleArchiveToggle = async (inquiryId: string, currentArchived?: boolean) => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !currentArchived })
      });
      if (res.ok) {
        if (activeDrawerInquiry && activeDrawerInquiry.id === inquiryId) {
          setActiveDrawerInquiry(null);
        }
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Error toggling archive:', err);
    }
  };

  const handleDeleteLead = async (inquiryId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this lead?')) return;
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeDrawerInquiry && activeDrawerInquiry.id === inquiryId) {
          setActiveDrawerInquiry(null);
        }
        setSelectedInquiryIds(prev => prev.filter(id => id !== inquiryId));
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  // --- BULK OPERATIONS ---
  const handleBulkStatusChange = async (newStatus: InquiryStatus) => {
    if (selectedInquiryIds.length === 0) return;
    try {
      const res = await fetch('/api/inquiries-bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedInquiryIds, status: newStatus })
      });
      if (res.ok) {
        setSelectedInquiryIds([]);
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Bulk status change failed:', err);
    }
  };

  const handleBulkPriorityChange = async (priority: InquiryPriority) => {
    if (selectedInquiryIds.length === 0) return;
    try {
      const res = await fetch('/api/inquiries-bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedInquiryIds, priority })
      });
      if (res.ok) {
        setSelectedInquiryIds([]);
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Bulk priority change failed:', err);
    }
  };

  const handleBulkAssignStaff = async (staffId: string, staffName: string) => {
    if (selectedInquiryIds.length === 0) return;
    try {
      const res = await fetch('/api/inquiries-bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedInquiryIds,
          assignedStaffId: staffId,
          assignedStaffName: staffName
        })
      });
      if (res.ok) {
        setSelectedInquiryIds([]);
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Bulk assign staff failed:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInquiryIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedInquiryIds.length} selected leads permanently?`)) return;
    try {
      const res = await fetch('/api/inquiries-bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedInquiryIds, action: 'delete' })
      });
      if (res.ok) {
        setSelectedInquiryIds([]);
        await onRefreshInquiries();
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  // --- CSV EXPORT ---
  const handleExportCSV = (targetLeads?: Inquiry[]) => {
    const listToExport = targetLeads || (selectedInquiryIds.length > 0
      ? uniqueInquiries.filter(i => selectedInquiryIds.includes(i.id))
      : filteredInquiries);

    if (listToExport.length === 0) {
      showToast('Export Unavailable', 'No leads available to export.', 'warning');
      return;
    }

    const headers = ['Lead ID', 'Client Name', 'Business Name', 'Email', 'WhatsApp', 'Niche', 'Services', 'Deal Value (INR)', 'Status', 'Priority', 'Assigned Staff', 'Created Date'];
    const rows = listToExport.map(inq => [
      `"${inq.id}"`,
      `"${(inq.clientName || '').replace(/"/g, '""')}"`,
      `"${(inq.businessName || '').replace(/"/g, '""')}"`,
      `"${(inq.email || '').replace(/"/g, '""')}"`,
      `"${(inq.whatsapp || '').replace(/"/g, '""')}"`,
      `"${(inq.businessNiche || '').replace(/"/g, '""')}"`,
      `"${(inq.services || []).join(', ')}"`,
      inq.totalDiscounted || inq.totalOriginal || 0,
      `"${normalizeStatus(inq.status)}"`,
      `"${inq.priority || 'medium'}"`,
      `"${(inq.assignedStaffName || 'Unassigned').replace(/"/g, '""')}"`,
      `"${new Date(inq.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DizoPulse_CRM_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const leadColumns: ColumnDef<Inquiry>[] = useMemo(() => [
    {
      id: 'id',
      header: 'Lead ID',
      accessorKey: 'id',
      sortable: true,
      className: 'font-mono text-[11px] font-bold text-slate-500',
      width: '100px'
    },
    {
      id: 'client',
      header: 'Client & Business',
      sortable: true,
      accessorFn: (inq) => inq.businessName || inq.clientName,
      cell: (inq) => (
        <div
          className="cursor-pointer"
          onClick={() => {
            setActiveDrawerInquiry(inq);
            setDrawerTab('details');
          }}
        >
          <div className="font-extrabold text-slate-900 hover:text-indigo-600 transition-colors">
            {inq.businessName || inq.clientName}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span>{inq.clientName}</span>
            {inq.businessNiche && (
              <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-bold uppercase">
                {inq.businessNiche}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'services',
      header: 'Services',
      cell: (inq) => (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {inq.services && inq.services.length > 0 ? (
            inq.services.map((s, idx) => (
              <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold">
                {s}
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-[10px] italic">General Inquiry</span>
          )}
        </div>
      )
    },
    {
      id: 'value',
      header: 'Deal Value',
      sortable: true,
      align: 'right',
      accessorFn: (inq) => inq.totalDiscounted || inq.totalOriginal || 0,
      cell: (inq) => {
        const leadVal = inq.totalDiscounted || inq.totalOriginal || 0;
        return (
          <span className="font-bold text-slate-900">
            ₹{leadVal.toLocaleString('en-IN')}
          </span>
        );
      }
    },
    {
      id: 'stage',
      header: 'Pipeline Stage',
      sortable: true,
      accessorKey: 'status',
      cell: (inq) => {
        const normSt = normalizeStatus(inq.status);
        return (
          <select
            value={normSt}
            onChange={(e) => updateInquiryStatus(inq.id, e.target.value as InquiryStatus)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        );
      }
    },
    {
      id: 'priority',
      header: 'Priority',
      sortable: true,
      accessorKey: 'priority',
      cell: (inq) => (
        <select
          value={inq.priority || 'medium'}
          onChange={(e) => updateInquiryPriority(inq.id, e.target.value as InquiryPriority)}
          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="urgent">Urgent 🔥</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      )
    },
    {
      id: 'staff',
      header: 'Assigned Staff',
      sortable: true,
      accessorKey: 'assignedStaffName',
      cell: (inq) => (
        <select
          value={inq.assignedStaffId || 'unassigned'}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'unassigned') {
              assignInquiryStaff(inq.id, '', '');
            } else {
              const st = staffList?.find((s: any) => (s.id || s.email) === val);
              assignInquiryStaff(inq.id, val, st?.name || 'Staff');
            }
          }}
          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[130px] truncate"
        >
          <option value="unassigned">Unassigned</option>
          {staffList?.map((s: any) => (
            <option key={s.id || s.email} value={s.id || s.email}>{s.name || s.email}</option>
          ))}
        </select>
      )
    },
    {
      id: 'created',
      header: 'Created',
      sortable: true,
      accessorKey: 'createdAt',
      cell: (inq) => (
        <span className="text-[11px] text-slate-500 font-mono">
          {new Date(inq.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'center',
      cell: (inq) => (
        <div className="flex items-center justify-center gap-1">
          {inq.whatsapp && (
            <a
              href={`https://wa.me/${inq.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
              title="WhatsApp"
            >
              <Icons.MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={() => onConvertInquiryToProposal(inq)}
            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1"
            title="Create Proposal"
          >
            <Icons.FilePlus className="w-3.5 h-3.5" />
            <span>Proposal</span>
          </button>

          <button
            onClick={() => {
              setActiveDrawerInquiry(inq);
              setDrawerTab('details');
            }}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Lead Details"
          >
            <Icons.Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ], [staffList]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedInquiryId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: InquiryStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedInquiryId;
    if (id) {
      updateInquiryStatus(id, targetStage);
      setDraggedInquiryId(null);
    }
  };

  const getPriorityBadge = (priority?: InquiryPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white flex items-center gap-1 shadow-2xs animate-pulse">
            <Icons.AlertTriangle className="w-2.5 h-2.5" /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
            <Icons.Flame className="w-2.5 h-2.5 text-orange-600" /> High
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            Low
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            Medium
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP CRM SUMMARY METRICS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Icons.Layers className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Total Pipeline</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">{stats.totalLeads} Leads</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Icons.IndianRupee className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Pipeline Value</span>
            <div className="text-lg font-black text-emerald-700 mt-0.5">₹{stats.totalVal.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
            <Icons.TrendingUp className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Weighted Forecast</span>
            <div className="text-lg font-black text-purple-800 mt-0.5">₹{Math.round(stats.forecastVal).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl shrink-0">
            <Icons.BarChart2 className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Conversion Rate</span>
            <div className="text-lg font-black text-cyan-700 mt-0.5">{stats.convRate}%</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <Icons.AlertTriangle className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">Urgent / Hot</span>
            <div className="text-lg font-black text-rose-600 mt-0.5">{stats.urgentCount} 🔥</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Actions</span>
            <button
              onClick={onOpenAddLeadModal}
              className="mt-1 text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Icons.PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Lead</span>
            </button>
          </div>
          <button
            onClick={() => handleExportCSV()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Export CSV"
          >
            <Icons.Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Icons.Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Client, Business, Phone, Email, Lead ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <Icons.X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Stage Dropdown */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Stages</option>
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            {/* Priority Dropdown */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent 🔥</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Staff Dropdown */}
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Staff</option>
              <option value="unassigned">Unassigned</option>
              {staffList.map((s: any) => (
                <option key={s.id || s.email} value={s.id || s.email}>{s.name || s.email}</option>
              ))}
            </select>

            {/* Service Dropdown */}
            {servicesList.length > 0 && (
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">All Services</option>
                {servicesList.map((srv: any) => (
                  <option key={srv.id} value={srv.id}>{srv.name}</option>
                ))}
              </select>
            )}

            {/* Date Range Dropdown */}
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Archived Toggle */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                showArchived
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {showArchived ? 'Showing Archived' : 'Active Leads'}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ml-auto">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Kanban Board View"
              >
                <Icons.Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table List View"
              >
                <Icons.Table className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

          </div>
        </div>

        {/* 3. BULK ACTIONS BAR (When leads are selected) */}
        {selectedInquiryIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-indigo-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center">
                {selectedInquiryIds.length}
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider">Leads Selected</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Bulk Status Move */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as InquiryStatus);
                    e.target.value = '';
                  }
                }}
                className="px-2.5 py-1.5 bg-indigo-800 text-white border border-indigo-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                <option value="">Move Stage...</option>
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>

              {/* Bulk Priority */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkPriorityChange(e.target.value as InquiryPriority);
                    e.target.value = '';
                  }
                }}
                className="px-2.5 py-1.5 bg-indigo-800 text-white border border-indigo-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                <option value="">Set Priority...</option>
                <option value="urgent">Urgent 🔥</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Bulk Assign Staff */}
              {staffList.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedStaff = staffList.find((s: any) => (s.id || s.email) === e.target.value);
                      handleBulkAssignStaff(e.target.value, selectedStaff?.name || 'Staff');
                      e.target.value = '';
                    }
                  }}
                  className="px-2.5 py-1.5 bg-indigo-800 text-white border border-indigo-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <option value="">Assign Staff...</option>
                  {staffList.map((s: any) => (
                    <option key={s.id || s.email} value={s.id || s.email}>{s.name || s.email}</option>
                  ))}
                </select>
              )}

              {/* Export Selected */}
              <button
                onClick={() => handleExportCSV()}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Icons.Download className="w-3.5 h-3.5" />
                <span>Export Selected</span>
              </button>

              {/* Delete Selected (Admin) */}
              {(userRole === 'super_admin' || userRole === 'admin') && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Icons.Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}

              <button
                onClick={() => setSelectedInquiryIds([])}
                className="px-2.5 py-1.5 text-indigo-300 hover:text-white text-xs font-bold underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* 4. KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="space-y-3">
          {/* Kanban Stage Navigation & Horizontal Scroll Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full scrollbar-none">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Icons.Kanban className="w-3.5 h-3.5 text-indigo-600" />
                <span>Stages:</span>
              </span>
              {STAGES.map((s, idx) => {
                const count = filteredInquiries.filter(i => normalizeStatus(i.status) === s.id).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (kanbanScrollRef.current) {
                        kanbanScrollRef.current.scrollTo({
                          left: idx * 336,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
                      s.bgColor
                    } ${s.textColor} ${s.borderColor} hover:shadow-2xs hover:scale-[1.02]`}
                  >
                    <span>{s.label}</span>
                    <span className="px-1.5 py-0.2 bg-white rounded-full text-[10px] font-black shadow-2xs">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 ml-auto shrink-0">
              <span className="text-[11px] text-slate-400 font-bold hidden sm:inline-flex items-center gap-1">
                <Icons.MoveHorizontal className="w-3.5 h-3.5" />
                Trackpad / Touch scroll enabled
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => scrollKanban('left')}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all cursor-pointer shadow-2xs"
                  title="Scroll Kanban Left"
                  aria-label="Scroll Left"
                >
                  <Icons.ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollKanban('right')}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all cursor-pointer shadow-2xs"
                  title="Scroll Kanban Right"
                  aria-label="Scroll Right"
                >
                  <Icons.ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Kanban Horizontal Scroll Columns Container */}
          <div
            ref={kanbanScrollRef}
            className="overflow-x-auto overscroll-x-contain pb-6 scroll-smooth touch-pan-x select-auto rounded-2xl"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex gap-4 min-w-[2700px] items-start">
              {STAGES.map((stage, sIdx) => {
                const stageLeads = filteredInquiries.filter(i => normalizeStatus(i.status) === stage.id);
                const stageValue = stageLeads.reduce((acc, curr) => acc + (Number(curr.totalDiscounted) || Number(curr.totalOriginal) || 0), 0);
                const StageIcon = stage.icon;

                return (
                  <div
                    key={stage.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className={`w-80 shrink-0 rounded-2xl border ${stage.borderColor} ${stage.bgColor} p-3.5 flex flex-col max-h-[820px] min-h-[540px] shadow-2xs transition-colors`}
                  >
                    {/* Column Header & Real Backend Stage Metrics */}
                    <div className="pb-3 mb-3 border-b border-slate-200/70 space-y-2.5">
                      {/* Top row: Stage Title & Probability */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-xl bg-white shadow-2xs border border-slate-200/60 ${stage.textColor}`}>
                            <StageIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className={`text-xs font-black uppercase tracking-wider ${stage.textColor}`}>
                              {stage.label}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-bold">
                              Stage {sIdx + 1} of {STAGES.length}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${stage.badgeBg}`}>
                          {stage.probability}% Prob
                        </span>
                      </div>

                      {/* Metrics Card: Lead Count & Total Quoted/Deal Value */}
                      <div className="grid grid-cols-2 gap-1.5 bg-white/80 backdrop-blur-xs p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Leads
                          </span>
                          <span className="text-xs font-black text-slate-800">
                            {stageLeads.length} {stageLeads.length === 1 ? 'Lead' : 'Leads'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Total Value
                          </span>
                          <span className="text-xs font-black text-emerald-700 font-mono">
                            ₹{stageValue.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Mini Probability Bar */}
                      <div className="w-full bg-slate-200/80 h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${stage.probability}%` }}
                        />
                      </div>
                    </div>

                    {/* Cards Scroll Container */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {stageLeads.length === 0 ? (
                        <div className="h-36 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 bg-white/40">
                          <Icons.FolderOpen className="w-6 h-6 text-slate-300 mb-1" />
                          <span className="text-xs font-bold text-slate-400">No leads in {stage.label}</span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5">Drag and drop leads here</span>
                        </div>
                      ) : (
                        stageLeads.map(lead => {
                          const leadVal = Number(lead.totalDiscounted) || Number(lead.totalOriginal) || 0;
                          const isSelected = selectedInquiryIds.includes(lead.id);

                          return (
                            <motion.div
                              key={lead.id}
                              layout
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead.id)}
                              className={`bg-white rounded-xl p-3.5 border shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3 relative group ${
                                isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20' : 'border-slate-200/90'
                              }`}
                            >
                              {/* Card Top Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (e.target.checked) {
                                        setSelectedInquiryIds(prev => [...prev, lead.id]);
                                      } else {
                                        setSelectedInquiryIds(prev => prev.filter(id => id !== lead.id));
                                      }
                                    }}
                                    className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                  />
                                  <span className="text-[10px] font-mono text-slate-400 font-bold truncate">
                                    {lead.id}
                                  </span>
                                </div>

                                {getPriorityBadge(lead.priority)}
                              </div>

                              {/* Client & Business info */}
                              <div
                                onClick={() => {
                                  setActiveDrawerInquiry(lead);
                                  setDrawerTab('details');
                                }}
                                className="cursor-pointer space-y-0.5"
                              >
                                <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                  {lead.businessName || lead.clientName}
                                </h4>
                                <p className="text-[11px] text-slate-600 font-medium truncate flex items-center gap-1">
                                  <Icons.User className="w-3 h-3 text-slate-400" />
                                  {lead.clientName}
                                </p>
                                {lead.businessNiche && (
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                                    {lead.businessNiche}
                                  </span>
                                )}
                              </div>

                              {/* Service tags */}
                              {lead.services && lead.services.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {lead.services.slice(0, 2).map((s, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold truncate max-w-[120px]">
                                      {s}
                                    </span>
                                  ))}
                                  {lead.services.length > 2 && (
                                    <span className="px-1 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold">
                                      +{lead.services.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Value & Staff row */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                <div>
                                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Quote Value</span>
                                  <span className="font-black text-slate-900 font-mono">₹{leadVal.toLocaleString('en-IN')}</span>
                                </div>

                                {lead.assignedStaffName ? (
                                  <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full border border-indigo-100 truncate max-w-[90px]" title={`Assigned to ${lead.assignedStaffName}`}>
                                    👤 {lead.assignedStaffName}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 italic font-medium">Unassigned</span>
                                )}
                              </div>

                              {/* Quick Action Toolbar */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-1">
                                  {lead.whatsapp && (
                                    <a
                                      href={`tel:${lead.whatsapp}`}
                                      className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                                      title="Call Client"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Icons.Phone className="w-3 h-3" />
                                    </a>
                                  )}

                                  {lead.whatsapp && (
                                    <a
                                      href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg transition-colors"
                                      title="WhatsApp Chat"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Icons.MessageCircle className="w-3 h-3" />
                                    </a>
                                  )}

                                  {lead.email && (
                                    <a
                                      href={`mailto:${lead.email}`}
                                      className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
                                      title="Send Email"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Icons.Mail className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onConvertInquiryToProposal(lead);
                                    }}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1"
                                    title="Create Proposal for this Lead"
                                  >
                                    <Icons.FilePlus className="w-3 h-3" />
                                    <span>Proposal</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDrawerInquiry(lead);
                                      setDrawerTab('details');
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                    title="View Details Drawer"
                                  >
                                    <Icons.ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. TABLE LIST VIEW */}
      {viewMode === 'table' && (
        <AdminDataTable<Inquiry>
          data={filteredInquiries}
          columns={leadColumns}
          keyExtractor={(inq) => inq.id}
          searchable={false}
          selectable={true}
          selectedIds={selectedInquiryIds}
          onSelectionChange={setSelectedInquiryIds}
          bulkActions={(selected, clear) => (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportCSV()}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Icons.Download className="w-3.5 h-3.5" />
                <span>Export ({selected.length})</span>
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleBulkDelete()}
                  className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Icons.Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selected.length})</span>
                </button>
              )}
            </div>
          )}
          emptyTitle="No leads match the active filters"
          emptyDescription="Try adjusting your pipeline stage, priority, or search query."
          emptyIcon={Icons.Inbox}
          initialPageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          tableMinWidth="min-w-[950px]"
        />
      )}

      {/* 6. LEAD DETAILS DRAWER / MODAL */}
      <AnimatePresence>
        {activeDrawerInquiry && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">{activeDrawerInquiry.id}</span>
                    {getPriorityBadge(activeDrawerInquiry.priority)}
                  </div>
                  <h2 className="text-base font-black text-white mt-1">
                    {activeDrawerInquiry.businessName || activeDrawerInquiry.clientName}
                  </h2>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Contact: {activeDrawerInquiry.clientName}</span>
                    <span>•</span>
                    <span>{activeDrawerInquiry.email}</span>
                  </p>
                </div>

                <button
                  onClick={() => setActiveDrawerInquiry(null)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Quick Actions Bar */}
              <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-2">
                  {activeDrawerInquiry.whatsapp && (
                    <a
                      href={`tel:${activeDrawerInquiry.whatsapp}`}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Icons.Phone className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Call</span>
                    </a>
                  )}

                  {activeDrawerInquiry.whatsapp && (
                    <a
                      href={`https://wa.me/${activeDrawerInquiry.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Icons.MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {activeDrawerInquiry.email && (
                    <a
                      href={`mailto:${activeDrawerInquiry.email}`}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Icons.Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onConvertInquiryToProposal(activeDrawerInquiry);
                      setActiveDrawerInquiry(null);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    <Icons.FilePlus className="w-3.5 h-3.5" />
                    <span>Create Proposal</span>
                  </button>

                  <button
                    onClick={() => handleArchiveToggle(activeDrawerInquiry.id, activeDrawerInquiry.archived)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 bg-white border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title={activeDrawerInquiry.archived ? 'Unarchive' : 'Archive Lead'}
                  >
                    <Icons.Archive className="w-4 h-4" />
                  </button>

                  {(userRole === 'super_admin' || userRole === 'admin') && (
                    <button
                      onClick={() => handleDeleteLead(activeDrawerInquiry.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 bg-white border border-slate-200 rounded-xl transition-all cursor-pointer"
                      title="Delete Lead"
                    >
                      <Icons.Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 px-5 gap-2 bg-white">
                <button
                  onClick={() => setDrawerTab('details')}
                  className={`py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icons.Info className="w-3.5 h-3.5" />
                  <span>Lead Info & Stage</span>
                </button>

                <button
                  onClick={() => setDrawerTab('quote')}
                  className={`py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerTab === 'quote' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icons.Tag className="w-3.5 h-3.5" />
                  <span>Services & Quote</span>
                </button>

                <button
                  onClick={() => setDrawerTab('history')}
                  className={`py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icons.History className="w-3.5 h-3.5" />
                  <span>Contact Logs ({activeDrawerInquiry.contactHistory?.length || 0})</span>
                </button>

                <button
                  onClick={() => setDrawerTab('notes')}
                  className={`py-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icons.MessageSquare className="w-3.5 h-3.5" />
                  <span>Team Notes ({activeDrawerInquiry.internalNotesList?.length || 0})</span>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* TAB 1: DETAILS & STAGE */}
                {drawerTab === 'details' && (
                  <div className="space-y-6">
                    {/* Stage & Priority Control Box */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                          Pipeline Stage
                        </label>
                        <select
                          value={normalizeStatus(activeDrawerInquiry.status)}
                          onChange={(e) => updateInquiryStatus(activeDrawerInquiry.id, e.target.value as InquiryStatus)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {STAGES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                          Lead Priority
                        </label>
                        <select
                          value={activeDrawerInquiry.priority || 'medium'}
                          onChange={(e) => updateInquiryPriority(activeDrawerInquiry.id, e.target.value as InquiryPriority)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="urgent">Urgent 🔥</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                          Assigned Staff
                        </label>
                        <select
                          value={activeDrawerInquiry.assignedStaffId || 'unassigned'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'unassigned') {
                              assignInquiryStaff(activeDrawerInquiry.id, '', '');
                            } else {
                              const st = staffList.find((s: any) => (s.id || s.email) === val);
                              assignInquiryStaff(activeDrawerInquiry.id, val, st?.name || 'Staff');
                            }
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="unassigned">Unassigned</option>
                          {staffList.map((s: any) => (
                            <option key={s.id || s.email} value={s.id || s.email}>{s.name || s.email}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Client Overview Card */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Icons.UserCheck className="w-4 h-4 text-indigo-600" />
                        Contact & Business Overview
                      </h3>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Client Name</span>
                          <span className="font-bold text-slate-900">{activeDrawerInquiry.clientName}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Business Name</span>
                          <span className="font-bold text-slate-900">{activeDrawerInquiry.businessName}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Email Address</span>
                          <span className="font-bold text-slate-900">{activeDrawerInquiry.email}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Phone / WhatsApp</span>
                          <span className="font-bold text-slate-900">{activeDrawerInquiry.whatsapp}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Niche / Industry</span>
                          <span className="font-bold text-slate-900">{activeDrawerInquiry.businessNiche || 'General'}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Inquiry Date</span>
                          <span className="font-bold text-slate-900">{new Date(activeDrawerInquiry.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Client Message */}
                    {activeDrawerInquiry.message && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Client Initial Requirement / Brief</h3>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-medium">
                          {activeDrawerInquiry.message}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SERVICES & QUOTE */}
                {drawerTab === 'quote' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Calculated Deal Quote</span>
                        <div className="text-xl font-black text-indigo-900 mt-0.5">
                          ₹{(activeDrawerInquiry.totalDiscounted || activeDrawerInquiry.totalOriginal || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const input = window.prompt('Enter new custom deal quote (INR ₹):', String(activeDrawerInquiry.totalDiscounted || 0));
                            if (input && !isNaN(Number(input))) {
                              handleUpdateDealValue(Number(input));
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Edit Quote Value
                        </button>
                      </div>
                    </div>

                    {/* Service list */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Requested Services Breakdown</h3>

                      {activeDrawerInquiry.services && activeDrawerInquiry.services.length > 0 ? (
                        <div className="space-y-2">
                          {activeDrawerInquiry.services.map((srvName, idx) => {
                            const details = activeDrawerInquiry.serviceDetails?.[srvName];
                            return (
                              <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-900">{srvName}</span>
                                  {details && (
                                    <span className="text-[10px] text-slate-500 block">
                                      Qty: {details.quantity || 1} • Speed: {details.speed || 'Standard'}
                                    </span>
                                  )}
                                </div>
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-lg">
                                  Included
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                          No specific services selected. Custom quote inquiry.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: CONTACT HISTORY LOGS */}
                {drawerTab === 'history' && (
                  <div className="space-y-6">
                    {/* Add Contact Log Form */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Icons.PlusCircle className="w-4 h-4 text-emerald-600" />
                        Log New Communication
                      </h3>

                      <div className="flex gap-2">
                        <select
                          value={newHistoryType}
                          onChange={(e) => setNewHistoryType(e.target.value as any)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="call">📞 Phone Call</option>
                          <option value="whatsapp">💬 WhatsApp</option>
                          <option value="email">✉️ Email</option>
                          <option value="meeting">🤝 Meeting</option>
                          <option value="note">📝 Quick Note</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Summary of conversation, outcome, next steps..."
                          value={newHistorySummary}
                          onChange={(e) => setNewHistorySummary(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                        />

                        <button
                          onClick={handleAddContactHistory}
                          disabled={isSaving || !newHistorySummary.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          Add Log
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Communication Timeline</h3>

                      {activeDrawerInquiry.contactHistory && activeDrawerInquiry.contactHistory.length > 0 ? (
                        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                          {activeDrawerInquiry.contactHistory.map(item => (
                            <div key={item.id} className="relative pl-8 space-y-1">
                              <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-2xs"></div>
                              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1 text-xs">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                                  <span className="flex items-center gap-1 text-indigo-600">
                                    {item.type === 'call' && '📞 Call'}
                                    {item.type === 'whatsapp' && '💬 WhatsApp'}
                                    {item.type === 'email' && '✉️ Email'}
                                    {item.type === 'meeting' && '🤝 Meeting'}
                                    {item.type === 'note' && '📝 Note'}
                                    • by {item.author}
                                  </span>
                                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-slate-800 font-medium">{item.summary}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 italic">
                          No communication logged yet. Use the form above to add phone/WhatsApp call summaries.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: INTERNAL TEAM NOTES */}
                {drawerTab === 'notes' && (
                  <div className="space-y-6">
                    {/* Add Note Input */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Icons.MessageSquare className="w-4 h-4 text-indigo-600" />
                        Add Team Note
                      </h3>

                      <div className="flex gap-2">
                        <textarea
                          placeholder="Internal comment, lead background, team observation..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          rows={2}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none"
                        />
                      </div>

                      <button
                        onClick={handleAddInternalNote}
                        disabled={isSaving || !newNoteText.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Post Note
                      </button>
                    </div>

                    {/* Notes feed */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Team Notes Feed</h3>

                      {activeDrawerInquiry.internalNotesList && activeDrawerInquiry.internalNotesList.length > 0 ? (
                        <div className="space-y-2.5">
                          {activeDrawerInquiry.internalNotesList.map(n => (
                            <div key={n.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                                <span className="text-indigo-600">👤 {n.author}</span>
                                <span>{new Date(n.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-800 font-medium whitespace-pre-wrap">{n.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 italic">
                          No internal team notes recorded.
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
