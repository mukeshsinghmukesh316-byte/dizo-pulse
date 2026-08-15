import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import ContractsAdmin from '../../components/ContractsAdmin';
import { Contract, Proposal } from '../../types';

interface AdminContractsPageProps {
  navigate: (path: string) => void;
  contractIdParam?: string;
}

export const AdminContractsPage: React.FC<AdminContractsPageProps> = ({
  navigate,
  contractIdParam,
}) => {
  const [proposalToConvert, setProposalToConvert] = useState<Proposal | null>(null);

  // Check URL query parameters for ?proposalId=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const propId = params.get('proposalId');
    if (propId) {
      fetch(`/api/proposals/${propId}`)
        .then(r => r.ok ? r.json() : null)
        .then(prop => {
          if (prop) {
            setProposalToConvert(prop);
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleConvertToProject = (contract: Contract) => {
    navigate(`/admin/projects?action=new-project&contractId=${contract.id}`);
  };

  return (
    <AdminLayout
      activeTab="contracts"
      currentPath="/admin/contracts"
      navigate={navigate}
      requiredModule="contracts"
      pageTitle="Contract Management"
    >
      <ContractsAdmin
        initialProposalToConvert={proposalToConvert}
        onClearProposalToConvert={() => setProposalToConvert(null)}
        onConvertToProject={handleConvertToProject}
      />
    </AdminLayout>
  );
};

export default AdminContractsPage;
