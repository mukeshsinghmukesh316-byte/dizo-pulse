import React from 'react';
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
  const publishedServices = catalogServices.filter((s) => !s.status || s.status === 'published');
  const popularQuickPicks = publishedServices.slice(0, 4);

  return (
    <div className="space-y-8" id="quote-estimator-page-root">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-10 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Icons.Calculator className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transparent Pricing Engine</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Custom Quote Estimator
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
            Select items from our service suite, apply promotional launch coupons, configure 50/50 split billing, and submit your project requirements directly.
          </p>
        </div>

        <button
          onClick={() => navigate('/services')}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-950/40 shrink-0"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>Browse All Services</span>
        </button>
      </div>

      {/* Quick Add Helper if Cart has 0 items */}
      {selectedServices.length === 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Icons.ShoppingCart className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Your Quote Basket is Empty</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select one or more services from our catalog below to immediately calculate your project estimate with discounts applied.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider text-center">
              Popular Quick-Picks to Start
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {popularQuickPicks.map((service) => (
                <div
                  key={service.id}
                  className="bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{service.name}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider mt-0.5">
                      {service.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="font-black text-indigo-600 text-sm">
                      ₹{service.launchPrice.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => onAddService(service)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Icons.Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Quote Calculator Component */}
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
