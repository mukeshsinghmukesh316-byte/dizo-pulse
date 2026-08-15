import { Settings } from '../types';

export interface ThemeClasses {
  id: string;
  name: string;
  primaryBg: string;             // e.g. "bg-indigo-600"
  primaryHoverBg: string;        // e.g. "hover:bg-indigo-700"
  primaryText: string;           // e.g. "text-indigo-600"
  primaryBorder: string;         // e.g. "border-indigo-600"
  primaryRing: string;           // e.g. "focus:ring-indigo-500"
  primaryGlow: string;           // e.g. "shadow-indigo-200" or similar
  badgeBg: string;               // e.g. "bg-indigo-50 text-indigo-700 border-indigo-100"
  lightBg: string;               // e.g. "bg-indigo-50"
  heroGradient: string;          // e.g. "from-slate-900 via-indigo-950 to-slate-950"
  promoGradient: string;         // e.g. "from-cyan-500 via-indigo-600 to-indigo-700"
  accentText: string;            // e.g. "text-cyan-400"
  accentBg: string;              // e.g. "bg-cyan-500"
  accentBorder: string;          // e.g. "border-cyan-500"
  selection: string;             // e.g. "selection:bg-indigo-100 selection:text-indigo-900"
  cardBorderHover: string;       // e.g. "hover:border-indigo-200"
  appContainerBg: string;        // e.g. "bg-slate-50" or custom for Luxury
  cardBg: string;                // e.g. "bg-white"
  textMain: string;              // e.g. "text-slate-800"
  textMuted: string;             // e.g. "text-slate-500"
  textHeading: string;           // e.g. "text-slate-950"
  inputBg: string;               // e.g. "bg-slate-50"
  accentBadge: string;           // e.g. "bg-cyan-950/60 text-cyan-300 border-cyan-800/80"
}

export const THEMES: { [key: string]: ThemeClasses } = {
  "indigo-cyber": {
    id: "indigo-cyber",
    name: "⚡ Cyber Indigo (Default)",
    primaryBg: "bg-indigo-600",
    primaryHoverBg: "hover:bg-indigo-500",
    primaryText: "text-indigo-600",
    primaryBorder: "border-indigo-600",
    primaryRing: "focus:ring-indigo-500",
    primaryGlow: "shadow-indigo-100",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-100",
    lightBg: "bg-indigo-50",
    heroGradient: "from-slate-900 via-indigo-950 to-slate-950",
    promoGradient: "from-cyan-500 via-indigo-600 to-indigo-700",
    accentText: "text-cyan-400",
    accentBg: "bg-cyan-500",
    accentBorder: "border-cyan-500",
    selection: "selection:bg-indigo-100 selection:text-indigo-900",
    cardBorderHover: "hover:border-indigo-200",
    appContainerBg: "bg-slate-50",
    cardBg: "bg-white",
    textMain: "text-slate-800",
    textMuted: "text-slate-500",
    textHeading: "text-slate-950",
    inputBg: "bg-slate-50",
    accentBadge: "bg-indigo-950/60 text-indigo-300 border-indigo-800/80"
  },
  "ocean-breeze": {
    id: "ocean-breeze",
    name: "🌊 Ocean Breeze (Teal & Sky)",
    primaryBg: "bg-teal-600",
    primaryHoverBg: "hover:bg-teal-500",
    primaryText: "text-teal-600",
    primaryBorder: "border-teal-600",
    primaryRing: "focus:ring-teal-500",
    primaryGlow: "shadow-teal-100",
    badgeBg: "bg-teal-50 text-teal-800 border-teal-100",
    lightBg: "bg-teal-50",
    heroGradient: "from-slate-900 via-teal-950 to-slate-950",
    promoGradient: "from-teal-500 via-emerald-600 to-sky-700",
    accentText: "text-sky-300",
    accentBg: "bg-sky-500",
    accentBorder: "border-sky-500",
    selection: "selection:bg-teal-100 selection:text-teal-900",
    cardBorderHover: "hover:border-teal-200",
    appContainerBg: "bg-slate-50/70",
    cardBg: "bg-white",
    textMain: "text-slate-800",
    textMuted: "text-slate-500",
    textHeading: "text-slate-950",
    inputBg: "bg-slate-50",
    accentBadge: "bg-teal-950/60 text-teal-300 border-teal-800/80"
  },
  "sunset-gold": {
    id: "sunset-gold",
    name: "🌅 Sunset Gold (Orange & Rose)",
    primaryBg: "bg-rose-600",
    primaryHoverBg: "hover:bg-rose-500",
    primaryText: "text-rose-600",
    primaryBorder: "border-rose-600",
    primaryRing: "focus:ring-rose-500",
    primaryGlow: "shadow-rose-100",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-100",
    lightBg: "bg-rose-50",
    heroGradient: "from-stone-900 via-rose-950 to-stone-950",
    promoGradient: "from-orange-500 via-rose-600 to-amber-600",
    accentText: "text-amber-400",
    accentBg: "bg-amber-500",
    accentBorder: "border-amber-500",
    selection: "selection:bg-rose-100 selection:text-rose-900",
    cardBorderHover: "hover:border-rose-200",
    appContainerBg: "bg-stone-50",
    cardBg: "bg-white",
    textMain: "text-stone-800",
    textMuted: "text-stone-500",
    textHeading: "text-stone-950",
    inputBg: "bg-stone-50",
    accentBadge: "bg-rose-950/60 text-rose-300 border-rose-800/80"
  },
  "forest-mint": {
    id: "forest-mint",
    name: "🌲 Forest Mint (Green & Sage)",
    primaryBg: "bg-emerald-700",
    primaryHoverBg: "hover:bg-emerald-600",
    primaryText: "text-emerald-700",
    primaryBorder: "border-emerald-700",
    primaryRing: "focus:ring-emerald-500",
    primaryGlow: "shadow-emerald-100",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-100",
    lightBg: "bg-emerald-50",
    heroGradient: "from-zinc-900 via-emerald-950 to-zinc-950",
    promoGradient: "from-emerald-500 via-teal-600 to-cyan-700",
    accentText: "text-mint-300",
    accentBg: "bg-teal-500",
    accentBorder: "border-teal-500",
    selection: "selection:bg-emerald-100 selection:text-emerald-900",
    cardBorderHover: "hover:border-emerald-200",
    appContainerBg: "bg-zinc-50",
    cardBg: "bg-white",
    textMain: "text-zinc-800",
    textMuted: "text-zinc-500",
    textHeading: "text-zinc-950",
    inputBg: "bg-zinc-50",
    accentBadge: "bg-emerald-950/60 text-emerald-300 border-emerald-800/80"
  },
  "royal-purple": {
    id: "royal-purple",
    name: "🔮 Royal Amethyst (Purple & Magenta)",
    primaryBg: "bg-purple-600",
    primaryHoverBg: "hover:bg-purple-500",
    primaryText: "text-purple-600",
    primaryBorder: "border-purple-600",
    primaryRing: "focus:ring-purple-500",
    primaryGlow: "shadow-purple-100",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-100",
    lightBg: "bg-purple-50",
    heroGradient: "from-slate-900 via-purple-950 to-slate-950",
    promoGradient: "from-purple-500 via-fuchsia-600 to-indigo-700",
    accentText: "text-pink-400",
    accentBg: "bg-pink-500",
    accentBorder: "border-pink-500",
    selection: "selection:bg-purple-100 selection:text-purple-900",
    cardBorderHover: "hover:border-purple-200",
    appContainerBg: "bg-slate-50",
    cardBg: "bg-white",
    textMain: "text-slate-800",
    textMuted: "text-slate-500",
    textHeading: "text-slate-950",
    inputBg: "bg-slate-50",
    accentBadge: "bg-purple-950/60 text-purple-300 border-purple-800/80"
  },
  "charcoal-luxury": {
    id: "charcoal-luxury",
    name: "🏆 Charcoal Luxury (Gold & Midnight)",
    primaryBg: "bg-amber-500",
    primaryHoverBg: "hover:bg-amber-400",
    primaryText: "text-amber-400",
    primaryBorder: "border-amber-500/40",
    primaryRing: "focus:ring-amber-500",
    primaryGlow: "shadow-amber-950/30",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    lightBg: "bg-slate-900/60",
    heroGradient: "from-black via-slate-950 to-zinc-950",
    promoGradient: "from-amber-600 via-zinc-900 to-amber-700",
    accentText: "text-amber-300",
    accentBg: "bg-amber-500",
    accentBorder: "border-amber-500",
    selection: "selection:bg-amber-500/30 selection:text-amber-200",
    cardBorderHover: "hover:border-amber-500/30",
    appContainerBg: "bg-slate-950 text-slate-200",
    cardBg: "bg-slate-900/90 border border-slate-800/80",
    textMain: "text-slate-300",
    textMuted: "text-slate-400",
    textHeading: "text-white",
    inputBg: "bg-slate-950 border-slate-800 text-slate-100",
    accentBadge: "bg-amber-950/60 text-amber-300 border-amber-800/80"
  }
};

export function getTheme(settings: Settings | null | undefined): ThemeClasses {
  const activeId = settings?.activeTheme || "indigo-cyber";
  return THEMES[activeId] || THEMES["indigo-cyber"];
}
