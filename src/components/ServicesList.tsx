import React, { useState } from 'react';
import { services } from '../data/services';
import { Service } from '../types';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServicesListProps {
  onAddService: (service: Service) => void;
  selectedServiceIds: string[];
  catalogServices?: Service[];
  isExpanded?: boolean;
  setIsExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
  onViewAllServices?: () => void;
  isStandalonePage?: boolean;
}

export default function ServicesList({
  onAddService,
  selectedServiceIds,
  catalogServices,
  isExpanded: externalIsExpanded,
  setIsExpanded: externalSetIsExpanded,
  onViewAllServices,
  isStandalonePage = false,
}: ServicesListProps) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'social' | 'branding' | 'web' | 'marketing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const setIsExpanded = (val: boolean) => {
    if (externalSetIsExpanded) {
      externalSetIsExpanded(val);
    } else {
      setInternalIsExpanded(val);
    }
  };

  const activeServices = catalogServices || services;

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'social', label: 'Social Media & Reels' },
    { id: 'branding', label: 'Design & Branding' },
    { id: 'web', label: 'Web & SEO Solutions' },
    { id: 'marketing', label: 'Ads & Lead Gen' }
  ];

  const filteredServices = activeServices.filter(service => {
    const isPublished = !service.status || service.status === 'published';
    if (!isPublished) return false;

    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Limit services to 3 when not expanded and in 'all' view without active search
  const shouldLimit = !isExpanded && activeCategory === 'all' && searchQuery.trim() === '';
  const displayedServices = shouldLimit ? filteredServices.slice(0, 3) : filteredServices;
  const hiddenCount = filteredServices.length - 3;

  // Dynamic Icon Renderer
  const renderIcon = (name: string, className: string = 'w-6 h-6') => {
    const LucideIcon = (Icons as any)[name] || Icons.HelpCircle;
    return <LucideIcon className={className} />;
  };

  const handleCategorySelect = (catId: any) => {
    setActiveCategory(catId);
    if (catId !== 'all') {
      setIsExpanded(true);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== '') {
      setIsExpanded(true);
    }
  };

  return (
    <div className="py-12 bg-slate-50 rounded-3xl px-6 md:px-12 border border-slate-100" id="services-browser">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          Service Catalog
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
          Our Services & Pricing
        </h2>
        <p className="text-slate-600 mt-2 text-base md:text-lg">
          Explore professional design, creation, and growth services with a flat 20% launch discount.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-500'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm"
          />
          <Icons.Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          {displayedServices.map((service) => {
            const isAdded = selectedServiceIds.includes(service.id);
            const savings = service.mrp - service.launchPrice;

            return (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200/80 transition-all duration-300 flex flex-col justify-between relative group overflow-hidden"
                id={`service-card-${service.id}`}
              >
                {/* Professional Photo with Zoom Hover effect */}
                {service.imageUrl && (
                  <div className="h-44 w-full overflow-hidden relative">
                    <img 
                      src={service.imageUrl} 
                      alt={service.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    
                    {service.badge && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full tracking-wider shadow-sm animate-pulse">
                        {service.badge}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
                        {renderIcon(service.iconName, 'w-5 h-5 text-indigo-600')}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm md:text-base leading-tight group-hover:text-indigo-600 transition-colors">
                          {service.name}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                          {service.category === 'social' && 'Social & Reels'}
                          {service.category === 'branding' && 'Graphics & Brand'}
                          {service.category === 'web' && 'Web Dev & SEO'}
                          {service.category === 'marketing' && 'Ads & Lead Gen'}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs leading-relaxed mb-3">
                      {service.description}
                    </p>

                    {/* Deliverables Checklist */}
                    {service.deliverables && service.deliverables.length > 0 && (
                      <div className="mb-4 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
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

                  <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        {service.mrp > service.launchPrice && (
                          <span className="text-xs line-through text-slate-400 font-medium">
                            ₹{service.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                          Save {service.mrp && service.launchPrice ? Math.round(((service.mrp - service.launchPrice) / service.mrp) * 100) : 20}%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-lg font-black text-indigo-600">
                          ₹{service.launchPrice.toLocaleString('en-IN')}
                        </span>
                        {service.unit && (
                          <span className="text-[9px] text-slate-400 font-bold">
                            /{service.unit}
                          </span>
                        )}
                      </div>
                      {service.turnaroundTime && (
                        <span className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                          <Icons.Clock className="w-2.5 h-2.5 text-indigo-500" />
                          {service.turnaroundTime}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onAddService(service)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1 cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-100'
                          : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Icons.Check className="w-3.5 h-3.5 stroke-[3px]" />
                          Added
                        </>
                      ) : (
                        <>
                          <Icons.Plus className="w-3.5 h-3.5 stroke-[3px]" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* View More / Show Less Controls */}
      {shouldLimit && hiddenCount > 0 && (
        <div className="mt-10 text-center">
          <button
            onClick={() => {
              if (onViewAllServices) {
                onViewAllServices();
              } else {
                setIsExpanded(true);
              }
            }}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
          >
            <span>View All Services</span>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[11px] font-black">
              +{hiddenCount} More
            </span>
            <Icons.ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {isExpanded && filteredServices.length > 3 && searchQuery === '' && activeCategory === 'all' && (
        <div className="mt-10 text-center">
          <button
            onClick={() => {
              setIsExpanded(false);
              const element = document.getElementById('services-browser');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            <span>Show Less Services</span>
            <Icons.ChevronUp className="w-4 h-4" />
          </button>
        </div>
      )}

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Icons.AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No services found matching your criteria.</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="text-indigo-600 text-sm font-semibold underline mt-1 hover:text-indigo-700"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
