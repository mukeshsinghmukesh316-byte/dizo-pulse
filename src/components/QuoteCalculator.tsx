import React, { useState, useEffect } from 'react';
import { Service, Inquiry } from '../types';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from './UIPolish';

interface QuoteCalculatorProps {
  selectedServices: Service[];
  onRemoveService: (serviceId: string) => void;
  onClearServices: () => void;
  onInquirySubmitted?: () => void;
  settings?: any;
  globalCouponCode?: string;
  setGlobalCouponCode?: (code: string) => void;
}

export default function QuoteCalculator({
  selectedServices,
  onRemoveService,
  onClearServices,
  onInquirySubmitted,
  settings,
  globalCouponCode,
  setGlobalCouponCode
}: QuoteCalculatorProps) {
  // Form fields
  const [clientName, setClientName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessNiche, setBusinessNiche] = useState('');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank' | 'split'>('split');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Mobile Bottom Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [activeQrId, setActiveQrId] = useState<string>('');
  const [activeBankId, setActiveBankId] = useState<string>('');

  // Coupon fields
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Pre-fill user contact details if logged in
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('dizopulse_user');
      if (storedUser) {
        setIsLoggedIn(true);
        try {
          const u = JSON.parse(storedUser);
          if (u.name) setClientName(u.name);
          if (u.email) setEmail(u.email);
          if (u.whatsapp) setWhatsapp(u.whatsapp);
        } catch (e) {}
      } else {
        setIsLoggedIn(false);
      }
    };
    checkUser();
    const interval = setInterval(checkUser, 1500);
    return () => clearInterval(interval);
  }, []);

  const qrs = settings?.paymentQRs || [
    {
      id: 'qr-1',
      label: 'GPay / PhonePe UPI',
      imageUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=400&q=80',
      upiId: 'support.dizopulse@okaxis'
    }
  ];

  const banks = settings?.bankDetailsList || [
    {
      id: 'bank-1',
      label: 'Primary Axis Account',
      bankName: 'Axis Bank',
      accountName: 'DIZO PULSE',
      accountNumber: '923020054718420',
      ifscCode: 'UTIB0001604'
    }
  ];

  const splitDetails = settings?.splitDetails || {
    advancePercent: 50,
    instructions: 'To initiate your project contract, transfer the advance to UPI or Bank. Click the WhatsApp button below to instantly verify your contract draft!'
  };

  useEffect(() => {
    if (qrs.length > 0 && !activeQrId) {
      setActiveQrId(qrs[0].id);
    }
  }, [qrs, activeQrId]);

  useEffect(() => {
    if (banks.length > 0 && !activeBankId) {
      setActiveBankId(banks[0].id);
    }
  }, [banks, activeBankId]);

  const validateAndApplyCoupon = async (codeStr: string) => {
    if (!codeStr.trim()) return;
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const coupons: any[] = await res.json();
        const found = coupons.find(c => c.code.toUpperCase() === codeStr.toUpperCase() && c.active);
        if (found) {
          if (totalDiscounted < found.minOrderValue) {
            setCouponError(`Min order value of ₹${found.minOrderValue} is required for this coupon.`);
            setCouponSuccess('');
            setAppliedCoupon(null);
          } else {
            setAppliedCoupon(found);
            setCouponSuccess(`Coupon "${found.code}" applied! Save ${found.discountType === 'percentage' ? `${found.discountValue}%` : `₹${found.discountValue}`}`);
            setCouponError('');
          }
        } else {
          setCouponError('Invalid or expired coupon code.');
          setCouponSuccess('');
          setAppliedCoupon(null);
        }
      } else {
        setCouponError('Could not reach coupon validation desk.');
      }
    } catch (err) {
      setCouponError('Error validating coupon.');
    }
  };

  useEffect(() => {
    if (globalCouponCode) {
      setCouponCode(globalCouponCode);
      validateAndApplyCoupon(globalCouponCode);
    }
  }, [globalCouponCode]);

  const handleApplyCouponClick = () => {
    validateAndApplyCoupon(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
    if (setGlobalCouponCode) {
      setGlobalCouponCode('');
    }
  };

  const activeQr = qrs.find((q: any) => q.id === activeQrId) || qrs[0] || null;
  const activeBank = banks.find((b: any) => b.id === activeBankId) || banks[0] || null;

  // Expandable parameters per service item
  const [serviceParams, setServiceParams] = useState<{
    [serviceId: string]: {
      quantity: number;
      speed: 'standard' | 'express';
      brief: string;
      fileName: string;
    }
  }>({});

  // Expanded card toggle for details
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<Inquiry | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync parameters when selectedServices changes
  useEffect(() => {
    const updated = { ...serviceParams };
    let changed = false;
    selectedServices.forEach((s) => {
      if (!updated[s.id]) {
        updated[s.id] = {
          quantity: 1,
          speed: 'standard',
          brief: '',
          fileName: ''
        };
        changed = true;
      }
    });
    if (changed) {
      setServiceParams(updated);
    }
  }, [selectedServices]);

  const updateParam = (serviceId: string, key: string, val: any) => {
    setServiceParams((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || { quantity: 1, speed: 'standard', brief: '', fileName: '' }),
        [key]: val
      }
    }));
  };

  const getParam = (serviceId: string) => {
    return serviceParams[serviceId] || { quantity: 1, speed: 'standard', brief: '', fileName: '' };
  };

  // --- MATH PRICING CALCULATIONS ---
  let totalOriginal = 0;
  let totalDiscounted = 0;

  selectedServices.forEach((item) => {
    const p = getParam(item.id);
    const qty = p.quantity;
    const isExpress = p.speed === 'express';

    // MRP Math
    const itemOriginal = item.mrp * qty;
    totalOriginal += itemOriginal;

    // Launch Base Price
    let basePrice = item.launchPrice;
    if (isExpress) {
      // 15% Express Timeline Premium surcharge
      basePrice = Math.round(basePrice * 1.15);
    }

    // Standard volume bulk quantity discount math
    let itemSum = basePrice * qty;
    let bulkDiscountPercent = 0;
    if (qty >= 20) bulkDiscountPercent = 15;
    else if (qty >= 10) bulkDiscountPercent = 10;
    else if (qty >= 5) bulkDiscountPercent = 5;

    if (bulkDiscountPercent > 0) {
      itemSum = Math.round(itemSum * (1 - bulkDiscountPercent / 100));
    }

    totalDiscounted += itemSum;
  });

  // Coupon calculations
  let couponDiscountAmount = 0;
  if (appliedCoupon && totalDiscounted >= (appliedCoupon.minOrderValue || 0)) {
    if (appliedCoupon.discountType === 'percentage') {
      couponDiscountAmount = Math.round(totalDiscounted * (appliedCoupon.discountValue / 100));
    } else if (appliedCoupon.discountType === 'flat') {
      couponDiscountAmount = Math.min(totalDiscounted, appliedCoupon.discountValue);
    }
  }

  const finalDiscountedTotal = Math.max(0, totalDiscounted - couponDiscountAmount);

  // Flat launch deal direct savings (including coupon if applied)
  const totalSavings = (totalOriginal - totalDiscounted) + couponDiscountAmount;
  const averageDiscountPercent = totalOriginal > 0 ? Math.round((totalSavings / totalOriginal) * 100) : 0;

  // Format WhatsApp message with rich items details and payment mode details
  const getWhatsAppLink = (inq: any) => {
    const itemsDetailText = selectedServices
      .map((s) => {
        const p = getParam(s.id);
        const speedTag = p.speed === 'express' ? '⚡ EXPRESS' : 'STANDARD';
        return `• ${s.name} x${p.quantity} [${speedTag}] ${p.brief ? `(Brief: ${p.brief})` : ''}`;
      })
      .join('\n');

    let paymentMethodLabel = '';
    if (paymentMethod === 'upi') paymentMethodLabel = 'UPI Direct Transfer (PhonePe/GPay)';
    else if (paymentMethod === 'bank') paymentMethodLabel = 'Direct Bank NEFT/IMPS Transfer';
    else paymentMethodLabel = '50% Advance & 50% Post-Approval Split contract';

    const text = `Hello Dizo Pulse!\n\nI want to confirm my secured order. Here are my billing details:\n\n` +
      `*Order ID*: ${inq.id}\n` +
      `*Client Name*: ${inq.clientName}\n` +
      `*Business*: ${inq.businessName} (${inq.businessNiche || 'N/A'})\n` +
      `*WhatsApp*: ${inq.whatsapp}\n` +
      `*Email*: ${inq.email}\n` +
      `*Preferred Payment*: ${paymentMethodLabel}\n` +
      `*Message/Guidelines*: ${inq.message || 'None'}\n\n` +
      `*Ordered Services*:\n${itemsDetailText}\n\n` +
      `*Final Calculated Price*: ₹${inq.totalDiscounted.toLocaleString('en-IN')}\n\n` +
      `Please review and let's finalize the kick-off process!`;

    return `https://wa.me/917017324978?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      setErrorMsg('Please add services from our catalog to your shopping cart.');
      return;
    }
    if (!clientName || !whatsapp || !email || !businessName) {
      setErrorMsg('Required contact and business fields are missing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          whatsapp,
          email,
          businessName,
          businessNiche,
          message,
          services: selectedServices.map((s) => s.id),
          serviceDetails: serviceParams,
          totalOriginal,
          totalDiscounted: finalDiscountedTotal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register secured order on the server.');
      }

      const data = await response.json();
      setSubmittedInquiry(data);

      // Save to client's local storage inquiries for ClientWorkspace!
      const currentLocals = localStorage.getItem('dizopulse_inquiries');
      let localsArray: Inquiry[] = [];
      if (currentLocals) {
        try {
          localsArray = JSON.parse(currentLocals);
        } catch {
          localsArray = [];
        }
      }
      localsArray.unshift(data);
      localStorage.setItem('dizopulse_inquiries', JSON.stringify(localsArray));

      if (onInquirySubmitted) {
        onInquirySubmitted();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedInquiry(null);
    setClientName('');
    setWhatsapp('');
    setEmail('');
    setBusinessName('');
    setBusinessNiche('');
    setMessage('');
    setServiceParams({});
    onClearServices();
  };

  const triggerReceiptPrint = () => {
    window.print();
  };

  // Reusable Checkout & Calculation Content Renderer
  const renderCheckoutAndSummaryContent = (isMobileDrawer = false) => {
    return (
      <div className="space-y-6">
        {/* Pricing Math calculations details */}
        {selectedServices.length > 0 && (
          <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200">
              <span>Pricing Breakdown</span>
              <span>{selectedServices.length} Selected</span>
            </div>

            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Catalog Value (Original MRP)</span>
              <span className="line-through text-slate-400 font-mono">₹{totalOriginal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
              <span className="flex items-center gap-1.5">
                <Icons.Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Flat Direct Launch Savings</span>
              </span>
              <span className="font-mono font-bold">-₹{totalSavings.toLocaleString('en-IN')}</span>
            </div>

            {/* Extra Threshold Deal Bonus */}
            {totalDiscounted >= 3000 && (
              <div className="flex justify-between items-center text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                <span className="flex items-center gap-1.5">
                  <Icons.Gift className="w-3.5 h-3.5 text-indigo-600 animate-bounce shrink-0" />
                  <span>Elite Bonus Active</span>
                </span>
                <span className="text-[10px] text-right font-black">FREE Google Business Setup!</span>
              </div>
            )}

            {/* Secure Checkout Taxation Absorption Indicator */}
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200/60">
              <span className="flex items-center gap-1.5">
                <Icons.ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>GST (18% integrated)</span>
              </span>
              <span className="text-emerald-700 font-extrabold text-[10px]">Absorbed (₹0.00 - Promo)</span>
            </div>

            {/* Promotional Coupon input panel */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2 mt-2">
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                Have a Promo Coupon Code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError('');
                    setCouponSuccess('');
                  }}
                  placeholder="e.g. PULSE20, LAUNCH"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleApplyCouponClick}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
              {couponError && (
                <p className="text-[10px] text-rose-500 font-extrabold flex items-center gap-1">
                  <Icons.AlertCircle className="w-3.5 h-3.5 shrink-0" /> {couponError}
                </p>
              )}
              {couponSuccess && (
                <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                  <Icons.CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {couponSuccess}
                </p>
              )}
              {appliedCoupon && (
                <div className="flex justify-between items-center bg-indigo-50 text-indigo-700 border border-indigo-100 p-2.5 rounded-xl text-[10px] font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <Icons.Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    Applied: {appliedCoupon.code}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-rose-500 hover:text-rose-600 font-black cursor-pointer uppercase text-[9px] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Grand Total Row */}
            <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-slate-300">
              <div>
                <span className="font-extrabold text-slate-900 text-sm block">Final Payable Total:</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  Save {averageDiscountPercent}% Total Discounts
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600 block leading-none font-mono">
                  ₹{finalDiscountedTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Contact & Checkout Desk */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          {submittedInquiry ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Icons.CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Secured Order Registered!</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{submittedInquiry.clientName}</strong>! Your checkout order for <strong>{submittedInquiry.businessName}</strong> has been registered.
                </p>
              </div>

              {/* Aesthetic Invoice Receipt representation */}
              <div className="p-4 bg-slate-50 rounded-xl text-left border border-slate-200 space-y-2 relative overflow-hidden text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-500 pb-2 border-b border-dashed border-slate-200">
                  <span className="font-bold">E-COMMERCE ORDER INVOICE</span>
                  <span className="font-mono font-bold text-slate-700">ID: {submittedInquiry.id}</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-bold text-amber-500 uppercase">⏳ Verification Pending</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected Mode:</span>
                    <span className="font-extrabold text-slate-700 uppercase text-[9px]">
                      {paymentMethod === 'upi' && 'UPI Direct Transfer'}
                      {paymentMethod === 'bank' && 'Direct NEFT/IMPS'}
                      {paymentMethod === 'split' && '50/50 Split Advance'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total deliverables:</span>
                    <span className="font-bold text-slate-700">{selectedServices.length} scope areas</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-700 pt-2 border-t border-dashed border-slate-200 font-bold">
                  <span>Grand Total:</span>
                  <span className="font-black text-indigo-600 text-sm font-mono">₹{submittedInquiry.totalDiscounted.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Direct payment instructions box */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 text-left text-xs space-y-2">
                <span className="font-extrabold text-amber-800 flex items-center gap-1 uppercase tracking-wide text-[10px]">
                  <Icons.QrCode className="w-4 h-4 text-amber-600 shrink-0" />
                  Transfer Instructions
                </span>
                {paymentMethod === 'upi' && (
                  <div className="space-y-3">
                    <p className="text-slate-600 leading-normal text-[11px]">
                      Scan QR code or transfer to official UPI ID:
                    </p>
                    {activeQr && (
                      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white border border-amber-200/60 rounded-xl">
                        <img
                          src={activeQr.imageUrl}
                          alt={activeQr.label}
                          className="w-20 h-20 object-contain bg-slate-50 p-1 rounded-lg border border-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1 text-center sm:text-left min-w-0 flex-1">
                          <h5 className="font-extrabold text-slate-900 text-xs">{activeQr.label}</h5>
                          {activeQr.upiId && (
                            <div className="flex items-center justify-center sm:justify-start gap-1">
                              <span className="font-mono text-[10px] text-slate-600 truncate">{activeQr.upiId}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(activeQr.upiId);
                                  showToast('UPI ID Copied', 'UPI ID copied to clipboard.', 'info');
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Copy UPI ID"
                              >
                                <Icons.Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {paymentMethod === 'bank' && activeBank && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200/60 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                      <span className="font-bold text-slate-800 text-xs">{activeBank.label}</span>
                      <span className="text-[9px] text-indigo-600 px-1.5 py-0.5 bg-indigo-50 rounded-full font-bold uppercase">
                        {activeBank.bankName}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">A/C Name</span>
                        <strong className="text-slate-800 font-bold">{activeBank.accountName}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">A/C Number</span>
                        <strong className="text-slate-900 font-mono font-bold text-xs">{activeBank.accountNumber}</strong>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[9px] text-slate-400 block uppercase">IFSC Code</span>
                        <strong className="text-slate-900 font-mono font-bold">{activeBank.ifscCode}</strong>
                      </div>
                    </div>
                  </div>
                )}
                {paymentMethod === 'split' && (
                  <div className="space-y-2 text-[11px] text-slate-600">
                    <p>
                      Transfer {splitDetails.advancePercent || 50}% advance of ₹{((submittedInquiry.totalDiscounted * (splitDetails.advancePercent || 50)) / 100).toLocaleString('en-IN')} to boot your project.
                    </p>
                    <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl flex justify-between items-center text-indigo-900 font-bold">
                      <span>{splitDetails.advancePercent || 50}% Advance Amount:</span>
                      <span className="font-mono text-xs text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-100">
                        ₹{((submittedInquiry.totalDiscounted * (splitDetails.advancePercent || 50)) / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={getWhatsAppLink(submittedInquiry)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Icons.MessageSquareQuote className="w-4 h-4" />
                  <span>Send Receipt on WhatsApp</span>
                </a>

                <button
                  onClick={triggerReceiptPrint}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Icons.Printer className="w-4 h-4" />
                  <span>Print / Save Invoice PDF</span>
                </button>
                
                <button
                  onClick={handleReset}
                  className="w-full text-slate-400 hover:text-slate-600 font-bold py-2 text-xs transition-all cursor-pointer underline"
                >
                  Order Additional Services
                </button>
              </div>
            </motion.div>
          ) : !isLoggedIn ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Icons.Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">Login Required for Checkout</h3>
                <p className="text-slate-500 text-[11px] mt-1 max-w-sm mx-auto leading-normal">
                  Please log in or register your Client Account to customize scoping options and place a secured order.
                </p>
              </div>
              <a
                href="/portal/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5 mx-auto w-full sm:w-auto"
              >
                <Icons.UserCheck className="w-3.5 h-3.5" />
                <span>Log In / Register Now</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Icons.UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Checkout Profile</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Logged In
                </span>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                  <Icons.AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled
                  value={clientName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    disabled
                    value={whatsapp}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dizo Store"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Business Niche
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. E-commerce, Gym, Cafe"
                    value={businessNiche}
                    onChange={(e) => setBusinessNiche(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Payment Method Selector block */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Select Payment Option
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('split')}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'split'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icons.Briefcase className="w-3.5 h-3.5 shrink-0" />
                    <span>{splitDetails.advancePercent || 50}/{100 - (splitDetails.advancePercent || 50)} Split</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icons.QrCode className="w-3.5 h-3.5 shrink-0" />
                    <span>UPI QRs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'bank'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icons.Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Bank IMPS</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Project Guidelines (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Share any special styling, goals, or references..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || selectedServices.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer uppercase tracking-wider"
                id="submit-secured-quote-btn"
              >
                {isSubmitting ? (
                  <>
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                    <span>Securing Order...</span>
                  </>
                ) : (
                  <>
                    <Icons.CreditCard className="w-4 h-4" />
                    <span>Submit & Place Secured Order</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="py-6 sm:py-10 bg-white rounded-3xl p-4 sm:p-6 md:p-10 border border-slate-200 shadow-sm relative" id="quote-calculator">
      {/* Header Banner */}
      <div className="max-w-4xl mx-auto text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Secured Checkout Connection
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-2.5 tracking-tight">
          Quote Basket & Calculations
        </h2>
        <p className="text-slate-600 mt-1.5 text-xs sm:text-sm md:text-base max-w-2xl mx-auto">
          Customize deliverable quantities, choose delivery speeds, apply promo coupons, and calculate accurate estimates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
        
        {/* Left Side: Cart Items & Custom parameters sliders (Consistent p-5 sm:p-6) */}
        <div className="lg:col-span-7 bg-slate-50 rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <Icons.ShoppingCart className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>Your Selected Services ({selectedServices.length})</span>
            </h3>
            {selectedServices.length > 0 && (
              <button
                onClick={onClearServices}
                className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Icons.Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {selectedServices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 px-4 bg-white rounded-2xl border border-dashed border-slate-300"
              >
                <Icons.PlusCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-700 font-bold text-sm">Your quote basket is currently empty.</p>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                  Select services from the catalog above to immediately configure options and calculate your estimate.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {selectedServices.map((service) => {
                  const params = getParam(service.id);
                  const isExpanded = expandedServiceId === service.id;
                  
                  // Compute individual service discounted price
                  let basePrice = service.launchPrice;
                  if (params.speed === 'express') {
                    basePrice = Math.round(basePrice * 1.15);
                  }
                  let finalItemPrice = basePrice * params.quantity;
                  let bulkDiscount = 0;
                  if (params.quantity >= 20) bulkDiscount = 15;
                  else if (params.quantity >= 10) bulkDiscount = 10;
                  else if (params.quantity >= 5) bulkDiscount = 5;

                  if (bulkDiscount > 0) {
                    finalItemPrice = Math.round(finalItemPrice * (1 - bulkDiscount / 100));
                  }

                  return (
                    <motion.div
                      key={service.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl border-2 border-indigo-600/30 shadow-xs overflow-hidden transition-all"
                    >
                      <div className="p-5 sm:p-6 bg-white space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                              {React.createElement((Icons as any)[service.iconName] || Icons.HelpCircle, {
                                className: 'w-5 h-5'
                              })}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">
                                {service.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[11px] text-slate-500 font-bold">
                                  Qty: {params.quantity} {service.unit || 'unit'}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  params.speed === 'express' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {params.speed === 'express' ? '⚡ Express Delivery' : 'Standard Delivery'}
                                </span>
                                {bulkDiscount > 0 && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {bulkDiscount}% Volume Discount
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs line-through text-slate-400 block font-semibold">
                              ₹{(service.mrp * params.quantity).toLocaleString('en-IN')}
                            </span>
                            <span className="text-base sm:text-lg font-black text-indigo-600 block font-mono">
                              ₹{finalItemPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Action controls row */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Icons.Sliders className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            <span>{isExpanded ? 'Hide Options' : 'Configure Scope & Delivery'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRemoveService(service.id)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Icons.Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable options drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-50/80 border-t border-slate-200/80 p-5 sm:p-6 space-y-4 text-xs text-slate-600"
                          >
                            {/* Quantity slider */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wide">
                                <span>Quantity Count ({service.unit || 'units'})</span>
                                <span className="text-indigo-600 font-mono font-extrabold text-sm">Qty: {params.quantity}</span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={25}
                                value={params.quantity}
                                onChange={(e) => updateParam(service.id, 'quantity', parseInt(e.target.value))}
                                className="w-full accent-indigo-600 bg-slate-200 rounded-lg cursor-pointer h-2"
                              />
                              <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
                                <span>1 {service.unit || 'unit'}</span>
                                <span className={params.quantity >= 5 ? 'text-emerald-600 font-black' : ''}>5+ (5% Off)</span>
                                <span className={params.quantity >= 10 ? 'text-emerald-600 font-black' : ''}>10+ (10% Off)</span>
                                <span className={params.quantity >= 20 ? 'text-emerald-600 font-black' : ''}>20+ (15% Off)</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Delivery Timeline option */}
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                                  Delivery Speed / Urgency
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => updateParam(service.id, 'speed', 'standard')}
                                    className={`py-2 rounded-lg font-extrabold text-[11px] uppercase transition-all cursor-pointer ${
                                      params.speed === 'standard'
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    Standard
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateParam(service.id, 'speed', 'express')}
                                    className={`py-2 rounded-lg font-extrabold text-[11px] uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                      params.speed === 'express'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    <Icons.Zap className="w-3.5 h-3.5" />
                                    <span>Express (+15%)</span>
                                  </button>
                                </div>
                              </div>

                              {/* Requirement Attachment dropzone */}
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                                  Reference File (Optional)
                                </label>
                                <div className="relative">
                                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 bg-white rounded-xl py-2 px-3 cursor-pointer hover:border-indigo-400 transition-colors">
                                    <Icons.UploadCloud className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-[11px] text-slate-600 font-bold truncate">
                                      {params.fileName ? params.fileName : 'Upload style reference'}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          updateParam(service.id, 'fileName', file.name);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                  {params.fileName && (
                                    <button
                                      type="button"
                                      onClick={() => updateParam(service.id, 'fileName', '')}
                                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"
                                    >
                                      <Icons.X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Custom Brief input */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                                Brief Instructions / Content guidelines
                              </label>
                              <input
                                type="text"
                                value={params.brief}
                                onChange={(e) => updateParam(service.id, 'brief', e.target.value)}
                                placeholder="e.g. Brand color palette, minimalist vibe, sample references"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Desktop Sticky Sidebar (lg:block) */}
        <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
          {renderCheckoutAndSummaryContent(false)}
        </div>
      </div>

      {/* Mobile Collapsed Floating Bottom Summary Bar (lg:hidden) */}
      {selectedServices.length > 0 && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl p-3.5 sm:p-4"
          id="mobile-quote-bottom-bar"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div
              onClick={() => setMobileDrawerOpen(true)}
              className="cursor-pointer select-none min-w-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {selectedServices.length} {selectedServices.length === 1 ? 'Item' : 'Items'}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                  Save {averageDiscountPercent}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-indigo-600 font-mono">
                  ₹{finalDiscountedTotal.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 line-through">
                  ₹{totalOriginal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              id="mobile-expand-summary-cta"
            >
              <span>Summary & Order</span>
              <Icons.ChevronUp className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Collapsible Bottom Drawer Modal (max-h-[80vh] with internal scrolling) */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-xs">
            {/* Backdrop click to close */}
            <div
              className="fixed inset-0"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Slide-up sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative z-10 bg-white rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border-t border-slate-200"
              id="mobile-quote-collapsible-drawer"
            >
              {/* Drawer Top Header & Drag Handle */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Order Summary & Checkout
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                    {selectedServices.length} Selected
                  </span>
                </div>

                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  aria-label="Close summary drawer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {renderCheckoutAndSummaryContent(true)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

