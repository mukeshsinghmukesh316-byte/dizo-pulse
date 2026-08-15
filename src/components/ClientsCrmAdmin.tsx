import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { showToast, AsyncButton, SkeletonTable, EmptyState } from './UIPolish';
import {
  Inquiry,
  Proposal,
  Contract,
  Project,
  ClientProfile,
  ClientStatus,
  ClientContactPerson,
  ClientNote,
  ClientActivity
} from '../types';

interface ClientsCrmAdminProps {
  inquiries: Inquiry[];
  proposals: Proposal[];
  contracts: Contract[];
  projects: Project[];
  conversations?: any[];
  staffList?: any[];
  userRole?: string;
  userName?: string;
  onRefresh?: () => void;
  onNavigateToTab?: (tab: string, param?: any) => void;
}

export const ClientsCrmAdmin: React.FC<ClientsCrmAdminProps> = ({
  inquiries = [],
  proposals = [],
  contracts = [],
  projects = [],
  conversations = [],
  staffList = [],
  userRole = 'admin',
  userName = 'Admin User',
  onRefresh,
  onNavigateToTab
}) => {
  // Stored client profiles from server
  const [storedClients, setStoredClients] = useState<ClientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // UI state controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'last_interaction' | 'name' | 'value' | 'created'>('last_interaction');

  // Selected client for 360 view modal
  const [activeClient360, setActiveClient360] = useState<ClientProfile | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'timeline' | 'inquiries' | 'proposals' | 'contracts' | 'projects' | 'messages' | 'notes'>('overview');

  // Modal triggers
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergePrimaryId, setMergePrimaryId] = useState<string>('');
  const [mergeSecondaryId, setMergeSecondaryId] = useState<string>('');

  // Quick note modal
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');

  // Contact Person Modal
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactData, setNewContactData] = useState({ name: '', title: '', email: '', phone: '', notes: '' });

  // Tag creation
  const [newTagInput, setNewTagInput] = useState('');

  // New Client Form Data
  const [newClientData, setNewClientData] = useState({
    companyName: '',
    clientName: '',
    email: '',
    phone: '',
    businessNiche: '',
    website: '',
    address: '',
    gstin: '',
    status: 'lead' as ClientStatus,
    tags: 'VIP, High Value'
  });

  // Fetch stored clients from API on mount
  const fetchStoredClients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setStoredClients(data || []);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoredClients();
  }, []);

  // 1. AUTO-LINK DATA: Aggregate all existing inquiries, proposals, contracts, projects, stored clients by Email/Company
  const allClientsList = useMemo(() => {
    const clientMap = new Map<string, ClientProfile>();

    // Helper to produce key
    const getKey = (email?: string, company?: string) => {
      if (email && email.trim()) return email.trim().toLowerCase();
      if (company && company.trim()) return company.trim().toLowerCase();
      return `anon_${Math.random()}`;
    };

    // First seed with manually stored clients
    storedClients.forEach((sc) => {
      const key = getKey(sc.email, sc.companyName);
      clientMap.set(key, { ...sc });
    });

    // Link Inquiries
    inquiries.forEach((inq) => {
      if (!inq.email && !inq.businessName && !inq.clientName) return;
      const key = getKey(inq.email, inq.businessName);

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: `cli_auto_inq_${inq.id}`,
          companyName: inq.businessName || inq.clientName || 'Independent Client',
          clientName: inq.clientName || 'Primary Contact',
          email: (inq.email || '').toLowerCase().trim(),
          phone: inq.whatsapp || '',
          businessNiche: inq.businessNiche || '',
          status: inq.status === 'completed' || inq.status === 'project_active' ? 'active' : 'lead',
          tags: ['Inquiry Lead'],
          contactPersons: [
            {
              id: `cp_${inq.id}`,
              name: inq.clientName || 'Primary Contact',
              email: inq.email || '',
              phone: inq.whatsapp || '',
              isPrimary: true
            }
          ],
          notes: inq.adminNotes ? [{ id: `n_inq_${inq.id}`, timestamp: inq.createdAt, author: 'Inquiry System', content: inq.adminNotes }] : [],
          activityTimeline: [],
          createdAt: inq.createdAt || new Date().toISOString(),
          lastInteraction: inq.updatedAt || inq.createdAt
        });
      } else {
        const existing = clientMap.get(key)!;
        if (!existing.phone && inq.whatsapp) existing.phone = inq.whatsapp;
        if (!existing.businessNiche && inq.businessNiche) existing.businessNiche = inq.businessNiche;
      }
    });

    // Link Proposals
    proposals.forEach((prop) => {
      if (!prop.email && !prop.businessName && !prop.clientName) return;
      const key = getKey(prop.email, prop.businessName);

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: `cli_auto_prop_${prop.id}`,
          companyName: prop.businessName || prop.clientName,
          clientName: prop.clientName,
          email: (prop.email || '').toLowerCase().trim(),
          phone: prop.phone || '',
          businessNiche: prop.businessNiche || '',
          status: prop.status === 'Approved' ? 'active' : 'lead',
          tags: ['Proposal Issued'],
          contactPersons: [
            {
              id: `cp_prop_${prop.id}`,
              name: prop.contactPerson || prop.clientName,
              email: prop.email,
              phone: prop.phone,
              isPrimary: true
            }
          ],
          notes: [],
          activityTimeline: [],
          createdAt: prop.createdAt || new Date().toISOString(),
          lastInteraction: prop.createdAt
        });
      }
    });

    // Link Contracts
    contracts.forEach((ctr) => {
      if (!ctr.email && !ctr.businessName && !ctr.clientName) return;
      const key = getKey(ctr.email, ctr.businessName);

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: `cli_auto_ctr_${ctr.id}`,
          companyName: ctr.businessName || ctr.clientName,
          clientName: ctr.clientName,
          email: (ctr.email || '').toLowerCase().trim(),
          phone: ctr.phone || '',
          businessNiche: ctr.businessNiche || '',
          status: 'active',
          tags: ['Contract Client'],
          contactPersons: [
            {
              id: `cp_ctr_${ctr.id}`,
              name: ctr.contactPerson || ctr.clientName,
              email: ctr.email,
              phone: ctr.phone,
              isPrimary: true
            }
          ],
          notes: [],
          activityTimeline: [],
          createdAt: ctr.createdAt || new Date().toISOString(),
          lastInteraction: ctr.createdAt
        });
      }
    });

    // Link Projects
    projects.forEach((prj) => {
      if (!prj.email && !prj.businessName && !prj.clientName) return;
      const key = getKey(prj.email, prj.businessName);

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: `cli_auto_prj_${prj.id}`,
          companyName: prj.businessName || prj.clientName,
          clientName: prj.clientName,
          email: (prj.email || '').toLowerCase().trim(),
          phone: prj.phone || '',
          businessNiche: prj.businessNiche || '',
          status: prj.status === 'Completed' ? 'completed' : 'active',
          tags: ['Active Project'],
          contactPersons: [
            {
              id: `cp_prj_${prj.id}`,
              name: prj.contactPerson || prj.clientName,
              email: prj.email,
              phone: prj.phone || '',
              isPrimary: true
            }
          ],
          notes: [],
          activityTimeline: [],
          createdAt: prj.startDate || new Date().toISOString(),
          lastInteraction: prj.lastUpdated || prj.startDate
        });
      } else {
        const existing = clientMap.get(key)!;
        if (prj.status === 'Completed' && existing.status === 'lead') {
          existing.status = 'completed';
        } else if (prj.status !== 'Completed' && existing.status !== 'active') {
          existing.status = 'active';
        }
      }
    });

    return Array.from(clientMap.values());
  }, [storedClients, inquiries, proposals, contracts, projects]);

  // Helper to resolve associated data for a specific client
  const getClientAssociatedData = (client: ClientProfile) => {
    const emailNorm = client.email.toLowerCase().trim();
    const compNorm = client.companyName.toLowerCase().trim();

    const matchedInquiries = inquiries.filter(
      (inq) =>
        (inq.email && inq.email.toLowerCase().trim() === emailNorm) ||
        (inq.businessName && inq.businessName.toLowerCase().trim() === compNorm)
    );

    const matchedProposals = proposals.filter(
      (p) =>
        (p.email && p.email.toLowerCase().trim() === emailNorm) ||
        (p.businessName && p.businessName.toLowerCase().trim() === compNorm)
    );

    const matchedContracts = contracts.filter(
      (c) =>
        (c.email && c.email.toLowerCase().trim() === emailNorm) ||
        (c.businessName && c.businessName.toLowerCase().trim() === compNorm)
    );

    const matchedProjects = projects.filter(
      (prj) =>
        (prj.email && prj.email.toLowerCase().trim() === emailNorm) ||
        (prj.businessName && prj.businessName.toLowerCase().trim() === compNorm)
    );

    const totalInquiriesVal = matchedInquiries.reduce((acc, i) => acc + (i.totalDiscounted || 0), 0);
    const totalProposalsVal = matchedProposals.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const totalContractVal = matchedContracts.reduce((acc, c) => acc + 50000, 0); // estimation or proposal match

    // Estimated LTV
    const totalLtv = Math.max(totalProposalsVal, totalInquiriesVal, totalContractVal);

    // Timeline compilation
    const timeline: ClientActivity[] = [...(client.activityTimeline || [])];

    matchedInquiries.forEach((inq) => {
      timeline.push({
        id: `tl_inq_${inq.id}`,
        timestamp: inq.createdAt,
        type: 'inquiry',
        title: 'New Inquiry Submitted',
        description: `Submitted quote request for ₹${(inq.totalDiscounted || 0).toLocaleString('en-IN')}`,
        relatedEntityId: inq.id
      });
    });

    matchedProposals.forEach((prop) => {
      timeline.push({
        id: `tl_prop_${prop.id}`,
        timestamp: prop.createdAt,
        type: 'proposal',
        title: `Proposal ${prop.id} (${prop.status})`,
        description: `Issued custom scope proposal worth ₹${prop.totalAmount.toLocaleString('en-IN')}`,
        relatedEntityId: prop.id
      });
    });

    matchedContracts.forEach((ctr) => {
      timeline.push({
        id: `tl_ctr_${ctr.id}`,
        timestamp: ctr.createdAt,
        type: 'contract',
        title: `Legal Contract ${ctr.id}`,
        description: `Agreement issued for ${ctr.projectName} (${ctr.status})`,
        relatedEntityId: ctr.id
      });
    });

    matchedProjects.forEach((prj) => {
      timeline.push({
        id: `tl_prj_${prj.id}`,
        timestamp: prj.startDate,
        type: 'project',
        title: `Project ${prj.projectName} (${prj.status})`,
        description: `Kickoff with ${prj.overallProgress}% completion. Manager: ${prj.projectManager || 'Unassigned'}`,
        relatedEntityId: prj.id
      });
    });

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Compute last interaction
    const lastInteractionDate = timeline.length > 0 ? timeline[0].timestamp : client.lastInteraction || client.createdAt;

    const completedProjectsCount = matchedProjects.filter((p) => p.status === 'Completed').length;

    return {
      matchedInquiries,
      matchedProposals,
      matchedContracts,
      matchedProjects,
      totalLtv,
      timeline,
      lastInteractionDate,
      completedProjectsCount
    };
  };

  // 2. DUPLICATE CLIENT IDENTIFICATION
  const duplicateGroups = useMemo(() => {
    const groups: { primary: ClientProfile; duplicates: ClientProfile[]; matchReason: string }[] = [];
    const visitedIds = new Set<string>();

    for (let i = 0; i < allClientsList.length; i++) {
      const c1 = allClientsList[i];
      if (visitedIds.has(c1.id)) continue;

      const dupes: ClientProfile[] = [];
      let matchReason = '';

      for (let j = i + 1; j < allClientsList.length; j++) {
        const c2 = allClientsList[j];
        if (visitedIds.has(c2.id)) continue;

        const sameEmail = c1.email && c2.email && c1.email.toLowerCase().trim() === c2.email.toLowerCase().trim();
        const samePhone = c1.phone && c2.phone && c1.phone.replace(/\D/g, '') === c2.phone.replace(/\D/g, '') && c1.phone.length > 5;
        const sameCompany = c1.companyName && c2.companyName && c1.companyName.toLowerCase().trim() === c2.companyName.toLowerCase().trim() && c1.companyName.length > 2;

        if (sameEmail || samePhone || sameCompany) {
          dupes.push(c2);
          visitedIds.add(c2.id);
          matchReason = sameEmail ? 'Matching Email' : samePhone ? 'Matching Phone' : 'Matching Company Name';
        }
      }

      if (dupes.length > 0) {
        visitedIds.add(c1.id);
        groups.push({ primary: c1, duplicates: dupes, matchReason });
      }
    }

    return groups;
  }, [allClientsList]);

  // Extract all available tags across clients
  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>();
    allClientsList.forEach((c) => {
      (c.tags || []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [allClientsList]);

  // 3. SEARCH & FILTERED CLIENTS LIST
  const filteredClients = useMemo(() => {
    return allClientsList.filter((client) => {
      const query = searchTerm.toLowerCase();
      const matchSearch =
        client.companyName.toLowerCase().includes(query) ||
        client.clientName.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        (client.businessNiche && client.businessNiche.toLowerCase().includes(query)) ||
        (client.tags && client.tags.some((t) => t.toLowerCase().includes(query)));

      const matchStatus = selectedStatusFilter === 'all' || client.status === selectedStatusFilter;
      const matchTag = selectedTagFilter === 'all' || (client.tags && client.tags.includes(selectedTagFilter));

      return matchSearch && matchStatus && matchTag;
    }).sort((a, b) => {
      const aData = getClientAssociatedData(a);
      const bData = getClientAssociatedData(b);

      if (sortBy === 'last_interaction') {
        return new Date(bData.lastInteractionDate).getTime() - new Date(aData.lastInteractionDate).getTime();
      }
      if (sortBy === 'name') {
        return a.companyName.localeCompare(b.companyName);
      }
      if (sortBy === 'value') {
        return bData.totalLtv - aData.totalLtv;
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [allClientsList, searchTerm, selectedStatusFilter, selectedTagFilter, sortBy]);

  // Client Status Metrics
  const metrics = useMemo(() => {
    const total = allClientsList.length;
    const leads = allClientsList.filter((c) => c.status === 'lead').length;
    const active = allClientsList.filter((c) => c.status === 'active').length;
    const completed = allClientsList.filter((c) => c.status === 'completed').length;
    const inactive = allClientsList.filter((c) => c.status === 'inactive').length;

    let totalProjectsAll = 0;
    let completedProjectsAll = 0;

    allClientsList.forEach((c) => {
      const data = getClientAssociatedData(c);
      totalProjectsAll += data.matchedProjects.length;
      completedProjectsAll += data.completedProjectsCount;
    });

    return { total, leads, active, completed, inactive, totalProjectsAll, completedProjectsAll };
  }, [allClientsList]);

  // --- ACTIONS ---

  // Handle Save New Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.email || !newClientData.clientName) {
      showToast('Validation Error', 'Please enter Client Name and Email', 'warning');
      return;
    }

    try {
      const tagsArr = newClientData.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newClientData,
          tags: tagsArr
        })
      });

      if (res.ok) {
        setShowAddClientModal(false);
        setNewClientData({
          companyName: '',
          clientName: '',
          email: '',
          phone: '',
          businessNiche: '',
          website: '',
          address: '',
          gstin: '',
          status: 'lead',
          tags: 'VIP, High Value'
        });
        await fetchStoredClients();
        if (onRefresh) onRefresh();
        showToast('Client Created', `Successfully registered profile for ${newClientData.clientName}`, 'success');
      } else {
        const err = await res.json();
        showToast('Create Failed', err.error || 'Failed to save client', 'error');
      }
    } catch (err: any) {
      showToast('Create Error', err.message || 'Error saving client', 'error');
    }
  };

  // Update Status directly
  const handleUpdateStatus = async (client: ClientProfile, newStatus: ClientStatus) => {
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          activityTimeline: [
            ...(client.activityTimeline || []),
            {
              id: `act_${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'status_change',
              title: 'Status Updated',
              description: `Client status changed from ${client.status.toUpperCase()} to ${newStatus.toUpperCase()} by ${userName}`,
              author: userName
            }
          ]
        })
      });

      if (res.ok) {
        await fetchStoredClients();
        if (activeClient360) {
          setActiveClient360({ ...activeClient360, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Add Note to Client 360
  const handleAddNote = async () => {
    if (!activeClient360 || !newNoteContent.trim()) return;

    const noteItem: ClientNote = {
      id: `n_${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: userName,
      content: newNoteContent.trim()
    };

    const updatedNotes = [...(activeClient360.notes || []), noteItem];

    try {
      const res = await fetch(`/api/clients/${activeClient360.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: updatedNotes,
          activityTimeline: [
            ...(activeClient360.activityTimeline || []),
            {
              id: `act_${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'note',
              title: 'New Internal Note Added',
              description: `"${newNoteContent.trim().substring(0, 60)}..."`,
              author: userName
            }
          ]
        })
      });

      if (res.ok) {
        setActiveClient360({ ...activeClient360, notes: updatedNotes });
        setNewNoteContent('');
        setShowAddNoteModal(false);
        await fetchStoredClients();
      }
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  // Add Tag
  const handleAddTag = async (client: ClientProfile, tag: string) => {
    if (!tag.trim()) return;
    const cleanTag = tag.trim();
    if ((client.tags || []).includes(cleanTag)) return;

    const updatedTags = [...(client.tags || []), cleanTag];

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags })
      });

      if (res.ok) {
        if (activeClient360 && activeClient360.id === client.id) {
          setActiveClient360({ ...activeClient360, tags: updatedTags });
        }
        setNewTagInput('');
        await fetchStoredClients();
      }
    } catch (err) {
      console.error('Error adding tag:', err);
    }
  };

  // Remove Tag
  const handleRemoveTag = async (client: ClientProfile, tagToRemove: string) => {
    const updatedTags = (client.tags || []).filter((t) => t !== tagToRemove);

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags })
      });

      if (res.ok) {
        if (activeClient360 && activeClient360.id === client.id) {
          setActiveClient360({ ...activeClient360, tags: updatedTags });
        }
        await fetchStoredClients();
      }
    } catch (err) {
      console.error('Error removing tag:', err);
    }
  };

  // Add Contact Person
  const handleAddContactPerson = async () => {
    if (!activeClient360 || !newContactData.name) return;

    const newCp: ClientContactPerson = {
      id: `cp_${Date.now()}`,
      name: newContactData.name,
      title: newContactData.title || 'Representative',
      email: newContactData.email,
      phone: newContactData.phone,
      notes: newContactData.notes
    };

    const updatedContacts = [...(activeClient360.contactPersons || []), newCp];

    try {
      const res = await fetch(`/api/clients/${activeClient360.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactPersons: updatedContacts })
      });

      if (res.ok) {
        setActiveClient360({ ...activeClient360, contactPersons: updatedContacts });
        setNewContactData({ name: '', title: '', email: '', phone: '', notes: '' });
        setShowAddContactModal(false);
        await fetchStoredClients();
      }
    } catch (err) {
      console.error('Error adding contact:', err);
    }
  };

  // Handle Client Merge
  const handleExecuteMerge = async () => {
    if (!mergePrimaryId || !mergeSecondaryId) {
      showToast('Validation Error', 'Please select both Primary and Secondary profiles', 'warning');
      return;
    }
    if (mergePrimaryId === mergeSecondaryId) {
      showToast('Validation Error', 'Primary and Secondary cannot be the same record', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/clients/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryId: mergePrimaryId,
          secondaryId: mergeSecondaryId
        })
      });

      if (res.ok) {
        setShowMergeModal(false);
        setMergePrimaryId('');
        setMergeSecondaryId('');
        await fetchStoredClients();
        if (onRefresh) onRefresh();
        showToast('Profiles Merged', 'Merged client profiles successfully.', 'success');
      } else {
        const err = await res.json();
        showToast('Merge Failed', err.error || 'Failed to merge profiles', 'error');
      }
    } catch (err: any) {
      showToast('Merge Error', err.message || 'Error merging profiles', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <Icons.Users className="w-5 h-5" />
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Executive Relationship Hub</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Client 360° CRM Directory</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Centralized accounts management, contact persons, timeline activity, and aggregated deliverables across inquiries, proposals, contracts, and delivery projects.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {duplicateGroups.length > 0 && (
              <button
                onClick={() => {
                  if (duplicateGroups.length > 0) {
                    setMergePrimaryId(duplicateGroups[0].primary.id);
                    setMergeSecondaryId(duplicateGroups[0].duplicates[0].id);
                  }
                  setShowMergeModal(true);
                }}
                className="px-3.5 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl hover:bg-amber-500/30 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Icons.AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{duplicateGroups.length} Duplicate Group{duplicateGroups.length > 1 ? 's' : ''} Detected</span>
              </button>
            )}

            <button
              onClick={() => setShowAddClientModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95"
            >
              <Icons.UserPlus className="w-4 h-4" />
              <span>Add New Client</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Accounts</span>
            <p className="text-xl font-black text-white mt-0.5">{metrics.total}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider">Inquiry Leads</span>
            <p className="text-xl font-black text-cyan-300 mt-0.5">{metrics.leads}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">Active Clients</span>
            <p className="text-xl font-black text-emerald-300 mt-0.5">{metrics.active}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">Completed</span>
            <p className="text-xl font-black text-purple-300 mt-0.5">{metrics.completed}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider">Total Projects</span>
            <p className="text-xl font-black text-indigo-300 mt-0.5">{metrics.totalProjectsAll}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">Completed Projects</span>
            <p className="text-xl font-black text-amber-300 mt-0.5">{metrics.completedProjectsAll}</p>
          </div>
        </div>
      </div>

      {/* Search, Filter Bar & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Client Name, Email, Phone, Company, Niche or Tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'lead', 'active', 'completed', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedStatusFilter === st
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Tag Filter */}
          {allAvailableTags.length > 0 && (
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">🏷️ All Tags ({allAvailableTags.length})</option>
              {allAvailableTags.map((tg) => (
                <option key={tg} value={tg}>
                  {tg}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="last_interaction">🕒 Sort: Last Interaction</option>
            <option value="name">🔤 Sort: Company Name</option>
            <option value="value">💰 Sort: Lifetime Value (LTV)</option>
            <option value="created">📅 Sort: Created Date</option>
          </select>
        </div>
      </div>

      {/* Client List Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icons.UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800">No Clients Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try resetting your search query or status filters, or add a new client to your CRM database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const data = getClientAssociatedData(client);

            return (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                {/* Header info */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {client.companyName}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 truncate mt-0.5">
                        👤 {client.clientName}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        client.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : client.status === 'completed'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : client.status === 'inactive'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>

                  {/* Niche & Contact details */}
                  <div className="space-y-1 text-xs text-slate-500 pt-1">
                    {client.businessNiche && (
                      <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Icons.Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{client.businessNiche}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Icons.Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{client.email || 'No Email'}</span>
                    </p>
                    {client.phone && (
                      <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Icons.Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {(client.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {client.tags.slice(0, 3).map((tg, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200/80 rounded-md text-[10px] font-extrabold"
                        >
                          {tg}
                        </span>
                      ))}
                      {client.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-bold self-center">
                          +{client.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Aggregated Deliverables Counters */}
                <div className="grid grid-cols-4 gap-1.5 py-2.5 px-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block">Inquiries</span>
                    <span className="text-xs font-black text-slate-800">{data.matchedInquiries.length}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block">Proposals</span>
                    <span className="text-xs font-black text-indigo-600">{data.matchedProposals.length}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block">Contracts</span>
                    <span className="text-xs font-black text-purple-600">{data.matchedContracts.length}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-400 block">Projects</span>
                    <span className="text-xs font-black text-emerald-600">
                      {data.completedProjectsCount}/{data.matchedProjects.length}
                    </span>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 font-bold">
                    <span>LTV: </span>
                    <span className="text-slate-800 font-black">
                      ₹{data.totalLtv > 0 ? data.totalLtv.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp */}
                    {client.phone && (
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Quick WhatsApp"
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <Icons.MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Email */}
                    {client.email && (
                      <a
                        href={`mailto:${client.email}`}
                        title="Send Email"
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Icons.Mail className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Open 360 View */}
                    <button
                      onClick={() => {
                        setActiveClient360(client);
                        setActiveProfileTab('overview');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all"
                    >
                      <span>360° Profile</span>
                      <Icons.ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* --- CLIENT 360° PROFILE MODAL / DRAWER --- */}
      <AnimatePresence>
        {activeClient360 && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Modal Top Profile Header */}
              {(() => {
                const data = getClientAssociatedData(activeClient360);

                return (
                  <>
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
                      <button
                        onClick={() => setActiveClient360(null)}
                        className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                      >
                        <Icons.X className="w-4 h-4" />
                      </button>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">Client 360° Profile</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                activeClient360.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : activeClient360.status === 'completed'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {activeClient360.status}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-white">{activeClient360.companyName}</h3>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Primary Contact: <strong className="text-white">{activeClient360.clientName}</strong> ({activeClient360.email})
                          </p>
                        </div>

                        {/* Status Switcher & Actions */}
                        <div className="flex items-center gap-2">
                          <select
                            value={activeClient360.status}
                            onChange={(e: any) => handleUpdateStatus(activeClient360, e.target.value)}
                            className="px-3 py-1.5 bg-white/10 text-white rounded-xl text-xs font-bold border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            <option value="lead" className="text-slate-900">Lead</option>
                            <option value="active" className="text-slate-900">Active</option>
                            <option value="completed" className="text-slate-900">Completed</option>
                            <option value="inactive" className="text-slate-900">Inactive</option>
                          </select>

                          {activeClient360.phone && (
                            <a
                              href={`https://wa.me/${activeClient360.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                            >
                              <Icons.MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {activeClient360.email && (
                            <a
                              href={`mailto:${activeClient360.email}`}
                              className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                            >
                              <Icons.Mail className="w-3.5 h-3.5" />
                              <span>Email</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Header quick metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Lifetime Value (LTV)</span>
                          <span className="font-black text-emerald-400 text-sm">₹{data.totalLtv.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Inquiries & Proposals</span>
                          <span className="font-black text-white text-sm">{data.matchedInquiries.length} Inq / {data.matchedProposals.length} Prop</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Projects Delivered</span>
                          <span className="font-black text-purple-300 text-sm">{data.completedProjectsCount} / {data.matchedProjects.length} Completed</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Activity</span>
                          <span className="font-black text-slate-200 text-sm">
                            {new Date(data.lastInteractionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Sub-Tabs */}
                    <div className="border-b border-slate-200 bg-slate-50 px-6 flex items-center gap-2 overflow-x-auto">
                      {[
                        { id: 'overview', label: 'Company Overview', icon: Icons.Building2 },
                        { id: 'timeline', label: `Activity Stream (${data.timeline.length})`, icon: Icons.History },
                        { id: 'inquiries', label: `Inquiries (${data.matchedInquiries.length})`, icon: Icons.HelpCircle },
                        { id: 'proposals', label: `Proposals (${data.matchedProposals.length})`, icon: Icons.FileText },
                        { id: 'contracts', label: `Contracts (${data.matchedContracts.length})`, icon: Icons.FileCheck },
                        { id: 'projects', label: `Projects (${data.matchedProjects.length})`, icon: Icons.Kanban },
                        { id: 'notes', label: `Staff Notes (${(activeClient360.notes || []).length})`, icon: Icons.StickyNote }
                      ].map((tb) => {
                        const IconComponent = tb.icon;
                        const isActive = activeProfileTab === tb.id;
                        return (
                          <button
                            key={tb.id}
                            onClick={() => setActiveProfileTab(tb.id as any)}
                            className={`py-3 px-3 border-b-2 text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                              isActive
                                ? 'border-indigo-600 text-indigo-600 bg-white'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                            <span>{tb.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Modal Scrollable Body */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      {/* TAB 1: OVERVIEW */}
                      {activeProfileTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Business Details Card */}
                          <div className="md:col-span-2 space-y-6">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Icons.Building2 className="w-4 h-4 text-indigo-600" />
                                Business Information
                              </h4>

                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-slate-400 font-bold block">Company Name</span>
                                  <span className="font-extrabold text-slate-900">{activeClient360.companyName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block">Industry / Business Niche</span>
                                  <span className="font-extrabold text-slate-900">{activeClient360.businessNiche || 'General Business'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block">Primary Email</span>
                                  <span className="font-extrabold text-slate-900">{activeClient360.email}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block">Phone / WhatsApp</span>
                                  <span className="font-extrabold text-slate-900">{activeClient360.phone || 'Not specified'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block">Website</span>
                                  {activeClient360.website ? (
                                    <a
                                      href={activeClient360.website.startsWith('http') ? activeClient360.website : `https://${activeClient360.website}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-extrabold text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                      <span>{activeClient360.website}</span>
                                      <Icons.ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-500 font-medium">None</span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block">GSTIN / Tax ID</span>
                                  <span className="font-extrabold text-slate-900">{activeClient360.gstin || 'Not registered'}</span>
                                </div>
                              </div>

                              {activeClient360.address && (
                                <div className="pt-2 text-xs">
                                  <span className="text-slate-400 font-bold block">Address</span>
                                  <span className="font-medium text-slate-700">{activeClient360.address}</span>
                                </div>
                              )}
                            </div>

                            {/* Contact Persons List */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide flex items-center gap-2">
                                  <Icons.Users className="w-4 h-4 text-purple-600" />
                                  Contact Persons ({ (activeClient360.contactPersons || []).length })
                                </h4>
                                <button
                                  onClick={() => setShowAddContactModal(true)}
                                  className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                  <Icons.Plus className="w-3.5 h-3.5" />
                                  <span>Add Contact</span>
                                </button>
                              </div>

                              <div className="space-y-2.5">
                                {(activeClient360.contactPersons || []).map((cp) => (
                                  <div key={cp.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                                    <div>
                                      <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                        <span>{cp.name}</span>
                                        {cp.isPrimary && (
                                          <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded text-[9px] uppercase font-black">
                                            Primary
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-slate-500 text-[11px]">{cp.title || 'Representative'}</p>
                                    </div>
                                    <div className="text-right text-[11px]">
                                      <p className="text-slate-700 font-medium">{cp.email}</p>
                                      <p className="text-slate-500">{cp.phone}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Sidebar Info & Tags */}
                          <div className="space-y-6">
                            {/* Tags Section */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide flex items-center gap-2">
                                <Icons.Tag className="w-4 h-4 text-amber-600" />
                                Client Tags
                              </h4>

                              <div className="flex flex-wrap gap-1.5">
                                {(activeClient360.tags || []).map((tg) => (
                                  <span
                                    key={tg}
                                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                                  >
                                    <span>{tg}</span>
                                    <button
                                      onClick={() => handleRemoveTag(activeClient360, tg)}
                                      className="text-slate-400 hover:text-rose-600"
                                    >
                                      <Icons.X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center gap-1.5 pt-2">
                                <input
                                  type="text"
                                  placeholder="Add tag e.g. Retainer..."
                                  value={newTagInput}
                                  onChange={(e) => setNewTagInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddTag(activeClient360, newTagInput);
                                    }
                                  }}
                                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <button
                                  onClick={() => handleAddTag(activeClient360, newTagInput)}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
                                >
                                  Add
                                </button>
                              </div>
                            </div>

                            {/* Quick Actions Card */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide">
                                Quick Staff Actions
                              </h4>

                              <div className="space-y-2">
                                {onNavigateToTab && (
                                  <button
                                    onClick={() => {
                                      setActiveClient360(null);
                                      onNavigateToTab('proposals');
                                    }}
                                    className="w-full px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all"
                                  >
                                    <Icons.FileText className="w-4 h-4" />
                                    <span>Create New Proposal</span>
                                  </button>
                                )}

                                {onNavigateToTab && (
                                  <button
                                    onClick={() => {
                                      setActiveClient360(null);
                                      onNavigateToTab('messages');
                                    }}
                                    className="w-full px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all"
                                  >
                                    <Icons.MessageSquare className="w-4 h-4 text-indigo-600" />
                                    <span>Open Messages Thread</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => setShowAddNoteModal(true)}
                                  className="w-full px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all"
                                >
                                  <Icons.StickyNote className="w-4 h-4 text-amber-600" />
                                  <span>Add Internal Staff Note</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: TIMELINE */}
                      {activeProfileTab === 'timeline' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide">
                            Chronological Client Activity Log
                          </h4>

                          <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6">
                            {data.timeline.map((act) => (
                              <div key={act.id} className="relative group">
                                <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-black text-slate-900">{act.title}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">
                                      {new Date(act.timestamp).toLocaleString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600">{act.description}</p>
                                  {act.author && (
                                    <span className="text-[10px] text-indigo-600 font-extrabold block">By {act.author}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: INQUIRIES */}
                      {activeProfileTab === 'inquiries' && (
                        <div className="space-y-3">
                          {data.matchedInquiries.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No inquiry submissions recorded.</p>
                          ) : (
                            data.matchedInquiries.map((inq) => (
                              <div key={inq.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 text-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900">{inq.id}</span>
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-black text-[10px] uppercase">
                                      {inq.status}
                                    </span>
                                  </div>
                                  <p className="text-slate-500 mt-1">{inq.message || 'Custom scope quote submission'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-slate-900 text-sm">₹{(inq.totalDiscounted || 0).toLocaleString('en-IN')}</p>
                                  <p className="text-[10px] text-slate-400">{new Date(inq.createdAt).toLocaleDateString('en-IN')}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* TAB 4: PROPOSALS */}
                      {activeProfileTab === 'proposals' && (
                        <div className="space-y-3">
                          {data.matchedProposals.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No proposals generated for this account yet.</p>
                          ) : (
                            data.matchedProposals.map((prop) => (
                              <div key={prop.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 text-xs">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900">{prop.id}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                                        prop.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {prop.status}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 mt-1 font-medium">{prop.deliverables}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-indigo-600 text-sm">₹{prop.totalAmount.toLocaleString('en-IN')}</p>
                                  <p className="text-[10px] text-slate-400">{new Date(prop.createdAt).toLocaleDateString('en-IN')}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* TAB 5: CONTRACTS */}
                      {activeProfileTab === 'contracts' && (
                        <div className="space-y-3">
                          {data.matchedContracts.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No signed contracts on record.</p>
                          ) : (
                            data.matchedContracts.map((ctr) => (
                              <div key={ctr.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 text-xs">
                                <div>
                                  <span className="font-extrabold text-slate-900">{ctr.id} - {ctr.projectName}</span>
                                  <p className="text-slate-500 mt-0.5">{ctr.deliverables}</p>
                                </div>
                                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-[10px] font-black uppercase">
                                  {ctr.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* TAB 6: PROJECTS */}
                      {activeProfileTab === 'projects' && (
                        <div className="space-y-3">
                          {data.matchedProjects.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No active or completed delivery projects.</p>
                          ) : (
                            data.matchedProjects.map((prj) => (
                              <div key={prj.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-slate-900 text-sm">{prj.id} - {prj.projectName}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                      prj.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {prj.status}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-slate-500">
                                  <span>Manager: {prj.projectManager || 'Unassigned'}</span>
                                  <span>Progress: {prj.overallProgress}%</span>
                                </div>

                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${prj.overallProgress}%` }} />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* TAB 7: STAFF NOTES */}
                      {activeProfileTab === 'notes' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold uppercase text-slate-800">Internal Agency Notes</h4>
                            <button
                              onClick={() => setShowAddNoteModal(true)}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 flex items-center gap-1"
                            >
                              <Icons.Plus className="w-3.5 h-3.5" />
                              <span>Add Note</span>
                            </button>
                          </div>

                          {(activeClient360.notes || []).length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No staff notes recorded yet.</p>
                          ) : (
                            (activeClient360.notes || []).map((n) => (
                              <div key={n.id} className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-1 text-xs">
                                <div className="flex items-center justify-between text-slate-700">
                                  <span className="font-black text-amber-900">✍️ {n.author}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(n.timestamp).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <p className="text-slate-800 whitespace-pre-line">{n.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD NEW CLIENT MODAL --- */}
      <AnimatePresence>
        {showAddClientModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <Icons.UserPlus className="w-5 h-5 text-indigo-600" />
                  <span>Create New Client Profile</span>
                </h3>
                <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-slate-600">
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Company / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Corp"
                    value={newClientData.companyName}
                    onChange={(e) => setNewClientData({ ...newClientData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Primary Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newClientData.clientName}
                      onChange={(e) => setNewClientData({ ...newClientData, clientName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="client@example.com"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Business Niche</label>
                    <input
                      type="text"
                      placeholder="e.g. E-Commerce, SaaS"
                      value={newClientData.businessNiche}
                      onChange={(e) => setNewClientData({ ...newClientData, businessNiche: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Initial Status</label>
                    <select
                      value={newClientData.status}
                      onChange={(e: any) => setNewClientData({ ...newClientData, status: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="lead">Lead</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="VIP, Retainer"
                      value={newClientData.tags}
                      onChange={(e) => setNewClientData({ ...newClientData, tags: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-500 shadow-sm"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DUPLICATE MERGE WIZARD MODAL --- */}
      <AnimatePresence>
        {showMergeModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                    <Icons.GitMerge className="w-5 h-5 text-indigo-600" />
                    <span>Duplicate Client Consolidation Wizard</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consolidate duplicate customer records into a single primary profile.
                  </p>
                </div>
                <button onClick={() => setShowMergeModal(false)} className="text-slate-400 hover:text-slate-600">
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">1. Select Primary Profile (To Keep)</label>
                  <select
                    value={mergePrimaryId}
                    onChange={(e) => setMergePrimaryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="">-- Choose Primary Record --</option>
                    {allClientsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.clientName} - {c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-800 block mb-1">2. Select Duplicate Profile (To Merge & Consolidate)</label>
                  <select
                    value={mergeSecondaryId}
                    onChange={(e) => setMergeSecondaryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="">-- Choose Secondary Record --</option>
                    {allClientsList
                      .filter((c) => c.id !== mergePrimaryId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName} ({c.clientName} - {c.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1">
                  <p className="font-black">⚡ Merge Impact Warning:</p>
                  <p className="text-slate-700">
                    Merging will combine all tags, contact persons, staff notes, and timeline logs. Associated inquiries, proposals, contracts, and projects will be automatically linked to the primary profile.
                  </p>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowMergeModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteMerge}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black shadow-sm"
                  >
                    Merge Accounts
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD NOTE MODAL --- */}
      <AnimatePresence>
        {showAddNoteModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900">Add Staff Note</h3>
                <button onClick={() => setShowAddNoteModal(false)} className="text-slate-400 hover:text-slate-600">
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                rows={4}
                placeholder="Write confidential internal note about this client..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-500"
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD CONTACT PERSON MODAL --- */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900">Add Contact Person</h3>
                <button onClick={() => setShowAddContactModal(false)} className="text-slate-400 hover:text-slate-600">
                  <Icons.X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={newContactData.name}
                    onChange={(e) => setNewContactData({ ...newContactData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Title / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. CMO, Head of Marketing"
                    value={newContactData.title}
                    onChange={(e) => setNewContactData({ ...newContactData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="sarah@company.com"
                      value={newContactData.email}
                      onChange={(e) => setNewContactData({ ...newContactData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 00000"
                      value={newContactData.phone}
                      onChange={(e) => setNewContactData({ ...newContactData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContactPerson}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-500"
                >
                  Add Contact
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
