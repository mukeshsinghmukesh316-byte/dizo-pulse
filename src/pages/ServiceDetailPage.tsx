import React from 'react';
import { Service } from '../types';
import * as Icons from 'lucide-react';

interface ServiceDetailPageProps {
  slug: string;
  catalogServices: Service[];
  selectedServiceIds: string[];
  onAddService: (service: Service) => void;
  navigate: (path: string) => void;
}

export default function ServiceDetailPage({
  slug,
  catalogServices,
  selectedServiceIds,
  onAddService,
  navigate,
}: ServiceDetailPageProps) {
  // Normalize slug matching (matches id, or lowercase slugified name)
  const normalizedSlug = decodeURIComponent(slug).toLowerCase().trim();
  const service = catalogServices.find((s) => {
    const idMatch = s.id.toLowerCase() === normalizedSlug;
    const nameSlugMatch = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === normalizedSlug;
    return idMatch || nameSlugMatch;
  });

  const renderIcon = (name: string, className: string = 'w-6 h-6') => {
    const LucideIcon = (Icons as any)[name] || Icons.Sparkles;
    return <LucideIcon className={className} />;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'social':
        return 'Social Media & Reels';
      case 'branding':
        return 'Graphics & Brand Identity';
      case 'web':
        return 'Web Architecture & SEO';
      case 'marketing':
        return 'Target Ads & Lead Gen';
      default:
        return cat;
    }
  };

  if (!service) {
    return (
      <div className="py-20 text-center space-y-6 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Icons.SearchX className="w-8 h-8 stroke-[1.75]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Service Not Found</h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            The requested service <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600 font-mono text-xs">/{slug}</code> could not be found in our catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/services')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
        >
          <Icons.ArrowLeft className="w-4 h-4" />
          <span>Browse All Services</span>
        </button>
      </div>
    );
  }

  const isAdded = selectedServiceIds.includes(service.id);
  const savings = service.mrp - service.launchPrice;
  const savingsPercent = Math.round((savings / service.mrp) * 100);

  // Related services in the same category
  const relatedServices = catalogServices
    .filter((s) => s.id !== service.id && s.category === service.category && (!s.status || s.status === 'published'))
    .slice(0, 3);

  return (
    <div className="space-y-10 pb-12 w-full max-w-7xl mx-auto" id={`service-detail-${service.id}`}>
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto whitespace-nowrap py-1">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Icons.Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <button
          type="button"
          onClick={() => navigate('/services')}
          className="hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Services
        </button>
        <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-none">
          {service.name}
        </span>
      </nav>

      {/* Main Service Hero & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image & Deep Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visual Banner */}
          <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg relative bg-slate-900">
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.name}
                referrerPolicy="no-referrer"
                className="w-full h-72 sm:h-96 object-cover"
              />
            ) : (
              <div className="h-72 sm:h-96 w-full flex items-center justify-center bg-indigo-950 text-indigo-400">
                {renderIcon(service.iconName, 'w-24 h-24')}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

            {/* Floating consistent badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 shadow-sm">
                {getCategoryLabel(service.category)}
              </span>
              {service.badge && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                  <Icons.Sparkles className="w-3.5 h-3.5" />
                  <span>{service.badge}</span>
                </span>
              )}
            </div>
          </div>

          {/* Detailed Service Description */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                Deliverable Breakdown
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Service Overview & Delivery Scope
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Deliverables Breakdown */}
            {service.deliverables && service.deliverables.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                  <Icons.CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>What You Get in This Package</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.deliverables.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-xs font-medium"
                    >
                      <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Timeline and Workflow */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <Icons.Layers className="w-4 h-4 text-indigo-600" />
                <span>Agency Production Process</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600">Step 1</span>
                  <h4 className="font-bold text-xs text-slate-900">Briefing</h4>
                  <p className="text-[11px] text-slate-500">Collect brand colors, references & objectives.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600">Step 2</span>
                  <h4 className="font-bold text-xs text-slate-900">Creation</h4>
                  <p className="text-[11px] text-slate-500">Designers craft custom drafts & high-res assets.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600">Step 3</span>
                  <h4 className="font-bold text-xs text-slate-900">Revisions</h4>
                  <p className="text-[11px] text-slate-500">Up to 3 review loops for complete satisfaction.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-600">Step 4</span>
                  <h4 className="font-bold text-xs text-slate-900">Final Handover</h4>
                  <p className="text-[11px] text-slate-500">Export high-res files & source packages to vault.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Cart Action & Guarantees */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          {/* Main Price Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Package Pricing
                </span>
                <span className="inline-flex items-center text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Flat {savingsPercent}% Off Launch Deal
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                  ₹{service.launchPrice.toLocaleString('en-IN')}
                </span>
                {service.mrp > service.launchPrice && (
                  <span className="text-base sm:text-lg line-through text-slate-400 font-semibold">
                    ₹{service.mrp.toLocaleString('en-IN')}
                  </span>
                )}
                {service.unit && (
                  <span className="text-xs text-slate-500 font-bold">/{service.unit}</span>
                )}
              </div>
              <p className="text-xs text-emerald-600 font-semibold">
                You save ₹{savings.toLocaleString('en-IN')} with our promotional launch price.
              </p>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Turnaround Time</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Icons.Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{service.turnaroundTime || '48-72 Hours'}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Revisions Included</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Icons.RefreshCw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>3 Major Rounds</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onAddService(service)}
                className={`w-full py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  isAdded
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-950/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/30'
                }`}
              >
                {isAdded ? (
                  <>
                    <Icons.Check className="w-4 h-4 stroke-[3px]" />
                    <span>Added to Quote ({selectedServiceIds.length} Selected)</span>
                  </>
                ) : (
                  <>
                    <Icons.Plus className="w-4 h-4 stroke-[3px]" />
                    <span>Add to Custom Quote</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isAdded) onAddService(service);
                  navigate('/quote-estimator');
                }}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Icons.Calculator className="w-4 h-4 text-indigo-400" />
                <span>Go to Quote Estimator</span>
                <Icons.ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="space-y-2.5 pt-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Icons.ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>50% Advance & 50% on Final Approval</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Full Commercial License & Source Files</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.Headphones className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Dedicated WhatsApp & Project Lead Support</span>
              </div>
            </div>
          </div>

          {/* Need Custom Scope Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl p-5 border border-indigo-100 space-y-2">
            <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">
              Need Bulk Volume or Custom Scopes?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Have enterprise monthly requirements or special creative direction? Speak directly with our lead creative strategist on WhatsApp.
            </p>
            <a
              href="https://wa.me/917017324978"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 mt-1 cursor-pointer"
            >
              <Icons.MessageSquare className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp (+91 70173 24978)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Related Services in Same Category */}
      {relatedServices.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                Related Suite
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Explore Complementary Solutions
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View all catalog</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {relatedServices.map((rel) => {
              const isRelAdded = selectedServiceIds.includes(rel.id);
              return (
                <div
                  key={rel.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between h-full"
                  id={`related-service-${rel.id}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                          {renderIcon(rel.iconName, 'w-4 h-4')}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">{rel.name}</h4>
                      </div>
                      {rel.badge && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-xs">
                          {rel.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{rel.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 mt-auto">
                    <div>
                      <span className="font-black text-indigo-600 text-base font-mono">
                        ₹{rel.launchPrice.toLocaleString('en-IN')}
                      </span>
                      {rel.unit && (
                        <span className="text-[10px] text-slate-400 font-bold ml-1">/{rel.unit}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/services/${rel.id}`)}
                        className="px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddService(rel)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                          isRelAdded
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                        }`}
                      >
                        {isRelAdded ? (
                          <>
                            <Icons.Check className="w-3 h-3 stroke-[3]" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Icons.Plus className="w-3 h-3 stroke-[3]" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

