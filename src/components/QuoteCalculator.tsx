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

  return (
    <div className="py-12 bg-white rounded-3xl px-6 md:px-12 border border-slate-100 shadow-sm" id="quote-calculator">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Secured Checkout Connection
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-3 tracking-tight">
          Secure E-Commerce Cart & Checkout
        </h2>
        <p className="text-slate-600 mt-2 text-sm md:text-base">
          Add services from the catalog, customize scope guidelines, choose payment transfer preferences, and checkout securely!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
        
        {/* Left Side: Cart Items & Custom parameters sliders */}
        <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 border border-slate-150">
          <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
              <Icons.ShoppingCart className="w-5 h-5 text-indigo-600 animate-pulse" />
              Your Shopping Cart ({selectedServices.length})
            </h3>
            {selectedServices.length > 0 && (
              <button
                onClick={onClearServices}
                className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Icons.Trash2 className="w-3.5 h-3.5" />
                Clear Cart
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {selectedServices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 px-4"
              >
                <Icons.PlusCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-bold text-sm">Your shopping cart is empty.</p>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                  Scroll up to our Services Catalog and click "Add to Cart" on any premium deliverables you want to order.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
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
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                            {React.createElement((Icons as any)[service.iconName] || Icons.HelpCircle, {
                              className: 'w-4.5 h-4.5'
                            })}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-xs md:text-sm leading-none">
                              {service.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-slate-400 capitalize font-bold">
                                Qty: {params.quantity}
                              </span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                params.speed === 'express' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                              }`}>
                                {params.speed === 'express' ? '⚡ Express' : 'Standard'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right shrink-0">
                            <span className="text-[10px] line-through text-slate-400 block font-semibold">
                              ₹{(service.mrp * params.quantity).toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs font-black text-indigo-600 block">
                              ₹{finalItemPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                            className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                            title="Configure Item Scope"
                          >
                            <Icons.Settings className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90 text-indigo-600' : ''}`} />
                          </button>

                          <button
                            onClick={() => onRemoveService(service.id)}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Remove from Cart"
                          >
                            <Icons.X className="w-4 h-4" />
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
                            className="bg-slate-50/60 border-t border-slate-100 p-4 space-y-4 text-xs text-slate-600"
                          >
                            {/* Quantity slider */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                <span>Quantity Count ({service.unit || 'units'})</span>
                                <span className="text-indigo-600">Qty: {params.quantity}</span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={25}
                                value={params.quantity}
                                onChange={(e) => updateParam(service.id, 'quantity', parseInt(e.target.value))}
                                className="w-full accent-indigo-600 bg-slate-200 rounded-lg cursor-pointer h-1.5"
                              />
                              <div className="flex justify-between text-[8px] font-extrabold text-slate-400">
                                <span>1 {service.unit || 'unit'}</span>
                                <span className={params.quantity >= 5 ? 'text-green-600 font-black' : ''}>5+ (5% Off)</span>
                                <span className={params.quantity >= 10 ? 'text-green-600 font-black' : ''}>10+ (10% Off)</span>
                                <span className={params.quantity >= 20 ? 'text-green-600 font-black' : ''}>20+ (15% Off)</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Delivery Timeline option */}
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                  Delivery Speed / Urgency
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => updateParam(service.id, 'speed', 'standard')}
                                    className={`py-1.5 rounded-lg font-extrabold text-[10px] uppercase transition-all cursor-pointer ${
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
                                    className={`py-1.5 rounded-lg font-extrabold text-[10px] uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                      params.speed === 'express'
                                        ? 'bg-amber-500 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    <Icons.Zap className="w-3 h-3 animate-bounce" />
                                    Express
                                  </button>
                                </div>
                                <span className="text-[9px] text-slate-400 block mt-1 leading-normal">
                                  *Express adds a 15% surcharge for prioritized delivery timeline.
                                </span>
                              </div>

                              {/* Requirement Attachment dropzone */}
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                  Reference File Attachment
                                </label>
                                <div className="relative">
                                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white rounded-xl py-2 cursor-pointer hover:border-indigo-400 transition-colors">
                                    <Icons.UploadCloud className="w-5 h-5 text-slate-400" />
                                    <span className="text-[9px] text-slate-500 font-bold mt-1">
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
                                      className="absolute top-1.5 right-1.5 text-slate-400 hover:text-red-500"
                                    >
                                      <Icons.X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Custom Brief input */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                Brief Instructions / Content guidelines
                              </label>
                              <input
                                type="text"
                                value={params.brief}
                                onChange={(e) => updateParam(service.id, 'brief', e.target.value)}
                                placeholder="e.g. Use primary color, minimalist vibe, clean layouts"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

          {/* Pricing Math calculations details */}
          {selectedServices.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-5 space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Total Catalog Value (MRP)</span>
                <span>₹{totalOriginal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100/60">
                <span className="flex items-center gap-1">
                  <Icons.Sparkles className="w-3.5 h-3.5" />
                  Flat Direct Launch Savings
                </span>
                <span>-₹{totalSavings.toLocaleString('en-IN')}</span>
              </div>
              
              {/* Extra Threshold Deal Bonus */}
              {totalDiscounted >= 3000 && (
                <div className="flex justify-between text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                  <span className="flex items-center gap-1">
                    <Icons.Gift className="w-3.5 h-3.5 animate-bounce" />
                    Elite Checkout Bonus Active
                  </span>
                  <span>FREE Google Business Profile Optimization Setup!</span>
                </div>
              )}

              {/* Secure Checkout Taxation Absorption Indicator */}
              <div className="flex justify-between text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                <span className="flex items-center gap-1">
                  <Icons.ShieldAlert className="w-3.5 h-3.5" />
                  GST (18% integrated CGST/SGST)
                </span>
                <span>Absorbed (₹0.00 - Promo Wave)</span>
              </div>

              {/* Promotional Coupon input panel */}
              <div className="p-4 bg-slate-100/85 rounded-xl border border-slate-200/80 space-y-2.5 mt-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Have a Promotional Coupon Code?
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
                    placeholder="e.g. PULSE20, BIGOFFER"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCouponClick}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-rose-500 font-extrabold flex items-center gap-1"><Icons.AlertCircle className="w-3.5 h-3.5" /> {couponError}</p>}
                {couponSuccess && <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1"><Icons.CheckCircle2 className="w-3.5 h-3.5" /> {couponSuccess}</p>}
                {appliedCoupon && (
                  <div className="flex justify-between items-center bg-indigo-50 text-indigo-700 border border-indigo-100 p-2.5 rounded-lg text-[10px] mt-1.5 font-extrabold">
                    <span className="flex items-center gap-1.5">
                      <Icons.Tag className="w-3.5 h-3.5 text-indigo-500" />
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

              <div className="flex justify-between items-baseline pt-4 border-t border-dashed border-slate-200">
                <span className="font-extrabold text-slate-800 text-sm">Secured Grand Total:</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600 block leading-none">
                    ₹{finalDiscountedTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-green-600 font-bold mt-1.5 inline-block bg-green-50 px-2 py-0.5 rounded">
                    Save {averageDiscountPercent}% Combined Savings
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Contact & Secured Checkout Connection Desk */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-150 shadow-sm">
          {submittedInquiry ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Secured Order Registered!</h3>
              <p className="text-slate-500 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong>{submittedInquiry.clientName}</strong>! Your checkout order for <strong>{submittedInquiry.businessName}</strong> has been assigned to our corporate design pipeline.
              </p>

              {/* Aesthetic Invoice Receipt representation */}
              <div className="my-5 p-4 bg-slate-50 rounded-xl text-left border border-slate-200 space-y-2 relative overflow-hidden">
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-slate-200"></div>
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-white border border-slate-200"></div>
                
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

                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-dashed border-slate-200 font-bold">
                  <span>Grand Total:</span>
                  <span className="font-black text-indigo-600 text-sm">₹{submittedInquiry.totalDiscounted.toLocaleString('en-IN')}</span>
                </div>

                {/* Character Barcode illustration to make it look super premium */}
                <div className="pt-2 text-center select-none font-mono text-[9px] tracking-[4px] text-slate-400">
                  ||| | ||||| || |||| |||| ||
                  <span className="block tracking-normal text-[8px] text-slate-400 mt-1 uppercase font-bold">Secure digital authentication barcode</span>
                </div>
              </div>

              {/* Direct payment instructions box */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-left text-xs mb-5 space-y-2">
                <span className="font-extrabold text-amber-800 flex items-center gap-1 uppercase tracking-wide text-[10px]">
                  <Icons.QrCode className="w-4 h-4 text-amber-600 shrink-0" />
                  Transfer Instructions
                </span>
                {paymentMethod === 'upi' && (
                  <div className="space-y-3">
                    <p className="text-slate-600 leading-normal text-[11px]">
                      Please choose from our merchant QR payment gateways below, scan, and transfer:
                    </p>
                    
                    {/* QR Code Tab selection */}
                    {qrs.length > 1 && (
                      <div className="flex flex-wrap gap-1 border-b border-amber-100 pb-2">
                        {qrs.map((qr: any) => (
                          <button
                            key={qr.id}
                            type="button"
                            onClick={() => setActiveQrId(qr.id)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              activeQrId === qr.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {qr.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeQr && (
                      <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-white border border-amber-100 rounded-xl">
                        <img
                          src={activeQr.imageUrl}
                          alt={activeQr.label}
                          className="w-24 h-24 object-contain bg-slate-50 p-1.5 rounded-lg border border-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1.5 text-center sm:text-left min-w-0 flex-1">
                          <span className="inline-block text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded font-extrabold uppercase tracking-wide">
                            Active QR Gateway
                          </span>
                          <h5 className="font-extrabold text-slate-900 text-xs">{activeQr.label}</h5>
                          {activeQr.upiId && (
                            <div className="flex items-center justify-center sm:justify-start gap-1">
                              <span className="font-mono text-[10px] text-slate-500 truncate">{activeQr.upiId}</span>
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
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Scan this QR using any UPI app (GPay, PhonePe, Paytm, BHIM) to make the secure transfer.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {paymentMethod === 'bank' && (
                  <div className="space-y-3">
                    <p className="text-slate-600 leading-normal text-[11px]">
                      Select preferred official bank account and complete IMPS/NEFT transfer:
                    </p>

                    {/* Bank Tab selection */}
                    {banks.length > 1 && (
                      <div className="flex flex-wrap gap-1 border-b border-amber-100 pb-2">
                        {banks.map((b: any) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setActiveBankId(b.id)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              activeBankId === b.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeBank && (
                      <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-1.5 text-[11px] text-slate-600">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1">
                          <span className="font-bold text-slate-800 text-xs">{activeBank.label}</span>
                          <span className="text-[9px] text-indigo-600 px-1.5 py-0.5 bg-indigo-50 rounded-full font-bold uppercase">
                            {activeBank.bankName}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 font-sans">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase">A/C Holder Name</span>
                            <strong className="text-slate-800 font-bold">{activeBank.accountName}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase">Account Number</span>
                            <div className="flex items-center gap-1">
                              <strong className="text-slate-900 font-mono font-bold text-xs">{activeBank.accountNumber}</strong>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(activeBank.accountNumber);
                                  showToast('Account Number Copied', 'Account Number copied to clipboard.', 'info');
                                }}
                                className="p-0.5 hover:bg-slate-50 rounded text-slate-400 cursor-pointer"
                              >
                                <Icons.Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-[9px] text-slate-400 block uppercase">IFSC Code</span>
                            <div className="flex items-center gap-1">
                              <strong className="text-slate-900 font-mono font-bold">{activeBank.ifscCode}</strong>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(activeBank.ifscCode);
                                  showToast('IFSC Code Copied', 'IFSC Code copied to clipboard.', 'info');
                                }}
                                className="p-0.5 hover:bg-slate-50 rounded text-slate-400 cursor-pointer"
                              >
                                <Icons.Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {paymentMethod === 'split' && (
                  <div className="space-y-2 leading-relaxed">
                    <p className="text-slate-600 text-[11px]">
                      {splitDetails.instructions ? (
                        splitDetails.instructions.replace('[ADVANCE_AMOUNT]', `₹${((submittedInquiry.totalDiscounted * (splitDetails.advancePercent || 50)) / 100).toLocaleString('en-IN')}`)
                      ) : (
                        `To initiate your partial split contract, transfer the ${splitDetails.advancePercent || 50}% advance of ₹${((submittedInquiry.totalDiscounted * (splitDetails.advancePercent || 50)) / 100).toLocaleString('en-IN')} to our UPI or Bank details. Send receipt via WhatsApp below to instantly boot your pipeline.`
                      )}
                    </p>
                    <div className="mt-3 bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-xl flex justify-between items-center text-indigo-900 font-bold">
                      <span>{splitDetails.advancePercent || 50}% Advance Amount:</span>
                      <span className="font-mono text-xs text-indigo-700 bg-white px-2 py-1 rounded border border-indigo-100">
                        ₹{((submittedInquiry.totalDiscounted * (splitDetails.advancePercent || 50)) / 100).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Quick helper so they can pay UPI/Bank even under split option */}
                    <div className="mt-2.5 pt-2 border-t border-dashed border-amber-200/60 flex flex-col gap-2">
                      <span className="text-[9px] text-amber-800/80 font-bold uppercase tracking-wider block">
                        💡 Click below to expand UPI QR or Bank options for split payment:
                      </span>
                      <div className="flex gap-2">
                        {qrs.length > 0 && (
                          <div className="flex-1 p-2 bg-white rounded-lg border border-slate-100 text-[10px] leading-snug">
                            <span className="font-bold text-slate-800 block">UPI: {activeQr?.label}</span>
                            <span className="font-mono text-slate-400 block truncate">{activeQr?.upiId}</span>
                          </div>
                        )}
                        {banks.length > 0 && (
                          <div className="flex-1 p-2 bg-white rounded-lg border border-slate-100 text-[10px] leading-snug">
                            <span className="font-bold text-slate-800 block">Bank: {activeBank?.bankName}</span>
                            <span className="font-mono text-slate-400 block truncate">A/C: {activeBank?.accountNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <a
                  href={getWhatsAppLink(submittedInquiry)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl shadow-md shadow-green-100 flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Icons.MessageSquareQuote className="w-4.5 h-4.5" />
                  Connect & Send Receipt on WhatsApp
                </a>

                <button
                  onClick={triggerReceiptPrint}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Icons.Printer className="w-4 h-4" />
                  Print / Save Invoice PDF
                </button>
                
                <button
                  onClick={handleReset}
                  className="w-full text-slate-400 hover:text-slate-600 font-bold py-2.5 text-xs transition-all cursor-pointer underline"
                >
                  Order Additional Services
                </button>
              </div>
            </motion.div>
          ) : !isLoggedIn ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Icons.Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Login Required for Checkout</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto leading-normal">
                  Please log in or register your Client Account to customize scoping options, calculate discounts, and place a secured order. (कृपया आर्डर करने के लिए पहले क्लाइंट अकाउंट लॉगिन या रजिस्टर करें।)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const clientWorkspace = document.getElementById('client-workspace-hub');
                  if (clientWorkspace) {
                    clientWorkspace.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors cursor-pointer shadow-sm shadow-indigo-100 flex items-center gap-1.5 mx-auto"
              >
                <Icons.UserCheck className="w-4 h-4" />
                Log In / Register Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 mb-1">
                <Icons.UserCheck className="w-5 h-5 text-indigo-600" />
                Secured Checkout Desk
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-3">
                Verify your registered account profile details below and fill in your business parameters to place your order.
              </p>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2">
                  <Icons.AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Full Name (Registered Account Profile)
                </label>
                <input
                  type="text"
                  disabled
                  value={clientName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Select Preferred Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('split')}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'split'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icons.Briefcase className="w-4 h-4 shrink-0" />
                    {splitDetails.advancePercent || 50}/{100 - (splitDetails.advancePercent || 50)} Split
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icons.QrCode className="w-4 h-4 shrink-0" />
                    UPI QRs
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-extrabold uppercase transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'bank'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icons.Building2 className="w-4 h-4 shrink-0" />
                    Bank IMPS
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 block mt-1.5 leading-normal">
                  *Payments are processed securely via direct bank verification or manual UPI confirmation desk.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Project Notes / Specifications (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Share any special styling, custom niche, or project launch guidelines with our agent..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || selectedServices.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 cursor-pointer uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                    Securing Order...
                  </>
                ) : (
                  <>
                    <Icons.CreditCard className="w-4 h-4" />
                    Place Secured Checkout Order
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
