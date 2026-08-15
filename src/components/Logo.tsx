import React from 'react';
import { motion } from 'motion/react';
import { Settings } from '../types';
import * as Icons from 'lucide-react';
import { getTheme } from '../utils/theme';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
  settings?: Settings;
}

export default function Logo({ className = '', showSubtitle = true, variant = 'dark', settings }: LogoProps) {
  const isDark = variant === 'dark'; // true means rendering on light bg, false means on dark bg
  const theme = getTheme(settings);
  
  // Dynamic settings fallback values
  const textFirst = settings?.logoTextFirst || "DIZO";
  const textSecond = settings?.logoTextSecond || "PULSE";
  const subtitleText = settings?.logoSubtitle || "Marketing Agency";
  const sloganText = settings?.logoSlogan || "DESIGN • CREATE • GROW";
  const cyanStart = settings?.logoCyanStart || "#00F0FF";
  const cyanEnd = settings?.logoCyanEnd || "#0047FF";
  const purpleStart = settings?.logoPurpleStart || "#7B2CBF";
  const purpleEnd = settings?.logoPurpleEnd || "#FF007F";
  const durationValue = settings?.logoAnimDuration !== undefined ? Number(settings?.logoAnimDuration) : 1.8;
  
  // Icon and logo style settings
  const iconType = settings?.logoIconType || "animated-vector";
  const customUrl = settings?.logoCustomUrl || "";

  // Dynamic colors matching active theme
  const word1ColorClass = isDark 
    ? (settings?.activeTheme === 'charcoal-luxury' ? 'text-amber-500' : 'text-slate-900') 
    : 'text-white';
    
  const word2ColorClass = isDark
    ? (settings?.activeTheme === 'charcoal-luxury' ? 'text-amber-300' : theme.primaryText)
    : theme.accentText || 'text-cyan-400';

  const sloganColorClass = isDark
    ? theme.primaryText
    : theme.accentText || 'text-cyan-400';

  const drawingTransition = {
    duration: durationValue,
    ease: "easeInOut"
  };

  const arrowTransition = {
    duration: durationValue * 0.77,
    ease: "easeOut",
    delay: durationValue * 0.28
  };

  // Render the selected icon style
  const renderIcon = () => {
    if (customUrl) {
      return (
        <motion.div 
          className="relative w-12 h-12 flex items-center justify-center rounded-xl overflow-hidden shadow-sm"
          whileHover={{ scale: 1.08 }}
        >
          <img 
            src={customUrl} 
            alt="Custom Site Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback to text icon if load fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </motion.div>
      );
    }

    switch (iconType) {
      case 'text-only':
        return null;

      case 'symbol-shield':
        return (
          <motion.div 
            className={`w-11 h-11 flex items-center justify-center rounded-xl ${theme.lightBg} ${theme.primaryText} border ${theme.primaryBorder}/20 shadow-inner`}
            whileHover={{ scale: 1.08, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icons.ShieldAlert className="w-6 h-6 animate-pulse" />
          </motion.div>
        );

      case 'symbol-sparkles':
        return (
          <motion.div 
            className={`w-11 h-11 flex items-center justify-center rounded-xl ${theme.lightBg} ${theme.primaryText} border ${theme.primaryBorder}/20 shadow-inner`}
            whileHover={{ scale: 1.1, rotate: 15 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icons.Sparkles className="w-6 h-6 animate-bounce" />
          </motion.div>
        );

      case 'symbol-crown':
        return (
          <motion.div 
            className={`w-11 h-11 flex items-center justify-center rounded-xl ${theme.lightBg} ${theme.primaryText} border ${theme.primaryBorder}/20 shadow-inner`}
            whileHover={{ scale: 1.1, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icons.Crown className="w-6 h-6 text-amber-500" />
          </motion.div>
        );

      case 'symbol-bolt':
        return (
          <motion.div 
            className={`w-11 h-11 flex items-center justify-center rounded-xl ${theme.lightBg} ${theme.primaryText} border ${theme.primaryBorder}/20 shadow-inner`}
            whileHover={{ scale: 1.1, skewX: -10 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icons.Zap className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
          </motion.div>
        );

      case 'animated-vector':
      default:
        return (
          <motion.div 
            className="relative w-14 h-14 flex items-center justify-center rounded-2xl p-1 bg-transparent select-none cursor-pointer"
            whileHover={{ 
              scale: 1.08,
              filter: "brightness(1.1) contrast(1.05)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            id="dizo-logo-svg-container"
          >
            <svg
              viewBox="0 0 220 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 overflow-visible"
              id="dizo-logo-svg"
            >
              <defs>
                <linearGradient id="dizoCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={cyanStart} />
                  <stop offset="50%" stopColor={cyanStart === "#00F0FF" ? "#00A2FF" : cyanStart} />
                  <stop offset="100%" stopColor={cyanEnd} />
                </linearGradient>

                <linearGradient id="dizoCyanBevel" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#002b80" stopOpacity="0.8" />
                  <stop offset="100%" stopColor={cyanStart} stopOpacity="0.2" />
                </linearGradient>

                <linearGradient id="dizoPurpleGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={purpleStart} />
                  <stop offset="60%" stopColor={purpleStart === "#7B2CBF" ? "#9D4EDD" : purpleStart} />
                  <stop offset="100%" stopColor={purpleEnd} />
                </linearGradient>

                <linearGradient id="dizoHighlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>

                <radialGradient id="dizoMergeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="35%" stopColor={cyanStart} stopOpacity="0.85" />
                  <stop offset="70%" stopColor={purpleStart} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={purpleStart} stopOpacity="0" />
                </radialGradient>

                <filter id="dizoCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComponentTransfer in="blur" result="glow">
                    <feFuncA type="linear" slope={isDark ? "0.6" : "0.3"} />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="dizoPurpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feComponentTransfer in="blur" result="glow">
                    <feFuncA type="linear" slope={isDark ? "0.7" : "0.3"} />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <motion.g
                id="logo-purple-group"
                animate={{
                  x: [0, 0, 30, 30, 0, 0],
                }}
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.35, 0.5, 0.7, 0.8, 1.0],
                }}
              >
                <motion.path
                  d="M 85,115 L 105,115 L 112,140 L 120,60 L 128,135 L 136,115 L 144,115 L 148,130 L 154,115 L 185,55"
                  stroke="url(#dizoPurpleGrad)"
                  strokeWidth="15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                  filter="url(#dizoPurpleGlow)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.75, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut", delay: 0.5 }}
                />

                <motion.path
                  d="M 85,115 L 105,115 L 112,140 L 120,60 L 128,135 L 136,115 L 144,115 L 148,130 L 154,115 L 185,55"
                  stroke="url(#dizoPurpleGrad)"
                  strokeWidth="9.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={arrowTransition}
                />

                <motion.path
                  d="M 85,115 L 105,115 L 112,140 L 120,60 L 128,135 L 136,115 L 144,115 L 148,130 L 154,115 L 185,55"
                  stroke="url(#dizoHighlightGrad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.45"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={arrowTransition}
                />

                <motion.path
                  d="M 185,55 L 158,65 L 172,72 L 178,85 Z"
                  fill="url(#dizoPurpleGrad)"
                  stroke="url(#dizoHighlightGrad)"
                  strokeWidth="1"
                  initial={{ scale: 0, opacity: 0, originX: "185px", originY: "55px" }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: durationValue * 0.77, 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 18 
                  }}
                />
              </motion.g>

              <motion.g
                id="logo-cyan-group"
                animate={{
                  x: [0, 0, -30, -30, 0, 0],
                }}
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.35, 0.5, 0.7, 0.8, 1.0],
                }}
              >
                <motion.path
                  d="M 95,95 C 110,65 145,65 145,95 C 145,125 110,125 95,95 C 80,65 45,65 45,95 C 45,125 80,125 95,95 Z"
                  stroke="url(#dizoCyanGrad)"
                  strokeWidth="22"
                  strokeLinecap="round"
                  opacity="0.55"
                  filter="url(#dizoCyanGlow)"
                  style={{ transform: "rotate(-12deg)", transformOrigin: "95px 95px" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.35, 0.65, 0.35] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                />

                <motion.path
                  d="M 95,95 C 110,65 145,65 145,95 C 145,125 110,125 95,95 C 80,65 45,65 45,95 C 45,125 80,125 95,95 Z"
                  stroke="url(#dizoCyanGrad)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  style={{ transform: "rotate(-12deg)", transformOrigin: "95px 95px" }}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={drawingTransition}
                />

                <motion.path
                  d="M 95,95 C 110,65 145,65 145,95 C 145,125 110,125 95,95 C 80,65 45,65 45,95 C 45,125 80,125 95,95 Z"
                  stroke="url(#dizoCyanBevel)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  style={{ transform: "rotate(-12deg)", transformOrigin: "95px 95px" }}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={drawingTransition}
                />

                <motion.path
                  d="M 95,95 C 110,65 145,65 145,95 C 145,125 110,125 95,95 C 80,65 45,65 45,95 C 45,125 80,125 95,95 Z"
                  stroke="url(#dizoHighlightGrad)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.6"
                  style={{ transform: "rotate(-12deg)", transformOrigin: "95px 95px" }}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={drawingTransition}
                />
              </motion.g>

              <motion.circle
                cx="110"
                cy="105"
                r="24"
                fill="url(#dizoMergeGlow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 0, 0, 0, 2.5, 0],
                  opacity: [0, 0, 0, 0, 0.95, 0],
                }}
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: "easeOut",
                  times: [0, 0.35, 0.5, 0.7, 0.8, 1.0],
                }}
              />
            </svg>
          </motion.div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-start ${className}`} id="dizo-logo-wrapper">
      <div className="flex items-center gap-3">
        {renderIcon()}

        {/* Wordmark */}
        <div className="flex flex-col">
          <div className="text-2xl font-bold tracking-wider font-sans leading-none flex items-center">
            <span className={`${word1ColorClass} font-black uppercase`}>{textFirst}</span>
            <span className={`${word2ColorClass} font-black uppercase ml-1.5 filter drop-shadow-sm`}>{textSecond}</span>
          </div>
          {showSubtitle && (
            <span className={`text-[9px] uppercase tracking-[0.25em] font-medium leading-none mt-1.5 ${isDark ? 'text-slate-500' : 'text-indigo-200'}`}>
              {subtitleText}
            </span>
          )}
        </div>
      </div>
      
      {showSubtitle && (
        <div className={`text-[8px] uppercase tracking-[0.3em] font-bold mt-1.5 pl-1.5 ${sloganColorClass}`}>
          {sloganText}
        </div>
      )}
    </div>
  );
}
