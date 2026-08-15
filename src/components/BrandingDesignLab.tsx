import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Service } from '../types';

interface BrandingDesignLabProps {
  onAddBrandingServices: (services: string[]) => void;
}

const aestheticVibes = [
  {
    id: 'minimalist',
    name: 'Aesthetic Minimalist',
    desc: 'Clean layouts, crisp sans-serif headings, generous whitespace, and ultimate simplicity.',
    fontClass: 'font-sans tracking-tight',
    headerFont: 'font-extrabold tracking-tighter uppercase',
    bodyFont: 'font-light',
    bgStyle: 'bg-stone-50 text-stone-900 border-stone-200/80',
    cardBackStyle: 'bg-stone-900 text-stone-100'
  },
  {
    id: 'cyberpunk',
    name: 'Tech Cyberpunk',
    desc: 'Neon grids, terminal monospaced code fonts, sharp angles, and electric retro-futuristic styling.',
    fontClass: 'font-mono',
    headerFont: 'font-black tracking-widest text-cyan-400 uppercase',
    bodyFont: 'font-medium',
    bgStyle: 'bg-zinc-950 text-zinc-100 border-zinc-800',
    cardBackStyle: 'bg-zinc-900 text-cyan-400 border border-cyan-500/30'
  },
  {
    id: 'editorial',
    name: 'Premium Editorial',
    desc: 'Elegant editorial serif look, soft warm hues, sophisticated spacing, and boutique feel.',
    fontClass: 'font-serif',
    headerFont: 'font-black tracking-normal italic capitalize',
    bodyFont: 'font-serif font-light',
    bgStyle: 'bg-amber-50/40 text-amber-950 border-amber-200/60',
    cardBackStyle: 'bg-amber-950 text-amber-50'
  },
  {
    id: 'retro',
    name: 'Playful Retro',
    desc: 'Fun rounded aesthetic, chunky outline borders, energetic offsets, and bold nostalgic colors.',
    fontClass: 'font-sans',
    headerFont: 'font-black tracking-tight text-yellow-400 uppercase',
    bodyFont: 'font-bold',
    bgStyle: 'bg-orange-50 text-orange-950 border-orange-200',
    cardBackStyle: 'bg-orange-600 text-white border-2 border-orange-950'
  }
];

const presetColors = [
  { name: 'Cosmic Indigo', value: '#4f46e5', textClass: 'text-indigo-600', bgClass: 'bg-indigo-600', hex: '#4f46e5' },
  { name: 'Vibrant Teal', value: '#0ea5e9', textClass: 'text-sky-500', bgClass: 'bg-sky-500', hex: '#0ea5e9' },
  { name: 'Emerald Mint', value: '#10b981', textClass: 'text-emerald-500', bgClass: 'bg-emerald-500', hex: '#10b981' },
  { name: 'Electric Sunset', value: '#f43f5e', textClass: 'text-rose-500', bgClass: 'bg-rose-500', hex: '#f43f5e' },
  { name: 'Warm Honey', value: '#f59e0b', textClass: 'text-amber-500', bgClass: 'bg-amber-500', hex: '#f59e0b' },
  { name: 'Carbon Black', value: '#18181b', textClass: 'text-zinc-900', bgClass: 'bg-zinc-900', hex: '#18181b' }
];

export default function BrandingDesignLab({ onAddBrandingServices }: BrandingDesignLabProps) {
  const [brandName, setBrandName] = useState('My Brand Lab');
  const [brandSlogan, setBrandSlogan] = useState('Smarter & Sleeker');
  const [activeVibeId, setActiveVibeId] = useState('minimalist');
  const [activeColor, setActiveColor] = useState(presetColors[0]);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [labActionApplied, setLabActionApplied] = useState(false);

  const activeVibe = aestheticVibes.find((v) => v.id === activeVibeId) || aestheticVibes[0];

  const handleApplyToQuote = () => {
    // Add branding services to the quote (logo-design, brand-kit, poster-banner)
    onAddBrandingServices(['logo-design', 'brand-kit', 'poster-banner']);
    setLabActionApplied(true);
    setTimeout(() => setLabActionApplied(false), 3000);
  };

  return (
    <div className="py-12 bg-white rounded-3xl px-6 md:px-12 border border-slate-100 shadow-sm" id="branding-lab-section">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
          Interactive Visual Sandbox
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
          Branding Design Lab
        </h2>
        <p className="text-slate-600 mt-2 text-sm md:text-base max-w-2xl mx-auto">
          Craft your visual identity instantly. Choose your vibe, toggle brand assets, and preview your custom business cards, Instagram posts, and landing page mockup!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
        
        {/* Left Config Panel */}
        <div className="lg:col-span-5 bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-150 space-y-6">
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
            <Icons.Sliders className="w-4 h-4 text-indigo-600" />
            Vibe & Asset Configurator
          </h3>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Brand / Business Name
              </label>
              <input
                type="text"
                maxLength={25}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value || 'My Brand')}
                placeholder="e.g. Aura Juice Bar"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Brand Slogan / Subtitle
              </label>
              <input
                type="text"
                maxLength={40}
                value={brandSlogan}
                onChange={(e) => setBrandSlogan(e.target.value || 'Fresh & Natural')}
                placeholder="e.g. Taste the Sunshine"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Aesthetic Vibe Selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
              Select Aesthetic Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              {aestheticVibes.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => setActiveVibeId(vibe.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                    activeVibeId === vibe.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{vibe.name}</p>
                  <p className={`text-[9px] mt-1 leading-normal ${activeVibeId === vibe.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {vibe.desc.substring(0, 48)}...
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palettes */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
              Choose Brand Identity Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {presetColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setActiveColor(color)}
                  className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                    activeColor.name === color.name ? 'ring-4 ring-indigo-200 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {activeColor.name === color.name && (
                    <Icons.Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Integration */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleApplyToQuote}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                labActionApplied
                  ? 'bg-green-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100'
              }`}
            >
              {labActionApplied ? (
                <>
                  <Icons.CheckCircle2 className="w-4.5 h-4.5 animate-bounce" />
                  Branding Added to Quote Estimator!
                </>
              ) : (
                <>
                  <Icons.Sparkles className="w-4.5 h-4.5" />
                  Apply This Visual Vibe To Quote
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
              Auto-selects Logo, Brand Kit, and Graphics services below based on this style.
            </p>
          </div>
        </div>

        {/* Right Preview Arena */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Mockup Tabs Area */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex justify-between gap-1 max-w-md">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider py-1.5 px-3 flex items-center gap-1.5">
              <Icons.Eye className="w-3.5 h-3.5 text-indigo-600" />
              Live Previews
            </span>
            <div className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg font-bold flex items-center">
              Real-time Rendering
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Business Card Interactive Mockup */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Icons.CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Double-Sided Business Card
              </span>
              
              <div 
                className="relative h-48 cursor-pointer group [perspective:1000px]"
                onClick={() => setIsCardFlipped(!isCardFlipped)}
              >
                <div className={`relative w-full h-full duration-700 [transform-style:preserve-3d] ${isCardFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                  
                  {/* Card Front Side */}
                  <div className={`absolute inset-0 w-full h-full rounded-2xl p-6 border shadow-md flex flex-col justify-between [backface-visibility:hidden] ${activeVibe.bgStyle} transition-all`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeColor.hex }}></div>
                        <span className={`text-[9px] uppercase tracking-widest font-black ${activeVibe.fontClass}`}>
                          {brandName.split(' ')[0]}
                        </span>
                      </div>
                      <Icons.Cpu className="w-4 h-4 text-slate-300" />
                    </div>

                    <div className="space-y-1">
                      <h4 className={`text-xl font-bold leading-tight tracking-tight ${activeVibe.headerFont}`} style={{ color: activeVibeId !== 'cyberpunk' && activeVibeId !== 'retro' ? activeColor.hex : undefined }}>
                        {brandName}
                      </h4>
                      <p className={`text-[10px] opacity-75 font-medium tracking-wide ${activeVibe.bodyFont}`}>
                        {brandSlogan}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-slate-400 uppercase tracking-widest font-bold">
                      <span>Interactive Preview</span>
                      <span>Flip Card &rarr;</span>
                    </div>
                  </div>

                  {/* Card Back Side */}
                  <div className={`absolute inset-0 w-full h-full rounded-2xl p-6 border shadow-md flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] ${activeVibe.cardBackStyle} transition-all`}>
                    <div className="flex items-center gap-1.5 pb-2 border-b border-white/10">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest font-sans">
                        Founder & CEO
                      </span>
                    </div>

                    <div className="space-y-1.5 text-left font-sans">
                      <div className="text-[11px] font-bold text-slate-200">{brandName} Brand Lab</div>
                      <div className="flex items-center gap-1.5 text-[8px] text-slate-400">
                        <Icons.Mail className="w-3 h-3 text-slate-400" />
                        hello@{brandName.toLowerCase().replace(/\s+/g, '')}.com
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] text-slate-400">
                        <Icons.Globe className="w-3 h-3 text-slate-400" />
                        www.{brandName.toLowerCase().replace(/\s+/g, '')}.com
                      </div>
                    </div>

                    <div className="text-[8px] text-slate-500 uppercase tracking-wider text-right font-semibold">
                      Click to Flip
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Mobile Landing Page Hero Mockup */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Icons.MonitorDot className="w-3.5 h-3.5 text-slate-400" />
                Web Hero Banner Mockup
              </span>

              <div className={`h-48 rounded-2xl border p-5 shadow-md flex flex-col justify-between overflow-hidden relative ${activeVibe.bgStyle} transition-all`}>
                {/* Mock Browser Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  </div>
                  <span className="text-[8px] text-slate-400 px-10 py-0.5 bg-slate-100 rounded text-center truncate font-mono">
                    {brandName.toLowerCase().replace(/\s+/g, '')}.com
                  </span>
                  <Icons.Menu className="w-3 h-3 text-slate-400" />
                </div>

                {/* Hero Core Content */}
                <div className="text-center my-auto py-2 space-y-1.5">
                  <h5 className={`text-base font-black leading-tight tracking-tight ${activeVibe.headerFont}`} style={{ color: activeVibeId !== 'cyberpunk' && activeVibeId !== 'retro' ? activeColor.hex : undefined }}>
                    {brandName}
                  </h5>
                  <p className={`text-[9px] max-w-xs mx-auto text-slate-500 font-medium ${activeVibe.bodyFont}`}>
                    {brandSlogan}. Experience top tier services tailored for premium customer engagement.
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="flex justify-center gap-1.5 pt-2">
                  <button 
                    className="text-[8px] font-extrabold text-white px-3 py-1 rounded-lg uppercase tracking-wider"
                    style={{ backgroundColor: activeColor.hex }}
                  >
                    Learn More
                  </button>
                  <button className="text-[8px] font-extrabold bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded-lg uppercase tracking-wider">
                    Contact
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Instagram Post Feed Grid Mockup */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Icons.Instagram className="w-3.5 h-3.5 text-slate-400" />
              Instagram Feed Mockup (Aesthetic Synergy)
            </span>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
              
              {/* Tile 1: Brand Greeting */}
              <div className={`aspect-square rounded-xl p-3 border shadow-sm flex flex-col justify-between relative ${activeVibe.bgStyle}`}>
                <div className="flex justify-between items-center">
                  <Icons.Cpu className="w-3.5 h-3.5" style={{ color: activeColor.hex }} />
                  <span className="text-[7px] text-slate-400 font-black tracking-widest">POST 01</span>
                </div>
                <div className="text-center my-auto">
                  <div className={`text-[10px] font-extrabold uppercase leading-tight tracking-wide ${activeVibe.headerFont}`} style={{ color: activeColor.hex }}>
                    HELLO
                  </div>
                  <div className="text-[8px] font-black text-slate-800 tracking-tight leading-none uppercase">
                    {brandName.split(' ')[0]}
                  </div>
                </div>
                <div className="text-[6px] text-slate-400 text-center leading-none">
                  Aesthetic Reveal
                </div>
              </div>

              {/* Tile 2: Typography Quote */}
              <div className={`aspect-square rounded-xl p-3 border shadow-sm flex flex-col justify-between relative ${activeVibe.bgStyle}`}>
                <div className="flex justify-between items-center">
                  <Icons.Quote className="w-3.5 h-3.5" style={{ color: activeColor.hex }} />
                  <span className="text-[7px] text-slate-400 font-black tracking-widest">POST 02</span>
                </div>
                <div className="text-center my-auto px-1">
                  <p className={`text-[7px] italic text-slate-600 font-semibold leading-normal ${activeVibe.bodyFont}`}>
                    "Details make the design. Design makes the brand."
                  </p>
                </div>
                <div className="text-[6px] text-slate-400 text-center leading-none truncate">
                  @{brandName.toLowerCase().replace(/\s+/g, '')}
                </div>
              </div>

              {/* Tile 3: Colorway Palette Highlight */}
              <div className={`aspect-square rounded-xl p-3 border shadow-sm flex flex-col justify-between relative ${activeVibe.bgStyle}`}>
                <div className="flex justify-between items-center">
                  <Icons.Flame className="w-3.5 h-3.5" style={{ color: activeColor.hex }} />
                  <span className="text-[7px] text-slate-400 font-black tracking-widest">POST 03</span>
                </div>
                
                <div className="space-y-1.5 my-auto">
                  <div className="h-2 rounded bg-slate-200/50 flex overflow-hidden">
                    <span className="flex-1" style={{ backgroundColor: activeColor.hex }}></span>
                    <span className="flex-1 bg-slate-400/30"></span>
                    <span className="flex-1 bg-slate-100"></span>
                  </div>
                  <div className="text-[8px] font-extrabold text-slate-800 text-center leading-tight uppercase">
                    THE VISION
                  </div>
                </div>

                <div className="text-[6px] text-slate-400 text-center leading-none">
                  {activeColor.name} Theme
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
