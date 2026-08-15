import React, { useState } from 'react';
import { Service } from '../types';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServicesPageProps {
  catalogServices: Service[];
  selectedServiceIds: string[];
  onAddService: (service: Service) => void;
  navigate: (path: string) => void;
}

export default function ServicesPage({
  catalogServices,
  selectedServiceIds,
  onAddService,
  navigate,
}: ServicesPageProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'social' | 'branding' | 'web' | 'marketing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'social', label: 'Social Media & Reels' },
    { id: 'branding', label: 'Design & Branding' },
    { id: 'web', label: 'Web & SEO Solutions' },
    { id: 'marketing', label: 'Ads & Lead Gen' }
  ];

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
  };

  const filteredServices = catalogServices.filter(service => {
    const isPublished = !service.status || service.status === 'published';
    if (!isPublished) return false;

    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.deliverables && service.deliverables.some(d => d.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const renderIcon = (name: string, className: string = 'w-5 h-5') => {
    const LucideIcon = (Icons as any)[name] || Icons.Sparkles;
    return <LucideIcon className={className} />;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'social':
        return 'Social Media & Reels';
      case 'branding':
        return 'Design & Branding';
      case 'web':
        return 'Web Dev & SEO';
      case 'marketing':
        return 'Ads & Lead Gen';
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-7xl mx-auto" id="services-page-root">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Icons.Grid className="w-3.5 h-3.5 text-indigo-400" />
            <span>Digital Solutions Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Agency Services Catalog
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
            Browse our full spectrum of branding, video production, web development, and digital marketing solutions. All rates include our flat 20% promotional launch discount.
          </p>
        </div>

        {selectedServiceIds.length > 0 && (
          <button
            onClick={() => navigate('/quote-estimator')}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950/40 shrink-0"
          >
            <Icons.ShoppingCart className="w-4 h-4" />
            <span>Review Quote ({selectedServiceIds.length})</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 justify-start w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 shrink-0">
          <input
            type="text"
            placeholder="Search all services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Clear search query"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Services Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>
          Showing <strong className="text-slate-900 font-bold">{filteredServices.length}</strong> {filteredServices.length === 1 ? 'service' : 'services'}
        </span>
        {(activeCategory !== 'all' || searchQuery.trim() !== '') && (
          <button
            onClick={handleClearFilters}
            className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer font-bold flex items-center gap-1"
          >
            <Icons.RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Services Grid with Fixed Heights to Prevent Layout Shifts */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service) => {
              const isAdded = selectedServiceIds.includes(service.id);
              const savings = service.mrp - service.launchPrice;
              const savingsPercent = Math.round((savings / service.mrp) * 100);

              return (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between overflow-hidden group h-full"
                  id={`service-card-${service.id}`}
                >
                  {/* Visual Header / Photo container */}
                  <div
                    onClick={() => navigate(`/services/${service.id}`)}
                    className="h-44 sm:h-48 w-full overflow-hidden relative cursor-pointer bg-slate-900 shrink-0"
                  >
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-950/80 text-indigo-400">
                        {renderIcon(service.iconName, 'w-16 h-16 opacity-60')}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

                    {/* Consistent Badges on Image Overlay */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30">
                        {getCategoryLabel(service.category)}
                      </span>

                      {service.badge && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-xs">
                          <Icons.Sparkles className="w-3 h-3" />
                          <span>{service.badge}</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      <span>View details</span>
                      <Icons.ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Card Body with Consistent Spacing & Padding */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Icon + Title & Category */}
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
                          {renderIcon(service.iconName, 'w-5 h-5 text-indigo-600')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            onClick={() => navigate(`/services/${service.id}`)}
                            className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
                            title={service.name}
                          >
                            {service.name}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                            {getCategoryLabel(service.category)}
                          </span>
                        </div>
                      </div>

                      {/* Description with fixed clamp */}
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 min-h-[2rem]">
                        {service.description}
                      </p>

                      {/* Deliverables Checklist with Uniform Height */}
                      {service.deliverables && service.deliverables.length > 0 && (
                        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[4.5rem]">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                            Key Deliverables
                          </span>
                          <ul className="space-y-1">
                            {service.deliverables.slice(0, 2).map((item, dIdx) => (
                              <li key={dIdx} className="text-[11px] text-slate-700 flex items-center gap-1.5 truncate">
                                <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="truncate">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Card Footer with Perfectly Aligned Pricing & CTAs */}
                    <div className="pt-3.5 border-t border-slate-100 flex items-end justify-between gap-2 mt-auto">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {service.mrp > service.launchPrice && (
                            <span className="text-xs line-through text-slate-400 font-semibold">
                              ₹{service.mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="inline-flex items-center text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                            Save {savingsPercent}%
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base sm:text-lg font-black text-indigo-600 font-mono leading-none">
                            ₹{service.launchPrice.toLocaleString('en-IN')}
                          </span>
                          {service.unit && (
                            <span className="text-[10px] text-slate-400 font-semibold">/{service.unit}</span>
                          )}
                        </div>
                        {service.turnaroundTime && (
                          <span className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                            <Icons.Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">{service.turnaroundTime}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/services/${service.id}`)}
                          className="px-2.5 py-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => onAddService(service)}
                          className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer min-w-[76px] ${
                            isAdded
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Professional Empty State */
        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Icons.SearchX className="w-8 h-8 text-indigo-600 stroke-[1.75]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              No services found matching your filter
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              Try adjusting your search query or selecting a different category from the filters above.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          >
            <Icons.RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      )}

      {/* Floating Cart Indicator when items selected */}
      {selectedServiceIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950/95 border border-indigo-500/60 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center gap-4 text-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Cart Summary</p>
            <p className="text-xs sm:text-sm font-black">{selectedServiceIds.length} Service(s) Selected</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/quote-estimator')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <span>Checkout</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

