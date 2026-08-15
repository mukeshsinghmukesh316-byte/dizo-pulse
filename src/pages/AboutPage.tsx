import React from 'react';
import * as Icons from 'lucide-react';

interface AboutPageProps {
  navigate: (path: string) => void;
  websiteContent?: any;
}

export default function AboutPage({ navigate, websiteContent }: AboutPageProps) {
  return (
    <div className="space-y-12 max-w-5xl mx-auto" id="about-page-root">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-14 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden text-center sm:text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
          <Icons.Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>About Dizo Pulse</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-3xl leading-tight">
          Engineering Pixel-Perfect Experiences That Fuel Measurable Business Growth.
        </h1>

        <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed">
          Dizo Pulse is India's premier creative design and digital acceleration workspace. We empower modern entrepreneurs, D2C startups, and retail brands with high-fidelity branding, 4K viral video editing, web platforms, and hyper-targeted ad scaling.
        </p>

        <div className="flex flex-wrap gap-4 pt-2 justify-center sm:justify-start">
          <button
            onClick={() => navigate('/services')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Explore Our Services</span>
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
          >
            <Icons.MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Connect With Us</span>
          </button>
        </div>
      </div>

      {/* Agency Mission & Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <Icons.Target className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Our Mission</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Traditional creative agencies are often slow, opaque in pricing, and weighed down with massive monthly retainers. Dizo Pulse was founded to break that paradigm.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Our mission is to provide high-speed, transparent, on-demand creative and digital capabilities with flat pricing, rapid 48-hour turnarounds, and direct access to top-tier design talent.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Icons.Compass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Our Vision</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            To become India's most trusted end-to-end digital partner for growing enterprises — bridging aesthetic design excellence with high-converting performance marketing.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Whether you are launching your first Instagram campaign or rebuilding a full-scale e-commerce presence, we ensure every creative deliverable yields measurable business outcomes.
          </p>
        </div>
      </div>

      {/* Core Values */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">The Principles We Stand By</span>
          <h2 className="text-3xl font-black text-slate-900">Our Core Pillars</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Icons.Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Rapid 48H Turnaround</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              We move at the speed of the modern internet. Our streamlined design pipelines ensure fast drafts without compromising quality.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">50/50 Split Payment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pay 50% advance to begin work and 50% balance only after you review and approve the finalized deliverables.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Icons.RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">3 Revision Rounds</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every package guarantees up to 3 major revision iterations to ensure complete alignment with your vision.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Icons.Award className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">100% IP Ownership</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full commercial licenses, vector files, and 4K assets are completely transferred to your business upon completion.
            </p>
          </div>
        </div>
      </div>

      {/* Agency Track Record Stats */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 border border-slate-800 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="space-y-1">
          <span className="text-3xl md:text-4xl font-black text-indigo-400 block">500+</span>
          <h4 className="font-bold text-sm text-white">Campaigns Executed</h4>
          <p className="text-slate-400 text-xs">For retail & online brands</p>
        </div>
        <div className="space-y-1">
          <span className="text-3xl md:text-4xl font-black text-emerald-400 block">99.4%</span>
          <h4 className="font-bold text-sm text-white">On-Time Handover</h4>
          <p className="text-slate-400 text-xs">Strict milestone adherence</p>
        </div>
        <div className="space-y-1">
          <span className="text-3xl md:text-4xl font-black text-yellow-400 block">4.9 / 5</span>
          <h4 className="font-bold text-sm text-white">Client Satisfaction</h4>
          <p className="text-slate-400 text-xs">Verified project reviews</p>
        </div>
        <div className="space-y-1">
          <span className="text-3xl md:text-4xl font-black text-pink-400 block">24/7</span>
          <h4 className="font-bold text-sm text-white">Advisor Support</h4>
          <p className="text-slate-400 text-xs">Direct WhatsApp channels</p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 text-center space-y-4">
        <h3 className="text-2xl font-black text-slate-900">Ready to Elevate Your Digital Signature?</h3>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          Explore our services catalog or calculate a personalized quote in less than 60 seconds.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={() => navigate('/services')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
          >
            Browse Services
          </button>
          <button
            onClick={() => navigate('/quote-estimator')}
            className="px-6 py-3 bg-white hover:bg-slate-50 text-indigo-950 border border-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Quote Calculator
          </button>
        </div>
      </div>
    </div>
  );
}
