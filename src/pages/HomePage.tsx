import React from 'react';
import { Service } from '../types';
import * as Icons from 'lucide-react';
import TestimonialWall from '../components/TestimonialWall';
import FaqSection from '../components/FaqSection';
import PublicVisitorCounter from '../components/PublicVisitorCounter';

interface HomePageProps {
  websiteContent: any;
  theme: any;
  catalogServices: Service[];
  selectedServiceIds: string[];
  onAddService: (service: Service) => void;
  navigate: (path: string) => void;
}

export default function HomePage({
  websiteContent,
  theme,
  catalogServices,
  selectedServiceIds,
  onAddService,
  navigate,
}: HomePageProps) {
  // Featured services preview (top 3 curated services)
  const publishedServices = catalogServices.filter(s => !s.status || s.status === 'published');
  const featuredServices = publishedServices.slice(0, 3);

  const renderIcon = (name: string, className: string = 'w-5 h-5') => {
    const LucideIcon = (Icons as any)[name] || Icons.Sparkles;
    return <LucideIcon className={className} />;
  };

  return (
    <div className="space-y-16" id="home-page-container">
      {/* Customer Facing Hero Area */}
      {websiteContent?.hero?.enabled !== false && (
        <section className={`bg-gradient-to-br ${theme.heroGradient || 'from-slate-950 via-slate-900 to-indigo-950'} text-white rounded-3xl p-8 md:p-14 relative overflow-hidden shadow-2xl border border-slate-800`} id="brand-hero">
          {/* Radial ambient background accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {websiteContent?.hero?.badge && (
                  <div className={`inline-flex items-center gap-2 ${theme.badgeBg || 'bg-black/40'} border border-indigo-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300`}>
                    <Icons.ShieldCheck className={`w-4 h-4 ${theme.primaryText || 'text-indigo-400'}`} />
                    {websiteContent.hero.badge}
                  </div>
                )}
                <PublicVisitorCounter variant="hero-badge" id="hero-visitor-counter-badge" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                {websiteContent?.hero?.headline ? (
                  <span>{websiteContent.hero.headline}</span>
                ) : (
                  <>
                    Design. Create.{' '}
                    <span className={`bg-gradient-to-r ${theme.promoGradient || 'from-indigo-400 via-purple-400 to-pink-400'} bg-clip-text text-transparent`}>
                      Grow.
                    </span>
                  </>
                )}
              </h1>

              <p className="text-slate-300 text-base md:text-lg max-w-xl leading-relaxed">
                {websiteContent?.hero?.description ||
                  'From design to digital growth — everything your brand needs in one place. We edit 4K reels, craft iconic brands, build high-converting websites, and execute hyper-targeted campaigns.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/services')}
                  className={`${theme.primaryBg || 'bg-indigo-600'} hover:bg-indigo-500 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-xl uppercase tracking-wider shadow-lg shadow-indigo-950/40 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2`}
                  id="hero-cta-services"
                >
                  <span>{websiteContent?.hero?.ctaText || 'Browse All Services'}</span>
                  <Icons.ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/quote-estimator')}
                  className="bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-xs sm:text-sm px-5 py-3.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                  id="hero-cta-quote"
                >
                  <Icons.Calculator className="w-4 h-4 text-indigo-400" />
                  <span>Get Instant Quote</span>
                </button>
              </div>

              {/* Trust Micro-Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Flat 20% Launch Discount</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>50/50 Split Payment Option</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icons.CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3 Revisions Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Right Offer Banner Graphics */}
            {websiteContent?.seasonalOffers?.enabled !== false && (
              <div className="lg:col-span-5 flex justify-center">
                <div
                  className="bg-gradient-to-br from-indigo-900/90 to-slate-900 text-white rounded-2xl p-6 md:p-7 shadow-2xl relative w-full max-w-sm border border-indigo-500/30 transform hover:scale-102 transition-transform duration-300"
                  id="hero-offer-badge"
                >
                  <div className="absolute top-2 right-3 text-white/10 text-8xl font-black select-none pointer-events-none">
                    {websiteContent?.seasonalOffers?.discountBadge || '20%'}
                  </div>

                  <span className="bg-slate-950/80 text-yellow-400 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-3 inline-block border border-yellow-400/20">
                    {websiteContent?.seasonalOffers?.tag || 'Exclusive Launch Deal'}
                  </span>

                  <h3 className="text-xl font-extrabold text-white leading-tight">
                    {websiteContent?.seasonalOffers?.title || 'Flat 20% Off Promo Pre-Applied'}
                  </h3>

                  <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                    {websiteContent?.seasonalOffers?.description ||
                      'All rates across our entire catalog are already discounted. Transparent pricing, no hidden agency retainers.'}
                  </p>

                  <div className="mt-5 border-t border-slate-700/60 pt-4 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Est. Start Price</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-yellow-300">
                          {websiteContent?.seasonalOffers?.priceStart || '₹149'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">only</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/services')}
                      className="bg-white hover:bg-slate-100 text-indigo-950 font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider shadow transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Explore</span>
                      <Icons.ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grid indicators: Success Stats */}
          {websiteContent?.stats?.enabled !== false && (
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-slate-800/80 text-center"
              id="hero-value-props"
            >
              {(websiteContent?.stats?.items || [
                { value: '500+', label: 'Campaigns Launched', subtext: 'Rapid creative deployment' },
                { value: '99.4%', label: 'On-Time Delivery', subtext: 'Aesthetic pixel-perfect assets' },
                { value: '4.9/5', label: 'Client Rating', subtext: 'Continuous feedback & iterations' },
                { value: '24/7', label: 'Support & Guidance', subtext: 'Dedicated project managers' },
              ]).map((statItem: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <span className="text-2xl md:text-3xl font-black text-indigo-400 block">{statItem.value}</span>
                  <h4 className="font-bold text-sm text-white">{statItem.label}</h4>
                  <p className="text-slate-400 text-[11px]">{statItem.subtext}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Public Verified Visitor Counter Banner */}
      <section className="-mt-6 sm:-mt-8" id="home-visitor-counter-section">
        <PublicVisitorCounter theme={theme} id="home-featured-visitor-counter" />
      </section>

      {/* Featured Services Preview Section */}
      <section className="py-8 space-y-6" id="home-featured-services">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wider uppercase mb-2">
              <Icons.Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Popular Solutions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Featured Growth Services
            </h2>
            <p className="text-slate-600 text-sm md:text-base mt-1 max-w-2xl">
              Hand-picked high-demand digital packages crafted to accelerate your brand's reach and authority.
            </p>
          </div>

          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-950/20 cursor-pointer shrink-0"
          >
            <span>View All {publishedServices.length} Services</span>
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Featured Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredServices.map((service) => {
            const isAdded = selectedServiceIds.includes(service.id);
            const savings = service.mrp - service.launchPrice;
            const savingsPercent = Math.round((savings / service.mrp) * 100);

            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                id={`featured-card-${service.id}`}
              >
                {service.imageUrl && (
                  <div className="h-44 w-full overflow-hidden relative">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    {service.badge && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                        {service.badge}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
                        {renderIcon(service.iconName, 'w-5 h-5 text-indigo-600')}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors">
                          {service.name}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                          {service.category === 'social' && 'Social Media & Reels'}
                          {service.category === 'branding' && 'Design & Branding'}
                          {service.category === 'web' && 'Web Dev & SEO'}
                          {service.category === 'marketing' && 'Ads & Lead Gen'}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                      {service.description}
                    </p>

                    {service.deliverables && service.deliverables.length > 0 && (
                      <div className="mt-3 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Top Deliverables</span>
                        <ul className="space-y-1">
                          {service.deliverables.slice(0, 2).map((item, dIdx) => (
                            <li key={dIdx} className="text-[11px] text-slate-700 flex items-center gap-1.5 truncate">
                              <Icons.CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span className="truncate">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {service.mrp > service.launchPrice && (
                          <span className="text-xs line-through text-slate-400 font-medium">
                            ₹{service.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                          Save {savingsPercent}%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xl font-black text-indigo-600">
                          ₹{service.launchPrice.toLocaleString('en-IN')}
                        </span>
                        {service.unit && (
                          <span className="text-[10px] text-slate-400 font-bold">/{service.unit}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="px-2.5 py-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        title="View Full Details"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => onAddService(service)}
                        className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Icons.Check className="w-3.5 h-3.5 stroke-[3px]" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Icons.Plus className="w-3.5 h-3.5 stroke-[3px]" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explore All Services Banner */}
        <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">Looking for custom bundles, video packs, or web architecture?</h3>
            <p className="text-xs text-slate-600">Explore all {publishedServices.length} specialized services in our complete catalog with live filters.</p>
          </div>
          <button
            onClick={() => navigate('/services')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Browse Full Catalog</span>
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Why Choose Dizo Pulse (Value Proposition) */}
      <section className="py-8 space-y-8" id="home-value-propositions">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold tracking-wider uppercase">
            <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>The Dizo Pulse Edge</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why Modern Brands Grow With Us
          </h2>
          <p className="text-slate-600 text-base">
            We eliminate the traditional agency bloat and deliver fast, transparent, and aesthetic results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <Icons.Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">48-Hour Rapid Delivery</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We know speed matters in modern marketing. Our agile team delivers social posts, reel cuts, and graphics within 48 to 72 hours.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <Icons.ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">50/50 Split Milestone Pay</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pay 50% advance to initiate your project queue and the remaining 50% only when you approve the finalized designs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
              <Icons.Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">100% Commercial Ownership</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full copyright, source files, and high-resolution assets are completely transferred to your brand upon project completion.
            </p>
          </div>
        </div>
      </section>

      {/* Client Testimonials Wall */}
      {websiteContent?.testimonials?.enabled !== false && (
        <TestimonialWall content={websiteContent?.testimonials} />
      )}

      {/* Structured Agency FAQs accordion */}
      {websiteContent?.faq?.enabled !== false && (
        <FaqSection content={websiteContent?.faq} />
      )}

      {/* Bottom Conversion CTA Section */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden text-center space-y-6" id="home-cta-banner">
        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <span className="bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/30 inline-block">
            Ready To Launch?
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Let's Build Something Exceptional For Your Brand
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Get an instant transparent quotation with our interactive estimator, or chat directly with our design advisors on WhatsApp.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <button
              onClick={() => navigate('/quote-estimator')}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-950/50 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
            >
              <Icons.Calculator className="w-4 h-4" />
              <span>Calculate Custom Quote</span>
            </button>

            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Icons.MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Contact Agency Advisors</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
