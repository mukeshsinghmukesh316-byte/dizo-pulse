import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { showToast } from '../components/UIPolish';

interface ContactPageProps {
  navigate: (path: string) => void;
  websiteContent?: any;
}

export default function ContactPage({ navigate, websiteContent }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [serviceNeeded, setServiceNeeded] = useState('Reel Editing');
  const [message, setMessage] = useState('');
  
  // Validation and touched state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Field validation rules
  const validate = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Your full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters long';
        return '';
      case 'whatsapp': {
        if (!value.trim()) return 'WhatsApp contact number is required';
        const digits = value.replace(/[^0-9]/g, '');
        if (digits.length < 10) return 'Please enter a valid phone number (at least 10 digits)';
        return '';
      }
      case 'email':
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validate(field, value);
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      const err = validate(field, value);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate concurrent submissions

    // Validate all fields
    const nameErr = validate('name', name);
    const waErr = validate('whatsapp', whatsapp);
    const emailErr = validate('email', email);

    const newErrors = {
      name: nameErr,
      whatsapp: waErr,
      email: emailErr
    };

    setTouched({
      name: true,
      whatsapp: true,
      email: true,
      businessName: true,
      message: true
    });
    setErrors(newErrors);

    if (nameErr || waErr || emailErr) {
      showToast('Please fix the highlighted errors before submitting.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: name.trim(),
          email: email.trim() || `${whatsapp.replace(/[^0-9]/g, '')}@dizopulse.client`,
          whatsapp: whatsapp.trim(),
          businessName: businessName.trim() || 'Individual Brand',
          businessNiche: serviceNeeded,
          message: `Service Inquiry: ${serviceNeeded}\n\nNotes: ${message.trim() || 'No additional notes provided'}`,
          services: [{ id: 'general-inquiry', name: serviceNeeded, category: 'general', mrp: 0, launchPrice: 0 }],
          totalAmount: 0,
          paymentMethod: 'split',
          status: 'pending'
        })
      });

      if (res.ok) {
        setSubmitted(true);
        showToast('Inquiry sent successfully! Our lead strategist will connect via WhatsApp shortly.', 'success');
      } else {
        // Fallback to WhatsApp direct link
        const waText = encodeURIComponent(
          `Hi Dizo Pulse! I am ${name.trim()} from ${businessName.trim() || 'my brand'}.\nI am interested in: ${serviceNeeded}.\nDetails: ${message.trim()}`
        );
        window.open(`https://wa.me/917017324978?text=${waText}`, '_blank');
        setSubmitted(true);
      }
    } catch (err) {
      const waText = encodeURIComponent(
        `Hi Dizo Pulse! I am ${name.trim()} from ${businessName.trim() || 'my brand'}.\nI am interested in: ${serviceNeeded}.\nDetails: ${message.trim()}`
      );
      window.open(`https://wa.me/917017324978?text=${waText}`, '_blank');
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const directWhatsAppChat = () => {
    const waText = encodeURIComponent('Hi Dizo Pulse! I would like to consult with an agency advisor about custom branding and digital growth services.');
    window.open(`https://wa.me/917017324978?text=${waText}`, '_blank');
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setWhatsapp('');
    setBusinessName('');
    setMessage('');
    setTouched({});
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-8 sm:space-y-12 max-w-6xl mx-auto px-4 sm:px-6 w-full overflow-hidden" id="contact-page-root">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 md:p-12 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Icons.PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct Client Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Contact Dizo Pulse
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-xl leading-relaxed">
            Have a project in mind, need custom pricing, or want strategic guidance? We respond in under 2 hours during business hours.
          </p>
        </div>

        <button
          onClick={directWhatsAppChat}
          className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Icons.MessageSquare className="w-4 h-4" />
          <span>Chat on WhatsApp Now</span>
        </button>
      </div>

      {/* Main Grid: Contact Channels + Interactive Inquiry Form with Equal Height Alignment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        {/* Left Column: Direct Communication Cards */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 h-full">
          {/* WhatsApp Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3 hover:border-emerald-200 transition-all group">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icons.Phone className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">WhatsApp & Direct Call</span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">+91 70173 24978</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant responses for quick briefs, package recommendations, and invoice updates.
              </p>
            </div>
            <a
              href="https://wa.me/917017324978"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700 pt-1"
            >
              <span>Message on WhatsApp</span>
              <Icons.ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Email Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3 hover:border-indigo-200 transition-all group">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icons.Mail className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Corporate Email</span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 break-all">support.dizopulse@gmail.com</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send detailed RFP documents, enterprise briefs, and formal contract inquiries.
              </p>
            </div>
            <a
              href="mailto:support.dizopulse@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 pt-1"
            >
              <span>Send an Email</span>
              <Icons.ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Instagram Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3 hover:border-pink-200 transition-all group">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icons.Instagram className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Official Instagram</span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">@dizo_pulse</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check our latest video reel edits, case studies, client stories, and creative breakdowns.
              </p>
            </div>
            <a
              href="https://instagram.com/dizo_pulse"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-black text-pink-600 hover:text-pink-700 pt-1"
            >
              <span>Follow on Instagram</span>
              <Icons.ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Working Hours & Guarantee */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Icons.Clock className="w-4 h-4 shrink-0" />
              <span>Operating Hours: Monday – Saturday (9:00 AM – 9:00 PM IST)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Inquiries submitted outside business hours are queued and addressed first thing the next morning.
            </p>
          </div>
        </div>

        {/* Right Column: Direct Lead / Requirement Form with Strict Validation */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Send Us a Direct Message</h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                Fill out the quick form below and our agency lead strategist will connect directly with you.
              </p>
            </div>

            {submitted ? (
              <div className="py-10 sm:py-14 text-center space-y-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6 my-auto">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Icons.CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Inquiry Received!</h3>
                <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>! We have received your project details. We will reach out to you via WhatsApp at <strong>{whatsapp}</strong>.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-3">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    Browse Catalog
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Your Full Name *</span>
                      {touched.name && !errors.name && name.trim() && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <Icons.Check className="w-3 h-3" /> Valid
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={(e) => handleChange('name', e.target.value, setName)}
                        onBlur={(e) => handleBlur('name', e.target.value)}
                        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none text-slate-900 ${
                          touched.name && errors.name
                            ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200'
                            : touched.name && !errors.name && name.trim()
                            ? 'border-emerald-400 bg-emerald-50/10 focus:ring-2 focus:ring-emerald-200'
                            : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'
                        }`}
                      />
                      {touched.name && !errors.name && name.trim() && (
                        <div className="absolute right-3 top-3 text-emerald-600 pointer-events-none">
                          <Icons.CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    {touched.name && errors.name && (
                      <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                        <Icons.AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>WhatsApp Contact Number *</span>
                      {touched.whatsapp && !errors.whatsapp && whatsapp.trim() && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <Icons.Check className="w-3 h-3" /> Valid
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={whatsapp}
                        onChange={(e) => handleChange('whatsapp', e.target.value, setWhatsapp)}
                        onBlur={(e) => handleBlur('whatsapp', e.target.value)}
                        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none text-slate-900 ${
                          touched.whatsapp && errors.whatsapp
                            ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200'
                            : touched.whatsapp && !errors.whatsapp && whatsapp.trim()
                            ? 'border-emerald-400 bg-emerald-50/10 focus:ring-2 focus:ring-emerald-200'
                            : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'
                        }`}
                      />
                      {touched.whatsapp && !errors.whatsapp && whatsapp.trim() && (
                        <div className="absolute right-3 top-3 text-emerald-600 pointer-events-none">
                          <Icons.CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    {touched.whatsapp && errors.whatsapp && (
                      <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                        <Icons.AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.whatsapp}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Email Address (Optional)</span>
                      {touched.email && !errors.email && email.trim() && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <Icons.Check className="w-3 h-3" /> Valid
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        value={email}
                        onChange={(e) => handleChange('email', e.target.value, setEmail)}
                        onBlur={(e) => handleBlur('email', e.target.value)}
                        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none text-slate-900 ${
                          touched.email && errors.email
                            ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200'
                            : touched.email && !errors.email && email.trim()
                            ? 'border-emerald-400 bg-emerald-50/10 focus:ring-2 focus:ring-emerald-200'
                            : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'
                        }`}
                      />
                      {touched.email && !errors.email && email.trim() && (
                        <div className="absolute right-3 top-3 text-emerald-600 pointer-events-none">
                          <Icons.CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    {touched.email && errors.email && (
                      <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1 animate-fadeIn">
                        <Icons.AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Brand Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Brand / Business Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Aura Lifestyle"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>
                </div>

                {/* Service Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Service Interested In</label>
                  <select
                    value={serviceNeeded}
                    onChange={(e) => setServiceNeeded(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 cursor-pointer"
                  >
                    <option value="Reel Editing">4K Viral Reel Editing</option>
                    <option value="Logo & Brand Identity">Logo & Brand Identity Design</option>
                    <option value="Instagram Monthly Bundle">Instagram Monthly Content Bundle</option>
                    <option value="Web Architecture & Landing Page">High-Converting Website / Landing Page</option>
                    <option value="Meta & Google Ads Management">Meta & Google Ads Campaign Setup</option>
                    <option value="SEO & Google Business Profile">SEO & Google Maps Profile Ranking</option>
                    <option value="Custom Complete Growth Package">Custom Complete Growth Package</option>
                  </select>
                </div>

                {/* Project Brief */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Project Brief & Details</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your brand vision, target launch date, or specific deliverables needed..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-y min-h-[100px]"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Icons.Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Brief...</span>
                    </>
                  ) : (
                    <>
                      <Icons.Send className="w-4 h-4" />
                      <span>Send Project Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

