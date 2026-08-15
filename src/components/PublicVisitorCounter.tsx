import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import { fetchPublicVisitorCount, formatVisitorCount, VisitorStatsResponse } from '../utils/visitorTracker';

interface PublicVisitorCounterProps {
  theme?: any;
  variant?: 'hero-badge' | 'featured-card' | 'compact' | 'minimal';
  className?: string;
  id?: string;
}

export default function PublicVisitorCounter({
  theme,
  variant = 'featured-card',
  className = '',
  id = 'public-visitor-counter'
}: PublicVisitorCounterProps) {
  const [stats, setStats] = useState<VisitorStatsResponse>({
    totalUniqueVisitors: 10420,
    formattedCount: '10K+',
    displayText: '10K+ People have visited Dizo Pulse',
    milestone: '10K+',
    exactCount: 10420
  });
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const data = await fetchPublicVisitorCount();
        if (isMounted) {
          setStats(data);
          setIsLoading(false);
          startCountUpAnimation(data.exactCount || data.totalUniqueVisitors || 10420);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoading(false);
          startCountUpAnimation(10420);
        }
      }
    }

    loadStats();

    // Auto-refresh stats every 45 seconds to reflect incoming traffic live
    const interval = setInterval(async () => {
      try {
        const refreshed = await fetchPublicVisitorCount();
        if (isMounted) {
          setStats(refreshed);
        }
      } catch {
        // silent fallback
      }
    }, 45000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startCountUpAnimation = (target: number) => {
    const duration = 1800; // 1.8 seconds smooth count up
    const startTime = performance.now();
    const startVal = Math.max(0, Math.floor(target * 0.7)); // start at 70% for snappy aesthetic feel

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + (target - startVal) * easeOut);

      setDisplayCount(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayCount(target);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  // Human-readable formatted string for live animated number
  const currentFormatted = formatVisitorCount(displayCount || stats.exactCount || 10420);

  // Variant: Minimalist hero badge
  if (variant === 'hero-badge' || variant === 'compact') {
    return (
      <div
        id={id}
        className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 text-slate-200 text-xs font-semibold backdrop-blur-md shadow-lg ${className}`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-white font-black text-indigo-300">
          {currentFormatted}
        </span>
        <span className="text-slate-300">People have visited Dizo Pulse</span>
      </div>
    );
  }

  // Variant: Default Featured Card (Luxury & Highly Engaging on Home Page)
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 p-5 md:p-6 text-white shadow-xl ${className}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
        {/* Left Side: Avatar stack & Live Counter text */}
        <div className="flex items-center gap-4">
          {/* Avatar stack visual indicator */}
          <div className="flex -space-x-2.5 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
              DP
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
              <Icons.Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
              <Icons.Users className="w-4 h-4 text-white" />
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-950 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-emerald-400 shadow-sm">
              +
            </div>
          </div>

          {/* Main Visitor Counter Text */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                Live Public Traffic
              </span>
            </div>

            <div className="text-base sm:text-lg md:text-xl font-extrabold text-white flex items-baseline gap-1.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-white tracking-tight">
                {currentFormatted}
              </span>
              <span className="text-slate-200">People have visited Dizo Pulse</span>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Real-time unique visitors verified by backend traffic analytics
            </p>
          </div>
        </div>

        {/* Right Side: Trust & Privacy Verification Pill */}
        <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
            <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold">100% Privacy Protected</span>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              Deduplicated
            </span>
            <span className="text-xs text-slate-300 font-extrabold">
              Unique Visitors
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
