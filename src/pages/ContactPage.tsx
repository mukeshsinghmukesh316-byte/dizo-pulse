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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) {
      showToast('Please provide your name and WhatsApp number so we can reach you.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: name,
          email: email || `${whatsapp.replace(/[^0-9]/g, '')}@dizopulse.client`,
          whatsapp,
          businessName: businessName || 'Individual Brand',
          businessNiche: serviceNeeded,
          message: `Service Inquiry: ${serviceNeeded}\n\nNotes: ${message}`,
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
          `Hi Dizo Pulse! I am ${name} from ${businessName || 'my brand'}.\nI am interested in: ${serviceNeeded}.\nDetails: ${message}`
        );
        window.open(`https://wa.me/917017324978?text=${waText}`, '_blank');
        setSubmitted(true);
      }
    } catch (err) {
      const waText = encodeURIComponent(
        `Hi Dizo Pulse! I am ${name} from ${businessName || 'my brand'}.\nI am interested in: ${serviceNeeded}.\nDetails: ${message}`
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

  return (
    <div className="space-y-12 max-w-6xl mx-auto" id="contact-page-root">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-12 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Icons.PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct Client Desk</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Contact Dizo Pulse
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
            Have a project in mind, need custom pricing, or want strategic guidance? We respond in under 2 hours during business hours.
          </p>
        </div>

        <button
          onClick={directWhatsAppChat}
          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950/50 shrink-0"
        >
          <Icons.MessageSquare className="w-4 h-4" />
          <span>Chat on WhatsApp Now</span>
        </button>
      </div>

      {/* Main Grid: Contact Channels + Interactive Inquiry Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Communication Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Icons.Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">WhatsApp & Direct Call</span>
                <h3 className="text-base font-black text-slate-900">+91 70173 24978</h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instant responses for quick briefs, package recommendations, and invoice updates.
            </p>
            <a
              href="https://wa.me/917017324978"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700"
            >
              <span>Message on WhatsApp</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Email Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Icons.Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Corporate Email</span>
                <h3 className="text-base font-black text-slate-900">support.dizopulse@gmail.com</h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Send detailed RFP documents, enterprise briefs, and formal contract inquiries.
            </p>
            <a
              href="mailto:support.dizopulse@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700"
            >
              <span>Send an Email</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Instagram Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <Icons.Instagram className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Official Instagram</span>
                <h3 className="text-base font-black text-slate-900">@dizo_pulse</h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Check our latest video reel edits, case studies, client stories, and creative breakdowns.
            </p>
            <a
              href="https://instagram.com/dizo_pulse"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-black text-pink-600 hover:text-pink-700"
            >
              <span>Follow on Instagram</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Working Hours & Guarantee */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Icons.Clock className="w-4 h-4" />
              <span>Operating Hours: Monday – Saturday (9:00 AM – 9:00 PM IST)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Inquiries submitted outside business hours are queued and addressed first thing the next morning.
            </p>
          </div>
        </div>

        {/* Right Column: Direct Lead / Requirement Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">Send Us a Direct Message</h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                Fill out the quick form below and our agency lead strategist will connect directly with you.
              </p>
            </div>

            {submitted ? (
              <div className="py-12 text-center space-y-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Icons.CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Inquiry Received!</h3>
                <p className="text-slate-600 text-xs max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>! We have received your project details. We will reach out to you via WhatsApp at <strong>{whatsapp}</strong>.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">WhatsApp Contact Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    />
                  </div>

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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Service Interested In</label>
                  <select
                    value={serviceNeeded}
                    onChange={(e) => setServiceNeeded(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Project Brief & Details</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your brand vision, target launch date, or specific deliverables needed..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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
