import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import * as Icons from 'lucide-react';
import { showToast } from '../../components/UIPolish';

interface AdminSettingsPageProps {
  navigate: (path: string) => void;
}

interface PaymentQR {
  id: string;
  label: string;
  upiId?: string;
  imageUrl: string;
}

interface BankDetails {
  id: string;
  label: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ navigate }) => {
  const { adminUser } = useAdminAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'branding' | 'payments' | 'security' | 'audit'>('branding');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Branding State
  const [logoFirst, setLogoFirst] = useState('DIZO');
  const [logoSecond, setLogoSecond] = useState('PULSE');
  const [logoSubtitle, setLogoSubtitle] = useState('Creative Media & Digital Agency');
  const [cyanStart, setCyanStart] = useState('#06b6d4');
  const [cyanEnd, setCyanEnd] = useState('#3b82f6');
  const [indigoStart, setIndigoStart] = useState('#6366f1');
  const [indigoEnd, setIndigoEnd] = useState('#a855f7');

  // Payments State
  const [paymentQRs, setPaymentQRs] = useState<PaymentQR[]>([
    {
      id: 'qr-1',
      label: 'Official UPI Merchant QR (GPay / PhonePe / Paytm)',
      upiId: 'dizopulse@okaxis',
      imageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=dizopulse@okaxis&pn=DizoPulse'
    }
  ]);
  const [newQrLabel, setNewQrLabel] = useState('');
  const [newQrUpiId, setNewQrUpiId] = useState('');
  const [newQrImageUrl, setNewQrImageUrl] = useState('');

  const [bankDetailsList, setBankDetailsList] = useState<BankDetails[]>([
    {
      id: 'bank-1',
      label: 'Primary Current Account',
      bankName: 'Axis Bank Ltd.',
      accountName: 'DIZO PULSE CREATIVE MEDIA',
      accountNumber: '923020054819284',
      ifscCode: 'UTIB0001604'
    }
  ]);
  const [newBankLabel, setNewBankLabel] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccountName, setNewBankAccountName] = useState('');
  const [newBankAccountNumber, setNewBankAccountNumber] = useState('');
  const [newBankIfscCode, setNewBankIfscCode] = useState('');

  const [splitAdvancePercent, setSplitAdvancePercent] = useState<number>(50);
  const [splitInstructions, setSplitInstructions] = useState(
    '50% advance milestone deposit required upon signing proposal to initialize design & staging kickoff. Remaining 50% upon final signoff.'
  );

  // Security / Admin Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          if (data.logoFirst) setLogoFirst(data.logoFirst);
          if (data.logoSecond) setLogoSecond(data.logoSecond);
          if (data.logoSubtitle) setLogoSubtitle(data.logoSubtitle);
          if (data.cyanStart) setCyanStart(data.cyanStart);
          if (data.cyanEnd) setCyanEnd(data.cyanEnd);
          if (data.indigoStart) setIndigoStart(data.indigoStart);
          if (data.indigoEnd) setIndigoEnd(data.indigoEnd);

          if (Array.isArray(data.paymentQRs)) setPaymentQRs(data.paymentQRs);
          if (Array.isArray(data.bankDetailsList)) setBankDetailsList(data.bankDetailsList);
          if (data.splitDetails) {
            setSplitAdvancePercent(data.splitDetails.advancePercent || 50);
            setSplitInstructions(data.splitDetails.instructions || splitInstructions);
          }
        }
      })
      .catch(console.error);

    fetch('/api/admin/audit-logs')
      .then(res => (res.ok ? res.json() : []))
      .then(data => setAuditLogs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const payload = {
        logoFirst,
        logoSecond,
        logoSubtitle,
        cyanStart,
        cyanEnd,
        indigoStart,
        indigoEnd,
        paymentQRs,
        bankDetailsList,
        splitDetails: {
          advancePercent: Number(splitAdvancePercent),
          instructions: splitInstructions
        }
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Settings Saved', 'System preferences and branding updated!', 'success');
      } else {
        showToast('Save Failed', 'Server error while saving settings', 'error');
      }
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQR = () => {
    if (!newQrLabel) return;
    const newQr: PaymentQR = {
      id: `qr-${Date.now()}`,
      label: newQrLabel,
      upiId: newQrUpiId,
      imageUrl:
        newQrImageUrl ||
        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${newQrUpiId || 'payment@okaxis'}`
    };
    setPaymentQRs([...paymentQRs, newQr]);
    setNewQrLabel('');
    setNewQrUpiId('');
    setNewQrImageUrl('');
  };

  const handleRemoveQR = (id: string) => {
    setPaymentQRs(paymentQRs.filter(qr => qr.id !== id));
  };

  const handleAddBank = () => {
    if (!newBankLabel || !newBankAccountNumber) return;
    const newBank: BankDetails = {
      id: `bank-${Date.now()}`,
      label: newBankLabel,
      bankName: newBankName || 'Bank of India',
      accountName: newBankAccountName || 'Agency Operations',
      accountNumber: newBankAccountNumber,
      ifscCode: newBankIfscCode
    };
    setBankDetailsList([...bankDetailsList, newBank]);
    setNewBankLabel('');
    setNewBankName('');
    setNewBankAccountName('');
    setNewBankAccountNumber('');
    setNewBankIfscCode('');
  };

  const handleRemoveBank = (id: string) => {
    setBankDetailsList(bankDetailsList.filter(b => b.id !== id));
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Password Mismatch', 'New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Weak Password', 'Password must be at least 6 characters', 'warning');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const email = adminUser?.email || sessionStorage.getItem('dizopulse_admin_email') || '';
      const res = await fetch('/api/admin/staff/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          oldPassword,
          newPassword
        })
      });

      if (res.ok) {
        showToast('Password Changed', 'Admin credentials updated securely!', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const d = await res.json().catch(() => ({}));
        showToast('Update Failed', d.error || d.message || 'Current password incorrect', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <AdminLayout
      activeTab="settings"
      currentPath="/admin/settings"
      navigate={navigate}
      requiredModule="settings"
      pageTitle="System Settings & Security"
      contextualActions={{
        onRefreshData: () => window.location.reload()
      }}
    >
      {/* Sub Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'branding', label: 'Branding & Visuals', icon: 'Palette' },
            { key: 'payments', label: 'Payment QR & IMPS', icon: 'QrCode' },
            { key: 'security', label: 'Security & Password', icon: 'ShieldCheck' },
            { key: 'audit', label: 'Audit Trail Logs', icon: 'Scroll' }
          ].map(tab => {
            const IconComp = (Icons as any)[tab.icon] || Icons.Settings;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab !== 'security' && activeTab !== 'audit' && (
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isSaving ? (
              <>
                <Icons.Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icons.Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 max-w-3xl">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Icons.Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Agency Branding & Logo Typography</h3>
              <p className="text-[11px] text-slate-400">Configure corporate identity headers and brand gradients</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Logo Text First Half *
                </label>
                <input
                  type="text"
                  value={logoFirst}
                  onChange={e => setLogoFirst(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-black text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Logo Text Second Half *
                </label>
                <input
                  type="text"
                  value={logoSecond}
                  onChange={e => setLogoSecond(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-black text-indigo-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Logo Subtitle / Tagline *
              </label>
              <input
                type="text"
                value={logoSubtitle}
                onChange={e => setLogoSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Brand Color Accent Palette</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Primary Cyan</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cyanStart}
                      onChange={e => setCyanStart(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">{cyanStart}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Accent Blue</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cyanEnd}
                      onChange={e => setCyanEnd(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">{cyanEnd}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Indigo Start</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={indigoStart}
                      onChange={e => setIndigoStart(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">{indigoStart}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Purple End</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={indigoEnd}
                      onChange={e => setIndigoEnd(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">{indigoEnd}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Codes */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-black text-white">1. Merchant UPI QR Codes</h3>
            <div className="space-y-3">
              {paymentQRs.map(qr => (
                <div
                  key={qr.id}
                  className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img src={qr.imageUrl} alt={qr.label} className="w-12 h-12 rounded-xl object-cover bg-white p-1" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{qr.label}</h4>
                      <p className="text-[10px] font-mono text-indigo-400">{qr.upiId || 'No UPI ID'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveQR(qr.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Icons.Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add QR */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Add New UPI QR Option</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="QR Label (e.g. PhonePe QR)"
                  value={newQrLabel}
                  onChange={e => setNewQrLabel(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="UPI ID (e.g. pay@okaxis)"
                  value={newQrUpiId}
                  onChange={e => setNewQrUpiId(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleAddQR}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                + Add QR Code
              </button>
            </div>
          </div>

          {/* Bank Accounts & Split Policies */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-black text-white">2. Bank IMPS / NEFT Accounts</h3>
            <div className="space-y-3">
              {bankDetailsList.map(bank => (
                <div
                  key={bank.id}
                  className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{bank.label}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-bold rounded-md">
                        {bank.bankName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-x-2">
                      <span>A/C: <strong className="text-slate-200 font-mono">{bank.accountNumber}</strong></span>
                      <span>IFSC: <strong className="text-slate-200 font-mono">{bank.ifscCode}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBank(bank.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Icons.Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Split Contract policy */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300">3. Milestone Split Advance Policy</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400">Advance Percentage:</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={splitAdvancePercent}
                    onChange={e => setSplitAdvancePercent(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold font-mono text-emerald-400"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>

                <textarea
                  rows={2}
                  value={splitInstructions}
                  onChange={e => setSplitInstructions(e.target.value)}
                  placeholder="Terms instructions shown to client upon selecting split payment..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security & Password Tab */}
      {activeTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 max-w-lg">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Icons.KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Update Admin Password</h3>
              <p className="text-[11px] text-slate-400">Change your master operations access code</p>
            </div>
          </div>

          <form onSubmit={handleUpdateAdminPassword} className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                New Secure Password *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Admin Password'}
            </button>
          </form>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-white">System Security Audit Trail</h3>
              <p className="text-[11px] text-slate-400">Chronological activity record of staff operations & logins</p>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">No recent audit log entries.</div>
            ) : (
              auditLogs.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{log.action || log.event || 'System Action'}</span>
                      <span className="text-[10px] text-slate-500">by {log.userName || log.userEmail || 'Admin'}</span>
                    </div>
                    {log.details && <p className="text-[11px] text-slate-400">{log.details}</p>}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(log.timestamp || Date.now()).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettingsPage;
