import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import { ServicesCatalogAdmin } from '../../components/ServicesCatalogAdmin';
import { Service, ServiceBundle } from '../../types';
import * as Icons from 'lucide-react';

interface AdminServicesPageProps {
  navigate: (path: string) => void;
}

export const AdminServicesPage: React.FC<AdminServicesPageProps> = ({ navigate }) => {
  const { adminUser } = useAdminAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchServicesAndBundles = async () => {
    setIsLoading(true);
    try {
      const [srvRes, bndRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/bundles')
      ]);

      if (srvRes.ok) {
        const srvData = await srvRes.json();
        setServices(Array.isArray(srvData) ? srvData : []);
      }
      if (bndRes.ok) {
        const bndData = await bndRes.json();
        setBundles(Array.isArray(bndData) ? bndData : []);
      }
    } catch (e) {
      console.error('Error loading services and bundles:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesAndBundles();
  }, []);

  return (
    <AdminLayout
      activeTab="services"
      currentPath="/admin/services"
      navigate={navigate}
      requiredModule="services"
      pageTitle="Services & Pricing Engine"
      contextualActions={{
        onRefreshData: fetchServicesAndBundles
      }}
    >
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading services catalog & pricing models...</p>
        </div>
      ) : (
        <ServicesCatalogAdmin
          services={services}
          bundles={bundles}
          userRole={(adminUser?.role as any) || 'admin'}
          userName={adminUser?.name || 'Admin'}
          onRefreshServices={async () => {
            const res = await fetch('/api/services');
            if (res.ok) setServices(await res.json());
          }}
          onRefreshBundles={async () => {
            const res = await fetch('/api/bundles');
            if (res.ok) setBundles(await res.json());
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminServicesPage;
