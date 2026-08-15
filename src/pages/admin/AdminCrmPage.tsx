import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import { LeadsCrmPipeline } from '../../components/LeadsCrmPipeline';
import { ClientsCrmAdmin } from '../../components/ClientsCrmAdmin';
import { Inquiry, Service, Proposal, Contract, Project } from '../../types';
import * as Icons from 'lucide-react';
import { showToast } from '../../components/UIPolish';

interface AdminCrmPageProps {
  navigate: (path: string) => void;
  defaultSubView?: 'pipeline' | 'clients';
}

export const AdminCrmPage: React.FC<AdminCrmPageProps> = ({
  navigate,
  defaultSubView = 'pipeline',
}) => {
  const { adminUser } = useAdminAuth();

  const [activeSubView, setActiveSubView] = useState<'pipeline' | 'clients'>(defaultSubView);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Manual Lead Creator Modal State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    clientName: '',
    whatsapp: '',
    email: '',
    businessName: '',
    businessNiche: '',
    message: '',
    selectedServiceIds: [] as string[],
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Check URL query parameters for ?action=new-lead
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new-lead') {
      setShowAddLeadModal(true);
    }
  }, []);

  const fetchCrmData = async () => {
    setIsLoading(true);
    try {
      const [inqRes, srvRes, stfRes, propRes, ctrRes, prjRes] = await Promise.allSettled([
        fetch('/api/inquiries').then(r => r.ok ? r.json() : []),
        fetch('/api/services').then(r => r.ok ? r.json() : []),
        fetch('/api/admin/staff').then(r => r.ok ? r.json() : []),
        fetch('/api/proposals').then(r => r.ok ? r.json() : []),
        fetch('/api/contracts').then(r => r.ok ? r.json() : []),
        fetch('/api/projects').then(r => r.ok ? r.json() : []),
      ]);

      if (inqRes.status === 'fulfilled') setInquiries(Array.isArray(inqRes.value) ? inqRes.value : []);
      if (srvRes.status === 'fulfilled') setServicesList(Array.isArray(srvRes.value) ? srvRes.value : []);
      if (stfRes.status === 'fulfilled') setStaffList(Array.isArray(stfRes.value) ? stfRes.value : []);
      if (propRes.status === 'fulfilled') setProposals(Array.isArray(propRes.value) ? propRes.value : []);
      if (ctrRes.status === 'fulfilled') setContracts(Array.isArray(ctrRes.value) ? ctrRes.value : []);
      if (prjRes.status === 'fulfilled') setProjects(Array.isArray(prjRes.value) ? prjRes.value : []);
    } catch (err) {
      console.error('Error loading CRM data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmData();
  }, []);

  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.clientName || !newLeadForm.whatsapp || !newLeadForm.email || !newLeadForm.businessName) {
      showToast('Validation Error', 'Please fill out all required fields marked with *', 'warning');
      return;
    }

    setIsSubmittingLead(true);
    let originalPrice = 0;
    newLeadForm.selectedServiceIds.forEach(id => {
      const s = servicesList.find(item => item.id === id);
      if (s) originalPrice += s.mrp;
    });
    const discountedPrice = Math.round(originalPrice * 0.8);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newLeadForm.clientName,
          whatsapp: newLeadForm.whatsapp,
          email: newLeadForm.email,
          businessName: newLeadForm.businessName,
          businessNiche: newLeadForm.businessNiche || 'General Growth',
          message: newLeadForm.message || 'Manually logged by Admin Desk',
          services: newLeadForm.selectedServiceIds,
          totalOriginal: originalPrice || 15000,
          totalDiscounted: discountedPrice || 12000,
        })
      });

      if (res.ok) {
        showToast('Lead Created', `Added ${newLeadForm.clientName} to pipeline!`, 'success');
        setShowAddLeadModal(false);
        setNewLeadForm({
          clientName: '',
          whatsapp: '',
          email: '',
          businessName: '',
          businessNiche: '',
          message: '',
          selectedServiceIds: [],
        });
        await fetchCrmData();
      } else {
        showToast('Creation Failed', 'Failed to create lead on server', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Network error', 'error');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleConvertInquiryToProposal = (inq: Inquiry) => {
    // Navigate to proposals with pre-filled inquiry ID
    navigate(`/admin/proposals?action=new-proposal&inquiryId=${inq.id}`);
  };

  return (
    <AdminLayout
      activeTab="pipeline"
      currentPath="/admin/crm"
      navigate={navigate}
      requiredModule="crm"
      pageTitle="Leads & Client CRM"
      contextualActions={{
        onRefreshData: fetchCrmData,
        onNewLead: () => setShowAddLeadModal(true),
      }}
    >
      {/* Sub Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubView('pipeline')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeSubView === 'pipeline'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icons.Layers className="w-3.5 h-3.5" />
            <span>Leads Pipeline ({inquiries.filter(i => !i.archived).length})</span>
          </button>

          <button
            onClick={() => setActiveSubView('clients')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeSubView === 'clients'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icons.Users className="w-3.5 h-3.5" />
            <span>Client Accounts (360°)</span>
          </button>
        </div>

        <button
          onClick={() => setShowAddLeadModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
        >
          <Icons.PlusCircle className="w-4 h-4" />
          <span>Add New Lead</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading CRM Pipeline & Accounts...</p>
        </div>
      ) : activeSubView === 'pipeline' ? (
        <LeadsCrmPipeline
          inquiries={inquiries}
          servicesList={servicesList}
          staffList={staffList}
          userRole={(adminUser?.role as any) || 'admin'}
          userName={adminUser?.name || 'Staff'}
          userEmail={adminUser?.email || ''}
          userPermissions={adminUser?.permissions}
          onRefreshInquiries={fetchCrmData}
          onConvertInquiryToProposal={handleConvertInquiryToProposal}
          onOpenAddLeadModal={() => setShowAddLeadModal(true)}
        />
      ) : (
        <ClientsCrmAdmin
          inquiries={inquiries}
          proposals={proposals}
          contracts={contracts}
          projects={projects}
          staffList={staffList}
          userRole={adminUser?.role || 'admin'}
          userName={adminUser?.name || 'Staff'}
          onRefresh={fetchCrmData}
          onNavigateToTab={(tab) => {
            if (tab === 'proposals') navigate('/admin/proposals');
            else if (tab === 'contracts') navigate('/admin/contracts');
            else if (tab === 'projects') navigate('/admin/projects');
            else if (tab === 'messages') navigate('/admin/messages');
          }}
        />
      )}

      {/* Manual Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Icons.UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Log New Manual Lead</h3>
                  <p className="text-[11px] text-slate-400">Directly add an inquiry to the CRM pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.clientName}
                    onChange={e => setNewLeadForm({ ...newLeadForm, clientName: e.target.value })}
                    placeholder="e.g. John Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Business / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.businessName}
                    onChange={e => setNewLeadForm({ ...newLeadForm, businessName: e.target.value })}
                    placeholder="e.g. Acme Fashion"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.whatsapp}
                    onChange={e => setNewLeadForm({ ...newLeadForm, whatsapp: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newLeadForm.email}
                    onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="client@acme.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Business Industry / Niche
                </label>
                <input
                  type="text"
                  value={newLeadForm.businessNiche}
                  onChange={e => setNewLeadForm({ ...newLeadForm, businessNiche: e.target.value })}
                  placeholder="e.g. E-Commerce / Fashion / Real Estate"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Interested Services
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {servicesList.map(srv => {
                    const isSelected = newLeadForm.selectedServiceIds.includes(srv.id);
                    return (
                      <button
                        type="button"
                        key={srv.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewLeadForm({
                              ...newLeadForm,
                              selectedServiceIds: newLeadForm.selectedServiceIds.filter(id => id !== srv.id)
                            });
                          } else {
                            setNewLeadForm({
                              ...newLeadForm,
                              selectedServiceIds: [...newLeadForm.selectedServiceIds, srv.id]
                            });
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all border ${
                          isSelected
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {srv.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Lead Requirement Notes
                </label>
                <textarea
                  rows={2}
                  value={newLeadForm.message}
                  onChange={e => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                  placeholder="Initial inquiry details or client requirements..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {isSubmittingLead ? (
                    <>
                      <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Add to CRM</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCrmPage;
