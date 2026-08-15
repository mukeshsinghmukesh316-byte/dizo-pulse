import React, { useState } from 'react';
import { Service } from '../types';
import QuoteCalculator from '../components/QuoteCalculator';
import * as Icons from 'lucide-react';

interface QuoteEstimatorPageProps {
  selectedServices: Service[];
  onRemoveService: (serviceId: string) => void;
  onClearServices: () => void;
  catalogServices: Service[];
  onAddService: (service: Service) => void;
  settings?: any;
  globalCouponCode?: string;
  setGlobalCouponCode?: (code: string) => void;
  navigate: (path: string) => void;
}

export default function QuoteEstimatorPage({
  selectedServices,
  onRemoveService,
  onClearServices,
  catalogServices,
  onAddService,
  settings,
  globalCouponCode,
  setGlobalCouponCode,
  navigate,
}: QuoteEstimatorPageProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'social' | 'branding' | 'web' | 'marketing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const publishedServices = (catalogServices || []).filter((s) => !s.status || s.status === 'published');

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'social', label: 'Social & Reels' },
    { id: 'branding', label: 'Branding & Design' },
    { id: 'web', label: 'Web & SEO' },
    { id: 'marketing', label: 'Ads & Lead Gen' },
  ];

  const filteredServices = publishedServices.filter((service) => {
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedServiceIds = new Set(selectedServices.map((s) => s.id));

  const renderIcon = (name: string, className = 'w-5 h-5') => {
    const LucideIcon = (Icons as any)[name] || Icons.Sparkles;
    return <LucideIcon className={className} />;
  };

  return (
    <div className="space-y-8 pb-28 lg:pb-0 overflow-x-hidden w-full" id="quote-estimator-page-root">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Icons.Calculator className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transparent Pricing Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Custom Quote Estimator
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
            Select items from our service suite, customize scopes, apply promo coupons, configure 50/50 split billing, and submit your project requirements directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/services')}
            className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Icons.ExternalLink className="w-3.5 h-3.5" />
            <span>Catalog Details</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('quote-calculator');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
          >
            <Icons.ShoppingCart className="w-3.5 h-3.5" />
            <span>Basket ({selectedServices.length})</span>
          </button>
        </div>
      </div>

      {/* Interactive Service Catalog Selection Suite */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-6" id="service-selection-suite">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
              Step 1: Choose Deliverables
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Select Services to Estimate
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Click any card to add or remove it from your live quotation basket.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid (Consistent padding p-5 sm:p-6 and Clear Highlighting) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredServices.map((service) => {
            const isSelected = selectedServiceIds.has(service.id);

            return (
              <div
                key={service.id}
                onClick={() => onAddService(service)}
                className={`p-5 sm:p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-4 select-none ${
                  isSelected
                    ? 'border-2 border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20'
                    : 'border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                }`}
                id={`service-card-${service.id}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`p-3 rounded-xl shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {renderIcon(service.iconName, 'w-5 h-5')}
                    </div>

                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                        <Icons.Check className="w-3 h-3 stroke-[3]" />
                        <span>In Basket</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <span>Click to Select</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {service.category}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5 leading-snug">
                      {service.name}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Highlights/Deliverables Pills */}
                  {service.deliverables && service.deliverables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {service.deliverables.slice(0, 2).map((deliv, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100/90 text-slate-600 px-2 py-0.5 rounded-md font-semibold truncate max-w-full"
                        >
                          ✓ {deliv}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Pricing & Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] line-through text-slate-400 font-semibold block leading-none">
                      MRP ₹{service.mrp.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base sm:text-lg font-black text-indigo-600 font-mono">
                        ₹{service.launchPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        /{service.unit || 'unit'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddService(service);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      isSelected
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Icons.Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Remove</span>
                      </>
                    ) : (
                      <>
                        <Icons.Plus className="w-3.5 h-3.5" />
                        <span>Select</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Icons.SearchX className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No services match your search or filter.</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="mt-2 text-xs font-extrabold text-indigo-600 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Main Quote Calculator & Summary Component */}
      <QuoteCalculator
        selectedServices={selectedServices}
        onRemoveService={onRemoveService}
        onClearServices={onClearServices}
        settings={settings}
        globalCouponCode={globalCouponCode}
        setGlobalCouponCode={setGlobalCouponCode}
      />
    </div>
  );
}

