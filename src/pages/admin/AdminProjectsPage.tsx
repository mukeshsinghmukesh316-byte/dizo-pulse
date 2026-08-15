import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import ProjectsAdmin from '../../components/ProjectsAdmin';
import { Contract } from '../../types';

interface AdminProjectsPageProps {
  navigate: (path: string) => void;
  projectIdParam?: string;
}

export const AdminProjectsPage: React.FC<AdminProjectsPageProps> = ({
  navigate,
  projectIdParam,
}) => {
  const [contractToConvert, setContractToConvert] = useState<Contract | null>(null);

  // Check URL query parameters for ?contractId=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contractId = params.get('contractId');
    if (contractId) {
      fetch(`/api/contracts/${contractId}`)
        .then(r => r.ok ? r.json() : null)
        .then(ctr => {
          if (ctr) {
            setContractToConvert(ctr);
          }
        })
        .catch(console.error);
    }
  }, []);

  return (
    <AdminLayout
      activeTab="projects"
      currentPath="/admin/projects"
      navigate={navigate}
      requiredModule="projects"
      pageTitle="Project Management"
    >
      <ProjectsAdmin
        initialContractToConvert={contractToConvert}
        onClearContractToConvert={() => setContractToConvert(null)}
      />
    </AdminLayout>
  );
};

export default AdminProjectsPage;
