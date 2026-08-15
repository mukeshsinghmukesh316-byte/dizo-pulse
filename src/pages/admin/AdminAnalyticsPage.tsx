import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import { BusinessIntelligenceDashboard } from '../../components/BusinessIntelligenceDashboard';
import { Inquiry, Proposal, Contract, Project, Service, StaffMember } from '../../types';
import * as Icons from 'lucide-react';

interface AdminAnalyticsPageProps {
  navigate: (path: string) => void;
}

export const AdminAnalyticsPage: React.FC<AdminAnalyticsPageProps> = ({ navigate }) => {
  const { adminUser } = useAdminAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [inqRes, propRes, ctrRes, prjRes, srvRes, stfRes] = await Promise.all([
        fetch('/api/inquiries'),
        fetch('/api/proposals'),
        fetch('/api/contracts'),
        fetch('/api/projects'),
        fetch('/api/services'),
        fetch('/api/admin/staff')
      ]);

      const [inqData, propData, ctrData, prjData, srvData, stfData] = await Promise.all([
        inqRes.ok ? inqRes.json() : [],
        propRes.ok ? propRes.json() : [],
        ctrRes.ok ? ctrRes.json() : [],
        prjRes.ok ? prjRes.json() : [],
        srvRes.ok ? srvRes.json() : [],
        stfRes.ok ? stfRes.json() : []
      ]);

      setInquiries(Array.isArray(inqData) ? inqData : []);
      setProposals(Array.isArray(propData) ? propData : []);
      setContracts(Array.isArray(ctrData) ? ctrData : []);
      setProjects(Array.isArray(prjData) ? prjData : []);
      setServices(Array.isArray(srvData) ? srvData : []);
      setStaffList(Array.isArray(stfData) ? stfData : []);
    } catch (e) {
      console.error('Error fetching analytics data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <AdminLayout
      activeTab="analytics"
      currentPath="/admin/analytics"
      navigate={navigate}
      requiredModule="analytics"
      pageTitle="Analytics & Intelligence"
      contextualActions={{
        onRefreshData: fetchAllData
      }}
    >
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading intelligence metrics and funnel data...</p>
        </div>
      ) : (
        <BusinessIntelligenceDashboard
          inquiries={inquiries}
          proposals={proposals}
          contracts={contracts}
          projects={projects}
          staffList={staffList}
          servicesList={services}
          userRole={adminUser?.role || 'admin'}
          userName={adminUser?.name || 'Administrator'}
          onRefresh={fetchAllData}
        />
      )}
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;
