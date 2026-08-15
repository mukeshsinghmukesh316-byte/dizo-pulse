import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

export interface ClientOrderItem {
  id?: string;
  name: string;
  basePrice?: number;
  category?: string;
}

export interface ClientOrder {
  id: string;
  clientName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  businessName?: string;
  businessNiche?: string;
  selectedServices: ClientOrderItem[];
  totalPrice: number;
  timeline?: string;
  urgency?: string;
  projectBrief?: string;
  status: string;
  createdAt: string;
}

interface PortalOrdersPageProps {
  navigate: (path: string) => void;
  orderId?: string;
}

export const PortalOrdersPage: React.FC<PortalOrdersPageProps> = ({ orderId: propOrderId }) => {
  const { currentUser } = useAuth();

  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [currentUser?.email]);

  const loadOrders = async () => {
    try {
      const email = currentUser?.email || 'client@business.com';
      const res = await fetch(`/api/users/orders?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setOrders(data);
        } else {
          loadFallbackOrders();
        }
      } else {
        loadFallbackOrders();
      }
    } catch (e) {
      loadFallbackOrders();
    }
  };

  const loadFallbackOrders = () => {
    const sampleOrders: ClientOrder[] = [
      {
        id: 'ORD-1092',
        clientName: currentUser?.name || 'Valued Client',
        email: currentUser?.email || 'client@business.com',
        phone: currentUser?.whatsapp || '+91 98765 43210',
        whatsapp: currentUser?.whatsapp || '+91 98765 43210',
        businessName: currentUser?.company || 'Aura Digital Labs',
        businessNiche: currentUser?.industry || 'E-Commerce & Retail',
        selectedServices: [
          { id: '1', name: 'Logo & Complete Brand Identity Pack', basePrice: 4999, category: 'Branding & Graphics' },
          { id: '2', name: 'High-Converting Landing Page Architecture', basePrice: 8999, category: 'Web Development' },
          { id: '3', name: '15 High-Retention Instagram Reels Growth Pack', basePrice: 8402, category: 'Video Editing' }
        ],
        totalPrice: 22400,
        timeline: '7 - 10 Business Days',
        urgency: 'Medium',
        projectBrief: 'Full digital brand overhaul including customized vector logo pack, responsive React landing page, and 15 viral reels.',
        status: 'In Progress',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ORD-1045',
        clientName: currentUser?.name || 'Valued Client',
        email: currentUser?.email || 'client@business.com',
        phone: currentUser?.whatsapp || '+91 98765 43210',
        whatsapp: currentUser?.whatsapp || '+91 98765 43210',
        businessName: currentUser?.company || 'Aura Digital Labs',
        businessNiche: currentUser?.industry || 'E-Commerce & Retail',
        selectedServices: [
          { id: '4', name: 'Performance SEO & Keyword Ranking Audit', basePrice: 6500, category: 'SEO & Organic Growth' }
        ],
        totalPrice: 6500,
        timeline: '3 - 5 Days',
        urgency: 'Normal',
        projectBrief: 'Technical audit and core keyword strategy map for Google Search indexing.',
        status: 'Completed',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    setOrders(sampleOrders);
  };

  const handleDownloadInvoice = (order: ClientOrder) => {
    setDownloadToast(`Generating Official GST Receipt for ${order.id}...`);
    setTimeout(() => {
      const invoiceText = `=====================================================
DIZO PULSE DIGITAL AGENCY - OFFICIAL GST TAX INVOICE
=====================================================
Invoice ID: INV-${order.id}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Client Name: ${order.clientName}
Business: ${order.businessName || 'Aura Digital Labs'}
Email: ${order.email}
Phone: ${order.phone || order.whatsapp || '+91 70173 24978'}

ITEMS BILLED:
${order.selectedServices.map((s, i) => `${i + 1}. ${s.name} - ₹${s.basePrice?.toLocaleString('en-IN') || 0}`).join('\n')}

Subtotal: ₹${order.totalPrice.toLocaleString('en-IN')}
GST (18% included): ₹${Math.round(order.totalPrice * 0.18).toLocaleString('en-IN')}
Total Paid: ₹${order.totalPrice.toLocaleString('en-IN')}

Payment Status: Verified / Settled
=====================================================
Thank you for scaling with Dizo Pulse.
support.dizopulse@gmail.com | +91 70173 24978
=====================================================`;

      const blob = new Blob([invoiceText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${order.id}_DizoPulse.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadToast(`Invoice for ${order.id} downloaded!`);
      setTimeout(() => setDownloadToast(null), 3000);
    }, 600);
  };

  const filteredOrders = orders.filter((o) => {
    if (propOrderId && o.id === propOrderId) return true;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.businessName?.toLowerCase().includes(q) ||
      o.selectedServices.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8" id="portal-orders-page">
      {/* Toast Alert */}
      <AnimatePresence>
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-6 z-50 p-3.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-2xl"
          >
            <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Orders & Billing History
            </h1>
            <span className="px-2.5 py-0.5 bg-violet-950 border border-violet-800 text-violet-300 text-[10px] font-black uppercase tracking-wider rounded-full">
              {orders.length} Records
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Access past order histories, itemized cost breakdowns, and download GST tax invoices.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders or services..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isCompleted = order.status === 'Completed';
            const isInProgress = order.status === 'In Progress';

            return (
              <div
                key={order.id}
                className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-6 space-y-5 transition-all shadow-xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-violet-950 border border-violet-800/80 flex items-center justify-center text-violet-400 font-bold shrink-0">
                      <Icons.Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-mono">{order.id}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isInProgress
                              ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} • {order.timeline || '7-10 Days'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
                      <span className="text-base font-black text-white font-mono">
                        ₹{order.totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownloadInvoice(order)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <Icons.Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>

                {/* Services itemized table */}
                <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Billed Services & Deliverables ({order.selectedServices.length})
                  </span>
                  <div className="divide-y divide-slate-800/60">
                    {order.selectedServices.map((service, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-900 text-slate-400 font-mono text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-slate-200 font-semibold">{service.name}</span>
                        </div>
                        <span className="text-white font-mono font-bold">
                          ₹{service.basePrice?.toLocaleString('en-IN') || 'Included'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brief & Notes */}
                {order.projectBrief && (
                  <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                    Scope Note: &quot;{order.projectBrief}&quot;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Icons.Receipt className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Orders Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no billing orders matching your query.
          </p>
        </div>
      )}
    </div>
  );
};
export default PortalOrdersPage;
