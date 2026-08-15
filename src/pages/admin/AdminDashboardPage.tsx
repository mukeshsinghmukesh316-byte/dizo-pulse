import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import { AgencyOperationsDashboard } from '../../components/AgencyOperationsDashboard';
import { Inquiry, Proposal, Contract, Project } from '../../types';
import * as Icons from 'lucide-react';

interface AdminDashboardPageProps {
  navigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const { adminUser } = useAdminAuth();

  // State data for dashboard widgets
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [inqRes, propRes, ctrRes, prjRes, convRes, staffRes] = await Promise.allSettled([
        fetch('/api/inquiries').then(r => r.ok ? r.json() : []),
        fetch('/api/proposals').then(r => r.ok ? r.json() : []),
        fetch('/api/contracts').then(r => r.ok ? r.json() : []),
        fetch('/api/projects').then(r => r.ok ? r.json() : []),
        fetch('/api/conversations').then(r => r.ok ? r.json() : []),
        fetch('/api/admin/staff').then(r => r.ok ? r.json() : []),
      ]);

      if (inqRes.status === 'fulfilled') setInquiries(Array.isArray(inqRes.value) ? inqRes.value : []);
      if (propRes.status === 'fulfilled') setProposals(Array.isArray(propRes.value) ? propRes.value : []);
      if (ctrRes.status === 'fulfilled') setContracts(Array.isArray(ctrRes.value) ? ctrRes.value : []);
      if (prjRes.status === 'fulfilled') setProjects(Array.isArray(prjRes.value) ? prjRes.value : []);
      if (convRes.status === 'fulfilled') setConversations(Array.isArray(convRes.value) ? convRes.value : []);
      if (staffRes.status === 'fulfilled') setStaffList(Array.isArray(staffRes.value) ? staffRes.value : []);
    } catch (err) {
      console.error('Error fetching dashboard agency data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTabNavigation = (tab: string) => {
    switch (tab) {
      case 'pipeline':
      case 'clients':
      case 'crm':
        navigate('/admin/crm');
        break;
      case 'proposals':
        navigate('/admin/proposals');
        break;
      case 'contracts':
        navigate('/admin/contracts');
        break;
      case 'projects':
        navigate('/admin/projects');
        break;
      case 'messages':
        navigate('/admin/messages');
        break;
      case 'assets':
        navigate('/admin/assets');
        break;
      case 'analytics':
        navigate('/admin/analytics');
        break;
      case 'pricing':
      case 'services':
        navigate('/admin/services');
        break;
      case 'website_content':
      case 'content':
        navigate('/admin/content');
        break;
      case 'seo':
        navigate('/admin/seo');
        break;
      case 'staff':
        navigate('/admin/staff');
        break;
      case 'settings':
      case 'security':
      case 'audit_logs':
      case 'integrations':
        navigate('/admin/settings');
        break;
      default:
        navigate('/admin/dashboard');
    }
  };

  return (
    <AdminLayout
      activeTab="overview"
      currentPath="/admin/dashboard"
      navigate={navigate}
      pageTitle="Operations Dashboard"
      contextualActions={{
        onRefreshData: fetchDashboardData,
        onNewLead: () => navigate('/admin/crm?action=new-lead'),
        onNewProposal: () => navigate('/admin/proposals?action=new-proposal'),
      }}
    >
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading agency telemetry metrics...</p>
        </div>
      ) : (
        <AgencyOperationsDashboard
          inquiries={inquiries}
          proposals={proposals}
          contracts={contracts}
          projects={projects}
          conversations={conversations}
          staffList={staffList}
          userRole={adminUser?.role || 'admin'}
          userName={adminUser?.name || 'Staff'}
          userEmail={adminUser?.email || ''}
          onNavigateTab={handleTabNavigation}
          onOpenAddLeadModal={() => navigate('/admin/crm?action=new-lead')}
          onOpenNewProposalModal={() => navigate('/admin/proposals?action=new-proposal')}
          onSelectInquiry={() => navigate('/admin/crm')}
          onConvertInquiryToProposal={() => navigate('/admin/proposals?action=new-proposal')}
          onOpenChangePassword={() => {}}
        />
      )}
    </AdminLayout>
  );
};

export default AdminDashboardPage;
