import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import StaffManagement from '../../components/StaffManagement';

interface AdminStaffPageProps {
  navigate: (path: string) => void;
}

export const AdminStaffPage: React.FC<AdminStaffPageProps> = ({ navigate }) => {
  const { adminUser } = useAdminAuth();

  return (
    <AdminLayout
      activeTab="staff"
      currentPath="/admin/staff"
      navigate={navigate}
      requiredModule="staff"
      pageTitle="Team & RBAC Access Control"
    >
      <StaffManagement
        currentAdminRole={adminUser?.role || 'admin'}
        currentUserEmail={adminUser?.email || ''}
      />
    </AdminLayout>
  );
};

export default AdminStaffPage;
