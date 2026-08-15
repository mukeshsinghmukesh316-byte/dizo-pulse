import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { Settings, Service } from '../types';
import { getTheme } from '../utils/theme';

interface FlipkartEventPanelProps {
  settings: Settings | null;
  onSelectService: (service: Service) => void;
  selectedServices: Service[];
}

export default function FlipkartEventPanel({ settings, onSelectService, selectedServices }: FlipkartEventPanelProps) {
  const theme = getTheme(settings);
  const isActive = settings?.eventActive ?? true;
  
  if (!isActive) return null;

  const eventName = settings?.eventName || "BIG BILLION FIESTA";
  const eventTagline = settings?.eventTagline || "India's Greatest Digital Sales & Lightning Scoping Deals!";
  const eventDiscountText = settings?.eventDiscountText || "FLAT 40% OFF + 10% CASHBACK";
  const endsAtString = settings?.eventEndsAt || "2026-12-31T23:59:59.000Z";
  const bannerBg = settings?.eventBannerBg || "sunset-fire";
  const deals = settings?.eventDeals || [];

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(endsAtString) - +new Date();
      if (difference <= 0) {
        setIsExpired(true);
        return;
      }
      
      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / 1000 / 60) % 60);
      const s = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      setIsExpired(false);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endsAtString]);

  // claim progress simulation state
  const [claimedStatus, setClaimedStatus] = useState<{ [key: string]: number }>({
    'deal-1': 82,
    'deal-2': 59,
    'deal-3': 91,
  });

  // Periodically increment claimed percentage randomly to mimic active Flipkart purchases
  useEffect(() => {
    const interval = setInterval(() => {
      setClaimedStatus(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] < 99) {
            const increment = Math.random() > 0.65 ? 1 : 0;
            next[key] = Math.min(99, next[key] + increment);
          }
        });
        return next;
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Map background choice
  const bgClasses = {
    "sunset-fire": "from-amber-600 via-rose-600 to-indigo-900 border-rose-500/30 text-white",
    "blue-neon": "from-cyan-600 via-blue-700 to-indigo-950 border-cyan-500/30 text-white",
    "emerald-aurora": "from-emerald-500 via-teal-700 to-slate-900 border-emerald-500/30 text-white",
    "purple-luxury": "from-purple-900 via-fuchsia-800 to-slate-950 border-purple-500/30 text-white",
  }[bannerBg] || "from-amber-600 via-rose-600 to-indigo-900 text-white";

  const handleGrabDeal = (deal: any) => {
    // Create a virtual service from the deal
    const virtualService: Service = {
      id: deal.id,
      name: `⚡ [Lightning Deal] ${deal.title}`,
      category: 'marketing',
      mrp: deal.originalPrice,
      launchPrice: deal.dealPrice,
      description: deal.description,
      unit: '/ package',
      iconName: 'Zap',
      badge: '🔥 HOT LIGHTNING DEAL'
    };

    onSelectService(virtualService);

    // Smooth scroll down to Quote Calculator
    const calcSection = document.getElementById('quote-calculator');
    if (calcSection) {
      calcSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border shadow-xl overflow-hidden relative bg-gradient-to-br ${bgClasses}`}
      id="flipkart-event-desk"
    >
      {/* Decorative festive overlay circles */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Ribbon Ticker Banner */}
      <div className="bg-yellow-400 text-slate-950 font-black text-[10px] tracking-widest text-center py-1 uppercase shadow-inner flex items-center justify-center gap-1">
        <Icons.Flame className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
        FESTIVE SUPER DEAL STORM • HIGHEST DISCOUNTS OF THE YEAR IN REAL-TIME
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Event Header row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-white/15">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 bg-yellow-400/95 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
              <Icons.Sparkles className="w-3.5 h-3.5 fill-current animate-spin-slow" />
              FLIPKART STYLE DIGITAL FESTIVAL
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display">
              {eventName} <span className="text-yellow-300 font-black animate-pulse">!</span>
            </h2>
            
            <p className="text-white/85 text-xs font-semibold max-w-xl">
              {eventTagline}
            </p>
          </div>

          {/* Countdown Clock (Flipkart Style) */}
          <div className="bg-black/45 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center min-w-[240px] text-center">
            <span className="text-[10px] font-extrabold text-yellow-300 uppercase tracking-widest mb-2.5 flex items-center gap-1">
              <Icons.Clock className="w-3 h-3 text-yellow-300" />
              Lightning Offer Ends In
            </span>

            {isExpired ? (
              <span className="text-rose-400 text-sm font-extrabold tracking-wide uppercase">Offer Concluded</span>
            ) : (
              <div className="flex items-center gap-2">
                {/* Days */}
                {timeLeft.days > 0 && (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="bg-slate-900 text-white font-mono text-base font-black p-2 rounded-lg border border-slate-700 min-w-[34px] shadow-md">
                        {String(timeLeft.days).padStart(2, '0')}
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Days</span>
                    </div>
                    <span className="text-white font-black pb-4">:</span>
                  </>
                )}

                {/* Hours */}
                <div className="flex flex-col items-center">
                  <div className="bg-slate-900 text-white font-mono text-base font-black p-2 rounded-lg border border-slate-700 min-w-[34px] shadow-md">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Hrs</span>
                </div>
                <span className="text-white font-black pb-4">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <div className="bg-slate-900 text-white font-mono text-base font-black p-2 rounded-lg border border-slate-700 min-w-[34px] shadow-md">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Min</span>
                </div>
                <span className="text-white font-black pb-4">:</span>

                {/* Seconds */}
                <div className="flex flex-col items-center">
                  <div className="bg-yellow-400 text-slate-950 font-mono text-base font-black p-2 rounded-lg border border-yellow-300 min-w-[34px] shadow-md animate-pulse">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] text-yellow-300 font-bold uppercase mt-1">Sec</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Lightning Deals Row */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-yellow-300 uppercase tracking-widest flex items-center gap-1.5">
              <Icons.Zap className="w-4 h-4 fill-current text-yellow-300 animate-bounce" />
              Hour-Glass Lightning Deals
            </h3>
            <span className="text-[10px] bg-white/10 text-white px-3 py-1 rounded-full font-bold border border-white/5">
              Stock Limited • Fills Fast
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {deals.map((deal: any) => {
              const claimed = claimedStatus[deal.id] || 75;
              const isSelected = selectedServices.some(s => s.id === deal.id);
              const discountPct = Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100);

              return (
                <div 
                  key={deal.id}
                  className="bg-black/35 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-yellow-400/30 transition-all flex flex-col justify-between group hover:scale-102 duration-300 shadow-md relative"
                >
                  {/* Discount Badge */}
                  <div className="absolute top-3 right-3 bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                    {discountPct}% OFF
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded">
                      ⚡ Lightning Deal
                    </span>

                    <div>
                      <h4 className="font-extrabold text-sm text-white group-hover:text-yellow-300 transition-colors leading-snug">
                        {deal.title}
                      </h4>
                      <p className="text-white/70 text-[11px] leading-relaxed mt-1 font-medium">
                        {deal.description}
                      </p>
                    </div>

                    {/* Flipkart claimed indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-extrabold">
                        <span className="text-rose-400">🔥 Selling Out!</span>
                        <span className="text-white/80">{claimed}% Claimed</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-rose-500 rounded-full transition-all duration-1000"
                          style={{ width: `${claimed}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Add to cart */}
                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-yellow-300 font-black text-lg">₹{deal.dealPrice.toLocaleString('en-IN')}</span>
                        <span className="text-white/40 line-through text-xs">₹{deal.originalPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                        <Icons.Check className="w-3 h-3 text-emerald-400" />
                        Guaranteed Low Price
                      </p>
                    </div>

                    <button
                      onClick={() => handleGrabDeal(deal)}
                      disabled={isSelected}
                      className={`font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-500 text-white shadow-md cursor-not-allowed'
                          : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-md shadow-yellow-500/10 hover:shadow-yellow-500/25'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Icons.Check className="w-3.5 h-3.5 stroke-[3px]" />
                          Added
                        </>
                      ) : (
                        <>
                          <Icons.ShoppingBag className="w-3.5 h-3.5" />
                          Grab Deal
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
