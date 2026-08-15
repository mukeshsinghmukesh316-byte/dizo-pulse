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

  const filteredServices = catalogServices.filter(service => {
    const isPublished = !service.status || service.status === 'published';
    if (!isPublished) return false;

    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderIcon = (name: string, className: string = 'w-6 h-6') => {
    const LucideIcon = (Icons as any)[name] || Icons.Sparkles;
    return <LucideIcon className={className} />;
  };

  return (
    <div className="space-y-8" id="services-page-root">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-10 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Icons.Grid className="w-3.5 h-3.5 text-indigo-400" />
            <span>Digital Solutions Suite</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Agency Services Catalog
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
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
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search all services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
          <Icons.Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Services Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-2 font-medium">
        <span>Showing <strong className="text-slate-900">{filteredServices.length}</strong> services</span>
        {activeCategory !== 'all' && (
          <button
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
            className="text-indigo-600 hover:underline cursor-pointer font-bold"
          >
            Show All
          </button>
        )}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                id={`service-card-${service.id}`}
              >
                {/* Photo with hover effect */}
                {service.imageUrl && (
                  <div
                    onClick={() => navigate(`/services/${service.id}`)}
                    className="h-44 w-full overflow-hidden relative cursor-pointer"
                  >
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                    {service.badge && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                        {service.badge}
                      </span>
                    )}

                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded-lg backdrop-blur-xs">
                      <span>View details</span>
                      <Icons.ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
                        {renderIcon(service.iconName, 'w-5 h-5 text-indigo-600')}
                      </div>
                      <div>
                        <h3
                          onClick={() => navigate(`/services/${service.id}`)}
                          className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer"
                        >
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

                    {/* Deliverables Checklist */}
                    {service.deliverables && service.deliverables.length > 0 && (
                      <div className="mt-3 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Key Deliverables</span>
                        <ul className="space-y-1">
                          {service.deliverables.slice(0, 3).map((item, dIdx) => (
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
                        <span className="text-lg font-black text-indigo-600">
                          ₹{service.launchPrice.toLocaleString('en-IN')}
                        </span>
                        {service.unit && (
                          <span className="text-[10px] text-slate-400 font-bold">/{service.unit}</span>
                        )}
                      </div>
                      {service.turnaroundTime && (
                        <span className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                          <Icons.Clock className="w-2.5 h-2.5 text-indigo-500" />
                          {service.turnaroundTime}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="px-2.5 py-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => onAddService(service)}
                        className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
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

      {filteredServices.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <Icons.Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No services match your query</h3>
          <p className="text-slate-500 text-xs mt-1">Try searching for keywords like "Reel", "Logo", "Website", or "SEO".</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Floating Cart Indicator when items selected */}
      {selectedServiceIds.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950/95 border-2 border-indigo-500/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl flex items-center gap-4 text-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Cart Summary</p>
            <p className="text-sm font-black">{selectedServiceIds.length} Service(s) Selected</p>
          </div>
          <button
            onClick={() => navigate('/quote-estimator')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            Checkout
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
