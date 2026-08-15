import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import { ProjectCommunication } from '../../components/ProjectCommunication';

interface AdminMessagesPageProps {
  navigate: (path: string) => void;
}

export const AdminMessagesPage: React.FC<AdminMessagesPageProps> = ({ navigate }) => {
  const { adminUser } = useAdminAuth();

  return (
    <AdminLayout
      activeTab="messages"
      currentPath="/admin/messages"
      navigate={navigate}
      requiredModule="messages"
      pageTitle="Communication Center"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <ProjectCommunication
          mode="admin-hub"
          userRole={(adminUser?.role as any) || 'admin'}
          userName={adminUser?.name || 'Staff Member'}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminMessagesPage;
